const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

/**
 * UC_01: Đăng ký tài khoản
 * POST /api/auth/register
 */
const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
  }

  try {
    // Kiểm tra email đã tồn tại chưa
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email này đã được đăng ký" });
    }

    // Hash mật khẩu bằng bcrypt
    const password_hash = await bcrypt.hash(password, 10);

    // Lưu user vào DB
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'USER')
       RETURNING id, username, email, role, created_at`,
      [username, email, password_hash]
    );

    return res.status(201).json({
      message: "Đăng ký thành công",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Lỗi register:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * UC_02: Đăng nhập — Nhận JWT Token
 * POST /api/auth/login
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu" });
  }

  try {
    // Tìm user theo email
    const result = await pool.query(
      "SELECT id, username, email, password_hash, role FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const user = result.rows[0];

    // So khớp mật khẩu
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // Tạo JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.status(200).json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Lỗi login:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

module.exports = { register, login };
