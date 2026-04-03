const express = require("express");
const router = express.Router();
const { getNotifications, markAsRead } = require("../controllers/notification.controller");
const { verifyToken } = require("../middleware/auth");

router.get("/", verifyToken, getNotifications);
router.put("/read", verifyToken, markAsRead);

module.exports = router;
