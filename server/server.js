const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db'); // Đảm bảo file db.js đã được cấu hình đúng

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = 'your-secret-key-123'; // Nên đặt trong biến môi trường
const BASE_URL = `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json());

// =======================================================
// 1. CÁC TUYẾN ĐƯỜNG PHỤC VỤ FILE (STATIC FILES)
// =======================================================
app.use('/uploads', express.static(path.join(__dirname, '../public')));

// =======================================================
// 1.1 API PHỤC VỤ FILE ẢNH VÀ AUDIO
// =======================================================
// Phục vụ file audio
app.get('/api/audio/:filename', (req, res) => {
  const { filename } = req.params;
  // Thử tìm trong public/audio trước
  let filePath = path.join(__dirname, '..', 'public', 'audio', filename + '.mp3');
  if (require('fs').existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    // Nếu không có, thử trong uploads
    filePath = path.join(__dirname, 'uploads', 'audio', filename);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending audio file:', err);
        res.status(404).send('File not found');
      }
    });
  }
});

// Phục vụ file ảnh BÀI HÁT
app.get('/api/image/song/:filename', (req, res) => {
  const { filename } = req.params;
  // Thử tìm trong public/images/song trước
  let filePath = path.join(__dirname, '..', 'public', 'images', 'song', filename + '.jpg');
  if (require('fs').existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    // Nếu không có, thử trong uploads
    filePath = path.join(__dirname, 'uploads', 'images', 'song', filename);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending song image file:', err);
        res.status(404).send('File not found');
      }
    });
  }
});

// Phục vụ file ảnh ALBUM
app.get('/api/image/album/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', 'images', 'album', filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending album image file:', err);
      res.status(404).send('File not found');
    }
  });
});
// =======================================================


// =======================================================
// 2. API ĐĂNG NHẬP (LOGIN) - CẬP NHẬT THEO DB MỚI
// =======================================================
app.post('/api/login', async (req, res) => {
  try {
    // Frontend gửi lên { email, password }
    // Biến 'email' ở đây là giá trị người dùng nhập vào (có thể là Email hoặc Tên đăng nhập)
    const { email, password } = req.body; 

    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập/email và mật khẩu' });
    }

    // Query bảng `nguoidung`
    // Tìm theo `Email` HOẶC `TenDangNhap`
    // (Dấu ? thứ nhất là email, dấu ? thứ hai cũng là email - để so sánh với cả 2 cột)
    const [users] = await pool.execute(
      'SELECT * FROM nguoidung WHERE Email = ? OR TenDangNhap = ?',
      [email, email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại' });
    }

    const user = users[0];

    // Kiểm tra trạng thái tài khoản (nếu có cột TrangThai)
    if (user.TrangThai && user.TrangThai !== 'active') {
         return res.status(403).json({ error: 'Tài khoản đã bị khóa' });
    }

    // Kiểm tra mật khẩu
    let isValidPassword = false;
    // 1. So sánh trực tiếp (nếu DB lưu password thô)
    if (user.MatKhau === password) {
        isValidPassword = true;
    } else {
        // 2. So sánh bcrypt (nếu DB lưu hash)
        // Catch lỗi để tránh crash nếu format hash sai
        isValidPassword = await bcrypt.compare(password, user.MatKhau).catch(() => false);
    }

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Mật khẩu không đúng' });
    }

    // Tạo Token
    const token = jwt.sign(
      { userId: user.NguoiDungID, username: user.TenDangNhap },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Trả về thông tin User
    // Mapping: 
    // - DB: HoVaTen -> Frontend: displayName
    // - DB: AnhDaiDien -> Frontend: avatar
    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.NguoiDungID,
        username: user.TenDangNhap,
        email: user.Email,
        displayName: user.TenHienThi || user.TenDangNhap, // Fallback nếu HoVaTen null
        avatar: user.AnhDaiDien
          ? (user.AnhDaiDien.startsWith('http') ? user.AnhDaiDien : `${BASE_URL}/uploads/${user.AnhDaiDien}.jpg`)
          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.TenDangNhap}` // Avatar mặc định
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Lỗi server: ' + error.message });
  }
});

// =======================================================
// 3. CÁC API DỮ LIỆU (CÔNG KHAI)
// =======================================================

