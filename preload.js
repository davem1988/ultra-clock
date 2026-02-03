const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("updater", {
  onProgress: (callback) => ipcRenderer.on("update-progress", (_, data) => callback(data)),
  onComplete: (cb) => ipcRenderer.on("update-complete", cb)

});

contextBridge.exposeInMainWorld("clockSettings", {
  getFormat: () => ipcRenderer.invoke("get-time-format"),
  onFormatChange: (cb) => ipcRenderer.on("time-format-changed", (_, v) => cb(v))
});


