const { app, BrowserWindow } = require("electron");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
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

  win.loadFile("index.html");

  // Check for updates
  autoUpdater.checkForUpdatesAndNotify();
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
