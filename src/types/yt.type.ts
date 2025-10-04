export type YTDLPOption = {
    binDir?: string; // Path to yt-dlp binary
    cookiesPath?: string; // Path to Netscape formatted file 
    userAgent?: string;
    referer?: string;
    proxy?: string;
    autoUpdate?: boolean; // Whether to auto update yt-dlp binary
    updateIntervalDays?: number; // Days between update checks
    args?: string[]; // Additional command line args
};

export type YTApiOptions = {
    ytmusic?: YTMusicOption;
    ytdlp?: YTDLPOption;
};

export type YTMusicOption = {
    cookiesPath?: string; // Path to Netscape formatted file
    GL?: string; 
    HL?: string; 
};

export enum YTMusicType {
    All = "ALL",
    Track = "TRACK",
    Video = "VIDEO",
    Playlist = "PLAYLIST",
    Album = "ALBUM",
    Artist = "ARTIST",
}
