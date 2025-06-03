const express = require("express");
const User = require("../db/userModel");
const router = express.Router();

router.post("/", async (request, response) => {});

router.get("/", async (request, response) => {});
router.get("/list", async (req, res) => {
  try {
    const users = await User.find({}, "_id first_name last_name").exec();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(
      id,
      "_id first_name last_name location description occupation"
    ).exec();

    if (!user) {
      return res.status(400).json({ error: "Không tìm thấy người dùng" });
    }

    res.status(200).json(user);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "ID người dùng không hợp lệ" });
    }
    res.status(500).json({ error: "Lỗi server" });
  }
});
module.exports = router;
