const pool = require("../config/db");
const { emitToUser } = require("../utils/socket");

/**
 * Gửi hoặc Hủy lời mời kết bạn
 */
const toggleFriendRequest = async (req, res) => {
  const requesterId = req.user.id;
  const { targetId } = req.body;

  if (requesterId === targetId) {
    return res.status(400).json({ message: "Bạn không thể kết bạn với chính mình" });
  }

  try {
    // 1. Kiểm tra trạng thái hiện tại
    const existing = await pool.query(
      "SELECT * FROM friendships WHERE (requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1)",
      [requesterId, targetId]
    );

    if (existing.rows.length > 0) {
      const friendship = existing.rows[0];
      
      // Nếu đang PENDING và mình là người gửi -> Có thể HỦY
      if (friendship.status === 'PENDING' && friendship.requester_id === requesterId) {
        await pool.query("DELETE FROM friendships WHERE id = $1", [friendship.id]);
        return res.status(200).json({ status: 'NONE', message: "Đã hủy lời mời" });
      }
      
      // Nếu đã là ACCEPTED -> Có thể HỦY KẾT BẠN
      if (friendship.status === 'ACCEPTED') {
        await pool.query("DELETE FROM friendships WHERE id = $1", [friendship.id]);
        return res.status(200).json({ status: 'NONE', message: "Đã hủy kết bạn" });
      }

      return res.status(400).json({ message: "Thao tác không hợp lệ" });
    }

    // 2. Tạo lời mời mới
    const result = await pool.query(
      "INSERT INTO friendships (requester_id, addressee_id, status) VALUES ($1, $2, 'PENDING') RETURNING *",
      [requesterId, targetId]
    );

    // 3. Bắn thông báo & Lưu DB
    const sender = await pool.query("SELECT id, username, avatar_url FROM users WHERE id = $1", [requesterId]);
    const { rows: [notif] } = await pool.query(
      "INSERT INTO notifications (user_id, actor_id, type) VALUES ($1, $2, 'FRIEND_REQUEST') RETURNING id, created_at",
      [targetId, requesterId]
    );

    emitToUser(targetId, "NEW_NOTIFICATION", {
      id: notif.id,
      type: 'FRIEND_REQUEST',
      actor_id: requesterId,
      actor_name: sender.rows[0].username,
      actor_avatar: sender.rows[0].avatar_url,
      created_at: notif.created_at
    });

    return res.status(201).json({ status: 'PENDING', message: "Đã gửi lời mời kết bạn" });
  } catch (err) {
    console.error("Lỗi toggleFriendRequest:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * Chấp nhận hoặc Từ chối lời mời
 */
const respondToRequest = async (req, res) => {
  const addresseeId = req.user.id;
  const { requesterId, action } = req.body; // action: 'ACCEPT' or 'REJECT'

  try {
    if (action === 'ACCEPT') {
      const result = await pool.query(
        "UPDATE friendships SET status = 'ACCEPTED' WHERE requester_id = $1 AND addressee_id = $2 AND status = 'PENDING' RETURNING *",
        [requesterId, addresseeId]
      );

      if (result.rows.length > 0) {
        // Thông báo cho người gửi là đã được chấp nhận
        const me = await pool.query("SELECT id, username, avatar_url FROM users WHERE id = $1", [addresseeId]);
        const { rows: [notif] } = await pool.query(
          "INSERT INTO notifications (user_id, actor_id, type) VALUES ($1, $2, 'FRIEND_ACCEPT') RETURNING id, created_at",
          [requesterId, addresseeId]
        );

        emitToUser(requesterId, "NEW_NOTIFICATION", {
          id: notif.id,
          type: 'FRIEND_ACCEPT',
          actor_id: addresseeId,
          actor_name: me.rows[0].username,
          actor_avatar: me.rows[0].avatar_url,
          created_at: notif.created_at
        });
        return res.status(200).json({ message: "Đã trở thành bạn bè" });
      }
    } else {
      await pool.query(
        "DELETE FROM friendships WHERE requester_id = $1 AND addressee_id = $2 AND status = 'PENDING'",
        [requesterId, addresseeId]
      );
      return res.status(200).json({ message: "Đã từ chối lời mời" });
    }
    
    return res.status(400).json({ message: "Không tìm thấy lời mời phù hợp" });
  } catch (err) {
    console.error("Lỗi respondToRequest:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * Lấy trạng thái bạn bè hiện tại (cho trang Profile)
 */
const getFriendshipStatus = async (req, res) => {
  const userId = req.user.id;
  const { targetId } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM friendships WHERE (requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1)",
      [userId, targetId]
    );

    if (result.rows.length === 0) return res.status(200).json({ status: 'NONE' });

    const f = result.rows[0];
    if (f.status === 'ACCEPTED') return res.status(200).json({ status: 'ACCEPTED' });
    
    // Nếu đang PENDING, trả về thêm thông tin ai là người gửi
    return res.status(200).json({ 
      status: 'PENDING', 
      isRequester: f.requester_id === userId 
    });
  } catch (err) {
    console.error("Lỗi getFriendshipStatus:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * Lấy danh sách bạn bè
 */
const getFriendsList = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.avatar_url, u.role
       FROM users u
       JOIN friendships f ON (f.requester_id = u.id OR f.addressee_id = u.id)
       WHERE (f.requester_id = $1 OR f.addressee_id = $1)
         AND f.status = 'ACCEPTED'
         AND u.id != $1`,
      [userId]
    );
    return res.status(200).json({ friends: result.rows });
  } catch (err) {
    console.error("Lỗi getFriendsList:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * Lấy các lời mời đang chờ xử lý
 */
const getPendingRequests = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.avatar_url, f.created_at
       FROM users u
       JOIN friendships f ON f.requester_id = u.id
       WHERE f.addressee_id = $1 AND f.status = 'PENDING'`,
      [userId]
    );
    return res.status(200).json({ requests: result.rows });
  } catch (err) {
    console.error("Lỗi getPendingRequests:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

module.exports = {
  toggleFriendRequest,
  respondToRequest,
  getFriendshipStatus,
  getFriendsList,
  getPendingRequests
};
