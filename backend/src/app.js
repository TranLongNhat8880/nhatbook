const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const postRoutes = require("./routes/post.routes");
const commentRoutes = require("./routes/comment.routes");
const shopRoutes = require("./routes/shop.routes");
const uploadRoutes = require("./routes/upload.routes");
const notificationRoutes = require("./routes/notification.routes");
const messageRoutes = require("./routes/message.routes");
const friendshipRoutes = require("./routes/friendship.routes");

const { apiLimiter } = require("./middleware/rateLimit");

const app = express();

// ── Middleware ─────────────────────────────────────────
// 1. CORS - Phải đặt trên cùng để tránh lỗi Preflight
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));

// 2. Bảo mật Headers với Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "res.cloudinary.com"], // Cho phép ảnh từ Cloudinary
      "frame-src": ["'self'", "www.youtube.com", "youtube.com", "youtu.be"], // Cho phép Youtube iframe
      "script-src": ["'self'", "'unsafe-inline'"], // Cho phép script nội bộ
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" } // Cho phép truy cập tài nguyên cross-origin
}));

app.use(apiLimiter); // Áp dụng giới hạn sau CORS
app.use(express.json());

// ── Phục vụ Frontend (Static Files) ─────────────────────
const distPath = path.join(__dirname, "../../frontend/dist");
// ── Routes ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "nhatbook API đang chạy!" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/friends", friendshipRoutes);

// ── 404 handler ────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Không tìm thấy endpoint này" });
});

// ── Global error handler ───────────────────────────────
app.use((err, req, res, next) => {
  console.error("Lỗi server:", err.message);
  res.status(500).json({ message: "Lỗi máy chủ" });
});

module.exports = app;
