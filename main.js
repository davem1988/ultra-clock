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

  // IMPORTANT: do not quit app when window closes
  mainWindow.on("close", (e) => {
    e.preventDefault();
    mainWindow.hide();
  });
}

/* ---------------- TRAY ---------------- */

function createTray() {
  tray = new Tray(path.join(__dirname, "build/icon.png"));

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
      click: () => app.quit()
    }
  ]);

  tray.setToolTip("UltraClock");
  tray.setContextMenu(trayMenu);

  tray.on("click", () => {
    if (!mainWindow) return;
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });

  // DEBUG / FIRST-RUN CONFIRMATION
  tray.displayBalloon({
    title: "UltraClock",
    content: "UltraClock is running in the system tray"
  });
}

/* ---------------- APP READY ---------------- */

app.whenReady().then(() => {
  createMainWindow();   // 1️⃣ window first
  createTray();         // 2️⃣ tray second

  // Optional: start hidden (tray-only)
  // mainWindow.hide();

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
  updateCheckInterval = setInterval(checkForUpdates, 30 * 60 * 1000);
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

// DO NOT quit when all windows are closed (tray app)
app.on("window-all-closed", (e) => {
  e.preventDefault();
});
