const { app, BrowserWindow } = require("electron");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");
var choice = null;
const { dialog } = require("electron");
const fs = require("fs");
const path = require("path");

let updateAvailable = false;
let updatePromptShown = false;
let updateCheckInterval = null;

function checkForUpdates() {
  if (updateAvailable) return; // already found one
  autoUpdater.checkForUpdates();
}

const versionFile = path.join(app.getPath("userData"), "version.json");
let whatsNewWindow;
let mainWindow = null;

function showWhatsNewWindow(version) {
  whatsNewWindow = new BrowserWindow({
    width: 500,
    height: 600,
    resizable: false,
    title: "What's New in UltraClock",
    modal: true,
    parent: mainWindow,
    webPreferences: {
      contextIsolation: true
    }
  });

  whatsNewWindow.loadFile("whats-new.html", {
    query: { version }
  });
}

function getLastVersion() {
  try {
    return JSON.parse(fs.readFileSync(versionFile)).version;
  } catch {
    return null;
  }
}
function saveCurrentVersion() {
  fs.writeFileSync(
    versionFile,
    JSON.stringify({ version: app.getVersion() })
  );
}

autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";
const path = require("path");

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 150,
    icon: path.join(__dirname, "build/icon.png"),
    resizable: false,
    frame: false,
    transparent: true,
    
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow.loadFile("index.html");
  
}

app.whenReady().then(() => {
  createWindow();

  

  const lastVersion = getLastVersion();
  const currentVersion = app.getVersion();

  if (lastVersion && lastVersion !== currentVersion) {
    showWhatsNewWindow(currentVersion);
  }

  saveCurrentVersion();
  checkForUpdates();
  // check every 30 minutes
  updateCheckInterval = setInterval(checkForUpdates, 30 * 60 * 1000);
});

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
      message: "A new version of UltraClock is available.",
      detail: "Would you like to update now?"
    });

    autoUpdater.downloadUpdate();
});

autoUpdater.on("update-downloaded", () => {
    if (choice === null) {
        return;
    }
    if (choice === 0) {
        dialog.showMessageBox(mainWindow, {
          type: "info",
          buttons: ["Restart & Update"],
          defaultId: 0,
          title: "Ready to update",
          message: "The update has been downloaded.",
          detail: "UltraClock will restart to apply the update."
        }).then(() => {
          autoUpdater.quitAndInstall();
        });
    }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
