// Import modules
import { EmojiPicker } from "./modules/emojiPicker.js";
import { SearchManager } from "./modules/SearchManager.js";
import { UIManager } from "./modules/UIManager.js";
import { FormManager } from "./modules/FormManager.js";
import { CommandHandler } from "./modules/CommandHandler.js";
import { EventManager } from "./modules/EventManager.js";
import { ClipboardManager } from "./modules/clipboardhistory/ClipboardManager.js";
import { ClipboardUI } from "./modules/clipboardhistory/ClipboardUI.js";
import { FileSearchManager } from "./modules/filesearch/FileSearchManager.js";
import { FileSearchUI } from "./modules/filesearch/FileSearchUI.js";

class CtrlSearch {
  constructor() {
    console.log("CtrlSearch constructor called");

    // UI elements
    this.searchInput = document.getElementById("searchInput");
    this.resultsContainer = document.getElementById("resultsContainer");

    console.log("Search input element:", this.searchInput);
    console.log("Results container element:", this.resultsContainer);

    // Initialize modules
    this.emojiPicker = new EmojiPicker();
    this.searchManager = new SearchManager();
    this.uiManager = new UIManager(this.resultsContainer);
    this.clipboardManager = new ClipboardManager();
    this.clipboardUI = new ClipboardUI(this.resultsContainer, this.clipboardManager);
    this.fileSearchManager = new FileSearchManager();
    this.fileSearchUI = new FileSearchUI(this.resultsContainer, this.fileSearchManager);
    this.formManager = new FormManager(
      this.resultsContainer,
      () => this.searchManager.loadData(), // onDataReload
      () => this.showEmptyStateAndFocus() // onBackToSearch
    );
    this.commandHandler = new CommandHandler(
      this.resultsContainer,
      this.emojiPicker,
      this.formManager,
      this.uiManager,
      this.searchManager
    );
    this.eventManager = new EventManager(
      this.searchInput,
      this.resultsContainer,
      (query) => this.handleSearch(query), // onSearch
      () => this.focusSearch(), // onFocusSearch
      () => window.electronAPI.hideWindow() // onHideWindow
    );

    this.setupCustomEventListeners();
    this.init();
  }

  async init() {
    await this.searchManager.loadData();
    this.focusSearch();
  }

  setupCustomEventListeners() {
    // Handle UI navigation events
    this.resultsContainer.addEventListener("navigateUp", () => {
      this.uiManager.navigateUp();
    });

    this.resultsContainer.addEventListener("navigateDown", () => {
      this.uiManager.navigateDown();
    });

    this.resultsContainer.addEventListener("selectCurrent", () => {
      this.uiManager.selectCurrent();
    });

    // Handle result selection
    this.resultsContainer.addEventListener("resultSelected", (e) => {
      const { index } = e.detail;
      this.commandHandler.selectResult(index, this.uiManager.getCurrentResults());
    });

    // Handle escape key
    this.resultsContainer.addEventListener("escapePressed", () => {
        if (this.emojiPicker.isInEmojiMode()) {
          this.exitEmojiMode();
      } else if (this.clipboardManager.isInClipboardHistoryMode()) {
        this.exitClipboardMode();
      } else if (this.fileSearchManager.isInFileMode()) {
        this.exitFileSearchMode();
        } else {
          window.electronAPI.hideWindow();
      }
    });

    // Handle emoji mode events
    this.resultsContainer.addEventListener("enterEmojiMode", () => {
      this.enterEmojiMode();
    });

    this.resultsContainer.addEventListener("exitEmojiMode", () => {
      this.exitEmojiMode();
    });

    // Handle back to search events
    this.resultsContainer.addEventListener("backToSearch", () => {
      this.showEmptyStateAndFocus();
    });

    // Handle reload complete
    this.resultsContainer.addEventListener("reloadComplete", () => {
      this.eventManager.clearSearchInput();
      this.showEmptyStateAndFocus();
    });

    // Handle clipboard mode events
    this.resultsContainer.addEventListener("enterClipboardMode", () => {
      this.enterClipboardMode();
    });

    this.resultsContainer.addEventListener("exitClipboardMode", () => {
      this.exitClipboardMode();
    });

    // Handle clipboard refresh
    this.resultsContainer.addEventListener("refreshClipboardHistory", () => {
      if (this.clipboardManager.isInClipboardHistoryMode()) {
        const query = this.eventManager.getSearchValue();
        const results = this.clipboardManager.searchClipboardHistory(query);
        this.clipboardUI.displayClipboardResults(results);
      }
    });

    // Handle file search mode events
    this.resultsContainer.addEventListener("enterFileSearchMode", () => {
      this.enterFileSearchMode();
    });

    this.resultsContainer.addEventListener("exitFileSearchMode", () => {
      this.exitFileSearchMode();
    });

    // Handle file search refresh
    this.resultsContainer.addEventListener("refreshFileSearch", () => {
      if (this.fileSearchManager.isInFileMode()) {
        const query = this.eventManager.getSearchValue();
        this.performFileSearch(query);
      }
    });
  }

  focusSearch() {
    this.eventManager.focusSearchInput();
  }

