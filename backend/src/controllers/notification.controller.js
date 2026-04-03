const pool = require("../config/db");

/**
 * Lấy danh sách thông báo của người dùng hiện tại
 * Kèm tổng số lượng thông báo chưa đọc.
 * GET /api/notifications
 */
const getNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    // Lấy 20 thông báo mới nhất
    const logsRes = await pool.query(
      `SELECT n.id, n.type, n.post_id, n.comment_id, n.reason, n.is_read, n.created_at,
              u.id AS actor_id, u.username AS actor_name, u.avatar_url AS actor_avatar
       FROM notifications n
       LEFT JOIN users u ON n.actor_id = u.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 20`,
      [userId]
    );

    // Đếm số lượng chưa đọc
    const countRes = await pool.query(
      `SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    return res.status(200).json({
      notifications: logsRes.rows,
      unread_count: parseInt(countRes.rows[0].unread_count) || 0,
    });
  } catch (err) {
    console.error("Lỗi getNotifications:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * Đánh dấu đã đọc một hoặc toàn bộ thông báo
 * PUT /api/notifications/read
 * @body { id?: string } - Nếu không có id, đánh dấu toàn bộ là đã đọc
 */
const markAsRead = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.body;

  try {
    if (id) {
      await pool.query(
        "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2",
        [id, userId]
      );
    } else {
      await pool.query(
        "UPDATE notifications SET is_read = true WHERE user_id = $1",
        [userId]
      );
    }
    return res.status(200).json({ message: "Đã cập nhật trạng thái" });
  } catch (err) {
    console.error("Lỗi markAsRead:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
};
