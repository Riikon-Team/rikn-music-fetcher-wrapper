export type SpotifyAPIConfig = {
  clientId: string;
  clientSecret: string;
  timeout?: number;
}

export type SpotifySearchResults = {
  tracksTotal: number;
  albumsTotal: number;
  artistsTotal: number;
  playlistsTotal: number;
  tracks: SpotifyTrack[];
  albums: SpotifyAlbum[];
  artists: SpotifyArtist[];
  playlists: SpotifyPlaylist[];
}

export type SpotifyTrack = {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
}

export type SpotifyArtist = {
  id: string;
  name: string;
  external_urls: {
    spotify: string;
  };
}

export type SpotifyAlbum = {
  id: string;
  name: string;
  images: SpotifyImage[];
  artists: SpotifyArtist[];
}

export type SpotifyImage = {
  url: string;
  height: number;
  width: number;
}

export type SpotifySearchResponse = {
  tracks?: {
    items: SpotifyTrack[];
    total: number;
  };
  albums?: {
    items: SpotifyAlbum[];
    total: number;
  };
  artists?: {
    items: SpotifyArtist[];
    total: number;
  };
}

export type SpotifyPlaylist = {
  id: string;
  name: string;
  tracks: {
    items: Array<{
      track: SpotifyTrack;
    }>;
    total: number;
  };
}

export type FormattedAlbum = {
  id: string;
  name: string;
  tracks: Array<{
    title: string;
    artist: string;
    album: string;
    duration: number;
    platform: string;
    url: string;
    thumbnail: string | null;
    id: string;
  }>;
  total: number;
}

export type FormattedTrack = {
  title: string;
  artist: string;
  album: string;
  duration: number;
  url: string;
  thumbnail: string | null;
  id: string;
}
