import { build } from "esbuild";
import fs from "fs/promises";
import path from "path";
import { builtinModules } from "module";

const outdir = path.resolve(process.cwd(), "dist");

async function copyBin() {
  const src = path.resolve(process.cwd(), "bin");
  const dest = path.join(outdir, "bin");
  try {
    await fs.rm(dest, { recursive: true, force: true });
    await fs.cp(src, dest, { recursive: true });
    console.log("Copied bin -> dist/bin");
  } catch (err) {
  }
}

(async () => {
  try {
    const external = [
      ...builtinModules,
      "form-data",
      "combined-stream",
    ];

    await build({
      entryPoints: [path.resolve("src/index.ts")],
      bundle: true,
      platform: "node",
      target: ["node20"],
      format: "esm",
      outfile: path.join(outdir, "index.js"),
      sourcemap: true,
      external,
      define: { "process.env.NODE_ENV": '"production"' },
      logLevel: "info",
    });

    await copyBin();

    await fs.copyFile("README.md", path.join(outdir, "README.md")).catch(() => {});
    await fs.copyFile("LICENSE", path.join(outdir, "LICENSE")).catch(() => {});

    console.log("esbuild: bundling done");
  } catch (err) {
    console.error("esbuild: build failed", err);
    process.exit(1);
  }
})();