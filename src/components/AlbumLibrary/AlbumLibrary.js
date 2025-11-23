import React, { useState, useEffect } from 'react';
import './AlbumLibrary.css';
import { IoPlay } from 'react-icons/io5';

function AlbumLibrary({ onViewAlbum }) {
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    // Gọi API lấy danh sách album (có thể cần tạo API lấy tất cả album nếu chưa có)
    // Tạm dùng API /api/albums (đang trả về top 5 mới nhất)
    // Bạn nên tạo thêm API /api/albums/all để lấy nhiều hơn
    fetch('http://localhost:5001/api/albums')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
            setAlbums(data);
        }
      })
      .catch(err => console.error('Error loading albums:', err));
  }, []);

  return (
    <div className="album-library">
      <div className="album-header">
        <h2>Thư Viện Album</h2>
      </div>

      <div className="album-grid">
        {albums.length === 0 ? (
          <div className="no-album">
            <p>Chưa có album nào.</p>
          </div>
        ) : (
          albums.map((album) => (
            <div 
              className="album-card" 
              key={album.id}
              onClick={() => onViewAlbum(album.id)}
            >
              <div className="album-image">
                <img 
                  src={album.imageUrl || 'https://placehold.co/300x300/2f2739/ffffff?text=Album'} 
                  alt={album.title} 
                  onError={(e) => { e.target.src = 'https://placehold.co/300x300/2f2739/ffffff?text=Album'; }}
                />
                <div className="album-overlay">
                  <button className="player-btn icon-btn play-btn">
                    <IoPlay />
                  </button>
                </div>
              </div>
              <div className="album-info">
                <h4>{album.title}</h4>
                <p>{album.artists}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AlbumLibrary;