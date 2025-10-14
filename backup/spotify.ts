import Spotified, { SpotifyApiError } from "spotified";
import type { SpotifyAPIConfig } from "../types/spotify.type";
import type {
  Album,
  Artist,
  Playlist,
  Track,
  SearchResults,
  Image,
} from "../types/music.type";
import {
  SPOTIFY_DEFAULT_MARKET,
  SPOTIFY_DEFAULT_SEARCH_LIMIT,
  SpotifySearchType,
} from "../constants/spotify.constants";

class SpotifyAPI {
  private client: Spotified;
  private isInitialized: boolean = false;

  constructor(config: SpotifyAPIConfig) {
    if (!config.clientId || !config.clientSecret) {
      throw new Error("Spotify `clientId` and `clientSecret` are required");
    }

    this.client = new Spotified({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });

    this.init();
  }

  async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
      this.isInitialized = true;
    }
  }

  async init(): Promise<void> {
    try {
      const tokens =
        await this.client.auth.ClientCredentials.requestAccessToken();
      this.client.setBearerToken(tokens.access_token);
    } catch (error) {
      const message =
        error instanceof SpotifyApiError
          ? `${error.message} (Status: ${error.status})`
          : String(error);
      throw new Error(`Failed to authorize Spotify API: ${message}`);
    }
  }

  async search(
    query: string,
    types: string[] = [SpotifySearchType.TRACKS],
    market: string = SPOTIFY_DEFAULT_MARKET,
    limit: number = 20,
    offset: number = 0
  ): Promise<SearchResults> {
    await this.ensureInitialized();
    if (!query) throw new Error("Search query is required");

    try {
      const searchResponse = await this.client.search.searchForItem(
        query,
        types as any,
        {
          market,
          limit,
          offset,
        }
      );
      return this.formatSearchResults(searchResponse, types);
    } catch (error) {
      const message =
        error instanceof SpotifyApiError
          ? `${error.message} (Status: ${error.status})`
          : String(error);
      throw new Error(`Spotify Search Error: ${message}`);
    }
  }

  async searchTracks(
    query: string,
    market = SPOTIFY_DEFAULT_MARKET,
    limit = SPOTIFY_DEFAULT_SEARCH_LIMIT,
    offset = 0
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
    market = SPOTIFY_DEFAULT_MARKET,
    limit = SPOTIFY_DEFAULT_SEARCH_LIMIT,
    offset = 0
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
    market = SPOTIFY_DEFAULT_MARKET,
    limit = SPOTIFY_DEFAULT_SEARCH_LIMIT,
    offset = 0
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
    market = SPOTIFY_DEFAULT_MARKET,
    limit = SPOTIFY_DEFAULT_SEARCH_LIMIT,
    offset = 0
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

  async getTrack(trackId: string, market?: string): Promise<Track> {
    await this.ensureInitialized();
    if (!trackId) throw new Error("Track ID is required");
    try {
      const trackResponse = await this.client.track.getTrack(trackId, {
        market,
      });
      return this.formatTrack(trackResponse);
    } catch (error) {
      const message =
        error instanceof SpotifyApiError
          ? `${error.message} (Status: ${error.status})`
          : String(error);
      throw new Error(`Spotify Track Error: ${message}`);
    }
  }

  async getPlaylist(playlistId: string, market?: string): Promise<Playlist> {
    await this.ensureInitialized();
    if (!playlistId) throw new Error("Playlist ID is required");
    try {
      const playlistResponse = await this.client.playlist.getPlaylist(
        playlistId,
        { market }
      );

      const tracks = playlistResponse.tracks.items
        .filter((item: any) => item.track && item.track.type === "track")
        .map((item: any) => this.formatTrack(item.track));

      return {
        id: playlistResponse.id,
        name: playlistResponse.name,
        total: playlistResponse.tracks.total,
        tracks,
        url:
          playlistResponse.external_urls?.spotify ||
          `https://open.spotify.com/playlist/${playlistResponse.id}`,
        platform: "spotify",
        images: playlistResponse.images as Image[],
      };
    } catch (error) {
      const playlistResponse = await this.client.playlist.getFeaturedPlaylist()
      const message =
        error instanceof SpotifyApiError
          ? `${error.message} (Status: ${error.status})`
          : String(error);
      throw new Error(`Spotify Playlist Error: ${message}`);
    }
  }

  async getAlbum(albumId: string, market?: string): Promise<Album> {
    await this.ensureInitialized();
    if (!albumId) throw new Error("Album ID is required");
    try {
      const albumResponse = await this.client.album.getAlbum(albumId, {
        market,
      });
      return {
        id: albumResponse.id,
        name: albumResponse.name,
        total: albumResponse.total_tracks,
        images: albumResponse.images as Image[],
        artists: albumResponse.artists.map((artist: any) =>
          this.formatArtist(artist)
        ),
        platform: "spotify",
      };
    } catch (error) {
      const message =
        error instanceof SpotifyApiError
          ? `${error.message} (Status: ${error.status})`
          : String(error);
      throw new Error(`Spotify Album Error: ${message}`);
    }
  }

  async getFeaturedPlaylists(
    country?: string,
    limit = 20,
    offset = 0
  ): Promise<Playlist[]> {
    await this.ensureInitialized();
    try {
      const response = await this.client.browse.getFeaturedPlaylists({
        country,
        limit,
        offset,
      });
      return response.playlists.items.map((item: any) =>
        this.formatPlaylist(item)
      );
    } catch (error) {
      const message =
        error instanceof SpotifyApiError
          ? `${error.message} (Status: ${error.status})`
          : String(error);
      throw new Error(`Spotify Featured Playlists Error: ${message}`);
    }
  }

  async getCategoryPlaylists(
    categoryId: string,
    country?: string,
    limit = 20,
    offset = 0
  ): Promise<Playlist[]> {
    await this.ensureInitialized();
    try {
      const response = await this.client.browse.getCategoryPlaylists(
        categoryId,
        {
          country,
          limit,
          offset,
        }
      );
      return response.playlists.items.map((item: any) =>
        this.formatPlaylist(item)
      );
    } catch (error) {
      const message =
        error instanceof SpotifyApiError
          ? `${error.message} (Status: ${error.status})`
          : String(error);
      throw new Error(`Spotify Category Playlists Error: ${message}`);
    }
  }

  async getRecommendedPlaylists(
    seedArtists?: string[],
    seedGenres?: string[],
    seedTracks?: string[],
    limit = 20
  ): Promise<Track[]> {
    await this.ensureInitialized();
    try {
      const response = await this.client.browse.getRecommendations({
        seed_artists: seedArtists?.slice(0, 5).join(","),
        seed_genres: seedGenres?.slice(0, 5).join(","),
        seed_tracks: seedTracks?.slice(0, 5).join(","),
        limit,
      });
      return response.tracks.map((track: any) => this.formatTrack(track));
    } catch (error) {
      const message =
        error instanceof SpotifyApiError
          ? `${error.message} (Status: ${error.status})`
          : String(error);
      throw new Error(`Spotify Recommendations Error: ${message}`);
    }
  }

  parseSpotifyUrl(
    url: string
  ): { type: "track" | "playlist" | "album"; id: string } | null {
    const trackMatch = url.match(/track\/([a-zA-Z0-9]+)/);
    const playlistMatch = url.match(/playlist\/([a-zA-Z0-9]+)/);
    const albumMatch = url.match(/album\/([a-zA-Z0-9]+)/);

    if (trackMatch) return { type: "track", id: trackMatch[1] };
    if (playlistMatch) return { type: "playlist", id: playlistMatch[1] };
    if (albumMatch) return { type: "album", id: albumMatch[1] };
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
      videosTotal: 0,
      tracksTotal: data.tracks?.total || 0,
      albumsTotal: data.albums?.total || 0,
      artistsTotal: data.artists?.total || 0,
      playlistsTotal: data.playlists?.total || 0,
      tracks: [],
      albums: [],
      artists: [],
      playlists: [],
      videos: [],
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
    if (types.includes(SpotifySearchType.PLAYLISTS) && data.playlists) {
      results.playlists = data.playlists.items.map((item: any) =>
        this.formatPlaylist(item)
      );
    }
    return results;
  }

  formatTrack(item: any): Track {
    return {
      id: item.id,
      title: item.name,
      artist: item.artists.map((a: any) => a.name).join(", "),
      album: item?.album?.name || "",
      duration: Math.floor(item.duration_ms / 1000),
      url:
        item.external_urls?.spotify ||
        `https://open.spotify.com/track/${item.id}`,
      images: item?.album?.images || item?.images || [],
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
      url:
        item.external_urls?.spotify ||
        `https://open.spotify.com/artist/${item.id}`,
      platform: "spotify",
      images: (item.images as Image[]) || [],
    };
  }

  formatPlaylist(item: any): Playlist {
    return {
      tracks: [],
      id: item.id,
      name: item.name,
      total: item.tracks?.total || 0,
      images: (item.images as Image[]) || [],
      url:
        item.external_urls?.spotify ||
        `https://open.spotify.com/playlist/${item.id}`,
      platform: "spotify",
    };
  }
}

export default SpotifyAPI;
