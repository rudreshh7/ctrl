const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Snippet operations
  getSnippets: () => ipcRenderer.invoke("get-snippets"),
  addSnippet: (content) => ipcRenderer.invoke("add-snippet", content),
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
