import React, { useEffect, useState } from "react";
import "../MainContent/MainContent.css";
import "./ArtistLibrary.css";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { useTranslation } from "react-i18next";

function ArtistLibrary({ onBack, onViewArtist }) {
  const { t } = useTranslation();
  const [artists, setArtists] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  const BACKEND_URL =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

  const fetchArtists = async (nextPage = 1) => {
    setError("");
    try {
      setIsLoading(true);

      const res = await fetch(
        `${BACKEND_URL}/api/artists?page=${nextPage}&limit=${limit}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(
          data?.error ||
            t("artistLibrary.errors.fetchFailed", { status: res.status })
        );
        setArtists([]);
        return;
      }

      const list = Array.isArray(data?.data) ? data.data : [];
      setArtists(list);
      const tp = Number(data?.pagination?.totalPages || 1);
      setTotalPages(tp);
      setPage(Number(data?.pagination?.page || nextPage));
    } catch (e) {
      setError(t("errors.serverConnection"));
      setArtists([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArtists(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchArtists(newPage);
  };

  if (isLoading)
    return <div style={{ padding: 20 }}>{t("artistLibrary.loading")}</div>;

  return (
    <div className="main-content artist-library">
      <section className="content-section">
        <div className="section-header">
          <div className="artist-library-title">
            <button className="artist-back-btn" onClick={onBack} type="button">
              <IoChevronBack /> {t("common.back")}
            </button>
            <h2>{t("artistLibrary.title")}</h2>
          </div>
        </div>

        {error ? <div className="artist-error">{error}</div> : null}

        <div className="artist-list">
          {artists.map((a) => (
            <button
              key={a.id}
              type="button"
              className="artist-row"
              onClick={() => onViewArtist && onViewArtist(a.id)}
              title={a.name}
            >
              <div className="artist-row-avatar">
                <img
                  src={
                    a.avatarUrl ||
                    "https://placehold.co/80x80/2f2739/ffffff?text=Artist"
                  }
                  alt={a.name}
                  onError={(e) => {
                    e.target.src =
                      "https://placehold.co/80x80/2f2739/ffffff?text=Artist";
                  }}
                />
              </div>
              <div className="artist-row-meta">
                <div className="artist-row-name">{a.name}</div>
                {a.bio ? <div className="artist-row-bio">{a.bio}</div> : null}
              </div>
            </button>
          ))}
        </div>

        <div className="artist-pagination">
          <button
            type="button"
            className="artist-page-btn"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            <IoChevronBack /> {t("artistLibrary.pagination.prev")}
          </button>

          <div className="artist-page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
              .map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`artist-page-number ${p === page ? "active" : ""}`}
                  onClick={() => handlePageChange(p)}
                >
                  {p}
                </button>
              ))}
          </div>

          <button
            type="button"
            className="artist-page-btn"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            {t("artistLibrary.pagination.next")} <IoChevronForward />
          </button>
        </div>
      </section>
    </div>
  );
}

export default ArtistLibrary;
