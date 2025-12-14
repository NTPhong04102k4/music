import React, { useState, useEffect } from "react";
import "./MainContent.css";
import {
  IoChevronForward,
  IoPlay,
  IoRefresh,
  IoEllipsisHorizontal,
  IoAdd,
} from "react-icons/io5"; // Thêm import icon
import { SONG_STATS_CHANGED_EVENT } from "../../utils/songEvents";

function MainContent({
  onPlaySong,
  onViewAlbum,
  onOpenSongAction,
  onViewCharts,
  onViewArtists,
  onViewArtist,
  isLoggedIn,
  favorites,
  onToggleFavorite,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [partners, setPartners] = useState([]);
  const [artistsPreview, setArtistsPreview] = useState([]);
  const [chartCategory, setChartCategory] = useState("all"); // all | vn | foreign

  // --- FETCH DATA ---
  const fetchSuggestions = () => {
    fetch("http://localhost:5001/api/suggestions")
      .then((response) => response.json())
      .then((data) => setSuggestions(data))
      .catch((error) => console.error("Error fetching suggestions:", error));
  };

  const fetchChartData = () => {
    fetch(`http://localhost:5001/api/charts?category=${chartCategory}`)
      .then((response) => response.json())
      .then((data) => setChartData(data))
      .catch((error) => console.error("Error fetching charts:", error));
  };

  const fetchPartners = () => {
    fetch("http://localhost:5001/api/partners")
      .then((response) => response.json())
      .then((data) => setPartners(data))
      .catch((error) => console.error("Error fetching partners:", error));
  };

  const fetchArtistsPreview = () => {
    fetch("http://localhost:5001/api/artists?page=1&limit=5")
      .then((response) => response.json())
      .then((data) => {
        const list = Array.isArray(data?.data) ? data.data : [];
        setArtistsPreview(list);
      })
      .catch((error) => {
        console.error("Error fetching artists:", error);
        setArtistsPreview([]);
      });
  };

  useEffect(() => {
    fetchSuggestions();
    fetchChartData();
    fetchPartners();
    fetchArtistsPreview();
  }, []);

  // Global refresh: sau khi like/unlike ở bất kỳ đâu, gọi GET lại để đồng bộ UI toàn dự án
  useEffect(() => {
    const handler = () => {
      fetchSuggestions();
      fetchChartData();
    };
    window.addEventListener(SONG_STATS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(SONG_STATS_CHANGED_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartCategory]);

  useEffect(() => {
    fetchChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartCategory]);

  return (
    <div className="main-content">
      {/* === GỢI Ý BÀI HÁT === */}
      <section className="content-section">
        <div className="section-header">
          <h2>Gợi Ý Bài Hát</h2>
          <button className="zm-btn refresh-btn" onClick={fetchSuggestions}>
            <IoRefresh />
            LÀM MỚI
          </button>
        </div>

        <div className="song-list-grid three-columns">
          {suggestions.map((item) => (
            <div
              className="song-item"
              key={item.id}
              // Click vào cả khối cũng phát nhạc (UX tốt hơn) - nhưng phải cẩn thận với click vào nút action
              // Tốt nhất là bỏ click tổng, chỉ click vào ảnh/tên để tránh xung đột với nút action
              // Hoặc giữ lại và dùng e.stopPropagation() ở nút action (đã làm bên dưới)
              onClick={() => onPlaySong(item, suggestions)}
            >
              <div className="song-item-left">
                <img
                  src={
                    item.imageUrl ||
                    "https://placehold.co/60x60/7a3c9e/ffffff?text=Err"
                  }
                  alt={item.title}
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
                <h4 className="song-title-clickable">{item.title}</h4>
                <p>{item.artists}</p>
              </div>

              {/* === SỬA: Thêm khu vực Action (Yêu thích & Tùy chọn) === */}
              <div className="song-item-actions">
                <button
                  className="action-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // Ngăn phát nhạc khi bấm nút này
                    if (onOpenSongAction) onOpenSongAction(item);
                  }}
                  title="Khác"
                >
                  <IoEllipsisHorizontal />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === BẢNG XẾP HẠNG === */}
      {/* (Giữ nguyên phần này hoặc áp dụng tương tự nếu muốn) */}
      <section className="content-section">
        <div className="section-header">
          <h2>Bảng Xếp Hạng Nhạc</h2>
          <div className="chart-tabs">
            <button
              type="button"
              className={`chart-tab ${chartCategory === "all" ? "active" : ""}`}
              onClick={() => setChartCategory("all")}
            >
              TẤT CẢ
            </button>
            <button
              type="button"
              className={`chart-tab ${chartCategory === "vn" ? "active" : ""}`}
              onClick={() => setChartCategory("vn")}
            >
              NHẠC VIỆT
            </button>
            <button
              type="button"
              className={`chart-tab ${
                chartCategory === "foreign" ? "active" : ""
              }`}
              onClick={() => setChartCategory("foreign")}
            >
              NHẠC NGOẠI
            </button>
          </div>
          <button
            type="button"
            className="see-all"
            onClick={() => onViewCharts && onViewCharts(chartCategory)}
          >
            TẤT CẢ <IoChevronForward />
          </button>
        </div>
        <div className="chart-container">
          {Array.isArray(chartData) &&
            chartData.map((song, index) => (
              <div className="chart-item" key={song.id}>
                <div className="chart-item-left">
                  <span className={`chart-rank rank-${song.rank || index + 1}`}>
                    {song.rank || index + 1}
                  </span>
                  <img
                    src={
                      song.cover ||
                      "https://placehold.co/60x60/a64883/fff?text=No+Image"
                    }
                    alt={song.title}
                    className="chart-cover"
                    onError={(e) => {
                      e.target.src =
                        "https://placehold.co/60x60/a64883/fff?text=No+Image";
                    }}
                    onClick={() => onPlaySong(song, chartData)}
                    style={{ cursor: "pointer" }}
                  />
                  <div className="chart-song-info">
                    <h4
                      className="song-title-clickable"
                      onClick={() => onPlaySong(song, chartData)}
                    >
                      {song.title}
                    </h4>
                    <p>{song.artists}</p>
                  </div>
                </div>
                <div className="chart-item-right">
                  <button
                    className="player-btn icon-btn play-pause-btn chart-play-btn"
                    onClick={() => onPlaySong(song, chartData)}
                  >
                    <IoPlay />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* === ĐỐI TÁC === */}
      <section className="content-section partners-section">
        <div className="section-header">
          <h2>Đối Tác Âm Nhạc</h2>
        </div>
        <div className="carousel-grid five-columns">
          {partners.map((partner) => (
            <div className="partner-logo" key={partner.id}>
              <img
                src={partner.logoUrl}
                alt={partner.name}
                onError={(e) => {
                  e.target.src =
                    "https://placehold.co/150x80/2f2739/a0a0a0?text=Logo";
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* === NGHỆ SĨ === */}
      <section className="content-section">
        <div className="section-header">
          <h2>Nghệ Sĩ</h2>
        </div>

        <div className="artist-preview-grid">
          {artistsPreview.map((a) => (
            <button
              key={a.id}
              type="button"
              className="artist-preview-card"
              onClick={() => onViewArtist && onViewArtist(a.id)}
              title={a.name}
            >
              <div className="artist-preview-avatar">
                <img
                  src={
                    a.avatarUrl ||
                    "https://placehold.co/180x180/2f2739/ffffff?text=Artist"
                  }
                  alt={a.name}
                  onError={(e) => {
                    e.target.src =
                      "https://placehold.co/180x180/2f2739/ffffff?text=Artist";
                  }}
                />
              </div>
              <div className="artist-preview-name">{a.name}</div>
            </button>
          ))}

          <button
            type="button"
            className="artist-preview-card artist-preview-viewall"
            onClick={() => onViewArtists && onViewArtists()}
            title="View All"
          >
            <div className="artist-preview-plus">
              <IoAdd />
            </div>
            <div className="artist-preview-viewall-text">View All</div>
          </button>
        </div>
      </section>
    </div>
  );
}

export default MainContent;
