const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Snippet operations
  getSnippets: () => ipcRenderer.invoke("get-snippets"),
  addSnippet: (title, description, content) =>
    ipcRenderer.invoke("add-snippet", title, description, content),
  deleteSnippet: (id) => ipcRenderer.invoke("delete-snippet", id),

  // Document operations
  getDocuments: () => ipcRenderer.invoke("get-documents"),
  addDocument: (title, link) => ipcRenderer.invoke("add-document", title, link),
  deleteDocument: (id) => ipcRenderer.invoke("delete-document", id),

  // Bookmark operations
  getBookmarks: () => ipcRenderer.invoke("get-bookmarks"),
  addBookmark: (title, url, description) =>
    ipcRenderer.invoke("add-bookmark", title, url, description),
  deleteBookmark: (id) => ipcRenderer.invoke("delete-bookmark", id),

  // Tool operations
  getTools: () => ipcRenderer.invoke("get-tools"),
  addTool: (name, url, description, category, keywords) =>
    ipcRenderer.invoke("add-tool", name, url, description, category, keywords),
  deleteTool: (id) => ipcRenderer.invoke("delete-tool", id),

  // Clipboard History operations
  getClipboardHistory: () => ipcRenderer.invoke("get-clipboard-history"),
  addClipboardItem: (type, content, preview, size) =>
    ipcRenderer.invoke("add-clipboard-item", type, content, preview, size),
  updateClipboardItem: (id, type, content, preview, size) =>
    ipcRenderer.invoke("update-clipboard-item", id, type, content, preview, size),
  deleteClipboardItem: (id) => ipcRenderer.invoke("delete-clipboard-item", id),
  clearClipboardHistory: () => ipcRenderer.invoke("clear-clipboard-history"),

  // Utility operations
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  hideWindow: () => ipcRenderer.invoke("hide-window"),
  openSettings: () => ipcRenderer.invoke("open-settings"),
  quitApp: () => ipcRenderer.invoke("quit-app"),
  restartApp: () => ipcRenderer.invoke("restart-app"),

  // Platform information
  platform: process.platform,

  // Listen for events from main process
  onFocusSearch: (callback) => ipcRenderer.on("focus-search", callback),
});
