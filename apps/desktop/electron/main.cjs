const { app, BrowserWindow, dialog, shell } = require("electron");
const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");

const API_PORT = Number(process.env.FLASH_PROMOTER_API_PORT || 3333);
const API_HOST = process.env.FLASH_PROMOTER_API_HOST || "127.0.0.1";
const isDev = !app.isPackaged;
const isWin = process.platform === "win32";

const MIN_NODE_MAJOR = 24;
let apiProcess = null;
let mainWindow = null;
let apiStderr = "";

function tryNodeVersion(nodePath) {
  try {
    const ver = execSync(`"${nodePath}" --version`, { encoding: "utf8", timeout: 10000 }).trim();
    const major = parseInt(ver.replace(/^v/, "").split(".")[0], 10);
    return { path: nodePath, version: ver, major };
  } catch {
    return null;
  }
}

function findNode() {
  const candidates = [];

  // 1. where/which
  try {
    const cmd = isWin ? "where node" : "which node";
    const output = execSync(cmd, { encoding: "utf8", timeout: 10000 });
    output.trim().split(/\r?\n/).map(s => s.trim()).filter(Boolean).forEach(p => candidates.push(p));
  } catch { /* ignore */ }

  // 2. Hardcoded common install paths
  if (isWin) {
    const drives = ["C:", "D:"];
    const suffixes = [
      "Program Files\\nodejs\\node.exe",
      "Program Files (x86)\\nodejs\\node.exe",
    ];
    for (const drive of drives) {
      for (const suffix of suffixes) {
        candidates.push(path.join(drive, suffix));
      }
    }

    // nvm-windows
    const nvmHome = process.env.NVM_HOME || process.env.NVM_SYMLINK;
    if (nvmHome) {
      candidates.push(path.join(nvmHome, "node.exe"));
    }

    // fnm
    const fnmDir = process.env.FNM_DIR;
    if (fnmDir) {
      try {
        const files = fs.readdirSync(fnmDir, { withFileTypes: true });
        for (const f of files) {
          if (f.isDirectory() && /^v?\d+\.\d+\.\d+$/.test(f.name)) {
            candidates.push(path.join(fnmDir, f.name, "installation", "node.exe"));
          }
        }
      } catch { /* ignore */ }
    }

    // VOLTA
    const voltaHome = process.env.VOLTA_HOME;
    if (voltaHome) {
      candidates.push(path.join(voltaHome, "node.exe"));
    }
  }

  // 3. bare "node" (from PATH)
  candidates.push(isWin ? "node.exe" : "node");

  console.log("[electron] Searching for Node.js >= %d, checking candidates:", MIN_NODE_MAJOR);
  let firstVersion = null;
  for (const p of candidates) {
    const info = tryNodeVersion(p);
    if (!info) continue;
    if (!firstVersion) firstVersion = info;
    console.log("[electron]   %s -> %s (major=%d)", info.path, info.version, info.major);
    if (info.major >= MIN_NODE_MAJOR) {
      console.log("[electron] Selected: %s (%s)", info.path, info.version);
      return info.path;
    }
  }

  // No suitable version found
  const detail = firstVersion
    ? `检测到 Node.js ${firstVersion.version}（路径: ${firstVersion.path}），但本项目需要 Node.js >= ${MIN_NODE_MAJOR}。`
    : `未在系统中找到 Node.js。请安装 Node.js ${MIN_NODE_MAJOR} 或更新版本。`;
  dialog.showErrorBox("Node.js 版本不足", `${detail}\n\n下载地址: https://nodejs.org`);
  app.quit();
  return null;
}

