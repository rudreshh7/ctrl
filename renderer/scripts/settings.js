class CtrlSettings {
  constructor() {
    this.snippets = [];
    this.documents = [];
    this.currentTab = "snippets";

    this.init();
  }

  async init() {
    await this.loadData();
    this.bindEvents();
    this.renderSnippets();
    this.renderDocuments();
  }

  async loadData() {
    try {
      this.snippets = await window.electronAPI.getSnippets();
      this.documents = await window.electronAPI.getDocuments();
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
                    <svg class="empty-state-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clip-rule="evenodd" />
                    </svg>
                    <p>No snippets yet. Add your first snippet to get started!</p>
                </div>
            `;
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
                        <svg class="action-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
                        </svg>
                    </button>
                    <button class="action-button delete" onclick="ctrlSettings.deleteSnippet(${
                      snippet.id
                    })" title="Delete snippet">
                        <svg class="action-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        `
      )
      .join("");

    container.innerHTML = html;
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
                    <svg class="empty-state-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
                    </svg>
                    <p>No documents yet. Add your first document link to get started!</p>
                </div>
            `;
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
                        <svg class="action-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
                        </svg>
                    </button>
                    <button class="action-button delete" onclick="ctrlSettings.deleteDocument(${
                      document.id
                    })" title="Delete document">
                        <svg class="action-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        `
      )
      .join("");

    container.innerHTML = html;
  }

  async openDocument(id) {
    const document = this.documents.find((d) => d.id === id);
    if (document) {
      await window.electronAPI.openExternal(document.link);
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
