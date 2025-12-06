const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises; // Importante per leggere il buffer

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#111827'
  });

  mainWindow.loadFile('index.html');

  // Apri DevTools se avviato con --dev
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

// Gestione selezione file video
ipcMain.handle('select-video-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Video', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'] }
    ]
  });

  if (result.canceled) return null;

  const filePath = result.filePaths[0];
  
  try {
    // ⚠️ CRITICO: Legge il file e restituisce il buffer al renderer
    const buffer = await fs.readFile(filePath);
    return { 
      filePath: filePath, 
      buffer: buffer 
    };
  } catch (error) {
    console.error("Errore lettura file:", error);
    return null;
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});