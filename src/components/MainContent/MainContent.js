import React, { useState, useEffect } from 'react';
import './MainContent.css'; // Nhập (Import) file CSS
// === SỬA: Thêm (Added) IoRefresh, xóa (removed) IoChevronForward (tạm-thời (for now)) ===
import { IoChevronForward, IoPlay, IoRefresh } from 'react-icons/io5';


// --- Component (Component) ---

function MainContent({ onPlaySong, onViewAlbum }) {
  const [suggestions, setSuggestions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [albumData, setAlbumData] = useState([]);
  const [partners, setPartners] = useState([]);

  // === SỬA: Tách (Separated) fetchSuggestions để-gọi-lại (to call it again) ===
  const fetchSuggestions = () => {
    // Dùng-URL-đầy-đủ (Use full URL) để-tránh-lỗi (to avoid errors) proxy
    fetch('http://localhost:5001/api/suggestions') 
      .then(response => response.json())
      .then(data => setSuggestions(data))
      .catch(error => console.error('Error fetching suggestions:', error));
  };

  const fetchChartData = () => {
    fetch('http://localhost:5001/api/charts')
      .then(response => response.json())
      .then(data => setChartData(data))
      .catch(error => console.error('Error fetching charts:', error));
  };

  const fetchAlbumData = () => {
    fetch('http://localhost:5001/api/albums')
      .then(response => response.json())
      .then(data => setAlbumData(data))
      .catch(error => console.error('Error fetching albums:', error));
  };

  const fetchPartners = () => {
     fetch('http://localhost:5001/api/partners')
      .then(response => response.json())
      .then(data => setPartners(data))
      .catch(error => console.error('Error fetching partners:', error));
  };

  useEffect(() => {
    // Gọi (Call) tất-cả-các-hàm (all functions) khi-khởi-động (on load)
    fetchSuggestions();
    fetchChartData();
    fetchAlbumData();
    fetchPartners();
  }, []);

  return (
    <div className="main-content">

      {/* === PHẦN 1: GỢI Ý BÀI HÁT (SECTION 1: SONG SUGGESTIONS) === */}
      {/* === Layout-này (This layout) đã-được-cập-nhật (is updated) === */}
      <section className="content-section">
        <div className="section-header">
          <h2>Gợi Ý Bài Hát</h2>
          <button className="zm-btn refresh-btn" onClick={fetchSuggestions}>
            <IoRefresh />
            LÀM MỚI
          </button>
        </div>
        
        {/* Layout-lưới (Grid layout) cho-các-bài-hát (for songs) */}
        <div className="song-list-grid three-columns">
          {suggestions.map((item) => (
            <div
              className="song-item"
              key={item.id}
              onClick={() => onPlaySong(item, suggestions)}
            >
              <div className="song-item-left">
                <img
                  src={item.imageUrl || 'https://placehold.co/60x60/7a3c9e/ffffff?text=Err'}
                  alt={item.title}
                  className="song-item-cover"
                  onError={(e) => {
                    console.error('Error loading suggestion image:', item.imageUrl);
                    e.target.src = 'https://placehold.co/60x60/7a3c9e/ffffff?text=Err';
                  }}
                />
                <div className="song-item-play-icon" onClick={() => onPlaySong(item, suggestions)}>
                  <IoPlay />
                </div>
              </div>
              <div className="song-item-info">
                <h4>
                  {item.title}
                  {/* Bạn-có-thể (You can) thêm-logic (add logic) PREMIUM ở-đây (here) */}
                </h4>
                <p>{item.artists}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* === KẾT-THÚC (END) PHẦN 1 === */}


      {/* === PHẦN 2: BẢNG XẾP HẠNG (#ZINGCHART) (SECTION 2: CHART) === */}
      {/* (Giữ-nguyên-logic (Keeping) fetch-logic-mới (your new fetch logic) và-onError (onError)) */}
      <section className="content-section">
        <div className="section-header">
          <h2>Bảng Xếp Hạng Nhạc</h2>
          <a href="#" className="see-all">
            TẤT CẢ <IoChevronForward />
          </a>
        </div>

        <div className="chart-container">
          {Array.isArray(chartData) && chartData.map((song, index) => (
            <div className="chart-item" key={song.id}>
              <div className="chart-item-left">
                <span className={`chart-rank rank-${song.rank || (index + 1)}`}>{song.rank || (index + 1)}</span>
                <img
                  src={song.cover || 'https://placehold.co/60x60/a64883/fff?text=No+Image'}
                  alt={song.title}
                  className="chart-cover"
                  onError={(e) => {
                    console.error('Error loading chart image:', song.cover);
                    e.target.src = 'https://placehold.co/60x60/a64883/fff?text=No+Image';
                  }}
                />
                <div className="chart-song-info">
                  <h4>{song.title}</h4>
                  <p>{song.artists}</p>
                </div>
              </div>
              <div className="chart-item-right">
                <button className="player-btn icon-btn play-pause-btn chart-play-btn" onClick={() => onPlaySong(song, chartData)}>
                  <IoPlay />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === PHẦN 3: ALBUM MỚI (SECTION 3: NEW ALBUMS) === */}
      {/* (Giữ-nguyên-logic (Keeping) onViewAlbum-mới-của-bạn (your new onViewAlbum logic)) */}
      <section className="content-section">
        <div className="section-header">
          <h2>Album Mới</h2>
          <a href="#" className="see-all">
            TẤT CẢ <IoChevronForward />
          </a>
        </div>

        <div className="carousel-grid five-columns">
          {albumData.map((item) => (
            <div className="song-card" key={item.id} onClick={() => onViewAlbum(item.id)} style={{cursor: 'pointer'}}>
              <div className="card-image">
                <img
                  src={item.imageUrl || 'https://placehold.co/300x300/4a90e2/ffffff?text=No+Image'}
                  alt={item.title}
                  onError={(e) => {
                    console.error('Error loading album image:', item.imageUrl);
                    e.target.src = 'https://placehold.co/300x300/4a90e2/ffffff?text=No+Image';
                  }}
                />
                {/* Đã-xóa (Removed) overlay-nút-play (play button overlay) cho (for) albums */}
              </div>
              <div className="card-info">
                <h3>{item.title}</h3>
                <p>{item.artists || 'Nhiều nghệ sĩ'}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* === KẾT-THÚC-PHẦN-ALBUM (END ALBUM SECTION) === */}


      {/* === PHẦN 4: ĐỐI TÁC ÂM NHẠC (SECTION 4: MUSIC PARTNERS) === */}
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
                  console.error('Error loading partner logo:', partner.logoUrl);
                  e.target.src = 'https://placehold.co/150x80/2f2739/a0a0a0?text=Logo';
                }}
              />
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

export default MainContent;