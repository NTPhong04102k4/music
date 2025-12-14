const express = require("express");
const pool = require("../db");
const bcrypt = require("bcrypt");
const authenticateToken = require("../middleware/authenticateToken");
const { upload } = require("../middleware/avatarUpload");
const { BASE_URL } = require("../config");

const router = express.Router();

// Favorites
router.get("/favorites", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [rows] = await pool.execute(
      `
      SELECT b.BaiHatID as id, 
             b.TieuDe as title, 
             b.AnhBiaBaiHat as imageUrl,
             GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
             b.DuongDanAudio as audioUrl, 
             f.NgayThem as addedDate
      FROM baihatyeuthich f
      JOIN baihat b ON f.BaiHatID = b.BaiHatID
      LEFT JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
      LEFT JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
      WHERE f.NguoiDungID = ?
      GROUP BY b.BaiHatID, b.TieuDe, b.AnhBiaBaiHat, b.DuongDanAudio, f.NgayThem
      ORDER BY f.NgayThem DESC
    `,
      [userId]
    );

    const data = rows.map((row) => ({
      ...row,
      imageUrl: row.imageUrl
        ? `${BASE_URL}/api/image/song/${row.imageUrl}`
        : "https://placehold.co/60x60/7a3c9e/ffffff?text=No+Image",
      audioUrl: row.audioUrl ? `${BASE_URL}/api/audio/${row.audioUrl}` : null,
    }));

    res.json(data);
  } catch (error) {
    console.error("Error fetching favorites:", error.message);
    res.status(500).json({ error: "Lỗi server: " + error.message });
  }
});

router.post("/favorites/:songId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const songId = req.params.songId;
    const [exists] = await pool.execute(
      "SELECT * FROM baihatyeuthich WHERE NguoiDungID = ? AND BaiHatID = ?",
      [userId, songId]
    );

    if (exists.length > 0) {
      await pool.execute(
        "DELETE FROM baihatyeuthich WHERE NguoiDungID = ? AND BaiHatID = ?",
        [userId, songId]
      );
      res.json({ message: "Đã xóa", isLiked: false });
    } else {
      await pool.execute(
        "INSERT INTO baihatyeuthich (NguoiDungID, BaiHatID) VALUES (?, ?)",
        [userId, songId]
      );
      res.json({ message: "Đã thêm", isLiked: true });
    }
  } catch (error) {
    console.error("Error toggle favorite:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

router.get("/favorites/:songId/status", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM baihatyeuthich WHERE NguoiDungID = ? AND BaiHatID = ?",
      [req.user.userId, req.params.songId]
    );
    res.json({ isLiked: rows.length > 0 });
  } catch (error) {
    res.status(500).json({ error: "Lỗi" });
  }
});

// Playlists
router.post("/playlists", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Tên playlist là bắt buộc" });
    }

    const [result] = await pool.execute(
      "INSERT INTO danhsachphat (NguoiDungID, Ten, MoTa) VALUES (?, ?, ?)",
      [userId, name, description || ""]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      description,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Error creating playlist:", error);
    res.status(500).json({ error: "Lỗi server: " + error.message });
  }
});

router.get("/playlists", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [rows] = await pool.execute(
      `
      SELECT DanhSachID as id, Ten as name, MoTa as description,
             NgayTao as createdAt
      FROM danhsachphat
      WHERE NguoiDungID = ?
      ORDER BY NgayTao DESC
    `,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Error fetching playlists:", error);
    res.status(500).json({ error: "Lỗi server: " + error.message });
  }
});

router.post(
  "/playlists/:playlistId/songs",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const playlistId = req.params.playlistId;
      const { songId } = req.body;

      const [playlist] = await pool.execute(
        "SELECT * FROM danhsachphat WHERE DanhSachID = ? AND NguoiDungID = ?",
        [playlistId, userId]
      );

      if (playlist.length === 0) {
        return res
          .status(404)
          .json({ error: "Playlist không tồn tại hoặc không có quyền" });
      }

      const [existing] = await pool.execute(
        "SELECT * FROM danhsach_baihat WHERE DanhSachID = ? AND BaiHatID = ?",
        [playlistId, songId]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: "Bài hát đã có trong playlist" });
      }

      const [maxOrder] = await pool.execute(
        "SELECT MAX(ThuTu) as maxOrder FROM danhsach_baihat WHERE DanhSachID = ?",
        [playlistId]
      );
      const nextOrder = (maxOrder[0].maxOrder || 0) + 1;

      await pool.execute(
        "INSERT INTO danhsach_baihat (DanhSachID, BaiHatID, ThuTu) VALUES (?, ?, ?)",
        [playlistId, songId, nextOrder]
      );

      res.json({ message: "Đã thêm bài hát vào playlist" });
    } catch (error) {
      console.error("Error adding song to playlist:", error);
      res.status(500).json({ error: "Lỗi server: " + error.message });
    }
  }
);

