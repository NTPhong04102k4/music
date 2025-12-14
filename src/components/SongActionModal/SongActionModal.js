import React, { useEffect, useState } from "react";
import "./SongActionModal.css";
import {
  IoClose,
  IoAddCircleOutline,
  IoHeadset,
  IoHeartOutline,
  IoHeart,
} from "react-icons/io5";
import { SONG_STATS_CHANGED_EVENT } from "../../utils/songEvents";
import { useTranslation } from "react-i18next";

// Bỏ các props không dùng: isShuffled, onToggleShuffle, repeatMode...
function SongActionModal({
  song,
  onClose,
  onAddToPlaylist,
  isFavorite,
  onToggleFavorite,
}) {
  const { t } = useTranslation();
  const [displayLikeCount, setDisplayLikeCount] = useState(0);
  const songId = song?.id;
  const songLikeCount = song?.likeCount;

  useEffect(() => {
    if (!songId) return;
    setDisplayLikeCount(typeof songLikeCount === "number" ? songLikeCount : 0);
  }, [songId, songLikeCount]);

  useEffect(() => {
    if (!songId) return;
    const handler = (e) => {
      const detail = e?.detail || {};
      if (detail.songId === songId && typeof detail.likeCount === "number") {
        setDisplayLikeCount(detail.likeCount);
      }
    };
    window.addEventListener(SONG_STATS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(SONG_STATS_CHANGED_EVENT, handler);
  }, [songId]);

  const formatNumber = (num) => {
    const n = parseInt(num, 10);
    if (!n || isNaN(n)) return 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n;
  };

  if (!song) return null;

  return (
    <div className="song-action-overlay" onClick={onClose}>
      <div className="song-action-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="close-action-btn"
          onClick={onClose}
          aria-label={t("common.close")}
          title={t("common.close")}
        >
          <IoClose />
        </button>

        {/* Header: Thông tin bài hát */}
        <div className="song-action-header">
          <img
            src={song.imageUrl || "https://placehold.co/60x60"}
            alt={song.title}
            className="action-cover"
          />
          <div className="action-info">
            <h3>{song.title}</h3>
            {/* Có thể thêm tên nghệ sĩ ở đây nếu muốn */}
            <p
              style={{
                fontSize: "12px",
                color: "#a0a0a0",
                margin: "0 0 5px 0",
              }}
            >
              {song.artists}
            </p>

            <div className="action-stats">
              <span
                className="stat-item"
                title={t("songActionModal.stats.likes")}
              >
                <IoHeartOutline /> {formatNumber(displayLikeCount)}
              </span>
              <span
                className="stat-item"
                title={t("songActionModal.stats.listens")}
              >
                <IoHeadset /> {formatNumber(song.listenCount)}
              </span>
            </div>
          </div>
        </div>

        {/* === ĐÃ XÓA THANH ĐIỀU KHIỂN NHẠC Ở ĐÂY === */}

        <div className="action-divider"></div>

        <div className="action-list">
          {/* Menu: Thêm vào bài hát yêu thích */}
          <div
            className="action-item"
            onClick={() => {
              onToggleFavorite(song.id);
              onClose();
            }}
          >
            <span className="action-icon">
              {isFavorite ? (
                <IoHeart style={{ color: "#9b4de0" }} />
              ) : (
                <IoHeartOutline />
              )}
            </span>
            <span className="action-text">
              {isFavorite
                ? t("songActionModal.actions.removeFromFavorites")
                : t("songActionModal.actions.addToFavorites")}
            </span>
          </div>

          {/* Menu: Thêm vào danh sách phát */}
          <div
            className="action-item"
            onClick={() => {
              onAddToPlaylist(song);
              onClose();
            }}
          >
            <span className="action-icon">
              <IoAddCircleOutline />
            </span>
            <span className="action-text">
              {t("songActionModal.actions.addToPlaylist")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SongActionModal;
