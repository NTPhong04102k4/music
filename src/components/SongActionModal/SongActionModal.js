import React from 'react';
import './SongActionModal.css';
import { 
    IoClose, IoAddCircleOutline, IoHeadset, IoHeartOutline, IoHeart, IoWarningOutline
} from 'react-icons/io5';

// Bỏ các props không dùng: isShuffled, onToggleShuffle, repeatMode...
function SongActionModal({ 
    song, onClose, onAddToPlaylist, isFavorite, onToggleFavorite
}) {
  if (!song) return null;

  const formatNumber = (num) => {
    const n = parseInt(num, 10);
    if (!n || isNaN(n)) return 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n;
  };

  return (
    <div className="song-action-overlay" onClick={onClose}>
      <div className="song-action-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-action-btn" onClick={onClose}>
            <IoClose />
        </button>

        {/* Header: Thông tin bài hát */}
        <div className="song-action-header">
            <img 
                src={song.imageUrl || 'https://placehold.co/60x60'} 
                alt={song.title} 
                className="action-cover"
            />
            <div className="action-info">
                <h3>{song.title}</h3>
                {/* Có thể thêm tên nghệ sĩ ở đây nếu muốn */}
                <p style={{fontSize: '12px', color: '#a0a0a0', margin: '0 0 5px 0'}}>{song.artists}</p>
                
                <div className="action-stats">
                    <span className="stat-item" title="Lượt thích">
                        <IoHeartOutline /> {formatNumber(song.likeCount)}
                    </span>
                    <span className="stat-item" title="Lượt nghe">
                        <IoHeadset /> {formatNumber(song.listenCount)}
                    </span>
                </div>
            </div>
        </div>
        
        {/* === ĐÃ XÓA THANH ĐIỀU KHIỂN NHẠC Ở ĐÂY === */}

        <div className="action-divider"></div>

        <div className="action-list">
             {/* Nút Yêu thích (Tùy chọn: giữ hoặc bỏ nếu muốn chỉ dùng ở PlayerControls) */}
             <div 
                className="action-item" 
                onClick={() => {
                    onToggleFavorite(song.id);
                    // onClose(); 
                }}
            >
                <span className="action-icon">
                    {isFavorite ? <IoHeart style={{color: '#9b4de0'}} /> : <IoHeartOutline />}
                </span>
                <span className="action-text">
                    {isFavorite ? 'Xóa khỏi thư viện' : 'Thêm vào thư viện'}
                </span>
            </div>

            {/* Thêm vào Playlist */}
            <div 
                className="action-item"
                onClick={() => { onAddToPlaylist(song); onClose(); }}
            >
                <span className="action-icon"><IoAddCircleOutline /></span>
                <span className="action-text">Thêm vào danh sách phát</span>
            </div>
            
            <div className="action-divider-small"></div>

            {/* Báo cáo */}
            <div 
                className="action-item"
                onClick={() => { 
                    alert(`Đã gửi báo cáo cho bài hát: ${song.title}`); 
                    onClose(); 
                }}
            >
                <span className="action-icon"><IoWarningOutline /></span>
                <span className="action-text">Báo cáo</span>
            </div>
        </div>
      </div>
    </div>
  );
}

export default SongActionModal;