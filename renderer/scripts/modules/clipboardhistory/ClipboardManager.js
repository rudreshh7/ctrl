/**
 * ClipboardManager - Handles clipboard history functionality
 * Responsibilities:
 * - Monitor clipboard changes
 * - Save clipboard data to database
 * - Search through clipboard history
 * - Handle different clipboard data types (text, images, colors)
 * - Manage clipboard item editing
 */
export class ClipboardManager {
  constructor() {
    this.isInClipboardMode = false;
    this.clipboardHistory = [];
    this.currentClipboard = '';
    this.clipboardCheckInterval = null;
    this.maxHistoryItems = 1000; // Limit history to prevent memory issues
    
    this.init();
  }

  async init() {
    console.log("Initializing ClipboardManager...");
    await this.loadClipboardHistory();
    this.startClipboardMonitoring();
  }

  async loadClipboardHistory() {
    try {
      console.log("Loading clipboard history from database...");
      this.clipboardHistory = await window.electronAPI.getClipboardHistory();
      console.log(`Loaded ${this.clipboardHistory.length} clipboard items`);
    } catch (error) {
      console.error("Failed to load clipboard history:", error);
      this.clipboardHistory = [];
    }
  }

  startClipboardMonitoring() {
    // Check clipboard every 500ms for changes
    this.clipboardCheckInterval = setInterval(async () => {
      if (!this.isInClipboardMode) {
        await this.checkClipboardChange();
      }
    }, 500);

    console.log("Clipboard monitoring started");
  }

  stopClipboardMonitoring() {
    if (this.clipboardCheckInterval) {
      clearInterval(this.clipboardCheckInterval);
      this.clipboardCheckInterval = null;
      console.log("Clipboard monitoring stopped");
    }
  }

  async checkClipboardChange() {
    try {
      const clipboardData = await this.getCurrentClipboardData();
      
      if (clipboardData && clipboardData.content !== this.currentClipboard) {
        this.currentClipboard = clipboardData.content;
        await this.saveClipboardItem(clipboardData);
      }
    } catch (error) {
      // Silently ignore clipboard access errors (common when other apps are using clipboard)
      console.debug("Clipboard access error:", error.message);
    }
  }

  async getCurrentClipboardData() {
    try {
      // Try to get different types of clipboard data
      const text = await navigator.clipboard.readText();
      
      if (text && text.trim()) {
        const clipboardItem = {
          type: this.detectContentType(text),
          content: text,
          preview: this.generatePreview(text),
          timestamp: new Date().toISOString(),
          size: new Blob([text]).size
        };

        return clipboardItem;
      }

      // TODO: Handle images and other formats when Electron clipboard API is available
      return null;
    } catch (error) {
      console.debug("Error reading clipboard:", error);
      return null;
    }
  }

  detectContentType(content) {
    const trimmed = content.trim();
    
    // Detect URLs
    if (this.isURL(trimmed)) {
      return 'url';
    }
    
    // Detect colors (hex, rgb, hsl)
    if (this.isColor(trimmed)) {
      return 'color';
    }
    
    // Detect email
    if (this.isEmail(trimmed)) {
      return 'email';
    }
    
    // Detect phone number
    if (this.isPhoneNumber(trimmed)) {
      return 'phone';
    }
    
    // Detect file path
    if (this.isFilePath(trimmed)) {
      return 'file';
    }
    
    // Detect code (contains common programming patterns)
    if (this.isCode(trimmed)) {
      return 'code';
    }
    
    // Default to text
    return 'text';
  }

  isURL(text) {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  }

  isColor(text) {
    // Hex colors
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(text)) {
      return true;
    }
    
