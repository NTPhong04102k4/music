import React, { useState, useEffect } from "react";
import "./SongManager.css";
import { useTranslation } from "react-i18next";

function SongManager() {
  const { t } = useTranslation();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); // Đổi tên từ showAddModal thành showModal cho chung
  const [isEditing, setIsEditing] = useState(false); // State xác định chế độ Thêm/Sửa
  const [editingId, setEditingId] = useState(null); // ID bài hát đang sửa
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // State phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Search (server-side)
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // State cho form (dùng chung cho thêm và sửa)
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    audioUrl: "",
    imageUrl: "",
  });
  const [audioFile, setAudioFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");

  const BASE_AUDIO_URL = "http://localhost:5001/api/audio/";
  const BASE_IMAGE_URL = "http://localhost:5001/api/image/song/";

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Lyrics (LRC) upload
  const [lyricsFile, setLyricsFile] = useState(null);
  const [lyricsUploading, setLyricsUploading] = useState(false);
  const [lyricsMessage, setLyricsMessage] = useState("");
  const [showLyricsOption, setShowLyricsOption] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(String(searchInput || "").trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    // Reset to first page when changing query
    if (currentPage !== 1) setCurrentPage(1);
  }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSongs = (page = 1, q = debouncedQuery) => {
    const token = localStorage.getItem("token");
    setLoading(true);

    const url =
      `http://localhost:5001/api/admin/songs?page=${page}&limit=${limit}` +
      (q ? `&q=${encodeURIComponent(q)}` : "");

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.data && Array.isArray(response.data)) {
          // Process the imageUrl and audioUrl: only prefix BASE_URL if not already full URL
          const processedSongs = response.data.map((song) => {
            const imageUrl = song.imageUrl;
            const audioUrl = song.audioUrl;
            return {
              ...song,
              imageUrl:
                imageUrl &&
                (imageUrl.startsWith("http://") ||
                  imageUrl.startsWith("https://"))
                  ? imageUrl
                  : imageUrl
                  ? `http://localhost:5001/api/image/song/${imageUrl}`
                  : null,
              audioUrl:
                audioUrl &&
                (audioUrl.startsWith("http://") ||
                  audioUrl.startsWith("https://"))
                  ? audioUrl
                  : audioUrl
                  ? `http://localhost:5001/api/audio/${audioUrl}`
                  : null,
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
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSongs(currentPage, debouncedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedQuery]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDeleteSong = (id) => {
    if (window.confirm(t("admin.songManager.confirms.deleteSong"))) {
      const token = localStorage.getItem("token");
      fetch(`http://localhost:5001/api/admin/songs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          alert(data.message || t("admin.songManager.alerts.deleteSuccess"));
          fetchSongs(currentPage, debouncedQuery);
        })
        .catch(() => alert(t("admin.songManager.alerts.deleteFailed")));
    }
  };

  const handleUploadLyrics = async () => {
    if (!isEditing || !editingId) {
      alert(t("admin.songManager.alerts.selectSongToUpdateLyrics"));
      return;
    }
    if (!lyricsFile) {
      alert(t("admin.songManager.alerts.selectLrcFile"));
      return;
    }

    const token = localStorage.getItem("token");
    const form = new FormData();
    form.append("lrcFile", lyricsFile);
    form.append("autoTranslate", "1");

    try {
      setLyricsUploading(true);
      setLyricsMessage("");
      const res = await fetch(
        `http://localhost:5001/api/admin/songs/${editingId}/lyrics`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.error || t("admin.songManager.errors.uploadLyricsFailed")
        );
      }
      setLyricsMessage(t("admin.songManager.alerts.uploadLyricsSuccess"));
      setLyricsFile(null);
    } catch (e) {
      setLyricsMessage(
        e.message || t("admin.songManager.errors.uploadLyricsErrorFallback")
      );
    } finally {
      setLyricsUploading(false);
    }
  };

  // Mở modal để thêm mới
  const openAddModal = () => {
    setIsEditing(false);
    setFormData({ title: "", artist: "", audioUrl: "", imageUrl: "" });
    setAudioFile(null);
    setImageFile(null);
    setSubmitError("");
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
      artist: song.artists || "", // corrected usage
      audioUrl: song.audioUrl || "",
      imageUrl: song.imageUrl || "",
    });
    setAudioFile(null);
    setImageFile(null);
    setSubmitError("");
    setShowModal(true);
  };

  const mapFetchErrorToMessage = (err) => {
    const raw = String(err?.message || err || "");
    if (raw.toLowerCase().includes("failed to fetch")) {
      return (
        "Không kết nối được API (Failed to fetch). " +
        "Kiểm tra: backend `http://localhost:5001` đang chạy, FRONTEND_URL cho CORS đúng `http://localhost:3000`, và không bị chặn mạng."
      );
    }
    return raw || t("errors.serverConnection");
  };

  // Xử lý submit form (chung cho cả thêm và sửa)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    setSubmitError("");

    if (!formData.title) {
      setSubmitError(t("admin.songManager.alerts.missingRequiredFields"));
      return;
    }

    // If not uploading a new audio file, try to keep existing filename (strip base URL if needed)
    const existingAudioValue = formData.audioUrl?.startsWith(BASE_AUDIO_URL)
      ? formData.audioUrl.substring(BASE_AUDIO_URL.length)
      : formData.audioUrl;

    const existingImageValue = formData.imageUrl?.startsWith(BASE_IMAGE_URL)
      ? formData.imageUrl.substring(BASE_IMAGE_URL.length)
      : formData.imageUrl;

    if (!audioFile && !existingAudioValue) {
      setSubmitError(t("admin.songManager.alerts.missingRequiredFields"));
      return;
    }

    const url = isEditing
      ? `http://localhost:5001/api/admin/songs/${editingId}`
      : "http://localhost:5001/api/admin/songs";

    const method = isEditing ? "PUT" : "POST";

    const form = new FormData();
    form.append("title", formData.title);
    form.append("artist", formData.artist || "");

    if (audioFile) {
      form.append("audioFile", audioFile);
    } else if (existingAudioValue) {
      form.append("audioUrl", existingAudioValue);
    }

    if (imageFile) {
      form.append("imageFile", imageFile);
    } else if (existingImageValue) {
      form.append("imageUrl", existingImageValue);
    } else if (isEditing) {
      // Explicitly keep current by omitting imageUrl (backend will preserve)
    }

    try {
      setSubmitLoading(true);
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.error || t("admin.songManager.errors.genericError")
        );
      }

      alert(
        isEditing
          ? t("admin.songManager.alerts.updateSuccess")
          : t("admin.songManager.alerts.createSuccess")
      );
      setShowModal(false);
      setAudioFile(null);
      setImageFile(null);
      fetchSongs(currentPage);
    } catch (err) {
      const msg = mapFetchErrorToMessage(err);
      setSubmitError(msg);
      alert(msg);
      // keep modal open so user can see error details
      console.error("Song submit error:", err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading && songs.length === 0)
    return (
      <div style={{ padding: "20px" }}>{t("admin.songManager.loading")}</div>
    );

  return (
    <div className="song-manager">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2>{t("admin.songManager.title")}</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("admin.common.search.placeholderSongs")}
            style={{
              height: 36,
              padding: "8px 10px",
              border: "1px solid #ddd",
              borderRadius: 8,
              minWidth: 260,
              outline: "none",
            }}
          />
          <button className="admin-btn btn-primary" onClick={openAddModal}>
            + {t("admin.songManager.addNew")}
          </button>
        </div>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>{t("admin.songManager.columns.title")}</th>
              <th>{t("admin.songManager.columns.artist")}</th>
              <th>{t("admin.songManager.columns.listens")}</th>
              <th>{t("admin.songManager.columns.likes")}</th>
              <th>{t("admin.songManager.columns.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {songs.map((song, idx) => (
              <tr key={song.id}>
                <td>{(currentPage - 1) * limit + idx + 1}</td>
                <td>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <img
                      src={song.imageUrl || "https://placehold.co/40x40"}
                      alt=""
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "4px",
                        objectFit: "cover",
                      }}
                      onError={(e) =>
                        (e.target.src = "https://placehold.co/40x40")
                      }
                    />
                    {song.title}
                  </div>
                </td>
                <td>{song.artists || t("admin.songManager.notUpdated")}</td>
                <td>{song.listenCount || 0}</td>
                <td>{song.likeCount || 0}</td>
                <td>
                  {/* Nút Sửa: gọi openEditModal */}
                  <button
                    className="admin-btn btn-edit"
                    onClick={() => openEditModal(song)}
                  >
                    {t("admin.songManager.actions.edit")}
                  </button>
                  <button
                    className="admin-btn btn-danger"
                    onClick={() => handleDeleteSong(song.id)}
                  >
                    {t("admin.songManager.actions.delete")}
                  </button>
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

      {/* Modal Chung cho Thêm và Sửa */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {isEditing
                  ? t("admin.songManager.modal.editTitle")
                  : t("admin.songManager.modal.createTitle")}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setAudioFile(null);
                  setImageFile(null);
                  setSubmitError("");
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              {submitError ? (
                <div
                  style={{
                    background: "rgba(220, 53, 69, 0.08)",
                    border: "1px solid rgba(220, 53, 69, 0.35)",
                    color: "#b02a37",
                    padding: "10px 12px",
                    borderRadius: 8,
                    marginBottom: 12,
                    fontSize: 13,
                    lineHeight: 1.35,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {submitError}
                </div>
              ) : null}
              <div className="form-group">
                <label>{t("admin.songManager.form.titleLabel")}</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder={t("admin.songManager.form.titlePlaceholder")}
                />
              </div>

              <div className="form-group">
                <label>{t("admin.songManager.form.artistLabel")}</label>
                <input
                  type="text"
                  name="artist"
                  value={formData.artist}
                  onChange={handleInputChange}
                  placeholder={t("admin.songManager.form.artistPlaceholder")}
                />
              </div>

              <div className="form-group">
                <label>{t("admin.songManager.form.audioUrlLabel")}</label>
                <input
                  type="file"
                  accept="audio/*,video/mp4"
                  onChange={(e) => {
                    const f = e.target.files && e.target.files[0];
                    if (!f) {
                      setAudioFile(null);
                      return;
                    }
                    const type = String(f.type || "").toLowerCase();
                    const ok =
                      type.startsWith("audio/") ||
                      type === "video/mp4" ||
                      type === "audio/mp4" ||
                      type === "application/octet-stream";
                    if (!ok) {
                      alert(
                        "File âm thanh không hợp lệ. Hãy chọn mp3/m4a/mp4."
                      );
                      e.target.value = "";
                      setAudioFile(null);
                      return;
                    }
                    setAudioFile(f);
                  }}
                  required={!isEditing}
                />
                {isEditing && formData.audioUrl ? (
                  <div style={{ marginTop: 8 }}>
                    <div
                      style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}
                    >
                      Audio hiện tại:
                    </div>
                    <audio
                      controls
                      src={formData.audioUrl}
                      style={{ width: "100%" }}
                    />
                  </div>
                ) : null}
                {audioFile ? (
                  <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
                    {audioFile.name}
                  </div>
                ) : null}
              </div>
              <div className="form-group">
                <label>{t("admin.songManager.form.imageUrlLabel")}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files && e.target.files[0];
                    if (!f) {
                      setImageFile(null);
                      return;
                    }
                    const type = String(f.type || "").toLowerCase();
                    if (!type.startsWith("image/")) {
                      alert(
                        "File ảnh không hợp lệ. Bạn đang chọn nhầm mp3/mp4?"
                      );
                      e.target.value = "";
                      setImageFile(null);
                      return;
                    }
                    setImageFile(f);
                  }}
                />
                <div style={{ marginTop: 8 }}>
                  {imagePreviewUrl ? (
                    <img
                      src={imagePreviewUrl}
                      alt=""
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 6,
                        objectFit: "cover",
                      }}
                    />
                  ) : isEditing && formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt=""
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 6,
                        objectFit: "cover",
                      }}
                      onError={(e) =>
                        (e.target.src = "https://placehold.co/80x80")
                      }
                    />
                  ) : null}
                </div>
              </div>

              {isEditing && (
                <div className="form-group">
                  <button
                    type="button"
                    className="admin-btn btn-secondary"
                    onClick={() => setShowLyricsOption((v) => !v)}
                    style={{ width: "fit-content" }}
                  >
                    {t("admin.songManager.lyrics.optional")}
                  </button>

                  {showLyricsOption && (
                    <div style={{ marginTop: 10 }}>
                      <label style={{ display: "block", marginBottom: 6 }}>
                        {t("admin.songManager.lyrics.syncLabel")}
                      </label>
                      <input
                        type="file"
                        accept=".lrc,text/plain"
                        onChange={(e) => {
                          const f = e.target.files && e.target.files[0];
                          setLyricsFile(f || null);
                          setLyricsMessage("");
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          marginTop: 8,
                          alignItems: "center",
                        }}
                      >
                        <button
                          type="button"
                          className="admin-btn btn-secondary"
                          onClick={handleUploadLyrics}
                          disabled={lyricsUploading}
                        >
                          {lyricsUploading
                            ? t("admin.songManager.lyrics.uploading")
                            : t("admin.songManager.lyrics.uploadButton")}
                        </button>
                        {lyricsMessage ? (
                          <div style={{ fontSize: 12, opacity: 0.9 }}>
                            {lyricsMessage}
                          </div>
                        ) : null}
                      </div>
                      <div
                        style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}
                      >
                        {t("admin.songManager.lyrics.note")}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="modal-footer">
                <button
                  type="button"
                  className="admin-btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setAudioFile(null);
                    setImageFile(null);
                    setSubmitError("");
                  }}
                >
                  {t("songDetailPage.actions.cancel")}
                </button>
                <button
                  type="submit"
                  className="admin-btn btn-primary"
                  disabled={submitLoading}
                >
                  {isEditing
                    ? t("admin.songManager.modal.updateButton")
                    : t("admin.songManager.modal.createButton")}
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
