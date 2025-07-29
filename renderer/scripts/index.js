// Import modules
import { EmojiPicker } from "./modules/emojiPicker.js";
import { showHelpDialog } from "./modules/utils/utils.js";
import { handleGoogleSearch } from "./modules/utils/googleSearch.js";
import { handleChatGPTSearch } from "./modules/utils/chatgptSearch.js";
import { showSumCalculator } from "./modules/utils/sum.js";
import { showWeatherDialog } from "./modules/utils/weather.js";
import { showDogDialog } from "./modules/utils/fun/dog.js";
import { showCatDialog } from "./modules/utils/fun/cat.js";
class CtrlSearch {
  constructor() {
    console.log("CtrlSearch constructor called");

  

    this.snippets = [];
    this.documents = [];
    this.bookmarks = [];
    this.tools = [];
    this.currentResults = [];
    this.selectedIndex = 0;

    // Initialize modules
    this.emojiPicker = new EmojiPicker();

    // UI elements
    this.searchInput = document.getElementById("searchInput");
    this.resultsContainer = document.getElementById("resultsContainer");

    console.log("Search input element:", this.searchInput);
    console.log("Results container element:", this.resultsContainer);

    // Event listeners
    this.setupEventListeners();

    this.init();
  }

  async init() {
    await this.loadData();
    this.focusSearch();
  }