router.get("/playlists/:playlistId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const playlistId = req.params.playlistId;

    const [playlistRows] = await pool.execute(
      `
      SELECT DanhSachID as id, Ten as name, MoTa as description,
             NgayTao as createdAt
      FROM danhsachphat
      WHERE DanhSachID = ? AND NguoiDungID = ?
    `,
      [playlistId, userId]
    );

    if (playlistRows.length === 0) {
      return res.status(404).json({
        error: "Playlist không tìm thấy hoặc bạn không có quyền truy cập",
      });
    }

    const playlistInfo = playlistRows[0];
    playlistInfo.coverImage =
      "https://placehold.co/300x300/2f2739/ffffff?text=" +
      encodeURIComponent(playlistInfo.name);

    const [songRows] = await pool.execute(
      `
      SELECT b.BaiHatID as id, b.TieuDe as title, b.AnhBiaBaiHat as imageUrl,
             GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
             b.DuongDanAudio as audioUrl, db.ThuTu as orderIndex
      FROM danhsach_baihat db
      JOIN baihat b ON db.BaiHatID = b.BaiHatID
      LEFT JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
      LEFT JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
      WHERE db.DanhSachID = ?
      GROUP BY b.BaiHatID, db.ThuTu
      ORDER BY db.ThuTu ASC
    `,
      [playlistId]
    );

    const songs = songRows.map((song) => ({
      ...song,
      imageUrl: song.imageUrl
        ? `${BASE_URL}/api/image/song/${song.imageUrl}`
        : "https://placehold.co/60x60/7a3c9e/ffffff?text=No+Image",
      audioUrl: song.audioUrl ? `${BASE_URL}/api/audio/${song.audioUrl}` : null,
    }));

    res.json({
      ...playlistInfo,
      songs,
    });
  } catch (error) {
    console.error("Error playlist detail:", error);
    res.status(500).json({ error: "Lỗi server: " + error.message });
  }
});

// History
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [rows] = await pool.execute(
      `
      SELECT b.BaiHatID as id, b.TieuDe as title, b.AnhBiaBaiHat as imageUrl,
             GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
             b.DuongDanAudio as audioUrl, h.ThoiGianNghe as playedAt
      FROM lichsunghe h
      JOIN baihat b ON h.BaiHatID = b.BaiHatID
      LEFT JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
      LEFT JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
      WHERE h.NguoiDungID = ?
      GROUP BY h.LichSuID
      ORDER BY h.ThoiGianNghe DESC
      LIMIT 50
    `,
      [userId]
    );

    const history = rows.map((row) => ({
      ...row,
      imageUrl: row.imageUrl
        ? `${BASE_URL}/api/image/song/${row.imageUrl}`
        : "https://placehold.co/60x60/7a3c9e/ffffff?text=No+Image",
      audioUrl: row.audioUrl ? `${BASE_URL}/api/audio/${row.audioUrl}` : null,
    }));
    res.json(history);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

