import axios, { AxiosInstance } from "axios";
import type {
  SpotifyAPIConfig,
} from "../types/spotify.type";

import type {
  Album,
  Artist,
  Playlist,
  Track,
  SearchResults,
  Image
} from "../types/music.type";

import {
  SPOTIFY_API_BASE_URL,
  SPOTIFY_DEFAULT_MARKET,
  SPOTIFY_DEFAULT_SEARCH_LIMIT,
  SPOTIFY_GET_ACCESS_TOKEN_URL,
  SpotifySearchType,
} from "../constants/spotify.constants";

class SpotifyAPI {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;
  private client: AxiosInstance;

  constructor(config: SpotifyAPIConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;

    if (!this.clientId || !this.clientSecret) {
      throw new Error("Spotify `clientId` and `clientSecret` are required");
    }

    this.client = axios.create({
      baseURL: SPOTIFY_API_BASE_URL,
      timeout: config.timeout || 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.request.use(async (request) => {
      if (
        !this.accessToken ||
        (this.tokenExpiry && Date.now() >= this.tokenExpiry)
      ) {
        await this._refreshToken();
      }
      if (this.accessToken) {
        request.headers["Authorization"] = `Bearer ${this.accessToken}`;
      }
      return request;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this._refreshToken();
          return this.client.request(error.config);
        }
        throw error;
      }
    );

    this.init();
  }

  async authorization(): Promise<void> {
    const r = await axios.post(
      SPOTIFY_GET_ACCESS_TOKEN_URL,
      new URLSearchParams({
        grant_type: "client_credentials",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(this.clientId + ":" + this.clientSecret).toString(
              "base64"
            ),
        },
      }
    );

    if (r.status !== 200) {
      throw new Error(`Failed to authorize Spotify API: ${r.statusText}`);
    }

    const data = r.data;
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000;
  }

  async _refreshToken(): Promise<void> {
    if (!this.refreshToken) {
      await this.authorization();
      return;
    }

    const r = await axios.post(
      SPOTIFY_GET_ACCESS_TOKEN_URL,
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.refreshToken || "",
        client_id: this.clientId,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (r.status !== 200) {
      throw new Error(`Failed to refresh Spotify token: ${r.statusText}`);
    }

    const data = r.data;
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000;

    if (data.refresh_token) {
      this.refreshToken = data.refresh_token;
    }
  }

  async init() {
    await this.authorization();
  }

  async search(
    query: string,
    types: string[] = [SpotifySearchType.TRACKS],
    market: string = SPOTIFY_DEFAULT_MARKET,
    limit: number = 20,
    offset: number = 0
  ): Promise<SearchResults> {
    if (!query) {
      throw new Error("Search query is required");
    }

    const searchParams = new URLSearchParams({
      q: query,
      type: types.join(","),
      limit: limit.toString(),
      market: market,
      offset: offset.toString(),
    });

    const r = await this.client.get(`/search?${searchParams.toString()}`);
    if (r.status !== 200) {
      throw new Error(`Spotify Search Error: ${r.statusText}`);
    }

    return this.formatSearchResults(r.data, types);
  }

  async searchTracks(
    query: string,
    market: string = SPOTIFY_DEFAULT_MARKET,
    limit: number = SPOTIFY_DEFAULT_SEARCH_LIMIT,
    offset: number = 0
  ): Promise<Track[]> {
    const results = await this.search(
      query,
      [SpotifySearchType.TRACKS],
      market,
      limit,
      offset
    );
    return results.tracks;
  }

  async searchAlbums(
    query: string,
    market: string = SPOTIFY_DEFAULT_MARKET,
    limit: number = SPOTIFY_DEFAULT_SEARCH_LIMIT,
    offset: number = 0
  ): Promise<Album[]> {
    const results = await this.search(
      query,
      [SpotifySearchType.ALBUMS],
      market,
      limit,
      offset
    );
    return results.albums;
  }

  async searchArtists(
    query: string,
    market: string = SPOTIFY_DEFAULT_MARKET,
    limit: number = SPOTIFY_DEFAULT_SEARCH_LIMIT,
    offset: number = 0
  ): Promise<Artist[]> {
    const results = await this.search(
      query,
      [SpotifySearchType.ARTISTS],
      market,
      limit,
      offset
    );
    return results.artists;
  }

  async searchPlaylists(
    query: string,
    market: string = SPOTIFY_DEFAULT_MARKET,
    limit: number = SPOTIFY_DEFAULT_SEARCH_LIMIT,
    offset: number = 0
  ): Promise<Playlist[]> {
    const results = await this.search(
      query,
      [SpotifySearchType.PLAYLISTS],
      market,
      limit,
      offset
    );
    return results.playlists;
  }

  async getTrack(trackId: string): Promise<Track> {
    const r = await this.client.get(`/tracks/${trackId}`);
    if (r.status !== 200) {
      throw new Error(`Spotify Track Error: ${r.statusText}`);
    }

    const data = r.data;
    return this.formatTrack(data);
  }

  async getPlaylist(playlistId: string): Promise<Playlist> {
    const r = await this.client.get(`/playlists/${playlistId}`);
    if (r.status !== 200) {
      throw new Error(`Spotify Playlist Error: ${r.statusText}`);
    }

    const data = r.data;

    const tracks = data.tracks.items.map((item: any) =>
      this.formatTrack(item.track)
    );

    return {
      id: data.id,
      name: data.name,
      total: data.tracks.total,
      tracks: tracks,
      url: data.external_urls?.spotify || `https://open.spotify.com/playlist/${data.id}`,
      platform: "spotify",
    };
  }

  async getAlbum(albumId: string): Promise<Album> {
    const r = await this.client.get(`/albums/${albumId}`);
    const response = r;

    if (response.status !== 200) {
      throw new Error(`Spotify Album Error: ${response.statusText}`);
    }

    const data = response.data;

    return {
      id: data.id,
      name: data.name,
      total: data.total,
      images: data.images as Image[],
      artists: data.artists.map((a: any) => this.formatArtist(a)),
      platform: "spotify",
    };
  }

  parseSpotifyUrl(url: string): { type: "track" | "playlist" | "album"; id: string } | null {
    const trackMatch = url.match(/track\/([a-zA-Z0-9]+)/);
    const playlistMatch = url.match(/playlist\/([a-zA-Z0-9]+)/);
    const albumMatch = url.match(/album\/([a-zA-Z0-9]+)/);

    if (trackMatch) {
      return { type: "track", id: trackMatch[1] };
    } else if (playlistMatch) {
      return { type: "playlist", id: playlistMatch[1] };
    } else if (albumMatch) {
      return { type: "album", id: albumMatch[1] };
    }

    return null;
  }

  isSpotifyUrl(url: string): boolean {
    return url.includes("spotify.com/");
  }

  async getFromUrl(url: string): Promise<any> {
    const parsed = this.parseSpotifyUrl(url);
    if (!parsed) return null;

    switch (parsed.type) {
      case "track":
        const track = await this.getTrack(parsed.id);
        return { tracks: [track], isPlaylist: false };
      case "playlist":
        const playlist = await this.getPlaylist(parsed.id);
        return {
          tracks: playlist.tracks,
          isPlaylist: true,
          name: playlist.name,
        };
      case "album":
        const album = await this.getAlbum(parsed.id);
        return { isPlaylist: true, name: album.name };
      default:
        return null;
    }
  }

  formatSearchResults(data: any, types: string[]): SearchResults {
    const results: SearchResults = {
      tracksTotal: data.tracks?.total || 0,
      albumsTotal: data.albums?.total || 0,
      artistsTotal: data.artists?.total || 0,
      playlistsTotal: data.playlists?.total || 0,
      tracks: [],
      albums: [],
      artists: [],
      playlists: [],
    };

    if (types.includes(SpotifySearchType.TRACKS) && data.tracks) {
      results.tracks = data.tracks.items.map((item: any) =>
        this.formatTrack(item)
      );
    }
    if (types.includes(SpotifySearchType.ALBUMS) && data.albums) {
      results.albums = data.albums.items.map((item: any) =>
        this.formatAlbum(item)
      );
    }
    if (types.includes(SpotifySearchType.ARTISTS) && data.artists) {
      results.artists = data.artists.items.map((item: any) =>
        this.formatArtist(item)
      );
    }
    return results;
  }

  formatTrack(item: any): Track {
    return {
      id: item.id,
      title: item.name,
      artist: item.artists.map((a: any) => a.name).join(", "),
      album: item?.album?.name,
      duration: Math.floor(item.duration_ms / 1000),
      url:
        item.external_urls?.spotify ||
        `https://open.spotify.com/track/${item.id}`,
      images: item?.album?.images || [],
      platform: "spotify",
    };
  }

  formatAlbum(item: any): Album {
    return {
      id: item.id,
      name: item.name,
      images: item.images as Image[],
      artists: item.artists.map((a: any) => this.formatArtist(a)),
      total: item.total_tracks,
      platform: "spotify",
    };
  }

  formatArtist(item: any): Artist {
    return {
      id: item.id,
      name: item.name,
      url: item.external_urls?.spotify || `https://open.spotify.com/artist/${item.id}`,
      platform: "spotify",
      images: item.images as Image[],
    };
  }
}

export default SpotifyAPI;
