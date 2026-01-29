const { app, BrowserWindow, Tray, Menu, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");
const fs = require("fs");
const path = require("path");

let mainWindow = null;
let tray = null;
let updateAvailable = false;
let updatePromptShown = false;
let updateCheckInterval = null;
let choice = null;

/* ---------------- AUTO START ---------------- */

app.setLoginItemSettings({
  openAtLogin: true,
  openAsHidden: false
});

/* ---------------- UPDATER ---------------- */

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

function checkForUpdates() {
  if (!updateAvailable) {
    autoUpdater.checkForUpdates();
  }
}

/* ---------------- VERSION TRACKING ---------------- */

const versionFile = path.join(app.getPath("userData"), "version.json");

function getLastVersion() {
  try {
    return JSON.parse(fs.readFileSync(versionFile)).version;
  } catch {
    return null;
  }
}

function saveCurrentVersion() {
  fs.writeFileSync(versionFile, JSON.stringify({ version: app.getVersion() }));
}

/* ---------------- WINDOWS ---------------- */

function getAssetPath(...paths) {
  return app.isPackaged
    ? path.join(process.resourcesPath, ...paths)
    : path.join(__dirname, ...paths);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 150,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    icon: path.join(__dirname, "build/icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow.loadFile("index.html");
  mainWindow.setAlwaysOnTop(true, "screen-saver");

  mainWindow.on("close", (e) => {
    e.preventDefault();
    mainWindow.hide();
  });
}

/* ---------------- TRAY ---------------- */

function createTray() {
  const trayIconPath = getAssetPath("assets", "tray.ico");

  if (!fs.existsSync(trayIconPath)) {
    console.error("❌ Tray icon not found:", trayIconPath);
    return;
  }

  tray = new Tray(trayIconPath);

  tray.setToolTip("UltraClock");

  const trayMenu = Menu.buildFromTemplate([
    {
      label: "Show / Hide Clock",
      click: () => {
        if (!mainWindow) return;
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
      }
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.isQuitting = true;
        app.quit()
      }
    }
  ]);

  tray.setContextMenu(trayMenu);

  tray.on("click", () => {
    if (!mainWindow) return;
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });

  tray.displayBalloon({
    title: "UltraClock",
    content: "Tray icon loaded successfully"
  });
}


/* ---------------- APP READY ---------------- */

app.whenReady().then(() => {
  createMainWindow();   
  createTray();         


  const lastVersion = getLastVersion();
  const currentVersion = app.getVersion();

  if (lastVersion && lastVersion !== currentVersion) {
    dialog.showMessageBox(mainWindow, {
      title: "UltraClock updated",
      message: `Updated to version ${currentVersion}`
    });
  }

  saveCurrentVersion();
  checkForUpdates();
  updateCheckInterval = setInterval(checkForUpdates, 1 * 60 * 1000);
});

/* ---------------- UPDATER EVENTS ---------------- */

autoUpdater.on("update-available", () => {
  updateAvailable = true;

  if (updatePromptShown || !mainWindow) return;
  updatePromptShown = true;

  choice = dialog.showMessageBoxSync(mainWindow, {
    type: "question",
    buttons: ["Update now", "Later"],
    defaultId: 0,
    cancelId: 1,
    title: "Update available",
    message: "A new version of UltraClock is available."
  });

  autoUpdater.downloadUpdate();
});

autoUpdater.on("download-progress", (progress) => {
  if (mainWindow) {
    mainWindow.webContents.send("update-progress", {
      percent: Math.round(progress.percent)
    });
  }
});

autoUpdater.on("update-downloaded", () => {
  if (choice === 0) {
    autoUpdater.quitAndInstall();
  }
});

/* ---------------- IMPORTANT ---------------- */

app.on("window-all-closed", () => {
  app.quit();
});
