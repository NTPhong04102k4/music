import React, { useEffect, useRef, useState } from "react";
import "./ArtistManager.css";
import { useTranslation } from "react-i18next";

function ArtistManager() {
  const { t } = useTranslation();
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
        setError(t("admin.common.missingToken"));
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
          setError(t("chartLibrary.errors.invalidData"));
        }
      } else {
        setArtists([]);
        setError(
          data?.error ||
            t("admin.artistManager.errors.fetchFailed", { status: res.status })
        );
      }
    } catch (e) {
      console.error("Fetch artists error:", e);
      setError(t("errors.serverConnection"));
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
    if (!window.confirm(t("admin.artistManager.confirms.deleteArtist"))) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5001/api/admin/artists/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok)
        return alert(
          data?.error || t("admin.artistManager.alerts.deleteFailed")
        );
      alert(data?.message || t("admin.artistManager.alerts.deleteSuccess"));
      refreshData(currentPage);
    } catch (e) {
      alert(t("errors.serverConnection"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())
      return alert(t("admin.artistManager.alerts.missingName"));

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
      if (!res.ok) return alert(data?.error || t("admin.common.genericError"));
      alert(
        data?.message ||
          (isEditing
            ? t("admin.common.updateSuccess")
            : t("admin.common.createSuccess"))
      );
      closeModal();
      refreshData(currentPage);
    } catch (e) {
      alert(t("errors.serverConnection"));
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
    return (
      <div style={{ padding: 20 }}>{t("admin.artistManager.loading")}</div>
    );

  return (
    <div className="artist-manager">
      <div className="manager-header">
        <h2>{t("admin.artistManager.title")}</h2>
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
            ↻ {t("common.refresh")}
          </button>
          <button className="admin-btn btn-primary" onClick={openAdd}>
            + {t("admin.artistManager.addNew")}
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-card" style={{ borderLeft: "4px solid #e35050" }}>
          <div style={{ color: "#e35050", fontWeight: 600, marginBottom: 6 }}>
            {t("admin.common.cannotLoadData")}
          </div>
          <div style={{ color: "#555" }}>{error}</div>
        </div>
      )}

      <div className="admin-card">
        <table className="admin-table artist-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{t("admin.artistManager.columns.avatar")}</th>
              <th>{t("admin.artistManager.columns.name")}</th>
              <th>{t("admin.artistManager.columns.bio")}</th>
              <th>{t("admin.artistManager.columns.actions")}</th>
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
                    {t("admin.common.actions.edit")}
                  </button>
                  <button
                    className="admin-btn btn-danger"
                    onClick={() => handleDelete(a.id)}
                  >
                    {t("admin.common.actions.delete")}
                  </button>
                </td>
              </tr>
            ))}
            {artists.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 16, color: "#666" }}>
                  {t("admin.artistManager.empty")}
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
              {t("chartLibrary.pagination.prev")}
            </button>

            <span className="pagination-info">
              {t("chartLibrary.pagination.page", {
                page: currentPage,
                total: totalPages,
              })}
            </span>

            <button
              className="admin-btn"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              {t("chartLibrary.pagination.next")}
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {isEditing
                  ? t("admin.artistManager.modal.editTitle")
                  : t("admin.artistManager.modal.createTitle")}
              </h3>
              <button className="close-btn" type="button" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>
                  {t("admin.artistManager.form.nameLabel")}{" "}
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder={t("admin.artistManager.form.namePlaceholder")}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t("admin.artistManager.form.bioLabel")}</label>
                <textarea
                  className="artist-textarea"
                  value={form.bio}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, bio: e.target.value }))
                  }
                  placeholder={t("admin.artistManager.form.bioPlaceholder")}
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>{t("admin.artistManager.form.avatarLabel")}</label>
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
                  {t("songDetailPage.actions.cancel")}
                </button>
                <button type="submit" className="admin-btn btn-primary">
                  {isEditing
                    ? t("admin.common.actions.update")
                    : t("admin.common.actions.create")}
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
