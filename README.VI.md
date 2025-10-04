# 🎵 rikn-music-fetcher

![Version](https://img.shields.io/github/package-json/v/Riikon-Team/rikn-music-fetcher-wrapper?style=for-the-badge)
![License](https://img.shields.io/github/license/Riikon-Team/rikn-music-fetcher-wrapper?style=for-the-badge)
![Top language](https://img.shields.io/github/languages/top/Riikon-Team/rikn-music-fetcher-wrapper?style=for-the-badge)
![npm](https://img.shields.io/npm/v/rikn-music-fetcher?style=for-the-badge)

[🇬🇧 English](./README.md)

## 📖 Giới thiệu

**rikn-music-fetcher** là thư viện TypeScript wrapper thống nhất nhiều nguồn nhạc phổ biến (YouTube Music, Spotify) với khả năng tìm kiếm, streaming, download và lấy lời bài hát (synced lyrics). Được thiết kế đặc biệt cho Discord Music Bots với tính năng fallback thông minh và parsing URL linh hoạt.

### ✨ Tính năng chính

- 🎵 **Đa nền tảng**: YouTube Music, Spotify (SoundCloud đang phát triển)
- 🎤 **Lời bài hát đồng bộ**: Plain & synced lyrics từ LRCLIB
- 📡 **Streaming trực tiếp**: Streaming audio trực tiếp qua yt-dlp
- 🔍 **Fallback thông minh**: Tự động chuyển từ Spotify sang YouTube khi cần stream
- 🔗 **Phân tích URL thông minh**: Tự nhận diện nền tảng từ URL
- 📦 **TypeScript**: Hỗ trợ đầy đủ type safety
- ⚡ **Tự động cập nhật**: Auto-update yt-dlp binary

## 📦 Cài đặt

```bash
npm install rikn-music-fetcher
```

## 🚀 Bắt đầu nhanh

### Khởi tạo Client

```typescript
import RiknClient from 'rikn-music-fetcher';

const client = new RiknClient({
  spotify: {
    clientId: 'YOUR_SPOTIFY_CLIENT_ID',
    clientSecret: 'YOUR_SPOTIFY_CLIENT_SECRET'
  },
  ytmusic: {
    cookiesPath: './cookies-ytm.txt', // Tùy chọn: cookies để tăng độ ổn định, từ music.youtube.com (Netscape format)
    GL: 'VN',
    HL: 'vi'
  },
  ytdlp: {
    autoUpdate: true, // Tự động update yt-dlp
    updateIntervalDays: 7
  }
});
```

### Tìm kiếm bài hát

```typescript
// Tìm trên YouTube Music (mặc định)
const tracks = await client.searchSong('Imagine Dragons Believer');

// Tìm trên Spotify
const spotifyTracks = await client.searchSong('Shape of You', 'spotify');

console.log(tracks[0].title, tracks[0].artist);
```

### Tìm và stream ngay

```typescript
// Tìm bài đầu tiên và lấy stream URL
const song = await client.searchFirstAndStream('Hãy Trao Cho Anh');

console.log('Stream URL:', song.streamUrl);
console.log('Thông tin bài hát:', song.title, song.artist);
```

### Lấy thông tin từ URL

```typescript
// Tự động nhận diện nền tảng
const track = await client.getSongByUrl(
  'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp',
  true // withStreamUrl = true để lấy cả stream URL
);

// Hoặc từ YouTube
const ytTrack = await client.getSongByUrl(
  'https://www.youtube.com/watch?v=kJQP7kiw5Fk'
);
```

### Lấy danh sách phát (Playlist)

```typescript
// Spotify playlist
const playlist = await client.getSongsByPlaylist(
  'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'
);

// YouTube Music playlist
const ytPlaylist = await client.getSongsByPlaylist(
  'https://music.youtube.com/playlist?list=RDCLAK5uy_...'
);

console.log(`Playlist có ${playlist.length} bài hát`);
```

### Stream âm thanh

```typescript
import { createWriteStream } from 'fs';

// Stream từ URL (tự động fallback nếu Spotify)
const stream = await client.streamSongByUrl(
  'https://www.youtube.com/watch?v=kJQP7kiw5Fk'
);

// Pipe to file hoặc Discord voice connection
stream.pipe(createWriteStream('output.m4a'));

// Hoặc dùng với Discord.js
const connection = joinVoiceChannel({...});
const player = createAudioPlayer();
player.play(createAudioResource(stream));
```

### Lấy lời bài hát

```typescript
// Lấy lyrics chính xác
const lyrics = await client.getLyrics(
  'Shape of You',
  'Ed Sheeran',
  'Divide', // tùy chọn
  233 // duration in seconds (tùy chọn)
);

console.log('Plain lyrics:', lyrics.plainLyrics);
console.log('Synced lyrics:', lyrics.syncedLyrics);

// Tìm kiếm lyrics
const searchResults = await client.searchLyrics('Believer', 'Imagine Dragons');
```

## 📂 Cấu trúc dự án

```
rikn-music-fetcher-wrapper/
├── src/
│   ├── RiknClient.ts           # Class client chính
│   ├── index.ts                # Entry point xuất
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

## 🔧 Tài liệu API

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
    cookiesPath?: string; // Đường dẫn tới file cookies từ music.youtube.com (Netscape format)
    GL?: string; // Mã quốc gia (ví dụ: 'VN', 'US')
    HL?: string; // Mã ngôn ngữ (ví dụ: 'vi', 'en')
  };
  ytdlp?: {
    binDir?: string;
    cookiesPath?: string; // Đường dẫn tới file cookies từ youtube.com (Netscape format)
    autoUpdate?: boolean;
    updateIntervalDays?: number;
  };
}
```

#### Phương thức

- `searchSong(query: string, platform?: Platform): Promise<Track[]>`
- `searchFirstAndStream(query: string): Promise<SongWithStream | null>`
- `getSongByUrl(url: string, withStreamUrl?: boolean): Promise<SongWithStream | null>`
- `getSongsByPlaylist(url: string): Promise<Track[]>`
- `streamSongByUrl(url: string): Promise<NodeJS.ReadableStream>`
- `getLyrics(trackName: string, artistName: string, albumName?: string, duration?: number): Promise<Lyrics | null>`
- `searchLyrics(trackName: string, artistName: string, albumName?: string): Promise<Lyrics[] | null>`

## 🛠️ Build & Phát triển

```bash
# Clone repository
git clone https://github.com/Riikon-Team/rikn-music-fetcher-wrapper.git
cd rikn-music-fetcher-wrapper

# Cài đặt dependencies
npm install

# Build
npm run build

# Development
npm run dev

# Test
npm test
```

## 📝 Lưu ý quan trọng

⚠️ **Phiên bản Beta**: Thư viện hiện đang trong giai đoạn beta. Một số tính năng có thể chưa hoàn thiện hoặc chưa được kiểm thử đầy đủ.

### Cookies (YouTube Music)

Để tăng độ ổn định khi sử dụng YouTube Music API, bạn nên cung cấp file cookies:

1. Cài extension [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
2. Truy cập [music.youtube.com](https://music.youtube.com)
3. Export cookies dưới dạng Netscape format
4. Lưu vào file và truyền đường dẫn vào config

### Thông tin xác thực Spotify

Lấy credentials tại [Spotify Developer Dashboard](https://developer.spotify.com/dashboard):
1. Tạo app mới
2. Lấy Client ID và Client Secret
3. Không cần redirect URI (dùng Client Credentials Flow)

## 🌟 Nguồn & Credit

Thư viện này được xây dựng dựa trên các dự án open-source tuyệt vời:

- **[ytmusic-api](https://github.com/zS1L3NT/ts-npm-ytmusic-api)** - YouTube Music API wrapper bởi [@zS1L3NT](https://github.com/zS1L3NT)
- **[yt-dlp](https://github.com/yt-dlp/yt-dlp)** - YouTube downloader & stream extractor
- **[Spotify Web API](https://developer.spotify.com/documentation/web-api)** - Spotify API chính thức
- **[LRCLIB](https://github.com/tranxuanthang/lrclib)** - Cơ sở dữ liệu lời bài hát miễn phí bởi [@tranxuanthang](https://github.com/tranxuanthang)

Cảm ơn tất cả các maintainer và contributor của những dự án này! 🙏

## 🤝 Đóng góp

Chúng tôi hoan nghênh mọi đóng góp từ cộng đồng:

1. Fork repo
2. Tạo branch mới (`git checkout -b feature/TinhNangTuyetVoi`)
3. Commit thay đổi (`git commit -m 'Thêm tính năng tuyệt vời'`)
4. Push lên branch (`git push origin feature/TinhNangTuyetVoi`)
5. Tạo Pull Request

### Báo cáo lỗi & Đề xuất tính năng

Vui lòng tạo [issue](https://github.com/Riikon-Team/rikn-music-fetcher-wrapper/issues) với:
- Mô tả chi tiết vấn đề
- Code ví dụ để tái hiện lỗi
- Thông tin môi trường (OS, phiên bản Node, v.v.)

## 📋 Kế hoạch phát triển

- [ ] Hoàn thiện test coverage
- [ ] Thêm hỗ trợ SoundCloud
- [ ] Cache layer cho kết quả tìm kiếm
- [ ] Rate limiting & retry logic
- [ ] Theo dõi tiến trình download
- [ ] Batch operations
- [ ] CLI tool

## 📄 Giấy phép

Dự án này được phân phối dưới giấy phép **GNU General Public License v3.0**.

Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

**Được phát triển với ❤️ bởi [Riikon Team](https://github.com/Riikon-Team)**

🐛 Tìm thấy lỗi? [Báo cáo tại đây](https://github.com/Riikon-Team/rikn-music-fetcher-wrapper/issues)  
💡 Có ý tưởng? [Chia sẻ với chúng tôi](https://github.com/Riikon-Team/rikn-music-fetcher-wrapper/discussions)  
⭐ Thích thư viện? [Star cho chúng tôi](https://github.com/Riikon-Team/rikn-music-fetcher-wrapper)
