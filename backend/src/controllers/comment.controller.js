const sanitizeHtml = require("sanitize-html");
const pool = require("../config/db");

/**
 * UC_08: Xem bình luận của bài viết
 * GET /api/posts/:id/comments
 */
const getComments = async (req, res) => {
  const { id } = req.params; // post id
  try {
    const result = await pool.query(
      `SELECT c.id, c.content, c.created_at, c.parent_id,
              u.id AS user_id, u.username AS author_name, u.avatar_url AS author_avatar
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );
    return res.status(200).json({ comments: result.rows });
  } catch (err) {
    console.error("Lỗi getComments:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * UC_09: Thêm bình luận (User/Admin)
 * POST /api/posts/:id/comments
 */
const addComment = async (req, res) => {
  const { id } = req.params; // post id
  let { content, parent_id } = req.body;
  
  // Sanitize comment content - more restrictive than posts
  const sanitizedContent = sanitizeHtml(content, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    allowedAttributes: {
      'a': ['href', 'target']
    }
  });

  if (!content || content.trim() === "") {
    return res.status(400).json({ message: "Nội dung bình luận không được để trống" });
  }

  try {
    // Kiểm tra bài viết có tồn tại không
    const post = await pool.query("SELECT id FROM posts WHERE id = $1", [id]);
    if (post.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    const result = await pool.query(
      `INSERT INTO comments (content, post_id, user_id, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, content, post_id, user_id, parent_id, created_at`,
      [sanitizedContent.trim(), id, req.user.id, parent_id || null]
    );

    return res.status(201).json({
      message: "Thêm bình luận thành công",
      comment: result.rows[0],
    });
  } catch (err) {
    console.error("Lỗi addComment:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * UC_10: Xóa bình luận (Chủ comment hoặc Admin)
 * DELETE /api/comments/:id
 */
const deleteComment = async (req, res) => {
  const { id } = req.params; // comment id
  try {
    const result = await pool.query(
      "SELECT id, user_id FROM comments WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bình luận" });
    }

    const comment = result.rows[0];
    const isOwner = comment.user_id === req.user.id;
    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Bạn không có quyền xóa bình luận này" });
    }

    await pool.query("DELETE FROM comments WHERE id = $1", [id]);

    return res.status(200).json({ message: "Xóa bình luận thành công" });
  } catch (err) {
    console.error("Lỗi deleteComment:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

module.exports = { getComments, addComment, deleteComment };
