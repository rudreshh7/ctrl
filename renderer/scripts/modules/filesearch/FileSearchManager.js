/**
 * FileSearchManager - Handles local file and folder searching
 * Responsibilities:
 * - Search through local file system
 * - Index common directories for fast search
 * - Handle different file types and extensions
 * - Provide file metadata and previews
 * - Cross-platform compatibility (Windows, macOS, Linux)
 */
export class FileSearchManager {
  constructor() {
    this.isInFileSearchMode = false;
    this.fileIndex = new Map(); // Cache for fast search
    this.searchPaths = [];
    this.lastIndexUpdate = null;
    this.indexingInProgress = false;
    this.maxResults = 50;
    this.supportedExtensions = new Set([
      // Documents
      '.txt', '.md', '.pdf', '.doc', '.docx', '.rtf', '.odt',
      // Code files
      '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h',
      '.css', '.scss', '.sass', '.less', '.html', '.htm', '.xml', '.json',
      '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
      // Images
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico',
      // Media
      '.mp4', '.avi', '.mkv', '.mov', '.wmv', '.mp3', '.wav', '.flac',
      // Archives
      '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2',
      // Others
      '.exe', '.msi', '.dmg', '.deb', '.rpm', '.app'
    ]);

    this.init();
  }

  async init() {
    console.log("Initializing FileSearchManager...");
    await this.loadUserDirectories();
    this.startBackgroundIndexing();
  }

  async loadUserDirectories() {
    try {
      // Get user directories from the main process
      const userDirs = await window.electronAPI.getUserDirectories();
      this.searchPaths = userDirs;
      console.log("Loaded user directories:", this.searchPaths);
    } catch (error) {
      console.error("Failed to load user directories:", error);
      this.searchPaths = [];
    }
  }

  startBackgroundIndexing() {
    // Start indexing common directories in the background
    if (!this.indexingInProgress) {
      setTimeout(() => {
        this.buildFileIndex();
      }, 2000); // Start indexing 2 seconds after init
    }
  }

  async buildFileIndex() {
    if (this.indexingInProgress) {
      console.log("File indexing already in progress");
      return;
    }

    this.indexingInProgress = true;
    console.log("Building file index...");

    try {
      // Index high-priority directories first
      const priorityPaths = this.searchPaths.filter(path => 
        path.includes('Desktop') || 
        path.includes('Documents') || 
        path.includes('Downloads')
      );

      for (const path of priorityPaths) {
        await this.indexDirectory(path, 2); // Limit depth for performance
      }

      this.lastIndexUpdate = new Date();
      console.log(`File index built with ${this.fileIndex.size} items`);
    } catch (error) {
      console.error("Error building file index:", error);
    } finally {
      this.indexingInProgress = false;
    }
  }

  async indexDirectory(dirPath, maxDepth = 2, currentDepth = 0) {
    if (currentDepth >= maxDepth) return;

    try {
      const files = await window.electronAPI.readDirectory(dirPath);
      
      for (const file of files) {
        const fullPath = await window.electronAPI.joinPath(dirPath, file.name);
        
        // Add to index
        const indexKey = file.name.toLowerCase();
        if (!this.fileIndex.has(indexKey)) {
          this.fileIndex.set(indexKey, []);
        }
        
        this.fileIndex.get(indexKey).push({
          name: file.name,
          path: fullPath,
          isDirectory: file.isDirectory,
          size: file.size || 0,
          modified: file.modified || null,
          extension: this.getFileExtension(file.name)
        });

        // Recursively index subdirectories
        if (file.isDirectory && currentDepth < maxDepth - 1) {
          await this.indexDirectory(fullPath, maxDepth, currentDepth + 1);
        }
      }
    } catch (error) {
      console.debug(`Could not index directory ${dirPath}:`, error.message);
    }
  }

  async searchFiles(query, useRealTimeSearch = false) {
    console.log("Searching files for query:", query);

    if (!query || query.trim().length < 2) {
      return [];
    }

    const results = [];
    const searchQuery = query.toLowerCase().trim();

    // First, search the index for fast results
    if (this.fileIndex.size > 0) {
      const indexResults = this.searchFileIndex(searchQuery);
      results.push(...indexResults);
    }

    // If we have few results or real-time search is requested, do a live search
    if (results.length < 10 || useRealTimeSearch) {
      try {
        const liveResults = await window.electronAPI.searchFiles(searchQuery, this.searchPaths);
        
        // Merge results, avoiding duplicates
        const existingPaths = new Set(results.map(r => r.path));
        const newResults = liveResults.filter(r => !existingPaths.has(r.path));
        results.push(...newResults);
      } catch (error) {
        console.error("Live file search failed:", error);
      }
    }

    // Sort and limit results
    return this.sortAndLimitResults(results, searchQuery);
  }

  searchFileIndex(query) {
    const results = [];
    const searchTerms = query.split(/\s+/).filter(term => term.length > 0);

    for (const [indexKey, files] of this.fileIndex.entries()) {
      // Check if any search term matches the file name
      const matchScore = this.calculateMatchScore(indexKey, searchTerms);
      
      if (matchScore > 0) {
        for (const file of files) {
          results.push({
            ...file,
            matchScore,
            source: 'index'
          });
        }
      }
    }

    return results;
  }

