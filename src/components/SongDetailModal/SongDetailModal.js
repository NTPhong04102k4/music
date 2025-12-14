import React, { useEffect, useMemo, useState } from "react";
import "./SongDetailModal.css";

function CommentNode({ node, depth = 0 }) {
  const pad = Math.min(depth, 6) * 14;
  return (
    <div className="comment-node" style={{ marginLeft: pad }}>
      <div className="comment-meta">
        <span className="comment-user">{node.userName || "User"}</span>
        <span className="comment-time">
          {node.createdAt ? new Date(node.createdAt).toLocaleString("vi-VN") : ""}
        </span>
      </div>
      <div className="comment-content">{node.content}</div>
      {Array.isArray(node.children) && node.children.length > 0 && (
        <div className="comment-children">
          {node.children.map((c) => (
            <CommentNode key={c.id} node={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function SongDetailModal({ song, onClose }) {
  const [activeTab, setActiveTab] = useState("lyrics"); // lyrics | comments
  const [detail, setDetail] = useState(null);
  const [comments, setComments] = useState([]);
  const [lyrics, setLyrics] = useState({ original: null, vi: null, en: null });
  const [lyricsMode, setLyricsMode] = useState("original"); // original | vi | en
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [error, setError] = useState("");

  const songId = song?.id;

  const coverUrl = useMemo(() => {
    return (
      detail?.imageUrl ||
      song?.cover ||
      song?.imageUrl ||
      "https://placehold.co/160x160/130c1c/fff?text=No+Image"
    );
  }, [detail?.imageUrl, song?.cover, song?.imageUrl]);

  useEffect(() => {
    const esc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  useEffect(() => {
    if (!songId) return;
    setLoadingDetail(true);
    setError("");
    fetch(`http://localhost:5001/api/songs/${songId}/detail`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, status: r.status, d })))
      .then(({ ok, status, d }) => {
        if (!ok) throw new Error(d?.error || `HTTP ${status}`);
        setDetail(d);
      })
      .catch((e) => setError(e.message || "Lỗi tải chi tiết"))
      .finally(() => setLoadingDetail(false));
  }, [songId]);

  useEffect(() => {
    if (!songId) return;
    if (activeTab !== "comments") return;
    setLoadingComments(true);
    fetch(`http://localhost:5001/api/songs/${songId}/comments`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, status: r.status, d })))
      .then(({ ok, status, d }) => {
        if (!ok) throw new Error(d?.error || `HTTP ${status}`);
        setComments(Array.isArray(d?.data) ? d.data : []);
      })
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false));
  }, [songId, activeTab]);

  useEffect(() => {
    if (!songId) return;
    if (activeTab !== "lyrics") return;
    setLoadingLyrics(true);
    fetch(`http://localhost:5001/api/songs/${songId}/lyrics`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, status: r.status, d })))
      .then(({ ok, status, d }) => {
        if (!ok) throw new Error(d?.error || `HTTP ${status}`);
        setLyrics({
          original: d?.original || null,
          vi: d?.vi || null,
          en: d?.en || null,
        });
      })
      .catch(() => setLyrics({ original: null, vi: null, en: null }))
      .finally(() => setLoadingLyrics(false));
  }, [songId, activeTab]);

  const title = detail?.title || song?.title || "Bài hát";
  const artists = detail?.artists || song?.artists || "Unknown Artist";

  const lyricsText =
    lyricsMode === "vi"
      ? lyrics.vi
      : lyricsMode === "en"
        ? lyrics.en
        : lyrics.original;

  return (
    <div className="song-detail-overlay" onMouseDown={onClose}>
      <div
        className="song-detail-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="song-detail-header">
          <div className="song-detail-basic">
            <img className="song-detail-cover" src={coverUrl} alt="" />
            <div className="song-detail-meta">
              <div className="song-detail-title">{title}</div>
              <div className="song-detail-artists">{artists}</div>
              {!loadingDetail && detail && (
                <div className="song-detail-stats">
                  <span>❤ {detail.likeCount}</span>
                  <span>▶ {detail.listenCount}</span>
                </div>
              )}
              {loadingDetail && <div className="song-detail-subtle">Đang tải...</div>}
              {error && <div className="song-detail-error">{error}</div>}
            </div>
          </div>

          <button className="song-detail-close" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <div className="song-detail-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === "lyrics" ? "active" : ""}`}
            onClick={() => setActiveTab("lyrics")}
          >
            Lời bài hát
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "comments" ? "active" : ""}`}
            onClick={() => setActiveTab("comments")}
          >
            Bình luận
          </button>
        </div>

        <div className="song-detail-body">
          {activeTab === "lyrics" && (
            <div>
              <div className="lyrics-toolbar">
                <button
                  type="button"
                  className={`pill ${lyricsMode === "original" ? "active" : ""}`}
                  onClick={() => setLyricsMode("original")}
                >
                  Gốc
                </button>
                <button
                  type="button"
                  className={`pill ${lyricsMode === "vi" ? "active" : ""}`}
                  onClick={() => setLyricsMode("vi")}
                >
                  VI
                </button>
                <button
                  type="button"
                  className={`pill ${lyricsMode === "en" ? "active" : ""}`}
                  onClick={() => setLyricsMode("en")}
                >
                  EN
                </button>
              </div>

              {loadingLyrics ? (
                <div className="song-detail-subtle">Đang tải lời bài hát...</div>
              ) : !lyrics.original ? (
                <div className="song-detail-subtle">
                  Không tìm thấy lời bài hát cho bài này.
                </div>
              ) : (
                <pre className="lyrics-box">{lyricsText || ""}</pre>
              )}
            </div>
          )}

          {activeTab === "comments" && (
            <div>
              {loadingComments ? (
                <div className="song-detail-subtle">Đang tải bình luận...</div>
              ) : comments.length === 0 ? (
                <div className="song-detail-subtle">Chưa có bình luận.</div>
              ) : (
                <div className="comment-tree">
                  {comments.map((c) => (
                    <CommentNode key={c.id} node={c} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SongDetailModal;


