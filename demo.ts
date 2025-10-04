import SpotifyAPI from './src/providers/spotify';

const spotify = new SpotifyAPI({
    clientId: 'd2d786e519104698b7b2de049b667f29',
    clientSecret: 'f0a0d044a0184ed8bfd88dddcbe54696',
});

async function demoSpotify() {
  try {
    const track = await spotify.getTrack('3n3Ppam7vgaVa1iaRUc9Lp'); // Example track ID
    console.log('Track:', track);

    const playlist = await spotify.getPlaylist('3NHj0kBGPaFbZmtwMxnewE'); // Example playlist ID
    console.log('Playlist:', playlist);

    const album = await spotify.getAlbum('4aawyAB9vmqN3uQ7FjRGTy'); // Example album ID
    console.log('Album:', album);

    const searchResults = await spotify.search('Imagine Dragons', ['track']);
    console.log('Search Results:', searchResults);
  } catch (error) {
    console.error('Error:', error);
  }
}

async function demoLyrics() {
  const { default: LyricsProvider } = await import('./src/providers/lyrics');
  const lyricsProvider = new LyricsProvider();

  try {
    const lyrics = await lyricsProvider.getLyrics('Shape of You', 'Ed Sheeran');
    console.log('Lyrics:', lyrics);

    const searchResults = await lyricsProvider.search('Shape of You', 'Ed Sheeran');
    console.log('Lyrics Search Results:', searchResults);
  } catch (error) {
    console.error('Error:', error);
  }
}

demoLyrics();

demoSpotify();