function startApiServer() {
  if (isDev) {
    console.log("[electron] Dev mode — API server must be started separately (npm run dev:api)");
    return true;
  }

  const nodePath = findNode();
  if (!nodePath) return false;

  const apiBundlePath = path.join(__dirname, "api-bundle.js");
  if (!fs.existsSync(apiBundlePath)) {
    dialog.showErrorBox("启动失败", `找不到 API 服务文件:\n${apiBundlePath}`);
    app.quit();
    return false;
  }

  apiStderr = "";

  // Use shell:true so paths with spaces (e.g. Program Files) work
  const cmd = `"${nodePath}" "${apiBundlePath}"`;
  console.log("[electron] Spawning API: %s", cmd);

  apiProcess = spawn(cmd, [], {
    env: {
      ...process.env,
      FLASH_PROMOTER_API_PORT: String(API_PORT),
      FLASH_PROMOTER_API_HOST: API_HOST,
      FLASH_PROMOTER_DATA_DIR: path.join(app.getPath("userData"), "data"),
    },
    stdio: ["pipe", "pipe", "pipe"],
    shell: true,
    windowsHide: true,
  });

  apiProcess.stdout.on("data", (data) => {
    const msg = data.toString();
    process.stdout.write(`[api] ${msg}`);
  });

  apiProcess.stderr.on("data", (data) => {
    const msg = data.toString();
    process.stderr.write(`[api:err] ${msg}`);
    apiStderr += msg;
  });

  apiProcess.on("error", (err) => {
    console.error("[electron] Failed to spawn API process:", err.message);
    apiStderr += `SPAWN ERROR: ${err.message}\n`;
  });

  apiProcess.on("exit", (code, signal) => {
    console.log(`[electron] API server exited code=${code} signal=${signal}`);
    if (code !== 0 && code !== null) {
      apiStderr += `EXIT CODE: ${code}\n`;
    }
    apiProcess = null;
  });

  return true;
}

function waitForApi(maxRetries = 60) {
  return new Promise((resolve, reject) => {
    if (isDev) return resolve();

    let retries = 0;
    const check = () => {
      retries++;
      const req = http.get(`http://${API_HOST}:${API_PORT}/api/health`, (res) => {
        res.resume();
        if (res.statusCode === 200) {
          console.log("[electron] API server is ready");
          resolve();
        } else if (retries < maxRetries) {
          setTimeout(check, 500);
        } else {
          reject(new Error(`API 返回状态码 ${res.statusCode}，启动超时`));
        }
      });
      req.on("error", (err) => {
        if (retries < maxRetries) {
          setTimeout(check, 500);
        } else {
          reject(new Error(`API 服务启动超时 (${err.code || err.message})`));
        }
      });
      req.setTimeout(3000, () => {
        req.destroy();
        if (retries < maxRetries) {
          setTimeout(check, 500);
        } else {
          reject(new Error("API 健康检查超时"));
        }
      });
      req.end();
    };
    check();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: "Flash Promoter",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (isDev) {
    const devUrl = process.env.FLASH_PROMOTER_DESKTOP_URL || "http://localhost:5173";
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    const indexPath = path.join(__dirname, "..", "dist", "index.html");
    mainWindow.loadFile(indexPath);
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(async () => {
  const ok = startApiServer();
  if (!ok) return;

  try {
    await waitForApi();
  } catch (err) {
    console.error("[electron] Failed to start API server:", err.message);
    const stderrLines = apiStderr.trim().split(/\r?\n/).slice(-6).join("\n");
    const details = stderrLines ? `\n\nAPI 服务输出:\n${stderrLines}` : "";
    dialog.showErrorBox(
      "启动失败",
      `${err.message}${details}\n\n请确认已安装 Node.js >= ${MIN_NODE_MAJOR}。\n下载地址: https://nodejs.org`
    );
    if (apiProcess) { apiProcess.kill("SIGTERM"); apiProcess = null; }
    app.quit();
    return;
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (apiProcess) { apiProcess.kill("SIGTERM"); apiProcess = null; }
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (apiProcess) { apiProcess.kill("SIGTERM"); apiProcess = null; }
});

app.on("quit", () => {
  if (apiProcess) { apiProcess.kill("SIGTERM"); apiProcess = null; }
});
