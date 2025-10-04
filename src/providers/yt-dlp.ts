import { YTDLPOption } from "../types/yt.type";
import { getSystemTempDir } from "../core/utils";
import { spawn, exec as execCb } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import { createWriteStream, existsSync } from "fs";
import path from "path";
import https from "https";
import { pipeline } from "stream/promises";

const execAsync = promisify(execCb);

export class YTDLP {
  private options: YTDLPOption;
  private binDir: string;
  private binPath: string;
  private initialized = false;
  private githubApiBase = "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest";
  private updateCheckTimestamp = 0;

  constructor(options: YTDLPOption = {}) {
    this.options = {
      autoUpdate: true,
      updateIntervalDays: 7,
      ...options,
    };
    this.binDir = this.options.binDir || path.join(getSystemTempDir(), "yt-dlp-bin");
    this.binPath = path.join(this.binDir, process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp_linux");
  }

  private platformAssetName(): string {
    if (process.platform === "win32") return "yt-dlp.exe";
    if (process.platform === "darwin") return "yt-dlp_macos";
    // default to linux binary name used in releases
    return "yt-dlp_linux";
  }

  private httpsGetJson(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const opts = {
        headers: {
          "User-Agent": "rikn-music-fetcher-wrapper",
          Accept: "application/vnd.github+json",
        },
      } as any;
      https
        .get(url, opts, (res) => {
          let raw = "";
          res.on("data", (chunk) => (raw += chunk));
          res.on("end", () => {
            try {
              const json = JSON.parse(raw);
              resolve(json);
            } catch (err) {
              reject(err);
            }
          });
        })
        .on("error", reject);
    });
  }

  private async downloadUrlToFile(url: string, dest: string): Promise<void> {
    console.log(`Downloading yt-dlp from ${url} to ${dest}`);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    return new Promise((resolve, reject) => {
      const req = https.get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // follow redirect
          this.downloadUrlToFile(res.headers.location, dest).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: HTTP ${res.statusCode}`));
          return;
        }
        const file = createWriteStream(dest, { mode: 0o755 });
        pipeline(res, file)
          .then(() => resolve())
          .catch((err) => reject(err));
      });
      req.on("error", reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error("Download timeout"));
      });
    });
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    await fs.mkdir(this.binDir, { recursive: true });

    if (!existsSync(this.binPath)) {
      await this.downloadLatestForPlatform();
    } else if (this.options.autoUpdate) {
      await this.checkForUpdates();
    }

    if (process.platform !== "win32") {
      try {
        await fs.chmod(this.binPath, 0o755);
      } catch {
        console.warn("Failed to set executable permission on yt-dlp binary");
      }
    }

    this.initialized = true;
  }

  private async downloadLatestForPlatform(): Promise<void> {
    console.log("Downloading latest yt-dlp binary...");
    const release = await this.httpsGetJson(this.githubApiBase);
    const assetName = this.platformAssetName();
    const asset = (release.assets || []).find((a: any) => a.name === assetName || a.name === `${assetName}`);
    if (!asset || !asset.browser_download_url) {
      throw new Error(`yt-dlp asset for platform not found in release ${release.tag_name || release.name}`);
    }
    await this.downloadUrlToFile(asset.browser_download_url, this.binPath);
  }

  async checkForUpdates(): Promise<void> {
    const now = Date.now();
    if (this.updateCheckTimestamp && now - this.updateCheckTimestamp < (this.options.updateIntervalDays || 7) * 86400000) {
      return; 
    }
    this.updateCheckTimestamp = now;
    try {
      const release = await this.httpsGetJson(this.githubApiBase);
      const latestTag = release.tag_name || release.name;
      let current = "";
      try {
        const { stdout } = await execAsync(`"${this.binPath}" --version`);
        current = stdout.trim();
      } catch {
        current = "";
      }
      if (!current || (latestTag && !current.includes(latestTag))) {
        // download asset for platform
        await this.downloadLatestForPlatform();
        if (process.platform !== "win32") {
          await fs.chmod(this.binPath, 0o755);
        }
      }
    } catch (err) {
      // don't throw: update checks should be best-effort
      // console.warn("yt-dlp update check failed:", err);
    }
  }

  defaultOption(): string[] {
    const args: string[] = [];
    if (this.options.cookiesPath) {
      args.push("--cookies", this.options.cookiesPath);
    }
    if (this.options.userAgent) {
      args.push("--user-agent", this.options.userAgent);
    }
    if (this.options.referer) {
      args.push("--referer", this.options.referer);
    }
    if (this.options.proxy) {
      args.push("--proxy", this.options.proxy);
    }
    return args;
  }

  async getDirectAudioUrl(videoId: string, opts: { additionalArgs?: string[] } = {}): Promise<string> {
    await this.init();

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const args = [
      ...this.defaultOption(),
      ...(opts.additionalArgs || []),
      "--get-url",
      "-f",
      "bestaudio[ext=m4a]/bestaudio/best",
      "--no-warnings",
      "--quiet",
      "--no-playlist",
      "--no-check-certificate",
      url,
    ];
    const cmd = `"${this.binPath}" ${args.map((a) => (a.includes(" ") ? `"${a}"` : a)).join(" ")}`;
    const { stdout, stderr } = await execAsync(cmd, { timeout: 120000 });
    if (stderr && stderr.trim().length > 0) {
      // non-fatal, but surface if no stdout
    }
    const direct = stdout.trim();
    if (!direct) throw new Error("Failed to extract direct URL");
    return direct.split("\n")[0].trim();
  }

  async streamAudio(videoId: string, opts: { additionalArgs?: string[] } = {}): Promise<NodeJS.ReadableStream> {
    await this.init();
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const args = [
      ...this.defaultOption(),
      ...(opts.additionalArgs || []),
      "-o",
      "-",
      "-f",
      "bestaudio[ext=m4a]/bestaudio/best",
      "-x",
      "--no-part",
      "--quiet",
      "--no-warnings",
      url,
    ];
    const proc = spawn(this.binPath, args, { stdio: ["ignore", "pipe", "pipe"] });

    proc.on("error", (err) => {
    });
    proc.on("close", (code, sig) => {
      if (code && code !== 0) {
        const err = new Error(`yt-dlp exited with code ${code} ${sig || ""}`);
        (proc.stdout as any).emit?.("error", err);
      }
    });

    return proc.stdout;
  }

  async downloadAudio(
    videoId: string,
    outputPath?: string,
    opts: { format?: string; quality?: string; additionalArgs?: string[] } = {}
  ): Promise<string> {
    await this.init();
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const output = outputPath || `${videoId}.%(ext)s`;
    const args = [
      ...this.defaultOption(),
      ...(opts.additionalArgs || []),
      "-x",
      "--audio-format",
      opts.format || "m4a",
      "--audio-quality",
      opts.quality || "128K",
      "-o",
      output,
      "--no-warnings",
      "--quiet",
      url,
    ];
    const cmd = `"${this.binPath}" ${args.map((a) => (a.includes(" ") ? `"${a}"` : a)).join(" ")}`;
    const { stdout, stderr } = await execAsync(cmd, { timeout: 0 });
    if (stderr && stderr.trim().length > 0) {
      // optionally surface logs
    }
    return stdout.trim();
  }

  isAvailable(): boolean {
    return existsSync(this.binPath);
  }
}

export default YTDLP;