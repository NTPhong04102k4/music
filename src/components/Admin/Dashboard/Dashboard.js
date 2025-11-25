import React, { useState, useEffect } from 'react';

function Dashboard() {
  const [stats, setStats] = useState({
    totalSongs: 0,
    totalAlbums: 0,
    totalUsers: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('http://localhost:5001/api/admin/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            } else {
                console.error("Lỗi khi tải thống kê admin");
            }
        } catch (error) {
            console.error("Lỗi kết nối:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchStats();
  }, []);

  const formatCurrency = (amount) => {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) return <div style={{padding: '20px'}}>Đang tải dữ liệu...</div>;

  return (
    <div className="dashboard">
      <h2>Tổng Quan</h2>
      
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '20px'}}>
          <div className="admin-card" style={{borderLeft: '4px solid #4a90e2'}}>
              <h3>Bài Hát</h3>
              <p style={{fontSize: '24px', fontWeight: 'bold', marginTop: '10px'}}>{stats.totalSongs}</p>
          </div>
          <div className="admin-card" style={{borderLeft: '4px solid #50e3c2'}}>
              <h3>Album</h3>
              <p style={{fontSize: '24px', fontWeight: 'bold', marginTop: '10px'}}>{stats.totalAlbums}</p>
          </div>
          <div className="admin-card" style={{borderLeft: '4px solid #f5a623'}}>
              <h3>Người Dùng</h3>
              <p style={{fontSize: '24px', fontWeight: 'bold', marginTop: '10px'}}>{stats.totalUsers}</p>
          </div>
          <div className="admin-card" style={{borderLeft: '4px solid #e35050'}}>
              <h3>Doanh Thu</h3>
              <p style={{fontSize: '24px', fontWeight: 'bold', marginTop: '10px'}}>
                {formatCurrency(stats.totalRevenue)}
              </p>
          </div>
      </div>
    </div>
  );
}

export default Dashboard;