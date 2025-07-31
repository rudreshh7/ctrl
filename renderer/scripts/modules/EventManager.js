/**
 * EventManager - Handles all event listeners and keyboard shortcuts
 * Responsibilities:
 * - Keyboard event handling
 * - Global shortcuts
 * - Search input events
 * - Custom event coordination
 */
export class EventManager {
  constructor(searchInput, resultsContainer, onSearch, onFocusSearch, onHideWindow) {
    this.searchInput = searchInput;
    this.resultsContainer = resultsContainer;
    this.onSearch = onSearch;
    this.onFocusSearch = onFocusSearch;
    this.onHideWindow = onHideWindow;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    console.log("Setting up event listeners");

    // Search input events
    this.searchInput.addEventListener("input", (e) => {
      console.log("Input event triggered:", e.target.value);
      this.onSearch(e.target.value);
    });

    this.searchInput.addEventListener("keydown", (e) => {
      this.handleSearchKeyDown(e);
    });

    // Global keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      this.handleGlobalKeyDown(e);
    });

    // Listen for messages from apps (like sum calculator)
    window.addEventListener("message", (e) => {
      if (e.data && e.data.action === "focusSearch") {
        this.onFocusSearch();
      }
    });

    console.log("Event listeners setup complete");
  }

  handleSearchKeyDown(e) {
    console.log("Search key down:", e.key);
    
    // Emit custom event for search navigation
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this.resultsContainer.dispatchEvent(
          new CustomEvent("navigateDown")
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        this.resultsContainer.dispatchEvent(
          new CustomEvent("navigateUp")
        );
        break;
      case "Enter":
        e.preventDefault();
        this.resultsContainer.dispatchEvent(
          new CustomEvent("selectCurrent")
        );
        break;
    }
  }

  handleGlobalKeyDown(e) {
    console.log("Global key pressed:", e.key);
    
    if (e.key === "Escape") {
      // Check if we're in emoji mode or any special state
      this.resultsContainer.dispatchEvent(
        new CustomEvent("escapePressed")
      );
    } else if (e.key === "," && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      window.electronAPI.openSettings();
    } else if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      this.onFocusSearch();
    }
  }

  // Method to update search input placeholder
  updateSearchPlaceholder(placeholder) {
    this.searchInput.placeholder = placeholder;
  }

  // Method to clear search input
  clearSearchInput() {
    this.searchInput.value = "";
  }

  // Method to get current search value
  getSearchValue() {
    return this.searchInput.value;
  }

  // Method to set search value
  setSearchValue(value) {
    this.searchInput.value = value;
  }

  // Method to focus search input
  focusSearchInput() {
    setTimeout(() => {
      this.searchInput.focus();
      this.searchInput.select();
    }, 100);
  }
}