router.post("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { songId } = req.body;

    if (!songId) {
      return res.status(400).json({ error: "Thiếu songId" });
    }

    await pool.execute(
      "INSERT INTO lichsunghe (NguoiDungID, BaiHatID) VALUES (?, ?)",
      [userId, songId]
    );

    res.json({ message: "Đã thêm vào lịch sử" });
  } catch (error) {
    console.error("Error adding to history:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Subscription & Ads permission
router.get("/user/subscription", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [rows] = await pool.execute(
      `
      SELECT dk.DangKyID, dk.NgayHetHan, g.Ten as TenGoi, q.KhongQuangCao
      FROM dangkygoi dk
      JOIN goicuoc g ON dk.GoiID = g.GoiID
      JOIN quyentruycap q ON g.QuyenID = q.QuyenID
      WHERE dk.NguoiDungID = ?
        AND dk.TrangThai = 'active'
        AND (dk.NgayHetHan IS NULL OR dk.NgayHetHan > NOW())
      ORDER BY dk.NgayHetHan DESC
      LIMIT 1
    `,
      [userId]
    );

    if (rows.length > 0) {
      const sub = rows[0];
      const now = new Date();
      const expiryDate = new Date(sub.NgayHetHan);
      const diffTime = Math.abs(expiryDate - now);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let displayName = sub.TenGoi;
      if (sub.KhongQuangCao === 1) {
        displayName = "Premium";
      }

      res.json({
        isVip: sub.KhongQuangCao === 1,
        planName: displayName,
        expiryDate: sub.NgayHetHan,
        daysLeft: diffDays,
      });
    } else {
      res.json({
        isVip: false,
        planName: "Miễn Phí",
        expiryDate: null,
        daysLeft: 0,
      });
    }
  } catch (error) {
    console.error("Error checking subscription:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

router.get("/user/check-ads", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [rows] = await pool.execute(
      `
      SELECT dk.DangKyID
      FROM dangkygoi dk
      JOIN goicuoc g ON dk.GoiID = g.GoiID
      JOIN quyentruycap q ON g.QuyenID = q.QuyenID
      WHERE dk.NguoiDungID = ?
        AND dk.TrangThai = 'active'
        AND (dk.NgayHetHan IS NULL OR dk.NgayHetHan > NOW())
        AND q.KhongQuangCao = 1
      LIMIT 1
    `,
      [userId]
    );

    const isVip = rows.length > 0;
    console.log(`Check VIP User ${userId}: ${isVip}`);

    res.json({ isVip });
  } catch (error) {
    console.error("Error checking ads permission:", error);
    res.json({ isVip: false });
  }
});

// Random ad link (public)
router.get("/ads/random", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT LinkShopee FROM quangcao WHERE HienThi = 1 ORDER BY RAND() LIMIT 1"
    );

    if (rows.length > 0) {
      console.log("Ad found:", rows[0].LinkShopee);
      res.json({ link: rows[0].LinkShopee });
    } else {
      console.log("No ads found in DB, using fallback");
      res.json({ link: "https://shopee.vn" });
    }
  } catch (error) {
    console.error("Error getting ad:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Upload Avatar
router.post(
  "/user/avatar",
  authenticateToken,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "Vui lòng chọn file ảnh" });
      }

      const dbPath = `images/avatar/${file.filename}`;

      await pool.execute(
        "UPDATE nguoidung SET AnhDaiDien = ? WHERE NguoiDungID = ?",
        [dbPath, userId]
      );

      const avatarUrl = `${BASE_URL}/api/image/avatar/${file.filename}`;

      res.json({
        message: "Cập nhật ảnh đại diện thành công",
        avatarUrl: avatarUrl,
      });
    } catch (error) {
      console.error("Upload avatar error:", error);
      res.status(500).json({ error: "Lỗi khi upload ảnh" });
    }
  }
);

// =======================================================
// ĐỔI MẬT KHẨU (CHỈ CHO USER LOCAL - KHÔNG GOOGLE/FACEBOOK)
// POST /api/user/change-password
// =======================================================
router.post("/user/change-password", authenticateToken, async (req, res) => {
  try {
    // Chặn admin đổi mật khẩu qua endpoint này
    if (req.user?.role && req.user.role !== "user") {
      return res.status(403).json({ error: "Không có quyền" });
    }

    const userId = req.user.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Thiếu mật khẩu hiện tại hoặc mật khẩu mới" });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Xác nhận mật khẩu không khớp" });
    }

    const [rows] = await pool.execute(
      "SELECT NguoiDungID, TenDangNhap, VaiTro, MatKhau, TrangThai FROM nguoidung WHERE NguoiDungID = ? LIMIT 1",
      [userId]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    const u = rows[0];
    if (u.TrangThai && u.TrangThai !== "active") {
      return res.status(403).json({ error: "Tài khoản đã bị khóa" });
    }

    const role = (u.VaiTro || "user").toLowerCase();
    if (role !== "user") {
      return res.status(403).json({ error: "Không có quyền" });
    }

    const usernameLower = (u.TenDangNhap || "").toLowerCase();
    if (
      usernameLower.includes("google") ||
      usernameLower.includes("facebook")
    ) {
      return res.status(400).json({
        error:
          "Tài khoản đăng nhập Google/Facebook không thể đổi mật khẩu tại đây",
      });
    }

    // Hỗ trợ DB đang lưu plain text hoặc bcrypt hash
    const current = String(currentPassword);
    let isValid = false;
    if (u.MatKhau === current) {
      isValid = true;
    } else {
      isValid = await bcrypt.compare(current, u.MatKhau).catch(() => false);
    }

    if (!isValid) {
      return res.status(401).json({ error: "Mật khẩu hiện tại không đúng" });
    }

    const hashedPassword = await bcrypt.hash(String(newPassword), 10);
    await pool.execute(
      "UPDATE nguoidung SET MatKhau = ? WHERE NguoiDungID = ?",
      [hashedPassword, userId]
    );

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Lỗi server: " + error.message });
  }
});

module.exports = router;
