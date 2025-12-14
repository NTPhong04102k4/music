import React, { useEffect, useRef, useState } from "react";
import "./ArtistManager.css";

function ArtistManager() {
  const [artists, setArtists] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5;
  const refreshTimerRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    bio: "",
  });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fetchArtists = async (
    page = 1,
    opts = { showGlobalLoading: false }
  ) => {
    if (opts?.showGlobalLoading) setIsInitialLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setArtists([]);
        setError("Thiếu token. Vui lòng đăng nhập lại.");
        return;
      }
      const res = await fetch(
        `http://localhost:5001/api/admin/artists?page=${page}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        // New response shape: { data, pagination }
        if (data && Array.isArray(data.data)) {
          setArtists(data.data);
          if (data.pagination) {
            setCurrentPage(Number(data.pagination.page || page));
            setTotalPages(Number(data.pagination.totalPages || 1));
          } else {
            setTotalPages(1);
            setCurrentPage(page);
          }
        } else if (Array.isArray(data)) {
          // Backward compatibility
          setArtists(data);
          setTotalPages(1);
          setCurrentPage(1);
        } else {
          setArtists([]);
          setError("Dữ liệu trả về không hợp lệ");
        }
      } else {
        setArtists([]);
        setError(
          data?.error || `Lỗi khi tải danh sách nghệ sĩ (HTTP ${res.status})`
        );
      }
    } catch (e) {
      console.error("Fetch artists error:", e);
      setError("Lỗi kết nối server");
    } finally {
      if (opts?.showGlobalLoading) setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchArtists(1, { showGlobalLoading: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  const refreshData = async (page = currentPage) => {
    const startMs = Date.now();
    setIsRefreshing(true);
    try {
      await fetchArtists(page, { showGlobalLoading: false });
    } finally {
      const elapsed = Date.now() - startMs;
      const remain = Math.max(0, 200 - elapsed);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(
        () => setIsRefreshing(false),
        remain
      );
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    refreshData(newPage);
  };

  const openAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm({ name: "", bio: "" });
    setFile(null);
    setPreviewUrl(null);
    setShowModal(true);
  };

  const openEdit = (artist) => {
    setIsEditing(true);
    setEditingId(artist.id);
    setForm({ name: artist.name || "", bio: artist.bio || "" });
    setFile(null);
    setPreviewUrl(artist.avatarUrl || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFile(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa nghệ sĩ này?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5001/api/admin/artists/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return alert(data?.error || "Xóa thất bại");
      alert(data?.message || "Đã xóa");
      refreshData(currentPage);
    } catch (e) {
      alert("Lỗi kết nối server");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Vui lòng nhập tên nghệ sĩ");

    const url = isEditing
      ? `http://localhost:5001/api/admin/artists/${editingId}`
      : "http://localhost:5001/api/admin/artists";

    const method = isEditing ? "PUT" : "POST";

    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("bio", form.bio || "");
    if (file) fd.append("avatar", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) return alert(data?.error || "Có lỗi xảy ra");
      alert(
        data?.message || (isEditing ? "Cập nhật thành công" : "Thêm thành công")
      );
      closeModal();
      refreshData(currentPage);
    } catch (e) {
      alert("Lỗi kết nối server");
    }
  };

  const onFileChange = (e) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    }
  };

  if (isInitialLoading)
    return <div style={{ padding: 20 }}>Đang tải nghệ sĩ...</div>;

  return (
    <div className="artist-manager">
      <div className="manager-header">
        <h2>Quản Lý Nghệ Sĩ</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="admin-btn"
            type="button"
            onClick={() => refreshData(currentPage)}
            disabled={isRefreshing}
          >
            <span
              className={`reload-spinner ${isRefreshing ? "" : "hidden"}`}
            />
            ↻ Làm mới
          </button>
          <button className="admin-btn btn-primary" onClick={openAdd}>
            + Thêm Nghệ Sĩ
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-card" style={{ borderLeft: "4px solid #e35050" }}>
          <div style={{ color: "#e35050", fontWeight: 600, marginBottom: 6 }}>
            Không tải được dữ liệu
          </div>
          <div style={{ color: "#555" }}>{error}</div>
        </div>
      )}

      <div className="admin-card">
        <table className="admin-table artist-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ảnh</th>
              <th>Tên</th>
              <th>Tiểu sử</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {artists.map((a) => (
              <tr key={a.id}>
                <td>#{a.id}</td>
                <td>
                  <img
                    className="artist-avatar"
                    src={
                      a.avatarUrl ||
                      "https://placehold.co/48x48/2f2739/ffffff?text=A"
                    }
                    alt=""
                    onError={(e) => {
                      e.target.src =
                        "https://placehold.co/48x48/2f2739/ffffff?text=A";
                    }}
                  />
                </td>
                <td style={{ fontWeight: 600 }}>{a.name}</td>
                <td className="artist-bio">{a.bio || "—"}</td>
                <td>
                  <button
                    className="admin-btn btn-edit"
                    onClick={() => openEdit(a)}
                  >
                    Sửa
                  </button>
                  <button
                    className="admin-btn btn-danger"
                    onClick={() => handleDelete(a.id)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {artists.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 16, color: "#666" }}>
                  Chưa có nghệ sĩ.
                </td>
              </tr>
            )}
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{isEditing ? "Cập Nhật Nghệ Sĩ" : "Thêm Nghệ Sĩ"}</h3>
              <button className="close-btn" type="button" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>
                  Tên nghệ sĩ <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Nhập tên nghệ sĩ"
                  required
                />
              </div>

              <div className="form-group">
                <label>Tiểu sử</label>
                <textarea
                  className="artist-textarea"
                  value={form.bio}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, bio: e.target.value }))
                  }
                  placeholder="Nhập tiểu sử (tuỳ chọn)"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Ảnh đại diện</label>
                <input type="file" accept="image/*" onChange={onFileChange} />
                {previewUrl && (
                  <div className="artist-preview">
                    <img src={previewUrl} alt="" />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="admin-btn btn-secondary"
                  onClick={closeModal}
                >
                  Hủy
                </button>
                <button type="submit" className="admin-btn btn-primary">
                  {isEditing ? "Cập Nhật" : "Thêm Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArtistManager;
