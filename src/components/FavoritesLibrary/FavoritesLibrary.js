import React, { useState, useEffect, useCallback } from "react";
import "./FavoritesLibrary.css";
import { IoPause, IoPlay, IoTrashOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";

function FavoritesLibrary({
  onPlaySong,
  currentSong,
  isPlaying,
  onTogglePlayPause,
}) {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState([]);
  const BACKEND_URL =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

  const fetchFavorites = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/favorites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => []);
      if (!res.ok)
        throw new Error(
          data?.error || t("favoritesLibrary.errors.fetchFailed")
        );

      if (Array.isArray(data)) setFavorites(data);
      else {
        console.error("Favorites API did not return an array:", data);
        setFavorites([]);
      }
    } catch (err) {
      console.error("Error loading favorites:", err);
      setFavorites([]);
    }
  }, [BACKEND_URL, t]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemoveFavorite = useCallback(
    async (songId, e) => {
      e?.stopPropagation?.();

      const token = localStorage.getItem("token");
      if (!token) {
        alert(t("favoritesLibrary.alerts.loginToRemove"));
        return;
      }

      const ok = window.confirm(t("favoritesLibrary.confirms.remove"));
      if (!ok) return;

      try {
        // Endpoint này toggle: nếu đã thích thì sẽ "bỏ thích" (xóa khỏi favorites)
        const res = await fetch(`${BACKEND_URL}/api/favorites/${songId}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(
            data?.error || t("favoritesLibrary.errors.removeFailed")
          );

        // Gọi GET để làm mới dữ liệu
        await fetchFavorites();
      } catch (err) {
        console.error("Error removing favorite:", err);
        alert(err?.message || t("favoritesLibrary.errors.removeErrorFallback"));
      }
    },
    [fetchFavorites, BACKEND_URL, t]
  );

  return (
    <div className="favorites-library">
      <div className="favorites-header">
        <h2>{t("favoritesLibrary.title")}</h2>
        <button
          className="zm-btn play-all-btn"
          onClick={() =>
            favorites.length > 0 && onPlaySong(favorites[0], favorites)
          }
          disabled={favorites.length === 0}
          title={
            favorites.length === 0
              ? t("favoritesLibrary.playAllTitleEmpty")
              : t("favoritesLibrary.playAllTitle")
          }
        >
          <IoPlay /> {t("favoritesLibrary.playAllButton")}
        </button>
      </div>

      <div className="favorites-list">
        {favorites.length === 0 ? (
          <div className="no-favorites">
            <p>{t("favoritesLibrary.empty")}</p>
          </div>
        ) : (
          favorites.map((song, index) => (
            <div
              className="favorite-item"
              key={song.id}
              onClick={() => onPlaySong(song, favorites)}
            >
              {/* Số thứ tự (Rank) */}
              <span className={`favorite-index index-${index + 1}`}>
                {index + 1}
              </span>

              <div className="favorite-item-left">
                <img
                  src={song.imageUrl}
                  alt={song.title}
                  className="favorite-item-cover"
                  onError={(e) => {
                    e.target.src =
                      "https://placehold.co/60x60/7a3c9e/ffffff?text=Err";
                  }}
                />
                <div className="favorite-item-info">
                  {/* === SỬA: Hiển thị Tên bài hát và Nghệ sĩ === */}
                  <h4>{song.title}</h4>
                  <p>{song.artists}</p>
                </div>
              </div>

              <div className="favorite-item-right">
                {String(song.id) === String(currentSong?.id) ? (
                  <button
                    className="favorite-now-btn"
                    title={
                      isPlaying
                        ? t("favoritesLibrary.tooltips.pause")
                        : t("favoritesLibrary.tooltips.play")
                    }
                    aria-label={
                      isPlaying
                        ? t("favoritesLibrary.tooltips.pause")
                        : t("favoritesLibrary.tooltips.play")
                    }
                    onClick={(e) => {
                      e?.stopPropagation?.();
                      onTogglePlayPause?.();
                    }}
                  >
                    {isPlaying ? <IoPause /> : <IoPlay />}
                  </button>
                ) : (
                  <button
                    className="favorite-delete-btn"
                    title={t("favoritesLibrary.tooltips.remove")}
                    aria-label={t("favoritesLibrary.tooltips.remove")}
                    onClick={(e) => handleRemoveFavorite(song.id, e)}
                  >
                    <IoTrashOutline />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FavoritesLibrary;
