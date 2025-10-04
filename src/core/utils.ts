export const getSystemTempDir = (): string => {
  const platform = process.platform;
  if (platform === "win32") {
    return process.env.TEMP || "C:\\Windows\\Temp";
  } else if (platform === "darwin") {
    return "/tmp";
  } else {
    return process.env.TMPDIR || "/tmp";
  }
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  } else {
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
};

export const parseDuration = (durationStr: string): number => {
  const parts = durationStr.split(":").map((part) => parseInt(part, 10));
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  } else {
    return 0;
  }
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const extractYoutubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
    /music\.youtube\.com\/watch\?v=([^&\?\/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
};

export const extractYoutubePlaylistId = (url: string): string | null => {
  const match = url.match(/[?&]list=([^&]+)/);
  return match ? match[1] : null;
};
