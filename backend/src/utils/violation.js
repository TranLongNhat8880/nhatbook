const pool = require("../config/db");
const { emitToUser } = require("./socket");

/**
 * Xử lý khi một người dùng bị AI đánh giá vi phạm
 * @param {number} userId - ID người vi phạm
 * @param {string} reason - Lý do vi phạm từ AI
 */
async function handleViolation(userId, reason) {
  try {
    // 1. Tăng số lần vi phạm cho user
    const userRes = await pool.query(
      "UPDATE users SET violation_count = violation_count + 1 WHERE id = $1 RETURNING username, violation_count",
      [userId]
    );

    if (userRes.rows.length === 0) return;

    const { username, violation_count } = userRes.rows[0];

    // 2. Tạo thông báo cảnh cáo cho chính User đó
    const userNotifRes = await pool.query(
      "INSERT INTO notifications (user_id, type, reason) VALUES ($1, $2, $3) RETURNING *",
      [userId, 'VIOLATION_WARNING', reason]
    );

    emitToUser(userId, "NEW_NOTIFICATION", {
      ...userNotifRes.rows[0],
      reason: reason,
      message: "Tài khoản của bạn vừa bị cảnh cáo do vi phạm tiêu chuẩn nội dung."
    });

    // 3. Nếu đạt mốc 3 lần vi phạm, báo động cho toàn bộ ADMIN
    if (violation_count === 3) {
      const adminsRes = await pool.query("SELECT id FROM users WHERE role = 'ADMIN'");
      
      for (const admin of adminsRes.rows) {
        // actor_id ở đây là người vi phạm để Admin biết ai đang nghịch ngợm
        const adminNotifRes = await pool.query(
          "INSERT INTO notifications (user_id, actor_id, type, reason) VALUES ($1, $2, $3, $4) RETURNING *",
          [admin.id, userId, 'ADMIN_VIOLATION_ALERT', reason]
        );

        emitToUser(admin.id, "NEW_NOTIFICATION", {
          ...adminNotifRes.rows[0],
          actor_name: username,
          reason: reason,
          message: `Người dùng @${username} đã vi phạm 3 lần. Cần xử lý!`
        });
      }
    }
  } catch (err) {
    console.error("Lỗi trong handleViolation:", err);
  }
}

module.exports = { handleViolation };
