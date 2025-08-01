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
      <div class="add-form-widget minimal">
        <div class="form-header">
          <div class="form-header-left">
            <i data-lucide="code" class="form-icon"></i>
            <h3>Add Snippet</h3>
          </div>
          <span class="form-shortcut">Ctrl+Enter to save • ESC to cancel</span>
        </div>
        
        <div class="form-content">
          <input 
            type="text" 
            id="snippet-title" 
            class="form-input" 
            placeholder="Title"
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
            placeholder="Your code" 
            required
          ></textarea>
        </div>

        <div id="snippet-status" class="status-message hidden"></div>
      </div>
    `;

    this.resultsContainer.classList.add("form-active");
    this.resultsContainer.innerHTML = addSnippetHTML;
    this.setupAddSnippetEvents();

    // Re-initialize Lucide icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    setTimeout(() => {
      document.getElementById("snippet-title").focus();
    }, 100);
  }

  setupAddSnippetEvents() {
    const titleInput = document.getElementById("snippet-title");
    const descriptionInput = document.getElementById("snippet-description");
    const contentTextarea = document.getElementById("snippet-content");

    [titleInput, descriptionInput, contentTextarea].forEach((input) => {
      input.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          this.saveSnippet();
        } else if (e.key === "Escape") {
          this.exitAddForm();
        } else if (
          e.key === "Tab" &&
          !e.shiftKey &&
          input === contentTextarea
        ) {
          // Allow Tab in textarea for code indentation
          return;
        }
      });
    });

    // Auto-focus progression
    titleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        descriptionInput.focus();
      }
    });

    descriptionInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        contentTextarea.focus();
      }
    });
  }

  async saveSnippet() {
    const titleInput = document.getElementById("snippet-title");
    const descriptionInput = document.getElementById("snippet-description");
    const contentTextarea = document.getElementById("snippet-content");

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const content = contentTextarea.value.trim();

    console.log("FormManager saveSnippet - captured values:", {
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
      this.showFormMessage("snippet-status", "Saving snippet...", "info");

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
        await this.onDataReload();
        setTimeout(() => {
          this.exitAddForm();
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
    }
  }

  // Document Form Methods
  showAddDocumentForm() {
    const addDocumentHTML = `
      <div class="add-form-widget minimal">
        <div class="form-header">
          <div class="form-header-left">
            <i data-lucide="file-text" class="form-icon"></i>
            <h3>Add Document</h3>
          </div>
          <span class="form-shortcut">Ctrl+Enter to save • ESC to cancel</span>
        </div>
        
        <div class="form-content">
          <input 
            type="text" 
            id="document-title" 
            class="form-input" 
            placeholder="Document title"
            required
          />
          
          <input 
            type="url" 
            id="document-link" 
            class="form-input" 
            placeholder="https://example.com/document.pdf"
            required
          />
        </div>
        
        <div id="document-status" class="status-message hidden"></div>
      </div>
    `;

    this.resultsContainer.classList.add("form-active");
    this.resultsContainer.innerHTML = addDocumentHTML;
    this.setupAddDocumentEvents();

    // Re-initialize Lucide icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    setTimeout(() => {
      document.getElementById("document-title").focus();
    }, 100);
  }

  setupAddDocumentEvents() {
    const titleInput = document.getElementById("document-title");
    const linkInput = document.getElementById("document-link");

    [titleInput, linkInput].forEach((input) => {
      input.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          this.saveDocument();
        } else if (e.key === "Escape") {
          this.exitAddForm();
        }
      });
    });

    // Auto-focus progression
    titleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        linkInput.focus();
      }
    });
  }

  async saveDocument() {
    const titleInput = document.getElementById("document-title");
    const linkInput = document.getElementById("document-link");

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
      this.showFormMessage("document-status", "Saving document...", "info");

      const result = await window.electronAPI.addDocument(title, link);

      if (result.success) {
        this.showFormMessage(
          "document-status",
          "Document saved successfully! 🎉",
          "success"
        );
        await this.onDataReload();
        setTimeout(() => {
          this.exitAddForm();
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
    }
  }

  // Bookmark Form Methods
  showAddBookmarkForm() {
    const addBookmarkHTML = `
      <div class="add-form-widget minimal">
        <div class="form-header">
          <div class="form-header-left">
            <i data-lucide="bookmark" class="form-icon"></i>
            <h3>Add Bookmark</h3>
          </div>
          <span class="form-shortcut">Ctrl+Enter to save • ESC to cancel</span>
        </div>
        
        <div class="form-content">
          <input 
            type="text" 
            id="bookmark-title" 
            class="form-input" 
            placeholder="Bookmark title"
            required
          />
          
          <input 
            type="url" 
            id="bookmark-url" 
            class="form-input" 
            placeholder="https://example.com"
            required
          />
          
          <input 
            type="text" 
            id="bookmark-description" 
            class="form-input" 
            placeholder="Description (optional)"
          />
        </div>
        
        <div id="bookmark-status" class="status-message hidden"></div>
      </div>
    `;

    this.resultsContainer.classList.add("form-active");
    this.resultsContainer.innerHTML = addBookmarkHTML;
    this.setupAddBookmarkEvents();

    // Re-initialize Lucide icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    setTimeout(() => {
      document.getElementById("bookmark-title").focus();
    }, 100);
  }

  setupAddBookmarkEvents() {
    const titleInput = document.getElementById("bookmark-title");
    const urlInput = document.getElementById("bookmark-url");
    const descriptionInput = document.getElementById("bookmark-description");

    [titleInput, urlInput, descriptionInput].forEach((input) => {
      input.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          this.saveBookmark();
        } else if (e.key === "Escape") {
          this.exitAddForm();
        }
      });
    });

    // Auto-focus progression
    titleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        urlInput.focus();
      }
    });

    urlInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        descriptionInput.focus();
      }
    });
  }

  async saveBookmark() {
    const titleInput = document.getElementById("bookmark-title");
    const urlInput = document.getElementById("bookmark-url");
    const descriptionInput = document.getElementById("bookmark-description");

    const title = titleInput.value.trim();
    const url = urlInput.value.trim();
    const description = descriptionInput.value.trim();

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
      this.showFormMessage("bookmark-status", "Saving bookmark...", "info");

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
        await this.onDataReload();
        setTimeout(() => {
          this.exitAddForm();
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
    }
  }

  // Common form methods
  exitAddForm() {
    this.resultsContainer.classList.remove("form-active");
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
