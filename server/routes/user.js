const express = require("express");
const pool = require("../db");
const bcrypt = require("bcrypt");
const authenticateToken = require("../middleware/authenticateToken");
const { upload } = require("../middleware/avatarUpload");
const { BASE_URL } = require("../config");

const router = express.Router();

// =======================================================
// Comments (theo tài khoản) - bình luận / trả lời bình luận
// Bảng: binhluan (BinhLuanChaID dùng cho cha/con)
// =======================================================
// POST /api/songs/:songId/comments  body: { content: string, parentId?: number }
router.post("/songs/:songId/comments", authenticateToken, async (req, res) => {
  const songId = req.params.songId;
  const userId = req.user.userId;
  const { content, parentId } = req.body || {};

  const text = String(content || "").trim();
  if (!text) return res.status(400).json({ error: "Nội dung bình luận trống" });
  if (text.length > 2000)
    return res
      .status(400)
      .json({ error: "Bình luận quá dài (tối đa 2000 ký tự)" });

  let parent = null;
  if (
    parentId !== undefined &&
    parentId !== null &&
    String(parentId).trim() !== ""
  ) {
    const pid = parseInt(parentId, 10);
    if (Number.isNaN(pid) || pid < 1) {
      return res.status(400).json({ error: "parentId không hợp lệ" });
    }
    parent = pid;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // validate song exists
    const [songRows] = await conn.execute(
      "SELECT BaiHatID FROM baihat WHERE BaiHatID = ? LIMIT 1",
      [songId]
    );
    if (!songRows || songRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Bài hát không tồn tại" });
    }

    if (parent) {
      const [parentRows] = await conn.execute(
        "SELECT BinhLuanID, BaiHatID FROM binhluan WHERE BinhLuanID = ? LIMIT 1",
        [parent]
      );
      if (!parentRows || parentRows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: "Bình luận cha không tồn tại" });
      }
      if (Number(parentRows[0].BaiHatID) !== Number(songId)) {
        await conn.rollback();
        return res
          .status(400)
          .json({ error: "Bình luận cha không thuộc bài hát này" });
      }
    }

    const [ins] = await conn.execute(
      "INSERT INTO binhluan (NguoiDungID, BaiHatID, NoiDung, BinhLuanChaID, ThoiGian) VALUES (?, ?, ?, ?, NOW())",
      [userId, songId, text, parent || null]
    );
    const newId = ins.insertId;

    const [userRows] = await conn.execute(
      "SELECT COALESCE(TenHienThi, TenDangNhap, 'User') as userName FROM nguoidung WHERE NguoiDungID = ? LIMIT 1",
      [userId]
    );

    await conn.commit();
    res.status(201).json({
      id: newId,
      songId: Number(songId),
      userId: Number(userId),
      userName: userRows?.[0]?.userName || "User",
      content: text,
      createdAt: new Date().toISOString(),
      parentId: parent,
    });
  } catch (error) {
    await conn.rollback().catch(() => {});
    console.error("Error post comment:", error);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    conn.release();
  }
});

// =======================================================
// Likes (theo tài khoản) - phục vụ icon Like (LuotThich)
// Bảng: baihatyeuthich (NguoiDungID, BaiHatID, NgayThem)
// Counter: baihat.LuotThich
// =======================================================

