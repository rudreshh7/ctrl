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
  getAllBookmarks,
  addBookmark,
  deleteBookmark,
  getAllTools,
  addTool,
  deleteTool,
  getAllClipboardHistory,
  addClipboardItem,
  updateClipboardItem,
  deleteClipboardItem,
  clearClipboardHistory,
} = require("./db/database");

class CtrlApp {
  constructor() {
    this.mainWindow = null;
    this.settingsWindow = null;
    this.isQuitting = false;
  }

  createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 720,
      height: 480,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      show: false,
      icon: path.join(__dirname, 'assets/icon.png'),
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
      icon: path.join(__dirname, 'assets/icon.png'),
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

    ipcMain.handle(
      "add-snippet",
      async (event, title, description, content) => {
        return addSnippet(title, description, content);
      }
    );

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

    // Bookmark handlers
    ipcMain.handle("get-bookmarks", async () => {
      return getAllBookmarks();
    });

    ipcMain.handle("add-bookmark", async (event, title, url, description) => {
      return addBookmark(title, url, description);
    });

    ipcMain.handle("delete-bookmark", async (event, id) => {
      return deleteBookmark(id);
    });

    // Tool handlers
    ipcMain.handle("get-tools", async () => {
      return getAllTools();
    });

    ipcMain.handle("add-tool", async (event, name, url, description, category, keywords) => {
      return addTool(name, url, description, category, keywords);
    });

    ipcMain.handle("delete-tool", async (event, id) => {
      return deleteTool(id);
    });

    // Clipboard History handlers
    ipcMain.handle("get-clipboard-history", async () => {
      return getAllClipboardHistory();
    });

    ipcMain.handle("add-clipboard-item", async (event, type, content, preview, size) => {
      return addClipboardItem(type, content, preview, size);
    });

    ipcMain.handle("update-clipboard-item", async (event, id, type, content, preview, size) => {
      return updateClipboardItem(id, type, content, preview, size);
    });

    ipcMain.handle("delete-clipboard-item", async (event, id) => {
      return deleteClipboardItem(id);
    });

    ipcMain.handle("clear-clipboard-history", async () => {
      return clearClipboardHistory();
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
