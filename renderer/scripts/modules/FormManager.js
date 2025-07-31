/**
 * FormManager - Handles all form-related functionality
 * Responsibilities:
 * - Add snippet form
 * - Add document form  
 * - Add bookmark form
 * - Form validation and submission
 * - Form state management
 */
export class FormManager {
  constructor(resultsContainer, onDataReload, onBackToSearch) {
    this.resultsContainer = resultsContainer;
    this.onDataReload = onDataReload;
    this.onBackToSearch = onBackToSearch;
  }

  // Snippet Form Methods
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

    saveBtn.addEventListener("click", () => this.saveSnippet());
    clearBtn.addEventListener("click", () => this.clearSnippetForm());
    backBtn.addEventListener("click", () => this.exitAddForm());

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

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const content = contentTextarea.value.trim();

    console.log("FormManager saveSnippet - captured values:", {
      title,
      description,
      content,
    });

    if (!title) {
      this.showFormMessage("snippet-status", "Please enter snippet title", "error");
      titleInput.focus();
      return;
    }

    if (!content) {
      this.showFormMessage("snippet-status", "Please enter snippet content", "error");
      contentTextarea.focus();
      return;
    }

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = "💾 Saving...";

      const result = await window.electronAPI.addSnippet(title, description, content);

      if (result.success) {
        this.showFormMessage("snippet-status", "Snippet saved successfully! 🎉", "success");
        await this.onDataReload();
        setTimeout(() => {
          this.clearSnippetForm();
        }, 1500);
      } else {
        this.showFormMessage("snippet-status", `Failed to save: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("Failed to save snippet:", error);
      this.showFormMessage("snippet-status", "Failed to save snippet. Please try again.", "error");
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

  // Document Form Methods
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

    saveBtn.addEventListener("click", () => this.saveDocument());
    clearBtn.addEventListener("click", () => this.clearDocumentForm());
    backBtn.addEventListener("click", () => this.exitAddForm());

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
      this.showFormMessage("document-status", "Please enter document title", "error");
      titleInput.focus();
      return;
    }

    if (!link) {
      this.showFormMessage("document-status", "Please enter document link", "error");
      linkInput.focus();
      return;
    }

    try {
      new URL(link);
    } catch (error) {
      this.showFormMessage("document-status", "Please enter a valid URL", "error");
      linkInput.focus();
      return;
    }

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = "💾 Saving...";

      const result = await window.electronAPI.addDocument(title, link);

      if (result.success) {
        this.showFormMessage("document-status", "Document saved successfully! 🎉", "success");
        await this.onDataReload();
        setTimeout(() => {
          this.clearDocumentForm();
        }, 1500);
      } else {
        this.showFormMessage("document-status", `Failed to save: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("Failed to save document:", error);
      this.showFormMessage("document-status", "Failed to save document. Please try again.", "error");
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

  // Bookmark Form Methods
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

    saveBtn.addEventListener("click", () => this.saveBookmark());
    clearBtn.addEventListener("click", () => this.clearBookmarkForm());
    backBtn.addEventListener("click", () => this.exitAddForm());

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
      this.showFormMessage("bookmark-status", "Please enter bookmark title", "error");
      titleInput.focus();
      return;
    }

    if (!url) {
      this.showFormMessage("bookmark-status", "Please enter website URL", "error");
      urlInput.focus();
      return;
    }

    try {
      new URL(url);
    } catch (error) {
      this.showFormMessage("bookmark-status", "Please enter a valid URL", "error");
      urlInput.focus();
      return;
    }

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = "💾 Saving...";

      const result = await window.electronAPI.addBookmark(title, url, description);

      if (result.success) {
        this.showFormMessage("bookmark-status", "Bookmark saved successfully! 🎉", "success");
        await this.onDataReload();
        setTimeout(() => {
          this.clearBookmarkForm();
        }, 1500);
      } else {
        this.showFormMessage("bookmark-status", `Failed to save: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("Failed to save bookmark:", error);
      this.showFormMessage("bookmark-status", "Failed to save bookmark. Please try again.", "error");
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

  // Common form methods
  exitAddForm() {
    this.onBackToSearch();
  }

  showFormMessage(elementId, message, type) {
    const statusElement = document.getElementById(elementId);
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = `status-message ${type}`;
      statusElement.classList.remove("hidden");

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
}