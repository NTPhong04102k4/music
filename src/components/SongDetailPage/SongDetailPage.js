import React, { useEffect, useMemo, useRef, useState } from "react";
import "./SongDetailPage.css";
import { IoChevronBack, IoSend } from "react-icons/io5";
import { useTranslation } from "react-i18next";

function parseLrc(lrcText) {
  const input = String(lrcText || "");
  const lines = input.split(/\r?\n/);
  const out = [];
  const timeTagRe = /\[(\d{1,2}):(\d{1,2}(?:\.\d{1,3})?)\]/g;

  for (const rawLine of lines) {
    if (!rawLine.trim()) continue;
    let match;
    const times = [];
    while ((match = timeTagRe.exec(rawLine)) !== null) {
      const mm = Number(match[1]);
      const ss = Number(match[2]);
      if (!Number.isFinite(mm) || !Number.isFinite(ss)) continue;
      times.push(mm * 60 + ss);
    }
    const text = rawLine.replace(timeTagRe, "").trim();
    if (!times.length) continue;
    for (const t of times) out.push({ timeSec: t, text });
  }

  out.sort((a, b) => a.timeSec - b.timeSec);
  // collapse consecutive duplicates (multi-tags)
  const collapsed = [];
  let lastText = null;
  for (const l of out) {
    if (!l.text) continue;
    if (l.text === lastText) continue;
    collapsed.push(l);
    lastText = l.text;
  }
  return collapsed;
}

function buildTree(flat) {
  const byId = new Map();
  const roots = [];
  for (const r of flat) {
    byId.set(r.id, {
      ...r,
      children: Array.isArray(r.children) ? r.children : [],
    });
  }
  for (const r of flat) {
    const node = byId.get(r.id);
    if (node.parentId && byId.has(node.parentId))
      byId.get(node.parentId).children.push(node);
    else roots.push(node);
  }
  return roots;
}

