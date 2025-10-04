export type LrclibLyricsResponse = {
  id: string;
  name: string;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  instrumental: boolean;
  plainLyrics: string;
  syncedLyrics: string;
}

export type SyncedLyrics = {
  time: number;
  timeFormatted: string;
  text: string;
}

export type Lyrics = {
  id: string;
  name: string;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  instrumental: boolean;
  plainLyrics: string[];
  syncedLyrics: SyncedLyrics[];
  source: string;
}
