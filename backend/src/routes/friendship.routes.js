const express = require("express");
const router = express.Router();
const { 
  toggleFriendRequest, 
  respondToRequest, 
  getFriendshipStatus, 
  getFriendsList, 
  getPendingRequests 
} = require("../controllers/friendship.controller");
const { verifyToken } = require("../middleware/auth");

// POST /api/friends/request - Gửi hoặc Hủy lời mời
router.post("/request", verifyToken, toggleFriendRequest);

// PUT /api/friends/respond - Chấp nhận hoặc Từ chối
router.put("/respond", verifyToken, respondToRequest);

// GET /api/friends/status/:targetId - Kiểm tra trạng thái bạn bè
router.get("/status/:targetId", verifyToken, getFriendshipStatus);

// GET /api/friends - Danh sách bạn bè hiện tại
router.get("/", verifyToken, getFriendsList);

// GET /api/friends/pending - Lời mời đang chờ
router.get("/pending", verifyToken, getPendingRequests);

module.exports = router;
