const express = require("express");
const router = express.Router();
const pool = require("../db"); // Import kết nối DB từ thư mục cha
const BASE_URL = "http://localhost:5001";
// === MIDDLEWARE KIỂM TRA QUYỀN ADMIN ===
const checkAdmin = (req, res, next) => {
  // req.user được tạo ra từ middleware authenticateToken (mount ở app.js)
  // Cần đảm bảo khi login bạn đã lưu 'role' vào token
  if (req.user && req.user.role === "admin") {
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

module.exports = router;
