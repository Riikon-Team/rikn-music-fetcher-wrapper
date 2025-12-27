export type Image = {
    url: string;
    height: number;
    width: number;
}

export type Track = {
    id: string;
    title: string;
    artist: string;
    album: string;
    duration: number | null;
    url: string;
    images: Image[];
    platform: string;

}

export type Album = {
    id: string;
    name: string;
    total: number;
    images: Image[];
    artists: Artist[] | string[] | null;
    platform: string;
    playlistId?: string; // ID of the playlist if this album is part of a playlist
}

export type Artist = {
    id: string;
    name: string;
    url: string;
    platform: string;
    images: Image[];
}

export type Playlist = {
    id: string;
    name: string;
    tracks: Track[];
    total: number;
    url: string;
    platform: string;
    images?: Image[];
}

export type Video = {
    id: string;
    name: string;
    artist: Artist | string | null;
    url: string;
    duration: number;
    images: Image[];
    platform: string;
}

export type SearchResults = {
    tracksTotal: number;
    albumsTotal: number;
    artistsTotal: number;
    playlistsTotal: number;
    videosTotal: number;
    tracks: Track[];
    albums: Album[];
    artists: Artist[];
    playlists: Playlist[];
    videos: Video[];
}
