import React from 'react';
import './PlaylistQueue.css'; 
import { IoClose } from 'react-icons/io5';

const PlaylistQueue = ({ playlist, currentSong, onClose, onPlaySong }) => {

  // Lọc (Filter) ra-danh-sách (the "Next Up" list)
  const nextUpPlaylist = playlist.filter(song => song.id !== currentSong?.id);
  
  return (
    // Overlay-để-nhấn-ra-ngoài (Overlay to click out)
    <div className="playlist-queue-overlay" onClick={onClose}>
      <div className="playlist-queue-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="queue-header">
          <h3>Danh sách phát</h3>
          <button className="player-btn icon-btn" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        {/* Danh-sách (List) các-bài-hát (of songs) */}
        <div className="queue-list">

          {/* Luôn (Always) hiển-thị (show) bài-hát-hiện-tại (the current song) ở-trên-cùng (at the top) */}
          {currentSong && (
            <div
              key={currentSong.id}
              className="queue-item is-active" // Luôn- (Always) 'active'
              onClick={() => onPlaySong(currentSong, playlist)}
            >
              <img
                src={currentSong.imageUrl || currentSong.cover}
                alt={currentSong.title}
                className="queue-item-cover"
              />
              <div className="queue-item-info">
                <h4>{currentSong.title}</h4>
                <p>{currentSong.artists}</p>
              </div>
            </div>
          )}
          
          {/* Thêm (Added) tiêu-đề (header) "Tiếp theo" (Next Up) */}
          {nextUpPlaylist.length > 0 && (
            <h4 className="next-up-header">Tiếp theo</h4>
          )}

          {/* Chỉ- (Only) render-phần-còn-lại (the rest) của-danh-sách-phát (the playlist) */}
          {nextUpPlaylist.map((song) => (
            <div
              key={song.id}
              className="queue-item" // Không- (Not) 'active'
              onClick={() => onPlaySong(song, playlist)}
            >
              <img
                src={song.imageUrl || song.cover}
                alt={song.title}
                className="queue-item-cover"
              />
              <div className="queue-item-info">
                <h4>{song.title}</h4>
                <p>{song.artists}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlaylistQueue;