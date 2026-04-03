const jwt = require("jsonwebtoken");
const pool = require("../config/db");

/**
 * Middleware: Xác thực JWT Token & Kiểm tra trạng thái tài khoản (Enforce Lock)
 * Kiểm tra header: Authorization: Bearer <token>
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Không có token xác thực" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // TRUY VẤN KIỂM TRA TRẠNG THÁI KHÓA THỜI GIAN THỰC (Security Fix)
    const userResult = await pool.query(
      "SELECT is_locked, role FROM users WHERE id = $1",
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Tài khoản không tồn tại" });
    }

    const { is_locked, role } = userResult.rows[0];

    if (is_locked) {
      return res.status(403).json({ 
        message: "Tài khoản của bạn đã bị khóa do vi phạm quy tắc cộng đồng. Vui lòng liên hệ Admin.",
        error_code: "ACCOUNT_LOCKED"
      });
    }

    // Đính kèm thông tin user (đã cập nhật role mới nhất từ DB) vào req
    req.user = { 
      id: decoded.id, 
      email: decoded.email, 
      role: role // Ưu tiên role từ DB để phản ánh kịp thời các thay đổi
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

/**
 * Middleware: Chỉ cho phép ADMIN
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Không có quyền. Chỉ Admin mới thực hiện được." });
  }
  next();
};

/**
 * Middleware: Chỉ cho phép ADMIN hoặc MEMBER (Cho phép viết bài)
 */
const requireWriter = (req, res, next) => {
  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "MEMBER")) {
    return res.status(403).json({ message: "Không có quyền. Chỉ Tác giả hoặc Admin mới thực hiện được." });
  }
  next();
};

module.exports = { verifyToken, requireAdmin, requireWriter };
