const express = require("express");
const pool = require("../db");
const { BASE_URL } = require("../config");

const router = express.Router();

// Gợi ý
router.get("/suggestions", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        b.BaiHatID as id, 
        b.TieuDe as title, 
        b.AnhBiaBaiHat as imageUrl,
        GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
        b.DuongDanAudio as audioUrl,
        IFNULL(b.LuotPhat, 0) as listenCount, 
        IFNULL(b.LuotThich, 0) as likeCount
      FROM baihat b
      LEFT JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
      LEFT JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
      GROUP BY b.BaiHatID
      ORDER BY RAND()
      LIMIT 9
    `);

    const data = rows.map((row) => ({
      id: row.id,
      title: row.title,
      artists: row.artists || "Unknown Artist",
      imageUrl: row.imageUrl
        ? `${BASE_URL}/api/image/song/${row.imageUrl}`
        : "https://placehold.co/300x300/7a3c9e/ffffff?text=No+Image",
      audioUrl: row.audioUrl ? `${BASE_URL}/api/audio/${row.audioUrl}` : null,
      listenCount: Number(row.listenCount),
      likeCount: Number(row.likeCount),
    }));

    res.json(data);
  } catch (error) {
    console.error("Error suggestions:", error);
    res.json([]);
  }
});

// Tìm kiếm
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json([]);
    const searchTerm = `%${query}%`;

    const [rows] = await pool.execute(
      `
      SELECT b.BaiHatID as id, b.TieuDe as title, b.AnhBiaBaiHat as imageUrl,
             GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
             b.DuongDanAudio as audioUrl
      FROM baihat b
      JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
      JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
      WHERE b.TieuDe LIKE ? OR n.TenNgheSi LIKE ?
      GROUP BY b.BaiHatID
      ORDER BY b.LuotPhat DESC
      LIMIT 10
    `,
      [searchTerm, searchTerm]
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
    console.error("Error search:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Bảng xếp hạng
router.get("/charts", async (req, res) => {
  try {
    const categoryRaw = String(req.query.category || "all").toLowerCase();
    const category = ["all", "vn", "foreign"].includes(categoryRaw)
      ? categoryRaw
      : "all";

    // Heuristic: "nhạc Việt" nếu title + artist có ký tự tiếng Việt (UTF8)
    const VI_REGEX =
      "[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]";
    // Nhạc Việt: chỉ cần title có dấu tiếng Việt HOẶC có ít nhất 1 nghệ sĩ có dấu tiếng Việt
    // (vì nhiều nghệ sĩ VN dùng stage name không dấu như "buitruonglinh", "Juky San")
    const vnCondition = `
      (b.TieuDe REGEXP ?)
      OR EXISTS (
        SELECT 1
        FROM baihat_nghesi bn2
        JOIN nghesi n2 ON bn2.NgheSiID = n2.NgheSiID
        WHERE bn2.BaiHatID = b.BaiHatID
          AND (n2.TenNgheSi REGEXP ?)
      )
    `;

    const whereSql =
      category === "vn"
        ? `WHERE ${vnCondition}`
        : category === "foreign"
        ? `WHERE NOT (${vnCondition})`
        : "";

    // vnCondition chỉ có 2 placeholder (title + artist)
    const whereParams = category === "all" ? [] : [VI_REGEX, VI_REGEX];

    // NOTE: dùng LEFT JOIN để không mất bài thiếu nghệ sĩ (nếu có), artists sẽ fallback
    const [rows] = await pool.execute(
      `
      SELECT b.BaiHatID as id,
             b.TieuDe as title,
             b.AnhBiaBaiHat as cover,
             GROUP_CONCAT(DISTINCT n.TenNgheSi SEPARATOR ', ') as artists,
             b.DuongDanAudio as audioUrl,
             IFNULL(b.LuotPhat, 0) as LuotPhat
      FROM baihat b
      LEFT JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
      LEFT JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
      ${whereSql}
      GROUP BY b.BaiHatID
      ORDER BY b.LuotPhat DESC, b.BaiHatID DESC
      LIMIT 5
    `,
      whereParams
    );
    const data = rows.map((item, index) => ({
      ...item,
      rank: index + 1,
      artists: item.artists || "Unknown Artist",
      cover: item.cover
        ? `${BASE_URL}/api/image/song/${item.cover}`
        : "https://placehold.co/60x60/a64883/fff?text=No+Image",
      audioUrl: item.audioUrl ? `${BASE_URL}/api/audio/${item.audioUrl}` : null,
    }));
    res.json(data);
  } catch (error) {
    console.error("Error charts:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Bảng xếp hạng - TẤT CẢ (phân trang)
router.get("/charts/all", async (req, res) => {
  try {
    const categoryRaw = String(req.query.category || "all").toLowerCase();
    const category = ["all", "vn", "foreign"].includes(categoryRaw)
      ? categoryRaw
      : "all";

    let page = parseInt(req.query.page, 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    let limit = parseInt(req.query.limit, 10);
    if (Number.isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;
    const offset = (page - 1) * limit;

    const VI_REGEX =
      "[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]";
    // Nhạc Việt: chỉ cần title có dấu tiếng Việt HOẶC có ít nhất 1 nghệ sĩ có dấu tiếng Việt
    const vnCondition = `
      (b.TieuDe REGEXP ?)
      OR EXISTS (
        SELECT 1
        FROM baihat_nghesi bn2
        JOIN nghesi n2 ON bn2.NgheSiID = n2.NgheSiID
        WHERE bn2.BaiHatID = b.BaiHatID
          AND (n2.TenNgheSi REGEXP ?)
      )
    `;

    const whereSql =
      category === "vn"
        ? `WHERE ${vnCondition}`
        : category === "foreign"
        ? `WHERE NOT (${vnCondition})`
        : "";
    // vnCondition chỉ có 2 placeholder (title + artist)
    const whereParams = category === "all" ? [] : [VI_REGEX, VI_REGEX];

    const [rows] = await pool.execute(
      `
      SELECT b.BaiHatID as id,
             b.TieuDe as title,
             b.AnhBiaBaiHat as cover,
             GROUP_CONCAT(DISTINCT n.TenNgheSi SEPARATOR ', ') as artists,
             b.DuongDanAudio as audioUrl,
             IFNULL(b.LuotPhat, 0) as listenCount
      FROM baihat b
      LEFT JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
      LEFT JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
      ${whereSql}
      GROUP BY b.BaiHatID
      ORDER BY b.LuotPhat DESC, b.BaiHatID DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
      whereParams
    );

    const [countRows] = await pool.execute(
      `
      SELECT COUNT(*) as total
      FROM baihat b
      ${whereSql}
    `,
      whereParams
    );
    const total = Number(countRows?.[0]?.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const data = rows.map((item, idx) => ({
      ...item,
      rank: offset + idx + 1,
      artists: item.artists || "Unknown Artist",
      cover: item.cover
        ? `${BASE_URL}/api/image/song/${item.cover}`
        : "https://placehold.co/60x60/a64883/fff?text=No+Image",
      audioUrl: item.audioUrl ? `${BASE_URL}/api/audio/${item.audioUrl}` : null,
    }));

    res.json({
      category,
      data,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    console.error("Error charts all:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Albums
router.get("/albums", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
            SELECT a.AlbumID as id, a.TieuDe as title, a.AnhBia as imageUrl,
                   GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists
            FROM album a
            LEFT JOIN album_nghesi an ON a.AlbumID = an.AlbumID
            LEFT JOIN nghesi n ON an.NgheSiID = n.NgheSiID
            GROUP BY a.AlbumID
            ORDER BY a.NgayPhatHanh DESC
            LIMIT 5
        `);
    const data = rows.map((row) => ({
      ...row,
      imageUrl: row.imageUrl
        ? `${BASE_URL}/api/image/album/${row.imageUrl}`
        : "https://placehold.co/300x300/4a90e2/ffffff?text=No+Image",
    }));
    res.json(data);
  } catch (error) {
    console.error("Error albums:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Album Detail
router.get("/album/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [albumRows] = await pool.execute(
      `
            SELECT a.AlbumID as id, a.TieuDe as title, a.NgayPhatHanh as releaseDate, a.AnhBia as imageUrl,
                   GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists
            FROM album a
            LEFT JOIN album_nghesi an ON a.AlbumID = an.AlbumID
            LEFT JOIN nghesi n ON an.NgheSiID = n.NgheSiID
            WHERE a.AlbumID = ?
            GROUP BY a.AlbumID
        `,
      [id]
    );

    if (albumRows.length === 0)
      return res.status(404).json({ error: "Album not found" });

    const [songs] = await pool.execute(
      `
            SELECT b.BaiHatID as id, b.TieuDe as title, b.AnhBiaBaiHat as imageUrl,
                   GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
                   b.DuongDanAudio as audioUrl,
                   IFNULL(b.LuotPhat, 0) as listenCount,
                   IFNULL(b.LuotThich, 0) as likeCount
            FROM baihat b
            JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
            JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
            WHERE b.AlbumID = ?
            GROUP BY b.BaiHatID
        `,
      [id]
    );

    const albumData = {
      ...albumRows[0],
      imageUrl: albumRows[0].imageUrl
        ? `${BASE_URL}/api/image/album/${albumRows[0].imageUrl}`
        : "https://placehold.co/300x300/4a90e2/ffffff?text=No+Image",
    };
    const songData = songs.map((s) => ({
      ...s,
      imageUrl: s.imageUrl
        ? `${BASE_URL}/api/image/song/${s.imageUrl}`
        : "https://placehold.co/60x60/7a3c9e/ffffff?text=No+Image",
      audioUrl: s.audioUrl ? `${BASE_URL}/api/audio/${s.audioUrl}` : null,
    }));

    res.json({ album: albumData, songs: songData });
  } catch (error) {
    console.error("Error album detail:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Like song (tăng lượt thích)
router.post("/songs/:songId/like", async (req, res) => {
  try {
    const { songId } = req.params;

    if (!songId) {
      return res.status(400).json({ error: "Thiếu songId" });
    }

    // Tăng LuotThich lên 1
    const [result] = await pool.execute(
      "UPDATE baihat SET LuotThich = IFNULL(LuotThich, 0) + 1 WHERE BaiHatID = ?",
      [songId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Bài hát không tồn tại" });
    }

    const [rows] = await pool.execute(
      "SELECT IFNULL(LuotThich, 0) as likeCount FROM baihat WHERE BaiHatID = ? LIMIT 1",
      [songId]
    );

    res.json({
      message: "Đã tăng lượt thích",
      likeCount: Number(rows?.[0]?.likeCount || 0),
    });
  } catch (error) {
    console.error("Error like song:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Unlike song (giảm lượt thích)
router.post("/songs/:songId/unlike", async (req, res) => {
  try {
    const { songId } = req.params;

    if (!songId) {
      return res.status(400).json({ error: "Thiếu songId" });
    }

    // Giảm LuotThich xuống 1 nhưng không âm
    const [result] = await pool.execute(
      "UPDATE baihat SET LuotThich = GREATEST(IFNULL(LuotThich, 0) - 1, 0) WHERE BaiHatID = ?",
      [songId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Bài hát không tồn tại" });
    }

    const [rows] = await pool.execute(
      "SELECT IFNULL(LuotThich, 0) as likeCount FROM baihat WHERE BaiHatID = ? LIMIT 1",
      [songId]
    );

    res.json({
      message: "Đã bỏ thích",
      likeCount: Number(rows?.[0]?.likeCount || 0),
    });
  } catch (error) {
    console.error("Error unlike song:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Partners
router.get("/partners", (req, res) => {
  res.json([
    {
      id: 1,
      name: "Universal",
      logoUrl: "https://placehold.co/150x80/2f2739/a0a0a0?text=Universal",
    },
    {
      id: 2,
      name: "Sony Music",
      logoUrl: "https://placehold.co/150x80/2f2739/a0a0a0?text=Sony+Music",
    },
    {
      id: 3,
      name: "FUGA",
      logoUrl: "https://placehold.co/150x80/2f2739/a0a0a0?text=FUGA",
    },
    {
      id: 4,
      name: "Kakao M",
      logoUrl: "https://placehold.co/150x80/2f2739/a0a0a0?text=Kakao+M",
    },
    {
      id: 5,
      name: "Monstercat",
      logoUrl: "https://placehold.co/150x80/2f2739/a0a0a0?text=Monstercat",
    },
  ]);
});

module.exports = router;
