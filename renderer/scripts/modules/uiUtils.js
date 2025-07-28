// UI utilities module
export class UIUtils {
  constructor(resultsContainer) {
    this.resultsContainer = resultsContainer;
  }

  // Display search results
  displayResults(results, selectedIndex = 0) {
    if (results.length === 0) {
      this.showNoResults();
      return;
    }

    const html = results
      .map((result, index) => this.createResultItemHTML(result, index))
      .join("");

    this.resultsContainer.innerHTML = html;
    this.addClickHandlers(results);
    this.updateSelection(selectedIndex);

    // Re-initialize Lucide icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  // Create HTML for a single result item
  createResultItemHTML(result, index) {
    const icon = this.getResultIcon(result.type);
    const activeClass = result.active ? "active" : "";

    // Special handling for dropdown items
    if (result.type === "dropdown") {
      return `
        <div class="result-item dropdown-item ${activeClass}" data-index="${index}">
          <i data-lucide="${icon}" class="result-icon"></i>
          <div class="result-content">
            <div class="result-title">${result.title}</div>
            <div class="result-subtitle">${result.subtitle}</div>
          </div>
          <i data-lucide="chevron-down" class="dropdown-indicator"></i>
        </div>
      `;
    }

    // Special handling for emoji items to make them larger
    if (result.type === "emoji") {
      return `
        <div class="result-item emoji-item ${activeClass}" data-index="${index}">
          <div class="emoji-display">${result.data.emoji}</div>
          <div class="result-content">
            <div class="result-title">${result.data.name}</div>
            <div class="result-subtitle">${result.subtitle}</div>
          </div>
          <span class="result-type ${result.type}">emoji</span>
        </div>
      `;
    }

    return `
      <div class="result-item ${activeClass}" data-index="${index}">
        <i data-lucide="${icon}" class="result-icon"></i>
        <div class="result-content">
          <div class="result-title">${result.title}</div>
          <div class="result-subtitle">${result.subtitle}</div>
        </div>
        <span class="result-type ${result.type}">${result.type}</span>
      </div>
    `;
  }

  // Get appropriate icon for result type
  getResultIcon(type) {
    const iconMap = {
      snippet: "code",
      document: "file",
      bookmark: "bookmark",
      emoji: "smile",
      filter: "filter",
      dropdown: "folder",
      "emoji-category": "folder",
      system: "settings",
    };

    return iconMap[type] || "file-text";
  }

  // Add click handlers to result items
  addClickHandlers(results) {
    this.resultsContainer.querySelectorAll(".result-item").forEach((item) => {
      item.addEventListener("click", () => {
        const index = parseInt(item.dataset.index);
        const event = new CustomEvent("resultSelected", {
          detail: { index, result: results[index] },
        });
        document.dispatchEvent(event);
      });
    });
  }

  // Update selection highlight
  updateSelection(selectedIndex) {
    const items = this.resultsContainer.querySelectorAll(".result-item");
    items.forEach((item, index) => {
      item.classList.toggle("selected", index === selectedIndex);
    });

    // Scroll selected item into view
    const selectedItem = items[selectedIndex];
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: "nearest" });
    }
  }

  // Show empty state
  showEmptyState(isEmojiMode = false) {
    const emojiHint = isEmojiMode
      ? `<div style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
          <p>🎨 Browse all emojis or use filters above</p>
          <p>🔍 Search for specific emojis by typing</p>
        </div>`
      : `<div style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
          <p>💡 Type ":" to browse emoji categories</p>
          <p>🔍 Search for emojis like "smile", "heart", or symbols like "₹"</p>
        </div>`;

    this.resultsContainer.innerHTML = `
      <div class="empty-state">
        <i data-lucide="search" class="empty-icon"></i>
        <p>${
          isEmojiMode ? "All emojis loaded!" : "Start typing to search..."
        }</p>
        ${emojiHint}
      </div>
    `;

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  // Show no results state
  showNoResults() {
    this.resultsContainer.innerHTML = `
      <div class="empty-state">
        <i data-lucide="search-x" class="empty-icon"></i>
        <p>No results found</p>
        <div style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
          <p>💡 Try different search terms or browse emoji categories</p>
        </div>
      </div>
    `;

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  // Clear results
  clearResults() {
    this.resultsContainer.innerHTML = "";
  }
}
