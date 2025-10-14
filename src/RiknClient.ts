import SpotifyAPI from "./providers/spotify";
import YTApi from "./providers/youtube";
import LyricsAPI from "./providers/lyrics";
import YTDLP from "./providers/yt-dlp";
import type { SpotifyAPIConfig } from "./types/spotify.type";
import type { YTMusicOption, YTDLPOption } from "./types/yt.type";
import type { Track, Playlist } from "./types/music.type";
import type { Lyrics } from "./types/lyrics.type";
import { extractYoutubePlaylistId, extractYoutubeVideoId } from "./core/utils";

export interface RiknClientConfig {
  spotify?: SpotifyAPIConfig;
  ytmusic?: YTMusicOption;
  ytdlp?: YTDLPOption;
}

export interface SongWithStream extends Track {
  streamUrl?: string;
}

export type Platform = "youtube" | "spotify";

export class RiknClient {
  private spotify?: SpotifyAPI;
  private ytmusic: YTApi;
  private lyrics: LyricsAPI;
  private ytdlp: YTDLP;

  constructor(config: RiknClientConfig = {}) {
    if (config.spotify) {
      this.spotify = new SpotifyAPI(config.spotify);
    }
    this.ytmusic = new YTApi(config.ytmusic);
    this.lyrics = new LyricsAPI();
    this.ytdlp = new YTDLP(config.ytdlp);
  }

  async searchSong(
    query: string,
    platform: Platform = "youtube"
  ): Promise<Track[]> {
    if (platform === "spotify") {
      if (!this.spotify) {
        throw new Error(
          "Spotify client not initialized. Please provide Spotify credentials."
        );
      }
      return await this.spotify.searchTracks(query);
    }

    // Default: YouTube Music
    const results = await this.ytmusic.search(query, "TRACK");
    return (results as Track[]) || [];
  }

  async searchFirstAndStream(query: string): Promise<SongWithStream | null> {
    const tracks = await this.searchSong(query, "youtube");
    if (!tracks || tracks.length === 0) {
      return null;
    }

    const firstTrack = tracks[0];
    try {
      const streamUrl = await this.ytdlp.getDirectAudioUrl(firstTrack.id, {
        additionalArgs: ["--force-ipv4"],
      });
      return {
        ...firstTrack,
        streamUrl,
      };
    } catch (error) {
      console.error("Failed to get stream URL:", error);
      return firstTrack;
    }
  }

  async getSongByUrl(
    url: string,
    withStreamUrl = false
  ): Promise<SongWithStream | null> {
    if (!url) return null;

    const platform = this.detectPlatform(url);

    if (platform === "spotify") {
      return await this.getSpotifySongByUrl(url, withStreamUrl);
    }

    if (platform === "youtube") {
      return await this.getYoutubeSongByUrl(url, withStreamUrl);
    }

    return null;
  }

  async getSongsByPlaylist(url: string): Promise<Track[]> {
    if (!url) return [];

    const platform = this.detectPlatform(url);

    if (platform === "spotify") {
      if (!this.spotify) {
        throw new Error("Spotify client not initialized");
      }
      const parsed = this.spotify.parseSpotifyUrl(url);
      if (parsed?.type === "playlist") {
        const playlist = await this.spotify.getPlaylist(parsed.id);
        return playlist.tracks;
      }
      if (parsed?.type === "album") {
        const album = await this.spotify.getAlbum(parsed.id);
        return [];
      }
    }

    if (platform === "youtube") {
      const playlistId = extractYoutubePlaylistId(url);
      if (playlistId) {
        const playlist = await this.ytmusic.getPlaylist(playlistId);
        return playlist?.tracks || [];
      }
    }

    return [];
  }

  async getStreamUrlByUrl(url: string): Promise<string> {
    const platform = this.detectPlatform(url);

    if (platform === "youtube") {
      const videoId = extractYoutubeVideoId(url);
      if (!videoId) {
        throw new Error("Invalid YouTube URL");
      }
      return await this.ytdlp.getDirectAudioUrl(videoId, {
        additionalArgs: ["--force-ipv4"],
      });
    }

    if (platform === "spotify") {
      const track = await this.getSongByUrl(url, false);
      if (!track) {
        throw new Error("Track not found on Spotify");
      }

      const searchQuery = `${track.artist} - ${track.title}`;
      const ytTracks = await this.searchSong(searchQuery, "youtube");

      if (!ytTracks || ytTracks.length === 0) {
        throw new Error("No YouTube equivalent found");
      }

      const firstTrack = ytTracks[0];
      return await this.ytdlp.getDirectAudioUrl(firstTrack.id, {
        additionalArgs: ["--force-ipv4"],
      });
    }

    throw new Error("Unsupported platform");
  }

