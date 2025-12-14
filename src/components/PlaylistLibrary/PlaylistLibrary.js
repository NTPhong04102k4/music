import React, { useState, useEffect } from "react";
import "./PlaylistLibrary.css";
import { IoPlay, IoAdd, IoClose } from "react-icons/io5";
import { useTranslation } from "react-i18next";

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

  // 3 or 4 -> render 2x2, missing cells are just background
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

function PlaylistLibrary({ onViewPlaylistDetail }) {
  const { t } = useTranslation();
  const [playlists, setPlaylists] = useState([]);

  // State cho Modal tạo Playlist
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");

  // Hàm fetch danh sách playlist
  const fetchPlaylists = () => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:5001/api/playlists", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setPlaylists(data);
          } else {
            setPlaylists([]);
          }
        })
        .catch((err) => console.error("Error loading playlists:", err));
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  // Hàm xử lý tạo playlist mới
  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert(t("playlistLibrary.alerts.loginRequired"));
      return;
    }

    try {
      const response = await fetch("http://localhost:5001/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newPlaylistName,
          description: newPlaylistDesc,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Tạo thành công -> đóng modal, reset form, tải lại danh sách
        setShowCreateModal(false);
        setNewPlaylistName("");
        setNewPlaylistDesc("");
        fetchPlaylists();
      } else {
        alert(data.error || t("playlistLibrary.alerts.createFailed"));
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
      alert(t("errors.serverConnection"));
    }
  };

  return (
    <div className="playlist-library">
      <div className="playlist-header">
        <h2>{t("playlistLibrary.title")}</h2>
        <button
          className="zm-btn create-playlist-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <IoAdd /> {t("playlistLibrary.createPlaylist")}
        </button>
      </div>

      <div className="playlist-grid">
        {playlists.length === 0 ? (
          <div className="no-playlist">
            <p>{t("playlistLibrary.empty")}</p>
          </div>
        ) : (
          playlists.map((playlist) => (
            <div
              className="playlist-card"
              key={playlist.id}
              onClick={() => onViewPlaylistDetail(playlist.id)}
            >
              <div className="playlist-image">
                <PlaylistCoverCollage
                  images={playlist.coverImages}
                  fallbackSrc={
                    playlist.coverImage ||
                    "https://placehold.co/300x300/2f2739/ffffff?text=Playlist"
                  }
                  alt={playlist.name}
                />
                <div className="playlist-overlay">
                  <button className="player-btn icon-btn play-btn">
                    <IoPlay />
                  </button>
                </div>
              </div>
              <div className="playlist-info">
                <h4>{playlist.name}</h4>
                <p>
                  {playlist.description || t("playlistLibrary.createdByYou")}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* === MODAL TẠO PLAYLIST === */}
      {showCreateModal && (
        <div
          className="create-playlist-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="create-playlist-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="create-playlist-header">
              <h3>{t("playlistLibrary.createModal.title")}</h3>
              <button
                aria-label={t("common.close")}
                onClick={() => setShowCreateModal(false)}
              >
                <IoClose />
              </button>
            </div>
            <form onSubmit={handleCreatePlaylist}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder={t("playlistLibrary.createModal.namePlaceholder")}
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder={t("playlistLibrary.createModal.descPlaceholder")}
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="create-btn-submit"
                disabled={!newPlaylistName.trim()}
              >
                {t("playlistLibrary.createModal.submit")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaylistLibrary;
