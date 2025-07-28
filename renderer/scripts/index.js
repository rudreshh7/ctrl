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
                <svg class="result-icon" viewBox="0 0 20 20" fill="currentColor">
                    ${
                      result.type === "snippet"
                        ? '<path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clip-rule="evenodd" />'
                        : result.type === "system"
                        ? '<path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />'
                        : '<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />'
                    }
                </svg>
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
  }

  showEmptyState() {
    this.currentResults = [];
    this.resultsContainer.innerHTML = `
            <div class="empty-state">
                <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <p>Start typing to search...</p>
            </div>
        `;
  }

  showNoResults() {
    this.resultsContainer.innerHTML = `
            <div class="empty-state">
                <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <p>No results found</p>
            </div>
        `;
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
