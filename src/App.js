import React from 'react';
import './App.css'; // File CSS chính cho layout

// Sử-dụng (Using) đường-dẫn-import (the import paths) mà-bạn-xác-nhận-là-đang-chạy (you confirmed are working)
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import MainContent from './components/MainContent/MainContent';
import PlayerControls from './components/PlayerControls/PlayerControls';

function App() {
  return (
    <div className="app">
      {/* 3 thành-phần "overlay" cố-định (fixed). 
        Chúng-phải-đặt (They must be placed) ở-đây (here).
      */}
      <Sidebar />
      <Header />
      <PlayerControls />

      {/* Đây là phần nội-dung-chính (main content) sẽ-cuộn (that scrolls).
        Nó-phải (It must) là-anh-em (be a sibling) với-các-thành-phần-cố-định (the fixed elements)
        và-có-class (and have the class) "main-content-wrapper".
      */}
      <main className="main-content-wrapper">
        <MainContent />
      </main>
    </div>
  );
}

export default App;