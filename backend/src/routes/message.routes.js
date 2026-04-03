const express = require("express");
const router = express.Router();
const { 
  getConversations, 
  getChatHistory, 
  markAsRead, 
  searchUsersForChat 
} = require("../controllers/message.controller");
const { verifyToken } = require("../middleware/auth");

// GET /api/messages/conversations - Lấy danh sách hội thoại
router.get("/conversations", verifyToken, getConversations);

// GET /api/messages/history/:otherUserId - Lấy lịch sử chat
router.get("/history/:otherUserId", verifyToken, getChatHistory);

// PUT /api/messages/read - Đánh dấu đã đọc
router.put("/read", verifyToken, markAsRead);

// GET /api/messages/search - Tìm kiếm người dùng mới để nhắn tin
router.get("/search", verifyToken, searchUsersForChat);

module.exports = router;
