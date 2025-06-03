const express = require("express");
const app = express();
const cors = require("cors");
const dbConnect = require("./db/dbConnect");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");
const AuthRouter = require("./routes/AuthRouter");
const session = require('express-session');
const fileUpload = require('express-fileupload');
const path = require("path"); // 👈 Thêm dòng này

// const CommentRouter = require("./routes/CommentRouter");

dbConnect();
// Đặt middleware fileUpload TRƯỚC tất cả các middleware khác
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn 10MB
  abortOnLimit: true, // Từ chối yêu cầu nếu vượt quá giới hạn
}));
app.use(cors({
  origin: 'http://localhost:3000', // URL của frontend
  credentials: true, // Quan trọng để gửi cookies/session
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));
// Cấu hình session TẠI ĐÂY
app.use(session({
  secret: 'my-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // Bảo mật, ngăn client JavaScript truy cập cookie
    secure: false, // Đặt thành true nếu dùng HTTPS, false cho localhost
    sameSite: 'lax', // Hoặc 'strict', nhưng 'lax' phù hợp với hầu hết các trường hợp
    maxAge: 24 * 60 * 60 * 1000 // Thời gian sống của cookie: 1 ngày
  }
}));
// Middleware để kiểm tra đăng nhập (áp dụng cho mọi route trừ login/logout)
app.use((req, res, next) => {
  // Bỏ qua middleware cho các route login/logout trong admin
  if (
    req.path.startsWith('/api/admin/login') ||
    req.path.startsWith('/api/admin/logout')||
    req.path.startsWith('/api/admin/register')
  ) {
    return next();
  }

  if (!req.session.user) {
    return res.status(401).json({ error: 'Chưa đăng nhập' });
  }
  next();
});
app.use("/api/user", UserRouter);
app.use("/api/photo", PhotoRouter);
app.use("/api/admin", AuthRouter);

app.get("/", (request, response) => {
  response.send({ message: "Hello from photo-sharing app API!" });
});

app.listen(8081, () => {
  console.log("server listening on port 8081");
});
