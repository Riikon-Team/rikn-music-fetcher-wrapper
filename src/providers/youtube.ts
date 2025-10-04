import YTMusic from "ytmusic-api";
import type { 
    YTMusicOption,
    YTMusicType
} from "../types/yt.type";
import type {
    Album,
    Artist,
    Playlist,
    Track,
    Video,
    SearchResults
} from "../types/music.type.ts";
import { YTSearchType } from "../constants/yt.contants";
import fs from "fs";

class YTApi {
    private client: YTMusic;
    private isInitialized: boolean = false;
    private options?: YTMusicOption;
    constructor(options?:YTMusicOption) {
        this.client = new YTMusic();
        this.options = options;
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        await this.client.initialize({
            cookies: this.options?.cookiesPath ? YTApi.getCookiesContentFromNetscapeCookieFile(this.options.cookiesPath) : undefined,
            GL: this.options?.GL,
            HL: this.options?.HL,
        });
        this.isInitialized = true;
    }

    static getCookiesContentFromNetscapeCookieFile(cookieFilePath: string): string {
        if (!fs.existsSync(cookieFilePath)) {
            console.warn(`Cookie file not found at path: ${cookieFilePath}`);
            return "";
        }
        const content = fs.readFileSync(cookieFilePath, { encoding: "utf-8" });
        return content;
    }

    async searchAllType(query: string): Promise<SearchResults[]> {
        if (!this.isInitialized) {
            await this.initialize();
        }
        const results: SearchResults = {
            tracksTotal: 0,
            albumsTotal: 0,
            artistsTotal: 0,
            playlistsTotal: 0,
            videosTotal: 0,
            tracks: [],
            albums: [],
            artists: [],
            playlists: [],
            videos: []
        }
        const searchResults = await this.client.search(query);
        for (const item of searchResults) {
            if (item.type === YTSearchType.Song) {
                results.tracks.push(await this.formatTrack(item));
            }
            if (item.type === YTSearchType.Album) {
                results.albums.push(await this.formatAlbum(item));
            }
            if (item.type === YTSearchType.Artist) {
                results.artists.push(await this.formatArtist(item));
            }
            if (item.type === YTSearchType.Playlist) {
                results.playlists.push(await this.formatPlaylist(item));
            }
            if (item.type === YTSearchType.Video) {
                results.videos.push(await this.formatVideo(item));
            }
        }
        return [results];
    }

    async search(query: string, type: YTMusicType | string): Promise<SearchResults[] | Track[] | Album[] | Artist[] | Playlist[] | Video[] | null> {
        if (!this.isInitialized) {
            await this.initialize();
        }
        if (type === "ALL") {
            return this.searchAllType(query);
        }
        if (type === "TRACK") {
            const results = await this.client.searchSongs(query);
            const tracks: Track[] = [];
            for (const item of results) {
                tracks.push(await this.formatTrack(item));
            }
            return tracks;
        }

        if (type === "ALBUM") {
            const results = await this.client.searchAlbums(query);
            const albums: Album[] = [];
            for (const item of results) {
                albums.push(await this.formatAlbum(item));
            }
            return albums;
        }

        if (type === "ARTIST") {
            const results = await this.client.searchArtists(query);
            const artists: Artist[] = [];
            for (const item of results) {
                artists.push(await this.formatArtist(item));
            }
            return artists;
        }

        if (type === "PLAYLIST") {
            const results = await this.client.searchPlaylists(query);
            const playlists: Playlist[] = [];
            for (const item of results) {
                playlists.push(await this.formatPlaylist(item));
            }
            return playlists;
        }

        if (type === "VIDEO") {
            const results = await this.client.searchVideos(query);
            const videos: Video[] = [];
            for (const item of results) {
                videos.push(await this.formatVideo(item));
            }
            return videos;
        }
        
        return null
    }

    async getTrack(videoId: string): Promise<Track | null> {
        if (!this.isInitialized) {
            await this.initialize();
        }
        const track = await this.client.getSong(videoId);
        if (!track) return null;
        return this.formatTrack(track);
    }

    async getAlbum(browseId: string): Promise<Album | null> {
        if (!this.isInitialized) {
            await this.initialize();
        }
        const album = await this.client.getAlbum(browseId);
        if (!album) return null;
        return this.formatAlbum(album);
    }

    async getPlaylist(browseId: string): Promise<Playlist | null> {
        if (!this.isInitialized) {
            await this.initialize();
        }
        const playlist = await this.client.getPlaylistVideos(browseId);
        if (!playlist) return null;
        console.log(playlist);
        return this.formatPlaylist(playlist);
    }

    async getVideo(videoId: string): Promise<Video | null> {
        if (!this.isInitialized) {
            await this.initialize();
        }
        const video = await this.client.getVideo(videoId);
        if (!video) return null;
        return this.formatVideo(video);
    }

    async getArtist(browseId: string): Promise<Artist | null> {
        if (!this.isInitialized) {
            await this.initialize();
        }
        const artist = await this.client.getArtist(browseId);
        if (!artist) return null;
        return this.formatArtist(artist);
    }

    async formatTrack(track: Object | any): Promise<Track> {
        return {
            album: track.album?.name || "",
            artist: track.artists?.name || "",
            duration: track.duration || NaN,
            id: track.videoId || "",
            images: track.thumbnails || [],
            platform: "youtube",
            title: track.name || "",
            url: `https://www.youtube.com/watch?v=${track.videoId || ""}`,
        }
    }

    async formatAlbum(album: Object | any): Promise<Album> {
        return {
            id: album.AlbumId || "",
            name: album.name || "",
            total: album.trackCount || 0,
            images: album.thumbnails || [],
            artists: album.artists?.name || "",
            platform: "youtube",
            playlistId: album.playlistId || undefined,
        }
    }

    async formatPlaylist(playlist: Object | any): Promise<Playlist> {
        return {
            id: playlist.playlistId || "",
            name: playlist.name || "",
            tracks: [],
            total: playlist.videoCount || 0,
            images: playlist.thumbnails || [],
            platform: "youtube",
            url: `https://www.youtube.com/playlist?list=${playlist.playlistId || ""}`,
        }
    }

    async formatVideo(video: Object | any): Promise<Video> {
        return {
            id: video.videoId || "",
            name: video.name || "",
            artist: video.author?.name || null,
            duration: video.duration || NaN,
            images: video.thumbnails || [],
            platform: "youtube",
            url: `https://www.youtube.com/watch?v=${video.videoId || ""}`,
        }
    }

    async formatArtist(artist: Object | any): Promise<Artist> {
        return {
            id: artist.artistId || "",
            name: artist.name || "",
            url: `https://music.youtube.com/channel/${artist.artistId || ""}`,
            platform: "youtube",
            images: artist.thumbnails || [],
        }
    }
}

export default YTApi;