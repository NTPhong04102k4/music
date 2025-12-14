import React from "react";
import "./PlaylistQueue.css";
import { IoClose } from "react-icons/io5";
import { useTranslation } from "react-i18next";

const PlaylistQueue = ({ playlist, currentSong, onClose, onPlaySong }) => {
  const { t } = useTranslation();

  // Lọc danh sách "Tiếp theo" (loại bỏ bài đang phát)
  // Thêm kiểm tra playlist tồn tại để tránh lỗi null
  const nextUpPlaylist = playlist
    ? playlist.filter((song) => song.id !== currentSong?.id)
    : [];

  return (
    <div className="playlist-queue-overlay" onClick={onClose}>
      <div
        className="playlist-queue-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="queue-header">
          <h3>{t("playlistQueue.title")}</h3>
          <button
            className="player-btn icon-btn"
            aria-label={t("common.close")}
            onClick={onClose}
          >
            <IoClose />
          </button>
        </div>

        {/* Danh sách bài hát */}
        <div className="queue-list">
          {/* Bài đang phát */}
          {currentSong && (
            <div className="queue-section">
              <h4 className="queue-section-title">
                {t("playlistQueue.nowPlaying")}
              </h4>
              <div
                key={currentSong.id}
                className="queue-item is-active"
                onClick={() => onPlaySong(currentSong, playlist)}
              >
                <img
                  src={
                    currentSong.imageUrl ||
                    currentSong.cover ||
                    "https://placehold.co/60x60/7a3c9e/ffffff?text=Err"
                  }
                  alt={currentSong.title}
                  className="queue-item-cover"
                />
                <div className="queue-item-info">
                  <h4>{currentSong.title}</h4>
                  <p>{currentSong.artists}</p>
                </div>
              </div>
            </div>
          )}

          {/* Danh sách tiếp theo */}
          {nextUpPlaylist.length > 0 && (
            <div className="queue-section">
              <h4 className="queue-section-title">
                {t("playlistQueue.upNext")}
              </h4>
              {nextUpPlaylist.map((song) => (
                <div
                  key={song.id}
                  className="queue-item"
                  onClick={() => onPlaySong(song, playlist)}
                >
                  <img
                    src={
                      song.imageUrl ||
                      song.cover ||
                      "https://placehold.co/60x60/7a3c9e/ffffff?text=Err"
                    }
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
          )}

          {!currentSong && nextUpPlaylist.length === 0 && (
            <div className="no-songs-queue">{t("playlistQueue.empty")}</div>
          )}
        </div>
      </div>
    </div>
  );
};

// === DÒNG NÀY QUAN TRỌNG NHẤT ĐỂ SỬA LỖI ===
export default PlaylistQueue;
