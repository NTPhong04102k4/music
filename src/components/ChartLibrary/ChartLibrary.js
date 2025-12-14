import React, { useEffect, useRef, useState } from "react";
import "../MainContent/MainContent.css";
import "./ChartLibrary.css";
import { IoChevronBack, IoPlay } from "react-icons/io5";

function ChartLibrary({ onBack, onPlaySong, initialCategory = "all" }) {
  const [songs, setSongs] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState(initialCategory); // all | vn | foreign

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;
  const refreshTimerRef = useRef(null);

  const fetchAllCharts = async (page = 1, opts = { showGlobalLoading: false }) => {
    if (opts?.showGlobalLoading) setIsInitialLoading(true);
    setError("");
    try {
      const res = await fetch(
        `http://localhost:5001/api/charts/all?category=${category}&page=${page}&limit=${limit}`
      );
      const data = await res.json();
      if (!res.ok) {
        setSongs([]);
        setError(data?.error || `Lỗi tải bảng xếp hạng (HTTP ${res.status})`);
        return;
      }
      if (data && Array.isArray(data.data)) {
        setSongs(data.data);
        if (data.pagination) {
          setCurrentPage(Number(data.pagination.page || page));
          setTotalPages(Number(data.pagination.totalPages || 1));
        }
      } else {
        setSongs([]);
        setError("Dữ liệu trả về không hợp lệ");
      }
    } catch (e) {
      setSongs([]);
      setError("Lỗi kết nối server");
    } finally {
      if (opts?.showGlobalLoading) setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCharts(1, { showGlobalLoading: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If navigation opens with different initialCategory later (rare), sync once
  useEffect(() => {
    setCategory(initialCategory || "all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCategory]);

  const refreshPage = async (page = currentPage) => {
    const startMs = Date.now();
    setIsRefreshing(true);
    try {
      await fetchAllCharts(page, { showGlobalLoading: false });
    } finally {
      const elapsed = Date.now() - startMs;
      const remain = Math.max(0, 200 - elapsed);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => setIsRefreshing(false), remain);
    }
  };

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  // refetch when switching category
  useEffect(() => {
    setCurrentPage(1);
    fetchAllCharts(1, { showGlobalLoading: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    refreshPage(newPage);
  };

  if (isInitialLoading) return <div style={{ padding: 20 }}>Đang tải bảng xếp hạng...</div>;

  return (
    <div className="main-content chart-library">
      <section className="content-section">
        <div className="section-header">
          <div className="chart-library-title">
            <button className="chart-back-btn" onClick={onBack} type="button">
              <IoChevronBack /> Quay lại
            </button>
            <h2>Tất Cả Bảng Xếp Hạng</h2>
          </div>

          <div className="chart-tabs">
            <button
              type="button"
              className={`chart-tab ${category === "all" ? "active" : ""}`}
              onClick={() => {
                setCategory("all");
              }}
            >
              TẤT CẢ
            </button>
            <button
              type="button"
              className={`chart-tab ${category === "vn" ? "active" : ""}`}
              onClick={() => {
                setCategory("vn");
              }}
            >
              NHẠC VIỆT
            </button>
            <button
              type="button"
              className={`chart-tab ${category === "foreign" ? "active" : ""}`}
              onClick={() => {
                setCategory("foreign");
              }}
            >
              NHẠC NGOẠI
            </button>
          </div>

          <button
            className="zm-btn refresh-btn"
            type="button"
            onClick={() => refreshPage(currentPage)}
            disabled={isRefreshing}
          >
            <span className={`reload-spinner ${isRefreshing ? "" : "hidden"}`} />
            LÀM MỚI
          </button>
        </div>

        {error && (
          <div className="chart-error">
            {error}
          </div>
        )}

        <div className="chart-container">
          {songs.map((song) => (
            <div className="chart-item" key={song.id}>
              <div className="chart-item-left">
                <span className={`chart-rank rank-${song.rank}`}>{song.rank}</span>
                <img
                  src={song.cover || "https://placehold.co/60x60/a64883/fff?text=No+Image"}
                  alt={song.title}
                  className="chart-cover"
                  onError={(e) => {
                    e.target.src = "https://placehold.co/60x60/a64883/fff?text=No+Image";
                  }}
                  onClick={() => onPlaySong(song, songs)}
                  style={{ cursor: "pointer" }}
                />
                <div className="chart-song-info">
                  <h4 className="song-title-clickable" onClick={() => onPlaySong(song, songs)}>
                    {song.title}
                  </h4>
                  <p>{song.artists}</p>
                </div>
              </div>
              <div className="chart-item-right">
                <button
                  className="player-btn icon-btn play-pause-btn chart-play-btn"
                  onClick={() => onPlaySong(song, songs)}
                >
                  <IoPlay />
                </button>
              </div>
            </div>
          ))}
          {songs.length === 0 && !error && (
            <div style={{ color: "var(--text-secondary)" }}>Chưa có dữ liệu.</div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination-controls">
            <button
              className="admin-btn"
              disabled={currentPage === 1 || isRefreshing}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Trước
            </button>
            <span className="pagination-info">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              className="admin-btn"
              disabled={currentPage === totalPages || isRefreshing}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Sau
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default ChartLibrary;


