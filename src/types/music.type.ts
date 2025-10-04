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
    duration: number;
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
}

export type SearchResults = {
    tracksTotal: number;
    albumsTotal: number;
    artistsTotal: number;
    playlistsTotal: number;
    tracks: Track[];
    albums: Album[];
    artists: Artist[];
    playlists: Playlist[];
}
