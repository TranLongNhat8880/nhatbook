const pool = require("../config/db");

/**
 * UC_03: Xem hồ sơ cá nhân
 * GET /api/users/me
 */
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, role, avatar_url, facebook_url, instagram_url, threads_url, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    return res.status(200).json({ user: result.rows[0] });
  } catch (err) {
    console.error("Lỗi getMe:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * UC_03: Cập nhật hồ sơ cá nhân
 * PUT /api/users/me
 */
const updateMe = async (req, res) => {
  const { username, facebook_url, instagram_url, threads_url } = req.body;
  console.log("Dữ liệu cập nhật nhận được:", req.body);
  console.log("User ID thực hiện:", req.user.id);

  if (!username || username.trim() === "") {
    return res.status(400).json({ message: "Username không được để trống" });
  }

  try {
    const result = await pool.query(
      `UPDATE users 
       SET 
          username = $1,
          facebook_url = $2,
          instagram_url = $3,
          threads_url = $4
       WHERE id = $5
       RETURNING id, username, email, role, avatar_url, facebook_url, instagram_url, threads_url, created_at`,
      [username.trim(), facebook_url || null, instagram_url || null, threads_url || null, req.user.id]
    );

    console.log("Số dòng đã cập nhật:", result.rowCount);

    return res.status(200).json({
      message: "Cập nhật hồ sơ thành công",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Lỗi updateMe:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * PUT /api/users/avatar
 */
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Không tìm thấy file ảnh" });
    }

    const imageUrl = req.file.path; // Multer-storage-cloudinary trả URL về biến này

    const result = await pool.query(
      `UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, username, email, role, avatar_url, facebook_url, instagram_url, threads_url, created_at`,
      [imageUrl, req.user.id]
    );

    return res.status(200).json({
      message: "Cập nhật avatar thành công",
      user: result.rows[0],
      avatar_url: imageUrl
    });
  } catch (err) {
    console.error("Lỗi uploadAvatar:", err);
    return res.status(500).json({ message: "Lỗi upload ảnh" });
  }
};

/**
 * PUBLIC API
 * GET /api/users/admin
 * Lấy thông tin Tác giả (Admin)
 */
const getAdminProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, role, avatar_url, facebook_url, instagram_url, threads_url, created_at 
       FROM users 
       WHERE role = 'ADMIN' 
       ORDER BY created_at DESC 
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Chưa có Admin nào" });
    }

    return res.status(200).json({ admin: result.rows[0] });
  } catch (err) {
    console.error("Lỗi getAdminProfile:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

module.exports = { getMe, updateMe, uploadAvatar, getAdminProfile };