 async loadData() {
    try {
      console.log("Loading data...");
      this.snippets = await window.electronAPI.getSnippets();
      this.documents = await window.electronAPI.getDocuments();
      this.bookmarks = await window.electronAPI.getBookmarks();
      this.tools = await window.electronAPI.getTools();

      console.log("Data loaded:", {
        snippets: this.snippets.length,
        documents: this.documents.length,
        bookmarks: this.bookmarks.length,
        tools: this.tools.length,
      });

      if (this.snippets.length > 0) {
        console.log("Sample snippet:", this.snippets[0]);
      }

      // Initialize Fuse.js for search
      this.initializeFuse();
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  }

  initializeFuse() {
    console.log("Initializing Fuse.js...");

    // Check if Fuse is available
    if (typeof Fuse === "undefined") {
      console.error("Fuse.js is not loaded!");
      return;
    }

    console.log("Fuse.js is available");

    // Enhanced Fuse options for better search
    const options = {
      keys: [
        { name: "content", weight: 0.7 },
        { name: "title", weight: 0.8 },
        { name: "name", weight: 0.8 }, // For tools
        { name: "url", weight: 0.4 },
        { name: "link", weight: 0.4 },
        { name: "description", weight: 0.5 },
        { name: "keywords", weight: 0.6 }, // For tools
        { name: "category", weight: 0.3 }, // For tools
      ],
      threshold: 0.6, // More lenient for fuzzy matching
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 1, // Allow single character searches
      distance: 100, // Allow matches further apart
      location: 0, // Prefer matches at the beginning
      shouldSort: true,
      ignoreLocation: false,
      ignoreFieldNorm: false,
      fieldNormWeight: 1,
    };

    try {
      // Create combined data for search
      const allData = [
        ...this.snippets.map((item) => ({ ...item, type: "snippet" })),
        ...this.documents.map((item) => ({ ...item, type: "document" })),
        ...this.bookmarks.map((item) => ({ ...item, type: "bookmark" })),
        ...this.tools.map((item) => ({ ...item, type: "tool" })),
      ];

      this.fuse = new Fuse(allData, options);
      console.log(
        "Fuse.js initialized successfully with",
        allData.length,
        "items"
      );
    } catch (error) {
      console.error("Error creating Fuse.js instance:", error);
    }
  }

  setupEventListeners() {
    console.log("Setting up event listeners");

    // Search input events
    this.searchInput.addEventListener("input", (e) => {
      console.log("Input event triggered:", e.target.value);
      this.handleSearch(e.target.value);
    });

    this.searchInput.addEventListener("keydown", (e) => {
      this.handleKeyDown(e);
    });

    // Global keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      console.log("Key pressed:", e.key);
      if (e.key === "Escape") {
        if (this.emojiPicker.isInEmojiMode()) {
          e.preventDefault();
          this.exitEmojiMode();
        } else {
          console.log("Hiding window");
          window.electronAPI.hideWindow();
        }
      } else if (e.key === "," && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        window.electronAPI.openSettings();
      } else if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        this.focusSearch();
      }
    });

    // Listen for messages from apps (like sum calculator)
    window.addEventListener("message", (e) => {
      if (e.data && e.data.action === "focusSearch") {
        this.focusSearch();
      }
    });

    console.log("Event listeners setup complete");
  }

  focusSearch() {
    setTimeout(() => {
      this.searchInput.focus();
      this.searchInput.select();
    }, 100);
  }

  handleSearch(query) {
    console.log("handleSearch called with query:", query);

    if (!query.trim()) {
      console.log("Empty query, showing empty state");
      if (this.emojiPicker.isInEmojiMode()) {
        const results = this.emojiPicker.showEmojiPickerInterface();
        this.displayResults(results);
      } else {
        this.showEmptyState();
      }
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
      this.displayResults(results);
      return;
    }

    console.log("Performing normal search");
    const results = this.searchItems(query);
    this.displayResults(results);
  }

  searchItems(query) {
    console.log("searchItems called with query:", query);

    // If in emoji mode, search emojis
    if (this.emojiPicker.isInEmojiMode()) {
      return this.emojiPicker.searchEmojisInPicker(query);
    }

    const results = [];
    const lowerQuery = query.toLowerCase().trim();

    // Smart system commands - instant matching with single letters
    const systemCommands = this.getSystemCommands(lowerQuery);
    results.push(...systemCommands);

    // Search with Fuse.js for content (even with single character)
    if (this.fuse && query.length >= 1) {
      console.log("Searching with Fuse.js for:", query);
      const fuseResults = this.fuse.search(query);
      console.log("Fuse results:", fuseResults.length);

      fuseResults.forEach((result) => {
        const item = result.item;
        results.push({
          type: item.type,
          id: item.id,
          title:
            item.type === "snippet"
              ? item.title || this.getSnippetPreview(item.content)
              : item.type === "tool"
              ? item.name
              : item.title || item.content,
          subtitle:
            item.type === "snippet"
              ? item.description || item.content
              : item.type === "document"
              ? item.link
              : item.type === "tool"
              ? item.description
              : item.url || item.description,
          data: item,
          score: result.score,
        });
      });
    }

    // Add external search options at the bottom (lower priority)
    if (query.trim().length > 0) {
      results.push({
        type: "system",
        id: "google-search",
        title: `🔍 Search Google for "${query.trim()}"`,
        subtitle: `Open Google search in your default browser`,
        data: { searchQuery: query.trim() },
        score: 10, // Lower priority - appears at bottom
      });

      // Add ChatGPT search option
      results.push({
        type: "system",
        id: "chatgpt-search",
        title: `🤖 Ask ChatGPT about "${query.trim()}"`,
        subtitle: `Open ChatGPT with your question in the default browser`,
        data: { searchQuery: query.trim() },
        score: 11, // Lowest priority - appears last
      });
    }

    console.log("Total results:", results.length);
    return results.sort((a, b) => (a.score || 0) - (b.score || 0));
  }

  getSystemCommands(query) {
    const commands = [];

    // Smart shortcuts for common commands
    const shortcuts = [
      {
        triggers: [
          "s",
          "set",
          "setting",
          "settings",
          "config",
          "configuration",
          "pref",
          "preferences",
        ],
        command: {
          type: "system",
          id: "settings",
          title: "Settings",
          subtitle: "Open Ctrl settings and preferences",
          score: -1, // High priority
        },
      },
      {
        triggers: ["e", "emoji", "emojis", ":"],
        command: {
          type: "system",
          id: "emoji",
          title: "Emoji Picker",
          subtitle: "Browse and search emojis",
          score: -1,
        },
      },
      {
        triggers: ["h", "help", "?"],
        command: {
          type: "system",
          id: "help",
          title: "Help",
          subtitle: "Show keyboard shortcuts and help",
          score: -1,
        },
      },
      {
        triggers: ["c", "cat", "cats"],
        command:{
          type:"system",
          id:"cat",
          title:"Random Cat",
          subtitle:"Show a random cat image",
          score: -1,
        },

      },
      
      {
        triggers: ["d", "dog", "dogs"],
        command: {
          type: "system",
          id: "dog",
          title: "Random Dog",
          subtitle: "Show a random dog image",
          score: -1,
        },
      },
        {
        triggers: ["w", "weather", "?"],
        command: {
          type: "system",
          id: "weather",
          title: "Weather",
          subtitle: "Show current weather information",
          score: -1,
        },
      },
      {
        triggers: ["q", "quit", "exit"],
        command: {
          type: "system",
          id: "quit",
          title: "Quit",
          subtitle: "Exit Ctrl application",
          score: -1,
        },
      },
      {
        triggers: ["r", "reload", "refresh"],
        command: {
          type: "system",
          id: "reload",
          title: "Reload",
          subtitle: "Reload application data",
          score: -1,
        },
      },
      {
        triggers: ["sum", "calc", "calculator", "math", "add", "addition"],
        command: {
          type: "system",
          id: "sum",
          title: "Sum Calculator",
          subtitle: "Calculate sum of numbers",
          score: -1,
        },
      },
      {
        triggers: ["add-snippet", "new-snippet", "snippet", "create-snippet"],
        command: {
          type: "system",
          id: "add-snippet",
          title: "Add Snippet",
          subtitle: "Create a new code snippet",
          score: -1,
        },
      },
      {
        triggers: [
          "add-document",
          "new-document",
          "document",
          "create-document",
        ],
        command: {
          type: "system",
          id: "add-document",
          title: "Add Document",
          subtitle: "Create a new document link",
          score: -1,
        },
      },
      {
        triggers: [
          "add-bookmark",
          "new-bookmark",
          "bookmark",
          "create-bookmark",
        ],
        command: {
          type: "system",
          id: "add-bookmark",
          title: "Add Bookmark",
          subtitle: "Create a new website bookmark",
          score: -1,
        },
      },
      {
        triggers: ["tools", "tool", "utility", "utilities"],
        command: {
          type: "system",
          id: "tools",
          title: "Browse Tools",
          subtitle: "View all available third-party tools",
          score: -1,
        },
      },
    ];

    // Check for exact matches and partial matches
    shortcuts.forEach((shortcut) => {
      const exactMatch = shortcut.triggers.includes(query);
      const partialMatch = shortcut.triggers.some(
        (trigger) => trigger.toLowerCase().startsWith(query) && query.length > 0
      );

      if (exactMatch || partialMatch) {
        // Boost score for exact matches
        const command = { ...shortcut.command };
        if (exactMatch) {
          command.score = -10; // Very high priority for exact matches
          command.title = `★ ${command.title}`;
        }
        commands.push(command);
      }
    });

    return commands;
  }

  getSnippetPreview(content) {
    return content.length > 50 ? content.substring(0, 50) + "..." : content;
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
        this.selectResult(index);
      });
    });
  }

  handleKeyDown(e) {
    console.log("Key down:", e.key);
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this.selectedIndex = Math.min(
          this.selectedIndex + 1,
          this.currentResults.length - 1
        );
        this.updateSelection(this.selectedIndex);
        break;
      case "ArrowUp":
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.updateSelection(this.selectedIndex);
        break;
      case "Enter":
        e.preventDefault();
        if (this.currentResults.length > 0) {
          this.selectResult(this.selectedIndex);
        }
        break;
    }
  }

  updateSelection(selectedIndex) {
    const items = this.resultsContainer.querySelectorAll(".result-item");
    items.forEach((item, index) => {
      item.classList.toggle("selected", index === selectedIndex);
    });

    const selectedItem = items[selectedIndex];
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: "nearest" });
    }
  }

  async selectResult(index) {
    const result = this.currentResults[index];
    if (!result) return;

    console.log("Selecting result:", result);

    if (result.type === "emoji") {
      const copyResult = await this.emojiPicker.selectEmoji(result.data);
      if (copyResult.success) {
        console.log(copyResult.message);
      }
      return;
    } else if (result.type === "system") {
      await this.handleSystemCommand(result.id, result);
      return;
    } else if (result.type === "snippet") {
      await navigator.clipboard.writeText(result.data.content);
    } else if (result.type === "document") {
      window.electronAPI.openExternal(result.data.link);
    } else if (result.type === "bookmark") {
      window.electronAPI.openExternal(result.data.url);
    } else if (result.type === "tool") {
      window.electronAPI.openExternal(result.data.url);
    }

    window.electronAPI.hideWindow();
  }

  async handleSystemCommand(commandId, result = null) {
    console.log("Handling system command:", commandId);

    switch (commandId) {
      case "back":
        this.exitEmojiMode();
        break;

      case "settings":
        await window.electronAPI.openSettings();
        window.electronAPI.hideWindow();
        break;

      case "emoji":
        this.enterEmojiMode();
        break;

      case "help":
        showHelpDialog(this.resultsContainer);
        break;

      case "dog":
        showDogDialog(this.resultsContainer);
        break;

      case "cat":
        showCatDialog(this.resultsContainer);
        break;

      case "weather":
        showWeatherDialog(this.resultsContainer);
        break;

      case "quit":
        window.electronAPI.quitApp();
        break;

      case "reload":
        await this.loadData();
        this.searchInput.value = "";
        this.showEmptyState();
        this.focusSearch();
        break;

      case "sum":
        showSumCalculator(this.resultsContainer, () => {
          this.showEmptyState();
          this.focusSearch();
        });
        break

      case "add-snippet":
        this.openAddSnippetApp();
        break;

      case "add-document":
        this.openAddDocumentApp();
        break;

      case "add-bookmark":
        this.openAddBookmarkApp();
        break;

      case "tools":
        this.showToolsDirectory();
        break;

      case "google-search":
        await handleGoogleSearch(result?.data?.searchQuery);
        break;

      case "chatgpt-search":
        await handleChatGPTSearch(result?.data?.searchQuery);
        break;

      default:
        console.log("Unknown system command:", commandId);
    }
  }

  openAddSnippetApp() {
    console.log("Opening Add Snippet form");
    this.showAddSnippetForm();
  }

  openAddDocumentApp() {
    console.log("Opening Add Document form");
    this.showAddDocumentForm();
  }

  openAddBookmarkApp() {
    console.log("Opening Add Bookmark form");
    this.showAddBookmarkForm();
  }

 

  showToolsDirectory() {
    console.log("Showing tools directory");
    
    const toolsHTML = `
      <div class="tools-directory-widget">
        <div class="tools-header">
          <h3>🛠️ Tools Directory</h3>
          <p>Quick access to useful third-party tools and utilities</p>
        </div>
        
        <div class="tools-grid" id="tools-grid">
          ${this.tools.map(tool => `
            <div class="tool-card" data-url="${tool.url}">
              <div class="tool-icon">🛠️</div>
              <div class="tool-content">
                <h4 class="tool-name">${tool.name}</h4>
                <p class="tool-description">${tool.description}</p>
                <span class="tool-category">${tool.category}</span>
              </div>
            </div>
          `).join('')}
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
    const toolCards = document.querySelectorAll('.tool-card');
    const backBtn = document.getElementById('tools-back-btn');

    // Add click handlers for tool cards
    toolCards.forEach(card => {
      card.addEventListener('click', () => {
        const url = card.getAttribute('data-url');
        window.electronAPI.openExternal(url);
        window.electronAPI.hideWindow();
      });

      // Add hover effect
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
      });
    });

    // Back button
    backBtn.addEventListener('click', () => {
      this.showEmptyState();
      this.focusSearch();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.showEmptyState();
        this.focusSearch();
      }
    });
  }

showAddSnippetForm() {
  const addSnippetHTML = `
    <div class="add-form-widget">
      <div class="form-content">
        <input 
          type="text" 
          id="snippet-title" 
          class="form-input" 
          placeholder="Title *"
          required
        />

        <input 
          type="text" 
          id="snippet-description" 
          class="form-input" 
          placeholder="Description (optional)"
        />

        <textarea 
          id="snippet-content" 
          class="form-textarea" 
          placeholder="Your code *" 
          rows="6"
          required
        ></textarea>
      </div>

      <div class="form-actions">
        <button id="save-snippet-btn" class="action-btn primary">Save</button>
        <button id="clear-snippet-btn" class="action-btn">Clear</button>
        <button id="back-snippet-btn" class="action-btn">Back</button>
      </div>

      <div id="snippet-status" class="status-message hidden"></div>
    </div>
  `;

  this.resultsContainer.innerHTML = addSnippetHTML;
  this.setupAddSnippetEvents();

  setTimeout(() => {
    document.getElementById("snippet-title").focus();
  }, 100);
}


  setupAddSnippetEvents() {
    const titleInput = document.getElementById("snippet-title");
    const descriptionInput = document.getElementById("snippet-description");
    const contentTextarea = document.getElementById("snippet-content");
    const saveBtn = document.getElementById("save-snippet-btn");
    const clearBtn = document.getElementById("clear-snippet-btn");
    const backBtn = document.getElementById("back-snippet-btn");

    // Save button
    saveBtn.addEventListener("click", () => this.saveSnippet());

    // Clear button
    clearBtn.addEventListener("click", () => this.clearSnippetForm());

    // Back button
    backBtn.addEventListener("click", () => this.exitAddForm());

    // Keyboard shortcuts for all inputs
    [titleInput, descriptionInput, contentTextarea].forEach((input) => {
      input.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          this.saveSnippet();
        } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          this.saveSnippet();
        } else if (e.key === "Escape") {
          this.exitAddForm();
        }
      });
    });
  }

  async saveSnippet() {
    const titleInput = document.getElementById("snippet-title");
    const descriptionInput = document.getElementById("snippet-description");
    const contentTextarea = document.getElementById("snippet-content");
    const saveBtn = document.getElementById("save-snippet-btn");
    const statusDiv = document.getElementById("snippet-status");

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const content = contentTextarea.value.trim();

    // Debug logging
    console.log("Index saveSnippet - captured values:", {
      title,
      description,
      content,
    });

    if (!title) {
      this.showFormMessage(
        "snippet-status",
        "Please enter snippet title",
        "error"
      );
      titleInput.focus();
      return;
    }

    if (!content) {
      this.showFormMessage(
        "snippet-status",
        "Please enter snippet content",
        "error"
      );
      contentTextarea.focus();
      return;
    }

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = "💾 Saving...";

      // Save to database using Electron API
      const result = await window.electronAPI.addSnippet(
        title,
        description,
        content
      );

      if (result.success) {
        this.showFormMessage(
          "snippet-status",
          "Snippet saved successfully! 🎉",
          "success"
        );

        // Reload data to update search
        await this.loadData();

        // Clear form after successful save
        setTimeout(() => {
          this.clearSnippetForm();
        }, 1500);
      } else {
        this.showFormMessage(
          "snippet-status",
          `Failed to save: ${result.error}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Failed to save snippet:", error);
      this.showFormMessage(
        "snippet-status",
        "Failed to save snippet. Please try again.",
        "error"
      );
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "💾 Save Snippet";
    }
  }

  clearSnippetForm() {
    const titleInput = document.getElementById("snippet-title");
    const descriptionInput = document.getElementById("snippet-description");
    const contentTextarea = document.getElementById("snippet-content");

    titleInput.value = "";
    descriptionInput.value = "";
    contentTextarea.value = "";
    this.hideFormMessage("snippet-status");
    titleInput.focus();
  }

  showAddDocumentForm() {
    const addDocumentHTML = `
      <div class="add-form-widget">
        <div class="form-header">
          <h3>📄 Add Document</h3>
          <p>Save document links for quick access</p>
        </div>
        
        <div class="form-content">
          <div class="form-group">
            <label for="document-title">Document Title *</label>
            <input 
              type="text" 
              id="document-title" 
              class="form-input" 
              placeholder="e.g., Project Requirements, API Documentation"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="document-link">Document Link *</label>
            <input 
              type="url" 
              id="document-link" 
              class="form-input" 
              placeholder="https://example.com/document.pdf"
              required
            />
          </div>
        </div>

        <div class="form-actions">
          <button id="save-document-btn" class="action-btn primary">💾 Save Document</button>
          <button id="clear-document-btn" class="action-btn">🗑️ Clear</button>
          <button id="back-document-btn" class="action-btn">← Back</button>
        </div>
        
        <div id="document-status" class="status-message hidden"></div>
      </div>
    `;

    this.resultsContainer.innerHTML = addDocumentHTML;
    this.setupAddDocumentEvents();

    // Focus the title input
    setTimeout(() => {
      document.getElementById("document-title").focus();
    }, 100);
  }

  setupAddDocumentEvents() {
    const titleInput = document.getElementById("document-title");
    const linkInput = document.getElementById("document-link");
    const saveBtn = document.getElementById("save-document-btn");
    const clearBtn = document.getElementById("clear-document-btn");
    const backBtn = document.getElementById("back-document-btn");

    // Save button
    saveBtn.addEventListener("click", () => this.saveDocument());

    // Clear button
    clearBtn.addEventListener("click", () => this.clearDocumentForm());

    // Back button
    backBtn.addEventListener("click", () => this.exitAddForm());

    // Keyboard shortcuts for both inputs
    [titleInput, linkInput].forEach((input) => {
      input.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          this.saveDocument();
        } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          this.saveDocument();
        } else if (e.key === "Escape") {
          this.exitAddForm();
        }
      });
    });
  }

  async saveDocument() {
    const titleInput = document.getElementById("document-title");
    const linkInput = document.getElementById("document-link");
    const saveBtn = document.getElementById("save-document-btn");

    const title = titleInput.value.trim();
    const link = linkInput.value.trim();

    if (!title) {
      this.showFormMessage(
        "document-status",
        "Please enter document title",
        "error"
      );
      titleInput.focus();
      return;
    }

    if (!link) {
      this.showFormMessage(
        "document-status",
        "Please enter document link",
        "error"
      );
      linkInput.focus();
      return;
    }

    // Basic URL validation
    try {
      new URL(link);
    } catch (error) {
      this.showFormMessage(
        "document-status",
        "Please enter a valid URL",
        "error"
      );
      linkInput.focus();
      return;
    }

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = "💾 Saving...";

      // Save to database using Electron API (matches database schema: title, link)
      const result = await window.electronAPI.addDocument(title, link);

      if (result.success) {
        this.showFormMessage(
          "document-status",
          "Document saved successfully! 🎉",
          "success"
        );

        // Reload data to update search
        await this.loadData();

        // Clear form after successful save
        setTimeout(() => {
          this.clearDocumentForm();
        }, 1500);
      } else {
        this.showFormMessage(
          "document-status",
          `Failed to save: ${result.error}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Failed to save document:", error);
      this.showFormMessage(
        "document-status",
        "Failed to save document. Please try again.",
        "error"
      );
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "💾 Save Document";
    }
  }

  clearDocumentForm() {
    const titleInput = document.getElementById("document-title");
    const linkInput = document.getElementById("document-link");

    titleInput.value = "";
    linkInput.value = "";
    this.hideFormMessage("document-status");
    titleInput.focus();
  }

  showAddBookmarkForm() {
    const addBookmarkHTML = `
      <div class="add-form-widget">
        <div class="form-header">
          <h3>🔖 Add Bookmark</h3>
          <p>Save website bookmarks for quick access</p>
        </div>
        
        <div class="form-content">
          <div class="form-group">
            <label for="bookmark-title">Bookmark Title *</label>
            <input 
              type="text" 
              id="bookmark-title" 
              class="form-input" 
              placeholder="e.g., GitHub, Stack Overflow, Documentation"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="bookmark-url">Website URL *</label>
            <input 
              type="url" 
              id="bookmark-url" 
              class="form-input" 
              placeholder="https://example.com"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="bookmark-description">Description (Optional)</label>
            <textarea 
              id="bookmark-description" 
              class="form-textarea" 
              placeholder="Brief description of this bookmark..."
              rows="3"
            ></textarea>
          </div>
        </div>

        <div class="form-actions">
          <button id="save-bookmark-btn" class="action-btn primary">💾 Save Bookmark</button>
          <button id="clear-bookmark-btn" class="action-btn">🗑️ Clear</button>
          <button id="back-bookmark-btn" class="action-btn">← Back</button>
        </div>
        
        <div id="bookmark-status" class="status-message hidden"></div>
      </div>
    `;

    this.resultsContainer.innerHTML = addBookmarkHTML;
    this.setupAddBookmarkEvents();

    // Focus the title input
    setTimeout(() => {
      document.getElementById("bookmark-title").focus();
    }, 100);
  }

  setupAddBookmarkEvents() {
    const titleInput = document.getElementById("bookmark-title");
    const urlInput = document.getElementById("bookmark-url");
    const descriptionTextarea = document.getElementById("bookmark-description");
    const saveBtn = document.getElementById("save-bookmark-btn");
    const clearBtn = document.getElementById("clear-bookmark-btn");
    const backBtn = document.getElementById("back-bookmark-btn");

    // Save button
    saveBtn.addEventListener("click", () => this.saveBookmark());

    // Clear button
    clearBtn.addEventListener("click", () => this.clearBookmarkForm());

    // Back button
    backBtn.addEventListener("click", () => this.exitAddForm());

    // Keyboard shortcuts for all inputs
    [titleInput, urlInput, descriptionTextarea].forEach((input) => {
      input.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          this.saveBookmark();
        } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          this.saveBookmark();
        } else if (e.key === "Escape") {
          this.exitAddForm();
        }
      });
    });
  }

  async saveBookmark() {
    const titleInput = document.getElementById("bookmark-title");
    const urlInput = document.getElementById("bookmark-url");
    const descriptionTextarea = document.getElementById("bookmark-description");
    const saveBtn = document.getElementById("save-bookmark-btn");

    const title = titleInput.value.trim();
    const url = urlInput.value.trim();
    const description = descriptionTextarea.value.trim();

    if (!title) {
      this.showFormMessage(
        "bookmark-status",
        "Please enter bookmark title",
        "error"
      );
      titleInput.focus();
      return;
    }

    if (!url) {
      this.showFormMessage(
        "bookmark-status",
        "Please enter website URL",
        "error"
      );
      urlInput.focus();
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (error) {
      this.showFormMessage(
        "bookmark-status",
        "Please enter a valid URL",
        "error"
      );
      urlInput.focus();
      return;
    }

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = "💾 Saving...";

      // Save to database using Electron API (matches database schema: title, url, description)
      const result = await window.electronAPI.addBookmark(
        title,
        url,
        description
      );

      if (result.success) {
        this.showFormMessage(
          "bookmark-status",
          "Bookmark saved successfully! 🎉",
          "success"
        );

        // Reload data to update search
        await this.loadData();

        // Clear form after successful save
        setTimeout(() => {
          this.clearBookmarkForm();
        }, 1500);
      } else {
        this.showFormMessage(
          "bookmark-status",
          `Failed to save: ${result.error}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Failed to save bookmark:", error);
      this.showFormMessage(
        "bookmark-status",
        "Failed to save bookmark. Please try again.",
        "error"
      );
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "💾 Save Bookmark";
    }
  }

  clearBookmarkForm() {
    const titleInput = document.getElementById("bookmark-title");
    const urlInput = document.getElementById("bookmark-url");
    const descriptionTextarea = document.getElementById("bookmark-description");

    titleInput.value = "";
    urlInput.value = "";
    descriptionTextarea.value = "";
    this.hideFormMessage("bookmark-status");
    titleInput.focus();
  }

  exitAddForm() {
    this.showEmptyState();
    this.focusSearch();
  }

  showFormMessage(elementId, message, type) {
    const statusElement = document.getElementById(elementId);
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = `status-message ${type}`;
      statusElement.classList.remove("hidden");

      // Auto-hide success messages
      if (type === "success") {
        setTimeout(() => {
          this.hideFormMessage(elementId);
        }, 3000);
      }
    }
  }

  hideFormMessage(elementId) {
    const statusElement = document.getElementById(elementId);
    if (statusElement) {
      statusElement.classList.add("hidden");
    }
  }

  enterEmojiMode() {
    this.searchInput.placeholder = "Search emojis... (ESC to go back)";
    this.searchInput.value = "";
    const results = this.emojiPicker.enterEmojiMode();
    this.displayResults(results);
    this.focusSearch();
  }

  exitEmojiMode() {
    this.emojiPicker.exitEmojiMode();
    this.searchInput.placeholder =
      "Fuzzy search snippets, documents, bookmarks, and tools...";
    this.searchInput.value = "";
    this.showEmptyState();
    this.focusSearch();
  }

  showEmptyState() {
    this.resultsContainer.innerHTML = `
      <div class="empty-state">
        <i data-lucide="search" class="empty-icon"></i>
        <p>Start typing to search...</p>
        <div style="margin-top: 16px; font-size: 12px; color: #9ca3af; text-align: center;">
          <p>⚡ <strong>s</strong> = Settings • <strong>e</strong> = Emojis • <strong>sum</strong> = Calculator • <strong>tools</strong> = Tools Directory</p>
          <p>➕ <strong>add-snippet</strong> = New Snippet • <strong>add-document</strong> = New Document • <strong>add-bookmark</strong> = New Bookmark</p>
          <p>💡 Type ":" to browse emoji categories</p>
          <p>🔍 Search for snippets, documents, bookmarks, or tools</p>
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