  calculateMatchScore(fileName, searchTerms) {
    let score = 0;
    const lowerFileName = fileName.toLowerCase();

    for (const term of searchTerms) {
      if (lowerFileName.includes(term)) {
        // Exact match gets higher score
        if (lowerFileName === term) {
          score += 100;
        }
        // Starts with term gets good score
        else if (lowerFileName.startsWith(term)) {
          score += 50;
        }
        // Contains term gets basic score
        else {
          score += 10;
        }
      }
    }

    return score;
  }

  sortAndLimitResults(results, query) {
    // Sort by relevance and recency
    const sorted = results.sort((a, b) => {
      // First by match score (higher is better)
      if (a.matchScore !== b.matchScore) {
        return (b.matchScore || 0) - (a.matchScore || 0);
      }

      // Then by exact name match
      const aExact = a.name.toLowerCase() === query;
      const bExact = b.name.toLowerCase() === query;
      if (aExact !== bExact) {
        return bExact ? 1 : -1;
      }

      // Then by name starts with query
      const aStarts = a.name.toLowerCase().startsWith(query);
      const bStarts = b.name.toLowerCase().startsWith(query);
      if (aStarts !== bStarts) {
        return bStarts ? 1 : -1;
      }

      // Then by modification date (newer first)
      if (a.modified && b.modified) {
        return new Date(b.modified) - new Date(a.modified);
      }

      // Finally by name alphabetically
      return a.name.localeCompare(b.name);
    });

    return sorted.slice(0, this.maxResults);
  }

  getFileExtension(fileName) {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot > 0 ? fileName.substring(lastDot).toLowerCase() : '';
  }

  getFileType(fileName, isDirectory) {
    if (isDirectory) {
      return 'folder';
    }

    const extension = this.getFileExtension(fileName);
    
    // Document types
    if (['.txt', '.md', '.rtf', '.odt'].includes(extension)) return 'document';
    if (['.pdf'].includes(extension)) return 'pdf';
    if (['.doc', '.docx'].includes(extension)) return 'word';
    
    // Code types
    if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h'].includes(extension)) return 'code';
    if (['.html', '.htm', '.xml'].includes(extension)) return 'markup';
    if (['.css', '.scss', '.sass', '.less'].includes(extension)) return 'stylesheet';
    if (['.json', '.yaml', '.yml', '.toml'].includes(extension)) return 'config';
    
    // Media types
    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico'].includes(extension)) return 'image';
    if (['.mp4', '.avi', '.mkv', '.mov', '.wmv'].includes(extension)) return 'video';
    if (['.mp3', '.wav', '.flac', '.ogg'].includes(extension)) return 'audio';
    
    // Archive types
    if (['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'].includes(extension)) return 'archive';
    
    // Executable types
    if (['.exe', '.msi', '.app', '.deb', '.rpm'].includes(extension)) return 'executable';
    
    return 'file';
  }

  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatModifiedDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    
    return date.toLocaleDateString();
  }

  async openFile(filePath) {
    try {
      const result = await window.electronAPI.openFile(filePath);
      return { success: true, message: "File opened successfully" };
    } catch (error) {
      console.error("Failed to open file:", error);
      return { success: false, message: "Failed to open file" };
    }
  }

  async revealInExplorer(filePath) {
    try {
      await window.electronAPI.revealInExplorer(filePath);
      return { success: true, message: "File revealed in explorer" };
    } catch (error) {
      console.error("Failed to reveal file:", error);
      return { success: false, message: "Failed to reveal file" };
    }
  }

  async copyFilePath(filePath) {
    try {
      await navigator.clipboard.writeText(filePath);
      return { success: true, message: "File path copied to clipboard" };
    } catch (error) {
      console.error("Failed to copy file path:", error);
      return { success: false, message: "Failed to copy file path" };
    }
  }

  enterFileSearchMode() {
    this.isInFileSearchMode = true;
    console.log("Entered file search mode");
    return []; // Return empty array initially
  }

  exitFileSearchMode() {
    this.isInFileSearchMode = false;
    console.log("Exited file search mode");
  }

  isInFileMode() {
    return this.isInFileSearchMode;
  }

  // Refresh the file index
  async refreshIndex() {
    console.log("Refreshing file index...");
    this.fileIndex.clear();
    await this.buildFileIndex();
  }

  // Get file icon based on type
  getFileIcon(fileType) {
    const iconMap = {
      folder: 'folder',
      document: 'file-text',
      pdf: 'file-type',
      word: 'file-text',
      code: 'file-code',
      markup: 'code',
      stylesheet: 'palette',
      config: 'settings',
      image: 'image',
      video: 'video',
      audio: 'music',
      archive: 'archive',
      executable: 'play-circle',
      file: 'file'
    };
    
    return iconMap[fileType] || 'file';
  }

  // Get statistics about the file index
  getIndexStats() {
    const stats = {
      totalFiles: this.fileIndex.size,
      lastUpdated: this.lastIndexUpdate,
      isIndexing: this.indexingInProgress,
      searchPaths: this.searchPaths.length
    };
    
    return stats;
  }
}