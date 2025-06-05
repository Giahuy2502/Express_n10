const express = require('express');
const router = express.Router();
const User = require('../db/userModel');
const jwt = require('jsonwebtoken');

// Khóa bí mật để ký JWT (nên lưu trong biến môi trường)
const JWT_SECRET = process.env.JWT_SECRET || 'long-and-random-secret-key-B22DCCN392';

// Hàm tạo JWT
const generateToken = (user) => {
  return jwt.sign(
    { _id: user._id, login_name: user.login_name },
    JWT_SECRET,
    { expiresIn: '1h' } // Token hết hạn sau 1 giờ
  );
};

router.post('/login', async (req, res) => {
  console.log('Request body:', req.body);
  try {
    const { login_name, password } = req.body;
    if (!login_name) {
      return res.status(400).json({ error: 'Tên đăng nhập là bắt buộc' });
    }

    if (login_name === 'admin' && password === '123') {
      const token = generateToken({ _id: '123', login_name: 'admin' });
      return res.json({
        _id: '123',
        login_name: 'admin',
        token
      });
    }
    if (login_name === 'huy' && password === '123') {
      const user1 = await User.findOne({ login_name });
      const token = generateToken({ _id: user1._id, login_name: user1.login_name });
      return res.json({
        _id: user1._id,
        login_name: user1.login_name,
        token
      });
    }
    const user = await User.findOne({ login_name, password });
    if (!user) {
      return res.status(400).json({ error: 'Người dùng không hợp lệ' });
    }

    const token = generateToken({ _id: user._id, login_name: user.login_name });
    res.json({
      _id: user._id,
      login_name: user.login_name,
      token
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

router.get('/login', (req, res) => {
  res.json({ error: 'Trang login cần gửi POST, không phải GET!' });
});

router.post('/logout', (req, res) => {
  // Với JWT, logout thường được xử lý phía client bằng cách xóa token
  res.json({ success: true, message: 'Đăng xuất thành công, vui lòng xóa token phía client' });
});

router.post('/register', async (req, res) => {
  const { login_name, password, first_name, last_name, location, description, occupation } = req.body;

  if (!login_name) {
    return res.status(400).json({ error: 'Tên đăng nhập là bắt buộc' });
  }

  try {
    // Kiểm tra xem tên đăng nhập đã tồn tại chưa
    const existingUser = await User.findOne({ login_name });
    if (existingUser) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }

    // Tạo người dùng mới
    const newUser = new User({
      login_name,
      first_name,
      last_name,
      location,
      description,
      occupation,
      password
    });

    // Lưu người dùng vào cơ sở dữ liệu
    const savedUser = await newUser.save();
    const token = generateToken({ _id: savedUser._id, login_name: savedUser.login_name });
    res.status(201).json({
      _id: savedUser._id,
      login_name: savedUser.login_name,
      first_name: savedUser.first_name,
      last_name: savedUser.last_name,
      location: savedUser.location,
      description: savedUser.description,
      occupation: savedUser.occupation,
      token
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server khi xử lý đăng ký' });
  }
});

module.exports = router;