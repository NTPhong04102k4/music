import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import "./SongDetailModal.css";

function CommentNode({ node, depth = 0, locale, anonymousLabel }) {
  const pad = Math.min(depth, 6) * 14;
  return (
    <div className="comment-node" style={{ marginLeft: pad }}>
      <div className="comment-meta">
        <span className="comment-user">{node.userName || anonymousLabel}</span>
        <span className="comment-time">
          {node.createdAt ? new Date(node.createdAt).toLocaleString(locale) : ""}
        </span>
      </div>
      <div className="comment-content">{node.content}</div>
      {Array.isArray(node.children) && node.children.length > 0 && (
        <div className="comment-children">
          {node.children.map((c) => (
            <CommentNode
              key={c.id}
              node={c}
              depth={depth + 1}
              locale={locale}
              anonymousLabel={anonymousLabel}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SongDetailModal({ song, onClose }) {
  const { t, i18n } = useTranslation();
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

  const currentLang = (i18n.resolvedLanguage || i18n.language || "vi")
    .toLowerCase()
    .split("-")[0];
  const uiLocale = currentLang === "vi" ? "vi-VN" : "en-US";

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
      .catch((e) => setError(e?.message || t("songDetailModal.errors.fetchDetailFailed")))
      .finally(() => setLoadingDetail(false));
  }, [songId, t]);

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

  const title = detail?.title || song?.title || t("songDetailModal.fallbackTitle");
  const artists = detail?.artists || song?.artists || t("songDetailModal.fallbackArtists");

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
              {loadingDetail && (
                <div className="song-detail-subtle">{t("common.loading")}</div>
              )}
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
            {t("songDetailModal.tabs.lyrics")}
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "comments" ? "active" : ""}`}
            onClick={() => setActiveTab("comments")}
          >
            {t("songDetailModal.tabs.comments")}
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
                  {t("songDetailModal.lyrics.original")}
                </button>
                <button
                  type="button"
                  className={`pill ${lyricsMode === "vi" ? "active" : ""}`}
                  onClick={() => setLyricsMode("vi")}
                >
                  {t("songDetailModal.lyrics.vi")}
                </button>
                <button
                  type="button"
                  className={`pill ${lyricsMode === "en" ? "active" : ""}`}
                  onClick={() => setLyricsMode("en")}
                >
                  {t("songDetailModal.lyrics.en")}
                </button>
              </div>

              {loadingLyrics ? (
                <div className="song-detail-subtle">
                  {t("songDetailModal.lyrics.loading")}
                </div>
              ) : !lyrics.original ? (
                <div className="song-detail-subtle">
                  {t("songDetailModal.lyrics.notFound")}
                </div>
              ) : (
                <pre className="lyrics-box">{lyricsText || ""}</pre>
              )}
            </div>
          )}

          {activeTab === "comments" && (
            <div>
              {loadingComments ? (
                <div className="song-detail-subtle">
                  {t("songDetailModal.comments.loading")}
                </div>
              ) : comments.length === 0 ? (
                <div className="song-detail-subtle">{t("songDetailModal.comments.empty")}</div>
              ) : (
                <div className="comment-tree">
                  {comments.map((c) => (
                    <CommentNode
                      key={c.id}
                      node={c}
                      locale={uiLocale}
                      anonymousLabel={t("songDetailModal.comments.anonymousUser")}
                    />
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


