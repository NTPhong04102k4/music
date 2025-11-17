// === SỬA: Thêm (Added) 'useCallback' ===
import React, { useState, useCallback } from 'react'; 
import './App.css'; // File CSS chính cho layout

// Import các component
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import MainContent from './components/MainContent/MainContent';
import PlayerControls from './components/PlayerControls/PlayerControls';
import AlbumDetail from './components/AlbumDetail/AlbumDetail';
import AuthModal from './components/Login/Login'; 
import PlaylistQueue from './components/PlaylistQueue/PlaylistQueue';

function App() {
  // ... (Tất-cả (All) các-trạng-thái (states) useState của-bạn (your) giữ-nguyên (remain the same)) ...
  const [currentSong, setCurrentSong] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentView, setCurrentView] = useState('main'); // 'main' or 'album'
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPlaylistQueue, setShowPlaylistQueue] = useState(false); 

  
  // === SỬA: Bọc (Wrap) tất-cả (all) các-hàm (handlers) bằng (in) 'useCallback' ===

  const handlePlaySong = useCallback((song, songList = []) => {
    setCurrentSong(song);
    if (songList.length > 0) {
      setPlaylist(songList);
      const index = songList.findIndex(s => s.id === song.id);
      setCurrentIndex(index >= 0 ? index : -1);
    } else {
      setPlaylist([song]);
      setCurrentIndex(0);
    }
  }, []); // Phụ-thuộc (Dependencies): rỗng (empty)

  const handleNextSong = useCallback(() => {
    if (playlist.length === 0) return;
    // (Logic-xáo-trộn (Shuffle logic) nên-được-thêm (should be added) ở-đây (here) nếu-cần (if needed))
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentIndex(nextIndex);
    setCurrentSong(playlist[nextIndex]);
  }, [currentIndex, playlist]); // Phụ-thuộc (Dependencies): currentIndex, playlist

  const handlePrevSong = useCallback(() => {
    if (playlist.length === 0) return;
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setCurrentSong(playlist[prevIndex]);
  }, [currentIndex, playlist]); // Phụ-thuộc (Dependencies): currentIndex, playlist

  const handleViewAlbum = useCallback((albumId) => {
    setSelectedAlbumId(albumId);
    setCurrentView('album');
  }, []); // Phụ-thuộc (Dependencies): rỗng (empty)

  const handleBackToMain = useCallback(() => {
    setCurrentView('main');
    setSelectedAlbumId(null);
  }, []); // Phụ-thuộc (Dependencies): rỗng (empty)

  const handleLoginClick = useCallback(() => {
    setShowAuthModal(true);
  }, []); // Phụ-thuộc (Dependencies): rỗng (empty)

  const handleCloseAuthModal = useCallback(() => {
    setShowAuthModal(false);
  }, []); // Phụ-thuộc (Dependencies): rỗng (empty)

  const togglePlaylistQueue = useCallback(() => {
    // Sử-dụng (Use) functional-update (functional update) để-tránh (to avoid) phụ-thuộc (dependency)
    setShowPlaylistQueue(currentValue => !currentValue); 
  }, []); // Phụ-thuộc (Dependencies): rỗng (empty)


  return (
    <div className="app">
      <Sidebar onLoginClick={handleLoginClick} />
      
      {/* Header-của-bạn (Your Header) đã-sạch (is clean) (không-có (no) props) */}
      <Header 
        onPlaySong={handlePlaySong}
        onShowAuthModal={handleLoginClick} 
      /> 
      
      <PlayerControls
        currentSong={currentSong}
        onNext={handleNextSong}
        onPrev={handlePrevSong}
        onTogglePlaylist={togglePlaylistQueue}
        showPlaylistQueue={showPlaylistQueue}
      />

      {/* Render Modal (nếu- (if) true) */}
      {showAuthModal && (
        <AuthModal onClose={handleCloseAuthModal} />
      )}

      {/* Render Danh sách phát (nếu- (if) true) */}
      {showPlaylistQueue && (
        <PlaylistQueue
          playlist={playlist}
          currentSong={currentSong}
          onClose={togglePlaylistQueue}
          onPlaySong={handlePlaySong} 
        />
      )}

      {/* Phần nội-dung-chính (main content) sẽ-cuộn (that scrolls). */}
      <main className="main-content-wrapper">
        {currentView === 'main' ? (
          <MainContent onPlaySong={handlePlaySong} onViewAlbum={handleViewAlbum} />
        ) : (
          // Component-này (This component) cần-phải-được-tạo (needs to be created)
          <AlbumDetail
            albumId={selectedAlbumId}
            onBack={handleBackToMain}
            onPlaySong={handlePlaySong}
          />
        )}
      </main>
    </div>
  );
}

export default App;