const pool = require("../config/db");

/**
 * Lấy danh sách hội thoại (Inbox)
 */
const getConversations = async (req, res) => {
  const userId = req.user.id;
  try {
    // Truy vấn lấy danh sách những người đã nhắn tin, tin nhắn cuối và số tin chưa đọc
    const result = await pool.query(
      `WITH LastMessages AS (
        SELECT DISTINCT ON (
          CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END
        )
        id, sender_id, receiver_id, content, created_at, is_read,
        CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as other_user_id
        FROM messages
        WHERE sender_id = $1 OR receiver_id = $1
        ORDER BY CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END, created_at DESC
      ),
      UnreadCounts AS (
        SELECT sender_id, COUNT(*) as unread_count
        FROM messages
        WHERE receiver_id = $1 AND is_read = false
        GROUP BY sender_id
      )
      SELECT 
        lm.*, 
        u.username as other_username, 
        u.avatar_url as other_avatar,
        COALESCE(uc.unread_count, 0) as unread_count
      FROM LastMessages lm
      JOIN users u ON lm.other_user_id = u.id
      LEFT JOIN UnreadCounts uc ON lm.other_user_id = uc.sender_id
      ORDER BY lm.created_at DESC`,
      [userId]
    );

    return res.status(200).json({ conversations: result.rows });
  } catch (err) {
    console.error("Lỗi getConversations:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * Lấy lịch sử chat giữa 2 người
 */
const getChatHistory = async (req, res) => {
  const userId = req.user.id;
  const { otherUserId } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM messages 
       WHERE (sender_id = $1 AND receiver_id = $2) 
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [userId, otherUserId]
    );

    return res.status(200).json({ messages: result.rows });
  } catch (err) {
    console.error("Lỗi getChatHistory:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * Đánh dấu đã đọc hội thoại
 */
const markAsRead = async (req, res) => {
  const userId = req.user.id;
  const { senderId } = req.body;
  try {
    await pool.query(
      "UPDATE messages SET is_read = true WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false",
      [userId, senderId]
    );
    return res.status(200).json({ message: "Đã đánh dấu đã đọc" });
  } catch (err) {
    console.error("Lỗi markAsRead:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * Tìm kiếm người dùng để bắt đầu chat mới
 */
const searchUsersForChat = async (req, res) => {
  const { query } = req.query;
  const userId = req.user.id;
  if (!query || query.length < 2) return res.status(200).json({ users: [] });

  try {
    const result = await pool.query(
      "SELECT id, username, avatar_url FROM users WHERE username ILIKE $1 AND id != $2 LIMIT 10",
      [`%${query}%`, userId]
    );
    return res.status(200).json({ users: result.rows });
  } catch (err) {
    console.error("Lỗi searchUsersForChat:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

module.exports = {
  getConversations,
  getChatHistory,
  markAsRead,
  searchUsersForChat
};
