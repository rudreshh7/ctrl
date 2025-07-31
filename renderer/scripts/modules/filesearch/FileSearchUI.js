/**
 * FileSearchUI - Handles file search UI rendering and interactions
 * Responsibilities:
 * - Render file and folder search results
 * - Handle file type icons and previews
 * - Manage file actions (open, reveal, copy path)
 * - Display file metadata (size, date, path)
 */
export class FileSearchUI {
  constructor(resultsContainer, fileSearchManager) {
    this.resultsContainer = resultsContainer;
    this.fileSearchManager = fileSearchManager;
  }

  displayFileResults(files) {
    console.log("Displaying file results:", files.length);
    
    if (files.length === 0) {
      this.showEmptyFileState();
      return;
    }

    const html = files
      .map((file, index) => this.createFileItemHTML(file, index))
      .join("");

    this.resultsContainer.innerHTML = `
      <div class="file-search-container">
        <div class="file-search-header">
          <h3>📁 File Search</h3>
          <p>Press ESC to return to search</p>
        </div>
        <div class="file-items">
          ${html}
        </div>
      </div>
    `;

    this.addFileEventListeners(files);
    
    // Re-initialize Lucide icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  createFileItemHTML(file, index) {
    const fileType = this.fileSearchManager.getFileType(file.name, file.isDirectory);
    const icon = this.fileSearchManager.getFileIcon(fileType);
    const typeColor = this.getFileTypeColor(fileType);
    const formattedSize = this.fileSearchManager.formatFileSize(file.size);
    const formattedDate = this.fileSearchManager.formatModifiedDate(file.modified);
    
    // Get directory path (parent folder)
    const pathParts = file.path.split(/[/\\]/);
    const fileName = pathParts.pop();
    const directoryPath = pathParts.join('/') || '/';
    
    // Truncate long paths for display
    const displayPath = this.truncatePath(directoryPath);
    
    return `
      <div class="file-item" data-index="${index}" data-path="${file.path}" data-is-directory="${file.isDirectory}">
        <div class="file-item-main">
          <div class="file-item-icon">
            <i data-lucide="${icon}" class="file-icon" style="color: ${typeColor}"></i>
          </div>
          
          <div class="file-item-content">
            <div class="file-item-name">
              <span class="file-name">${this.highlightMatch(fileName, '')}</span>
              ${file.isDirectory ? '<span class="folder-indicator">/</span>' : ''}
            </div>
            
            <div class="file-item-meta">
              <span class="file-path" title="${directoryPath}">${displayPath}</span>
              ${formattedSize ? `<span class="file-size">${formattedSize}</span>` : ''}
              ${formattedDate ? `<span class="file-date">${formattedDate}</span>` : ''}
            </div>
          </div>
          
          <div class="file-item-actions">
            <button class="file-action open-btn" data-action="open" title="${file.isDirectory ? 'Open folder' : 'Open file'}">
              <i data-lucide="${file.isDirectory ? 'folder-open' : 'external-link'}" class="action-icon"></i>
            </button>
            <button class="file-action reveal-btn" data-action="reveal" title="Show in explorer">
              <i data-lucide="eye" class="action-icon"></i>
            </button>
            <button class="file-action copy-path-btn" data-action="copy-path" title="Copy path">
              <i data-lucide="copy" class="action-icon"></i>
            </button>
          </div>
        </div>
        
        <div class="file-type-badge" style="background-color: ${typeColor}20; color: ${typeColor}">
          ${file.isDirectory ? 'Folder' : fileType}
        </div>
      </div>
    `;
  }

