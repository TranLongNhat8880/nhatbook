const express = require("express");
const router = express.Router();
const {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  getPostLikes,
} = require("../controllers/post.controller");
const { getComments, addComment } = require("../controllers/comment.controller");
const { verifyToken, requireAdmin } = require("../middleware/auth");

// GET /api/posts — UC_04 (Public)
router.get("/", getAllPosts);

// GET /api/posts/:id — UC_05 (Public)
router.get("/:id", getPostById);

// POST /api/posts — UC_06 (Admin only)
router.post("/", verifyToken, requireAdmin, createPost);

// PUT /api/posts/:id — UC_07 (Admin only)
router.put("/:id", verifyToken, requireAdmin, updatePost);

// DELETE /api/posts/:id — UC_07 (Admin only)
router.delete("/:id", verifyToken, requireAdmin, deletePost);

// POST /api/posts/:id/like — (Any verified User)
router.post("/:id/like", verifyToken, toggleLike);

// GET /api/posts/:id/likes — (Public)
router.get("/:id/likes", getPostLikes);

// GET /api/posts/:id/comments — UC_08 (Public)
router.get("/:id/comments", getComments);

// POST /api/posts/:id/comments — UC_09 (Token required)
router.post("/:id/comments", verifyToken, addComment);

module.exports = router;
