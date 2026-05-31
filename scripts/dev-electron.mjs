import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const API_PORT = 3333;
const DESKTOP_PORT = 5173;

function waitFor(url, label) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timeout = 60000;
    const check = () => {
      http.get(url, (res) => {
        res.resume();
        console.log(`[dev-electron] ${label} ready (${res.statusCode})`);
        resolve();
      }).on("error", () => {
        if (Date.now() - start > timeout) {
          reject(new Error(`${label} did not start within ${timeout}ms`));
        } else {
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

console.log("[dev-electron] Starting API server...");
const apiProcess = spawn("node", ["--import", "tsx", "apps/local-api/src/server.ts"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, FLASH_PROMOTER_API_PORT: String(API_PORT) },
  shell: true,
});

console.log("[dev-electron] Starting Vite dev server...");
const desktopProcess = spawn("npx", ["vite", "--host", "127.0.0.1", "--port", String(DESKTOP_PORT)], {
  cwd: resolve(root, "apps", "desktop"),
  stdio: "inherit",
  env: { ...process.env, FORCE_COLOR: "1" },
  shell: true,
});

try {
  await Promise.all([
    waitFor(`http://127.0.0.1:${API_PORT}/api/health`, "API"),
    waitFor(`http://127.0.0.1:${DESKTOP_PORT}`, "Vite"),
  ]);
} catch (err) {
  console.error(err.message);
  apiProcess.kill();
  desktopProcess.kill();
  process.exit(1);
}

console.log("[dev-electron] Launching Electron...");
const electronProcess = spawn("npx", ["electron", "."], {
  cwd: resolve(root, "apps", "desktop"),
  stdio: "inherit",
  shell: true,
});

electronProcess.on("exit", (code) => {
  console.log(`[dev-electron] Electron exited with code ${code}`);
  apiProcess.kill();
  desktopProcess.kill();
  process.exit(code ?? 0);
});

process.on("SIGINT", () => {
  apiProcess.kill();
  desktopProcess.kill();
  electronProcess.kill();
  process.exit(0);
});