// Gợi ý
app.get('/api/suggestions', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT b.BaiHatID as id, b.TieuDe as title, b.AnhBiaBaiHat as imageUrl,
             GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
             b.DuongDanAudio as audioUrl
      FROM baihat b
      JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
      JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
      GROUP BY b.BaiHatID
      ORDER BY RAND()
      LIMIT 9
    `);
    const data = rows.map(row => ({
      ...row,
      imageUrl: row.imageUrl ? `${BASE_URL}/api/image/song/${row.imageUrl}` : 'https://placehold.co/300x300/7a3c9e/ffffff?text=No+Image',
      audioUrl: row.audioUrl ? `${BASE_URL}/api/audio/${row.audioUrl}` : null
    }));
    res.json(data);
  } catch (error) {
    console.error('Error suggestions:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Tìm kiếm
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json([]);
    const searchTerm = `%${query}%`;

    const [rows] = await pool.execute(`
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
    `, [searchTerm, searchTerm]);

    const data = rows.map(row => ({
        ...row,
        imageUrl: row.imageUrl ? `${BASE_URL}/api/image/song/${row.imageUrl}` : 'https://placehold.co/60x60/7a3c9e/ffffff?text=No+Image',
        audioUrl: row.audioUrl ? `${BASE_URL}/api/audio/${row.audioUrl}` : null
    }));
    res.json(data);
  } catch (error) {
    console.error('Error search:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Bảng xếp hạng
app.get('/api/charts', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT b.BaiHatID as id, b.TieuDe as title, b.AnhBiaBaiHat as cover,
                   GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
                   b.DuongDanAudio as audioUrl, b.LuotPhat
            FROM baihat b
            JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
            JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
            GROUP BY b.BaiHatID
            ORDER BY b.LuotPhat DESC
            LIMIT 5
        `);
        const data = rows.map((item, index) => ({
            ...item,
            rank: index + 1,
            cover: item.cover ? `${BASE_URL}/api/image/song/${item.cover}` : 'https://placehold.co/60x60/a64883/fff?text=No+Image',
            audioUrl: item.audioUrl ? `${BASE_URL}/api/audio/${item.audioUrl}` : null
        }));
        res.json(data);
    } catch (error) {
        console.error('Error charts:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Albums
app.get('/api/albums', async (req, res) => {
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
        const data = rows.map(row => ({
            ...row,
            imageUrl: row.imageUrl ? `${BASE_URL}/api/image/album/${row.imageUrl}` : 'https://placehold.co/300x300/4a90e2/ffffff?text=No+Image'
        }));
        res.json(data);
    } catch (error) {
        console.error('Error albums:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Album Detail
app.get('/api/album/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [albumRows] = await pool.execute(`
            SELECT a.AlbumID as id, a.TieuDe as title, a.NgayPhatHanh as releaseDate, a.AnhBia as imageUrl,
                   GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists
            FROM album a
            LEFT JOIN album_nghesi an ON a.AlbumID = an.AlbumID
            LEFT JOIN nghesi n ON an.NgheSiID = n.NgheSiID
            WHERE a.AlbumID = ?
            GROUP BY a.AlbumID
        `, [id]);

        if (albumRows.length === 0) return res.status(404).json({ error: 'Album not found' });

        const [songs] = await pool.execute(`
            SELECT b.BaiHatID as id, b.TieuDe as title, b.AnhBiaBaiHat as imageUrl,
                   GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
                   b.DuongDanAudio as audioUrl
            FROM baihat b
            JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
            JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
            WHERE b.AlbumID = ?
            GROUP BY b.BaiHatID
        `, [id]);

        const albumData = {
            ...albumRows[0],
            imageUrl: albumRows[0].imageUrl ? `${BASE_URL}/api/image/album/${albumRows[0].imageUrl}` : 'https://placehold.co/300x300/4a90e2/ffffff?text=No+Image'
        };
        const songData = songs.map(s => ({
            ...s,
            imageUrl: s.imageUrl ? `${BASE_URL}/api/image/song/${s.imageUrl}` : 'https://placehold.co/60x60/7a3c9e/ffffff?text=No+Image',
            audioUrl: s.audioUrl ? `${BASE_URL}/api/audio/${s.audioUrl}` : null
        }));

        res.json({ album: albumData, songs: songData });
    } catch (error) {
        console.error('Error album detail:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Partners
app.get('/api/partners', (req, res) => {
    res.json([
      { id: 1, name: 'Universal', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=Universal' },
      { id: 2, name: 'Sony Music', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=Sony+Music' },
      { id: 3, name: 'FUGA', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=FUGA' },
      { id: 4, name: 'Kakao M', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=Kakao+M' },
      { id: 5, name: 'Monstercat', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=Monstercat' },
    ]);
});

// =======================================================
// 4. API NGƯỜI DÙNG (CẦN TOKEN - AUTHENTICATED)
// =======================================================

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Thiếu token' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token không hợp lệ' });
        req.user = user;
        next();
    });
};

// Lấy danh sách yêu thích
// Lấy danh sách yêu thích (Đã sửa lỗi SQL mode & dùng LEFT JOIN)
app.get('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // SỬA: 
    // 1. Dùng LEFT JOIN để không bị mất bài hát nếu lỡ thiếu thông tin nghệ sĩ
    // 2. Thêm các cột vào GROUP BY để tránh lỗi 'ONLY_FULL_GROUP_BY' trên MySQL mới
    const [rows] = await pool.execute(`
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
    `, [userId]);

    const data = rows.map(row => ({
        ...row,
        imageUrl: row.imageUrl ? `${BASE_URL}/api/image/song/${row.imageUrl}` : 'https://placehold.co/60x60/7a3c9e/ffffff?text=No+Image',
        audioUrl: row.audioUrl ? `${BASE_URL}/api/audio/${row.audioUrl}` : null
    }));
    
    res.json(data);

  } catch (error) {
    // In lỗi chi tiết ra terminal để bạn dễ sửa nếu vẫn còn lỗi
    console.error('Error fetching favorites:', error.message);
    res.status(500).json({ error: 'Lỗi server: ' + error.message });
  }
});


// Toggle yêu thích
app.post('/api/favorites/:songId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const songId = req.params.songId;
        const [exists] = await pool.execute('SELECT * FROM baihatyeuthich WHERE NguoiDungID = ? AND BaiHatID = ?', [userId, songId]);

        if (exists.length > 0) {
            await pool.execute('DELETE FROM baihatyeuthich WHERE NguoiDungID = ? AND BaiHatID = ?', [userId, songId]);
            res.json({ message: 'Đã xóa', isLiked: false });
        } else {
            await pool.execute('INSERT INTO baihatyeuthich (NguoiDungID, BaiHatID) VALUES (?, ?)', [userId, songId]);
            res.json({ message: 'Đã thêm', isLiked: true });
        }
    } catch (error) {
        console.error('Error toggle favorite:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Check status yêu thích
app.get('/api/favorites/:songId/status', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM baihatyeuthich WHERE NguoiDungID = ? AND BaiHatID = ?',
            [req.user.userId, req.params.songId]
        );
        res.json({ isLiked: rows.length > 0 });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi' });
    }
});

// KHỞI ĐỘNG SERVER
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại: ${BASE_URL}`);
});