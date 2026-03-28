const express = require("express");
const router = express.Router();
const { getMe, updateMe, uploadAvatar, getAdminProfile } = require("../controllers/user.controller");
const { verifyToken } = require("../middleware/auth");
const upload = require("../middleware/upload");

// GET /api/users/admin — Lấy thông tin Tác giả
router.get("/admin", getAdminProfile);

// GET /api/users/me — UC_03
router.get("/me", verifyToken, getMe);

// PUT /api/users/me — UC_03
router.put("/me", verifyToken, updateMe);

// PUT /api/users/avatar - Upload Avatar
router.put("/avatar", verifyToken, upload.single("avatar"), uploadAvatar);

module.exports = router;
