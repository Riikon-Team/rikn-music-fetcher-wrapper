export type FormattedTrack = {
  title: string;
  artist: string;
  album: string;
  duration: number;
  platform: "spotify";
  url: string;
  thumbnail: string | null;
  id: string;
}

export type FormattedPlaylist = {
  tracks: FormattedTrack[];
  name: string;
  total: number;
}

export type FormattedTrackSearchResults = {
  tracks: FormattedTrack[];
  name: string;
  total: number;
};

