export type SpotifyAPIConfig = {
  clientId: string;
  clientSecret: string;
  timeout?: number;
}

export type OembedResponse = {
  html: string;
  iframe_url: string;
  width: number;
  height: number;
  version: string;
  provider_name: string;
  provider_url: string;
  type: string;
  title: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
}


