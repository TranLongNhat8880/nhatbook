const rateLimit = require("express-rate-limit");

/**
 * Giới hạn toàn cục cho toàn bộ API
 * 100 requests mỗi 15 phút từ một IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Giới hạn mỗi IP tối đa 100 requests
  message: {
    status: 429,
    message: "Gửi yêu cầu quá nhiều, vui lòng thử lại sau"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Giới hạn nghiêm ngặt cho đăng nhập và đăng ký
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // Giới hạn mỗi IP tối đa 10 lần thử login/register
  message: {
    status: 429,
    message: "Gửi yêu cầu quá nhiều, vui lòng thử lại sau"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, authLimiter };
