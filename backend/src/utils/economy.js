const pool = require("../config/db");

/**
 * Lấy ngày hiện tại theo múi giờ Asia/Ho_Chi_Minh (YYYY-MM-DD)
 */
const getTodayVN = () => {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}))
    .toISOString()
    .split('T')[0];
};

/**
 * Cộng NhatCoin cho người dùng có kiểm tra giới hạn hàng ngày
 * @param {string} userId - ID người dùng
 * @param {number} amount - Số xu muốn cộng
 * @param {string} type - 'post' hoặc 'interaction'
 * @param {number} limit - Tối đa xu loại này mỗi ngày (150 cho post, 25 cho interaction)
 * @param {string} transactionType - Loại giao dịch để lưu log
 * @param {string} description - Mô tả giao dịch
 */
const awardNC = async (userId, amount, type, limit, transactionType, description) => {
  const today = getTodayVN();
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    // 1. Kiểm tra trạng thái giới hạn hàng ngày của User
    const userRes = await client.query(
      "SELECT last_activity_date, daily_post_nc, daily_interaction_nc FROM users WHERE id = $1 FOR UPDATE",
      [userId]
    );

    if (userRes.rows.length === 0) throw new Error("User not found");
    const user = userRes.rows[0];

    let currentDailyPost = user.daily_post_nc;
    let currentDailyInteraction = user.daily_interaction_nc;
    
    // Nếu là ngày mới, reset các mốc giới hạn
    if (!user.last_activity_date || user.last_activity_date.toISOString().split('T')[0] !== today) {
      currentDailyPost = 0;
      currentDailyInteraction = 0;
    }

    // 2. Kiểm tra xem đã đạt giới hạn chưa
    let earnedToday = (type === 'post') ? currentDailyPost : currentDailyInteraction;
    
    if (earnedToday >= limit) {
      await client.query("COMMIT");
      return { success: false, reason: "limit_reached" };
    }

    // Tính toán số xu thực tế có thể nhận (không vượt quá limit)
    const actualAward = Math.min(amount, limit - earnedToday);

    // 3. Cập nhật số dư và mốc giới hạn
    const updateField = (type === 'post') ? 'daily_post_nc' : 'daily_interaction_nc';
    await client.query(
      `UPDATE users 
       SET balance = balance + $1, 
           last_activity_date = $2, 
           ${updateField} = ${updateField} + $1 
       WHERE id = $3`,
      [actualAward, today, userId]
    );

    // -- KÍCH HOẠT TÍNH NĂNG LEO TOP (RANK_UP NOTIFICATION) --
    try {
      // 0. Bỏ qua nếu user hiện tại là ADMIN
      const roleCheck = await client.query("SELECT role FROM users WHERE id = $1", [userId]);
      if (roleCheck.rows.length > 0 && roleCheck.rows[0].role !== 'ADMIN') {
        
        // 1. Kiểm tra hạng xếp hạng hiện tại của User (Bỏ qua ADMIN trong BXH)
        const rankQuery = await client.query(
          `WITH RankedUsers AS (
             SELECT id, balance, RANK() OVER (ORDER BY balance DESC) as current_rank
             FROM users
             WHERE role != 'ADMIN'
           )
           SELECT current_rank FROM RankedUsers WHERE id = $1`,
          [userId]
        );
        
        if (rankQuery.rows.length > 0) {
          const currentRank = parseInt(rankQuery.rows[0].current_rank);
          
          if (currentRank <= 3) {
            // 2. Lấy kỷ lục xếp hạng lịch sử
            const userHighestQuery = await client.query(
              "SELECT highest_rank_achieved FROM users WHERE id = $1", [userId]
            );
            const highestAchieved = userHighestQuery.rows[0].highest_rank_achieved != null 
                  ? parseInt(userHighestQuery.rows[0].highest_rank_achieved) 
                  : 9999;
            
            // 3. Nếu phá kỷ lục (thăng top cao hơn kỷ lục cũ)
            if (currentRank < highestAchieved) {
              const { emitToUser } = require("./socket");
              // Cập nhật kỷ lục mới
              await client.query("UPDATE users SET highest_rank_achieved = $1 WHERE id = $2", [currentRank, userId]);
              // Rung chuông thông báo
              const notifRes = await client.query(
                "INSERT INTO notifications (user_id, type) VALUES ($1, $2) RETURNING *",
                [userId, 'RANK_UP']
              );
              emitToUser(userId, "NEW_NOTIFICATION", notifRes.rows[0]);
            }
          }
        }
      }
    } catch (rankErr) { console.error("Lỗi tính năng LEO TOP:", rankErr); }

    // 4. Lưu lại lịch sử giao dịch
    await client.query(
      "INSERT INTO nhatcoin_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)",
      [userId, actualAward, transactionType, description]
    );

    // 5. Thông báo nhận NhatCoin
    try {
      const { emitToUser } = require("./socket");
      const notifRes = await client.query(
        "INSERT INTO notifications (user_id, type, nhatcoin_amount) VALUES ($1, $2, $3) RETURNING *",
        [userId, 'NHATCOIN_RECEIVE', actualAward]
      );
      emitToUser(userId, "NEW_NOTIFICATION", { 
        ...notifRes.rows[0], 
        message: `Bạn vừa nhận được +${actualAward} NhatCoin: ${description}` 
      });
    } catch (notifErr) { console.error("Lỗi thông báo awardNC:", notifErr); }

    await client.query("COMMIT");
    return { success: true, amount: actualAward };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Lỗi awardNC:", err);
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Trừ NhatCoin của người dùng (không có giới hạn, cho phép trừ đến 0)
 */
const deductNC = async (userId, amount, transactionType, description) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Thực hiện trừ xu (Cho phép số dư âm)
    const updateRes = await client.query(
      "UPDATE users SET balance = balance - $1 WHERE id = $2 RETURNING balance",
      [amount, userId]
    );

    const newBalance = Number(updateRes.rows[0].balance);

    // 2. Lưu lịch sử giao dịch
    await client.query(
      "INSERT INTO nhatcoin_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)",
      [userId, -amount, transactionType, description]
    );

    // 2.1. Thông báo trừ NhatCoin
    try {
      const { emitToUser } = require("./socket");
      const notifRes = await client.query(
        "INSERT INTO notifications (user_id, type, nhatcoin_amount) VALUES ($1, $2, $3) RETURNING *",
        [userId, 'NHATCOIN_DEDUCT', amount]
      );
      emitToUser(userId, "NEW_NOTIFICATION", { 
        ...notifRes.rows[0], 
        message: `Tài khoản bị trừ -${amount} NhatCoin: ${description}`
      });
    } catch (notifErr) { console.error("Lỗi thông báo deductNC:", notifErr); }

    // 3. KIỂM TRA GIỚI HẠN NỢ (-700 NC)
    if (newBalance < -700) {
      // Bảo mật: Không tự động khóa tài khoản ADMIN
      const userRes = await client.query("SELECT role FROM users WHERE id = $1", [userId]);
      if (userRes.rows[0].role !== 'ADMIN') {
        await client.query("UPDATE users SET is_locked = true WHERE id = $1", [userId]);
      }
    }

    await client.query("COMMIT");
    return { success: true, newBalance, isLocked: newBalance < -700 };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Lỗi deductNC:", err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { awardNC, deductNC };
