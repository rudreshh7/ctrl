// Search utilities module
export class SearchUtils {
  constructor() {
    this.snippetsFuse = null;
    this.documentsFuse = null;
    this.bookmarksFuse = null;
  }

  // Initialize Fuse.js instances
  initializeFuseInstances(snippets, documents, bookmarks) {
    console.log("Initializing Fuse.js instances...");

    // Check if Fuse is available
    if (typeof Fuse === "undefined") {
      console.error("Fuse.js is not loaded!");
      return;
    }

    console.log("Fuse.js is available, version:", Fuse.version || "unknown");

    // Fuse options for different data types
    const snippetOptions = {
      keys: ["content"],
      threshold: 0.4,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
    };

    const documentOptions = {
      keys: ["title", "link"],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
    };

    const bookmarkOptions = {
      keys: ["title", "url", "description"],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
    };

    try {
      // Create Fuse instances
      this.snippetsFuse = new Fuse(snippets, snippetOptions);
      this.documentsFuse = new Fuse(documents, documentOptions);
      this.bookmarksFuse = new Fuse(bookmarks, bookmarkOptions);

      console.log("Fuse.js instances initialized successfully:", {
        snippets: this.snippetsFuse ? "OK" : "FAIL",
        documents: this.documentsFuse ? "OK" : "FAIL",
        bookmarks: this.bookmarksFuse ? "OK" : "FAIL",
      });
    } catch (error) {
      console.error("Error creating Fuse.js instances:", error);
    }
  }

  // Search snippets
  searchSnippets(query) {
    if (!this.snippetsFuse || query.length < 2) {
      console.log("Snippet search skipped:", {
        fuseExists: !!this.snippetsFuse,
        queryLength: query.length,
      });
      return [];
    }

    console.log("Searching snippets for:", query);
    const results = this.snippetsFuse.search(query);
    console.log("Snippet search results:", results.length);

    return results.map((result) => ({
      type: "snippet",
      id: result.item.id,
      title: this.getSnippetPreview(result.item.content),
      subtitle: this.highlightMatches(result.item.content, result.matches),
      data: result.item,
      score: result.score,
    }));
  }

  // Search documents
  searchDocuments(query) {
    if (!this.documentsFuse || query.length < 2) return [];

    const results = this.documentsFuse.search(query);
    return results.map((result) => {
      const titleMatch = result.matches?.find((m) => m.key === "title");
      const linkMatch = result.matches?.find((m) => m.key === "link");

      return {
        type: "document",
        id: result.item.id,
        title: titleMatch
          ? this.highlightMatches(result.item.title, [titleMatch])
          : result.item.title,
        subtitle: linkMatch
          ? this.highlightMatches(result.item.link, [linkMatch])
          : result.item.link,
        data: result.item,
        score: result.score,
      };
    });
  }

  // Search bookmarks
  searchBookmarks(query) {
    if (!this.bookmarksFuse || query.length < 2) return [];

    const results = this.bookmarksFuse.search(query);
    return results.map((result) => {
      const titleMatch = result.matches?.find((m) => m.key === "title");
      const urlMatch = result.matches?.find((m) => m.key === "url");

      return {
        type: "bookmark",
        id: result.item.id,
        title: titleMatch
          ? this.highlightMatches(result.item.title, [titleMatch])
          : result.item.title,
        subtitle: urlMatch
          ? this.highlightMatches(result.item.url, [urlMatch])
          : result.item.url,
        data: result.item,
        score: result.score,
      };
    });
  }

  // Search system commands
  searchSystemCommands(query) {
    const lowerQuery = query.toLowerCase();
    const systemCommands = [
      {
        type: "system",
        id: "settings",
        title: "Settings",
        subtitle:
          "Open Ctrl settings to manage snippets, documents, and bookmarks",
        keywords: ["settings", "preferences", "config", "configure", "manage"],
      },
      {
        type: "system",
        id: "emoji",
        title: "Emoji Picker",
        subtitle: "Browse and search for emojis and special characters",
        keywords: [
          "emoji",
          "emojis",
          "emoticon",
          "smiley",
          "character",
          "symbol",
        ],
      },
    ];

    return systemCommands
      .filter(
        (command) =>
          command.keywords.some((keyword) => keyword.includes(lowerQuery)) ||
          command.title.toLowerCase().includes(lowerQuery)
      )
      .map((command) => ({
        type: "system",
        id: command.id,
        title: command.title,
        subtitle: command.subtitle,
        data: { action: command.id },
        score: 0.5,
      }));
  }

  // Get snippet preview
  getSnippetPreview(content) {
    const firstLine = content.split("\n")[0];
    return firstLine.length > 50
      ? firstLine.substring(0, 50) + "..."
      : firstLine;
  }

  // Highlight search matches
  highlightMatches(text, matches) {
    if (!matches || matches.length === 0) return this.escapeHtml(text);

    const indices = [];

    // Collect all match indices
    matches.forEach((match) => {
      if (match.indices) {
        match.indices.forEach(([start, end]) => {
          indices.push({ start, end });
        });
      }
    });

    if (indices.length === 0) return this.escapeHtml(text);

    // Sort indices by start position
    indices.sort((a, b) => a.start - b.start);

    // Build highlighted text
    let result = "";
    let lastIndex = 0;

    indices.forEach(({ start, end }) => {
      // Add text before highlight
      result += this.escapeHtml(text.substring(lastIndex, start));
      // Add highlighted text
      result += `<mark>${this.escapeHtml(
        text.substring(start, end + 1)
      )}</mark>`;
      lastIndex = end + 1;
    });

    // Add remaining text
    result += this.escapeHtml(text.substring(lastIndex));

    return result;
  }

  // Escape HTML
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
