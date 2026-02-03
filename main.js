const { app, BrowserWindow, Tray, Menu, dialog, ipcMain} = require("electron");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");
const fs = require("fs");
const path = require("path");
const settingsFile = path.join(app.getPath("userData"), "settings.json");

let mainWindow = null;
let tray = null;
let updateAvailable = false;
let updatePromptShown = false;
let updateCheckInterval = null;
let choice = null;
let updateCheckInProgress = false;

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

async function checkForUpdates() {
  if (updateAvailable || updateCheckInProgress) return;

  updateCheckInProgress = true;
  try {
    await autoUpdater.checkForUpdates();
  } finally {
    updateCheckInProgress = false;
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

async function loadSettings() {
  try {
    const data = await fs.promises.readFile(settingsFile, "utf-8");
    return JSON.parse(data);
  } catch {
    return { use24Hour: true };
  }
}

async function saveSettings(settings) {
  await fs.promises.writeFile(
    settingsFile,
    JSON.stringify(settings),
    "utf-8"
  );
}

let settings = loadSettings();

ipcMain.handle("get-time-format", () => {
  return settings.use24Hour;
});

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
    {
      label: "Use 24-hour format",
      type: "checkbox",
      checked: settings.use24Hour,
      click: (item) => {
        settings.use24Hour = item.checked;
        saveSettings(settings);

        if (mainWindow) {
          mainWindow.webContents.send(
            "time-format-changed",
            settings.use24Hour
          );
        }
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

  setTimeout(() => {
  tray.displayBalloon({
    title: "UltraClock",
    content: "UltraClock App is Ready!"
  });
}, 10000);
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
