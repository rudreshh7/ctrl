const {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  shell,
} = require("electron");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");
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

// Helper function for recursive file search
async function searchDirectory(dirPath, searchTerms, results, maxDepth, currentDepth = 0) {
  if (currentDepth >= maxDepth || results.length >= 50) return;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      try {
        const fullPath = path.join(dirPath, entry.name);
        const fileName = entry.name.toLowerCase();
        
        // Check if filename matches any search term
        const matches = searchTerms.some(term => fileName.includes(term));
        
        if (matches) {
          const stats = await fs.stat(fullPath);
          results.push({
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            size: stats.size,
            modified: stats.mtime.toISOString(),
          });
        }

        // Recursively search subdirectories
        if (entry.isDirectory() && currentDepth < maxDepth - 1) {
          await searchDirectory(fullPath, searchTerms, results, maxDepth, currentDepth + 1);
        }
      } catch (error) {
        // Skip files/folders that can't be accessed
        continue;
      }
    }
  } catch (error) {
    // Skip directories that can't be accessed
    return;
  }
}

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

    // File System handlers
    ipcMain.handle("get-user-directories", async () => {
      try {
        const userDirs = [];
        const homeDir = os.homedir();
        
        // Common user directories across platforms
        const commonDirs = [
          path.join(homeDir, 'Desktop'),
          path.join(homeDir, 'Documents'),
          path.join(homeDir, 'Downloads'),
        ];

        // Platform-specific directories
        if (process.platform === 'win32') {
          commonDirs.push(
            path.join(homeDir, 'Pictures'),
            path.join(homeDir, 'Videos'),
            path.join(homeDir, 'Music')
          );
        } else if (process.platform === 'darwin') {
          commonDirs.push(
            path.join(homeDir, 'Pictures'),
            path.join(homeDir, 'Movies'),
            path.join(homeDir, 'Music')
          );
        } else {
          // Linux
          commonDirs.push(
            path.join(homeDir, 'Pictures'),
            path.join(homeDir, 'Videos'),
            path.join(homeDir, 'Music')
          );
        }

        // Check which directories exist
        for (const dir of commonDirs) {
          try {
            await fs.access(dir);
            userDirs.push(dir);
          } catch (error) {
            // Directory doesn't exist, skip it
          }
        }

        return userDirs;
      } catch (error) {
        console.error("Error getting user directories:", error);
        return [];
      }
    });

    ipcMain.handle("read-directory", async (event, dirPath) => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const files = [];

        for (const entry of entries) {
          try {
            const fullPath = path.join(dirPath, entry.name);
            const stats = await fs.stat(fullPath);
            
            files.push({
              name: entry.name,
              isDirectory: entry.isDirectory(),
              size: stats.size,
              modified: stats.mtime.toISOString(),
            });
          } catch (error) {
            // Skip files that can't be accessed
            continue;
          }
        }

        return files;
      } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error);
        return [];
      }
    });

    ipcMain.handle("search-files", async (event, query, searchPaths) => {
      try {
        const results = [];
        const searchTerms = query.toLowerCase().split(/\s+/);

        for (const searchPath of searchPaths) {
          try {
            await searchDirectory(searchPath, searchTerms, results, 2); // Max depth 2
          } catch (error) {
            // Skip directories that can't be accessed
            continue;
          }
        }

        return results.slice(0, 50); // Limit results
      } catch (error) {
        console.error("Error searching files:", error);
        return [];
      }
    });

    ipcMain.handle("join-path", async (event, ...pathSegments) => {
      return path.join(...pathSegments);
    });

    ipcMain.handle("open-file", async (event, filePath) => {
      try {
        await shell.openPath(filePath);
        return { success: true };
      } catch (error) {
        console.error("Error opening file:", error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle("reveal-in-explorer", async (event, filePath) => {
      try {
        shell.showItemInFolder(filePath);
        return { success: true };
      } catch (error) {
        console.error("Error revealing file:", error);
        return { success: false, error: error.message };
      }
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
