import React from 'react';
import './MainContent.css'; // Nhập (Import) file CSS
import { IoChevronForward, IoPlay } from 'react-icons/io5';

// --- DỮ-LIỆU-GIẢ (MOCK DATA) ---

// Dữ-liệu-cho (Data for) "Gợi ý" (Suggestions)
const suggestions = [
  {
    id: 1,
    title: "Today's V-Pop Hits",
    artists: 'Hoa Minzy, Hoàng Dũng, (S)TRONG, Bích Phương...',
    imageUrl: 'https://placehold.co/300x300/7a3c9e/ffffff?text=Today%27s+Hits',
  },
  {
    id: 2,
    title: 'V-Pop Đây Hứa Hẹn',
    artists: 'MiuLê, MiiNa, CAPTAIN BOY, Đạt G, ...',
    imageUrl: 'https://placehold.co/300x300/b84a6b/ffffff?text=V-Pop+H%E1%BB%A9a+H%E1%BA%B9n',
  },
  {
    id: 3,
    title: 'Đóa Hồng Nhạc Việt',
    artists: 'Hoa Minzy, Văn Mai Hương, Bích Phương, ...',
    imageUrl: 'https://placehold.co/300x300/a08269/ffffff?text=%C4%90%C3%B3a+H%E1%BB%93ng',
  },
];

// Dữ-liệu-cho (Data for) Bảng-xếp-hạng (Charts)
const chartData = [
  {
    id: 1,
    rank: 1,
    title: 'Từng Là',
    artists: 'Vũ Cát Tường',
    cover: 'https://placehold.co/60x60/a64883/fff?text=1',
  },
  {
    id: 2,
    rank: 2,
    title: 'Không Thể Say',
    artists: 'HIEUTHUHAI',
    cover: 'https://placehold.co/60x60/8b46a1/fff?text=2',
  },
  {
    id: 3,
    rank: 3,
    title: 'Ngày Mai Người Ta Lấy Chồng',
    artists: 'Thành Đạt',
    cover: 'https://placehold.co/60x60/6a4da8/fff?text=3',
  },
];

// DỮ-LIỆU-ALBUM-MỚI (NEW ALBUM DATA)
const albumData = [
  {
    id: 1,
    title: 'Những Bài Hát Hay Nhất',
    artists: 'Vũ Cát Tường',
    imageUrl: 'https://placehold.co/300x300/4a90e2/ffffff?text=Album+1',
  },
  {
    id: 2,
    title: 'OST Nữ Hoàng Nước Mắt',
    artists: 'Nhiều nghệ sĩ',
    imageUrl: 'https://placehold.co/300x300/50e3c2/ffffff?text=Album+2',
  },
  {
    id: 3,
    title: 'MIN',
    artists: 'MIN',
    imageUrl: 'https://placehold.co/300x300/e35050/ffffff?text=Album+3',
  },
  {
    id: 4,
    title: 'Golden Hour',
    artists: 'JVKE',
    imageUrl: 'https://placehold.co/300x300/f5a623/ffffff?text=Album+4',
  },
  {
    id: 5,
    title: 'Lover',
    artists: 'Taylor Swift',
    imageUrl: 'https://placehold.co/300x300/d0021b/ffffff?text=Album+5',
  },
];

// Dữ-liệu-cho (Data for) Đối-tác (Partners)
const partners = [
  { id: 1, name: 'Universal', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=Universal' },
  { id: 2, name: 'Sony Music', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=Sony+Music' },
  { id: 3, name: 'FUGA', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=FUGA' },
  { id: 4, name: 'Kakao M', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=Kakao+M' },
  { id: 5, name: 'Monstercat', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=Monstercat' },
];


// --- Component (Component) ---

function MainContent() {
  return (
    <div className="main-content">
      
      {/* === PHẦN 1: GỢI Ý BÀI HÁT / ALBUM (SECTION 1: SONG/ALBUM SUGGESTIONS) === */}
      <section className="content-section">
        {/* Tiêu-đề-phần (Section Header) */}
        <div className="section-header">
          <h2>Gợi Ý Cho Bạn</h2>
          <a href="#" className="see-all">
            TẤT CẢ <IoChevronForward />
          </a>
        </div>
        
        {/* Lưới-carousel (Carousel Grid) (Giống-như (Like) ảnh-của-bạn (your image)) */}
        <div className="carousel-grid three-columns">
          {suggestions.map((item) => (
            <div className="song-card" key={item.id}>
              <div className="card-image">
                <img src={item.imageUrl} alt={item.title} />
                <div className="overlay-actions">
                  <button className="player-btn icon-btn play-pause-btn">
                    <IoPlay />
                  </button>
                </div>
              </div>
              <div className="card-info">
                <h3>{item.title}</h3>
                <p>{item.artists}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === PHẦN 2: BẢNG XẾP HẠNG (#ZINGCHART) (SECTION 2: CHART) === */}
      <section className="content-section">
        <div className="section-header">
          <h2>#zingchart</h2>
          <a href="#" className="see-all">
            TẤT CẢ <IoChevronForward />
          </a>
        </div>
        
        <div className="chart-container">
          {chartData.map((song) => (
            <div className="chart-item" key={song.id}>
              <div className="chart-item-left">
                <span className={`chart-rank rank-${song.rank}`}>{song.rank}</span>
                <img src={song.cover} alt={song.title} className="chart-cover" />
                <div className="chart-song-info">
                  <h4>{song.title}</h4>
                  <p>{song.artists}</p>
                </div>
              </div>
              <div className="chart-item-right">
                <span className="chart-time">04:30</span> {/* Thời-gian-ví-dụ (Example time) */}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === PHẦN 3: ALBUM MỚI (SECTION 3: NEW ALBUMS) === */}
      <section className="content-section">
        {/* Tiêu-đề-phần (Section Header) */}
        <div className="section-header">
          <h2>Album Mới</h2>
          <a href="#" className="see-all">
            TẤT CẢ <IoChevronForward />
          </a>
        </div>
        
        {/* Sử-dụng-lại (Re-using) 'carousel-grid' và 'song-card'
          Sử-dụng (Using) 'five-columns' để-hiển-thị (to show) 5-album (5 albums)
        */}
        <div className="carousel-grid five-columns">
          {albumData.map((item) => (
            <div className="song-card" key={item.id}>
              <div className="card-image">
                <img src={item.imageUrl} alt={item.title} />
                <div className="overlay-actions">
                  <button className="player-btn icon-btn play-pause-btn">
                    <IoPlay />
                  </button>
                </div>
              </div>
              <div className="card-info">
                <h3>{item.title}</h3>
                <p>{item.artists}</p>
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
              <img src={partner.logoUrl} alt={partner.name} />
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

export default MainContent;