import React, { useState, useEffect } from 'react';
import { IoPlay, IoThumbsUpOutline, IoThumbsUp, IoEllipsisHorizontal, IoArrowBack } from 'react-icons/io5';
import './AlbumDetail.css';

function AlbumDetail({ albumId, onBack, onPlaySong, onOpenSongAction }) {
  const [albumData, setAlbumData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likedSongIds, setLikedSongIds] = useState(() => new Set());

  useEffect(() => {
    setLikedSongIds(new Set());
    fetchAlbumDetails();
  }, [albumId]);

  const fetchAlbumDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/album/${albumId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch album details');
      }
      const data = await response.json();
      setAlbumData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAlbum = () => {
    if (albumData && albumData.songs.length > 0) {
      onPlaySong(albumData.songs[0], albumData.songs);
    }
  };

  const handlePlaySong = (song) => {
    onPlaySong(song, albumData.songs);
  };

  const handleToggleLikeSong = async (songId) => {
    try {
      const isLiked = likedSongIds.has(songId);
      const endpoint = isLiked ? 'unlike' : 'like';

      const response = await fetch(
        `http://localhost:5001/api/songs/${songId}/${endpoint}`,
        { method: 'POST' }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Lỗi khi like bài hát');
      }

      // Update likeCount ngay trên UI
      setAlbumData((prev) => {
        if (!prev?.songs) return prev;
        const nextSongs = prev.songs.map((s) =>
          s.id === songId ? { ...s, likeCount: data.likeCount } : s
        );
        return { ...prev, songs: nextSongs };
      });

      setLikedSongIds((prev) => {
        const next = new Set(prev);
        if (isLiked) next.delete(songId);
        else next.add(songId);
        return next;
      });
    } catch (err) {
      alert(err.message || 'Lỗi khi like bài hát');
    }
  };

  if (loading) {
    return (
      <div className="album-detail">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="album-detail">
        <div className="error">Lỗi: {error}</div>
        <button onClick={onBack} className="back-btn">Quay lại</button>
      </div>
    );
  }

  if (!albumData) {
    return (
      <div className="album-detail">
        <div className="error">Không tìm thấy album</div>
        <button onClick={onBack} className="back-btn">Quay lại</button>
      </div>
    );
  }

  const { album, songs } = albumData;

  return (
    <div className="album-detail">
      {/* Header */}
      <div className="album-header">
        <button onClick={onBack} className="back-btn">
          <IoArrowBack />
        </button>
        <div className="album-info">
          <img
            src={album.imageUrl}
            alt={album.title}
            className="album-cover"
            onError={(e) => {
              e.target.src = 'https://placehold.co/300x300/4a90e2/ffffff?text=No+Image';
            }}
          />
          <div className="album-details">
            <h1>{album.title}</h1>
            <p className="album-artists">{album.artists}</p>
            <p className="album-meta">
              {songs.length} bài hát • {album.releaseDate ? new Date(album.releaseDate).getFullYear() : 'N/A'}
            </p>
            <button className="play-album-btn" onClick={handlePlayAlbum}>
              <IoPlay />
              Phát album
            </button>
          </div>
        </div>
      </div>

      {/* Songs List */}
      <div className="songs-list">
        <h2>Danh sách bài hát</h2>
        <div className="songs-container">
          {songs.map((song, index) => (
            <div key={song.id} className="song-item">
              <div className="song-number">{index + 1}</div>
              <img
                src={song.imageUrl}
                alt={song.title}
                className="song-cover"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/60x60/7a3c9e/ffffff?text=No+Image';
                }}
              />
              <div className="song-info">
                <h3>{song.title}</h3>
                <p>{song.artists}</p>
              </div>
              <div className="song-actions">
                {(() => {
                  const isLiked = likedSongIds.has(song.id);
                  return (
                <button
                  className={`action-btn ${isLiked ? 'liked' : ''}`}
                  title="Like (tăng lượt thích)"
                  onClick={() => handleToggleLikeSong(song.id)}
                >
                  {isLiked ? <IoThumbsUp style={{ color: '#fff' }} /> : <IoThumbsUpOutline />}
                </button>
                  );
                })()}
                <button
                  className="action-btn"
                  title="Tùy chọn"
                  onClick={() => onOpenSongAction && onOpenSongAction(song)}
                >
                  <IoEllipsisHorizontal />
                </button>
                <button
                  className="play-btn"
                  onClick={() => handlePlaySong(song)}
                >
                  <IoPlay />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AlbumDetail;
