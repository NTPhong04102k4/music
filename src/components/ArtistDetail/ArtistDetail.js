import React, { useEffect, useMemo, useState } from "react";
import "../MainContent/MainContent.css";
import "./ArtistDetail.css";
import { IoChevronBack, IoPlay } from "react-icons/io5";
import { useTranslation } from "react-i18next";

function ArtistDetail({ artistId, onBack, onPlaySong }) {
  const { t } = useTranslation();
  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const artistIdNormalized = useMemo(() => Number(artistId), [artistId]);
  const BACKEND_URL =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

  useEffect(() => {
    const fetchDetail = async () => {
      setError("");
      setLoading(true);
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/artists/${artistIdNormalized}`
        );
        const data = await res.json();
        if (!res.ok) {
          setArtist(null);
          setSongs([]);
          setError(
            data?.error ||
              t("artistDetail.errors.fetchFailed", { status: res.status })
          );
          return;
        }

        setArtist(data?.artist || null);
        setSongs(Array.isArray(data?.songs) ? data.songs : []);
      } catch (e) {
        setArtist(null);
        setSongs([]);
        setError(t("errors.serverConnection"));
      } finally {
        setLoading(false);
      }
    };

    if (artistIdNormalized) fetchDetail();
    else {
      setArtist(null);
      setSongs([]);
      setError(t("artistDetail.errors.invalidArtistId"));
      setLoading(false);
    }
  }, [artistIdNormalized, BACKEND_URL, t]);

  if (loading)
    return <div style={{ padding: 20 }}>{t("artistDetail.loadingArtist")}</div>;

  return (
    <div className="main-content artist-detail">
      <section className="content-section">
        <div className="section-header artist-detail-header">
          <div className="artist-detail-title">
            <button className="artist-back-btn" onClick={onBack} type="button">
              <IoChevronBack /> {t("common.back")}
            </button>
            <h2>{t("artistDetail.title")}</h2>
          </div>
        </div>

        {error ? <div className="artist-error">{error}</div> : null}

        {artist ? (
          <div className="artist-hero">
            <div className="artist-hero-avatar">
              <img
                src={
                  artist.avatarUrl ||
                  "https://placehold.co/220x220/2f2739/ffffff?text=Artist"
                }
                alt={artist.name}
                onError={(e) => {
                  e.target.src =
                    "https://placehold.co/220x220/2f2739/ffffff?text=Artist";
                }}
              />
            </div>
            <div className="artist-hero-meta">
              <div className="artist-hero-name">{artist.name}</div>
              {artist.bio ? (
                <div className="artist-hero-bio">{artist.bio}</div>
              ) : (
                <div className="artist-hero-bio empty">
                  {t("artistDetail.emptyBio")}
                </div>
              )}
              <div className="artist-hero-actions">
                <button
                  type="button"
                  className="artist-play-all"
                  disabled={!songs.length}
                  onClick={() => songs.length && onPlaySong(songs[0], songs)}
                >
                  <IoPlay /> {t("artistDetail.playAll")}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="artist-songs">
          <div className="artist-songs-title">
            <h3>{t("artistDetail.songsTitle")}</h3>
            <span className="artist-songs-count">{songs.length}</span>
          </div>

          {songs.length === 0 ? (
            <div className="artist-empty-songs">
              {t("artistDetail.emptySongs")}
            </div>
          ) : (
            <div className="song-list-grid three-columns">
              {songs.map((s) => (
                <div
                  className="song-item"
                  key={s.id}
                  onClick={() => onPlaySong && onPlaySong(s, songs)}
                  title={s.title}
                >
                  <div className="song-item-left">
                    <img
                      src={
                        s.imageUrl ||
                        "https://placehold.co/60x60/7a3c9e/ffffff?text=Err"
                      }
                      alt={s.title}
                      className="song-item-cover"
                      onError={(e) => {
                        e.target.src =
                          "https://placehold.co/60x60/7a3c9e/ffffff?text=Err";
                      }}
                    />
                    <div className="song-item-play-icon">
                      <IoPlay />
                    </div>
                  </div>
                  <div className="song-item-info">
                    <h4 className="song-title-clickable">{s.title}</h4>
                    <p>{s.artists}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default ArtistDetail;
