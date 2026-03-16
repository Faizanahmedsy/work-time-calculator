const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow;
let serverProcess = null;

function startServer() {
  return new Promise((resolve, reject) => {
    const isDev = process.env.NODE_ENV === "development";

    if (isDev) {
      // In development, Next.js dev server should already be running
      resolve("http://localhost:3000");
      return;
    }

    // In production, start the standalone Next.js server
    const serverPath = path.join(__dirname, "../.next/standalone/server.js");
    serverProcess = spawn("node", [serverPath], {
      env: {
        ...process.env,
        PORT: "3000",
        NODE_ENV: "production",
      },
    });

    serverProcess.stdout.on("data", (data) => {
      console.log(`Server: ${data}`);
      if (data.toString().includes("Listening on")) {
        resolve("http://localhost:3000");
      }
    });

    serverProcess.stderr.on("data", (data) => {
      console.error(`Server Error: ${data}`);
    });

    serverProcess.on("close", (code) => {
      console.log(`Server process exited with code ${code}`);
    });

    // Timeout fallback
    setTimeout(() => resolve("http://localhost:3000"), 5000);
  });
}

async function createWindow() {
  // Start the server first
  const url = await startServer();

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "../public/icon.png"),
    show: false,
    backgroundColor: "#ffffff",
  });

  // Load the app
  mainWindow.loadURL(url);

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Prevent navigation to external URLs
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    return { action: "deny" };
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    // On macOS, re-create a window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Cleanup on quit
app.on("will-quit", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

// IPC handlers for communication between main and renderer processes
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

ipcMain.handle("get-platform", () => {
  return process.platform;
});
