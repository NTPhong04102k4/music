import React, { useEffect, useState } from "react";
import "../MainContent/MainContent.css";
import "./GenreLibrary.css";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { useTranslation } from "react-i18next";

function GenreLibrary({ onBack, onViewGenre }) {
  const { t } = useTranslation();
  const [genres, setGenres] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  const BACKEND_URL =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

  const fetchGenres = async (nextPage = 1) => {
    setError("");
    try {
      setIsLoading(true);
      const res = await fetch(
        `${BACKEND_URL}/api/genres?page=${nextPage}&limit=${limit}`
      );
      const data = await res.json();
      if (!res.ok) {
        setGenres([]);
        setError(
          data?.error ||
            t("genreLibrary.errors.fetchFailed", { status: res.status })
        );
        return;
      }

      const list = Array.isArray(data?.data) ? data.data : [];
      setGenres(list);
      const tp = Number(data?.pagination?.totalPages || 1);
      setTotalPages(tp);
      setPage(Number(data?.pagination?.page || nextPage));
    } catch (e) {
      setGenres([]);
      setError(t("errors.serverConnection"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGenres(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchGenres(newPage);
  };

  if (isLoading)
    return <div style={{ padding: 20 }}>{t("genreLibrary.loading")}</div>;

  return (
    <div className="main-content genre-library">
      <section className="content-section">
        <div className="section-header">
          <div className="genre-library-title">
            <button className="genre-back-btn" onClick={onBack} type="button">
              <IoChevronBack /> {t("common.back")}
            </button>
            <h2>{t("genreLibrary.title")}</h2>
          </div>
        </div>

        {error ? <div className="genre-error">{error}</div> : null}

        <div className="genre-list">
          {genres.map((g) => (
            <button
              key={g.id}
              type="button"
              className="genre-row"
              onClick={() => onViewGenre && onViewGenre(g.id)}
              title={g.name}
            >
              <div className="genre-row-left">
                <div className="genre-row-name">{g.name}</div>
                {g.description ? (
                  <div className="genre-row-desc">{g.description}</div>
                ) : null}
              </div>
              <div className="genre-row-right">
                <span className="genre-row-count">
                  {Number(g.songCount || 0)}
                </span>
                <span className="genre-row-count-label">
                  {t("genreLibrary.songCountShortLabel")}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="genre-pagination">
          <button
            type="button"
            className="genre-page-btn"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            <IoChevronBack /> {t("genreLibrary.pagination.prev")}
          </button>

          <div className="genre-page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
              .map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`genre-page-number ${p === page ? "active" : ""}`}
                  onClick={() => handlePageChange(p)}
                >
                  {p}
                </button>
              ))}
          </div>

          <button
            type="button"
            className="genre-page-btn"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            {t("genreLibrary.pagination.next")} <IoChevronForward />
          </button>
        </div>
      </section>
    </div>
  );
}

export default GenreLibrary;