  async streamSongByUrl(url: string): Promise<NodeJS.ReadableStream> {
    const platform = this.detectPlatform(url);

    if (platform === "spotify") {
      const track = await this.getSongByUrl(url, false);
      if (!track) {
        throw new Error("Track not found on Spotify");
      }

      const searchQuery = `${track.artist} - ${track.title}`;
      const ytTracks = await this.searchSong(searchQuery, "youtube");

      if (!ytTracks || ytTracks.length === 0) {
        throw new Error("No YouTube equivalent found");
      }

      const ytTrack = ytTracks[0];
      return await this.ytdlp.streamAudio(ytTrack.id, {
        additionalArgs: ["--force-ipv4"],
      });
    }

    if (platform === "youtube") {
      const videoId = extractYoutubeVideoId(url);
      if (!videoId) {
        throw new Error("Invalid YouTube URL");
      }
      return await this.ytdlp.streamAudio(videoId, {
        additionalArgs: ["--force-ipv4"],
      });
    }

    throw new Error("Unsupported platform for streaming");
  }

  async getLyrics(
    trackName: string,
    artistName: string,
    albumName?: string,
    duration?: number
  ): Promise<Lyrics | null> {
    return await this.lyrics.getLyrics(
      trackName,
      artistName,
      albumName,
      duration
    );
  }

  async searchLyrics(
    trackName: string,
    artistName: string,
    albumName?: string
  ): Promise<Lyrics[] | null> {
    return await this.lyrics.search(trackName, artistName, albumName);
  }

  private detectPlatform(url: string): Platform | null {
    if (url.includes("spotify.com")) return "spotify";
    if (
      url.includes("youtube.com") ||
      url.includes("youtu.be") ||
      url.includes("music.youtube.com")
    ) {
      return "youtube";
    }
    return null;
  }

  private async getSpotifySongByUrl(
    url: string,
    withStreamUrl: boolean
  ): Promise<SongWithStream | null> {
    if (!this.spotify) {
      throw new Error("Spotify client not initialized");
    }

    const parsed = this.spotify.parseSpotifyUrl(url);
    if (!parsed || parsed.type !== "track") {
      return null;
    }

    const track = await this.spotify.getTrack(parsed.id);

    if (!withStreamUrl) {
      return track;
    }

    const searchQuery = `${track.artist} - ${track.title}`;
    const ytTracks = await this.searchSong(searchQuery, "youtube");

    if (ytTracks && ytTracks.length > 0) {
      const ytTrack = ytTracks[0];
      try {
        const streamUrl = await this.ytdlp.getDirectAudioUrl(ytTrack.id, {
          additionalArgs: ["--force-ipv4"],
        });
        return {
          ...track,
          streamUrl,
        };
      } catch (error) {
        console.error("Failed to get stream URL:", error);
      }
    }

    return track;
  }

  private async getYoutubeSongByUrl(
    url: string,
    withStreamUrl: boolean
  ): Promise<SongWithStream | null> {
    const videoId = extractYoutubeVideoId(url);
    if (!videoId) {
      return null;
    }

    let track: Track | null = null;
    try {
      const video = await this.ytmusic.getVideo(videoId);
      if (video) {
        track = {
          id: video.id,
          title: video.name,
          artist:
            typeof video.artist === "string"
              ? video.artist
              : video.artist?.name || "",
          album: "",
          duration: video.duration,
          url: video.url,
          images: video.images,
          platform: "youtube",
        };
      }
    } catch (error) {
      try {
        track = await this.ytmusic.getTrack(videoId);
      } catch (trackError) {
        console.error("Failed to get track:", trackError);
      }
    }

    if (!track) {
      return null;
    }

    if (!withStreamUrl) {
      return track;
    }

    try {
      const streamUrl = await this.ytdlp.getDirectAudioUrl(videoId, {
        additionalArgs: ["--force-ipv4"],
      });
      return {
        ...track,
        streamUrl,
      };
    } catch (error) {
      console.error("Failed to get stream URL:", error);
      return track;
    }
  }
}

export default RiknClient;
