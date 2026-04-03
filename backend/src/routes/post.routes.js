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
const { verifyToken, requireAdmin, requireWriter } = require("../middleware/auth");

// GET /api/posts — UC_04 (Public)
router.get("/", getAllPosts);

// GET /api/posts/:id — UC_05 (Public)
router.get("/:id", getPostById);

// POST /api/posts — UC_06 (Writer or Admin)
router.post("/", verifyToken, requireWriter, createPost);

// PUT /api/posts — UC_07 (Writer or Admin)
router.put("/:id", verifyToken, requireWriter, updatePost);

// DELETE /api/posts — UC_07 (Writer or Admin)
router.delete("/:id", verifyToken, requireWriter, deletePost);

// POST /api/posts/:id/like — (Any verified User)
router.post("/:id/like", verifyToken, toggleLike);

// GET /api/posts/:id/likes — (Public)
router.get("/:id/likes", getPostLikes);

// GET /api/posts/:id/comments — UC_08 (Public)
router.get("/:id/comments", getComments);

// POST /api/posts/:id/comments — UC_09 (Token required)
router.post("/:id/comments", verifyToken, addComment);

module.exports = router;