  highlightMatch(text, query) {
    if (!query || query.length < 2) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  truncatePath(path, maxLength = 50) {
    if (path.length <= maxLength) return path;
    
    const parts = path.split(/[/\\]/);
    if (parts.length <= 2) return path;
    
    // Show first and last parts with ... in between
    const first = parts[0];
    const last = parts[parts.length - 1];
    return `${first}/.../${last}`;
  }

  getFileTypeColor(fileType) {
    const colorMap = {
      folder: '#3b82f6',
      document: '#6b7280',
      pdf: '#ef4444',
      word: '#2563eb',
      code: '#8b5cf6',
      markup: '#f59e0b',
      stylesheet: '#ec4899',
      config: '#10b981',
      image: '#f97316',
      video: '#dc2626',
      audio: '#7c3aed',
      archive: '#059669',
      executable: '#dc2626',
      file: '#6b7280'
    };
    
    return colorMap[fileType] || '#6b7280';
  }

  addFileEventListeners(files) {
    // Handle file item clicks (main click to open)
    this.resultsContainer.querySelectorAll('.file-item').forEach((item, index) => {
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.file-item-actions')) {
          this.handleFileItemSelect(index, files);
        }
      });

      // Handle double-click for quick open
      item.addEventListener('dblclick', (e) => {
        e.preventDefault();
        this.handleFileItemSelect(index, files);
      });
    });

    // Handle action buttons
    this.resultsContainer.querySelectorAll('.file-action').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = button.dataset.action;
        const itemElement = button.closest('.file-item');
        const itemIndex = parseInt(itemElement.dataset.index);
        
        this.handleFileAction(action, itemIndex, files);
      });
    });
  }

  async handleFileItemSelect(index, files) {
    const file = files[index];
    if (!file) return;

    console.log("Selecting file:", file);

    // Open the file or folder
    const result = await this.fileSearchManager.openFile(file.path);
    
    if (result.success) {
      // Show success feedback
      this.showFileActionFeedback(index, 'opened');
      
      // Hide window after a short delay
      setTimeout(() => {
        window.electronAPI.hideWindow();
      }, 300);
    } else {
      console.error("Failed to open file:", result.message);
      this.showFileActionFeedback(index, 'error');
    }
  }

  async handleFileAction(action, itemIndex, files) {
    const file = files[itemIndex];
    
    switch (action) {
      case 'open':
        const openResult = await this.fileSearchManager.openFile(file.path);
        if (openResult.success) {
          this.showFileActionFeedback(itemIndex, 'opened');
          setTimeout(() => window.electronAPI.hideWindow(), 300);
        } else {
          this.showFileActionFeedback(itemIndex, 'error');
        }
        break;
        
      case 'reveal':
        const revealResult = await this.fileSearchManager.revealInExplorer(file.path);
        if (revealResult.success) {
          this.showFileActionFeedback(itemIndex, 'revealed');
        } else {
          this.showFileActionFeedback(itemIndex, 'error');
        }
        break;
        
      case 'copy-path':
        const copyResult = await this.fileSearchManager.copyFilePath(file.path);
        if (copyResult.success) {
          this.showFileActionFeedback(itemIndex, 'copied');
        } else {
          this.showFileActionFeedback(itemIndex, 'error');
        }
        break;
    }
  }

  showFileActionFeedback(itemIndex, action) {
    const itemElement = document.querySelector(`[data-index="${itemIndex}"]`);
    if (itemElement) {
      itemElement.classList.add(`file-${action}`);
      setTimeout(() => {
        itemElement.classList.remove(`file-${action}`);
      }, 1000);
    }
  }

  showEmptyFileState() {
    this.resultsContainer.innerHTML = `
      <div class="file-search-container">
        <div class="file-search-header">
          <h3>📁 File Search</h3>
          <p>Press ESC to return to search</p>
        </div>
        <div class="empty-file-state">
          <i data-lucide="search" class="empty-file-icon"></i>
          <p>No files found</p>
          <div class="empty-file-help">
            <p>Try different search terms or check your spelling</p>
            <p>Search includes file names from Desktop, Documents, and Downloads</p>
          </div>
        </div>
      </div>
    `;

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  showFileSearchLoading() {
    this.resultsContainer.innerHTML = `
      <div class="file-search-container">
        <div class="file-search-header">
          <h3>📁 File Search</h3>
          <p>Searching files...</p>
        </div>
        <div class="file-search-loading">
          <div class="loading-spinner"></div>
          <p>Searching your files...</p>
        </div>
      </div>
    `;
  }

  // Navigation methods for keyboard support
  highlightItem(index) {
    // Remove previous highlights
    this.resultsContainer.querySelectorAll('.file-item').forEach(item => {
      item.classList.remove('highlighted');
    });

    // Highlight current item
    const currentItem = this.resultsContainer.querySelector(`[data-index="${index}"]`);
    if (currentItem) {
      currentItem.classList.add('highlighted');
      currentItem.scrollIntoView({ block: 'nearest' });
    }
  }

  selectHighlightedItem() {
    const highlightedItem = this.resultsContainer.querySelector('.file-item.highlighted');
    if (highlightedItem) {
      const index = parseInt(highlightedItem.dataset.index);
      // Get current files from file search manager
      highlightedItem.click();
    }
  }

  // Get file preview (for future implementation)
  async getFilePreview(filePath, fileType) {
    // This could be extended to show file previews
    // For now, return basic info
    return {
      type: fileType,
      path: filePath,
      preview: null
    };
  }

  // Filter files by type (for future implementation)
  filterFilesByType(files, filterType) {
    if (!filterType || filterType === 'all') {
      return files;
    }

    return files.filter(file => {
      const fileType = this.fileSearchManager.getFileType(file.name, file.isDirectory);
      return fileType === filterType;
    });
  }
}