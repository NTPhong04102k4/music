import React, { useState, useEffect, useCallback } from "react";
import {
  IoPlay,
  IoThumbsUpOutline,
  IoThumbsUp,
  IoEllipsisHorizontal,
  IoArrowBack,
} from "react-icons/io5";
import "./AlbumDetail.css";
import { emitSongStatsChanged } from "../../utils/songEvents";
import { useTranslation } from "react-i18next";

function AlbumDetail({ albumId, onBack, onPlaySong, onOpenSongAction }) {
  const { t } = useTranslation();
  const [albumData, setAlbumData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likedSongIds, setLikedSongIds] = useState(() => new Set());

  const BACKEND_URL =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

  const fetchAlbumDetails = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) setLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/album/${albumId}`);
        if (!response.ok) {
          throw new Error(t("albumDetail.errors.fetchFailed"));
        }
        const data = await response.json();
        setAlbumData(data);

        // Xác minh like theo tài khoản (nếu đã đăng nhập)
        const token = localStorage.getItem("token");
        if (token && Array.isArray(data?.songs) && data.songs.length > 0) {
          const songIds = data.songs.map((s) => s.id);
          const statusRes = await fetch(
            `${BACKEND_URL}/api/songs/like-status`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ songIds }),
            }
          );
          const statusData = await statusRes.json();
          if (statusRes.ok && Array.isArray(statusData?.likedSongIds)) {
            setLikedSongIds(new Set(statusData.likedSongIds));
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [albumId, BACKEND_URL, t]
  );

  useEffect(() => {
    setLikedSongIds(new Set());
    fetchAlbumDetails();
  }, [albumId, fetchAlbumDetails]);

  const handlePlayAlbum = () => {
    if (albumData?.songs?.length > 0) {
      onPlaySong(albumData.songs[0], albumData.songs);
    }
  };

  const handlePlaySong = (song) => {
    onPlaySong(song, albumData.songs);
  };

  const handleToggleLikeSong = async (songId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert(t("albumDetail.alerts.loginToLike"));
        return;
      }
      const isLiked = likedSongIds.has(songId);
      const endpoint = isLiked ? "unlike" : "like";

      const response = await fetch(
        `${BACKEND_URL}/api/songs/${songId}/${endpoint}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || t("albumDetail.errors.likeFailed"));
      }

      setLikedSongIds((prev) => {
        const next = new Set(prev);
        if (isLiked) next.delete(songId);
        else next.add(songId);
        return next;
      });

      // Re-fetch để đảm bảo LuotThich đúng theo DB
      await fetchAlbumDetails({ silent: true });

      // Global notify để các màn khác gọi GET lại (đồng bộ toàn dự án)
      emitSongStatsChanged({ songId, likeCount: data?.likeCount });
    } catch (err) {
      alert(err.message || t("albumDetail.errors.likeFailed"));
    }
  };

  if (loading) {
    return (
      <div className="album-detail">
        <div className="loading">{t("common.loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="album-detail">
        <div className="error">
          {t("albumDetail.errorLabel")}: {error}
        </div>
        <button onClick={onBack} className="back-btn">
          {t("common.back")}
        </button>
      </div>
    );
  }

  if (!albumData) {
    return (
      <div className="album-detail">
        <div className="error">{t("albumDetail.notFound")}</div>
        <button onClick={onBack} className="back-btn">
          {t("common.back")}
        </button>
      </div>
    );
  }

  const { album, songs } = albumData;

  return (
    <div className="album-detail">
      {/* Header */}
      <div className="album-header">
        <button onClick={onBack} className="back-btn">
          <IoArrowBack />
        </button>
        <div className="album-info">
          <img
            src={album.imageUrl}
            alt={album.title}
            className="album-cover"
            onError={(e) => {
              e.target.src =
                "https://placehold.co/300x300/4a90e2/ffffff?text=No+Image";
            }}
          />
          <div className="album-details">
            <h1>{album.title}</h1>
            <p className="album-artists">{album.artists}</p>
            <p className="album-meta">
              {t("albumDetail.songsCount", { count: songs.length })} •{" "}
              {album.releaseDate
                ? new Date(album.releaseDate).getFullYear()
                : t("common.notAvailable")}
            </p>
            <button className="play-album-btn" onClick={handlePlayAlbum}>
              <IoPlay />
              {t("albumDetail.playAlbum")}
            </button>
          </div>
        </div>
      </div>

      {/* Songs List */}
      <div className="songs-list">
        <h2>{t("albumDetail.songsListTitle")}</h2>
        <div className="songs-container">
          {songs.map((song, index) => (
            <div key={song.id} className="song-item">
              <div className="song-number">{index + 1}</div>
              <img
                src={song.imageUrl}
                alt={song.title}
                className="song-cover"
                onError={(e) => {
                  e.target.src =
                    "https://placehold.co/60x60/7a3c9e/ffffff?text=No+Image";
                }}
              />
              <div className="song-info">
                <h3>{song.title}</h3>
                <p>{song.artists}</p>
              </div>
              <div className="song-actions">
                {(() => {
                  const isLiked = likedSongIds.has(song.id);
                  return (
                    <button
                      className={`action-btn ${isLiked ? "liked" : ""}`}
                      title={t("albumDetail.tooltips.like")}
                      onClick={() => handleToggleLikeSong(song.id)}
                    >
                      {isLiked ? (
                        <IoThumbsUp style={{ color: "#fff" }} />
                      ) : (
                        <IoThumbsUpOutline />
                      )}
                    </button>
                  );
                })()}
                <button
                  className="action-btn"
                  title={t("albumDetail.tooltips.options")}
                  onClick={() => onOpenSongAction && onOpenSongAction(song)}
                >
                  <IoEllipsisHorizontal />
                </button>
                <button
                  className="play-btn"
                  onClick={() => handlePlaySong(song)}
                >
                  <IoPlay />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AlbumDetail;
