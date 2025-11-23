import React, { useState, useEffect } from 'react';
import './SongManager.css'; 

function SongManager() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); // Đổi tên từ showAddModal thành showModal cho chung
  const [isEditing, setIsEditing] = useState(false); // State xác định chế độ Thêm/Sửa
  const [editingId, setEditingId] = useState(null);  // ID bài hát đang sửa

  // State phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // State cho form (dùng chung cho thêm và sửa)
  const [formData, setFormData] = useState({
    title: '',
    artist: '', 
    audioUrl: '',
    imageUrl: ''
  });

const fetchSongs = (page = 1) => {
    const token = localStorage.getItem('token');
    setLoading(true);
    
    fetch(`http://localhost:5001/api/admin/songs?page=${page}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    }) 
      .then(res => res.json())
      .then(response => {
          if (response.data && Array.isArray(response.data)) {
              // Process the imageUrl and audioUrl: only prefix BASE_URL if not already full URL
              const processedSongs = response.data.map(song => {
                  const imageUrl = song.imageUrl;
                  const audioUrl = song.audioUrl;
                  return {
                      ...song,
                      imageUrl: (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) ? imageUrl : (imageUrl ? `http://localhost:5001/api/image/song/${imageUrl}` : null),
                      audioUrl: (audioUrl && (audioUrl.startsWith('http://') || audioUrl.startsWith('https://'))) ? audioUrl : (audioUrl ? `http://localhost:5001/api/audio/${audioUrl}` : null),
                  };
              });
              setSongs(processedSongs);
              if (response.pagination) {
                  setTotalPages(response.pagination.totalPages);
                  setCurrentPage(response.pagination.page);
              }
          } else {
              if (Array.isArray(response)) setSongs(response);
          }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
};

  useEffect(() => {
    fetchSongs(currentPage);
  }, [currentPage]); 

  const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= totalPages) {
          setCurrentPage(newPage);
      }
  };

  const handleDeleteSong = (id) => {
      if(window.confirm("Bạn có chắc muốn xóa bài hát này?")) {
        const token = localStorage.getItem('token');
        fetch(`http://localhost:5001/api/admin/songs/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message || "Đã xóa thành công");
            fetchSongs(currentPage);
        })
        .catch(err => alert("Lỗi khi xóa bài hát"));
      }
  };

  // Mở modal để thêm mới
  const openAddModal = () => {
      setIsEditing(false);
      setFormData({ title: '', artist: '', audioUrl: '', imageUrl: '' });
      setShowModal(true);
  };

  // Mở modal để sửa
  const openEditModal = (song) => {
      setIsEditing(true);
      setEditingId(song.id);
      // Điền dữ liệu cũ vào form
      // Fix: map song.artists (plural) to artist (singular)
      setFormData({
          title: song.title,
          artist: song.artists || '', // corrected usage
          audioUrl: song.audioUrl || '',
          imageUrl: song.imageUrl || ''
      });
      setShowModal(true);
  };

  // Xử lý submit form (chung cho cả thêm và sửa)
  const handleSubmit = (e) => {
      e.preventDefault();
      const token = localStorage.getItem('token');

      if (!formData.title || !formData.audioUrl) {
          alert("Vui lòng nhập tên bài hát và đường dẫn nhạc!");
          return;
      }

      // Strip base URL prefix from audioUrl and imageUrl before sending
      const baseAudioUrl = 'http://localhost:5001/api/audio/';
      const baseImageUrl = 'http://localhost:5001/api/image/song/';

      // Create a shallow copy to avoid mutating state directly
      const submitData = { ...formData };

      if (submitData.audioUrl && submitData.audioUrl.startsWith(baseAudioUrl)) {
          submitData.audioUrl = submitData.audioUrl.substring(baseAudioUrl.length);
      }

      if (submitData.imageUrl && submitData.imageUrl.startsWith(baseImageUrl)) {
          submitData.imageUrl = submitData.imageUrl.substring(baseImageUrl.length);
      }

      const url = isEditing 
        ? `http://localhost:5001/api/admin/songs/${editingId}` 
        : 'http://localhost:5001/api/admin/songs';
      
      const method = isEditing ? 'PUT' : 'POST';

      fetch(url, {
          method: method,
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(submitData)
      })
      .then(res => res.json())
      .then(data => {
          if (data.message || data.id) {
              alert(isEditing ? "Cập nhật thành công!" : "Thêm bài hát thành công!");
              setShowModal(false);
              fetchSongs(currentPage); // Tải lại danh sách
          } else {
              alert(data.error || "Có lỗi xảy ra");
          }
      })
      .catch(err => alert("Lỗi kết nối server"));
  };

  const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading && songs.length === 0) return <div style={{padding: '20px'}}>Đang tải danh sách bài hát...</div>;

  return (
    <div className="song-manager">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <h2>Quản Lý Bài Hát</h2>
        <button className="admin-btn btn-primary" onClick={openAddModal}>+ Thêm Bài Hát Mới</button>
      </div>

      <div className="admin-card">
        <table className="admin-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Tên Bài Hát</th>
                    <th>Nghệ Sĩ</th>
                    <th>Lượt Nghe</th>
                    <th>Lượt Thích</th>
                    <th>Hành Động</th>
                </tr>
            </thead>
            <tbody>
                {songs.map(song => (
                    <tr key={song.id}>
                        <td>#{song.id}</td>
                        <td>
                            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                <img 
                                    src={song.imageUrl || 'https://placehold.co/40x40'} 
                                    alt="" 
                                    style={{width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover'}} 
                                    onError={(e) => e.target.src = 'https://placehold.co/40x40'}
                                />
                                {song.title}
                            </div>
                        </td>
                        <td>{song.artists || 'Chưa cập nhật'}</td>
                        <td>{song.listenCount || 0}</td>
                        <td>{song.likeCount || 0}</td>
                        <td>
                            {/* Nút Sửa: gọi openEditModal */}
                            <button className="admin-btn btn-edit" onClick={() => openEditModal(song)}>Sửa</button>
                            <button className="admin-btn btn-danger" onClick={() => handleDeleteSong(song.id)}>Xóa</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>

        {totalPages > 1 && (
            <div className="pagination-controls">
                <button 
                    className="admin-btn" 
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                >
                    Trước
                </button>
                
                <span className="pagination-info">
                    Trang {currentPage} / {totalPages}
                </span>

                <button 
                    className="admin-btn" 
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                >
                    Sau
                </button>
            </div>
        )}
      </div>

      {/* Modal Chung cho Thêm và Sửa */}
      {showModal && (
          <div className="modal-overlay">
              <div className="modal-content">
                  <div className="modal-header">
                      <h3>{isEditing ? 'Cập Nhật Bài Hát' : 'Thêm Bài Hát Mới'}</h3>
                      <button onClick={() => setShowModal(false)}>×</button>
                  </div>
                  <form onSubmit={handleSubmit}>
                       <div className="form-group">
                          <label>Tên Bài Hát (*)</label>
                          <input 
                            type="text" 
                            name="title" 
                            value={formData.title} 
                            onChange={handleInputChange} 
                            required 
                            placeholder="Nhập tên bài hát"
                          />
                      </div>

                      <div className="form-group">
                          <label>Nghệ sĩ (Ca sĩ thể hiện)</label>
                          <input 
                            type="text" 
                            name="artist" 
                            value={formData.artist} 
                            onChange={handleInputChange} 
                            placeholder="Nhập tên ca sĩ (nếu có)"
                          />
                      </div>

                      <div className="form-group">
                          <label>Đường dẫn nhạc (*)</label>
                          <input 
                            type="text" 
                            name="audioUrl" 
                            value={formData.audioUrl} 
                            onChange={handleInputChange} 
                            required 
                            placeholder="Link file .mp3 hoặc tên file trong uploads/audio"
                          />
                      </div>
                      <div className="form-group">
                          <label>Đường dẫn ảnh bìa</label>
                          <input 
                            type="text" 
                            name="imageUrl" 
                            value={formData.imageUrl} 
                            onChange={handleInputChange} 
                            placeholder="Link file ảnh .jpg/.png hoặc tên file"
                          />
                      </div>
                      <div className="modal-footer">
                          <button type="button" className="admin-btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                          <button type="submit" className="admin-btn btn-primary">
                            {isEditing ? 'Cập Nhật' : 'Thêm Mới'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}

export default SongManager;