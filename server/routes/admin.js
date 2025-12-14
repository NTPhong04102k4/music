const express = require("express");
const router = express.Router();
const pool = require("../db"); // Import kết nối DB từ thư mục cha
const BASE_URL = "http://localhost:5001";
const { createPublicImageUpload } = require("../middleware/publicImageUpload");
const multer = require("multer");
const { fetchWrap } = require("../utils/fetchWrap");
const { lrcToPlain } = require("../utils/lyricsSync");

const albumCoverUpload = createPublicImageUpload("album");
const artistAvatarUpload = createPublicImageUpload("artist");

async function translateGoogleFree(text, targetLang) {
  const input = String(text || "");
  if (!input.trim()) return "";
  const q = input.length > 8000 ? input.slice(0, 8000) : input;
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&dt=t&tl=" +
    encodeURIComponent(targetLang) +
    "&q=" +
    encodeURIComponent(q);
  const res = await fetchWrap(url);
  if (!res.ok) return "";
  const data = await res.json().catch(() => null);
  const parts = Array.isArray(data?.[0]) ? data[0] : [];
  return parts.map((p) => (Array.isArray(p) ? p[0] : "")).join("");
}

async function ensureLyricsTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS loibaihat (
      BaiHatID INT NOT NULL,
      LrcText LONGTEXT NULL,
      PlainText LONGTEXT NULL,
      LyricsVI LONGTEXT NULL,
      LyricsEN LONGTEXT NULL,
      UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (BaiHatID)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

const lyricsUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});
// === MIDDLEWARE KIỂM TRA QUYỀN ADMIN ===
const checkAdmin = (req, res, next) => {
  // req.user được tạo ra từ middleware authenticateToken (mount ở app.js)
  // Cần đảm bảo khi login bạn đã lưu 'role' vào token
  const role = String(req.user?.role || "").toLowerCase();
  if (req.user && role === "admin") {
    next(); // Cho phép đi tiếp
  } else {
    return res
      .status(403)
      .json({ error: "Truy cập bị từ chối. Chỉ dành cho Admin." });
  }
};

// Áp dụng middleware cho toàn bộ router này
router.use(checkAdmin);

