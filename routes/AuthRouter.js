const express = require('express');
const router = express.Router();
const User = require('../db/userModel');

router.post('/login', async (req, res) => {
  console.log('Request body:', req.body);
  try {
    const { login_name, password } = req.body;
    if (!login_name) {
      return res.status(400).json({ error: 'Tên đăng nhập là bắt buộc' });
    }

    if (login_name === 'admin' && password === '123') {
      // Gán session cho admin
      req.session.user = {
        _id: '123',
        login_name: 'admin'
      };
      return res.json({
        _id: '123',
        login_name: 'admin'
      });
    }
    if (login_name === 'huy' && password === '123') {
      const user1 = await User.findOne({ login_name });
      // Gán session cho admin
      req.session.user = {
        _id: user1._id,
        login_name: user1.login_name
      };
      return res.json({
        _id: user1._id,
        login_name: user1.login_name
      });
    }
    const user = await User.findOne({ login_name, password });
    console.log(`${user.password}`);
    if (!user) {
      return res.status(400).json({ error: 'Người dùng không hợp lệ' });
    }

    // Gán session cho người dùng thông thường
    req.session.user = {
      _id: user._id,
      login_name: user.login_name
    };
    res.json({
      _id: user._id,
      login_name: user.login_name
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});


router.get('/login', (req, res) => {
  res.json({ error: 'Trang login cần gửi POST, không phải GET!' });
});


router.post('/logout', (req, res) => {
  if (!req.session.user) {
    return res.status(400).json({ error: 'Chưa đăng nhập' });
  }
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Không thể đăng xuất' });
    }
    res.json({ success: true });
  });
})
router.post('/register', (req, res) => {
  const { login_name, password,first_name, last_name, location, description, occupation } = req.body;

  if (!login_name) {
    return res.status(400).json({ error: 'Tên đăng nhập là bắt buộc' });
  }

  // Kiểm tra xem tên đăng nhập đã tồn tại chưa
  User.findOne({ login_name: login_name })
    .then(existingUser => {
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
      newUser.save()
        .then(savedUser => {
          // Gán session cho người dùng mới
          req.session.user = {
            _id: savedUser._id,
            login_name: savedUser.login_name
          };
          res.status(201).json({
            _id: savedUser._id,
            login_name: savedUser.login_name,
            first_name: savedUser.first_name,
            last_name: savedUser.last_name,
            location: savedUser.location,
            description: savedUser.description,
            occupation: savedUser.occupation,
            password: savedUser.password
          });
        })
        .catch(err => {
          res.status(500).json({ error: 'Lỗi server khi lưu người dùng' });
        });
    })
    .catch(err => {
      res.status(500).json({ error: 'Lỗi server khi kiểm tra tên đăng nhập' });
    });
});

module.exports = router