import SpotifyAPI from './providers/spotify';
import LyricsAPI from './providers/lyrics';

import type {
    Lyrics,
    LrclibLyricsResponse,
    SyncedLyrics
    
} from "./types/lyrics.type";

import type {
    Image,
    Track,
    Album,
    Artist,
    Playlist,
    SearchResults
} from "./types/music.type"

import type {
    SpotifyAPIConfig
} from "./types/spotify.type";

export { 
    SpotifyAPI,
    LyricsAPI
};

export type {
    Lyrics,
    LrclibLyricsResponse,
    SyncedLyrics,
    // music types
    Image,
    Track,
    Album,
    Artist,
    Playlist,
    SearchResults,
    // config types
    SpotifyAPIConfig
};
