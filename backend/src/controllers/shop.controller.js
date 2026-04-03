const pool = require("../config/db");
const { deductNC } = require("../utils/economy");

/**
 * Mua vật phẩm từ Shop
 * POST /api/shop/buy
 */
const buyItem = async (req, res) => {
  const { itemId } = req.body;
  const userId = req.user.id;

  const shopItems = {
    'member_upgrade': { name: 'Thẻ nâng cấp MEMBER', price: 350, type: 'upgrade' },
    'neon_frame': { name: 'Khung Avatar Neon', price: 500, type: 'avatar_frame' },
    'diamond_frame': { name: 'Khung Kim cương', price: 1000, type: 'avatar_frame' },
    'gold_comment': { name: 'Gói Chữ Vàng', price: 200, type: 'comment_style' },
  };

  const item = shopItems[itemId];
  if (!item) {
    return res.status(400).json({ message: "Vật phẩm không tồn tại" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lấy thông tin role hiện tại bằng FOR UPDATE để khóa row tạm thời
    const userRes = await client.query("SELECT role FROM users WHERE id = $1 FOR UPDATE", [userId]);
    if (userRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }
    const user = userRes.rows[0];

    // Chặn mua MEMBER nếu đã là MEMBER/ADMIN
    if (itemId === 'member_upgrade' && (user.role === 'MEMBER' || user.role === 'ADMIN')) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Tài khoản của bạn đã có cấp bậc này rồi!" });
    }

    // Trừ xu một cách nguyên tử (Atomic Update) - đảm bảo balance >= price
    const updateRes = await client.query(
      "UPDATE users SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING balance, role",
      [item.price, userId]
    );

    if (updateRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Bạn không đủ NhatCoin để mua vật phẩm này" });
    }

    // Lưu giao dịch
    await client.query(
      "INSERT INTO nhatcoin_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)",
      [userId, -item.price, 'purchase', `Mua vật phẩm: ${item.name}`]
    );

    // Lưu vào kho đồ (Inventory)
    await client.query(
      "INSERT INTO user_inventory (user_id, item_id, item_type) VALUES ($1, $2, $3) ON CONFLICT (user_id, item_id) DO NOTHING",
      [userId, itemId, item.type]
    );

    // Logic nâng cấp Role đặc biệt
    let newRole = user.role;
    if (itemId === 'member_upgrade') {
      await client.query("UPDATE users SET role = 'MEMBER' WHERE id = $1", [userId]);
      newRole = 'MEMBER';
    }

    await client.query("COMMIT");

    return res.status(200).json({ 
      message: `Chúc mừng! Bạn đã sở hữu ${item.name}`,
      newRole: newRole
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Lỗi buyItem:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  } finally {
    client.release();
  }
};

/**
 * Sử dụng / Tháo vật phẩm (Equip)
 * PUT /api/shop/equip
 */
const toggleEquip = async (req, res) => {
  const { itemId } = req.body;
  const userId = req.user.id;

  try {
    // 1. Kiểm tra xem user có sở hữu vật phẩm không
    const check = await pool.query(
      "SELECT is_equipped, item_type FROM user_inventory WHERE user_id = $1 AND item_id = $2", 
      [userId, itemId]
    );

    if (check.rows.length === 0) {
      return res.status(400).json({ message: "Bạn chưa sở hữu vật phẩm này!" });
    }

    const { is_equipped, item_type } = check.rows[0];
    const newStatus = !is_equipped;

    // 2. Logic: Nếu là mặc khung Avatar, phải tháo các khung khác cùng loại
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (newStatus && item_type === 'avatar_frame') {
        await client.query(
          "UPDATE user_inventory SET is_equipped = false WHERE user_id = $1 AND item_type = 'avatar_frame'",
          [userId]
        );
      }

      // 3. Cập nhật trạng thái item hiện tại
      await client.query(
        "UPDATE user_inventory SET is_equipped = $1 WHERE user_id = $2 AND item_id = $3",
        [newStatus, userId, itemId]
      );

      await client.query("COMMIT");
      return res.status(200).json({ 
        message: newStatus ? "Đã sử dụng vật phẩm" : "Đã tháo vật phẩm", 
        is_equipped: newStatus 
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Lỗi toggleEquip:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * Lấy kho đồ của User
 * GET /api/shop/inventory
 */
const getInventory = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT item_id, item_type, is_equipped, purchased_at FROM user_inventory WHERE user_id = $1",
      [req.user.id]
    );
    return res.status(200).json({ inventory: result.rows });
  } catch (err) {
    console.error("Lỗi getInventory:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

module.exports = { buyItem, getInventory, toggleEquip };
