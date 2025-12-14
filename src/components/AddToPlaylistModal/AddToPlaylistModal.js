import React, { useState, useEffect } from "react";
import "./AddToPlaylistModal.css";
import { IoClose, IoAdd } from "react-icons/io5";
import { useTranslation } from "react-i18next";

function AddToPlaylistModal({ song, onClose, onAddToPlaylist }) {
  const { t } = useTranslation();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          }
        })
        .catch((err) => console.error("Error loading playlists:", err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handlePlaylistClick = (playlistId) => {
    onAddToPlaylist(playlistId, song.id);
  };

  return (
    <div className="add-playlist-overlay" onClick={onClose}>
      <div
        className="add-playlist-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="add-playlist-header">
          <h3>{t("playlist.addToPlaylist.title")}</h3>
          <button onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <div className="add-playlist-body">
          <p>
            {t("playlist.addToPlaylist.chooseToAdd")}{" "}
            <strong>{song.title}</strong>
          </p>

          {loading ? (
            <div className="loading-text">{t("common.loading")}</div>
          ) : (
            <ul className="playlist-select-list">
              {playlists.length === 0 ? (
                <li className="no-playlist-item">
                  {t("playlist.addToPlaylist.empty")}
                </li>
              ) : (
                playlists.map((playlist) => (
                  <li
                    key={playlist.id}
                    onClick={() => handlePlaylistClick(playlist.id)}
                  >
                    <span className="playlist-icon">
                      <IoAdd />
                    </span>
                    <span className="playlist-name">{playlist.name}</span>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddToPlaylistModal;
