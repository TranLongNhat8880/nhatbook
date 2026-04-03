const express = require("express");
const router = express.Router();
const { register, login, forgotPassword, resetPassword, verifyEmail } = require("../controllers/auth.controller");
const { authLimiter } = require("../middleware/rateLimit");

// POST /api/auth/register — UC_01
router.post("/register", authLimiter, register);

// POST /api/auth/login — UC_02
router.post("/login", authLimiter, login);
// POST /api/auth/forgot-password
router.post("/forgot-password", authLimiter, forgotPassword);

// POST /api/auth/reset-password
router.post("/reset-password", authLimiter, resetPassword);

// POST /api/auth/verify-email
router.post("/verify-email", authLimiter, verifyEmail);

module.exports = router;
