import React, { useEffect, useMemo, useState } from "react";
import "../MainContent/MainContent.css";
import "./GenreDetail.css";
import { IoChevronBack, IoPlay } from "react-icons/io5";

function GenreDetail({ genreId, onBack, onPlaySong }) {
  const [genre, setGenre] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const genreIdNormalized = useMemo(() => Number(genreId), [genreId]);

  useEffect(() => {
    const fetchDetail = async () => {
      setError("");
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:5001/api/genres/${genreIdNormalized}`
        );
        const data = await res.json();
        if (!res.ok) {
          setGenre(null);
          setSongs([]);
          setError(data?.error || `Lỗi tải thể loại (HTTP ${res.status})`);
          return;
        }

        setGenre(data?.genre || null);
        setSongs(Array.isArray(data?.songs) ? data.songs : []);
      } catch (e) {
        setGenre(null);
        setSongs([]);
        setError("Lỗi kết nối server");
      } finally {
        setLoading(false);
      }
    };

    if (genreIdNormalized) fetchDetail();
    else {
      setGenre(null);
      setSongs([]);
      setError("genreId không hợp lệ");
      setLoading(false);
    }
  }, [genreIdNormalized]);

  if (loading) return <div style={{ padding: 20 }}>Đang tải thể loại...</div>;

  return (
    <div className="main-content genre-detail">
      <section className="content-section">
        <div className="section-header genre-detail-header">
          <div className="genre-detail-title">
            <button className="genre-back-btn" onClick={onBack} type="button">
              <IoChevronBack /> Quay lại
            </button>
            <h2>Chi Tiết Thể Loại</h2>
          </div>
        </div>

        {error ? <div className="genre-error">{error}</div> : null}

        {genre ? (
          <div className="genre-hero">
            <div className="genre-hero-meta">
              <div className="genre-hero-name">{genre.name}</div>
              {genre.description ? (
                <div className="genre-hero-desc">{genre.description}</div>
              ) : (
                <div className="genre-hero-desc empty">Chưa có mô tả.</div>
              )}
              <div className="genre-hero-stats">
                <span className="genre-hero-count">
                  {Number(genre.songCount ?? songs.length ?? 0)}
                </span>
                <span className="genre-hero-count-label">bài hát</span>
              </div>
              <div className="genre-hero-actions">
                <button
                  type="button"
                  className="genre-play-all"
                  disabled={!songs.length}
                  onClick={() => songs.length && onPlaySong(songs[0], songs)}
                >
                  <IoPlay /> Phát tất cả
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="genre-songs">
          <div className="genre-songs-title">
            <h3>Bài hát</h3>
            <span className="genre-songs-count">{songs.length}</span>
          </div>

          {songs.length === 0 ? (
            <div className="genre-empty-songs">Chưa có bài hát.</div>
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

export default GenreDetail;


