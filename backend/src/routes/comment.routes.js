const express = require("express");
const router = express.Router();
const { deleteComment } = require("../controllers/comment.controller");
const { verifyToken } = require("../middleware/auth");

// DELETE /api/comments/:id — UC_10 (Owner hoặc Admin)
router.delete("/:id", verifyToken, deleteComment);

module.exports = router;
