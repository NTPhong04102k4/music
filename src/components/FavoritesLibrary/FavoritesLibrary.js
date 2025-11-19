import React, { useState, useEffect } from 'react';
import './FavoritesLibrary.css';
import { IoPlay, IoHeart } from 'react-icons/io5';

function FavoritesLibrary({ onPlaySong }) {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:5001/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFavorites(data);
        } else {
          console.error("API favorites không trả về mảng:", data);
          setFavorites([]);
        }
      })
      .catch(err => {
        console.error('Error loading favorites:', err);
        setFavorites([]);
      });
    }
  }, []);

  return (
    <div className="favorites-library">
      <div className="favorites-header">
        <h2>Bài Hát Yêu Thích</h2>
        <button 
          className="zm-btn play-all-btn"
          onClick={() => favorites.length > 0 && onPlaySong(favorites[0], favorites)}
        >
          <IoPlay /> PHÁT TẤT CẢ
        </button>
      </div>

      <div className="favorites-list">
        {favorites.length === 0 ? (
          <div className="no-favorites">
            <p>Chưa có bài hát yêu thích nào.</p>
          </div>
        ) : (
          favorites.map((song, index) => (
            <div 
              className="favorite-item" 
              key={song.id}
              onClick={() => onPlaySong(song, favorites)}
            >
              {/* Số thứ tự (Rank) */}
              <span className={`favorite-index index-${index + 1}`}>{index + 1}</span>
              
              <div className="favorite-item-left">
                <img 
                  src={song.imageUrl} 
                  alt={song.title} 
                  className="favorite-item-cover" 
                  onError={(e) => { e.target.src = 'https://placehold.co/60x60/7a3c9e/ffffff?text=Err'; }}
                />
                <div className="favorite-item-info">
                  {/* === SỬA: Hiển thị Tên bài hát và Nghệ sĩ === */}
                  <h4>{song.title}</h4>
                  <p>{song.artists}</p>
                </div>
              </div>

              <div className="favorite-item-right">
                 <IoHeart style={{ color: '#9b4de0' }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FavoritesLibrary;