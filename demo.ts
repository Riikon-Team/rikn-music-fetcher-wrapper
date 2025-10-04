import R from "./src"

async function demo() {
  const rikn = new R({
    spotify: {
        clientId: "d2d786e519104698b7b2de049b667f29",
        clientSecret: "f0a0d044a0184ed8bfd88dddcbe54696"  
    }
  });
  const r = await rikn.getSongsByPlaylist("https://open.spotify.com/playlist/6pFxemaH9g9J9P8nxoRJBs?si=d1cac64be6ea44b8");
  const u = await rikn.getSongByUrl(r[0].url, true);
  console.log(u);

}

demo();