  handleSearch(query) {
    console.log("handleSearch called with query:", query);

    if (!query.trim()) {
      console.log("Empty query, showing empty state");
      if (this.emojiPicker.isInEmojiMode()) {
        const results = this.emojiPicker.showEmojiPickerInterface();
        this.uiManager.displayResults(results);
      } else if (this.clipboardManager.isInClipboardHistoryMode()) {
        const results = this.clipboardManager.searchClipboardHistory('');
        this.clipboardUI.displayClipboardResults(results);
      } else if (this.fileSearchManager.isInFileMode()) {
        this.fileSearchUI.showEmptyFileState();
      } else {
        this.uiManager.showEmptyState();
      }
      return;
    }

    // Check if user wants to enter file search mode
    if (query === ">" && !this.fileSearchManager.isInFileMode()) {
      console.log("Entering file search mode");
      this.enterFileSearchMode();
      return;
    }

    // If query starts with ">" and we're not in file search mode, enter file search mode with search
    if (query.startsWith(">") && !this.fileSearchManager.isInFileMode()) {
      console.log("Entering file search mode with search");
      this.enterFileSearchMode();
      const fileQuery = query.substring(1);
      if (fileQuery.trim()) {
        this.performFileSearch(fileQuery);
      }
      return;
    }

    // Check if user wants to enter clipboard mode
    if (query === "." && !this.clipboardManager.isInClipboardHistoryMode()) {
      console.log("Entering clipboard mode");
      this.enterClipboardMode();
      return;
    }

    // If query starts with "." and we're not in clipboard mode, enter clipboard mode with search
    if (query.startsWith(".") && !this.clipboardManager.isInClipboardHistoryMode()) {
      console.log("Entering clipboard mode with search");
      this.enterClipboardMode();
      const clipboardQuery = query.substring(1);
      const results = this.clipboardManager.searchClipboardHistory(clipboardQuery);
      this.clipboardUI.displayClipboardResults(results);
      return;
    }

    // Check if user wants to enter emoji mode
    if (query === ":" && !this.emojiPicker.isInEmojiMode()) {
      console.log("Entering emoji mode");
      this.enterEmojiMode();
      return;
    }

    // If query starts with ":" and we're not in emoji mode, enter emoji mode with search
    if (query.startsWith(":") && !this.emojiPicker.isInEmojiMode()) {
      console.log("Entering emoji mode with search");
      this.enterEmojiMode();
      const emojiQuery = query.substring(1);
      const results = this.emojiPicker.searchEmojisInPicker(emojiQuery);
      this.uiManager.displayResults(results);
      return;
    }

    // Handle file search when in file search mode
    if (this.fileSearchManager.isInFileMode()) {
      this.performFileSearch(query);
      return;
    }

    // Handle clipboard search when in clipboard mode
    if (this.clipboardManager.isInClipboardHistoryMode()) {
      const results = this.clipboardManager.searchClipboardHistory(query);
      this.clipboardUI.displayClipboardResults(results);
      return;
    }

    // Handle emoji search when in emoji mode
    if (this.emojiPicker.isInEmojiMode()) {
      const results = this.emojiPicker.searchEmojisInPicker(query);
      this.uiManager.displayResults(results);
      return;
    }

    console.log("Performing normal search");
    const results = this.searchManager.searchItems(query);
    this.uiManager.displayResults(results);
  }

  // Emoji mode methods
  enterEmojiMode() {
    this.eventManager.updateSearchPlaceholder("Search emojis... (ESC to go back)");
    this.eventManager.clearSearchInput();
    const results = this.emojiPicker.enterEmojiMode();
    this.uiManager.displayResults(results);
    this.focusSearch();
  }

  exitEmojiMode() {
    this.emojiPicker.exitEmojiMode();
    this.eventManager.updateSearchPlaceholder("Fuzzy search snippets, documents, bookmarks, and tools...");
    this.eventManager.clearSearchInput();
    this.showEmptyStateAndFocus();
  }

  // Clipboard mode methods
  enterClipboardMode() {
    this.eventManager.updateSearchPlaceholder("Search clipboard history... (ESC to go back)");
    this.eventManager.clearSearchInput();
    const results = this.clipboardManager.enterClipboardMode();
    this.clipboardUI.displayClipboardResults(results);
    this.focusSearch();
  }

  exitClipboardMode() {
    this.clipboardManager.exitClipboardMode();
    this.eventManager.updateSearchPlaceholder("Fuzzy search snippets, documents, bookmarks, and tools...");
    this.eventManager.clearSearchInput();
    this.showEmptyStateAndFocus();
  }

  // File search mode methods
  enterFileSearchMode() {
    this.eventManager.updateSearchPlaceholder("Search files and folders... (ESC to go back)");
    this.eventManager.clearSearchInput();
    this.fileSearchManager.enterFileSearchMode();
    this.fileSearchUI.showEmptyFileState();
    this.focusSearch();
  }

  exitFileSearchMode() {
    this.fileSearchManager.exitFileSearchMode();
    this.eventManager.updateSearchPlaceholder("Fuzzy search snippets, documents, bookmarks, and tools...");
    this.eventManager.clearSearchInput();
    this.showEmptyStateAndFocus();
  }

  async performFileSearch(query) {
    if (!query || query.trim().length < 2) {
      this.fileSearchUI.showEmptyFileState();
      return;
    }

    // Show loading state
    this.fileSearchUI.showFileSearchLoading();

    try {
      const results = await this.fileSearchManager.searchFiles(query.trim());
      this.fileSearchUI.displayFileResults(results);
    } catch (error) {
      console.error("File search error:", error);
      this.fileSearchUI.showEmptyFileState();
    }
  }

  // Helper methods
  showEmptyStateAndFocus() {
    this.uiManager.showEmptyState();
    this.focusSearch();
  }
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded, initializing CtrlSearch...");
  try {
    new CtrlSearch();
  } catch (error) {
    console.error("Error initializing CtrlSearch:", error);
  }
});