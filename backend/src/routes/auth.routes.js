const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/auth.controller");
const { authLimiter } = require("../middleware/rateLimit");

// POST /api/auth/register — UC_01
router.post("/register", authLimiter, register);

// POST /api/auth/login — UC_02
router.post("/login", authLimiter, login);

module.exports = router;
