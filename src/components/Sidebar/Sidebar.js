import React, { useState } from 'react';
import './Sidebar.css';
import {
  IoHeadsetOutline, // Icon cho (for) logo NCT
  IoBarChartOutline, // Icon cho (for) Khám Phá
  // IoSparklesOutline, // Đã-xóa (Removed)
  // IoPersonOutline, // Đã-xóa (Removed)
  IoHeartOutline,
  IoTimeOutline, // Đã-xóa (Removed)
  IoGridOutline, // Thêm (Added) icon Thể loại
  IoListOutline, // Thêm (Added) icon Danh sách phát
} from 'react-icons/io5';

// Component-con (Sub-component) cho-mỗi (for each) mục-menu (menu item)
const SidebarItem = ({ icon, text, to, isActive, onClick }) => {
  return (
    <li 
      className={`zm-navbar-item ${isActive ? 'is-active' : ''}`}
      onClick={onClick} // Thêm (Add) sự-kiện (event) click
    >
      <a href={to || '#'}>
        {icon}
        <span>{text}</span>
      </a>
    </li>
  );
};

// Component Sidebar chính
const Sidebar = ({ onLoginClick }) => {
  // === SỬA: Đổi (Changed) active-mặc-định (default active) thành (to) 'kham-pha' (vì 'danh-cho-ban' đã bị xóa) ===
  const [activeItem, setActiveItem] = useState('kham-pha');

  return (
    <aside className="zm-sidebar">
      <div className="zm-sidebar-wrapper">
        
        {/* === SỬA: Thêm (Added) phần-logo (logo section) NCT mới (new) === */}
        <div className="sidebar-brand-nct">
          <div className="sidebar-brand-nct-logo">
            <IoHeadsetOutline />
            <span>NCT</span>
          </div>
          <span className="sidebar-brand-nct-text">Mạng Xã Hội âm nhạc NCT</span>
        </div>

        {/* === PHẦN NAV CHÍNH === */}
        <nav className="zm-navbar zm-navbar-main">
          <ul className="zm-navbar-menu">
            {/* === SỬA: Thêm (Added) "Khám Phá" như-một (as a) mục (item) === */}
            <SidebarItem
              icon={<IoBarChartOutline />}
              text="Khám Phá"
              isActive={activeItem === 'kham-pha'}
              onClick={() => setActiveItem('kham-pha')}
            />
            {/* === SỬA: Đã-xóa (Removed) "Dành Cho Bạn" và "Của Tui" === */}
            {/* === SỬA: Thêm (Added) "Thể Loại" === */}
            <SidebarItem
              icon={<IoGridOutline />}
              text="Thể Loại"
              isActive={activeItem === 'the-loai'}
              onClick={() => setActiveItem('the-loai')}
            />
          </ul>
        </nav>

        {/* === PHẦN THƯ VIỆN === */}
        <div className="library-section">
          <h3 className="library-title">THƯ VIỆN</h3>
          <nav className="zm-navbar">
            <ul className="zm-navbar-menu">
              <SidebarItem
                icon={<IoHeartOutline />}
                text="Bài hát Yêu thích"
                isActive={activeItem === 'yeu-thich'}
                onClick={() => setActiveItem('yeu-thich')}
              />
              {/* === SỬA: Thay-thế (Replaced) "Nghe gần đây" bằng (with) "Danh sách phát" === */}
              <SidebarItem
                icon={<IoListOutline />}
                text="Danh sách phát"
                isActive={activeItem === 'danh-sach-phat'}
                onClick={() => setActiveItem('danh-sach-phat')}
              />
              <SidebarItem
                icon={<IoTimeOutline />}
                text="Nghe gần đây"
                isActive={activeItem === 'gan-day'}
                onClick={() => setActiveItem('gan-day')}
              />
            </ul>
          </nav>
        </div>
        
        {/* === PHẦN ĐĂNG NHẬP (Đẩy xuống dưới) === */}
        <div className="login-nav-container">
          <p className="login-nav-text">
            Đăng nhập để khám phá nhạc hay
          </p>
          <button
            className="zm-btn login-nav-btn"
            onClick={onLoginClick} // Gọi-hàm (Call the function) từ (from) App.js
          >
            Đăng nhập
          </button>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;