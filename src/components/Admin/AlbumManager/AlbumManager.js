import React, { useEffect, useMemo, useRef, useState } from "react";
import "./AlbumManager.css";
import { useTranslation } from "react-i18next";

function AlbumManager() {
  const { t } = useTranslation();
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
        setError(t("admin.common.missingToken"));
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
          data?.error ||
            t("admin.albumManager.errors.fetchFailed", { status: res.status })
        );
      }
    } catch (e) {
      console.error("Fetch albums error:", e);
      setError(t("errors.serverConnection"));
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
    if (!window.confirm(t("admin.albumManager.confirms.deleteAlbum"))) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5001/api/admin/albums/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok)
        return alert(
          data?.error || t("admin.albumManager.alerts.deleteFailed")
        );
      alert(data?.message || t("admin.albumManager.alerts.deleteSuccess"));
      refreshData();
    } catch (e) {
      alert(t("errors.serverConnection"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim())
      return alert(t("admin.albumManager.alerts.missingTitle"));

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
      if (!res.ok) return alert(data?.error || t("admin.common.genericError"));
      alert(
        data?.message ||
          (isEditing
            ? t("admin.common.updateSuccess")
            : t("admin.common.createSuccess"))
      );
      closeModal();
      refreshData();
    } catch (e) {
      alert(t("errors.serverConnection"));
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
    return <div style={{ padding: 20 }}>{t("admin.albumManager.loading")}</div>;

  return (
    <div className="album-manager">
      <div className="manager-header">
        <h2>{t("admin.albumManager.title")}</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="admin-btn"
            type="button"
            onClick={refreshData}
            disabled={isRefreshing}
            title={t("common.refresh")}
          >
            <span
              className={`reload-spinner ${isRefreshing ? "" : "hidden"}`}
            />
            ↻ {t("common.refresh")}
          </button>
          <button className="admin-btn btn-primary" onClick={openAdd}>
            + {t("admin.albumManager.addNew")}
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

      <div className="admin-card album-table-card">
        <table className="admin-table album-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>{t("admin.albumManager.columns.cover")}</th>
              <th>{t("admin.albumManager.columns.title")}</th>
              <th>{t("admin.albumManager.columns.artists")}</th>
              <th>{t("admin.albumManager.columns.releaseDate")}</th>
              <th>{t("admin.albumManager.columns.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {albums.map((a, idx) => (
              <tr key={a.id}>
                <td>{idx + 1}</td>
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
            {albums.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 16, color: "#666" }}>
                  {t("admin.albumManager.empty")}
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
              <h3>
                {isEditing
                  ? t("admin.albumManager.modal.editTitle")
                  : t("admin.albumManager.modal.createTitle")}
              </h3>
              <button className="close-btn" type="button" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>
                  {t("admin.albumManager.form.titleLabel")}{" "}
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder={t("admin.albumManager.form.titlePlaceholder")}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t("admin.albumManager.form.releaseDateLabel")}</label>
                <input
                  type="date"
                  value={form.releaseDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, releaseDate: e.target.value }))
                  }
                />
              </div>

              <div className="form-group">
                <label>{t("admin.albumManager.form.coverLabel")}</label>
                <input type="file" accept="image/*" onChange={onCoverChange} />
                {coverPreview && (
                  <div className="album-preview">
                    <img src={coverPreview} alt="" />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>{t("admin.albumManager.form.artistsLabel")}</label>
                {artists.length === 0 ? (
                  <div style={{ color: "#666" }}>
                    {t("admin.albumManager.form.noArtistsHint")}
                  </div>
                ) : (
                  <>
                    <div className="artist-selected-row">
                      {selectedArtists.length === 0 ? (
                        <div style={{ color: "#666" }}>
                          {t("admin.albumManager.form.noArtistsSelected")}
                        </div>
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
                        placeholder={t(
                          "admin.albumManager.form.searchArtistPlaceholder"
                        )}
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

export default AlbumManager;
