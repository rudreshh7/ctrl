/**
 * UIManager - Handles all UI rendering and DOM manipulation
 * Responsibilities:
 * - Result rendering and display
 * - UI state management (empty state, no results)
 * - Result selection and highlighting
 * - Click handlers for results
 * - Tools directory display
 */
export class UIManager {
  constructor(resultsContainer) {
    this.resultsContainer = resultsContainer;
    this.currentResults = [];
    this.selectedIndex = 0;
  }

  displayResults(results) {
    console.log("displayResults called with:", results.length, "results");
    this.currentResults = results;
    this.selectedIndex = 0;
    this.renderResults(results);
  }

  renderResults(results) {
    if (results.length === 0) {
      this.showNoResults();
      return;
    }

    const html = results
      .map((result, index) => this.createResultHTML(result, index))
      .join("");

    this.resultsContainer.innerHTML = html;
    this.addClickHandlers(results);
    this.updateSelection(0);

    // Re-initialize Lucide icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  createResultHTML(result, index) {
    const icon = this.getResultIcon(result.type);

    if (result.type === "emoji") {
      return `
        <div class="result-item emoji-item" data-index="${index}">
          <div class="emoji-display">${result.data.emoji}</div>
          <div class="result-content">
            <div class="result-title">${result.data.name}</div>
            <div class="result-subtitle">${result.subtitle}</div>
          </div>
          <span class="result-type emoji">emoji</span>
        </div>
      `;
    }

    return `
      <div class="result-item" data-index="${index}">
        <i data-lucide="${icon}" class="result-icon"></i>
        <div class="result-content">
          <div class="result-title">${result.title}</div>
          <div class="result-subtitle">${result.subtitle}</div>
        </div>
        <span class="result-type ${result.type}">${result.type}</span>
      </div>
    `;
  }

  getResultIcon(type) {
    const iconMap = {
      snippet: "code",
      document: "file",
      bookmark: "bookmark",
      tool: "wrench",
      emoji: "smile",
      system: "command",
    };
    return iconMap[type] || "file-text";
  }

  addClickHandlers(results) {
    this.resultsContainer.querySelectorAll(".result-item").forEach((item) => {
      item.addEventListener("click", () => {
        const index = parseInt(item.dataset.index);
        // Emit custom event for result selection
        this.resultsContainer.dispatchEvent(
          new CustomEvent("resultSelected", { detail: { index } })
        );
      });
    });
  }

  updateSelection(selectedIndex) {
    this.selectedIndex = selectedIndex;
    const items = this.resultsContainer.querySelectorAll(".result-item");
    items.forEach((item, index) => {
      item.classList.toggle("selected", index === selectedIndex);
    });

    const selectedItem = items[selectedIndex];
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: "nearest" });
    }
  }

  showEmptyState() {
    this.resultsContainer.innerHTML = `
      <div class="empty-state">
        <i data-lucide="search" class="empty-icon"></i>
        <p>Start typing to search...</p>
        <div style="margin-top: 16px; font-size: 12px; color: #9ca3af; text-align: center;">
          <p><strong>s</strong> = Settings • <strong>e</strong> = Emojis • <strong>sum</strong> = Calculator • <strong>tools</strong> = Tools Directory</p>
          <p> <strong>add-snippet</strong> = New Snippet • <strong>add-document</strong> = New Document • <strong>add-bookmark</strong> = New Bookmark</p>
          <p> Type ":" to browse emoji categories • Type "." for clipboard history • Type ">" for file search</p>
          <p> Search for snippets, documents, bookmarks, or tools</p>
        </div>
      </div>
    `;

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  showNoResults() {
    this.resultsContainer.innerHTML = `
      <div class="empty-state">
        <i data-lucide="search-x" class="empty-icon"></i>
        <p>No results found</p>
        <div style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
          <p>💡 Try different search terms</p>
        </div>
      </div>
    `;

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  showToolsDirectory(tools) {
    console.log("Showing tools directory");

    const toolsHTML = `
      <div class="tools-directory-widget">
        <div class="tools-header">
          <h3>🛠️ Tools Directory</h3>
          <p>Quick access to useful third-party tools and utilities</p>
        </div>
        
        <div class="tools-grid" id="tools-grid">
          ${tools
            .map(
              (tool) => `
            <div class="tool-card" data-url="${tool.url}">
              <div class="tool-icon">🛠️</div>
              <div class="tool-content">
                <h4 class="tool-name">${tool.name}</h4>
                <p class="tool-description">${tool.description}</p>
                <span class="tool-category">${tool.category}</span>
              </div>
            </div>
          `
            )
            .join("")}
        </div>

        <div class="tools-actions">
          <button id="tools-back-btn" class="action-btn">← Back to Search</button>
        </div>
      </div>
    `;

    this.resultsContainer.innerHTML = toolsHTML;
    this.setupToolsDirectoryEvents();
  }

  setupToolsDirectoryEvents() {
    const toolCards = document.querySelectorAll(".tool-card");
    const backBtn = document.getElementById("tools-back-btn");

    // Add click handlers for tool cards
    toolCards.forEach((card) => {
      card.addEventListener("click", () => {
        const url = card.getAttribute("data-url");
        window.electronAPI.openExternal(url);
        window.electronAPI.hideWindow();
      });

      // Add hover effect
      card.addEventListener("mouseenter", () => {
        card.style.transform = "translateY(-2px)";
        card.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "translateY(0)";
        card.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
      });
    });

    // Back button
    backBtn.addEventListener("click", () => {
      // Emit custom event for back action
      this.resultsContainer.dispatchEvent(new CustomEvent("backToSearch"));
    });

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.resultsContainer.dispatchEvent(new CustomEvent("backToSearch"));
      }
    });
  }

  // Navigation methods
  navigateUp() {
    if (this.currentResults.length === 0) return;
    this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
    this.updateSelection(this.selectedIndex);
  }

  navigateDown() {
    if (this.currentResults.length === 0) return;
    this.selectedIndex = Math.min(
      this.selectedIndex + 1,
      this.currentResults.length - 1
    );
    this.updateSelection(this.selectedIndex);
  }

  selectCurrent() {
    if (this.currentResults.length > 0) {
      this.resultsContainer.dispatchEvent(
        new CustomEvent("resultSelected", {
          detail: { index: this.selectedIndex },
        })
      );
    }
  }

  // Getters
  getCurrentResults() {
    return this.currentResults;
  }

  getSelectedIndex() {
    return this.selectedIndex;
  }

  getSelectedResult() {
    return this.currentResults[this.selectedIndex];
  }
}
