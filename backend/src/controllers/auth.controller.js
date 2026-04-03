const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const sendEmail = require("../utils/sendEmail");

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
    const existing = await pool.query("SELECT id, is_verified FROM users WHERE email = $1", [email]);
    
    // Tạo mã OTP 6 số đăng ký
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    const password_hash = await bcrypt.hash(password, 10);

    if (existing.rows.length > 0) {
      if (existing.rows[0].is_verified) {
        return res.status(409).json({ message: "Email này đã được đăng ký và kích hoạt. Vui lòng đăng nhập." });
      } else {
        // Tài khoản tồn tại nhưng chưa verified -> Ghi đè thông tin & gửi lại OTP mới
        await pool.query(
          "UPDATE users SET username=$1, password_hash=$2, reset_token=$3, reset_token_expiry=$4 WHERE email=$5",
          [username, password_hash, resetToken, resetTokenExpiry, email]
        );
      }
    } else {
      // Lưu user mới vào DB (chưa kích hoạt)
      await pool.query(
        `INSERT INTO users (username, email, password_hash, role, is_verified, reset_token, reset_token_expiry)
         VALUES ($1, $2, $3, 'USER', false, $4, $5)`,
        [username, email, password_hash, resetToken, resetTokenExpiry]
      );
    }

    // Gửi email chứa OTP
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #16a34a; text-align: center;">Chào mừng đến với nhatbook!</h2>
        <p>Xin chào <strong>${username}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất, vui lòng nhập mã OTP dưới đây vào trang đăng ký (mã có hiệu lực trong 15 phút):</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #15803d; background: #f0fdf4; padding: 15px 30px; border-radius: 8px; border: 1px dashed #4ade80;">${resetToken}</span>
        </div>
        <p style="color: #64748b; font-size: 0.9em;">Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="text-align: center; color: #94a3b8; font-size: 0.8em;">&copy; 2026 nhatbook Blog.</p>
      </div>
    `;

    try {
      if (!process.env.EMAIL_USER || process.env.EMAIL_USER === "your_email@gmail.com") {
        console.warn("Chưa cấu hình Gmail. Mã OTP Đăng ký là:", resetToken);
      } else {
        await sendEmail({
          email: email,
          subject: "Mã OTP kích hoạt tài khoản - nhatbook",
          html: message,
        });
      }
    } catch (err) {
      console.error("Lỗi gửi OTP đăng ký:", err);
      // Vẫn cho qua để test Local, nhưng in log
    }

    return res.status(201).json({
      message: "Vui lòng nhập mã OTP đã được gửi đến Email để kích hoạt tài khoản",
      requiresOtp: true,
      email: email
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
      "SELECT id, username, email, password_hash, role, is_verified, is_locked FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const user = result.rows[0];

    // Kiểm tra đã kích hoạt chưa
    if (!user.is_verified) {
      return res.status(403).json({ 
        message: "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để lấy mã OTP hoặc đăng ký lại.",
        requiresOtp: true,
        email: email
      });
    }

    // Kiểm tra xem tài khoản có bị khóa không
    if (user.is_locked) {
      return res.status(403).json({ 
        message: "Tài khoản của bạn đã bị khóa do vi phạm chính sách.",
        isLocked: true 
      });
    }

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

/**
 * Quên mật khẩu - Tạo mã PIN và gửi email
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Vui lòng nhập email" });

  try {
    const userResult = await pool.query("SELECT id, username FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản với email này" });
    }
    const user = userResult.rows[0];

    // Tạo mã PIN 6 số
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    // Hết hạn sau 15 phút
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3",
      [resetToken, resetTokenExpiry, email]
    );

    // Gửi email
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #16a34a; text-align: center;">nhatbook</h2>
        <p>Xin chào <strong>${user.username}</strong>,</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản nhatbook của mình. Dưới đây là mã PIN xác nhận của bạn (có hiệu lực trong 15 phút):</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #15803d; background: #f0fdf4; padding: 15px 30px; border-radius: 8px; border: 1px dashed #4ade80;">${resetToken}</span>
        </div>
        <p style="color: #64748b; font-size: 0.9em;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ với Admin.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="text-align: center; color: #94a3b8; font-size: 0.8em;">&copy; 2026 nhatbook Blog. All rights reserved.</p>
      </div>
    `;

    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_USER === "your_email@gmail.com") {
        console.warn("Chưa cấu hình Gmail trong .env. Mã PIN là:", resetToken);
        return res.status(200).json({ message: "Mã khôi phục đã được tạo (Xem console vì chưa có cấu hình Mail)" });
      }

      await sendEmail({
        email: email,
        subject: "Mã xác nhận khôi phục mật khẩu - nhatbook",
        html: message,
      });
      res.status(200).json({ message: "Mã khôi phục đã được gửi đến email của bạn!" });
    } catch (err) {
      console.error("Lỗi gửi mail:", err);
      // Xóa token nếu gửi lỗi
      await pool.query("UPDATE users SET reset_token = NULL, reset_token_expiry = NULL WHERE email = $1", [email]);
      return res.status(500).json({ message: "Không thể gửi email lúc này. Vui lòng kiểm tra lại cấu hình." });
    }
  } catch (err) {
    console.error("Lỗi forgotPassword:", err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * Đặt lại mật khẩu với mã PIN
 */
const resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    return res.status(400).json({ message: "Vui lòng điền đủ thông tin" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
  }

  try {
    const result = await pool.query(
      "SELECT id, reset_token_expiry FROM users WHERE email = $1 AND reset_token = $2",
      [email, token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Mã PIN không hợp lệ hoặc sai email" });
    }

    const { reset_token_expiry } = result.rows[0];
    if (new Date() > new Date(reset_token_expiry)) {
      return res.status(400).json({ message: "Mã PIN đã hết hạn" });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    // Cập nhật lại mật khẩu và xóa session token
    await pool.query(
      "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE email = $2",
      [password_hash, email]
    );

    res.status(200).json({ message: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ." });
  } catch (err) {
    console.error("Lỗi resetPassword:", err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * Xác thực OTP Đăng ký
 */
const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Vui lòng nhập mã OTP" });
  }

  try {
    const result = await pool.query(
      "SELECT id, username, role, reset_token_expiry FROM users WHERE email = $1 AND reset_token = $2",
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Mã OTP không đúng hoặc sai email" });
    }

    const user = result.rows[0];
    if (new Date() > new Date(user.reset_token_expiry)) {
      return res.status(400).json({ message: "Mã OTP đã hết hạn. Vui lòng đăng ký lại." });
    }

    // Kích hoạt tài khoản
    await pool.query(
      "UPDATE users SET is_verified = true, reset_token = NULL, reset_token_expiry = NULL WHERE email = $1",
      [email]
    );

    // Tạo JWT Token cho phép đăng nhập tự động
    const token = jwt.sign(
      { id: user.id, email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.status(200).json({
      message: "Kích hoạt tài khoản thành công!",
      token,
      user: {
        id: user.id,
        username: user.username,
        email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Lỗi verifyEmail:", err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

module.exports = { register, login, forgotPassword, resetPassword, verifyEmail };
