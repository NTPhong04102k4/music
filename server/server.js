const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// === CÁC TUYẾN ĐƯỜNG PHỤC VỤ FILES ===
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


// API endpoint for suggestions
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

    const fullUrlRows = rows.map(row => ({
      ...row,
      imageUrl: row.imageUrl ? `http://localhost:${PORT}/api/image/song/${row.imageUrl}` : 'https://placehold.co/300x300/7a3c9e/ffffff?text=No+Image',
      audioUrl: row.audioUrl ? `http://localhost:${PORT}/api/audio/${row.audioUrl}` : null
    }));
    
    res.json(fullUrlRows);

  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint for charts
app.get('/api/charts', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT b.BaiHatID as id, b.TieuDe as title,
             GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
             b.AnhBiaBaiHat as cover, b.LuotPhat as playCount,
             b.DuongDanAudio as audioUrl
      FROM baihat b
      JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
      JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
      GROUP BY b.BaiHatID
      ORDER BY b.LuotPhat DESC
      LIMIT 5
    `);

    const chartsWithRank = rows.map((item, index) => ({
      ...item,
      rank: index + 1,
      cover: item.cover ? `http://localhost:${PORT}/api/image/song/${item.cover}` : 'https://placehold.co/60x60/a64883/fff?text=No+Image',
      audioUrl: item.audioUrl ? `http://localhost:${PORT}/api/audio/${item.audioUrl}` : null
    }));

    res.json(chartsWithRank);

  } catch (error) {
    console.error('Error fetching charts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint for new albums
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

    const fullUrlRows = rows.map(row => ({
      ...row,
      imageUrl: row.imageUrl ? `http://localhost:${PORT}/api/image/album/${row.imageUrl}` : 'https://placehold.co/300x300/4a90e2/ffffff?text=No+Image'
    }));

    res.json(fullUrlRows);

  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint for album details
app.get('/api/album/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get album info
    const [albumRows] = await pool.execute(`
      SELECT a.AlbumID as id, a.TieuDe as title, a.NgayPhatHanh as releaseDate, a.AnhBia as imageUrl,
             GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists
      FROM album a
      LEFT JOIN album_nghesi an ON a.AlbumID = an.AlbumID
      LEFT JOIN nghesi n ON an.NgheSiID = n.NgheSiID
      WHERE a.AlbumID = ?
      GROUP BY a.AlbumID
    `, [id]);

    if (albumRows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }

    // Get songs in album
    const [songRows] = await pool.execute(`
      SELECT b.BaiHatID as id, b.TieuDe as title, b.AnhBiaBaiHat as imageUrl,
             GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
             b.DuongDanAudio as audioUrl
      FROM baihat b
      JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
      JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
      WHERE b.AlbumID = ?
      GROUP BY b.BaiHatID
      ORDER BY b.BaiHatID
    `, [id]);

    const album = {
      ...albumRows[0],
      imageUrl: albumRows[0].imageUrl ? `http://localhost:${PORT}/api/image/album/${albumRows[0].imageUrl}` : 'https://placehold.co/300x300/4a90e2/ffffff?text=No+Image'
    };

    const songs = songRows.map(song => ({
      ...song,
      imageUrl: song.imageUrl ? `http://localhost:${PORT}/api/image/song/${song.imageUrl}` : 'https://placehold.co/60x60/7a3c9e/ffffff?text=No+Image',
      audioUrl: song.audioUrl ? `http://localhost:${PORT}/api/audio/${song.audioUrl}` : null
    }));

    res.json({ album, songs });

  } catch (error) {
    console.error('Error fetching album details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint for partners (static data)
app.get('/api/partners', (req, res) => {
  const partners = [
    { id: 1, name: 'Universal', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=Universal' },
    { id: 2, name: 'Sony Music', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=Sony+Music' },
    { id: 3, name: 'FUGA', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=FUGA' },
    { id: 4, name: 'Kakao M', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=Kakao+M' },
    { id: 5, name: 'Monstercat', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=Monstercat' },
  ];
  res.json(partners);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.json([]);
    }

    // Tạo (Create) cụm-từ (the term) tìm-kiếm (search) (ví-dụ (e.g.): '%love%')
    const searchTerm = `%${query}%`;

    const [rows] = await pool.execute(`
      SELECT 
        b.BaiHatID as id, 
        b.TieuDe as title, 
        b.AnhBiaBaiHat as imageUrl,
        GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
        b.DuongDanAudio as audioUrl
      FROM baihat b
      JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
      JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
      WHERE 
        b.TieuDe LIKE ? OR n.TenNgheSi LIKE ?
      GROUP BY b.BaiHatID
      ORDER BY b.LuotPhat DESC
      LIMIT 10
    `, [searchTerm, searchTerm]); // Truyền (Pass) 2-lần (twice)

    // Thêm (Add) URL-đầy-đủ (full URLs)
    const fullUrlRows = rows.map(row => ({
      ...row,
      imageUrl: row.imageUrl ? `http://localhost:${PORT}/api/image/song/${row.imageUrl}` : 'https://placehold.co/60x60/7a3c9e/ffffff?text=No+Image',
      audioUrl: row.audioUrl ? `http://localhost:${PORT}/api/audio/${row.audioUrl}` : null
    }));

    res.json(fullUrlRows);

  } catch (error) {
    console.error('Error fetching search results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});