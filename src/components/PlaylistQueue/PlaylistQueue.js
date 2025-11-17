import React from 'react';
import './PlaylistQueue.css'; // Chúng-ta (We) sẽ-tạo (will create) file này (this file)
import { IoClose } from 'react-icons/io5';

function PlaylistQueue({ playlist, currentSong, onClose, onPlaySong }) {
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
          {playlist.map((song) => (
            <div
              key={song.id}
              // === SỬA: Thêm (Add) class 'is-active' nếu-bài-hát (if song) đang-phát (is playing) ===
              className={`queue-item ${currentSong?.id === song.id ? 'is-active' : ''}`}
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
}

export default PlaylistQueue;