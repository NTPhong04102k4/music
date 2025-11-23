import React, { useState, useEffect } from 'react';

function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    fetch('http://localhost:5001/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
    }) 
      .then(res => res.json())
      .then(data => {
          if(Array.isArray(data)) setUsers(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = (user) => {
      // Nếu đang active -> chuyển sang banned (khóa), ngược lại mở khóa
      // Lưu ý: Database của bạn có thể dùng giá trị khác (ví dụ 'active'/'inactive' hoặc 1/0)
      // Ở đây tôi giả định 'active' và 'banned' khớp với API admin.js đã viết
      const newStatus = user.status === 'active' ? 'banned' : 'active';
      const token = localStorage.getItem('token');
      
      if(!window.confirm(`Bạn có chắc muốn ${newStatus === 'banned' ? 'khóa' : 'mở khóa'} tài khoản ${user.username}?`)) return;

      fetch(`http://localhost:5001/api/admin/users/${user.id}/status`, {
          method: 'PUT',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ status: newStatus })
      })
      .then(res => res.json())
      .then(() => {
          alert("Cập nhật trạng thái thành công!");
          fetchUsers(); // Tải lại danh sách
      })
      .catch(err => alert("Lỗi khi cập nhật trạng thái"));
  };

  if (loading) return <div style={{padding: '20px'}}>Đang tải danh sách người dùng...</div>;

  return (
    <div className="user-manager">
      <h2>Quản Lý Người Dùng</h2>
      <div className="admin-card">
        <table className="admin-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Tên Đăng Nhập</th>
                    <th>Email</th>
                    <th>Ngày Tham Gia</th>
                    <th>Trạng Thái</th>
                    <th>Hành Động</th>
                </tr>
            </thead>
            <tbody>
                {users.map(user => (
                    <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{user.joinDate ? new Date(user.joinDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                        <td>
                            <span style={{
                                padding: '4px 8px', 
                                borderRadius: '4px', 
                                fontSize: '12px',
                                backgroundColor: user.status === 'active' ? '#e6fffa' : '#fff5f5',
                                color: user.status === 'active' ? '#00a080' : '#e53e3e',
                                fontWeight: 'bold'
                            }}>
                                {user.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                            </span>
                        </td>
                        <td>
                            <button 
                                className={`admin-btn ${user.status === 'active' ? 'btn-danger' : 'btn-primary'}`}
                                onClick={() => handleToggleStatus(user)}
                            >
                                {user.status === 'active' ? 'Khóa' : 'Mở khóa'}
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManager;