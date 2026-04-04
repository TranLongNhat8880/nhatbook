const sanitizeHtml = require("sanitize-html");
const pool = require("../config/db");
const { checkContentToxicity } = require("../utils/aiModerator");
const { awardNC, deductNC } = require("../utils/economy");

/**
 * UC_08: Xem bình luận của bài viết
 * GET /api/posts/:id/comments
 */
const getComments = async (req, res) => {
  const { id } = req.params; // post id
  try {
    const result = await pool.query(
      `SELECT c.id, c.content, c.post_id,
              c.user_id::text AS user_id,
              c.parent_id::text AS parent_id,
              c.is_flagged, c.created_at,
              u.username AS author_name, u.avatar_url AS author_avatar, u.role AS author_role,
              u.id::text AS author_id,
              COALESCE(ui.author_equipped_items, '[]'::json) AS author_equipped_items
       FROM comments c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN (
         SELECT user_id, json_agg(json_build_object('item_id', item_id, 'item_type', item_type)) AS author_equipped_items
         FROM user_inventory 
         WHERE is_equipped = true
         GROUP BY user_id
       ) ui ON ui.user_id = u.id
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

    // --- AI MODERATION STEP ---
    const moderationResult = await checkContentToxicity(content);
    const { isToxic, reason } = moderationResult;

    if (isToxic) {
      const { handleViolation } = require("../utils/violation");
      await handleViolation(req.user.id, reason);
    }

    const result = await pool.query(
      `INSERT INTO comments (content, post_id, user_id, parent_id, is_flagged, violation_reason)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, content, post_id, user_id, user_id AS author_id, parent_id, parent_id AS "parentId", is_flagged, violation_reason, created_at`,
      [sanitizedContent.trim(), id, req.user.id, parent_id || null, isToxic, reason]
    );

    // --- NHATCOIN REWARD: Interaction (+5 NC to Post Author) ---
    const authorRes = await pool.query("SELECT author_id FROM posts WHERE id = $1", [id]);
    if (authorRes.rows.length > 0) {
      const authorId = authorRes.rows[0].author_id;
      // Cộng xu cho tác giả bài viết khi nhận được comment mới
      if (authorId !== req.user.id) {
        // --- KÍCH HOẠT THÔNG BÁO COMMENT / REPLY ---
        try {
          const { emitToUser } = require("../utils/socket");
          const actorCheck = await pool.query("SELECT username, avatar_url FROM users WHERE id = $1", [req.user.id]);
          const actorData = { actor_name: actorCheck.rows[0]?.username, actor_avatar: actorCheck.rows[0]?.avatar_url };

          if (parent_id) {
            // Lấy id người chủ của parent comment
            const parentRes = await pool.query("SELECT user_id FROM comments WHERE id = $1", [parent_id]);
            if (parentRes.rows.length > 0) {
              const parentAuthorId = parentRes.rows[0].user_id;
              if (parentAuthorId !== req.user.id) {
                const notifRes = await pool.query(
                  "INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
                  [parentAuthorId, req.user.id, 'REPLY_COMMENT', id, result.rows[0].id]
                );
                emitToUser(parentAuthorId, "NEW_NOTIFICATION", { ...notifRes.rows[0], ...actorData });
              }
            }
          } else {
            const notifRes = await pool.query(
              "INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
              [authorId, req.user.id, 'COMMENT_POST', id, result.rows[0].id]
            );
            emitToUser(authorId, "NEW_NOTIFICATION", { ...notifRes.rows[0], ...actorData });
          }
        } catch (notifErr) { console.error("Lỗi tạo notification COMMENT:", notifErr); }

        await awardNC(authorId, 5, 'interaction', 25, 'interaction_reward', `Nhận được lượt bình luận mới cho bài viết (ID: ${id})`);
      }
    }

    // Nếu vi phạm, tăng số lần vi phạm & TRỪ 100 NC (Anti-Tox)
    if (isToxic) {
      await pool.query(
        "UPDATE users SET violation_count = violation_count + 1 WHERE id = $1",
        [req.user.id]
      );
      
      // Khấu trừ 100 NC vì hành vi độc hại
      await deductNC(req.user.id, 100, 'penalty', 'Vi phạm quy tắc cộng đồng (AI Moderator)');
    }

    return res.status(201).json({
      message: isToxic ? "Bình luận của bạn đã được gửi nhưng bị cảnh báo vi phạm quy tắc cộng đồng!" : "Thêm bình luận thành công",
      comment: result.rows[0],
      moderation: { isToxic, reason }
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
