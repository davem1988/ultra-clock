const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("updater", {
  onProgress: (callback) => ipcRenderer.on("update-progress", (_, data) => callback(data)),
  onComplete: (cb) => ipcRenderer.on("update-complete", cb)

});


