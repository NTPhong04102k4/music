import React, { useState, useEffect } from 'react';
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
  IoVolumeMuteOutline,
  IoVolumeLowOutline,
  IoMicOutline,
  IoListOutline,
} from 'react-icons/io5';

// === SỬA: Thêm (Added) 'showPlaylistQueue' từ (from) App.js ===
function PlayerControls({ currentSong, onNext, onPrev, onTogglePlaylist, showPlaylistQueue }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [audio, setAudio] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0: no repeat, 1: repeat all, 2: repeat one
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(80);
  const [showLyrics, setShowLyrics] = useState(false);

  // Effect to handle audio when currentSong changes
  useEffect(() => {
    if (currentSong && currentSong.audioUrl) {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.src = ''; // Clear previous audio source
      }
      const newAudio = new Audio(currentSong.audioUrl);
      newAudio.volume = volume / 100;
      
      // Handle audio loading errors
      newAudio.addEventListener('error', (e) => {
        console.error('Error loading audio:', e);
        console.error('Audio URL:', currentSong.audioUrl);
      });
      
      // Handle audio loaded
      newAudio.addEventListener('loadeddata', () => {
        console.log('Audio loaded successfully:', currentSong.audioUrl);
        setDuration(newAudio.duration);
        // Tự-động-phát (Autoplay) khi-bài-hát-mới (new song) được-tải (is loaded)
        setIsPlaying(true); 
      });

      // Handle time update
      newAudio.addEventListener('timeupdate', () => {
        const current = newAudio.currentTime;
        const total = newAudio.duration;
        setCurrentTime(current);
        // Kiểm-tra (Check for) NaN
        setProgress(total ? (current / total) * 100 : 0);
      });

      // Handle audio end
      newAudio.addEventListener('ended', () => {
        if (repeatMode === 2) {
          // Repeat one
          newAudio.currentTime = 0;
          newAudio.play();
        } else if (onNext) { 
          // Repeat all (được-xử-lý (handled by) onNext logic) hoặc (or) No repeat
          onNext();
        } else {
          setIsPlaying(false);
          setProgress(0);
        }
      });
      
      setAudio(newAudio);
      setProgress(0);
      
      // Cleanup function
      return () => {
        if (newAudio) {
          newAudio.pause();
          newAudio.src = '';
          // Gỡ-bỏ (Remove) tất-cả (all) các-trình-lắng-nghe (listeners) để-tránh (to avoid) rò-rỉ-bộ-nhớ (memory leaks)
          newAudio.removeEventListener('error', () => {});
          newAudio.removeEventListener('loadeddata', () => {});
          newAudio.removeEventListener('timeupdate', () => {});
          newAudio.removeEventListener('ended', () => {});
        }
      };
    } else if (!currentSong) {
      // Clean up audio when no song is selected
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
        setAudio(null);
      }
    }
  // === SỬA: Thêm (Added) onNext vào-danh-sách (dependency array) phụ-thuộc (dependency)
  }, [currentSong, onNext, repeatMode]); 

  // Effect to handle play/pause
  useEffect(() => {
    if (audio) {
      if (isPlaying) {
        audio.play().catch(error => {
          console.error('Error playing audio:', error);
          setIsPlaying(false);
        });
      } else {
        audio.pause();
      }
    }
  }, [isPlaying, audio]);

  // Effect to handle volume changes
  useEffect(() => {
    if (audio) {
      audio.volume = volume / 100;
    }
  }, [volume, audio]);

  // Handle play/pause toggle
  const handlePlayPause = () => {
    if (audio) { // Chỉ-cho-phép (Only allow) bật/tắt (toggle) nếu-có (if there is) audio
      setIsPlaying(!isPlaying);
    }
  };

  // Handle progress bar click
  const handleProgressChange = (e) => {
    if (audio) {
      const newProgress = e.target.value;
      setProgress(newProgress);
      const newTime = (newProgress / 100) * duration;
      audio.currentTime = newTime;
    }
  };

  // Handle shuffle toggle
  const handleShuffle = () => {
    setIsShuffled(!isShuffled);
    // TODO: Bạn-cần (You need) thêm-logic (add logic) trong- (in) App.js
    // để-xáo-trộn (to shuffle) 'playlist' khi (when) isShuffled là (is) true
  };

  // Handle repeat toggle
  const handleRepeat = () => {
    setRepeatMode((prev) => (prev + 1) % 3);
  };

  // Handle previous track
  const handlePrev = () => {
    if (audio && audio.currentTime > 3) {
      // If more than 3 seconds played, restart current song
      audio.currentTime = 0;
    } else if (onPrev) {
      onPrev();
    }
  };

  // Handle next track
  const handleNext = () => {
    if (onNext) {
      onNext();
    }
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (audio) {
      audio.volume = newVolume / 100;
    }
    setIsMuted(newVolume === 0);
  };

  // Handle mute toggle
  const handleMute = () => {
    if (isMuted) {
      const newVolume = previousVolume > 0 ? previousVolume : 80;
      setVolume(newVolume);
      setIsMuted(false);
      if (audio) {
        audio.volume = newVolume / 100;
      }
    } else {
      setPreviousVolume(volume); 
      setVolume(0);
      setIsMuted(true);
      if (audio) {
        audio.volume = 0;
      }
    }
  };

  // Format time to MM:SS
  const formatTime = (time) => {
    if (isNaN(time) || time === 0) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="player-controls">
      {/* --- 1. Khối Bên Trái (Thông tin bài hát) --- */}
      <div className="player-left">
        <div className="song-cover">
          <img
            src={currentSong ? (currentSong.cover || currentSong.imageUrl || 'https://placehold.co/60x60/a64883/fff?text=No+Image') : 'https://placehold.co/60x60/130c1c/fff?text=NCT'}
            alt="Song Cover"
            onError={(e) => {
              console.error('Error loading song cover:', currentSong?.cover || currentSong?.imageUrl);
              e.target.src = 'https://placehold.co/60x60/a64883/fff?text=No+Image';
            }}
          />
          <div className="cover-icon">
            <IoExpand />
          </div>
        </div>
        <div className="song-info">
          <div className="song-name">{currentSong ? currentSong.title : 'Chọn bài hát'}</div>
          <div className="artist-name">{currentSong ? currentSong.artists : 'Nghệ sĩ'}</div>
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
          <button
            className={`player-btn icon-btn ${isShuffled ? 'active' : ''}`}
            onClick={handleShuffle}
          >
            <IoShuffleOutline />
          </button>
          <button className="player-btn icon-btn" onClick={handlePrev}>
            <IoPlaySkipBack />
          </button>
          <button
            className="player-btn icon-btn play-pause-btn"
            onClick={handlePlayPause}
            disabled={!audio} // Vô-hiệu-hóa (Disable) nếu-không-có (if no) audio
          >
            {isPlaying ? <IoPause /> : <IoPlay />}
          </button>
          <button className="player-btn icon-btn" onClick={handleNext}>
            <IoPlaySkipForward />
          </button>
          <button
            className={`player-btn icon-btn ${repeatMode > 0 ? 'active' : ''}`}
            onClick={handleRepeat}
          >
            <IoRepeatOutline />
            {repeatMode === 2 && <span className="repeat-one">1</span>}
          </button>
        </div>

        <div className="progress-bar-container">
          <span className="time-label">{formatTime(currentTime)}</span>
          <div className="progress-bar">
            <input
              type="range"
              className="progress-slider"
              min="0"
              max="100"
              step="0.1"
              value={progress || 0}
              onChange={handleProgressChange}
              style={{ '--progress-percent': `${progress || 0}%` }}
              disabled={!audio} // Vô-hiệu-hóa (Disable) nếu-không-có (if no) audio
            />
          </div>
          <span className="time-label">{formatTime(duration)}</span>
        </div>
      </div>

      {/* --- 3. Khối Bên Phải (Chất lượng, Âm lượng, Lời, Danh sách) --- */}
      <div className="player-right">
        <button className="player-btn quality-btn">128kbps</button>
        <button className="player-btn icon-btn" onClick={handleMute}>
          {isMuted || Math.round(volume) === 0 ? <IoVolumeMuteOutline /> : volume < 50 ? <IoVolumeLowOutline /> : <IoVolumeMediumOutline />}
        </button>
        <div className="volume-slider-container">
          <input
            type="range"
            className="volume-slider"
            min="0"
            max="100"
            step="1"
            value={volume}
            onChange={handleVolumeChange}
            style={{ '--progress-percent': `${volume}%` }}
          />
        </div>
        <span className="divider"></span>
        <button
          className={`player-btn icon-btn ${showLyrics ? 'active' : ''}`}
          onClick={() => setShowLyrics(!showLyrics)}
        >
          <IoMicOutline />
        </button>
        
        {/* === SỬA: Sử-dụng (Use) prop 'showPlaylistQueue' để-thêm (to add) class 'active' === */}
        <button
          className={`player-btn icon-btn ${showPlaylistQueue ? 'active' : ''}`}
          onClick={onTogglePlaylist}
        >
          <IoListOutline />
        </button>
      </div>

      {/* Lyrics Panel (Giữ-nguyên (Kept)) */}
      {showLyrics && (
        <div className="lyrics-panel">
          <div className="lyrics-header">
            <h3>Lời bài hát</h3>
            <button onClick={() => setShowLyrics(false)}>×</button>
          </div>
          <div className="lyrics-content">
            <p>Lời bài hát sẽ được hiển thị ở đây...</p>
          </div>
        </div>
      )}

    </div>
  );
}

export default PlayerControls;