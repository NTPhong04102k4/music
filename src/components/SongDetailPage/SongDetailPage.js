import React, { useEffect, useMemo, useRef, useState } from "react";
import "./SongDetailPage.css";
import { IoChevronBack, IoSend } from "react-icons/io5";

function buildTree(flat) {
  const byId = new Map();
  const roots = [];
  for (const r of flat) {
    byId.set(r.id, { ...r, children: Array.isArray(r.children) ? r.children : [] });
  }
  for (const r of flat) {
    const node = byId.get(r.id);
    if (node.parentId && byId.has(node.parentId)) byId.get(node.parentId).children.push(node);
    else roots.push(node);
  }
  return roots;
}

function CommentItem({ node, onReply }) {
  return (
    <div className="sdp-comment">
      <div className="sdp-comment-meta">
        <span className="sdp-user">{node.userName || "User"}</span>
        <span className="sdp-time">
          {node.createdAt ? new Date(node.createdAt).toLocaleString("vi-VN") : ""}
        </span>
      </div>
      <div className="sdp-comment-content">{node.content}</div>
      <div className="sdp-comment-actions">
        <button type="button" className="sdp-link" onClick={() => onReply(node)}>
          Trả lời
        </button>
      </div>
      {Array.isArray(node.children) && node.children.length > 0 && (
        <div className="sdp-children">
          {node.children.map((c) => (
            <CommentItem key={c.id} node={c} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
}

function SongDetailPage({ songId, onBack, currentSong }) {
  const [detail, setDetail] = useState(null);
  const [tab, setTab] = useState("lyrics"); // lyrics | comments
  const [lyrics, setLyrics] = useState({ original: null, vi: null, en: null });
  const [lyricsMode, setLyricsMode] = useState("original");

  const [commentsTree, setCommentsTree] = useState([]);
  const [replyTo, setReplyTo] = useState(null); // {id, userName}
  const [commentText, setCommentText] = useState("");

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const refreshTimerRef = useRef(null);

  const coverUrl = useMemo(() => {
    return (
      detail?.imageUrl ||
      currentSong?.cover ||
      currentSong?.imageUrl ||
      "https://placehold.co/220x220/130c1c/fff?text=No+Image"
    );
  }, [detail?.imageUrl, currentSong?.cover, currentSong?.imageUrl]);

  const title = detail?.title || currentSong?.title || "Bài hát";
  const artists = detail?.artists || currentSong?.artists || "Unknown Artist";

  const fetchDetail = async () => {
    const res = await fetch(`http://localhost:5001/api/songs/${songId}/detail`);
    const d = await res.json();
    if (!res.ok) throw new Error(d?.error || `HTTP ${res.status}`);
    setDetail(d);
  };

  const fetchComments = async () => {
    const res = await fetch(`http://localhost:5001/api/songs/${songId}/comments`);
    const d = await res.json();
    if (!res.ok) throw new Error(d?.error || `HTTP ${res.status}`);
    const flat = Array.isArray(d?.data) ? d.data : [];
    // API already returns tree; but accept either tree or flat
    const tree = flat.length > 0 && Array.isArray(flat[0]?.children) ? flat : buildTree(flat);
    setCommentsTree(tree);
  };

  const fetchLyrics = async () => {
    const res = await fetch(`http://localhost:5001/api/songs/${songId}/lyrics`);
    const d = await res.json();
    if (!res.ok) throw new Error(d?.error || `HTTP ${res.status}`);
    setLyrics({
      original: d?.original || null,
      vi: d?.vi || null,
      en: d?.en || null,
    });
  };

  const refreshAll = async (opts = { showGlobalLoading: false }) => {
    if (opts?.showGlobalLoading) setIsInitialLoading(true);
    setError("");
    const startMs = Date.now();
    setIsRefreshing(true);
    try {
      await fetchDetail();
      if (tab === "comments") await fetchComments();
      if (tab === "lyrics") await fetchLyrics();
    } catch (e) {
      setError(e?.message || "Lỗi tải dữ liệu");
    } finally {
      if (opts?.showGlobalLoading) setIsInitialLoading(false);
      const elapsed = Date.now() - startMs;
      const remain = Math.max(0, 200 - elapsed);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => setIsRefreshing(false), remain);
    }
  };

  useEffect(() => {
    refreshAll({ showGlobalLoading: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songId]);

  useEffect(() => {
    if (!songId) return;
    // load tab-specific data when switching
    if (tab === "comments") fetchComments().catch(() => {});
    if (tab === "lyrics") fetchLyrics().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  const submitComment = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Vui lòng đăng nhập để bình luận");
      return;
    }
    const text = String(commentText || "").trim();
    if (!text) return;

    const res = await fetch(`http://localhost:5001/api/songs/${songId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: text, parentId: replyTo?.id || null }),
    });
    const d = await res.json();
    if (!res.ok) {
      alert(d?.error || "Lỗi gửi bình luận");
      return;
    }
    setCommentText("");
    setReplyTo(null);
    await fetchComments().catch(() => {});
  };

  const lyricsText =
    lyricsMode === "vi"
      ? lyrics.vi
      : lyricsMode === "en"
        ? lyrics.en
        : lyrics.original;

  if (isInitialLoading) return <div style={{ padding: 20 }}>Đang tải...</div>;

  return (
    <div className="sdp">
      <div className="sdp-topbar">
        <button className="sdp-back" type="button" onClick={onBack}>
          <IoChevronBack /> Quay lại
        </button>
        <div className="sdp-topbar-title">Chi tiết bài hát</div>
        <button className="sdp-refresh" type="button" onClick={() => refreshAll()} disabled={isRefreshing}>
          <span className={`reload-spinner ${isRefreshing ? "" : "hidden"}`} />
          Làm mới
        </button>
      </div>

      <div className="sdp-content">
        <aside className="sdp-side">
          <img className="sdp-cover" src={coverUrl} alt="" />
          <div className="sdp-title" title={title}>
            {title}
          </div>
          <div className="sdp-artists" title={artists}>
            {artists}
          </div>
          {detail && (
            <div className="sdp-stats">
              <div>❤ {detail.likeCount}</div>
              <div>▶ {detail.listenCount}</div>
            </div>
          )}
          {error && <div className="sdp-error">{error}</div>}
        </aside>

        <section className="sdp-main">
          <div className="sdp-tabs">
            <button
              type="button"
              className={`tab-btn ${tab === "lyrics" ? "active" : ""}`}
              onClick={() => setTab("lyrics")}
            >
              Lời bài hát
            </button>
            <button
              type="button"
              className={`tab-btn ${tab === "comments" ? "active" : ""}`}
              onClick={() => setTab("comments")}
            >
              Bình luận
            </button>
          </div>

          {tab === "lyrics" && (
            <div className="sdp-panel">
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
              {!lyrics.original ? (
                <div className="sdp-subtle">Không tìm thấy lời bài hát.</div>
              ) : (
                <pre className="lyrics-box">{lyricsText || ""}</pre>
              )}
            </div>
          )}

          {tab === "comments" && (
            <div className="sdp-panel">
              <div className="sdp-composer">
                {replyTo ? (
                  <div className="sdp-replying">
                    Đang trả lời: <b>{replyTo.userName || "User"}</b>
                    <button type="button" className="sdp-link" onClick={() => setReplyTo(null)}>
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div className="sdp-subtle">Bình luận trực tiếp vào bài hát.</div>
                )}
                <div className="sdp-composer-row">
                  <input
                    className="sdp-composer-input"
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Nhập bình luận..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submitComment();
                      }
                    }}
                  />
                  <button type="button" className="sdp-send" onClick={submitComment}>
                    <IoSend />
                    Gửi
                  </button>
                </div>
              </div>

              <div className="sdp-tree">
                {commentsTree.length === 0 ? (
                  <div className="sdp-subtle">Chưa có bình luận.</div>
                ) : (
                  commentsTree.map((c) => (
                    <CommentItem
                      key={c.id}
                      node={c}
                      onReply={(node) => {
                        setReplyTo({ id: node.id, userName: node.userName });
                        setCommentText((t) => (t ? t : ""));
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default SongDetailPage;


