const express = require("express");
const Photo = require("../db/photoModel");
const User = require("../db/userModel");
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const jwt = require('jsonwebtoken');

// Khóa bí mật cho JWT (nên lưu trong biến môi trường)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not defined in environment variables. Using fallback secret.');
}

// Middleware xác minh JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log("Token duoc gui la",token);
  if (!token) {
    return res.status(401).json({ error: 'Chưa đăng nhập, thiếu token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Gán thông tin user từ token vào req.user
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token không hợp lệ' });
  }
};

// Route không yêu cầu xác thực
router.get("/photosOfUser/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).send({ message: "User ID is invalid" });
    }

    const photos = await Photo.find({ user_id: userId })
      .populate({
        path: "comments.user",
        model: "User",
        select: "_id first_name last_name",
      })
      .select("_id user_id comments file_name date_time");

    res.status(200).send(photos);
  } catch (err) {
    console.error("Error in /photosOfUser/:id:", err);
    res.status(500).send({
      message: "Error fetching photos",
      error: err?.message || err,
    });
  }
});

// Route yêu cầu xác thực
router.post('/commentOfPhoto/:photo_id', authMiddleware, async (req, res) => {
  const { comment } = req.body;
  const photoId = req.params.photo_id;

  if (!comment || comment.trim() === '') {
    return res.status(400).json({ error: 'Bình luận không được để trống' });
  }

  try {
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Không tìm thấy ảnh' });
    }

    // Tạo bình luận mới
    const newComment = {
      comment: comment,
      user_id: req.user._id,
      login_name: req.user.login_name,
      date_time: new Date().toISOString(),
    };

    // Thêm bình luận vào mảng comments của ảnh
    photo.comments = photo.comments || []; // Đảm bảo mảng comments tồn tại
    photo.comments.push(newComment);

    // Lưu ảnh với bình luận mới
    await photo.save();

    // Trả về bình luận mới để frontend cập nhật
    res.status(200).json({
      success: true,
      comment: newComment,
    });
  } catch (error) {
    console.error('Lỗi khi thêm bình luận:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi thêm bình luận', message: error.message });
  }
});

router.get("/new", async (req, res) => {
  res.json({ error: 'Trang tải ảnh cần gửi POST, không phải GET!' });
});

router.post("/new", authMiddleware, async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: "Không có file trong yêu cầu" });
    }

    const file = req.files.file;

    // Kiểm tra kích thước file (đã được express-fileupload xử lý)
    if (file.truncated) {
      return res.status(413).json({ error: "File quá lớn, giới hạn là 10MB" });
    }

    const uniqueFileName = `${uuidv4()}${path.extname(file.name)}`;
    const uploadPath = path.join(__dirname, "../images", uniqueFileName);

    const imagesDir = path.join(__dirname, "../images");
    await fs.mkdir(imagesDir, { recursive: true });

    // Di chuyển file đến thư mục images
    await file.mv(uploadPath);

    const newPhoto = new Photo({
      user_id: req.user._id,
      file_name: uniqueFileName,
      date_time: new Date().toISOString(),
    });

    await newPhoto.save();
    res.status(201).json({
      success: true,
      photo: {
        _id: newPhoto._id,
        user_id: newPhoto.user_id,
        file_name: newPhoto.file_name,
        date_time: newPhoto.date_time,
      },
    });
  } catch (error) {
    console.error("Lỗi khi tải lên ảnh:", error);
    res.status(500).json({ error: "Lỗi máy chủ khi tải lên ảnh", message: error.message });
  }
});

module.exports = router;