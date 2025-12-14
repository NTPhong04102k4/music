import React, { useState, useEffect, useCallback } from 'react';
import './FavoritesLibrary.css';
import { IoPlay, IoTrashOutline } from 'react-icons/io5';

function FavoritesLibrary({ onPlaySong }) {
  const [favorites, setFavorites] = useState([]);

  const fetchFavorites = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:5001/api/favorites', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.error || 'Không thể tải danh sách yêu thích');

      if (Array.isArray(data)) setFavorites(data);
      else {
        console.error('API favorites không trả về mảng:', data);
        setFavorites([]);
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
      setFavorites([]);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemoveFavorite = useCallback(
    async (songId, e) => {
      e?.stopPropagation?.();

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Vui lòng đăng nhập để xóa bài hát khỏi yêu thích');
        return;
      }

      const ok = window.confirm('Xóa bài hát khỏi danh sách yêu thích?');
      if (!ok) return;

      try {
        // Endpoint này toggle: nếu đã thích thì sẽ "bỏ thích" (xóa khỏi favorites)
        const res = await fetch(`http://localhost:5001/api/favorites/${songId}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Xóa khỏi yêu thích thất bại');

        // Gọi GET để làm mới dữ liệu
        await fetchFavorites();
      } catch (err) {
        console.error('Error removing favorite:', err);
        alert(err?.message || 'Lỗi khi xóa bài hát khỏi yêu thích');
      }
    },
    [fetchFavorites]
  );

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
                <button
                  className="favorite-delete-btn"
                  title="Xóa khỏi yêu thích"
                  aria-label="Xóa khỏi yêu thích"
                  onClick={(e) => handleRemoveFavorite(song.id, e)}
                >
                  <IoTrashOutline />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FavoritesLibrary;