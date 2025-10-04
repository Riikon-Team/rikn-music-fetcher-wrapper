import SpotifyAPI from './providers/spotify';
import LyricsAPI from './providers/lyrics';

import type {
    Lyrics,
} from "./types/lyrics.type";

import type {
    FormattedTrack,
    FormattedPlaylist,
    FormattedTrackSearchResults
} from "./types/index";

import type {
    SpotifyTrack,
    SpotifyArtist,
    SpotifyAlbum,
    SpotifyImage,
    SpotifySearchResponse,
    SpotifyPlaylist,
    FormattedAlbum
} from "./types/spotify.type";


export { 
    SpotifyAPI,
    LyricsAPI
};

export type {
    Lyrics,
    FormattedTrack,
    FormattedPlaylist,
    FormattedTrackSearchResults,
    SpotifyTrack,
    SpotifyArtist,
    SpotifyAlbum,
    SpotifyImage,
    SpotifySearchResponse,
    SpotifyPlaylist,
    FormattedAlbum
};