function CommentItem({ node, onReply, locale, anonymousLabel, replyLabel }) {
  return (
    <div className="sdp-comment">
      <div className="sdp-comment-meta">
        <span className="sdp-user">{node.userName || anonymousLabel}</span>
        <span className="sdp-time">
          {node.createdAt
            ? new Date(node.createdAt).toLocaleString(locale)
            : ""}
        </span>
      </div>
      <div className="sdp-comment-content">{node.content}</div>
      <div className="sdp-comment-actions">
        <button
          type="button"
          className="sdp-link"
          onClick={() => onReply(node)}
        >
          {replyLabel}
        </button>
      </div>
      {Array.isArray(node.children) && node.children.length > 0 && (
        <div className="sdp-children">
          {node.children.map((c) => (
            <CommentItem
              key={c.id}
              node={c}
              onReply={onReply}
              locale={locale}
              anonymousLabel={anonymousLabel}
              replyLabel={replyLabel}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SongDetailPage({
  songId,
  onBack,
  currentSong,
  playbackTime = 0,
  onSeek,
}) {
  const { t, i18n } = useTranslation();
  const [detail, setDetail] = useState(null);
  const [tab, setTab] = useState("lyrics"); // lyrics | comments
  const [lyrics, setLyrics] = useState({
    lrc: null,
    original: null,
    vi: null,
    en: null,
  });
  const [lyricsMode, setLyricsMode] = useState("original");
  const [lrcLines, setLrcLines] = useState([]);
  const [activeLineIdx, setActiveLineIdx] = useState(-1);
  const lyricLineRefs = useRef([]);

  const [commentsTree, setCommentsTree] = useState([]);
  const [replyTo, setReplyTo] = useState(null); // {id, userName}
  const [commentText, setCommentText] = useState("");

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const refreshTimerRef = useRef(null);

  const currentLang = (i18n.resolvedLanguage || i18n.language || "vi")
    .toLowerCase()
    .split("-")[0];
  const uiLocale = currentLang === "vi" ? "vi-VN" : "en-US";

  const coverUrl = useMemo(() => {
    return (
      detail?.imageUrl ||
      currentSong?.cover ||
      currentSong?.imageUrl ||
      "https://placehold.co/220x220/130c1c/fff?text=No+Image"
    );
  }, [detail?.imageUrl, currentSong?.cover, currentSong?.imageUrl]);

  const title =
    detail?.title || currentSong?.title || t("songDetailModal.fallbackTitle");
  const artists =
    detail?.artists ||
    currentSong?.artists ||
    t("songDetailModal.fallbackArtists");

  const fetchDetail = async () => {
    const res = await fetch(`http://localhost:5001/api/songs/${songId}/detail`);
    const d = await res.json();
    if (!res.ok) throw new Error(d?.error || `HTTP ${res.status}`);
    setDetail(d);
  };

  const fetchComments = async () => {
    const res = await fetch(
      `http://localhost:5001/api/songs/${songId}/comments`
    );
    const d = await res.json();
    if (!res.ok) throw new Error(d?.error || `HTTP ${res.status}`);
    const flat = Array.isArray(d?.data) ? d.data : [];
    // API already returns tree; but accept either tree or flat
    const tree =
      flat.length > 0 && Array.isArray(flat[0]?.children)
        ? flat
        : buildTree(flat);
    setCommentsTree(tree);
  };

  const fetchLyrics = async () => {
    const res = await fetch(`http://localhost:5001/api/songs/${songId}/lyrics`);
    const d = await res.json();
    if (!res.ok) throw new Error(d?.error || `HTTP ${res.status}`);
    setLyrics({
      lrc: d?.lrc || null,
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
      setError(e?.message || t("songDetailPage.errors.fetchFailed"));
    } finally {
      if (opts?.showGlobalLoading) setIsInitialLoading(false);
      const elapsed = Date.now() - startMs;
      const remain = Math.max(0, 200 - elapsed);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(
        () => setIsRefreshing(false),
        remain
      );
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
      alert(t("songDetailPage.comments.loginRequired"));
      return;
    }
    const text = String(commentText || "").trim();
    if (!text) return;

    const res = await fetch(
      `http://localhost:5001/api/songs/${songId}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text, parentId: replyTo?.id || null }),
      }
    );
    const d = await res.json();
    if (!res.ok) {
      alert(d?.error || t("songDetailPage.comments.sendFailed"));
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

  const viLines = useMemo(() => {
    return lyrics?.vi ? String(lyrics.vi).split(/\r?\n/) : [];
  }, [lyrics?.vi]);
  const enLines = useMemo(() => {
    return lyrics?.en ? String(lyrics.en).split(/\r?\n/) : [];
  }, [lyrics?.en]);

  useEffect(() => {
    const lines = lyrics?.lrc ? parseLrc(lyrics.lrc) : [];
    setLrcLines(lines);
    setActiveLineIdx(-1);
    lyricLineRefs.current = [];
  }, [lyrics?.lrc]);

  useEffect(() => {
    if (!lrcLines.length) return;
    const t = Number(playbackTime);
    if (!Number.isFinite(t)) return;

    // binary search: last index with timeSec <= t
    let lo = 0;
    let hi = lrcLines.length - 1;
    let ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (lrcLines[mid].timeSec <= t + 0.02) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    if (ans !== activeLineIdx) {
      setActiveLineIdx(ans);
      const el = lyricLineRefs.current[ans];
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ block: "center", behavior: "auto" });
      }
    }
  }, [playbackTime, lrcLines, activeLineIdx]);

  if (isInitialLoading)
    return <div style={{ padding: 20 }}>{t("common.loading")}</div>;

  return (
    <div className="sdp">
      <div className="sdp-topbar">
        <button className="sdp-back" type="button" onClick={onBack}>
          <IoChevronBack /> {t("common.back")}
        </button>
        <div className="sdp-topbar-title">{t("songDetailPage.title")}</div>
        <button
          className="sdp-refresh"
          type="button"
          onClick={() => refreshAll()}
          disabled={isRefreshing}
        >
          <span className={`reload-spinner ${isRefreshing ? "" : "hidden"}`} />
          {t("songDetailPage.actions.refresh")}
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
              {t("songDetailModal.tabs.lyrics")}
            </button>
            <button
              type="button"
              className={`tab-btn ${tab === "comments" ? "active" : ""}`}
              onClick={() => setTab("comments")}
            >
              {t("songDetailModal.tabs.comments")}
            </button>
          </div>

          {tab === "lyrics" && (
            <div className="sdp-panel">
              <div className="lyrics-toolbar">
                <button
                  type="button"
                  className={`pill ${
                    lyricsMode === "original" ? "active" : ""
                  }`}
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
                {lyrics?.lrc ? (
                  <span className="sdp-sync-badge">
                    {t("songDetailPage.lyrics.syncBadge")}
                  </span>
                ) : null}
              </div>
              {!lyrics?.original && !lyrics?.lrc ? (
                <div className="sdp-subtle">
                  {t("songDetailPage.lyrics.notFound")}
                </div>
              ) : (
                <>
                  {lrcLines.length > 0 ? (
                    <div className="sdp-lyrics-sync">
                      {lrcLines.map((line, idx) => {
                        const textForMode =
                          lyricsMode === "vi"
                            ? viLines[idx] ?? line.text
                            : lyricsMode === "en"
                            ? enLines[idx] ?? line.text
                            : line.text;
                        return (
                          <div
                            key={`${line.timeSec}-${idx}`}
                            ref={(el) => {
                              lyricLineRefs.current[idx] = el;
                            }}
                            className={`sdp-lyric-line ${
                              idx === activeLineIdx ? "active" : ""
                            }`}
                            role="button"
                            tabIndex={0}
                            onClick={() => onSeek && onSeek(line.timeSec)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                onSeek && onSeek(line.timeSec);
                            }}
                            title={t("songDetailPage.lyrics.seekHint")}
                          >
                            {textForMode}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <pre className="lyrics-box">{lyricsText || ""}</pre>
                  )}
                </>
              )}
            </div>
          )}

          {tab === "comments" && (
            <div className="sdp-panel">
              <div className="sdp-composer">
                {replyTo ? (
                  <div className="sdp-replying">
                    {t("songDetailPage.comments.replyingTo")}{" "}
                    <b>
                      {replyTo.userName ||
                        t("songDetailModal.comments.anonymousUser")}
                    </b>
                    <button
                      type="button"
                      className="sdp-link"
                      onClick={() => setReplyTo(null)}
                    >
                      {t("songDetailPage.actions.cancel")}
                    </button>
                  </div>
                ) : (
                  <div className="sdp-subtle">
                    {t("songDetailPage.comments.directHint")}
                  </div>
                )}
                <div className="sdp-composer-row">
                  <input
                    className="sdp-composer-input"
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={t("songDetailPage.comments.placeholder")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submitComment();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="sdp-send"
                    onClick={submitComment}
                  >
                    <IoSend />
                    {t("songDetailPage.comments.send")}
                  </button>
                </div>
              </div>

              <div className="sdp-tree">
                {commentsTree.length === 0 ? (
                  <div className="sdp-subtle">
                    {t("songDetailModal.comments.empty")}
                  </div>
                ) : (
                  commentsTree.map((c) => (
                    <CommentItem
                      key={c.id}
                      node={c}
                      locale={uiLocale}
                      anonymousLabel={t(
                        "songDetailModal.comments.anonymousUser"
                      )}
                      replyLabel={t("songDetailPage.comments.reply")}
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
