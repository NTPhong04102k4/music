const express = require("express");
const pool = require("../db");
const { BASE_URL } = require("../config");
const { fetchWrap } = require("../utils/fetchWrap");
const { lrcToPlain } = require("../utils/lyricsSync");

const router = express.Router();

// =======================================================
// Helpers: lyrics fetch + translate
// =======================================================
async function fetchLyricsFromLyricsOvh({ artist, title }) {
  if (!artist || !title) return null;
  const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(
    artist
  )}/${encodeURIComponent(title)}`;
  const res = await fetchWrap(url);
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const lyrics = data?.lyrics ? String(data.lyrics) : null;
  return lyrics && lyrics.trim() ? lyrics : null;
}

async function translateGoogleFree(text, targetLang) {
  const input = String(text || "");
  if (!input.trim()) return "";
  // Google free translate endpoint (no key). May be rate-limited.
  const q = input.length > 8000 ? input.slice(0, 8000) : input;
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&dt=t&tl=" +
    encodeURIComponent(targetLang) +
    "&q=" +
    encodeURIComponent(q);
  const res = await fetchWrap(url);
  if (!res.ok) return "";
  const data = await res.json().catch(() => null);
  // data[0] is array of translated chunks: [[translated, original, ...], ...]
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

function pickPrimaryArtist(artists) {
  const s = String(artists || "").trim();
  if (!s) return "";
  // artists format: "a, b, c"
  return s.split(",")[0].trim();
}

// =======================================================
// Song detail (public)
// GET /api/songs/:songId/detail
// =======================================================
router.get("/songs/:songId/detail", async (req, res) => {
  try {
    const songId = req.params.songId;
    const [rows] = await pool.execute(
      `
      SELECT b.BaiHatID as id,
             b.TieuDe as title,
             b.AnhBiaBaiHat as imageUrl,
             GROUP_CONCAT(DISTINCT n.TenNgheSi SEPARATOR ', ') as artists,
             b.DuongDanAudio as audioUrl,
             IFNULL(b.LuotPhat, 0) as listenCount,
             IFNULL(b.LuotThich, 0) as likeCount,
             b.NgayPhatHanh as releaseDate,
             b.AlbumID as albumId
      FROM baihat b
      LEFT JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
      LEFT JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
      WHERE b.BaiHatID = ?
      GROUP BY b.BaiHatID
      LIMIT 1
    `,
      [songId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Song not found" });
    }

    const s = rows[0];
    res.json({
      id: s.id,
      title: s.title,
      artists: s.artists || "Unknown Artist",
      imageUrl: s.imageUrl ? `${BASE_URL}/api/image/song/${s.imageUrl}` : null,
      audioUrl: s.audioUrl ? `${BASE_URL}/api/audio/${s.audioUrl}` : null,
      listenCount: Number(s.listenCount || 0),
      likeCount: Number(s.likeCount || 0),
      releaseDate: s.releaseDate,
      albumId: s.albumId,
    });
  } catch (error) {
    console.error("Error song detail:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// =======================================================
// Comments tree (public read)
// GET /api/songs/:songId/comments
// =======================================================
router.get("/songs/:songId/comments", async (req, res) => {
  try {
    const songId = req.params.songId;
    const [rows] = await pool.execute(
      `
      SELECT bl.BinhLuanID as id,
             bl.BaiHatID as songId,
             bl.NguoiDungID as userId,
             COALESCE(ud.TenHienThi, ud.TenDangNhap, 'User') as userName,
             bl.NoiDung as content,
             bl.ThoiGian as createdAt,
             bl.BinhLuanChaID as parentId
      FROM binhluan bl
      LEFT JOIN nguoidung ud ON bl.NguoiDungID = ud.NguoiDungID
      WHERE bl.BaiHatID = ?
      ORDER BY bl.ThoiGian ASC, bl.BinhLuanID ASC
    `,
      [songId]
    );

    const byId = new Map();
    const roots = [];

    for (const r of rows) {
      byId.set(r.id, {
        id: r.id,
        songId: r.songId,
        userId: r.userId,
        userName: r.userName,
        content: r.content,
        createdAt: r.createdAt,
        parentId: r.parentId,
        children: [],
      });
    }

    for (const r of rows) {
      const node = byId.get(r.id);
      const parentId = r.parentId;
      if (parentId && byId.has(parentId)) {
        byId.get(parentId).children.push(node);
      } else {
        roots.push(node);
      }
    }

    res.json({ data: roots });
  } catch (error) {
    console.error("Error song comments:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// =======================================================
// Lyrics + translations (public)
// GET /api/songs/:songId/lyrics
// Returns: { source, songId, lrc, original, vi, en, updatedAt? }
// =======================================================
router.get("/songs/:songId/lyrics", async (req, res) => {
  try {
    const songId = Number(req.params.songId);
    if (!songId) return res.status(400).json({ error: "songId không hợp lệ" });

    // 0) Prefer DB synced lyrics (LRC) if exists
    await ensureLyricsTable();
    const [dbRows] = await pool.execute(
      "SELECT BaiHatID, LrcText, PlainText, LyricsVI, LyricsEN, UpdatedAt FROM loibaihat WHERE BaiHatID = ?",
      [songId]
    );
    if (Array.isArray(dbRows) && dbRows.length) {
      const row = dbRows[0];
      const lrc = row.LrcText ? String(row.LrcText) : null;
      const original =
        row.PlainText && String(row.PlainText).trim()
          ? String(row.PlainText)
          : lrc
          ? lrcToPlain(lrc)
          : "";

      return res.json({
        source: "db",
        songId,
        lrc,
        original: original || null,
        vi: row.LyricsVI ? String(row.LyricsVI) : null,
        en: row.LyricsEN ? String(row.LyricsEN) : null,
        updatedAt: row.UpdatedAt || null,
      });
    }

    const [rows] = await pool.execute(
      `
      SELECT b.TieuDe as title,
             GROUP_CONCAT(DISTINCT n.TenNgheSi SEPARATOR ', ') as artists
      FROM baihat b
      LEFT JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
      LEFT JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
      WHERE b.BaiHatID = ?
      GROUP BY b.BaiHatID
      LIMIT 1
    `,
      [songId]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Song not found" });
    }

    const title = String(rows[0].title || "");
    const artists = String(rows[0].artists || "");
    const primaryArtist = pickPrimaryArtist(artists);

    const original = await fetchLyricsFromLyricsOvh({
      artist: primaryArtist,
      title,
    });

    if (!original) {
      return res.json({
        source: "lyrics.ovh",
        songId,
        lrc: null,
        original: null,
        vi: null,
        en: null,
      });
    }

    // Translate to VI + EN
    const [vi, en] = await Promise.all([
      translateGoogleFree(original, "vi").catch(() => ""),
      translateGoogleFree(original, "en").catch(() => ""),
    ]);

    res.json({
      source: "lyrics.ovh + translate.googleapis.com",
      songId,
      lrc: null,
      original,
      vi: vi || null,
      en: en || null,
    });
  } catch (error) {
    console.error("Error song lyrics:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

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

// =======================================================
// Artists (public)
// GET /api/artists?page=1&limit=20
// =======================================================
router.get("/artists", async (req, res) => {
  try {
    let page = parseInt(req.query.page, 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    let limit = parseInt(req.query.limit, 10);
    if (Number.isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute(`
      SELECT NgheSiID as id, TenNgheSi as name, TieuSu as bio, AnhDaiDien as avatarFile
      FROM nghesi
      ORDER BY NgheSiID DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const [countRows] = await pool.execute("SELECT COUNT(*) as total FROM nghesi");
    const total = Number(countRows?.[0]?.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const data = rows.map((r) => ({
      id: r.id,
      name: r.name,
      bio: r.bio || "",
      avatarFile: r.avatarFile,
      avatarUrl: r.avatarFile ? `${BASE_URL}/api/image/artist/${r.avatarFile}` : null,
    }));

    res.json({
      data,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    console.error("Error get artists:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách nghệ sĩ" });
  }
});

