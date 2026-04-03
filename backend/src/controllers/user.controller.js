const pool = require("../config/db");

/**
 * UC_03: Xem hồ sơ cá nhân
 * GET /api/users/me
 */
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, role, avatar_url, bio, facebook_url, instagram_url, threads_url, balance, last_checkin, violation_count, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    const user = result.rows[0];

    // Lấy thống kê: số bài viết và tổng lượt thích
    const statsRes = await pool.query(
      `SELECT 
         (SELECT COUNT(*) FROM posts WHERE author_id = $1) as post_count,
         (SELECT COUNT(*) FROM post_likes pl JOIN posts p ON pl.post_id = p.id WHERE p.author_id = $1) as total_likes`,
      [req.user.id]
    );

    user.post_count = parseInt(statsRes.rows[0].post_count) || 0;
    user.total_likes = parseInt(statsRes.rows[0].total_likes) || 0;

    // Lấy danh sách vật phẩm đang sử dụng
    const inventoryRes = await pool.query(
      "SELECT item_id, item_type FROM user_inventory WHERE user_id = $1 AND is_equipped = true",
      [req.user.id]
    );
    user.equipped_items = inventoryRes.rows;

    return res.status(200).json({ user });
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
  const { username, bio, facebook_url, instagram_url, threads_url } = req.body;
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
          bio = $2,
          facebook_url = $3,
          instagram_url = $4,
          threads_url = $5
       WHERE id = $6
       RETURNING id, username, email, role, avatar_url, bio, facebook_url, instagram_url, threads_url, created_at`,
      [username.trim(), bio || null, facebook_url || null, instagram_url || null, threads_url || null, req.user.id]
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

/**
 * Cấp hoặc thu hồi quyền ADMIN
 * PUT /api/users/grant-role
 */
const grantRole = async (req, res) => {
  const { email, newRole } = req.body;

  if (!email || !newRole) {
    return res.status(400).json({ message: "Thiếu email hoặc quyền mới" });
  }

  // Bảo mật: Chỉ cho phép cấp quyền MEMBER hoặc USER qua API này
  if (newRole !== "MEMBER" && newRole !== "USER") {
    return res.status(400).json({ message: "Quyền không hợp lệ. Chỉ có thể cấp quyền MEMBER hoặc USER." });
  }

  try {
    // Không cho phép tự đổi quyền của chính mình (để tránh mất quyền root admin)
    if (email === req.user.email) {
      return res.status(400).json({ message: "Bạn không thể tự thay đổi quyền của chính mình" });
    }

    const result = await pool.query(
      "UPDATE users SET role = $1 WHERE email = $2 RETURNING id, username, email, role",
      [newRole, email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản với email này" });
    }

    return res.status(200).json({
      message: `Đã cập nhật quyền thành công cho ${result.rows[0].username}!`,
      user: result.rows[0]
    });
  } catch (err) {
    console.error("Lỗi grantRole:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * Kiểm tra xem Email có tồn tại trong hệ thống không
 * GET /api/users/check-email?email=xxx
 */
const checkEmail = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: "Vui lòng cung cấp email" });

  try {
    const result = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (result.rows.length > 0) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (err) {
    console.error("Lỗi checkEmail:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * Lấy danh sách tất cả người dùng (Chỉ ADMIN)
 * GET /api/users?page=1&limit=5&search=...
 */
const getAllUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const search = req.query.search || "";
  const filter = req.query.filter || "all";
  const offset = (page - 1) * limit;

  try {
    const searchQuery = `%${search}%`;
    let whereClause = "(username ILIKE $1 OR email ILIKE $1)";
    let queryParams = [searchQuery];

    // Xử lý bộ lọc chuyên biệt
    if (filter === "violation") {
      whereClause += " AND violation_count >= 3 AND is_locked = false";
    } else if (filter === "locked") {
      whereClause += " AND is_locked = true";
    }

    // 2. Lấy dữ liệu phân trang: Ưu tiên ADMIN, sau đó theo ngày tạo mới nhất
    const usersRes = await pool.query(
      `SELECT id, username, email, role, avatar_url, is_verified, is_locked, violation_count, created_at 
       FROM users 
       WHERE ${whereClause}
       ORDER BY (CASE WHEN role = 'ADMIN' THEN 0 ELSE 1 END) ASC, created_at DESC
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      [...queryParams, limit, offset]
    );

    // 3. Đếm tổng số user để tính phân trang theo bộ lọc
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM users WHERE ${whereClause}`,
      queryParams
    );

    const totalUsers = parseInt(countRes.rows[0].count);
    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(200).json({ 
      users: usersRes.rows,
      totalPages,
      currentPage: page,
      totalUsers
    });
  } catch (err) {
    console.error("Lỗi getAllUsers:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * Khóa/Mở khóa tài khoản (Chỉ ADMIN)
 * PUT /api/users/:id/toggle-lock
 */
const toggleLockUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Không cho phép tự khóa chính mình
    if (id === req.user.id) {
      return res.status(400).json({ message: "Bạn không thể tự khóa tài khoản của chính mình" });
    }

    // Kiểm tra user có tồn tại không
    const userResult = await pool.query("SELECT id, is_locked, username, role FROM users WHERE id = $1", [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const { is_locked: currentStatus, username, role } = userResult.rows[0];

    // Bảo mật: Không ai có quyền khóa tài khoản ADMIN (Kể cả Admin khác)
    if (role === 'ADMIN') {
      return res.status(403).json({ message: " Không thể khóa tài khoản của Quản trị viên (ADMIN)!" });
    }

    const newStatus = !currentStatus;

    await pool.query("UPDATE users SET is_locked = $1 WHERE id = $2", [newStatus, id]);

    return res.status(200).json({
      message: `${newStatus ? 'Đã khóa' : 'Đã mở khóa'} tài khoản của ${userResult.rows[0].username}`,
      is_locked: newStatus
    });
  } catch (err) {
    console.error("Lỗi toggleLockUser:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * Lấy thông tin ví NhatCoin
 * GET /api/users/wallet
 */
const getWallet = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT balance, last_checkin, daily_post_nc, daily_interaction_nc, last_activity_date FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: "User not found" });

    const wallet = result.rows[0];

    // Kiểm tra xem có phải ngày mới không (GMT+7) để hiển thị trạng thái điểm danh
    const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const todayStr = nowVN.toISOString().split('T')[0];

    let canCheckin = true;
    if (wallet.last_checkin) {
      const lastCheckinVN = new Date(new Date(wallet.last_checkin).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
      if (lastCheckinVN.toISOString().split('T')[0] === todayStr) {
        canCheckin = false;
      }
    }

    return res.status(200).json({
      balance: wallet.balance,
      canCheckin,
      dailyLimits: {
        post: wallet.daily_post_nc,
        interaction: wallet.daily_interaction_nc
      }
    });
  } catch (err) {
    console.error("Lỗi getWallet:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * Logic Điểm danh hàng ngày
 * POST /api/users/checkin
 */
const dailyCheckin = async (req, res) => {
  const userId = req.user.id;
  try {
    const userRes = await pool.query("SELECT last_checkin, created_at, balance FROM users WHERE id = $1", [userId]);
    const user = userRes.rows[0];

    const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const todayStr = nowVN.toISOString().split('T')[0];
    const day = nowVN.getDate();
    const month = nowVN.getMonth() + 1;

    // 1. Kiểm tra xem hôm nay đã điểm danh chưa
    if (user.last_checkin) {
      const lastCheckinVN = new Date(new Date(user.last_checkin).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
      if (lastCheckinVN.toISOString().split('T')[0] === todayStr) {
        return res.status(400).json({ message: "Hôm nay bạn đã điểm danh rồi!" });
      }
    }

    // 2. Tính toán phần thưởng
    let reward = 10; // Mặc định
    let type = "checkin";
    let note = "Điểm danh hàng ngày";

    // Ngày Vàng (Ngày 17 hàng tháng) -> x3
    if (day === 17) {
      reward = 30;
      note = "Ngày vàng hàng tháng (Ngày 17) - x3 phần thưởng!";
    }

    // Siêu bão Sinh nhật Admin (17/01)
    if (day === 17 && month === 1) {
      // Kiểm tra tuổi tài khoản > 30 ngày
      const accountAgeInDays = (nowVN.getTime() - new Date(user.created_at).getTime()) / (1000 * 3600 * 24);
      if (accountAgeInDays >= 30) {
        reward = 1701;
        note = "Chúc mừng Sinh nhật Admin! Siêu bão 1701 NC đổ bộ!";
      }
    }

    // 3. Thực hiện cộng xu & Lưu lịch sử
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        "UPDATE users SET balance = balance + $1, last_checkin = CURRENT_TIMESTAMP WHERE id = $2",
        [reward, userId]
      );

      await client.query(
        "INSERT INTO nhatcoin_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)",
        [userId, reward, type, note]
      );

      await client.query("COMMIT");

      return res.status(200).json({
        message: "Điểm danh thành công!",
        reward,
        note,
        newBalance: Number(user.balance) + reward
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Lỗi dailyCheckin:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * Lấy danh sách Top 5 đại gia NC
 * GET /api/users/leaderboard
 */
const getLeaderboard = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.avatar_url, u.balance, u.role, 
              COUNT(p.id) as post_count
       FROM users u
       LEFT JOIN posts p ON p.author_id = u.id AND p.created_at >= date_trunc('month', CURRENT_DATE)
       WHERE u.role != 'ADMIN' 
       GROUP BY u.id
       ORDER BY u.balance DESC 
       LIMIT 10`
    );

    const leaderboard = result.rows;

    // Lấy thêm vật phẩm trang bị cho mỗi người trong top
    for (let user of leaderboard) {
      const equipRes = await pool.query(
        "SELECT item_id, item_type FROM user_inventory WHERE user_id = $1 AND is_equipped = true",
        [user.id]
      );
      user.equipped_items = equipRes.rows;
    }

    // Lấy số liệu thống kê thực tế
    const totalUsersRes = await pool.query("SELECT COUNT(*) FROM users");
    const monthlyPostsRes = await pool.query(
      "SELECT COUNT(*) FROM posts WHERE created_at >= date_trunc('month', CURRENT_DATE)"
    );

    return res.status(200).json({
      leaderboard,
      stats: {
        totalMembers: parseInt(totalUsersRes.rows[0].count),
        monthlyPosts: parseInt(monthlyPostsRes.rows[0].count)
      }
    });
  } catch (err) {
    console.error("Lỗi getLeaderboard:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * Lấy thông tin public profile của một User
 * GET /api/users/p/:id
 */
const getPublicProfile = async (req, res) => {
  const { id } = req.params;
  try {
    // Lấy thông tin cơ bản
    const userResult = await pool.query(
      `SELECT id, username, role, avatar_url, bio, facebook_url, instagram_url, threads_url, balance, created_at 
       FROM users WHERE id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const user = userResult.rows[0];

    // Lấy thống kê
    const statsRes = await pool.query(
      `SELECT 
         (SELECT COUNT(*) FROM posts WHERE author_id = $1) as post_count,
         (SELECT COUNT(*) FROM post_likes pl JOIN posts p ON pl.post_id = p.id WHERE p.author_id = $1) as total_likes`,
      [id]
    );

    user.post_count = parseInt(statsRes.rows[0].post_count) || 0;
    user.total_likes = parseInt(statsRes.rows[0].total_likes) || 0;

    // Lấy danh sách vật phẩm đang sử dụng
    const inventoryRes = await pool.query(
      "SELECT item_id, item_type FROM user_inventory WHERE user_id = $1 AND is_equipped = true",
      [id]
    );
    user.equipped_items = inventoryRes.rows;

    // Lấy bài viết của user
    const postsResult = await pool.query(
      `SELECT p.id, p.title, p.content, p.category, p.created_at, p.updated_at,
              COUNT(DISTINCT c.id) AS comment_count,
              COUNT(DISTINCT l.user_id) AS like_count
       FROM posts p
       LEFT JOIN comments c ON c.post_id = p.id
       LEFT JOIN post_likes l ON l.post_id = p.id
       WHERE p.author_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [id]
    );

    return res.status(200).json({
      user,
      posts: postsResult.rows
    });
  } catch (err) {
    console.error("Lỗi getPublicProfile:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

module.exports = {
  getMe,
  updateMe,
  uploadAvatar,
  getAdminProfile,
  grantRole,
  checkEmail,
  getAllUsers,
  toggleLockUser,
  getWallet,
  dailyCheckin,
  getLeaderboard,
  getPublicProfile
};