// ==========================================
// 1. API THỐNG KÊ (DASHBOARD)
// ==========================================
router.get("/stats", async (req, res) => {
  try {
    // Đếm tổng số bài hát
    const [songRows] = await pool.execute(
      "SELECT COUNT(*) as count FROM baihat"
    );

    // Đếm tổng số album
    const [albumRows] = await pool.execute(
      "SELECT COUNT(*) as count FROM album"
    );

    // Đếm tổng số người dùng
    const [userRows] = await pool.execute(
      "SELECT COUNT(*) as count FROM nguoidung"
    );

    // Tính tổng doanh thu (chỉ tính hóa đơn đã thanh toán 'paid' hoặc 'completed')
    const [revenueRows] = await pool.execute(`
            SELECT COALESCE(SUM(TongTien), 0) as total 
            FROM hoadon 
            WHERE TrangThai = 'paid' OR TrangThai = 'completed'
        `);

    res.json({
      totalSongs: songRows[0].count,
      totalAlbums: albumRows[0].count,
      totalUsers: userRows[0].count,
      totalRevenue: parseFloat(revenueRows[0].total),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Lỗi server khi lấy thống kê" });
  }
});

// ==========================================
// 1.1 API CHART (DASHBOARD)
// ==========================================
// GET /api/admin/dashboard-charts?months=12
router.get("/dashboard-charts", async (req, res) => {
  try {
    let months = parseInt(req.query.months, 10);
    if (Number.isNaN(months) || months < 1) months = 12;
    if (months > 24) months = 24;

    // Lấy từ đầu tháng (months-1) về trước đến hiện tại để lên trục thời gian theo tháng
    const now = new Date();
    const start = new Date(
      now.getFullYear(),
      now.getMonth() - (months - 1),
      1,
      0,
      0,
      0
    );

    const formatYM = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      return `${y}-${m}`;
    };

    const labelsYM = [];
    const cursor = new Date(start);
    for (let i = 0; i < months; i++) {
      labelsYM.push(formatYM(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }

    // Doanh thu theo tháng (paid/completed)
    const [revenueRows] = await pool.execute(
      `
      SELECT DATE_FORMAT(NgayLap, '%Y-%m') as ym, COALESCE(SUM(TongTien), 0) as total
      FROM hoadon
      WHERE (TrangThai = 'paid' OR TrangThai = 'completed')
        AND NgayLap >= ?
      GROUP BY ym
      ORDER BY ym ASC
    `,
      [start]
    );

    // Người dùng đăng ký theo tháng
    const [userRows] = await pool.execute(
      `
      SELECT DATE_FORMAT(NgayThamGia, '%Y-%m') as ym, COUNT(*) as count
      FROM nguoidung
      WHERE NgayThamGia >= ?
      GROUP BY ym
      ORDER BY ym ASC
    `,
      [start]
    );

    const revenueMap = new Map(
      (revenueRows || []).map((r) => [String(r.ym), Number(r.total || 0)])
    );
    const usersMap = new Map(
      (userRows || []).map((r) => [String(r.ym), Number(r.count || 0)])
    );

    // Label hiển thị dạng MM/YYYY
    const displayLabels = labelsYM.map((ym) => {
      const [y, m] = ym.split("-");
      return `${m}/${y}`;
    });

    const revenueValues = labelsYM.map((ym) => revenueMap.get(ym) || 0);
    const userValues = labelsYM.map((ym) => usersMap.get(ym) || 0);

    res.json({
      months,
      revenue: { labels: displayLabels, values: revenueValues },
      users: { labels: displayLabels, values: userValues },
    });
  } catch (error) {
    console.error("Admin dashboard charts error:", error);
    res.status(500).json({ error: "Lỗi server khi lấy dữ liệu chart" });
  }
});

// ==========================================
// 2. API QUẢN LÝ BÀI HÁT
// ==========================================

// Lấy danh sách tất cả bài hát (có thể thêm phân trang LIMIT/OFFSET sau này)
router.get("/songs", async (req, res) => {
  try {
    // 1. Lấy tham số phân trang từ query string và kiểm tra tính hợp lệ
    let page = parseInt(req.query.page, 10);
    if (isNaN(page) || page < 1) page = 1;
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit < 1) limit = 10;
    const offset = (page - 1) * limit;

    console.log("Debug pagination params:", { page, limit, offset });

    //2. Lấy danh sách bài hát, truyền trực tiếp giá trị limit và offset vào chuỗi SQL
    const sql = `
            SELECT b.BaiHatID as id, b.TieuDe as title, b.AnhBiaBaiHat as imageUrl,
                   b.DuongDanAudio as audioUrl,
                   GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
                   b.LuotPhat as listenCount, b.LuotThich as likeCount,
                   b.NgayPhatHanh as releaseDate
            FROM baihat b
            LEFT JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
            LEFT JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
            GROUP BY b.BaiHatID
            ORDER BY b.BaiHatID DESC
            LIMIT ${limit} OFFSET ${offset}
        `;
    const [rows] = await pool.execute(sql);

    const updatedRows = rows.map((song) => {
      return {
        ...song,
        imageUrl: song.imageUrl
          ? `${BASE_URL}/api/image/song/${song.imageUrl}`
          : null,
        audioUrl: song.audioUrl
          ? `${BASE_URL}/api/audio/${song.audioUrl}`
          : null,
      };
    });

    // 3. Truy vấn đếm tổng số bài hát để tính tổng số trang
    const [countResult] = await pool.execute(
      "SELECT COUNT(*) as total FROM baihat"
    );
    const totalSongs = countResult[0].total;
    const totalPages = Math.ceil(totalSongs / limit);

    // 4. Trả về kết quả kèm thông tin phân trang
    res.json({
      data: updatedRows,
      pagination: {
        page,
        limit,
        totalSongs,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Admin get songs error:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách bài hát" });
  }
});

// Thêm bài hát mới (Cần mở rộng để xử lý upload file thật sự)
router.post("/songs", async (req, res) => {
  const { title, artist, audioUrl, imageUrl } = req.body;

  if (!title || !audioUrl) {
    return res
      .status(400)
      .json({ error: "Tên bài hát và đường dẫn nhạc là bắt buộc" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction(); // Bắt đầu transaction

    // 1. Insert bài hát
    const [songResult] = await connection.execute(
      "INSERT INTO baihat (TieuDe, DuongDanAudio, AnhBiaBaiHat, NgayPhatHanh) VALUES (?, ?, ?, NOW())",
      [title, audioUrl, imageUrl || null]
    );
    const songId = songResult.insertId;

    // 2. Xử lý Nghệ sĩ (nếu có nhập)
    if (artist && artist.trim() !== "") {
      const artistName = artist.trim();

      // Kiểm tra nghệ sĩ đã tồn tại chưa
      const [artistRows] = await connection.execute(
        "SELECT NgheSiID FROM nghesi WHERE TenNgheSi = ?",
        [artistName]
      );

      let artistId;
      if (artistRows.length > 0) {
        // Đã tồn tại
        artistId = artistRows[0].NgheSiID;
      } else {
        // Chưa tồn tại -> Tạo mới
        const [newArtistResult] = await connection.execute(
          "INSERT INTO nghesi (TenNgheSi) VALUES (?)",
          [artistName]
        );
        artistId = newArtistResult.insertId;
      }

      // 3. Liên kết Bài hát - Nghệ sĩ
      await connection.execute(
        "INSERT INTO baihat_nghesi (BaiHatID, NgheSiID) VALUES (?, ?)",
        [songId, artistId]
      );
    }

    await connection.commit(); // Lưu thay đổi
    res.json({ message: "Thêm bài hát thành công", id: songId });
  } catch (error) {
    await connection.rollback(); // Hoàn tác nếu lỗi
    console.error("Add song error:", error);
    res.status(500).json({ error: "Lỗi khi thêm bài hát: " + error.message });
  } finally {
    connection.release();
  }
});
// API Sửa bài hát
router.put("/songs/:id", async (req, res) => {
  const songId = req.params.id;
  const { title, artist, audioUrl, imageUrl } = req.body;

  if (!title || !audioUrl) {
    return res
      .status(400)
      .json({ error: "Tên bài hát và đường dẫn nhạc là bắt buộc" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Cập nhật bảng bài hát
    await connection.execute(
      "UPDATE baihat SET TieuDe = ?, DuongDanAudio = ?, AnhBiaBaiHat = ? WHERE BaiHatID = ?",
      [title, audioUrl, imageUrl || null, songId]
    );

    // 2. Cập nhật nghệ sĩ (Logic phức tạp hơn chút: Nếu đổi nghệ sĩ thì phải cập nhật bảng nối)
    if (artist && artist.trim() !== "") {
      const artistName = artist.trim();

      // Tìm ID nghệ sĩ (hoặc tạo mới nếu chưa có)
      let [artistRows] = await connection.execute(
        "SELECT NgheSiID FROM nghesi WHERE TenNgheSi = ?",
        [artistName]
      );
      let artistId;

      if (artistRows.length > 0) {
        artistId = artistRows[0].NgheSiID;
      } else {
        const [newArtist] = await connection.execute(
          "INSERT INTO nghesi (TenNgheSi) VALUES (?)",
          [artistName]
        );
        artistId = newArtist.insertId;
      }

      // Cập nhật bảng nối baihat_nghesi
      // Đầu tiên xóa liên kết cũ (nếu có)
      await connection.execute("DELETE FROM baihat_nghesi WHERE BaiHatID = ?", [
        songId,
      ]);

      // Thêm liên kết mới
      await connection.execute(
        "INSERT INTO baihat_nghesi (BaiHatID, NgheSiID) VALUES (?, ?)",
        [songId, artistId]
      );
    } else {
      // Nếu xóa tên nghệ sĩ -> Xóa liên kết
      await connection.execute("DELETE FROM baihat_nghesi WHERE BaiHatID = ?", [
        songId,
      ]);
    }

    await connection.commit();
    res.json({ message: "Cập nhật bài hát thành công" });
  } catch (error) {
    await connection.rollback();
    console.error("Update song error:", error);
    res.status(500).json({ error: "Lỗi khi cập nhật bài hát" });
  } finally {
    connection.release();
  }
});

// Xóa bài hát
router.delete("/songs/:id", async (req, res) => {
  const songId = req.params.id;
  try {
    await pool.execute("DELETE FROM baihat WHERE BaiHatID = ?", [songId]);
    res.json({ message: `Đã xóa bài hát ID ${songId}` });
  } catch (error) {
    console.error("Delete song error:", error);
    res.status(500).json({ error: "Lỗi khi xóa bài hát" });
  }
});

// ==========================================
// 2.x. API LỜI BÀI HÁT (LRC sync like YouTube)
// ==========================================

// GET /api/admin/songs/:id/lyrics
router.get("/songs/:id/lyrics", async (req, res) => {
  const songId = Number(req.params.id);
  if (!songId) return res.status(400).json({ error: "songId không hợp lệ" });

  try {
    await ensureLyricsTable();
    const [rows] = await pool.execute(
      "SELECT BaiHatID, LrcText, PlainText, LyricsVI, LyricsEN, UpdatedAt FROM loibaihat WHERE BaiHatID = ?",
      [songId]
    );
    if (!rows || rows.length === 0) {
      return res.json({
        songId,
        lrc: null,
        original: null,
        vi: null,
        en: null,
        updatedAt: null,
      });
    }

    const row = rows[0];
    res.json({
      songId,
      lrc: row.LrcText ? String(row.LrcText) : null,
      original: row.PlainText ? String(row.PlainText) : null,
      vi: row.LyricsVI ? String(row.LyricsVI) : null,
      en: row.LyricsEN ? String(row.LyricsEN) : null,
      updatedAt: row.UpdatedAt || null,
    });
  } catch (error) {
    console.error("Admin get lyrics error:", error);
    res.status(500).json({ error: "Lỗi server khi lấy lời bài hát" });
  }
});

// PUT /api/admin/songs/:id/lyrics (multipart: lrcFile)
router.put(
  "/songs/:id/lyrics",
  lyricsUpload.single("lrcFile"),
  async (req, res) => {
    const songId = Number(req.params.id);
    if (!songId) return res.status(400).json({ error: "songId không hợp lệ" });

    try {
      await ensureLyricsTable();

      const lrcFromBody = req.body?.lrc ? String(req.body.lrc) : "";
      const lrcFromFile = req.file?.buffer
        ? req.file.buffer.toString("utf8")
        : "";
      const lrcText = (lrcFromFile || lrcFromBody || "").trim();

      if (!lrcText) {
        return res.status(400).json({ error: "Thiếu nội dung LRC" });
      }

      const plainText = lrcToPlain(lrcText);

      const autoTranslate = String(req.body?.autoTranslate ?? "1") !== "0";
      const viOverride = req.body?.lyricsVi ? String(req.body.lyricsVi) : "";
      const enOverride = req.body?.lyricsEn ? String(req.body.lyricsEn) : "";

      let lyricsVi = viOverride;
      let lyricsEn = enOverride;

      if (autoTranslate && plainText.trim()) {
        const [vi, en] = await Promise.all([
          lyricsVi
            ? Promise.resolve(lyricsVi)
            : translateGoogleFree(plainText, "vi"),
          lyricsEn
            ? Promise.resolve(lyricsEn)
            : translateGoogleFree(plainText, "en"),
        ]);
        lyricsVi = vi || "";
        lyricsEn = en || "";
      }

      await pool.execute(
        `
          INSERT INTO loibaihat (BaiHatID, LrcText, PlainText, LyricsVI, LyricsEN)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            LrcText = VALUES(LrcText),
            PlainText = VALUES(PlainText),
            LyricsVI = VALUES(LyricsVI),
            LyricsEN = VALUES(LyricsEN),
            UpdatedAt = CURRENT_TIMESTAMP
        `,
        [songId, lrcText, plainText || null, lyricsVi || null, lyricsEn || null]
      );

      const [rows] = await pool.execute(
        "SELECT BaiHatID, LrcText, PlainText, LyricsVI, LyricsEN, UpdatedAt FROM loibaihat WHERE BaiHatID = ?",
        [songId]
      );
      const row = rows?.[0];

      res.json({
        message: "Đã cập nhật lyrics (LRC)",
        songId,
        lrc: row?.LrcText ? String(row.LrcText) : null,
        original: row?.PlainText ? String(row.PlainText) : null,
        vi: row?.LyricsVI ? String(row.LyricsVI) : null,
        en: row?.LyricsEN ? String(row.LyricsEN) : null,
        updatedAt: row?.UpdatedAt || null,
      });
    } catch (error) {
      console.error("Admin update lyrics error:", error);
      res.status(500).json({ error: "Lỗi server khi cập nhật lyrics" });
    }
  }
);

// ==========================================
// 3. API QUẢN LÝ NGƯỜI DÙNG
// ==========================================

// Lấy danh sách người dùng
router.get("/users", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
            SELECT NguoiDungID as id, TenDangNhap as username, Email as email, 
                   TenHienThi as displayName, TrangThai as status, NgayThamGia as joinDate
            FROM nguoidung 
            ORDER BY NgayThamGia DESC
        `);
    res.json(rows);
  } catch (error) {
    console.error("Admin get users error:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Khóa / Mở khóa người dùng
router.put("/users/:id/status", async (req, res) => {
  const userId = req.params.id;
  const { status } = req.body; // 'active' hoặc 'banned' (hoặc 'locked')

  if (!["active", "banned"].includes(status)) {
    return res.status(400).json({ error: "Trạng thái không hợp lệ" });
  }

  try {
    await pool.execute(
      "UPDATE nguoidung SET TrangThai = ? WHERE NguoiDungID = ?",
      [status, userId]
    );
    res.json({ message: `Cập nhật trạng thái user ${userId} thành ${status}` });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({ error: "Lỗi cập nhật trạng thái" });
  }
});

// ==========================================
// 4. API QUẢN LÝ ALBUM (CRUD + UPLOAD COVER)
// ==========================================

router.get("/albums", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT a.AlbumID as id,
             a.TieuDe as title,
             a.NgayPhatHanh as releaseDate,
             a.AnhBia as imageFile,
             GROUP_CONCAT(DISTINCT n.TenNgheSi ORDER BY n.TenNgheSi SEPARATOR ', ') as artists,
             GROUP_CONCAT(DISTINCT n.NgheSiID ORDER BY n.NgheSiID SEPARATOR ',') as artistIds
      FROM album a
      LEFT JOIN album_nghesi an ON a.AlbumID = an.AlbumID
      LEFT JOIN nghesi n ON an.NgheSiID = n.NgheSiID
      GROUP BY a.AlbumID
      ORDER BY a.AlbumID DESC
    `);

    const data = rows.map((r) => ({
      id: r.id,
      title: r.title,
      releaseDate: r.releaseDate,
      imageFile: r.imageFile,
      imageUrl: r.imageFile
        ? `${BASE_URL}/api/image/album/${r.imageFile}`
        : null,
      artists: r.artists || "",
      artistIds: r.artistIds
        ? String(r.artistIds)
            .split(",")
            .map((x) => parseInt(x, 10))
            .filter((x) => !Number.isNaN(x))
        : [],
    }));

    res.json(data);
  } catch (error) {
    console.error("Admin get albums error:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách album" });
  }
});

router.post("/albums", albumCoverUpload.single("cover"), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { title, releaseDate, artistIds } = req.body || {};
    if (!title) {
      await connection.rollback();
      return res.status(400).json({ error: "Thiếu tiêu đề album" });
    }

    const coverFile = req.file ? req.file.filename : null;

    const [result] = await connection.execute(
      "INSERT INTO album (TieuDe, NgayPhatHanh, AnhBia) VALUES (?, ?, ?)",
      [title, releaseDate || null, coverFile]
    );
    const albumId = result.insertId;

    // parse artistIds (JSON array or comma-separated string)
    let ids = [];
    if (
      artistIds !== undefined &&
      artistIds !== null &&
      String(artistIds).trim() !== ""
    ) {
      const raw = String(artistIds);
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) ids = parsed;
      } catch {
        ids = raw.split(",");
      }
      ids = ids.map((x) => parseInt(x, 10)).filter((x) => !Number.isNaN(x));
    }

    if (ids.length > 0) {
      for (const artistId of ids) {
        await connection.execute(
          "INSERT INTO album_nghesi (AlbumID, NgheSiID) VALUES (?, ?)",
          [albumId, artistId]
        );
      }
    }

    await connection.commit();
    res.json({ message: "Thêm album thành công", id: albumId });
  } catch (error) {
    await connection.rollback();
    console.error("Admin add album error:", error);
    res.status(500).json({ error: "Lỗi khi thêm album" });
  } finally {
    connection.release();
  }
});

router.put(
  "/albums/:id",
  albumCoverUpload.single("cover"),
  async (req, res) => {
    const albumId = req.params.id;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { title, releaseDate, artistIds } = req.body || {};
      if (!title) {
        await connection.rollback();
        return res.status(400).json({ error: "Thiếu tiêu đề album" });
      }

      const coverFile = req.file ? req.file.filename : null;

      if (coverFile) {
        await connection.execute(
          "UPDATE album SET TieuDe = ?, NgayPhatHanh = ?, AnhBia = ? WHERE AlbumID = ?",
          [title, releaseDate || null, coverFile, albumId]
        );
      } else {
        await connection.execute(
          "UPDATE album SET TieuDe = ?, NgayPhatHanh = ? WHERE AlbumID = ?",
          [title, releaseDate || null, albumId]
        );
      }

      // update album_nghesi
      await connection.execute("DELETE FROM album_nghesi WHERE AlbumID = ?", [
        albumId,
      ]);

      let ids = [];
      if (
        artistIds !== undefined &&
        artistIds !== null &&
        String(artistIds).trim() !== ""
      ) {
        const raw = String(artistIds);
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) ids = parsed;
        } catch {
          ids = raw.split(",");
        }
        ids = ids.map((x) => parseInt(x, 10)).filter((x) => !Number.isNaN(x));
      }

      if (ids.length > 0) {
        for (const artistId of ids) {
          await connection.execute(
            "INSERT INTO album_nghesi (AlbumID, NgheSiID) VALUES (?, ?)",
            [albumId, artistId]
          );
        }
      }

      await connection.commit();
      res.json({ message: "Cập nhật album thành công" });
    } catch (error) {
      await connection.rollback();
      console.error("Admin update album error:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật album" });
    } finally {
      connection.release();
    }
  }
);

