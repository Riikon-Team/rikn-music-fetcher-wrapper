# 🎵 rikn-music-fetcher

![Version](https://img.shields.io/github/package-json/v/Riikon-Team/rikn-music-fetcher-wrapper?style=for-the-badge)
![License](https://img.shields.io/github/license/Riikon-Team/rikn-music-fetcher-wrapper?style=for-the-badge)
![Top language](https://img.shields.io/github/languages/top/Riikon-Team/rikn-music-fetcher-wrapper?style=for-the-badge)
![npm](https://img.shields.io/npm/v/rikn-music-fetcher?style=for-the-badge)

[🇻🇳 Tiếng Việt](./README.VI.md)

## 📖 Introduction

**rikn-music-fetcher** is a TypeScript wrapper library that unifies multiple popular music sources (YouTube Music, Spotify) with capabilities for searching, streaming, downloading, and fetching lyrics (synced lyrics). Specially designed for Discord Music Bots with smart fallback features and flexible URL parsing.

### ✨ Key Features

- 🎵 **Multi-platform**: YouTube Music, Spotify (SoundCloud in development)
- 🎤 **Synced Lyrics Support**: Plain & synced lyrics from LRCLIB
- 📡 **Direct Streaming**: Direct audio streaming via yt-dlp
- 🔍 **Smart Fallback**: Auto-fallback from Spotify to YouTube when streaming
- 🔗 **Intelligent URL Parsing**: Auto-detect platform from URL
- 📦 **TypeScript**: Full type safety with TypeScript
- ⚡ **Auto-update**: Auto-update yt-dlp binary

## 📦 Installation

```bash
npm install rikn-music-fetcher
```

## 🚀 Quick Start

### Initialize Client

```typescript
import RiknClient from 'rikn-music-fetcher';

const client = new RiknClient({
  spotify: {
    clientId: 'YOUR_SPOTIFY_CLIENT_ID',
    clientSecret: 'YOUR_SPOTIFY_CLIENT_SECRET'
  },
  ytmusic: {
    cookiesPath: './cookies-ytm.txt', // Optional: cookies for better stability, from music.youtube.com (Netscape format)
    GL: 'US',
    HL: 'en'
  },
  ytdlp: {
    autoUpdate: true, // Auto-update yt-dlp
    updateIntervalDays: 7,
  }
});
```

### Search Songs

```typescript
// Search on YouTube Music (default)
const tracks = await client.searchSong('Imagine Dragons Believer');

// Search on Spotify
const spotifyTracks = await client.searchSong('Shape of You', 'spotify');

console.log(tracks[0].title, tracks[0].artist);
```

### Search and Stream Instantly

```typescript
// Find first song and get stream URL
const song = await client.searchFirstAndStream('Shape of You');

console.log('Stream URL:', song.streamUrl);
console.log('Track info:', song.title, song.artist);
```

### Get Info from URL

```typescript
// Auto-detect platform
const track = await client.getSongByUrl(
  'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp',
  true // withStreamUrl = true to get stream URL
);

// Or from YouTube
const ytTrack = await client.getSongByUrl(
  'https://www.youtube.com/watch?v=kJQP7kiw5Fk'
);
```

### Get Playlist

```typescript
// Spotify playlist
const playlist = await client.getSongsByPlaylist(
  'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'
);

// YouTube Music playlist
const ytPlaylist = await client.getSongsByPlaylist(
  'https://music.youtube.com/playlist?list=RDCLAK5uy_...'
);

console.log(`Playlist has ${playlist.length} songs`);
```

### Stream Audio

```typescript
import { createWriteStream } from 'fs';

// Stream from URL (auto-fallback if Spotify)
const stream = await client.streamSongByUrl(
  'https://www.youtube.com/watch?v=kJQP7kiw5Fk'
);

// Pipe to file or Discord voice connection
stream.pipe(createWriteStream('output.m4a'));

// Or use with Discord.js
const connection = joinVoiceChannel({...});
const player = createAudioPlayer();
player.play(createAudioResource(stream));
```

### Get Lyrics

```typescript
// Get exact lyrics
const lyrics = await client.getLyrics(
  'Shape of You',
  'Ed Sheeran',
  'Divide', // optional
  233 // duration in seconds (optional)
);

console.log('Plain lyrics:', lyrics.plainLyrics);
console.log('Synced lyrics:', lyrics.syncedLyrics);

// Search lyrics
const searchResults = await client.searchLyrics('Believer', 'Imagine Dragons');
```

## 📂 Project Structure

```
rikn-music-fetcher-wrapper/
├── src/
│   ├── RiknClient.ts           # Main client class
│   ├── index.ts                # Export entry point
│   ├── providers/
│   │   ├── spotify.ts          # Spotify API wrapper
│   │   ├── youtube.ts          # YouTube Music API wrapper
│   │   ├── yt-dlp.ts           # yt-dlp wrapper
│   │   └── lyrics.ts           # LRCLIB API wrapper
│   ├── types/
│   │   ├── music.type.ts       # Common music types
│   │   ├── spotify.type.ts
│   │   ├── yt.type.ts
│   │   └── lyrics.type.ts
│   ├── constants/
│   │   ├── spotify.constants.ts
│   │   ├── yt.contants.ts
│   │   └── lyrics.contants.ts
│   └── core/
│       └── utils.ts            # Utility functions
├── tests/
│   └── config.example.ts       # Config template
├── dist/                       # Compiled output
├── bin/                        # yt-dlp binaries
├── package.json
├── tsconfig.json
├── .npmignore
└── README.md
```

## 🔧 API Reference

### RiknClient

#### Constructor

```typescript
new RiknClient(config?: RiknClientConfig)
```

**RiknClientConfig:**
```typescript
{
  spotify?: {
    clientId: string;
    clientSecret: string;
    timeout?: number;
  };
  ytmusic?: {
    cookiesPath?: string; // Path to cookies file from music.youtube.com (Netscape format)
    GL?: string; // Country code (e.g., 'VN', 'US')
    HL?: string; // Language code (e.g., 'vi', 'en')
  };
  ytdlp?: {
    binDir?: string;
    cookiesPath?: string; // Path to cookies file from youtube.com (Netscape format)
    autoUpdate?: boolean;
    updateIntervalDays?: number;
  };
}
```

#### Methods

- `searchSong(query: string, platform?: Platform): Promise<Track[]>`
- `searchFirstAndStream(query: string): Promise<SongWithStream | null>`
- `getSongByUrl(url: string, withStreamUrl?: boolean): Promise<SongWithStream | null>`
- `getSongsByPlaylist(url: string): Promise<Track[]>`
- `streamSongByUrl(url: string): Promise<NodeJS.ReadableStream>`
- `getLyrics(trackName: string, artistName: string, albumName?: string, duration?: number): Promise<Lyrics | null>`
- `searchLyrics(trackName: string, artistName: string, albumName?: string): Promise<Lyrics[] | null>`

## 🛠️ Build & Development

```bash
# Clone repository
git clone https://github.com/Riikon-Team/rikn-music-fetcher-wrapper.git
cd rikn-music-fetcher-wrapper

# Install dependencies
npm install

# Build
npm run build

# Development
npm run dev

# Test
npm test
```

## 📝 Important Notes

⚠️ **Beta Version**: This library is currently in beta stage. Some features may not be fully complete or thoroughly tested.

### Cookies (YouTube Music)

To improve stability when using YouTube Music API, you should provide a cookies file:

1. Install extension [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
2. Visit [music.youtube.com](https://music.youtube.com)
3. Export cookies in Netscape format
4. Save to file and pass path to config

### Spotify Credentials

Get credentials at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard):
1. Create new app
2. Get Client ID and Client Secret
3. No redirect URI needed (uses Client Credentials Flow)

## 🌟 Credits & Sources

This library is built upon these amazing open-source projects:

- **[ytmusic-api](https://github.com/zS1L3NT/ts-npm-ytmusic-api)** - YouTube Music API wrapper by [@zS1L3NT](https://github.com/zS1L3NT)
- **[yt-dlp](https://github.com/yt-dlp/yt-dlp)** - YouTube downloader & stream extractor
- **[Spotify Web API](https://developer.spotify.com/documentation/web-api)** - Official Spotify API
- **[LRCLIB](https://github.com/tranxuanthang/lrclib)** - Free lyrics database by [@tranxuanthang](https://github.com/tranxuanthang)

Special thanks to all maintainers and contributors of these projects! 🙏

## 🤝 Contributing

We welcome all contributions from the community:

1. Fork the repo
2. Create new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Create Pull Request

### Bug Reports & Feature Requests

Please create an [issue](https://github.com/Riikon-Team/rikn-music-fetcher-wrapper/issues) with:
- Detailed problem description
- Example code to reproduce
- Environment details (OS, Node version, etc.)

## 📋 Roadmap

- [ ] Complete test coverage
- [ ] Add SoundCloud support
- [ ] Cache layer for search results
- [ ] Rate limiting & retry logic
- [ ] Download progress tracking
- [ ] Batch operations
- [ ] CLI tool

## 📄 License

This project is distributed under the **GNU General Public License v3.0**.

See the [LICENSE](LICENSE) file for more details.

---

**Made with ❤️ by [Riikon Team](https://github.com/Riikon-Team)**

🐛 Found a bug? [Report it](https://github.com/Riikon-Team/rikn-music-fetcher-wrapper/issues)  
💡 Have an idea? [Share it](https://github.com/Riikon-Team/rikn-music-fetcher-wrapper/discussions)  
⭐ Like it? [Star it](https://github.com/Riikon-Team/rikn-music-fetcher-wrapper)

### `searchFirstAndStream(query)`
Search and get direct stream URL for first result.

### `getSongByUrl(url, withStreamUrl?)`
Get track info from URL (auto-detect platform).

### `getSongsByPlaylist(url)`
Get all tracks from playlist URL.

### `streamSongByUrl(url)`
Get readable stream for audio (YouTube only).

### `getLyrics(trackName, artistName, ...)`
Fetch lyrics from LRCLIB.

## License
GPL-3.0
