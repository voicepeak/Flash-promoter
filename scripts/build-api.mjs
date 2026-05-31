import * as esbuild from "esbuild";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = resolve(root, "apps", "desktop", "electron");

if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

await esbuild.build({
  entryPoints: [resolve(root, "apps", "local-api", "src", "server.ts")],
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  outfile: resolve(outDir, "api-bundle.js"),
  external: ["node:*"],
  sourcemap: false,
  minify: false,
  logLevel: "info",
});

console.log("API server bundled to apps/desktop/electron/api-bundle.js");
