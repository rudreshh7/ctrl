/**
 * SearchManager - Handles all search-related functionality
 * Responsibilities:
 * - Data loading and management
 * - Fuse.js initialization and search
 * - Search result processing
 * - System command matching
 */
export class SearchManager {
  constructor() {
    this.snippets = [];
    this.documents = [];
    this.bookmarks = [];
    this.tools = [];
    this.fuse = null;
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

      this.initializeFuse();
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  }

  initializeFuse() {
    console.log("Initializing Fuse.js...");

    if (typeof Fuse === "undefined") {
      console.error("Fuse.js is not loaded!");
      return;
    }

    console.log("Fuse.js is available");

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
      threshold: 0.6,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 1,
      distance: 100,
      location: 0,
      shouldSort: true,
      ignoreLocation: false,
      ignoreFieldNorm: false,
      fieldNormWeight: 1,
    };

    try {
      const allData = [
        ...this.snippets.map((item) => ({ ...item, type: "snippet" })),
        ...this.documents.map((item) => ({ ...item, type: "document" })),
        ...this.bookmarks.map((item) => ({ ...item, type: "bookmark" })),
        ...this.tools.map((item) => ({ ...item, type: "tool" })),
      ];

      this.fuse = new Fuse(allData, options);
      console.log("Fuse.js initialized successfully with", allData.length, "items");
    } catch (error) {
      console.error("Error creating Fuse.js instance:", error);
    }
  }

  searchItems(query) {
    console.log("searchItems called with query:", query);

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
        score: 10,
      });

      results.push({
        type: "system",
        id: "chatgpt-search",
        title: `🤖 Ask ChatGPT about "${query.trim()}"`,
        subtitle: `Open ChatGPT with your question in the default browser`,
        data: { searchQuery: query.trim() },
        score: 11,
      });
    }

    console.log("Total results:", results.length);
    return results.sort((a, b) => (a.score || 0) - (b.score || 0));
  }

  getSystemCommands(query) {
    const commands = [];

    const shortcuts = [
      {
        triggers: ["s", "set", "setting", "settings", "config", "configuration", "pref", "preferences"],
        command: {
          type: "system",
          id: "settings",
          title: "Settings",
          subtitle: "Open Ctrl settings and preferences",
          score: -1,
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
        triggers: ["m", "movie", "films"],
        command: {
          type: "system",
          id: "movie",
          title: "Movie Search",
          subtitle: "Search for movies and TV shows",
          score: -1,
        },
      },
      {
        triggers: ["color", "colors", "palette"],
        command: {
          type: "system",
          id: "color",
          title: "Color Picker",
          subtitle: "Browse and search colors",
          score: -1,
        },
      },
      {
        triggers: ["coin", "coingecko", "crypto"],
        command: {
          type: "system",
          id: "coingecko",
          title: "CoinGecko API",
          subtitle: "Show CoinGecko API documentation",
          score: -1,
        },
      },
      {
        triggers: ["m", "meme", "memes"],
        command: {
          type: "system",
          id: "meme",
          title: "Meme Generator",
          subtitle: "Create a new meme",
          score: -1,
        },
      },
      {
        triggers: ["c", "cat", "cats"],
        command: {
          type: "system",
          id: "cat",
          title: "Random Cat",
          subtitle: "Show a random cat image",
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
        triggers: ["add-document", "new-document", "document", "create-document"],
        command: {
          type: "system",
          id: "add-document",
          title: "Add Document",
          subtitle: "Create a new document link",
          score: -1,
        },
      },
      {
        triggers: ["add-bookmark", "new-bookmark", "bookmark", "create-bookmark"],
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

    shortcuts.forEach((shortcut) => {
      const exactMatch = shortcut.triggers.includes(query);
      const partialMatch = shortcut.triggers.some(
        (trigger) => trigger.toLowerCase().startsWith(query) && query.length > 0
      );

      if (exactMatch || partialMatch) {
        const command = { ...shortcut.command };
        if (exactMatch) {
          command.score = -10;
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

  // Getters for data access
  getTools() {
    return this.tools;
  }

  getSnippets() {
    return this.snippets;
  }

  getDocuments() {
    return this.documents;
  }

  getBookmarks() {
    return this.bookmarks;
  }
}