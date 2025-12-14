import React, { useEffect, useMemo, useRef, useState } from "react";
import "./AlbumManager.css";

function AlbumManager() {
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [artistQuery, setArtistQuery] = useState("");
  const [showArtistDropdown, setShowArtistDropdown] = useState(false);
  const refreshTimerRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    releaseDate: "",
    artistIds: [],
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const fetchArtists = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setArtists([]);
        return;
      }
      // Need full list for album artist picker
      const res = await fetch(
        "http://localhost:5001/api/admin/artists?page=1&limit=1000",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        if (data && Array.isArray(data.data)) setArtists(data.data);
        else if (Array.isArray(data)) setArtists(data);
      }
    } catch (e) {
      console.error("Fetch artists error:", e);
    }
  };

  const fetchAlbums = async (opts = { showGlobalLoading: false }) => {
    if (opts?.showGlobalLoading) setIsInitialLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setAlbums([]);
        setError("Thiếu token. Vui lòng đăng nhập lại.");
        return;
      }
      const res = await fetch("http://localhost:5001/api/admin/albums", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setAlbums(data);
      else {
        setAlbums([]);
        setError(
          data?.error || `Lỗi khi tải danh sách album (HTTP ${res.status})`
        );
      }
    } catch (e) {
      console.error("Fetch albums error:", e);
      setError("Lỗi kết nối server");
    } finally {
      if (opts?.showGlobalLoading) setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchArtists();
    fetchAlbums({ showGlobalLoading: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  const refreshData = async () => {
    const startMs = Date.now();
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchArtists(),
        fetchAlbums({ showGlobalLoading: false }),
      ]);
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

  const openAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm({ title: "", releaseDate: "", artistIds: [] });
    setCoverFile(null);
    setCoverPreview(null);
    setArtistQuery("");
    setShowArtistDropdown(false);
    setShowModal(true);
  };

  const openEdit = (album) => {
    setIsEditing(true);
    setEditingId(album.id);
    setForm({
      title: album.title || "",
      releaseDate: album.releaseDate
        ? String(album.releaseDate).slice(0, 10)
        : "",
      artistIds: Array.isArray(album.artistIds) ? album.artistIds : [],
    });
    setCoverFile(null);
    setCoverPreview(album.imageUrl || null);
    setArtistQuery("");
    setShowArtistDropdown(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCoverFile(null);
    setArtistQuery("");
    setShowArtistDropdown(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa album này?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5001/api/admin/albums/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return alert(data?.error || "Xóa thất bại");
      alert(data?.message || "Đã xóa");
      refreshData();
    } catch (e) {
      alert("Lỗi kết nối server");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return alert("Vui lòng nhập tên album");

    const url = isEditing
      ? `http://localhost:5001/api/admin/albums/${editingId}`
      : "http://localhost:5001/api/admin/albums";
    const method = isEditing ? "PUT" : "POST";

    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("releaseDate", form.releaseDate || "");
    fd.append("artistIds", JSON.stringify(form.artistIds || []));
    if (coverFile) fd.append("cover", coverFile);

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
      refreshData();
    } catch (e) {
      alert("Lỗi kết nối server");
    }
  };

  const onCoverChange = (e) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setCoverFile(f);
    if (f) setCoverPreview(URL.createObjectURL(f));
  };

  const addArtistId = (id) => {
    setForm((p) => {
      const set = new Set(p.artistIds || []);
      set.add(id);
      return { ...p, artistIds: Array.from(set) };
    });
  };

  const removeArtistId = (id) => {
    setForm((p) => ({
      ...p,
      artistIds: (p.artistIds || []).filter((x) => x !== id),
    }));
  };

  const selectedArtists = useMemo(() => {
    const set = new Set(form.artistIds || []);
    return artists.filter((a) => set.has(a.id));
  }, [artists, form.artistIds]);

  const filteredArtists = useMemo(() => {
    const q = (artistQuery || "").trim().toLowerCase();
    if (!q) return [];
    const selected = new Set(form.artistIds || []);
    return artists
      .filter((a) => !selected.has(a.id))
      .filter((a) =>
        String(a.name || "")
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 8);
  }, [artistQuery, artists, form.artistIds]);

  if (isInitialLoading)
    return <div style={{ padding: 20 }}>Đang tải album...</div>;

  return (
    <div className="album-manager">
      <div className="manager-header">
        <h2>Quản Lý Album</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="admin-btn"
            type="button"
            onClick={refreshData}
            disabled={isRefreshing}
            title="Làm mới dữ liệu"
          >
            <span
              className={`reload-spinner ${isRefreshing ? "" : "hidden"}`}
            />
            ↻ Làm mới
          </button>
          <button className="admin-btn btn-primary" onClick={openAdd}>
            + Thêm Album
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

      <div className="admin-card album-table-card">
        <table className="admin-table album-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ảnh bìa</th>
              <th>Tiêu đề</th>
              <th>Nghệ sĩ</th>
              <th>Ngày phát hành</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {albums.map((a) => (
              <tr key={a.id}>
                <td>#{a.id}</td>
                <td>
                  <img
                    className="album-cover"
                    src={
                      a.imageUrl ||
                      "https://placehold.co/64x64/4a90e2/ffffff?text=Album"
                    }
                    alt=""
                    onError={(e) => {
                      e.target.src =
                        "https://placehold.co/64x64/4a90e2/ffffff?text=Album";
                    }}
                  />
                </td>
                <td style={{ fontWeight: 600 }}>{a.title}</td>
                <td>{a.artists || "—"}</td>
                <td>
                  {a.releaseDate ? String(a.releaseDate).slice(0, 10) : "—"}
                </td>
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
            {albums.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 16, color: "#666" }}>
                  Chưa có album.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{isEditing ? "Cập Nhật Album" : "Thêm Album"}</h3>
              <button className="close-btn" type="button" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>
                  Tên album <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="Nhập tên album"
                  required
                />
              </div>

              <div className="form-group">
                <label>Ngày phát hành</label>
                <input
                  type="date"
                  value={form.releaseDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, releaseDate: e.target.value }))
                  }
                />
              </div>

              <div className="form-group">
                <label>Ảnh bìa (upload từ máy)</label>
                <input type="file" accept="image/*" onChange={onCoverChange} />
                {coverPreview && (
                  <div className="album-preview">
                    <img src={coverPreview} alt="" />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Nghệ sĩ</label>
                {artists.length === 0 ? (
                  <div style={{ color: "#666" }}>
                    Chưa có nghệ sĩ. Hãy thêm nghệ sĩ trước.
                  </div>
                ) : (
                  <>
                    <div className="artist-selected-row">
                      {selectedArtists.length === 0 ? (
                        <div style={{ color: "#666" }}>Chưa chọn nghệ sĩ.</div>
                      ) : (
                        <div className="artist-selected-chips">
                          {selectedArtists.map((a) => (
                            <div key={a.id} className="artist-chip">
                              <span>{a.name}</span>
                              <button
                                type="button"
                                onClick={() => removeArtistId(a.id)}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="artist-search">
                      <input
                        type="text"
                        value={artistQuery}
                        onChange={(e) => {
                          setArtistQuery(e.target.value);
                          setShowArtistDropdown(true);
                        }}
                        onFocus={() => setShowArtistDropdown(true)}
                        onBlur={() => {
                          // delay để click được item
                          setTimeout(() => setShowArtistDropdown(false), 150);
                        }}
                        placeholder="Tìm nghệ sĩ theo tên..."
                      />

                      {showArtistDropdown && filteredArtists.length > 0 && (
                        <div className="artist-dropdown">
                          {filteredArtists.map((a) => (
                            <button
                              key={a.id}
                              type="button"
                              className="artist-dropdown-item"
                              onClick={() => {
                                addArtistId(a.id);
                                setArtistQuery("");
                                setShowArtistDropdown(false);
                              }}
                            >
                              {a.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
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

export default AlbumManager;
