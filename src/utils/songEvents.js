export const SONG_STATS_CHANGED_EVENT = "song:statsChanged";

/**
 * Emit when a song's stats (e.g. likeCount) changes so the whole app can refresh.
 * @param {{ songId: number|string, likeCount?: number }} detail
 */
export function emitSongStatsChanged(detail) {
  window.dispatchEvent(new CustomEvent(SONG_STATS_CHANGED_EVENT, { detail }));
}