router.delete("/albums/:id", async (req, res) => {
  const albumId = req.params.id;
  try {
    await pool.execute("DELETE FROM album WHERE AlbumID = ?", [albumId]);
    res.json({ message: `Đã xóa album ID ${albumId}` });
  } catch (error) {
    console.error("Admin delete album error:", error);
    res.status(500).json({ error: "Lỗi khi xóa album" });
  }
});

// ==========================================
// 5. API QUẢN LÝ NGHỆ SĨ (CRUD + UPLOAD AVATAR)
// ==========================================

router.get("/artists", async (req, res) => {
  try {
    let page = parseInt(req.query.page, 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    let limit = parseInt(req.query.limit, 10);
    if (Number.isNaN(limit) || limit < 1) limit = 5;
    if (limit > 50) limit = 50;
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute(`
      SELECT NgheSiID as id, TenNgheSi as name, TieuSu as bio, AnhDaiDien as avatarFile
      FROM nghesi
      ORDER BY NgheSiID DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const [countRows] = await pool.execute(
      "SELECT COUNT(*) as total FROM nghesi"
    );
    const total = Number(countRows?.[0]?.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const data = rows.map((r) => ({
      id: r.id,
      name: r.name,
      bio: r.bio || "",
      avatarFile: r.avatarFile,
      avatarUrl: r.avatarFile
        ? `${BASE_URL}/api/image/artist/${r.avatarFile}`
        : null,
    }));

    res.json({
      data,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    console.error("Admin get artists error:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách nghệ sĩ" });
  }
});

router.post(
  "/artists",
  artistAvatarUpload.single("avatar"),
  async (req, res) => {
    try {
      const { name, bio } = req.body || {};
      if (!name) return res.status(400).json({ error: "Thiếu tên nghệ sĩ" });

      const avatarFile = req.file ? req.file.filename : null;

      const [result] = await pool.execute(
        "INSERT INTO nghesi (TenNgheSi, TieuSu, AnhDaiDien) VALUES (?, ?, ?)",
        [name, bio || null, avatarFile]
      );

      res.json({ message: "Thêm nghệ sĩ thành công", id: result.insertId });
    } catch (error) {
      console.error("Admin add artist error:", error);
      if (String(error?.code) === "ER_DUP_ENTRY") {
        return res.status(400).json({ error: "Tên nghệ sĩ đã tồn tại" });
      }
      res.status(500).json({ error: "Lỗi khi thêm nghệ sĩ" });
    }
  }
);

router.put(
  "/artists/:id",
  artistAvatarUpload.single("avatar"),
  async (req, res) => {
    try {
      const artistId = req.params.id;
      const { name, bio } = req.body || {};
      if (!name) return res.status(400).json({ error: "Thiếu tên nghệ sĩ" });

      const avatarFile = req.file ? req.file.filename : null;

      if (avatarFile) {
        await pool.execute(
          "UPDATE nghesi SET TenNgheSi = ?, TieuSu = ?, AnhDaiDien = ? WHERE NgheSiID = ?",
          [name, bio || null, avatarFile, artistId]
        );
      } else {
        await pool.execute(
          "UPDATE nghesi SET TenNgheSi = ?, TieuSu = ? WHERE NgheSiID = ?",
          [name, bio || null, artistId]
        );
      }

      res.json({ message: "Cập nhật nghệ sĩ thành công" });
    } catch (error) {
      console.error("Admin update artist error:", error);
      if (String(error?.code) === "ER_DUP_ENTRY") {
        return res.status(400).json({ error: "Tên nghệ sĩ đã tồn tại" });
      }
      res.status(500).json({ error: "Lỗi khi cập nhật nghệ sĩ" });
    }
  }
);

router.delete("/artists/:id", async (req, res) => {
  const artistId = req.params.id;
  try {
    await pool.execute("DELETE FROM nghesi WHERE NgheSiID = ?", [artistId]);
    res.json({ message: `Đã xóa nghệ sĩ ID ${artistId}` });
  } catch (error) {
    console.error("Admin delete artist error:", error);
    res.status(500).json({ error: "Lỗi khi xóa nghệ sĩ" });
  }
});

module.exports = router;
