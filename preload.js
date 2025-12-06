const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Invoca il main process che legge il file e restituisce { filePath, buffer }
  selectVideoFile: () => ipcRenderer.invoke('select-video-file')
});