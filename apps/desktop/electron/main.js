const { app, BrowserWindow, dialog, shell } = require("electron");
const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");

const API_PORT = Number(process.env.FLASH_PROMOTER_API_PORT || 3333);
const API_HOST = process.env.FLASH_PROMOTER_API_HOST || "127.0.0.1";
const isDev = !app.isPackaged;
const isWin = process.platform === "win32";

let apiProcess = null;
let mainWindow = null;

function findSystemNode() {
  try {
    const nodeExe = isWin ? "node.exe" : "node";
    const result = execSync(`"${nodeExe}" --version`, { encoding: "utf8", timeout: 5000 });
    const version = result.trim().replace(/^v/, "");
    const major = parseInt(version.split(".")[0], 10);
    if (major >= 24) return nodeExe;
    return null;
  } catch {
    return null;
  }
}

function findNodePath() {
  try {
    const whichCmd = isWin ? "where" : "which";
    const result = execSync(`${whichCmd} node`, { encoding: "utf8", timeout: 5000 });
    const lines = result.trim().split(/\r?\n/);
    for (const line of lines) {
      const nodePath = line.trim();
      try {
        const ver = execSync(`"${nodePath}" --version`, { encoding: "utf8", timeout: 5000 }).trim();
        const major = parseInt(ver.replace(/^v/, "").split(".")[0], 10);
        if (major >= 24) return nodePath;
      } catch {
        // skip
      }
    }
    return null;
  } catch {
    return null;
  }
}

function startApiServer() {
  if (isDev) {
    console.log("[electron] Dev mode — API server must be started separately (npm run dev:api)");
    return;
  }

  const nodePath = findNodePath() || findSystemNode();

  if (!nodePath) {
    dialog.showErrorBox(
      "Node.js 未找到",
      "Flash Promoter 需要 Node.js >= 24 才能运行。\n\n请从 https://nodejs.org 下载安装 Node.js 24 或更新版本。"
    );
    app.quit();
    return;
  }

  const apiBundlePath = path.join(__dirname, "api-bundle.js");
  if (!fs.existsSync(apiBundlePath)) {
    dialog.showErrorBox("启动失败", `找不到 API 服务文件: ${apiBundlePath}`);
    app.quit();
    return;
  }

  apiProcess = spawn(nodePath, [apiBundlePath], {
    env: {
      ...process.env,
      FLASH_PROMOTER_API_PORT: String(API_PORT),
      FLASH_PROMOTER_API_HOST: API_HOST,
      FLASH_PROMOTER_DATA_DIR: path.join(app.getPath("userData"), "data"),
    },
    stdio: ["pipe", "pipe", "pipe"],
  });

  apiProcess.stdout.on("data", (data) => {
    process.stdout.write(`[api] ${data}`);
  });

  apiProcess.stderr.on("data", (data) => {
    process.stderr.write(`[api:err] ${data}`);
  });

  apiProcess.on("exit", (code) => {
    console.log(`[electron] API server exited with code ${code}`);
    apiProcess = null;
  });
}

function waitForApi(maxRetries = 60) {
  return new Promise((resolve, reject) => {
    if (isDev) return resolve();

    let retries = 0;
    const check = () => {
      retries++;
      const req = http.get(`http://${API_HOST}:${API_PORT}/api/health`, (res) => {
        if (res.statusCode === 200) {
          console.log("[electron] API server is ready");
          resolve();
        } else if (retries < maxRetries) {
          setTimeout(check, 500);
        } else {
          reject(new Error("API server returned non-200 status"));
        }
      });
      req.on("error", () => {
        if (retries < maxRetries) {
          setTimeout(check, 500);
        } else {
          reject(new Error("API server did not start in time"));
        }
      });
      req.setTimeout(2000, () => {
        req.destroy();
        if (retries < maxRetries) {
          setTimeout(check, 500);
        } else {
          reject(new Error("API server health check timed out"));
        }
      });
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
      preload: path.join(__dirname, "preload.js"),
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
  startApiServer();

  try {
    await waitForApi();
  } catch (err) {
    console.error("[electron] Failed to start API server:", err.message);
    dialog.showErrorBox(
      "启动失败",
      `API 服务启动失败: ${err.message}\n\n请确保 Node.js >= 24 已正确安装。`
    );
    app.quit();
    return;
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (apiProcess) {
    apiProcess.kill("SIGTERM");
    apiProcess = null;
  }
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (apiProcess) {
    apiProcess.kill("SIGTERM");
    apiProcess = null;
  }
});

app.on("quit", () => {
  if (apiProcess) {
    apiProcess.kill("SIGTERM");
    apiProcess = null;
  }
});
