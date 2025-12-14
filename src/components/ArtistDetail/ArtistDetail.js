import React, { useEffect, useMemo, useState } from "react";
import "../MainContent/MainContent.css";
import "./ArtistDetail.css";
import { IoChevronBack, IoPlay } from "react-icons/io5";

function ArtistDetail({ artistId, onBack, onPlaySong }) {
  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const artistIdNormalized = useMemo(() => Number(artistId), [artistId]);

  useEffect(() => {
    const fetchDetail = async () => {
      setError("");
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:5001/api/artists/${artistIdNormalized}`
        );
        const data = await res.json();
        if (!res.ok) {
          setArtist(null);
          setSongs([]);
          setError(data?.error || `Lỗi tải nghệ sĩ (HTTP ${res.status})`);
          return;
        }

        setArtist(data?.artist || null);
        setSongs(Array.isArray(data?.songs) ? data.songs : []);
      } catch (e) {
        setArtist(null);
        setSongs([]);
        setError("Lỗi kết nối server");
      } finally {
        setLoading(false);
      }
    };

    if (artistIdNormalized) fetchDetail();
    else {
      setArtist(null);
      setSongs([]);
      setError("artistId không hợp lệ");
      setLoading(false);
    }
  }, [artistIdNormalized]);

  if (loading) return <div style={{ padding: 20 }}>Đang tải nghệ sĩ...</div>;

  return (
    <div className="main-content artist-detail">
      <section className="content-section">
        <div className="section-header artist-detail-header">
          <div className="artist-detail-title">
            <button className="artist-back-btn" onClick={onBack} type="button">
              <IoChevronBack /> Quay lại
            </button>
            <h2>Chi Tiết Nghệ Sĩ</h2>
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
                <div className="artist-hero-bio empty">Chưa có tiểu sử.</div>
              )}
              <div className="artist-hero-actions">
                <button
                  type="button"
                  className="artist-play-all"
                  disabled={!songs.length}
                  onClick={() => songs.length && onPlaySong(songs[0], songs)}
                >
                  <IoPlay /> Phát tất cả
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="artist-songs">
          <div className="artist-songs-title">
            <h3>Bài hát</h3>
            <span className="artist-songs-count">{songs.length}</span>
          </div>

          {songs.length === 0 ? (
            <div className="artist-empty-songs">Chưa có bài hát.</div>
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


