class CtrlSearch {
  constructor() {
    this.snippets = [];
    this.documents = [];
    this.currentResults = [];
    this.selectedIndex = 0;

    this.searchInput = document.getElementById("searchInput");
    this.resultsContainer = document.getElementById("resultsContainer");

    this.init();
  }

  async init() {
    await this.loadData();
    this.bindEvents();
    this.focusSearch();
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
    // Search input events
    this.searchInput.addEventListener("input", (e) => {
      this.handleSearch(e.target.value);
    });

    this.searchInput.addEventListener("keydown", (e) => {
      this.handleKeyDown(e);
    });

    // Focus search when window receives focus
    window.electronAPI.onFocusSearch(() => {
      this.focusSearch();
    });

    // Global keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        window.electronAPI.hideWindow();
      } else if (e.key === "," && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        window.electronAPI.openSettings();
      }
    });
  }

  focusSearch() {
    setTimeout(() => {
      this.searchInput.focus();
      this.searchInput.select();
    }, 100);
  }

  updatePlatformShortcuts() {
    // Update settings shortcut based on platform
    const settingsKeyElement = document.getElementById("settingsKey");
    if (settingsKeyElement) {
      if (window.electronAPI.platform === "win32") {
        settingsKeyElement.textContent = "Win";
      } else if (window.electronAPI.platform === "darwin") {
        settingsKeyElement.textContent = "⌘";
      } else {
        settingsKeyElement.textContent = "Ctrl";
      }
    }
  }

  handleSearch(query) {
    if (!query.trim()) {
      this.showEmptyState();
      return;
    }

    const results = this.searchItems(query);
    this.displayResults(results);
    this.selectedIndex = 0;
    this.updateSelection();
  }

  searchItems(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    // Search system commands
    const systemCommands = [
      {
        type: "system",
        id: "settings",
        title: "Settings",
        subtitle: "Open Ctrl settings to manage snippets and documents",
        keywords: ["settings", "preferences", "config", "configure", "manage"],
      },
    ];

    systemCommands.forEach((command) => {
      if (
        command.keywords.some((keyword) => keyword.includes(lowerQuery)) ||
        command.title.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          type: command.type,
          id: command.id,
          title: command.title,
          subtitle: command.subtitle,
          data: command,
        });
      }
    });

    // Search snippets
    this.snippets.forEach((snippet) => {
      if (snippet.content.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: "snippet",
          id: snippet.id,
          title: this.getSnippetPreview(snippet.content),
          subtitle: snippet.content,
          data: snippet,
        });
      }
    });

    // Search documents
    this.documents.forEach((document) => {
      if (
        document.title.toLowerCase().includes(lowerQuery) ||
        document.link.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          type: "document",
          id: document.id,
          title: document.title,
          subtitle: document.link,
          data: document,
        });
      }
    });

    return results;
  }

  getSnippetPreview(content) {
    const firstLine = content.split("\n")[0];
    return firstLine.length > 50
      ? firstLine.substring(0, 50) + "..."
      : firstLine;
  }

  displayResults(results) {
    this.currentResults = results;

    if (results.length === 0) {
      this.showNoResults();
      return;
    }

    const html = results
      .map(
        (result, index) => `
            <div class="result-item" data-index="${index}">
                <i data-lucide="${
                  result.type === "snippet"
                    ? "code"
                    : result.type === "system"
                    ? "settings"
                    : "file-text"
                }" class="result-icon"></i>
                <div class="result-content">
                    <div class="result-title">${this.escapeHtml(
                      result.title
                    )}</div>
                    <div class="result-subtitle">${this.escapeHtml(
                      result.subtitle
                    )}</div>
                </div>
                <span class="result-type ${result.type}">${result.type}</span>
            </div>
        `
      )
      .join("");

    this.resultsContainer.innerHTML = html;

    // Add click handlers
    this.resultsContainer.querySelectorAll(".result-item").forEach((item) => {
      item.addEventListener("click", () => {
        const index = parseInt(item.dataset.index);
        this.selectResult(index);
      });
    });

    // Re-initialize Lucide icons
    lucide.createIcons();
  }

  showEmptyState() {
    this.currentResults = [];
    this.resultsContainer.innerHTML = `
            <div class="empty-state">
                <i data-lucide="search" class="empty-icon"></i>
                <p>Start typing to search...</p>
            </div>
        `;
    lucide.createIcons();
  }

  showNoResults() {
    this.resultsContainer.innerHTML = `
            <div class="empty-state">
                <i data-lucide="search-x" class="empty-icon"></i>
                <p>No results found</p>
            </div>
        `;
    lucide.createIcons();
  }

  handleKeyDown(e) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this.selectedIndex = Math.min(
          this.selectedIndex + 1,
          this.currentResults.length - 1
        );
        this.updateSelection();
        break;
      case "ArrowUp":
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.updateSelection();
        break;
      case "Enter":
        e.preventDefault();
        if (this.currentResults.length > 0) {
          this.selectResult(this.selectedIndex);
        }
        break;
    }
  }

  updateSelection() {
    const items = this.resultsContainer.querySelectorAll(".result-item");
    items.forEach((item, index) => {
      item.classList.toggle("selected", index === this.selectedIndex);
    });

    // Scroll selected item into view
    const selectedItem = items[this.selectedIndex];
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: "nearest" });
    }
  }

  async selectResult(index) {
    const result = this.currentResults[index];
    if (!result) return;

    if (result.type === "snippet") {
      // Copy snippet to clipboard
      await navigator.clipboard.writeText(result.data.content);
    } else if (result.type === "document") {
      // Open document link
      await window.electronAPI.openExternal(result.data.link);
    } else if (result.type === "system") {
      // Handle system commands
      if (result.id === "settings") {
        await window.electronAPI.openSettings();
      }
    }

    // Hide window after selection
    window.electronAPI.hideWindow();
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  new CtrlSearch();
});
