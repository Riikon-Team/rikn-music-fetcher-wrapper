// Main exports
export { RiknClient, type RiknClientConfig, type SongWithStream, type Platform } from "./RiknClient";

// Provider exports (nếu user muốn dùng trực tiếp)
export { default as SpotifyAPI } from "./providers/spotify";
export { default as YTApi } from "./providers/youtube";
export { default as LyricsAPI } from "./providers/lyrics";
export { default as YTDLP } from "./providers/yt-dlp";

// Type exports
export type { SpotifyAPIConfig } from "./types/spotify.type";
export type { YTMusicOption, YTDLPOption, YTApiOptions } from "./types/yt.type";
export type {
  Track,
  Album,
  Artist,
  Playlist,
  Video,
  SearchResults,
  Image
} from "./types/music.type";
export type {
  Lyrics,
  SyncedLyrics,
  LrclibLyricsResponse
} from "./types/lyrics.type";

// Constant exports
export { YTSearchType } from "./constants/yt.contants";
export { SpotifySearchType } from "./constants/spotify.constants";

// Utility exports
export * from "./core/utils";

// Default export
export { RiknClient as default } from "./RiknClient";