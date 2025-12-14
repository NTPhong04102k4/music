import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
import "./PlayerControls.css";
import { useTranslation } from "react-i18next";

import {
  IoExpand,
  IoHeartOutline,
  IoHeart,
  IoEllipsisHorizontal,
  IoShuffleOutline,
  IoPlaySkipBack,
  IoPlaySkipForward,
  IoPlay,
  IoPause,
  IoRepeatOutline,
  IoVolumeMediumOutline,
  IoVolumeMuteOutline,
  IoVolumeLowOutline,
  IoMicOutline,
  IoListOutline,
} from "react-icons/io5";

const PlayerControls = React.forwardRef(function PlayerControls(
  {
    currentSong,
    onNext,
    onPrev,
    onTogglePlaylist,
    showPlaylistQueue,
    isFavorite,
    onToggleFavorite,
    onTimeUpdate,
    onOpenSongAction,
    onOpenSongDetail,
    seekToSeconds,
    onSeekHandled,
    onPlayStateChange,
  },
  ref
) {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [audio, setAudio] = useState(null);
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0);
  const repeatModeRef = useRef(0);
  const onNextRef = useRef(onNext);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(80);
  const [showLyrics, setShowLyrics] = useState(false);

  // --- LOGIC AUDIO (Giữ nguyên) ---
  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  useEffect(() => {
    if (currentSong && currentSong.audioUrl) {
      const prevAudio = audioRef.current;
      if (prevAudio) {
        prevAudio.pause();
        prevAudio.currentTime = 0;
        prevAudio.src = "";
      }

      const newAudio = new Audio(currentSong.audioUrl);
      newAudio.volume = volume / 100;

      const handleLoadedData = () => {
        setDuration(newAudio.duration);
        setIsPlaying(true);
      };

      const handleTimeUpdate = () => {
        const current = newAudio.currentTime;
        const total = newAudio.duration;
        setCurrentTime(current);
        setProgress(total ? (current / total) * 100 : 0);
        const cb = onTimeUpdateRef.current;
        if (typeof cb === "function") cb(current);
      };

      const handleEnded = () => {
        if (repeatModeRef.current === 2) {
          newAudio.currentTime = 0;
          newAudio.play();
          return;
        }

        const next = onNextRef.current;
        if (typeof next === "function") {
          next();
        } else {
          setIsPlaying(false);
          setProgress(0);
        }
      };

      newAudio.addEventListener("loadeddata", handleLoadedData);
      newAudio.addEventListener("timeupdate", handleTimeUpdate);
      newAudio.addEventListener("ended", handleEnded);

      setAudio(newAudio);
      audioRef.current = newAudio;
      setProgress(0);

      return () => {
        newAudio.pause();
        newAudio.src = "";
        newAudio.removeEventListener("loadeddata", handleLoadedData);
        newAudio.removeEventListener("timeupdate", handleTimeUpdate);
        newAudio.removeEventListener("ended", handleEnded);

        if (audioRef.current === newAudio) {
          audioRef.current = null;
        }
      };
    } else if (!currentSong) {
      const prevAudio = audioRef.current;
      if (prevAudio) prevAudio.pause();
      audioRef.current = null;
      setAudio(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong]);

  useEffect(() => {
    const a = audioRef.current;
    if (a) {
      if (isPlaying) {
        a.play().catch((error) => {
          console.error("Error playing audio:", error);
          setIsPlaying(false);
        });
      } else {
        a.pause();
      }
    }
  }, [isPlaying, audio]);

  // Sync play state upwards (for list UI)
  useEffect(() => {
    if (typeof onPlayStateChange === "function") {
      onPlayStateChange(!!isPlaying);
    }
  }, [isPlaying, onPlayStateChange]);

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = volume / 100;
  }, [volume, audio]);

  // Seek from external (e.g., synced lyrics click)
  useEffect(() => {
    if (!audio) return;
    if (typeof seekToSeconds !== "number" || !isFinite(seekToSeconds)) return;

    try {
      const target = Math.max(0, seekToSeconds);
      audio.currentTime = target;
      if (onSeekHandled) onSeekHandled();
    } catch (e) {
      console.error("Seek error:", e);
    }
  }, [seekToSeconds, audio, onSeekHandled]);

  const handlePlayPause = () => {
    if (audioRef.current) setIsPlaying(!isPlaying);
  };

  // Expose controls to parent (App) for list play/pause buttons
  useImperativeHandle(
    ref,
    () => ({
      togglePlayPause: () => {
        if (audioRef.current) setIsPlaying((prev) => !prev);
      },
      play: () => {
        if (audioRef.current) setIsPlaying(true);
      },
      pause: () => {
        if (audioRef.current) setIsPlaying(false);
      },
      isPlaying: () => !!isPlaying,
    }),
    [isPlaying]
  );

  const handleProgressChange = (e) => {
    const a = audioRef.current;
    if (a) {
      const newProgress = e.target.value;
      setProgress(newProgress);
      a.currentTime = (newProgress / 100) * duration;
    }
  };

  const handleShuffle = () => setIsShuffled(!isShuffled);
  const handleRepeat = () => setRepeatMode((prev) => (prev + 1) % 3);
  const handlePrev = () => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) a.currentTime = 0;
    else if (onPrev) onPrev();
  };
  const handleNext = () => {
    if (onNext) onNext();
  };

  const handleVolumeChange = (e) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleMute = () => {
    if (isMuted) {
      const newVolume = previousVolume > 0 ? previousVolume : 80;
      setVolume(newVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time) || time === 0) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="player-controls">
      <div className="player-left">
        <div
          className="song-cover"
          onDoubleClick={() =>
            currentSong && onOpenSongDetail && onOpenSongDetail(currentSong)
          }
          title={t("playerControls.tooltips.doubleClickToViewDetail")}
        >
          <img
            src={
              currentSong
                ? currentSong.cover ||
                  currentSong.imageUrl ||
                  "https://placehold.co/60x60/a64883/fff?text=No+Image"
                : "https://placehold.co/60x60/130c1c/fff?text=NCT"
            }
            alt={t("playerControls.songCoverAlt")}
            onError={(e) => {
              e.target.src =
                "https://placehold.co/60x60/a64883/fff?text=No+Image";
            }}
          />
          <div className="cover-icon">
            <IoExpand />
          </div>
        </div>
        <div
          className="song-info"
          onDoubleClick={() =>
            currentSong && onOpenSongDetail && onOpenSongDetail(currentSong)
          }
          title={t("playerControls.tooltips.doubleClickToViewDetail")}
        >
          <div className="song-name">
            {currentSong
              ? currentSong.title
              : t("playerControls.noSongSelected")}
          </div>
          <div className="artist-name">
            {currentSong
              ? currentSong.artists
              : t("playerControls.unknownArtist")}
          </div>
        </div>
        <div className="song-actions">
          {/* Nút Yêu thích */}
          <button
            type="button"
            className={`player-btn icon-btn ${isFavorite ? "active" : ""}`}
            onClick={onToggleFavorite}
            disabled={!currentSong}
            title={
              isFavorite
                ? t("playerControls.tooltips.removeFromFavorites")
                : t("playerControls.tooltips.addToFavorites")
            }
          >
            {isFavorite ? (
              <IoHeart className="heart-active" />
            ) : (
              <IoHeartOutline />
            )}
          </button>

          <button
            type="button"
            className="player-btn icon-btn"
            // Khi click, gọi hàm mở modal và truyền bài hát hiện tại vào
            onClick={() => currentSong && onOpenSongAction(currentSong)}
            disabled={!currentSong}
            title={t("playerControls.tooltips.more")}
          >
            <IoEllipsisHorizontal />
          </button>
        </div>
      </div>

      <div className="player-center">
        <div className="player-controls-buttons">
          <button
            type="button"
            className={`player-btn icon-btn ${isShuffled ? "active" : ""}`}
            onClick={handleShuffle}
          >
            <IoShuffleOutline />
          </button>
          <button
            type="button"
            className="player-btn icon-btn"
            onClick={handlePrev}
          >
            <IoPlaySkipBack />
          </button>
          <button
            type="button"
            className="player-btn icon-btn play-pause-btn"
            onClick={handlePlayPause}
            disabled={!audio}
          >
            {isPlaying ? <IoPause /> : <IoPlay />}
          </button>
          <button
            type="button"
            className="player-btn icon-btn"
            onClick={handleNext}
          >
            <IoPlaySkipForward />
          </button>
          <button
            type="button"
            className={`player-btn icon-btn ${repeatMode > 0 ? "active" : ""}`}
            onClick={handleRepeat}
          >
            <IoRepeatOutline />
            {repeatMode === 2 && <span className="repeat-one">1</span>}
          </button>
        </div>

        <div className="progress-bar-container">
          <span className="time-label">{formatTime(currentTime)}</span>
          <div className="progress-bar">
            <input
              type="range"
              className="progress-slider"
              min="0"
              max="100"
              step="0.1"
              value={progress || 0}
              onChange={handleProgressChange}
              style={{ "--progress-percent": `${progress || 0}%` }}
              disabled={!audio}
            />
          </div>
          <span className="time-label">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-right">
        <button type="button" className="player-btn quality-btn">
          128kbps
        </button>
        <button
          type="button"
          className="player-btn icon-btn"
          onClick={handleMute}
        >
          {isMuted || Math.round(volume) === 0 ? (
            <IoVolumeMuteOutline />
          ) : volume < 50 ? (
            <IoVolumeLowOutline />
          ) : (
            <IoVolumeMediumOutline />
          )}
        </button>
        <div className="volume-slider-container">
          <input
            type="range"
            className="volume-slider"
            min="0"
            max="100"
            step="1"
            value={volume}
            onChange={handleVolumeChange}
            style={{ "--progress-percent": `${volume}%` }}
          />
        </div>
        <span className="divider"></span>
        <button
          type="button"
          className={`player-btn icon-btn ${showLyrics ? "active" : ""}`}
          onClick={() => setShowLyrics(!showLyrics)}
        >
          <IoMicOutline />
        </button>
        {/* Nút Danh sách phát */}
        <button
          type="button"
          className={`player-btn icon-btn ${showPlaylistQueue ? "active" : ""}`}
          onClick={onTogglePlaylist}
        >
          <IoListOutline />
        </button>
      </div>

      {showLyrics && (
        <div className="lyrics-panel">
          <div className="lyrics-header">
            <h3>{t("playerControls.lyrics.title")}</h3>
            <button type="button" onClick={() => setShowLyrics(false)}>
              ×
            </button>
          </div>
          <div className="lyrics-content">
            <p>{t("playerControls.lyrics.placeholder")}</p>
          </div>
        </div>
      )}
    </div>
  );
});

export default PlayerControls;
