const sanitizeHtml = require("sanitize-html");
const pool = require("../config/db");

/**
 * UC_04: Xem danh sách bài viết
 * GET /api/posts
 */
const getAllPosts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.title, p.content, p.category, p.created_at, p.updated_at,
              u.id AS author_id, u.username AS author_name, u.avatar_url AS author_avatar,
              COUNT(DISTINCT c.id) AS comment_count,
              COUNT(DISTINCT l.user_id) AS like_count
       FROM posts p
       JOIN users u ON u.id = p.author_id
       LEFT JOIN comments c ON c.post_id = p.id
       LEFT JOIN post_likes l ON l.post_id = p.id
       GROUP BY p.id, u.id
       ORDER BY p.created_at DESC`
    );
    return res.status(200).json({ posts: result.rows });
  } catch (err) {
    console.error("Lỗi getAllPosts:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * UC_05: Xem chi tiết bài viết
 * GET /api/posts/:id
 */
const getPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.id, p.title, p.content, p.category, p.created_at, p.updated_at,
              u.id AS author_id, u.username AS author_name, u.avatar_url AS author_avatar
       FROM posts p
       JOIN users u ON u.id = p.author_id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    return res.status(200).json({ post: result.rows[0] });
  } catch (err) {
    console.error("Lỗi getPostById:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * UC_06: Tạo bài viết mới (Admin only)
 * POST /api/posts
 */
const createPost = async (req, res) => {
  let { title, content, category } = req.body;
  
  // Sanitize content to prevent XSS
  const sanitizedContent = sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'iframe', 'h1', 'h2', 'pre', 'code' ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      'a': ['href', 'name', 'target'],
      'img': ['src', 'alt', 'title', 'width', 'height', 'loading'],
      'iframe': ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen'],
      '*': ['style', 'class'] // Allow some styling from the editor
    },
    allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'youtu.be']
  });

  if (!title || !content) {
    return res.status(400).json({ message: "Tiêu đề và nội dung không được để trống" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO posts (title, content, category, author_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, content, category, author_id, created_at, updated_at`,
      [title, sanitizedContent, category || null, req.user.id]
    );

    return res.status(201).json({
      message: "Tạo bài viết thành công",
      post: result.rows[0],
    });
  } catch (err) {
    console.error("Lỗi createPost:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * UC_07: Cập nhật bài viết (Admin only)
 * PUT /api/posts/:id
 */
const updatePost = async (req, res) => {
  const { id } = req.params;
  let { title, content, category } = req.body;
  
  // Sanitize content to prevent XSS
  const sanitizedContent = sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'iframe', 'h1', 'h2', 'pre', 'code' ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      'a': ['href', 'name', 'target'],
      'img': ['src', 'alt', 'title', 'width', 'height', 'loading'],
      'iframe': ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen'],
      '*': ['style', 'class']
    },
    allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'youtu.be']
  });

  if (!title || !content) {
    return res.status(400).json({ message: "Tiêu đề và nội dung không được để trống" });
  }

  try {
    const result = await pool.query(
      `UPDATE posts SET title = $1, content = $2, category = $3
       WHERE id = $4
       RETURNING id, title, content, category, author_id, created_at, updated_at`,
      [title, sanitizedContent, category || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    return res.status(200).json({
      message: "Cập nhật bài viết thành công",
      post: result.rows[0],
    });
  } catch (err) {
    console.error("Lỗi updatePost:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * UC_07: Xóa bài viết (Admin only)
 * DELETE /api/posts/:id
 */
const deletePost = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM posts WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    return res.status(200).json({ message: "Xóa bài viết thành công" });
  } catch (err) {
    console.error("Lỗi deletePost:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * Thả tim / Hủy tim bài viết
 * POST /api/posts/:id/like
 */
const toggleLike = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const post = await pool.query("SELECT id FROM posts WHERE id = $1", [id]);
    if (post.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy bài viết" });

    const existing = await pool.query("SELECT * FROM post_likes WHERE post_id = $1 AND user_id = $2", [id, userId]);

    if (existing.rows.length > 0) {
      await pool.query("DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2", [id, userId]);
      return res.status(200).json({ message: "Đã hủy thích", is_liked: false });
    } else {
      await pool.query("INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)", [id, userId]);
      return res.status(201).json({ message: "Đã thích bài viết", is_liked: true });
    }
  } catch (err) {
    console.error("Lỗi toggleLike:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * Lấy danh sách người đã thích
 * GET /api/posts/:id/likes
 */
const getPostLikes = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.avatar_url, l.created_at
       FROM post_likes l
       JOIN users u ON u.id = l.user_id
       WHERE l.post_id = $1
       ORDER BY l.created_at DESC`,
      [id]
    );
    return res.status(200).json({ likes: result.rows });
  } catch (err) {
    console.error("Lỗi getPostLikes:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

module.exports = { getAllPosts, getPostById, createPost, updatePost, deletePost, toggleLike, getPostLikes };
