/**
 * ClipboardUI - Handles clipboard history UI rendering and interactions
 * Responsibilities:
 * - Render clipboard history items with different types
 * - Handle color previews and image displays
 * - Manage edit mode for clipboard items
 * - Handle clipboard item actions (copy, delete, edit)
 */
export class ClipboardUI {
  constructor(resultsContainer, clipboardManager) {
    this.resultsContainer = resultsContainer;
    this.clipboardManager = clipboardManager;
    this.editingItemId = null;
  }

  displayClipboardResults(items) {
    console.log("Displaying clipboard results:", items.length);
    
    if (items.length === 0) {
      this.showEmptyClipboardState();
      return;
    }

    const html = items
      .map((item, index) => this.createClipboardItemHTML(item, index))
      .join("");

    this.resultsContainer.innerHTML = `
      <div class="clipboard-history-container">
        <div class="clipboard-header">
          <h3>📋 Clipboard History</h3>
          <p>Press ESC to return to search</p>
        </div>
        <div class="clipboard-items">
          ${html}
        </div>
      </div>
    `;

    this.addClipboardEventListeners(items);
    
    // Re-initialize Lucide icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  createClipboardItemHTML(item, index) {
    const icon = this.getClipboardItemIcon(item.type);
    const typeColor = this.getTypeColor(item.type);
    const formattedTime = this.clipboardManager.formatTimestamp(item.timestamp);
    const formattedSize = this.clipboardManager.formatFileSize(item.size);

    // Special handling for different content types
    let contentPreview = '';
    let specialPreview = '';

    switch (item.type) {
      case 'color':
        specialPreview = this.createColorPreview(item.content);
        contentPreview = item.content;
        break;
      case 'url':
        contentPreview = `<a href="${item.content}" class="clipboard-url" target="_blank">${item.preview}</a>`;
        break;
      case 'code':
        contentPreview = `<code class="clipboard-code">${item.preview}</code>`;
        break;
      case 'image':
        specialPreview = this.createImagePreview(item.content);
        contentPreview = 'Image';
        break;
      default:
        contentPreview = item.preview;
    }

    return `
      <div class="clipboard-item" data-index="${index}" data-id="${item.id}" data-type="${item.type}">
        <div class="clipboard-item-main">
          <div class="clipboard-item-icon">
            <i data-lucide="${icon}" class="clipboard-icon"></i>
          </div>
          
          <div class="clipboard-item-content">
            <div class="clipboard-item-text">
              ${specialPreview}
              <div class="clipboard-content-text">${contentPreview}</div>
            </div>
            
            <div class="clipboard-item-meta">
              <span class="clipboard-type" style="color: ${typeColor}">${item.type}</span>
              <span class="clipboard-time">${formattedTime}</span>
              <span class="clipboard-size">${formattedSize}</span>
            </div>
          </div>
          
          <div class="clipboard-item-actions">
            <button class="clipboard-action copy-btn" data-action="copy" title="Copy to clipboard">
              <i data-lucide="copy" class="action-icon"></i>
            </button>
            <button class="clipboard-action edit-btn" data-action="edit" title="Edit item">
              <i data-lucide="edit-3" class="action-icon"></i>
            </button>
            <button class="clipboard-action delete-btn" data-action="delete" title="Delete item">
              <i data-lucide="trash-2" class="action-icon"></i>
            </button>
          </div>
        </div>
        
        <div class="clipboard-edit-form" id="edit-form-${item.id}" style="display: none;">
          <textarea class="clipboard-edit-textarea" placeholder="Edit content...">${item.content}</textarea>
          <div class="clipboard-edit-actions">
            <button class="clipboard-edit-save" data-id="${item.id}">Save</button>
            <button class="clipboard-edit-cancel" data-id="${item.id}">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  createColorPreview(colorValue) {
    // Normalize color value for CSS
    let cssColor = colorValue;
    
    // Convert hex shorthand to full hex
    if (/^#[A-Fa-f0-9]{3}$/.test(colorValue)) {
      cssColor = colorValue.replace(/^#([A-Fa-f0-9])([A-Fa-f0-9])([A-Fa-f0-9])$/, '#$1$1$2$2$3$3');
    }

    return `
      <div class="clipboard-color-preview">
        <div class="color-swatch" style="background-color: ${cssColor}"></div>
      </div>
    `;
  }

  createImagePreview(imagePath) {
    // For now, show a placeholder. In a full implementation, 
    // this would show the actual image thumbnail
    return `
      <div class="clipboard-image-preview">
        <div class="image-placeholder">
          <i data-lucide="image" class="image-icon"></i>
          <span>Image Preview</span>
        </div>
      </div>
    `;
  }

  getClipboardItemIcon(type) {
    const iconMap = {
      text: 'type',
      url: 'link',
      email: 'mail',
      phone: 'phone',
      color: 'palette',
      code: 'code',
      file: 'file',
      image: 'image',
    };
    return iconMap[type] || 'clipboard';
  }

  getTypeColor(type) {
    const colorMap = {
      text: '#6b7280',
      url: '#3b82f6',
      email: '#ef4444',
      phone: '#10b981',
      color: '#f59e0b',
      code: '#8b5cf6',
      file: '#f97316',
      image: '#ec4899',
    };
    return colorMap[type] || '#6b7280';
  }

  addClipboardEventListeners(items) {
    // Handle clipboard item clicks
    this.resultsContainer.querySelectorAll('.clipboard-item').forEach((item, index) => {
      // Main item click (copy to clipboard)
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.clipboard-item-actions') && 
            !e.target.closest('.clipboard-edit-form')) {
          this.handleClipboardItemSelect(index, items);
        }
      });
    });

    // Handle action buttons
    this.resultsContainer.querySelectorAll('.clipboard-action').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = button.dataset.action;
        const itemElement = button.closest('.clipboard-item');
        const itemId = itemElement.dataset.id;
        const itemIndex = parseInt(itemElement.dataset.index);
        
        this.handleClipboardAction(action, itemId, itemIndex, items);
      });
    });

    // Handle edit form actions
    this.resultsContainer.querySelectorAll('.clipboard-edit-save').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemId = button.dataset.id;
        this.handleEditSave(itemId);
      });
    });

    this.resultsContainer.querySelectorAll('.clipboard-edit-cancel').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemId = button.dataset.id;
        this.handleEditCancel(itemId);
      });
    });

    // Handle keyboard shortcuts in edit mode
    this.resultsContainer.querySelectorAll('.clipboard-edit-textarea').forEach(textarea => {
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const itemId = textarea.closest('.clipboard-edit-form').id.replace('edit-form-', '');
          this.handleEditCancel(itemId);
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          const itemId = textarea.closest('.clipboard-edit-form').id.replace('edit-form-', '');
          this.handleEditSave(itemId);
        }
      });
    });
  }

  async handleClipboardItemSelect(index, items) {
    const item = items[index];
    if (!item) return;

    console.log("Selecting clipboard item:", item);

    // Copy to clipboard
    const result = await this.clipboardManager.copyToClipboard(item.content);
    
    if (result.success) {
      // Show success feedback
      this.showCopyFeedback(index);
      
      // Hide window after a short delay
      setTimeout(() => {
        window.electronAPI.hideWindow();
      }, 500);
    } else {
      console.error("Failed to copy clipboard item:", result.message);
    }
  }

  async handleClipboardAction(action, itemId, itemIndex, items) {
    const item = items[itemIndex];
    
    switch (action) {
      case 'copy':
        const copyResult = await this.clipboardManager.copyToClipboard(item.content);
        if (copyResult.success) {
          this.showCopyFeedback(itemIndex);
        }
        break;
        
      case 'edit':
        this.showEditForm(itemId);
        break;
        
      case 'delete':
        if (confirm('Are you sure you want to delete this clipboard item?')) {
          const deleteResult = await this.clipboardManager.deleteClipboardItem(itemId);
          if (deleteResult.success) {
            // Remove item from UI
            const itemElement = document.querySelector(`[data-id="${itemId}"]`);
            if (itemElement) {
              itemElement.remove();
            }
            
            // Show empty state if no items left
            const remainingItems = document.querySelectorAll('.clipboard-item');
            if (remainingItems.length === 0) {
              this.showEmptyClipboardState();
            }
          }
        }
        break;
    }
  }

  showEditForm(itemId) {
    // Hide any other open edit forms
    this.resultsContainer.querySelectorAll('.clipboard-edit-form').forEach(form => {
      if (form.id !== `edit-form-${itemId}`) {
        form.style.display = 'none';
      }
    });

    // Show the edit form for this item
    const editForm = document.getElementById(`edit-form-${itemId}`);
    if (editForm) {
      editForm.style.display = 'block';
      const textarea = editForm.querySelector('.clipboard-edit-textarea');
      if (textarea) {
        textarea.focus();
        textarea.select();
      }
      this.editingItemId = itemId;
    }
  }

  async handleEditSave(itemId) {
    const editForm = document.getElementById(`edit-form-${itemId}`);
    const textarea = editForm.querySelector('.clipboard-edit-textarea');
    const newContent = textarea.value;

    if (newContent.trim()) {
      const result = await this.clipboardManager.updateClipboardItem(itemId, newContent);
      
      if (result.success) {
        // Refresh the clipboard display
        this.refreshClipboardDisplay();
        this.handleEditCancel(itemId);
      } else {
        alert('Failed to update item: ' + result.message);
      }
    }
  }

  handleEditCancel(itemId) {
    const editForm = document.getElementById(`edit-form-${itemId}`);
    if (editForm) {
      editForm.style.display = 'none';
    }
    this.editingItemId = null;
  }

  showCopyFeedback(itemIndex) {
    const itemElement = document.querySelector(`[data-index="${itemIndex}"]`);
    if (itemElement) {
      itemElement.classList.add('copied');
      setTimeout(() => {
        itemElement.classList.remove('copied');
      }, 1000);
    }
  }

  showEmptyClipboardState() {
    this.resultsContainer.innerHTML = `
      <div class="clipboard-history-container">
        <div class="clipboard-header">
          <h3>📋 Clipboard History</h3>
          <p>Press ESC to return to search</p>
        </div>
        <div class="empty-clipboard-state">
          <i data-lucide="clipboard-x" class="empty-clipboard-icon"></i>
          <p>No clipboard history yet</p>
          <div class="empty-clipboard-help">
            <p>Copy some text to start building your clipboard history</p>
          </div>
        </div>
      </div>
    `;

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  refreshClipboardDisplay() {
    // Emit event to refresh the clipboard display
    this.resultsContainer.dispatchEvent(
      new CustomEvent("refreshClipboardHistory")
    );
  }

  // Navigation methods for keyboard support
  highlightItem(index) {
    // Remove previous highlights
    this.resultsContainer.querySelectorAll('.clipboard-item').forEach(item => {
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
    const highlightedItem = this.resultsContainer.querySelector('.clipboard-item.highlighted');
    if (highlightedItem) {
      const index = parseInt(highlightedItem.dataset.index);
      const items = this.clipboardManager.getClipboardHistory();
      this.handleClipboardItemSelect(index, items);
    }
  }
}