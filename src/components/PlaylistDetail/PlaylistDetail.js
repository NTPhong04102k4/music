import React, { useState, useEffect, useCallback } from "react";
import "./PlaylistDetail.css";
import { IoArrowBack, IoPause, IoPlay, IoTrashOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";

function shuffleArray(input) {
  const arr = Array.isArray(input) ? [...input] : [];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function PlaylistCoverCollage({ images = [], fallbackSrc, alt }) {
  const list = Array.isArray(images) ? images.filter(Boolean).slice(0, 4) : [];
  const count = list.length;

  if (count === 0) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        onError={(e) => {
          e.target.src =
            "https://placehold.co/300x300/2f2739/ffffff?text=Playlist";
        }}
      />
    );
  }

  if (count === 1) {
    return (
      <div className="playlist-cover-collage count-1" aria-label={alt}>
        <div className="collage-cell">
          <img
            src={list[0]}
            alt={alt}
            onError={(e) => {
              e.target.src =
                "https://placehold.co/300x300/2f2739/ffffff?text=Playlist";
            }}
          />
        </div>
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="playlist-cover-collage count-2" aria-label={alt}>
        {list.slice(0, 2).map((src, i) => (
          <div className="collage-cell" key={i}>
            <img
              src={src}
              alt={alt}
              onError={(e) => {
                e.target.src =
                  "https://placehold.co/300x300/2f2739/ffffff?text=Playlist";
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="playlist-cover-collage count-4" aria-label={alt}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div className="collage-cell" key={i}>
          {list[i] ? (
            <img
              src={list[i]}
              alt={alt}
              onError={(e) => {
                e.target.src =
                  "https://placehold.co/300x300/2f2739/ffffff?text=Playlist";
              }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function PlaylistDetail({
  playlistId,
  onBack,
  onPlaySong,
  currentSong,
  isPlaying,
  onTogglePlayPause,
}) {
  const { t, i18n } = useTranslation();
  const BACKEND_URL =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

  const currentLang = (i18n.resolvedLanguage || i18n.language || "vi")
    .toLowerCase()
    .split("-")[0];
  const dateLocale = currentLang === "en" ? "en-US" : "vi-VN";

  const [playlistInfo, setPlaylistInfo] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlaylistDetail = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!playlistId || !token) {
      setPlaylistInfo(null);
      setSongs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/playlists/${playlistId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || t("playlistDetail.errors.fetchFailed"));
      }

      const { songs: fetchedSongs, ...info } = data || {};
      setPlaylistInfo(info || null);
      setSongs(fetchedSongs || []);
    } catch (err) {
      console.error("Error loading playlist detail:", err);
      setPlaylistInfo(null);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  }, [playlistId, BACKEND_URL, t]);

  useEffect(() => {
    fetchPlaylistDetail();
  }, [fetchPlaylistDetail]);

  const handlePlayRandom = useCallback(() => {
    if (!Array.isArray(songs) || songs.length === 0) return;
    const shuffled = shuffleArray(songs);
    onPlaySong?.(shuffled[0], shuffled);
  }, [onPlaySong, songs]);

  const handleRemoveSongFromPlaylist = useCallback(
    async (songId, e) => {
      e?.stopPropagation?.();

      if (!playlistId || !songId) return;
      const token = localStorage.getItem("token");
      if (!token) {
        alert(t("playlistDetail.alerts.loginToRemove"));
        return;
      }

      const ok = window.confirm(t("playlistDetail.confirms.removeSong"));
      if (!ok) return;

      try {
        const res = await fetch(
          `http://localhost:5001/api/playlists/${playlistId}/songs/${songId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            data?.error || t("playlistDetail.errors.removeFailed")
          );
        }

        // Gọi GET để làm mới dữ liệu
        await fetchPlaylistDetail();
      } catch (err) {
        console.error("Error removing song from playlist:", err);
        alert(err?.message || t("playlistDetail.errors.removeErrorFallback"));
      }
    },
    [fetchPlaylistDetail, playlistId, t]
  );

  if (loading) {
    return <div className="playlist-loading">{t("common.loading")}</div>;
  }

  if (!playlistInfo) {
    return (
      <div className="playlist-loading">{t("playlistDetail.notFound")}</div>
    );
  }

  return (
    <div className="playlist-detail">
      <button className="back-btn" onClick={onBack}>
        <IoArrowBack /> {t("common.back")}
      </button>

      <div className="playlist-detail-header">
        <div className="playlist-detail-cover">
          <PlaylistCoverCollage
            images={songs.map((s) => s.imageUrl).slice(0, 4)}
            fallbackSrc={
              playlistInfo.coverImage ||
              "https://placehold.co/300x300/2f2739/ffffff?text=Playlist"
            }
            alt={playlistInfo.name}
          />
        </div>
        <div className="playlist-detail-info">
          <h1>{playlistInfo.name}</h1>
          <p className="playlist-desc">
            {playlistInfo.description || t("playlistLibrary.createdByYou")}
          </p>
          <p className="playlist-meta">
            {t("playlistDetail.songsCount", { count: songs.length })} •{" "}
            {t("playlistDetail.updatedLabel")}{" "}
            {playlistInfo.createdAt
              ? new Date(playlistInfo.createdAt).toLocaleDateString(dateLocale)
              : "N/A"}
          </p>
          <button
            className="zm-btn play-all-btn"
            onClick={handlePlayRandom}
            disabled={songs.length === 0}
          >
            <IoPlay /> {t("playlistDetail.shufflePlay")}
          </button>
        </div>
      </div>

      <div className="playlist-songs-list">
        {songs.length === 0 ? (
          <div className="no-songs">{t("playlistDetail.empty")}</div>
        ) : (
          songs.map((song, index) => (
            <div
              className="playlist-song-item"
              key={song.id || song.songId || song._id || `${index}`}
              onClick={() => onPlaySong(song, songs)}
            >
              <span className="song-index">{index + 1}</span>
              <div className="song-main-info">
                <img
                  src={song.imageUrl}
                  alt={song.title}
                  className="song-thumb"
                  onError={(e) => {
                    e.target.src =
                      "https://placehold.co/60x60/7a3c9e/ffffff?text=Err";
                  }}
                />
                <div className="song-text">
                  <h4>{song.title}</h4>
                  <p>{song.artists}</p>
                </div>
              </div>
              <div className="song-actions-right">
                {String(song.id) === String(currentSong?.id) ? (
                  <button
                    className="playlist-song-now-btn"
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
                    className="playlist-song-delete-btn"
                    title={t("playlistDetail.tooltips.removeFromPlaylist")}
                    aria-label={t("playlistDetail.tooltips.removeFromPlaylist")}
                    onClick={(e) => handleRemoveSongFromPlaylist(song.id, e)}
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

export default PlaylistDetail;
