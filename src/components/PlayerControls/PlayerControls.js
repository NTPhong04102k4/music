import React, { useState } from 'react';
import './PlayerControls.css'; // Đảm-bảo (Make sure) bạn-đã-nhập (you import) file CSS

// Nhập (Import) các-icon (icons) từ-thư-viện (library) react-icons
import {
  IoExpand,
  IoHeartOutline,
  IoEllipsisHorizontal,
  IoShuffleOutline,
  IoPlaySkipBack,
  IoPlaySkipForward,
  IoPlay,
  IoPause,
  IoRepeatOutline,
  IoVolumeMediumOutline,
  IoMicOutline,
  IoListOutline,
} from 'react-icons/io5';

function PlayerControls() {
  const [isPlaying, setIsPlaying] = useState(true); // Trạng-thái (State) ví-dụ (example)
  const [progress, setProgress] = useState(46.95); // Trạng-thái (State) ví-dụ (example)
  const [volume, setVolume] = useState(80); // Trạng-thái (State) ví-dụ (example)

  return (
    <div className="player-controls">
      {/* --- 1. Khối Bên Trái (Thông tin bài hát) --- */}
      <div className="player-left">
        <div className="song-cover">
          <img
            src="https://image-cdn.nct.vn/song/2025/10/22/B/m/W/i/1761146738378_300.jpg"
            alt="Song Cover"
          />
          <div className="cover-icon">
            <IoExpand />
          </div>
        </div>
        <div className="song-info">
          <div className="song-name">chẳng phải tình đầu sao đau đến thế</div>
          <div className="artist-name">MIN, Dangrangto, antransax</div>
        </div>
        <div className="song-actions">
          <button className="player-btn icon-btn">
            <IoHeartOutline />
          </button>
          <button className="player-btn icon-btn">
            <IoEllipsisHorizontal />
          </button>
        </div>
      </div>

      {/* --- 2. Khối Ở Giữa (Nút điều khiển & Thanh tiến trình) --- */}
      <div className="player-center">
        <div className="player-controls-buttons">
          <button className="player-btn icon-btn">
            <IoShuffleOutline />
          </button>
          <button className="player-btn icon-btn">
            <IoPlaySkipBack />
          </button>
          <button
            className="player-btn icon-btn play-pause-btn"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <IoPause /> : <IoPlay />}
          </button>
          <button className="player-btn icon-btn">
            <IoPlaySkipForward />
          </button>
          <button className="player-btn icon-btn">
            <IoRepeatOutline />
          </button>
        </div>

        <div className="progress-bar-container">
          <span className="time-label">02:13</span>
          <div className="progress-bar">
            <input
              type="range"
              className="progress-slider"
              min="0"
              max="100"
              step="1"
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              style={{ '--progress-percent': `${progress}%` }}
            />
          </div>
          <span className="time-label">04:43</span>
        </div>
      </div>

      {/* --- 3. Khối Bên Phải (Chất lượng, Âm lượng, Lời, Danh sách) --- */}
      <div className="player-right">
        <button className="player-btn quality-btn">128kbps</button>
        <button className="player-btn icon-btn">
          <IoVolumeMediumOutline />
        </button>
        <div className="volume-slider-container">
          <input
            type="range"
            className="volume-slider"
            min="0"
            max="100"
            step="1"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            style={{ '--progress-percent': `${volume}%` }}
          />
        </div>
        <span className="divider"></span>
        <button className="player-btn icon-btn">
          <IoMicOutline />
        </button>
        <button className="player-btn icon-btn">
          <IoListOutline />
        </button>
      </div>
    </div>
  );
}

export default PlayerControls;