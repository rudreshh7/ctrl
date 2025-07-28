const {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  shell,
} = require("electron");
const path = require("path");
const {
  initDatabase,
  getAllSnippets,
  addSnippet,
  deleteSnippet,
  getAllDocuments,
  addDocument,
  deleteDocument,
} = require("./db/database");

class CtrlApp {
  constructor() {
    this.mainWindow = null;
    this.settingsWindow = null;
    this.isQuitting = false;
  }

  createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 640,
      height: 400,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js"),
      },
    });

    this.mainWindow.loadFile("./renderer/index.html");
    this.mainWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
    });

    // Hide window when it loses focus
    this.mainWindow.on("blur", () => {
      if (!this.isQuitting) {
        this.mainWindow.hide();
      }
    });

    this.mainWindow.on("closed", () => {
      this.mainWindow = null;
    });
  }

  createSettingsWindow() {
    if (this.settingsWindow) {
      this.settingsWindow.focus();
      return;
    }

    this.settingsWindow = new BrowserWindow({
      width: 900,
      height: 700,
      frame: true,
      transparent: false,
      alwaysOnTop: false,
      resizable: true,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js"),
      },
    });

    this.settingsWindow.loadFile("./renderer/settings.html");
    this.settingsWindow.show();

    this.settingsWindow.on("closed", () => {
      this.settingsWindow = null;
    });
  }

  registerGlobalShortcuts() {
    // Register global shortcut to show/hide main window
    globalShortcut.register("CommandOrControl+Space", () => {
      if (this.mainWindow.isVisible()) {
        this.mainWindow.hide();
      } else {
        this.mainWindow.show();
        this.mainWindow.focus();
        this.mainWindow.webContents.send("focus-search");
      }
    });

    // Note: Removed settings shortcut to avoid conflicts with Windows system shortcuts
    // Settings can now be accessed by typing "settings" in the search bar
  }

  setupIpcHandlers() {
    // Snippet handlers
    ipcMain.handle("get-snippets", async () => {
      return getAllSnippets();
    });

    ipcMain.handle("add-snippet", async (event, content) => {
      return addSnippet(content);
    });

    ipcMain.handle("delete-snippet", async (event, id) => {
      return deleteSnippet(id);
    });

    // Document handlers
    ipcMain.handle("get-documents", async () => {
      return getAllDocuments();
    });

    ipcMain.handle("add-document", async (event, title, link) => {
      return addDocument(title, link);
    });

    ipcMain.handle("delete-document", async (event, id) => {
      return deleteDocument(id);
    });

    // Utility handlers
    ipcMain.handle("open-external", async (event, url) => {
      shell.openExternal(url);
    });

    ipcMain.handle("hide-window", async () => {
      if (this.mainWindow) {
        this.mainWindow.hide();
      }
    });

    ipcMain.handle("open-settings", async () => {
      this.createSettingsWindow();
    });

    ipcMain.handle("quit-app", async () => {
      this.isQuitting = true;
      app.quit();
    });

    ipcMain.handle("restart-app", async () => {
      app.relaunch();
      app.quit();
    });
  }

  async initialize() {
    await app.whenReady();

    // Initialize database
    initDatabase();

    // Create main window
    this.createMainWindow();

    // Register shortcuts and handlers
    this.registerGlobalShortcuts();
    this.setupIpcHandlers();

    // Handle app activation (macOS)
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });
  }
}

// App lifecycle
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// Create and initialize app
const ctrlApp = new CtrlApp();
ctrlApp.initialize();
