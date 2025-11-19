import React, { useState, useCallback, useEffect } from 'react'; 
import './App.css'; 

// Import các component
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import MainContent from './components/MainContent/MainContent';
import PlayerControls from './components/PlayerControls/PlayerControls';
import AlbumDetail from './components/AlbumDetail/AlbumDetail';
import AuthModal from './components/Login/Login'; 
import PlaylistQueue from './components/PlaylistQueue/PlaylistQueue';
import FavoritesLibrary from './components/FavoritesLibrary/FavoritesLibrary'; 

function App() {
  // --- TRẠNG THÁI (STATE) ---
  const [currentSong, setCurrentSong] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  // currentView có thể là: 'main', 'album', 'favorites'
  const [currentView, setCurrentView] = useState('main'); 
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  
  // Trạng thái UI
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPlaylistQueue, setShowPlaylistQueue] = useState(false);
  
  // Trạng thái Đăng nhập
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  
  // Trạng thái yêu thích (quản lý tập trung tại App)
  const [favorites, setFavorites] = useState(new Set());

  // --- EFFECTS ---
  // Kiểm tra đăng nhập khi load trang
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  // Tải danh sách yêu thích khi đăng nhập
  useEffect(() => {
    if (isLoggedIn) {
      fetch('http://localhost:5001/api/favorites', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => res.json())
      .then(data => {
        const favSet = new Set(data.map(song => song.id));
        setFavorites(favSet);
      })
      .catch(err => console.error("Lỗi tải yêu thích:", err));
    } else {
      setFavorites(new Set());
    }
  }, [isLoggedIn]);

  // --- HÀM XỬ LÝ LOGIC (HANDLERS) ---

  // 1. Xử lý yêu thích
  const handleToggleFavorite = useCallback(async (songId) => {
    if (!isLoggedIn) {
      alert('Vui lòng đăng nhập để sử dụng tính năng này');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/favorites/${songId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          if (data.isLiked) newFavorites.add(songId);
          else newFavorites.delete(songId);
          return newFavorites;
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [isLoggedIn]);

  // 2. Xử lý phát nhạc
  const handlePlaySong = useCallback((song, songList = []) => {
    setCurrentSong(song);
    if (songList.length > 0) {
      setPlaylist(songList);
      const index = songList.findIndex(s => s.id === song.id);
      setCurrentIndex(index >= 0 ? index : -1);
    } else {
      // Nếu không có danh sách, tạo danh sách chỉ có 1 bài
      setPlaylist([song]);
      setCurrentIndex(0);
    }
  }, []);

  const handleNextSong = useCallback(() => {
    if (playlist.length === 0) return;
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentIndex(nextIndex);
    setCurrentSong(playlist[nextIndex]);
  }, [currentIndex, playlist]);

  const handlePrevSong = useCallback(() => {
    if (playlist.length === 0) return;
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setCurrentSong(playlist[prevIndex]);
  }, [currentIndex, playlist]);

  // 3. Xử lý điều hướng (Navigation)
  const handleViewAlbum = useCallback((albumId) => {
    setSelectedAlbumId(albumId);
    setCurrentView('album');
  }, []);
  
  const handleViewFavorites = useCallback(() => {
    setCurrentView('favorites');
    setSelectedAlbumId(null);
  }, []);
  
  const handleViewHome = useCallback(() => {
    setCurrentView('main');
    setSelectedAlbumId(null);
  }, []);

  const handleBackToMain = useCallback(() => {
    setCurrentView('main');
    setSelectedAlbumId(null);
  }, []);

  // 4. Xử lý Đăng nhập/Modal
  const handleLoginClick = useCallback(() => {
    setShowAuthModal(true);
  }, []);

  const handleCloseAuthModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  const handleLoginSuccess = useCallback((userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    setShowAuthModal(false);
  }, []);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentView('main'); // Quay về trang chủ khi logout
  }, []);

  // 5. Xử lý Danh sách phát (Queue)
  const togglePlaylistQueue = useCallback(() => {
    setShowPlaylistQueue(currentValue => !currentValue); 
  }, []);


  // --- RENDER ---
  return (
    <div className="app">
      <Sidebar 
        onLoginClick={handleLoginClick} 
        isLoggedIn={isLoggedIn}
        onViewFavorites={handleViewFavorites}
        onViewHome={handleViewHome}
      />
      
      <Header 
        onPlaySong={handlePlaySong}
        onShowAuthModal={handleLoginClick}
        user={user}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      /> 
      
      <PlayerControls
        currentSong={currentSong}
        onNext={handleNextSong}
        onPrev={handlePrevSong}
        onTogglePlaylist={togglePlaylistQueue} // Hàm bật/tắt queue
        showPlaylistQueue={showPlaylistQueue}  // Trạng thái để highlight nút
        isFavorite={currentSong ? favorites.has(currentSong.id) : false}
        onToggleFavorite={() => currentSong && handleToggleFavorite(currentSong.id)}
      />

      {/* Modal Đăng nhập */}
      {showAuthModal && (
        <AuthModal 
          onClose={handleCloseAuthModal} 
          onLoginSuccess={handleLoginSuccess} 
        />
      )}

      {/* Sidebar Danh sách phát - PHẦN QUAN TRỌNG ĐỂ HIỆN DANH SÁCH NHẠC */}
      {showPlaylistQueue && (
        <PlaylistQueue
          playlist={playlist}
          currentSong={currentSong}
          onClose={togglePlaylistQueue}
          onPlaySong={handlePlaySong} 
        />
      )}

      {/* Nội dung chính */}
      <main className="main-content-wrapper">
        {currentView === 'main' && (
          <MainContent 
            onPlaySong={handlePlaySong} 
            onViewAlbum={handleViewAlbum}
            isLoggedIn={isLoggedIn}
            favorites={favorites} // Truyền xuống nếu cần dùng để hiển thị trạng thái
            // onToggleFavorite đã chuyển xuống PlayerControls nên có thể không cần ở đây nữa
            // trừ khi bạn muốn nút tim xuất hiện lại trên danh sách bài hát
          />
        )}
        
        {currentView === 'album' && (
          <AlbumDetail
            albumId={selectedAlbumId}
            onBack={handleBackToMain}
            onPlaySong={handlePlaySong}
          />
        )}
        
        {currentView === 'favorites' && (
          <FavoritesLibrary 
            onPlaySong={handlePlaySong}
          />
        )}
      </main>
    </div>
  );
}

export default App;