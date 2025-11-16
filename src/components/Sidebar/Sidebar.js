import React from 'react';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <aside className="zm-sidebar">
      <div className="zm-sidebar-wrapper">
        <nav className="zm-navbar">
          <div className="zm-navbar-brand">
            <div className="zm-navbar-item">
              <button className="zm-btn button" tabIndex="0">
                <div className="zmp3-logo"></div>
                <p className="zmp3-logo-text">NhacHay</p>
              </button>
            </div>
          </div>
        </nav>
        <nav className="zm-navbar zm-navbar-main">
          <ul className="zm-navbar-menu">
            <li className="zm-navbar-item sidebar-lib">
              <a href="/mymusic" title="Thư Viện">
                <i className="icon ic-library"></i>
                <span>Thư Viện</span>
              </a>
            </li>
            <li className="zm-navbar-item is-active">
              <a href="/" title="Khám Phá">
                <i className="icon ic-discover"></i>
                <span>Khám Phá</span>
              </a>
            </li>
            <li className="zm-navbar-item">
              <a href="/zingchart" title="#zingchart">
                <i className="icon ic-zingchart"></i>
                <span>#zingchart</span>
              </a>
            </li>
            <li className="zm-navbar-item">
              <a href="/hub" title="Phòng Nhạc">
                <i className="icon ic-radio"></i>
                <span>Phòng Nhạc</span>
              </a>
            </li>
          </ul>
        </nav>
        <div className="sidebar-divide"></div>
        <div className="zm-sidebar-scrollbar">
          <nav className="zm-navbar zm-navbar-main">
            <ul className="zm-navbar-menu">
              <li className="zm-navbar-item">
                <a href="/moi-phat-hanh" title="BXH Nhạc Mới">
                  <i className="icon ic-new-release"></i>
                  <span>BXH Nhạc Mới</span>
                </a>
              </li>
              <li className="zm-navbar-item">
                <a href="/hub" title="Chủ Đề & Thể Loại">
                  <i className="icon ic-hub"></i>
                  <span>Chủ Đề & Thể Loại</span>
                </a>
              </li>
              <li className="zm-navbar-item">
                <a href="/top100" title="Top 100">
                  <i className="icon ic-top100"></i>
                  <span>Top 100</span>
                </a>
              </li>
            </ul>
          </nav>
          <div className="login-nav-container login mar-t-15">
            <div className="text">Đăng nhập để khám phá playlist dành riêng cho bạn</div>
            <button className="zm-btn is-medium is-outlined is-upper button" tabIndex="0">
              <span>Đăng Nhập</span>
            </button>
          </div>
        </div>
        <div className="add-playlist-sidebar">
          <button className="zm-btn button" tabIndex="0">
            <i className="icon ic-add"></i>
            <span>Tạo playlist mới</span>
          </button>
        </div>
      </div>
      <button className="zm-btn btn-expanded button" tabIndex="0">
        <i className="icon ic-go-right"></i>
      </button>
    </aside>
  );
};

export default Sidebar;
