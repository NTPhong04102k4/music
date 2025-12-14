const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("../db");
const authenticateToken = require("../middleware/authenticateToken");
const { BASE_URL, JWT_SECRET } = require("../config");

const router = express.Router();

// API ĐĂNG NHẬP (LOGIN)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Vui lòng nhập tên đăng nhập/email và mật khẩu" });
    }

    const [users] = await pool.execute(
      "SELECT * FROM nguoidung WHERE Email = ? OR TenDangNhap = ?",
      [email, email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Tài khoản không tồn tại" });
    }

    const user = users[0];

    if (user.TrangThai && user.TrangThai !== "active") {
      return res.status(403).json({ error: "Tài khoản đã bị khóa" });
    }

    let isValidPassword = false;
    if (user.MatKhau === password) {
      isValidPassword = true;
    } else {
      isValidPassword = await bcrypt
        .compare(password, user.MatKhau)
        .catch(() => false);
    }

    if (!isValidPassword) {
      return res.status(401).json({ error: "Mật khẩu không đúng" });
    }

    // === LOGIC PHÂN QUYỀN ===
    let role = user.VaiTro || "user";
    if (user.TenDangNhap === "admin") role = "admin";

    const token = jwt.sign(
      { userId: user.NguoiDungID, username: user.TenDangNhap, role: role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.NguoiDungID,
        username: user.TenDangNhap,
        email: user.Email,
        displayName: user.TenHienThi || user.HoVaTen || user.TenDangNhap,
        avatar: user.AnhDaiDien
          ? user.AnhDaiDien.startsWith("http")
            ? user.AnhDaiDien
            : `${BASE_URL}/uploads/${user.AnhDaiDien}`
          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.TenDangNhap}`,
        role: role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Lỗi server: " + error.message });
  }
});

// API ĐĂNG KÝ (REGISTER)
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Vui lòng nhập đầy đủ thông tin bắt buộc" });
    }

    const [existingUsers] = await pool.execute(
      "SELECT * FROM nguoidung WHERE TenDangNhap = ? OR Email = ?",
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res
        .status(409)
        .json({ error: "Tên đăng nhập hoặc Email đã tồn tại" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await pool.execute(
      "INSERT INTO nguoidung (TenDangNhap, Email, MatKhau, TenHienThi, TrangThai, NgayThamGia) VALUES (?, ?, ?, ?, ?, NOW())",
      [username, email, hashedPassword, displayName || username, "active"]
    );

    res.status(201).json({ message: "Đăng ký tài khoản thành công!" });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: "Lỗi server: " + error.message });
  }
});

// API LẤY THÔNG TIN USER THEO JWT (DÙNG CHO OAUTH CALLBACK)
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [rows] = await pool.execute(
      "SELECT NguoiDungID, TenDangNhap, Email, TenHienThi, AnhDaiDien, VaiTro, TrangThai FROM nguoidung WHERE NguoiDungID = ? LIMIT 1",
      [userId]
    );

    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    const u = rows[0];

    if (u.TrangThai && u.TrangThai !== "active") {
      return res.status(403).json({ error: "Tài khoản đã bị khóa" });
    }

    res.json({
      id: u.NguoiDungID,
      username: u.TenDangNhap,
      email: u.Email,
      displayName: u.TenHienThi || u.TenDangNhap,
      avatar: u.AnhDaiDien
        ? u.AnhDaiDien.startsWith("http")
          ? u.AnhDaiDien
          : `${BASE_URL}/uploads/${u.AnhDaiDien}`
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.TenDangNhap}`,
      role: u.VaiTro || "user",
    });
  } catch (error) {
    console.error("Error /api/me:", error);
    res.status(500).json({ error: "Lỗi server: " + error.message });
  }
});

module.exports = router;


