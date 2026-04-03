const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { verifyToken, requireAdmin, requireWriter } = require("../middleware/auth");

// POST /api/upload
// Cho phép Admin/Tác giả upload ảnh để dán vào bài viết (thông qua React-Quill)
router.post("/", verifyToken, requireWriter, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Không tìm thấy file ảnh" });
    }
    
    // Cloudinary trả URL trong thư mục biến path
    const imageUrl = req.file.path;

    return res.status(200).json({
      message: "Tải ảnh lên thành công",
      url: imageUrl
    });
  } catch (error) {
    console.error("Lỗi upload image post:", error);
    return res.status(500).json({ message: "Lỗi upload ảnh bài viết" });
  }
});

module.exports = router;
