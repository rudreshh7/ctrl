class CtrlSettings {
  constructor() {
    this.snippets = [];
    this.documents = [];
    this.bookmarks = [];
    this.currentTab = "general";
    this.hasChanges = false;

    this.init();
  }

  async init() {
    await this.loadData();
    this.bindEvents();
    this.renderSnippets();
    this.renderDocuments();
    this.renderBookmarks();
    this.setupRestartNotification();
  }

  async loadData() {
    try {
      this.snippets = await window.electronAPI.getSnippets();
      this.documents = await window.electronAPI.getDocuments();
      this.bookmarks = await window.electronAPI.getBookmarks();
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  }

  bindEvents() {
    // Tab switching
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Snippet form events
    document.getElementById("addSnippetBtn").addEventListener("click", () => {
      this.showSnippetForm();
    });

    document.getElementById("saveSnippetBtn").addEventListener("click", () => {
      this.saveSnippet();
    });

    document
      .getElementById("cancelSnippetBtn")
      .addEventListener("click", () => {
        this.hideSnippetForm();
      });

    // Document form events
    document.getElementById("addDocumentBtn").addEventListener("click", () => {
      this.showDocumentForm();
    });

    document.getElementById("saveDocumentBtn").addEventListener("click", () => {
      this.saveDocument();
    });

    document
      .getElementById("cancelDocumentBtn")
      .addEventListener("click", () => {
        this.hideDocumentForm();
      });

    // Form submission with Enter key
    document
      .getElementById("snippetContent")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          this.saveSnippet();
        }
      });

    document
      .getElementById("documentTitle")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          document.getElementById("documentLink").focus();
        }
      });

    document.getElementById("documentLink").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.saveDocument();
      }
    });

    // Bookmark form events
    document.getElementById("addBookmarkBtn").addEventListener("click", () => {
      this.showBookmarkForm();
    });

    document.getElementById("saveBookmarkBtn").addEventListener("click", () => {
      this.saveBookmark();
    });

    document
      .getElementById("cancelBookmarkBtn")
      .addEventListener("click", () => {
        this.hideBookmarkForm();
      });

    document
      .getElementById("bookmarkTitle")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          document.getElementById("bookmarkUrl").focus();
        }
      });

    document.getElementById("bookmarkUrl").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        document.getElementById("bookmarkDescription").focus();
      }
    });

    document
      .getElementById("bookmarkDescription")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          this.saveBookmark();
        }
      });
  }

  setupRestartNotification() {
    // Restart button event
    document.getElementById("restartButton").addEventListener("click", () => {
      this.restartApp();
    });

    // Close notification button
    document
      .getElementById("closeNotification")
      .addEventListener("click", () => {
        this.hideRestartNotification();
      });
  }

  showRestartNotification() {
    if (!this.hasChanges) {
      this.hasChanges = true;
      const notification = document.getElementById("restartNotification");
      notification.classList.add("show");
    }
  }

  hideRestartNotification() {
    const notification = document.getElementById("restartNotification");
    notification.classList.remove("show");
    this.hasChanges = false;
  }

  async restartApp() {
    try {
      await window.electronAPI.restartApp();
    } catch (error) {
      console.error("Failed to restart app:", error);
    }
  }

  switchTab(tab) {
    this.currentTab = tab;

    // Update tab buttons
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.classList.toggle("active", button.dataset.tab === tab);
    });

    // Update tab content
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.toggle("active", content.id === `${tab}-tab`);
    });

    // Hide any open forms when switching tabs
    this.hideSnippetForm();
    this.hideDocumentForm();
    this.hideBookmarkForm();
  }

  // Snippet management
  showSnippetForm() {
    document.getElementById("snippetForm").classList.remove("hidden");
    document.getElementById("snippetContent").focus();
  }

  hideSnippetForm() {
    document.getElementById("snippetForm").classList.add("hidden");
    document.getElementById("snippetContent").value = "";
  }

  async saveSnippet() {
    const content = document.getElementById("snippetContent").value.trim();

    if (!content) {
      alert("Please enter snippet content");
      return;
    }

    try {
      const result = await window.electronAPI.addSnippet(content);
      if (result.success) {
        await this.loadData();
        this.renderSnippets();
        this.hideSnippetForm();
        this.showRestartNotification();
      } else {
        alert("Failed to save snippet: " + result.error);
      }
    } catch (error) {
      console.error("Error saving snippet:", error);
      alert("Failed to save snippet");
    }
  }

  async deleteSnippet(id) {
    if (!confirm("Are you sure you want to delete this snippet?")) {
      return;
    }

    try {
      const result = await window.electronAPI.deleteSnippet(id);
      if (result.success) {
        await this.loadData();
        this.renderSnippets();
        this.showRestartNotification();
      } else {
        alert("Failed to delete snippet");
      }
    } catch (error) {
      console.error("Error deleting snippet:", error);
      alert("Failed to delete snippet");
    }
  }

  renderSnippets() {
    const container = document.getElementById("snippetsList");

    if (this.snippets.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="code" class="empty-state-icon"></i>
                    <p>No snippets yet. Add your first snippet to get started!</p>
                </div>
            `;
      lucide.createIcons();
      return;
    }

    const html = this.snippets
      .map(
        (snippet) => `
            <div class="item">
                <div class="item-content">
                    <div class="item-title">${this.getSnippetPreview(
                      snippet.content
                    )}</div>
                    <div class="item-subtitle">${this.escapeHtml(
                      snippet.content
                    )}</div>
                </div>
                <div class="item-actions">
                    <button class="action-button" onclick="ctrlSettings.copySnippet(${
                      snippet.id
                    })" title="Copy to clipboard">
                        <i data-lucide="copy" class="action-icon"></i>
                    </button>
                    <button class="action-button delete" onclick="ctrlSettings.deleteSnippet(${
                      snippet.id
                    })" title="Delete snippet">
                        <i data-lucide="trash-2" class="action-icon"></i>
                    </button>
                </div>
            </div>
        `
      )
      .join("");

    container.innerHTML = html;
    lucide.createIcons();
  }

  async copySnippet(id) {
    const snippet = this.snippets.find((s) => s.id === id);
    if (snippet) {
      try {
        await navigator.clipboard.writeText(snippet.content);
        // Visual feedback could be added here
      } catch (error) {
        console.error("Failed to copy snippet:", error);
      }
    }
  }

  getSnippetPreview(content) {
    const firstLine = content.split("\n")[0];
    return firstLine.length > 60
      ? firstLine.substring(0, 60) + "..."
      : firstLine;
  }

  // Document management
  showDocumentForm() {
    document.getElementById("documentForm").classList.remove("hidden");
    document.getElementById("documentTitle").focus();
  }

  hideDocumentForm() {
    document.getElementById("documentForm").classList.add("hidden");
    document.getElementById("documentTitle").value = "";
    document.getElementById("documentLink").value = "";
  }

  async saveDocument() {
    const title = document.getElementById("documentTitle").value.trim();
    const link = document.getElementById("documentLink").value.trim();

    if (!title || !link) {
      alert("Please enter both title and link");
      return;
    }

    // Basic URL validation
    try {
      new URL(link);
    } catch {
      alert("Please enter a valid URL");
      return;
    }

    try {
      const result = await window.electronAPI.addDocument(title, link);
      if (result.success) {
        await this.loadData();
        this.renderDocuments();
        this.hideDocumentForm();
        this.showRestartNotification();
      } else {
        alert("Failed to save document: " + result.error);
      }
    } catch (error) {
      console.error("Error saving document:", error);
      alert("Failed to save document");
    }
  }

  async deleteDocument(id) {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      const result = await window.electronAPI.deleteDocument(id);
      if (result.success) {
        await this.loadData();
        this.renderDocuments();
        this.showRestartNotification();
      } else {
        alert("Failed to delete document");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document");
    }
  }

  renderDocuments() {
    const container = document.getElementById("documentsList");

    if (this.documents.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="file-text" class="empty-state-icon"></i>
                    <p>No documents yet. Add your first document link to get started!</p>
                </div>
            `;
      lucide.createIcons();
      return;
    }

    const html = this.documents
      .map(
        (document) => `
            <div class="item">
                <div class="item-content">
                    <div class="item-title">${this.escapeHtml(
                      document.title
                    )}</div>
                    <div class="item-subtitle">${this.escapeHtml(
                      document.link
                    )}</div>
                </div>
                <div class="item-actions">
                    <button class="action-button" onclick="ctrlSettings.openDocument(${
                      document.id
                    })" title="Open document">
                        <i data-lucide="external-link" class="action-icon"></i>
                    </button>
                    <button class="action-button delete" onclick="ctrlSettings.deleteDocument(${
                      document.id
                    })" title="Delete document">
                        <i data-lucide="trash-2" class="action-icon"></i>
                    </button>
                </div>
            </div>
        `
      )
      .join("");

    container.innerHTML = html;
    lucide.createIcons();
  }

  async openDocument(id) {
    const document = this.documents.find((d) => d.id === id);
    if (document) {
      await window.electronAPI.openExternal(document.link);
    }
  }

  // Bookmark management
  showBookmarkForm() {
    document.getElementById("bookmarkForm").classList.remove("hidden");
    document.getElementById("bookmarkTitle").focus();
  }

  hideBookmarkForm() {
    document.getElementById("bookmarkForm").classList.add("hidden");
    document.getElementById("bookmarkTitle").value = "";
    document.getElementById("bookmarkUrl").value = "";
    document.getElementById("bookmarkDescription").value = "";
  }

  async saveBookmark() {
    const title = document.getElementById("bookmarkTitle").value.trim();
    const url = document.getElementById("bookmarkUrl").value.trim();
    const description = document
      .getElementById("bookmarkDescription")
      .value.trim();

    if (!title || !url) {
      alert("Please enter both title and URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      alert("Please enter a valid URL");
      return;
    }

    try {
      const result = await window.electronAPI.addBookmark(
        title,
        url,
        description
      );
      if (result.success) {
        await this.loadData();
        this.renderBookmarks();
        this.hideBookmarkForm();
        this.showRestartNotification();
      } else {
        alert("Failed to save bookmark: " + result.error);
      }
    } catch (error) {
      console.error("Error saving bookmark:", error);
      alert("Failed to save bookmark");
    }
  }

  async deleteBookmark(id) {
    if (!confirm("Are you sure you want to delete this bookmark?")) {
      return;
    }

    try {
      const result = await window.electronAPI.deleteBookmark(id);
      if (result.success) {
        await this.loadData();
        this.renderBookmarks();
        this.showRestartNotification();
      } else {
        alert("Failed to delete bookmark");
      }
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      alert("Failed to delete bookmark");
    }
  }

  renderBookmarks() {
    const container = document.getElementById("bookmarksList");

    if (this.bookmarks.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="bookmark" class="empty-state-icon"></i>
                    <p>No bookmarks yet. Add your first bookmark to get started!</p>
                </div>
            `;
      lucide.createIcons();
      return;
    }

    const html = this.bookmarks
      .map(
        (bookmark) => `
            <div class="item">
                <div class="item-content">
                    <div class="item-title">${this.escapeHtml(
                      bookmark.title
                    )}</div>
                    <div class="item-subtitle">${this.escapeHtml(
                      bookmark.url
                    )}</div>
                    ${
                      bookmark.description
                        ? `<div class="item-description">${this.escapeHtml(
                            bookmark.description
                          )}</div>`
                        : ""
                    }
                </div>
                <div class="item-actions">
                    <button class="action-button" onclick="ctrlSettings.openBookmark(${
                      bookmark.id
                    })" title="Open bookmark">
                        <i data-lucide="external-link" class="action-icon"></i>
                    </button>
                    <button class="action-button delete" onclick="ctrlSettings.deleteBookmark(${
                      bookmark.id
                    })" title="Delete bookmark">
                        <i data-lucide="trash-2" class="action-icon"></i>
                    </button>
                </div>
            </div>
        `
      )
      .join("");

    container.innerHTML = html;
    lucide.createIcons();
  }

  async openBookmark(id) {
    const bookmark = this.bookmarks.find((b) => b.id === id);
    if (bookmark) {
      await window.electronAPI.openExternal(bookmark.url);
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the settings app
let ctrlSettings;
document.addEventListener("DOMContentLoaded", () => {
  ctrlSettings = new CtrlSettings();
});
