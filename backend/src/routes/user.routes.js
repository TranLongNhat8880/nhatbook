const express = require("express");
const router = express.Router();
const {
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
  getLeaderboard
} = require("../controllers/user.controller");
const { verifyToken, requireAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");

// GET /api/users/admin — Lấy thông tin Tác giả
router.get("/admin", getAdminProfile);

// GET /api/users/leaderboard - Top 5 Đại gia
router.get("/leaderboard", getLeaderboard);

// GET /api/users/p/:id — Truy cập Hồ sơ Công khai
router.get("/p/:id", require("../controllers/user.controller").getPublicProfile);

// GET /api/users/me — UC_03
router.get("/me", verifyToken, getMe);

// PUT /api/users/me — UC_03
router.put("/me", verifyToken, updateMe);

// PUT /api/users/avatar - Upload Avatar
router.put("/avatar", verifyToken, upload.single("avatar"), uploadAvatar);

// GET /api/users/wallet - Lấy thông tin ví & trạng thái điểm danh
router.get("/wallet", verifyToken, getWallet);

// POST /api/users/checkin - Điểm danh nhận NC
router.post("/checkin", verifyToken, dailyCheckin);

// --- ADMIN ROUTES ---

// GET /api/users - Liệt kê tất cả người dùng (Chỉ Admin)
router.get("/", verifyToken, requireAdmin, getAllUsers);

// PUT /api/users/grant-role - Cấp quyển Tác giả (Chỉ Admin)
router.put("/grant-role", verifyToken, requireAdmin, grantRole);

// GET /api/users/check-email - Live check email (Chỉ Admin)
router.get("/check-email", verifyToken, requireAdmin, checkEmail);

// PUT /api/users/:id/toggle-lock - Khóa/Mở khóa tài khoản (Chỉ Admin)
router.put("/:id/toggle-lock", verifyToken, requireAdmin, toggleLockUser);

module.exports = router;
