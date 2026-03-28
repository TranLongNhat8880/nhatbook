const jwt = require("jsonwebtoken");

/**
 * Middleware: Xác thực JWT Token
 * Kiểm tra header: Authorization: Bearer <token>
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Không có token xác thực" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

/**
 * Middleware: Chỉ cho phép ADMIN
 * Dùng sau verifyToken
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Không có quyền. Chỉ Admin mới thực hiện được." });
  }
  next();
};

module.exports = { verifyToken, requireAdmin };
