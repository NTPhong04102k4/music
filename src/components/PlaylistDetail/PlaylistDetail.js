import React, { useState, useEffect, useCallback } from 'react';
import './PlaylistDetail.css';
import { IoArrowBack, IoPlay, IoTrashOutline } from 'react-icons/io5';

function PlaylistCoverCollage({ images = [], fallbackSrc, alt }) {
  const list = Array.isArray(images) ? images.filter(Boolean).slice(0, 4) : [];
  const count = list.length;

  if (count === 0) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        onError={(e) => {
          e.target.src = 'https://placehold.co/300x300/2f2739/ffffff?text=Playlist';
        }}
      />
    );
  }

  if (count === 1) {
    return (
      <div className="playlist-cover-collage count-1" aria-label={alt}>
        <div className="collage-cell">
          <img
            src={list[0]}
            alt={alt}
            onError={(e) => {
              e.target.src =
                'https://placehold.co/300x300/2f2739/ffffff?text=Playlist';
            }}
          />
        </div>
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="playlist-cover-collage count-2" aria-label={alt}>
        {list.slice(0, 2).map((src, i) => (
          <div className="collage-cell" key={i}>
            <img
              src={src}
              alt={alt}
              onError={(e) => {
                e.target.src =
                  'https://placehold.co/300x300/2f2739/ffffff?text=Playlist';
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="playlist-cover-collage count-4" aria-label={alt}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div className="collage-cell" key={i}>
          {list[i] ? (
            <img
              src={list[i]}
              alt={alt}
              onError={(e) => {
                e.target.src =
                  'https://placehold.co/300x300/2f2739/ffffff?text=Playlist';
              }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function PlaylistDetail({ playlistId, onBack, onPlaySong }) {
  const [playlistInfo, setPlaylistInfo] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlaylistDetail = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token || !playlistId) return;

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/playlists/${playlistId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Không thể tải playlist');
      }

      const { songs: fetchedSongs, ...info } = data || {};
      setPlaylistInfo(info || null);
      setSongs(fetchedSongs || []);
    } catch (err) {
      console.error('Error loading playlist detail:', err);
      setPlaylistInfo(null);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  }, [playlistId]);

  useEffect(() => {
    fetchPlaylistDetail();
  }, [fetchPlaylistDetail]);

  const handleRemoveSongFromPlaylist = useCallback(
    async (songId, e) => {
      e?.stopPropagation?.();

      if (!playlistId || !songId) return;
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Vui lòng đăng nhập để xóa bài hát khỏi playlist');
        return;
      }

      const ok = window.confirm('Xóa bài hát khỏi danh sách phát này?');
      if (!ok) return;

      try {
        const res = await fetch(
          `http://localhost:5001/api/playlists/${playlistId}/songs/${songId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || 'Xóa bài hát thất bại');
        }

        // Gọi GET để làm mới dữ liệu
        await fetchPlaylistDetail();
      } catch (err) {
        console.error('Error removing song from playlist:', err);
        alert(err?.message || 'Lỗi khi xóa bài hát');
      }
    },
    [fetchPlaylistDetail, playlistId]
  );

  if (loading) {
    return <div className="playlist-loading">Đang tải...</div>;
  }

  if (!playlistInfo) {
      return <div className="playlist-loading">Không tìm thấy playlist.</div>;
  }

  return (
    <div className="playlist-detail">
      <button className="back-btn" onClick={onBack}>
        <IoArrowBack /> Trở lại
      </button>

      <div className="playlist-detail-header">
        <div className="playlist-detail-cover">
            <PlaylistCoverCollage
              images={songs.map((s) => s.imageUrl).slice(0, 4)}
              fallbackSrc={
                playlistInfo.coverImage ||
                'https://placehold.co/300x300/2f2739/ffffff?text=Playlist'
              }
              alt={playlistInfo.name}
            />
        </div>
        <div className="playlist-detail-info">
          <h1>{playlistInfo.name}</h1>
          <p className="playlist-desc">{playlistInfo.description || 'Tạo bởi bạn'}</p>
          <p className="playlist-meta">
              {songs.length} bài hát • Cập nhật: {playlistInfo.createdAt ? new Date(playlistInfo.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
          </p>
          <button 
            className="zm-btn play-all-btn" 
            onClick={() => songs.length > 0 && onPlaySong(songs[0], songs)}
            disabled={songs.length === 0}
          >
            <IoPlay /> PHÁT NGẪU NHIÊN
          </button>
        </div>
      </div>

      <div className="playlist-songs-list">
        {songs.length === 0 ? (
            <div className="no-songs">Playlist này chưa có bài hát nào.</div>
        ) : (
            songs.map((song, index) => (
            <div 
                className="playlist-song-item" 
                key={song.id} 
                onClick={() => onPlaySong(song, songs)}
            >
                <span className="song-index">{index + 1}</span>
                <div className="song-main-info">
                    <img 
                        src={song.imageUrl} 
                        alt={song.title} 
                        className="song-thumb" 
                        onError={(e) => { e.target.src = 'https://placehold.co/60x60/7a3c9e/ffffff?text=Err'; }}
                    />
                    <div className="song-text">
                        <h4>{song.title}</h4>
                        <p>{song.artists}</p>
                    </div>
                </div>
                <div className="song-actions-right">
                    <button
                      className="playlist-song-delete-btn"
                      title="Xóa khỏi danh sách phát"
                      aria-label="Xóa khỏi danh sách phát"
                      onClick={(e) => handleRemoveSongFromPlaylist(song.id, e)}
                    >
                      <IoTrashOutline />
                    </button>
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
}

export default PlaylistDetail;