const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const postRoutes = require("./routes/post.routes");
const commentRoutes = require("./routes/comment.routes");
const uploadRoutes = require("./routes/upload.routes");

const { apiLimiter } = require("./middleware/rateLimit");

const app = express();

// ── Middleware ─────────────────────────────────────────
// 1. Bảo mật Headers với Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "res.cloudinary.com"], // Cho phép ảnh từ Cloudinary
      "frame-src": ["'self'", "www.youtube.com", "youtube.com", "youtu.be"], // Cho phép Youtube iframe
      "script-src": ["'self'", "'unsafe-inline'"], // Cho phép script nội bộ
    },
  },
}));

app.use(apiLimiter); // Áp dụng giới hạn toàn cục
app.use(cors());
app.use(express.json());

// ── Phục vụ Frontend (Static Files) ─────────────────────
const distPath = path.join(__dirname, "../../frontend/dist");
const fs = require("fs");

console.log("--- DEBUG DEPLOY ---");
console.log("__dirname:", __dirname);
console.log("Resolved distPath:", distPath);
console.log("distPath exists?:", fs.existsSync(distPath));
if (fs.existsSync(distPath)) {
  console.log("Contents of distPath:", fs.readdirSync(distPath));
}
console.log("--------------------");

app.use(express.static(distPath));

// ── Routes ─────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/upload", uploadRoutes);

// ── API Health check (Đổi sang /api/health để tránh tranh chấp với Frontend) ──
app.get("/api/health", (req, res) => {
  res.json({ message: "nhatbook API đang chạy!", status: "OK" });
});

// ── 404 handler cho API ─────────────────────────────────
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: "Không tìm thấy endpoint này" });
});

// ── Catch-all (Phục vụ React SPA) ───────────────────────
// Mọi route không khớp với API sẽ được dẫn về index.html của Frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ── Global error handler ───────────────────────────────
app.use((err, req, res, next) => {
  console.error("Lỗi server:", err.message);
  res.status(500).json({ message: "Lỗi máy chủ" });
});

module.exports = app;
