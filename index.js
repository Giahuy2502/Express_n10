const express = require("express");
const app = express();
const cors = require("cors");
const dbConnect = require("./db/dbConnect");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");
const AuthRouter = require("./routes/AuthRouter");
const fileUpload = require('express-fileupload');
const path = require("path");
const jwt = require('jsonwebtoken');

// Kết nối cơ sở dữ liệu
dbConnect();

// Khóa bí mật cho JWT (nên lưu trong biến môi trường)
const JWT_SECRET = process.env.JWT_SECRET || 'long-and-random-secret-key-B22DCCN392';
if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not defined in environment variables. Using fallback secret.');
}

// Middleware fileUpload
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn 10MB
  abortOnLimit: true, // Từ chối yêu cầu nếu vượt quá giới hạn
}));

// Cấu hình CORS
app.use(cors({
  origin: 'http://localhost:3000', // URL của frontend
  credentials: true, // Vẫn cần nếu gửi cookies hoặc headers khác
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware xử lý JSON
app.use(express.json());

// Phục vụ file tĩnh từ thư mục images
app.use('/images', express.static(path.join(__dirname, 'images')));

// Middleware kiểm tra JWT
const authMiddleware = (req, res, next) => {
  // Bỏ qua middleware cho các route login/logout/register
  if (
    req.path.startsWith('/api/admin/login') ||
    req.path.startsWith('/api/admin/logout') ||
    req.path.startsWith('/api/admin/register')
  ) {
    return next();
  }
  const token = req.headers['authorization']?.split(' ')[1] || req.headers['Authorization']?.split(' ')[1];
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

// Áp dụng middleware JWT cho tất cả các route
app.use(authMiddleware);

// Các route API
app.use("/api/user", UserRouter);
app.use("/api/photo", PhotoRouter);
app.use("/api/admin", AuthRouter);

// Route gốc
app.get("/", (request, response) => {
  response.send({ message: "Hello from photo-sharing app API!" });
});

// Khởi động server
app.listen(8081, () => {
  console.log("server listening on port 8081");
});