// Batch check like status
// POST /api/songs/like-status  body: { songIds: number[] }
router.post("/songs/like-status", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const songIds = Array.isArray(req.body?.songIds) ? req.body.songIds : [];

    if (songIds.length === 0) {
      return res.json({ likedSongIds: [] });
    }
    if (songIds.length > 200) {
      return res.status(400).json({ error: "Quá nhiều songIds (tối đa 200)" });
    }

    const placeholders = songIds.map(() => "?").join(",");
    const params = [userId, ...songIds];

    const [rows] = await pool.execute(
      `SELECT BaiHatID as songId
       FROM baihatyeuthich
       WHERE NguoiDungID = ?
         AND BaiHatID IN (${placeholders})`,
      params
    );

    res.json({ likedSongIds: rows.map((r) => Number(r.songId)) });
  } catch (error) {
    console.error("Error like-status:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Like (idempotent): nếu đã like rồi thì không cộng thêm
router.post("/songs/:songId/like", authenticateToken, async (req, res) => {
  const songId = req.params.songId;
  const userId = req.user.userId;
  let conn;
  try {
    if (!songId) return res.status(400).json({ error: "Thiếu songId" });

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [exists] = await conn.execute(
      "SELECT 1 FROM baihatyeuthich WHERE NguoiDungID = ? AND BaiHatID = ? LIMIT 1",
      [userId, songId]
    );

    if (exists.length === 0) {
      await conn.execute(
        "INSERT INTO baihatyeuthich (NguoiDungID, BaiHatID) VALUES (?, ?)",
        [userId, songId]
      );
      await conn.execute(
        "UPDATE baihat SET LuotThich = IFNULL(LuotThich, 0) + 1 WHERE BaiHatID = ?",
        [songId]
      );
    }

    const [rows] = await conn.execute(
      "SELECT IFNULL(LuotThich, 0) as likeCount FROM baihat WHERE BaiHatID = ? LIMIT 1",
      [songId]
    );

    await conn.commit();
    res.json({
      message: exists.length === 0 ? "Đã thích" : "Đã thích trước đó",
      isLiked: true,
      likeCount: Number(rows?.[0]?.likeCount || 0),
    });
  } catch (error) {
    if (conn) await conn.rollback().catch(() => {});
    // Duplicate key => đã like rồi (idempotent)
    if (error?.code === "ER_DUP_ENTRY") {
      try {
        const [rows] = await pool.execute(
          "SELECT IFNULL(LuotThich, 0) as likeCount FROM baihat WHERE BaiHatID = ? LIMIT 1",
          [songId]
        );
        return res.json({
          message: "Đã thích trước đó",
          isLiked: true,
          likeCount: Number(rows?.[0]?.likeCount || 0),
        });
      } catch (_) {
        return res.json({
          message: "Đã thích trước đó",
          isLiked: true,
          likeCount: null,
        });
      }
    }
    console.error("Error like song:", error);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    if (conn) conn.release();
  }
});

// Unlike (idempotent): nếu chưa like thì không trừ
router.post("/songs/:songId/unlike", authenticateToken, async (req, res) => {
  const songId = req.params.songId;
  const userId = req.user.userId;
  let conn;
  try {
    if (!songId) return res.status(400).json({ error: "Thiếu songId" });

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [exists] = await conn.execute(
      "SELECT 1 FROM baihatyeuthich WHERE NguoiDungID = ? AND BaiHatID = ? LIMIT 1",
      [userId, songId]
    );

    if (exists.length > 0) {
      await conn.execute(
        "DELETE FROM baihatyeuthich WHERE NguoiDungID = ? AND BaiHatID = ?",
        [userId, songId]
      );
      await conn.execute(
        "UPDATE baihat SET LuotThich = GREATEST(IFNULL(LuotThich, 0) - 1, 0) WHERE BaiHatID = ?",
        [songId]
      );
    }

    const [rows] = await conn.execute(
      "SELECT IFNULL(LuotThich, 0) as likeCount FROM baihat WHERE BaiHatID = ? LIMIT 1",
      [songId]
    );

    await conn.commit();
    res.json({
      message: exists.length > 0 ? "Đã bỏ thích" : "Chưa thích trước đó",
      isLiked: false,
      likeCount: Number(rows?.[0]?.likeCount || 0),
    });
  } catch (error) {
    if (conn) await conn.rollback().catch(() => {});
    console.error("Error unlike song:", error);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    if (conn) conn.release();
  }
});

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
  const conn = await pool.getConnection();
  try {
    const userId = req.user.userId;
    const songId = req.params.songId;

    await conn.beginTransaction();

    const [exists] = await conn.execute(
      "SELECT 1 FROM baihatyeuthich WHERE NguoiDungID = ? AND BaiHatID = ? LIMIT 1",
      [userId, songId]
    );

    if (exists.length > 0) {
      await conn.execute(
        "DELETE FROM baihatyeuthich WHERE NguoiDungID = ? AND BaiHatID = ?",
        [userId, songId]
      );
      await conn.execute(
        "UPDATE baihat SET LuotThich = GREATEST(IFNULL(LuotThich, 0) - 1, 0) WHERE BaiHatID = ?",
        [songId]
      );
      const [rows] = await conn.execute(
        "SELECT IFNULL(LuotThich, 0) as likeCount FROM baihat WHERE BaiHatID = ? LIMIT 1",
        [songId]
      );
      await conn.commit();
      return res.json({
        message: "Đã bỏ thích",
        isLiked: false,
        likeCount: Number(rows?.[0]?.likeCount || 0),
      });
    }

    await conn.execute(
      "INSERT INTO baihatyeuthich (NguoiDungID, BaiHatID) VALUES (?, ?)",
      [userId, songId]
    );
    await conn.execute(
      "UPDATE baihat SET LuotThich = IFNULL(LuotThich, 0) + 1 WHERE BaiHatID = ?",
      [songId]
    );
    const [rows] = await conn.execute(
      "SELECT IFNULL(LuotThich, 0) as likeCount FROM baihat WHERE BaiHatID = ? LIMIT 1",
      [songId]
    );
    await conn.commit();
    return res.json({
      message: "Đã thích",
      isLiked: true,
      likeCount: Number(rows?.[0]?.likeCount || 0),
    });
  } catch (error) {
    await conn.rollback().catch(() => {});
    console.error("Error toggle favorite:", error);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    conn.release();
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
      SELECT d.DanhSachID as id,
             d.Ten as name,
             d.MoTa as description,
             d.NgayTao as createdAt,
             (
               SELECT GROUP_CONCAT(x.AnhBiaBaiHat SEPARATOR ',')
               FROM (
                 SELECT b.AnhBiaBaiHat
                 FROM danhsach_baihat db
                 JOIN baihat b ON db.BaiHatID = b.BaiHatID
                 WHERE db.DanhSachID = d.DanhSachID
                 ORDER BY db.ThuTu ASC
                 LIMIT 4
               ) x
             ) as coverFiles
      FROM danhsachphat
      d
      WHERE d.NguoiDungID = ?
      ORDER BY d.NgayTao DESC
    `,
      [userId]
    );

    const data = rows.map((r) => {
      const coverImages = String(r.coverFiles || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((f) => `${BASE_URL}/api/image/song/${f}`);

      return {
        id: r.id,
        name: r.name,
        description: r.description,
        createdAt: r.createdAt,
        coverImage:
          "https://placehold.co/300x300/2f2739/ffffff?text=" +
          encodeURIComponent(r.name || "Playlist"),
        coverImages,
      };
    });

    res.json(data);
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

// Xóa bài hát khỏi playlist
// DELETE /api/playlists/:playlistId/songs/:songId
router.delete(
  "/playlists/:playlistId/songs/:songId",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const playlistId = req.params.playlistId;
      const songId = req.params.songId;

      const [playlist] = await pool.execute(
        "SELECT DanhSachID FROM danhsachphat WHERE DanhSachID = ? AND NguoiDungID = ?",
        [playlistId, userId]
      );
      if (!playlist || playlist.length === 0) {
        return res
          .status(404)
          .json({ error: "Playlist không tồn tại hoặc không có quyền" });
      }

      const [result] = await pool.execute(
        "DELETE FROM danhsach_baihat WHERE DanhSachID = ? AND BaiHatID = ?",
        [playlistId, songId]
      );

      if (!result || result.affectedRows === 0) {
        return res
          .status(404)
          .json({ error: "Bài hát không có trong playlist" });
      }

      res.json({ message: "Đã xóa bài hát khỏi playlist" });
    } catch (error) {
      console.error("Error removing song from playlist:", error);
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
      coverImages: songs
        .map((s) => s.imageUrl)
        .filter(Boolean)
        .slice(0, 4),
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

    // Thêm flag cho FE: chỉ cho phép hạ gói trong 7 ngày đầu kể từ ngày user đăng ký
    const [userRows] = await pool.execute(
      "SELECT NgayThamGia FROM nguoidung WHERE NguoiDungID = ? LIMIT 1",
      [userId]
    );
    const joinDate = userRows?.[0]?.NgayThamGia
      ? new Date(userRows[0].NgayThamGia)
      : null;
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const nowMs = Date.now();
    const canDowngrade =
      !joinDate || Number.isNaN(joinDate.getTime())
        ? true
        : nowMs - joinDate.getTime() <= SEVEN_DAYS_MS;
    const joinDateISO =
      joinDate && !Number.isNaN(joinDate.getTime())
        ? joinDate.toISOString()
        : null;

    const [rows] = await pool.execute(
      `
      SELECT dk.DangKyID, dk.NgayHetHan, g.GoiID, g.Ten as TenGoi, g.Gia, q.KhongQuangCao
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
        packageId: sub.GoiID,
        packagePrice: Number(sub.Gia || 0),
        canDowngrade,
        joinDate: joinDateISO,
      });
    } else {
      res.json({
        isVip: false,
        planName: "Miễn Phí",
        expiryDate: null,
        daysLeft: 0,
        packageId: null,
        packagePrice: 0,
        canDowngrade,
        joinDate: joinDateISO,
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