    // RGB/RGBA
    if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/i.test(text)) {
      return true;
    }
    
    // HSL/HSLA
    if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+)?\s*\)$/i.test(text)) {
      return true;
    }
    
    return false;
  }

  isEmail(text) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  }

  isPhoneNumber(text) {
    return /^[\+]?[\d\s\-\(\)]{10,}$/.test(text);
  }

  isFilePath(text) {
    return /^([a-zA-Z]:\\|\/|\.\/|\.\.\/|~\/)/.test(text);
  }

  isCode(text) {
    const codePatterns = [
      /function\s+\w+\s*\(/,
      /class\s+\w+/,
      /import\s+.*from/,
      /export\s+(default\s+)?/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /var\s+\w+\s*=/,
      /<[^>]+>/,  // HTML tags
      /\{\s*\w+:\s*\w+/,  // Object syntax
      /\[\s*\w+/,  // Array syntax
    ];
    
    return codePatterns.some(pattern => pattern.test(text));
  }

  generatePreview(content, maxLength = 100) {
    if (!content) return '';
    
    // Remove extra whitespace and newlines for preview
    const cleaned = content.replace(/\s+/g, ' ').trim();
    
    if (cleaned.length <= maxLength) {
      return cleaned;
    }
    
    return cleaned.substring(0, maxLength) + '...';
  }

  async saveClipboardItem(clipboardData) {
    try {
      // Don't save if it's the same as the last item
      if (this.clipboardHistory.length > 0 && 
          this.clipboardHistory[0].content === clipboardData.content) {
        return;
      }

      // Save to database
      const result = await window.electronAPI.addClipboardItem(
        clipboardData.type,
        clipboardData.content,
        clipboardData.preview,
        clipboardData.size
      );

      if (result.success) {
        // Add to local history (prepend to show most recent first)
        this.clipboardHistory.unshift({
          id: result.id,
          ...clipboardData
        });

        // Limit history size
        if (this.clipboardHistory.length > this.maxHistoryItems) {
          const removed = this.clipboardHistory.splice(this.maxHistoryItems);
          // Delete old items from database
          for (const item of removed) {
            await window.electronAPI.deleteClipboardItem(item.id);
          }
        }

        console.log(`Saved clipboard item: ${clipboardData.type}`);
      }
    } catch (error) {
      console.error("Failed to save clipboard item:", error);
    }
  }

  searchClipboardHistory(query) {
    if (!query || !query.trim()) {
      return this.clipboardHistory.slice(0, 50); // Return recent 50 items
    }

    const searchTerm = query.toLowerCase();
    
    return this.clipboardHistory.filter(item => {
      return (
        item.content.toLowerCase().includes(searchTerm) ||
        item.preview.toLowerCase().includes(searchTerm) ||
        item.type.toLowerCase().includes(searchTerm)
      );
    }).slice(0, 50); // Limit results
  }

  async copyToClipboard(content) {
    try {
      await navigator.clipboard.writeText(content);
      return { success: true, message: "Copied to clipboard" };
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      return { success: false, message: "Failed to copy to clipboard" };
    }
  }

  async deleteClipboardItem(id) {
    try {
      const result = await window.electronAPI.deleteClipboardItem(id);
      
      if (result.success) {
        // Remove from local history
        this.clipboardHistory = this.clipboardHistory.filter(item => item.id !== id);
        return { success: true, message: "Item deleted" };
      } else {
        return { success: false, message: result.error };
      }
    } catch (error) {
      console.error("Failed to delete clipboard item:", error);
      return { success: false, message: "Failed to delete item" };
    }
  }

  async updateClipboardItem(id, newContent) {
    try {
      const newPreview = this.generatePreview(newContent);
      const newType = this.detectContentType(newContent);
      const newSize = new Blob([newContent]).size;
      
      const result = await window.electronAPI.updateClipboardItem(
        id, 
        newType, 
        newContent, 
        newPreview, 
        newSize
      );
      
      if (result.success) {
        // Update local history
        const itemIndex = this.clipboardHistory.findIndex(item => item.id === id);
        if (itemIndex !== -1) {
          this.clipboardHistory[itemIndex] = {
            ...this.clipboardHistory[itemIndex],
            type: newType,
            content: newContent,
            preview: newPreview,
            size: newSize
          };
        }
        
        return { success: true, message: "Item updated" };
      } else {
        return { success: false, message: result.error };
      }
    } catch (error) {
      console.error("Failed to update clipboard item:", error);
      return { success: false, message: "Failed to update item" };
    }
  }

  enterClipboardMode() {
    this.isInClipboardMode = true;
    console.log("Entered clipboard mode");
    return this.searchClipboardHistory(''); // Return recent items
  }

  exitClipboardMode() {
    this.isInClipboardMode = false;
    console.log("Exited clipboard mode");
  }

  isInClipboardHistoryMode() {
    return this.isInClipboardMode;
  }

  getClipboardHistory() {
    return this.clipboardHistory;
  }

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Format timestamp for display
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  // Clean up resources
  destroy() {
    this.stopClipboardMonitoring();
  }
}