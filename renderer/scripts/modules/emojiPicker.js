// Emoji picker module
import {
  emojiCategories,
  getAllEmojis,
  getEmojisByCategory,
  searchEmojis,
  getTotalEmojiCount,
} from "./emojiData.js";

export class EmojiPicker {
  constructor() {
    this.isEmojiMode = false;
    this.currentFilter = "all";
    this.allEmojis = getAllEmojis();
    this.isSearchMode = false;
  }

  // Enter emoji mode and show emoji picker interface
  enterEmojiMode() {
    this.isEmojiMode = true;
    this.currentFilter = "all";
    this.isSearchMode = false;
    return this.showEmojiPickerInterface();
  }

  // Exit emoji mode
  exitEmojiMode() {
    this.isEmojiMode = false;
    this.currentFilter = "all";
    this.isSearchMode = false;
  }

  // Show emoji picker interface with just emojis
  showEmojiPickerInterface() {
    const results = [];

    // Add back button only
    results.push({
      type: "system",
      id: "back",
      title: "← Back to Search",
      subtitle: "Return to main search interface",
      data: { action: "back" },
      score: -1,
    });

    // Add all emojis - no filters, no extra search UI
    const emojisToShow = this.allEmojis;
    emojisToShow.forEach((emojiData, index) => {
      results.push({
        type: "emoji",
        id: emojiData.emoji,
        title: `${emojiData.emoji}`,
        subtitle: `${emojiData.name}`,
        data: emojiData,
        score: index,
      });
    });

    return results;
  }

  // Enter search mode within emoji picker
  enterEmojiSearchMode() {
    this.isSearchMode = true;
    return this.showEmojiPickerInterface();
  }

  // Exit search mode within emoji picker
  exitEmojiSearchMode() {
    this.isSearchMode = false;
    return this.showEmojiPickerInterface();
  }

  // Get filter options for dropdown
  getFilterOptions() {
    const options = [
      {
        id: "all",
        title: `🌟 All Emojis (${getTotalEmojiCount()})`,
        subtitle: "Show all available emojis",
        active: this.currentFilter === "all",
      },
    ];

    Object.keys(emojiCategories).forEach((categoryKey) => {
      const category = emojiCategories[categoryKey];
      options.push({
        id: categoryKey,
        title: `${category.icon} ${category.name} (${category.emojis.length})`,
        subtitle: `Filter by ${category.name.toLowerCase()}`,
        active: this.currentFilter === categoryKey,
      });
    });

    return options;
  }

  // Get current filter display name
  getCurrentFilterName() {
    if (this.currentFilter === "all") {
      return `All Emojis (${getTotalEmojiCount()})`;
    }
    const category = emojiCategories[this.currentFilter];
    return category
      ? `${category.name} (${category.emojis.length})`
      : "Unknown";
  }

  // Get emojis based on current filter
  getFilteredEmojis() {
    if (this.currentFilter === "all") {
      return this.allEmojis;
    }
    return getEmojisByCategory(this.currentFilter);
  }

  // Apply filter and return updated results
  applyFilter(filterKey) {
    this.currentFilter = filterKey;
    this.isSearchMode = false; // Exit search mode when applying filter
    return this.showEmojiPickerInterface();
  }

  // Search emojis directly (simplified)
  searchEmojisInPicker(query) {
    const results = [];

    // Add back button
    results.push({
      type: "system",
      id: "back",
      title: "← Back to Search",
      subtitle: "Return to main search interface",
      data: { action: "back" },
      score: -1,
    });

    if (!query.trim()) {
      // If no query, show all emojis
      this.allEmojis.forEach((emojiData, index) => {
        results.push({
          type: "emoji",
          id: emojiData.emoji,
          title: `${emojiData.emoji}`,
          subtitle: `${emojiData.name}`,
          data: emojiData,
          score: index,
        });
      });
    } else {
      // Search through emojis
      const searchResults = searchEmojis(query);
      searchResults.forEach((emojiData, index) => {
        results.push({
          type: "emoji",
          id: emojiData.emoji,
          title: `${emojiData.emoji}`,
          subtitle: `${emojiData.name} - ${emojiData.keywords
            .slice(0, 3)
            .join(", ")}`,
          data: emojiData,
          score: index,
        });
      });
    }

    return results;
  }

  // Handle emoji selection
  async selectEmoji(emojiData) {
    try {
      await navigator.clipboard.writeText(emojiData.emoji);
      return {
        success: true,
        message: `Copied ${emojiData.emoji} to clipboard`,
        emoji: emojiData.emoji,
      };
    } catch (error) {
      console.error("Failed to copy emoji to clipboard:", error);
      return {
        success: false,
        message: "Failed to copy emoji to clipboard",
        error: error.message,
      };
    }
  }

  // Check if we're in emoji mode
  isInEmojiMode() {
    return this.isEmojiMode;
  }
}