// =======================================================
// Artist detail (public)
// GET /api/artists/:id
// Returns: { artist, songs }
// =======================================================
router.get("/artists/:id", async (req, res) => {
  try {
    const artistId = Number(req.params.id);
    if (!artistId) return res.status(400).json({ error: "artistId không hợp lệ" });

    const [artistRows] = await pool.execute(
      `
      SELECT NgheSiID as id, TenNgheSi as name, TieuSu as bio, AnhDaiDien as avatarFile
      FROM nghesi
      WHERE NgheSiID = ?
      LIMIT 1
    `,
      [artistId]
    );

    if (!artistRows || artistRows.length === 0) {
      return res.status(404).json({ error: "Artist not found" });
    }

    const artist = artistRows[0];

    const [songRows] = await pool.execute(
      `
      SELECT b.BaiHatID as id,
             b.TieuDe as title,
             b.AnhBiaBaiHat as imageUrl,
             GROUP_CONCAT(DISTINCT n.TenNgheSi SEPARATOR ', ') as artists,
             b.DuongDanAudio as audioUrl,
             IFNULL(b.LuotPhat, 0) as listenCount,
             IFNULL(b.LuotThich, 0) as likeCount
      FROM baihat b
      JOIN baihat_nghesi bn_filter
        ON b.BaiHatID = bn_filter.BaiHatID AND bn_filter.NgheSiID = ?
      LEFT JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
      LEFT JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
      GROUP BY b.BaiHatID
      ORDER BY b.LuotPhat DESC, b.BaiHatID DESC
    `,
      [artistId]
    );

    const songs = songRows.map((s) => ({
      ...s,
      artists: s.artists || "Unknown Artist",
      imageUrl: s.imageUrl
        ? `${BASE_URL}/api/image/song/${s.imageUrl}`
        : "https://placehold.co/60x60/7a3c9e/ffffff?text=No+Image",
      audioUrl: s.audioUrl ? `${BASE_URL}/api/audio/${s.audioUrl}` : null,
      listenCount: Number(s.listenCount || 0),
      likeCount: Number(s.likeCount || 0),
    }));

    res.json({
      artist: {
        id: artist.id,
        name: artist.name,
        bio: artist.bio || "",
        avatarFile: artist.avatarFile,
        avatarUrl: artist.avatarFile
          ? `${BASE_URL}/api/image/artist/${artist.avatarFile}`
          : null,
      },
      songs,
    });
  } catch (error) {
    console.error("Error artist detail:", error);
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
