const { app, BrowserWindow } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 300,
    height: 120,
    resizable: false,
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
