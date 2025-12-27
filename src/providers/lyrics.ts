import fetch from "node-fetch";
import type {
  Lyrics,
  SyncedLyrics,
  LrclibLyricsResponse,
} from "../types/lyrics.type";

import { LRCLIB_API_URL } from "../constants/lyrics.contants";

class LyricsAPI {
  private baseUrl = LRCLIB_API_URL;
  constructor() {}

  async getLyrics(
    trackName: string,
    artistName: string,
    albumName: string | null = null,
    duration: number | null = null
  ): Promise<Lyrics | null> {
    try {
      const params = new URLSearchParams();
      params.append("track_name", trackName);
      params.append("artist_name", artistName);

      if (albumName) {
        params.append("album_name", albumName);
      }

      if (duration) {
        params.append("duration", Math.round(duration).toString());
      }

      const r = await fetch(`${this.baseUrl}/get?${params}`);

      if (!r.ok) {
        if (r.status === 404) {
          return null;
        }
        throw new Error(`LRCLIB API Error: ${r.status} ${r.statusText}`);
      }

      const data = await r.json();
      return this.formatLyrics(data as LrclibLyricsResponse);
    } catch (error: Error | any) {
      console.error("Error getting lyrics:", error.message);
      return null;
    }
  }

  async search(
    trackName: string,
    artistName: string,
    albumName: string | null = null
  ): Promise<Lyrics[] | null> {
    try {
      const params = new URLSearchParams();
      params.append("track_name", trackName);
      params.append("artist_name", artistName);

      if (albumName) {
        params.append("album_name", albumName);
      }

      const r = await fetch(`${this.baseUrl}/search?${params}`);

      if (!r.ok) {
        throw new Error(`LRCLIB API Error: ${r.status} ${r.statusText}`);
      }

      const results = await r.json();

      if (results && Array.isArray(results) && results.length > 0) {
        const formattedResults: Lyrics[] = results
          .map((item: LrclibLyricsResponse) => this.formatLyrics(item))
          .filter((item: Lyrics | null): item is Lyrics => item !== null);
        return formattedResults;
      }

      return null;
    } catch (error: Error | any) {
      console.error("Error searching lyrics:", error.message);
      return null;
    }
  }

  formatLyrics(lyricsData: LrclibLyricsResponse): Lyrics | null {
    const {
      plainLyrics,
      syncedLyrics,
      trackName,
      artistName,
      albumName,
      duration,
    } = lyricsData;

    if (!trackName || !artistName) return null;

    const parsedPlainLyrics: string[] = plainLyrics
      ? plainLyrics
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      : [];
    const parsedSyncedLyrics: SyncedLyrics[] = this.parseLRC(syncedLyrics);

    return {
      id: "",
      name: trackName,
      trackName: trackName,
      artistName: artistName,
      albumName: albumName || "",
      duration: duration || 0,
      instrumental: false,
      plainLyrics: parsedPlainLyrics,
      syncedLyrics: parsedSyncedLyrics,
      source: "lrclib",
    };
  }

  parseLRC(lrcContent: string): SyncedLyrics[] {
    if (!lrcContent) return [];

    const lines = lrcContent.split("\n");
    const lyrics: SyncedLyrics[] = [];

    for (const line of lines) {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const ms = parseInt(match[3].padEnd(3, "0"), 10);
        const text = match[4].trim();

        const timeInMs = (minutes * 60 + seconds) * 1000 + ms;

        lyrics.push({
          time: timeInMs,
          timeFormatted: `${match[1]}:${match[2]}`,
          text: text,
        });
      }
    }

    return lyrics.sort((a, b) => a.time - b.time);
  }

  getCurrentLine(parsedLyrics: SyncedLyrics[], currentTimeMs: number) {
    if (!parsedLyrics || parsedLyrics.length === 0) return null;

    for (let i = parsedLyrics.length - 1; i >= 0; i--) {
      if (currentTimeMs >= parsedLyrics[i].time) {
        return {
          current: parsedLyrics[i],
          next: parsedLyrics[i + 1] || null,
          index: i,
        };
      }
    }

    return null;
  }
}

export default LyricsAPI;
