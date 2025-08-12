// main.js — Widget Météo (frameless + always-on-top)
const { app, BrowserWindow, Menu, nativeTheme } = require("electron");
const path = require("path");

let win;

function createWindow() {
  const WIDTH = 640;
  const HEIGHT = 480;

  win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    resizable: false,
    movable: true,
    fullscreenable: false,
    minimizable: true,
    maximizable: false,
    alwaysOnTop: true,                 // fenêtre toujours au-dessus
    // Niveau conseillé pour un “pseudo-widget” sur macOS :
    // @ts-ignore
    alwaysOnTopLevel: "floating",
    frame: false,                      // sans bordure
    transparent: true,                 // fond transparent
    backgroundColor: "#00000000",
    titleBarStyle: "hidden",
    show: false,                       // éviter le flash à l’ouverture
    webPreferences: {
      // Retirer preload pour éviter les erreurs si le fichier n’existe pas
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
    },
  });

  win.loadFile(path.join(__dirname, "index.html"));

  win.once("ready-to-show", () => {
    win.show();
  });

  // Pas de barre de menu (Windows/Linux)
  Menu.setApplicationMenu(null);

  // Évite le zoom par pinch (trackpad)
  win.webContents.setVisualZoomLevelLimits(1, 1).catch(() => {});
}

// App lifecycle
app.whenReady().then(() => {
  try { nativeTheme.themeSource = "dark"; } catch {}
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});





