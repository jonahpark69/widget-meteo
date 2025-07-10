const { app, BrowserWindow } = require('electron');
const path = require('path');

let win;

function createWindow() {
  win = new BrowserWindow({
    show: false, // pour éviter le clignotement
    useContentSize: true,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');

  win.once('ready-to-show', () => {
    // ✅ fixe la taille de la fenêtre avec dimensions pixel réels
    win.setBounds({ x: 0, y: 0, width: 640, height: 480 });
    win.show();
    win.webContents.setZoomFactor(1); // ← obligatoire pour éviter le zoom Retina
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});




