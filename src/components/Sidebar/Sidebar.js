import React, { useState } from 'react';
import './Sidebar.css';
import {
  IoHeadsetOutline, 
  IoBarChartOutline,
  IoHeartOutline,
  IoDiscOutline, // Icon Album (thay cho Grid)
  IoListOutline,
  IoTimeOutline
} from 'react-icons/io5';

const SidebarItem = ({ icon, text, to, isActive, onClick }) => {
  return (
    <li 
      className={`zm-navbar-item ${isActive ? 'is-active' : ''}`}
      onClick={onClick}
    >
      <a href={to || '#'}>
        {icon}
        <span>{text}</span>
      </a>
    </li>
  );
};

// Nhận thêm prop onViewAlbums
const Sidebar = ({ onLoginClick, isLoggedIn, onViewFavorites, onViewHome, onViewHistory, onViewPlaylists, onViewAlbums }) => {
  const [activeItem, setActiveItem] = useState('kham-pha');

  const handleLibraryClick = (itemName) => {
    if (!isLoggedIn) {
      onLoginClick(); 
    } else {
      setActiveItem(itemName);
      
      if (itemName === 'yeu-thich') {
        if (onViewFavorites) onViewFavorites();
      }
      if (itemName === 'nghe-gan-day') {
        if (onViewHistory) onViewHistory();
      }
      if (itemName === 'danh-sach-phat') {
        if (onViewPlaylists) onViewPlaylists();
      }
    }
  };

  const handleHomeClick = () => {
    setActiveItem('kham-pha');
    if (onViewHome) onViewHome();
  }
  
  const handleAlbumsClick = () => {
      setActiveItem('albums');
      if (onViewAlbums) onViewAlbums();
  }

  return (
    <aside className="zm-sidebar">
      <div className="zm-sidebar-wrapper">
        
        <div className="sidebar-brand-nct">
          <div className="sidebar-brand-nct-logo">
            <IoHeadsetOutline />
            <span>NCT</span>
          </div>
          <span className="sidebar-brand-nct-text">Mạng Xã Hội âm nhạc NCT</span>
        </div>

        <nav className="zm-navbar zm-navbar-main">
          <ul className="zm-navbar-menu">
            <SidebarItem
              icon={<IoBarChartOutline />}
              text="Khám Phá"
              isActive={activeItem === 'kham-pha'}
              onClick={handleHomeClick}
            />
            {/* === SỬA: Đổi Thể Loại thành Album === */}
            <SidebarItem
              icon={<IoDiscOutline />}
              text="Album"
              isActive={activeItem === 'albums'}
              onClick={handleAlbumsClick} 
            />
          </ul>
        </nav>

        <div className="library-section">
          <h3 className="library-title">THƯ VIỆN</h3>
          <nav className="zm-navbar">
            <ul className="zm-navbar-menu">
              <SidebarItem
                icon={<IoHeartOutline />}
                text="Bài hát Yêu thích"
                isActive={activeItem === 'yeu-thich'}
                onClick={() => handleLibraryClick('yeu-thich')}
              />
              <SidebarItem
                icon={<IoListOutline />}
                text="Danh sách phát"
                isActive={activeItem === 'danh-sach-phat'}
                onClick={() => handleLibraryClick('danh-sach-phat')}
              />
               <SidebarItem
                icon={<IoTimeOutline />}
                text="Nghe gần đây"
                isActive={activeItem === 'nghe-gan-day'}
                onClick={() => handleLibraryClick('nghe-gan-day')}
              />
            </ul>
          </nav>
        </div>
        
        {!isLoggedIn && (
          <div className="login-nav-container">
            <p className="login-nav-text">
              Đăng nhập để khám phá nhạc hay
            </p>
            <button
              className="zm-btn login-nav-btn"
              onClick={onLoginClick} 
            >
              Đăng nhập
            </button>
          </div>
        )}

      </div>
    </aside>
  );
};

export default Sidebar;