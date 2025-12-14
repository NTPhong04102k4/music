import React, { useState, useEffect } from "react";
import "./ListenHistory.css";
import { IoPause, IoPlay, IoTimeOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";

function ListenHistory({
  onPlaySong,
  currentSong,
  isPlaying,
  onTogglePlayPause,
}) {
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem("token");
    const backendUrl =
      process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

    if (!token) {
      setHistory([]);
      setError(t("listenHistory.errors.loginRequired"));
      setIsLoading(false);
      return () => controller.abort();
    }

    setIsLoading(true);
    setError(null);

    fetch(`${backendUrl}/api/history`, {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.error("Error loading history:", err);
        setError(t("listenHistory.errors.fetchFailed"));
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [t]);

  // Hàm format thời gian (ví dụ: "2 giờ trước")
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return t("listenHistory.time.justNow");
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
      return t("listenHistory.time.minutesAgo", { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("listenHistory.time.hoursAgo", { count: hours });
    const days = Math.floor(hours / 24);
    return t("listenHistory.time.daysAgo", { count: days });
  };

  return (
    <div className="listen-history">
      <div className="history-header">
        <h2>{t("listenHistory.title")}</h2>
        <button
          type="button"
          className="zm-btn play-all-btn"
          onClick={() => history.length > 0 && onPlaySong(history[0], history)}
          disabled={history.length === 0}
          title={
            history.length === 0
              ? t("listenHistory.playAllTitleEmpty")
              : t("listenHistory.playAllTitle")
          }
        >
          <IoPlay /> {t("listenHistory.playAllButton")}
        </button>
      </div>

      <div className="history-list">
        {isLoading ? (
          <div className="history-status">
            <p>{t("listenHistory.loading")}</p>
          </div>
        ) : error ? (
          <div className="history-status">
            <p>{error}</p>
          </div>
        ) : history.length === 0 ? (
          <div className="no-history">
            <p>{t("listenHistory.empty")}</p>
          </div>
        ) : (
          history.map((song, index) => (
            <div
              className="history-item"
              key={`${song.id}-${song.playedAt || "na"}-${index}`} // Key unique vì 1 bài có thể nghe nhiều lần
              onClick={() => onPlaySong(song, history)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPlaySong(song, history);
                }
              }}
            >
              <div className="history-item-left">
                <img
                  src={song.imageUrl}
                  alt={song.title}
                  className="history-item-cover"
                  onError={(e) => {
                    e.target.src =
                      "https://placehold.co/60x60/7a3c9e/ffffff?text=Err";
                  }}
                />
                <div className="history-item-info">
                  <h4>{song.title}</h4>
                  <p>{song.artists}</p>
                </div>
              </div>
              <div className="history-item-right">
                {String(song.id) === String(currentSong?.id) ? (
                  <button
                    type="button"
                    className="history-now-btn"
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
                  <span className="time-ago">
                    <IoTimeOutline /> {formatTimeAgo(song.playedAt)}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ListenHistory;
