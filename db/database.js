const Database = require("better-sqlite3");
const path = require("path");
const { app } = require("electron");

let db = null;

function initDatabase() {
  return new Promise((resolve, reject) => {
    try {
      // Use Electron's userData directory for the database in production
      // Fall back to current directory for development if app is not available
      const dbPath = app ? 
        path.join(app.getPath("userData"), "ctrl-database.db") : 
        path.join(__dirname, "..", "data.db");
      
      console.log("Database path:", dbPath);
      db = new Database(dbPath);
      
      // Create snippets table
      db.exec(`
        CREATE TABLE IF NOT EXISTS snippets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          description TEXT,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create documents table
      db.exec(`
        CREATE TABLE IF NOT EXISTS documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          link TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create bookmarks table
      db.exec(`
        CREATE TABLE IF NOT EXISTS bookmarks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          url TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create tools table
      db.exec(`
        CREATE TABLE IF NOT EXISTS tools (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          url TEXT NOT NULL,
          description TEXT,
          category TEXT DEFAULT 'utility',
          keywords TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create clipboard_history table
      db.exec(`
        CREATE TABLE IF NOT EXISTS clipboard_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL DEFAULT 'text',
          content TEXT NOT NULL,
          preview TEXT,
          size INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log("Database initialized successfully");

      // Add sample data for testing
      addSampleData()
        .then(() => {
          console.log("Sample data added successfully");
          resolve();
        })
        .catch((err) => {
          console.error("Error adding sample data:", err);
          resolve(); // Still resolve even if sample data fails
        });

    } catch (error) {
      console.error("Failed to initialize database:", error);
      reject(error);
    }
  });
}

// Snippet operations
function getAllSnippets() {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare("SELECT * FROM snippets ORDER BY created_at DESC");
      const rows = stmt.all();
      resolve(rows);
    } catch (error) {
      console.error("Error getting snippets:", error);
      resolve([]);
    }
  });
}

function addSnippet(title, description, content) {
  return new Promise((resolve, reject) => {
    try {
      // Validate that content is not empty
      if (!content || content.trim() === "") {
        console.error("Content is required and cannot be empty");
        resolve({
          success: false,
          error: "Content is required and cannot be empty",
        });
        return;
      }

      const stmt = db.prepare("INSERT INTO snippets (title, description, content) VALUES (?, ?, ?)");
      const result = stmt.run(title || "", description || "", content.trim());
      resolve({ id: result.lastInsertRowid, success: true });
    } catch (error) {
      console.error("Error adding snippet:", error);
      resolve({ success: false, error: error.message });
    }
  });
}

function deleteSnippet(id) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare("DELETE FROM snippets WHERE id = ?");
      const result = stmt.run(id);
      resolve({ success: result.changes > 0 });
    } catch (error) {
      console.error("Error deleting snippet:", error);
      resolve({ success: false, error: error.message });
    }
  });
}

// Document operations
function getAllDocuments() {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare("SELECT * FROM documents ORDER BY created_at DESC");
      const rows = stmt.all();
      resolve(rows);
    } catch (error) {
      console.error("Error getting documents:", error);
      resolve([]);
    }
  });
}

function addDocument(title, link) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare("INSERT INTO documents (title, link) VALUES (?, ?)");
      const result = stmt.run(title, link);
      resolve({ id: result.lastInsertRowid, success: true });
    } catch (error) {
      console.error("Error adding document:", error);
      resolve({ success: false, error: error.message });
    }
  });
}

function deleteDocument(id) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare("DELETE FROM documents WHERE id = ?");
      const result = stmt.run(id);
      resolve({ success: result.changes > 0 });
    } catch (error) {
      console.error("Error deleting document:", error);
      resolve({ success: false, error: error.message });
    }
  });
}

// Bookmark operations
function getAllBookmarks() {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare("SELECT * FROM bookmarks ORDER BY created_at DESC");
      const rows = stmt.all();
      resolve(rows);
    } catch (error) {
      console.error("Error getting bookmarks:", error);
      resolve([]);
    }
  });
}

function addBookmark(title, url, description = "") {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare("INSERT INTO bookmarks (title, url, description) VALUES (?, ?, ?)");
      const result = stmt.run(title, url, description);
      resolve({ id: result.lastInsertRowid, success: true });
    } catch (error) {
      console.error("Error adding bookmark:", error);
      resolve({ success: false, error: error.message });
    }
  });
}

function deleteBookmark(id) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare("DELETE FROM bookmarks WHERE id = ?");
      const result = stmt.run(id);
      resolve({ success: result.changes > 0 });
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      resolve({ success: false, error: error.message });
    }
  });
}

// Add sample data for testing
async function addSampleData() {
  try {
    // Check if we already have data
    const snippets = await getAllSnippets();
    const documents = await getAllDocuments();
    const bookmarks = await getAllBookmarks();
    const tools = await getAllTools();

    if (snippets.length > 0 || documents.length > 0 || bookmarks.length > 0 || tools.length > 0) {
      console.log("Sample data already exists, skipping...");
      return;
    }

    console.log("Adding sample data...");

    // Add sample snippets
    await addSnippet(
      "Hello World",
      "Basic console log",
      "console.log('Hello World');"
    );
    await addSnippet(
      "Express Setup",
      "Basic Express.js server setup",
      "const express = require('express');\nconst app = express();"
    );
    await addSnippet(
      "SQL Query",
      "Get active users",
      "SELECT * FROM users WHERE active = 1;"
    );
    await addSnippet(
      "Git Commit",
      "Add and commit changes",
      "git add . && git commit -m 'Initial commit'"
    );
    await addSnippet(
      "NPM Install",
      "Install common packages",
      "npm install express mongoose cors dotenv"
    );

    // Add sample documents
    await addDocument("React Documentation", "https://reactjs.org/docs");
    await addDocument("Node.js Guide", "https://nodejs.org/en/docs");
    await addDocument("MDN Web Docs", "https://developer.mozilla.org");
    await addDocument("VS Code Tips", "https://code.visualstudio.com/docs");

    // Add sample bookmarks
    await addBookmark(
      "GitHub",
      "https://github.com",
      "Code repository hosting"
    );
    await addBookmark(
      "Stack Overflow",
      "https://stackoverflow.com",
      "Programming Q&A"
    );
    await addBookmark(
      "npm Registry",
      "https://npmjs.com",
      "Node.js package manager"
    );
    await addBookmark("Google", "https://google.com", "Search engine");
    await addBookmark("YouTube", "https://youtube.com", "Video platform");

    // Add sample tools
    await addTool(
      "Edit PDF",
      "https://evilpdf.appwrite.network/",
      "Edit, merge, split, and manipulate PDF files online",
      "productivity",
      "pdf edit manipulate merge split convert"
    );
    await addTool(
      "Remove Background",
      "https://www.remove.bg/",
      "Remove background from images automatically using AI",
      "design",
      "background remove image photo ai automatic"
    );

    console.log("Sample data added successfully");
  } catch (error) {
    console.error("Error adding sample data:", error);
  }
}

// Tool operations
function getAllTools() {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare("SELECT * FROM tools ORDER BY created_at DESC");
      const rows = stmt.all();
      resolve(rows);
    } catch (error) {
      console.error("Error getting tools:", error);
      resolve([]);
    }
  });
}

function addTool(name, url, description = "", category = "utility", keywords = "") {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare("INSERT INTO tools (name, url, description, category, keywords) VALUES (?, ?, ?, ?, ?)");
      const result = stmt.run(name, url, description, category, keywords);
      resolve({ id: result.lastInsertRowid, success: true });
    } catch (error) {
      console.error("Error adding tool:", error);
      resolve({ success: false, error: error.message });
    }
  });
}

function deleteTool(id) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare("DELETE FROM tools WHERE id = ?");
      const result = stmt.run(id);
      resolve({ success: result.changes > 0 });
    } catch (error) {
      console.error("Error deleting tool:", error);
      resolve({ success: false, error: error.message });
    }
  });
}

// Clipboard History operations
function getAllClipboardHistory() {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare("SELECT * FROM clipboard_history ORDER BY created_at DESC LIMIT 1000");
      const rows = stmt.all();
      resolve(rows);
    } catch (error) {
      console.error("Error getting clipboard history:", error);
      resolve([]);
    }
  });
}

function addClipboardItem(type, content, preview, size) {
  return new Promise((resolve, reject) => {
    try {
      // Don't save if content is empty
      if (!content || content.trim() === "") {
        resolve({ success: false, error: "Content cannot be empty" });
        return;
      }

      // Check if this exact content already exists as the most recent item
      const checkStmt = db.prepare("SELECT id FROM clipboard_history WHERE content = ? ORDER BY created_at DESC LIMIT 1");
      const existing = checkStmt.get(content);
      
      if (existing) {
        // Update the timestamp of existing item instead of creating duplicate
        const updateStmt = db.prepare("UPDATE clipboard_history SET created_at = CURRENT_TIMESTAMP WHERE id = ?");
        updateStmt.run(existing.id);
        resolve({ id: existing.id, success: true });
        return;
      }

      const stmt = db.prepare("INSERT INTO clipboard_history (type, content, preview, size) VALUES (?, ?, ?, ?)");
      const result = stmt.run(type, content, preview || content.substring(0, 100), size || 0);
      resolve({ id: result.lastInsertRowid, success: true });
    } catch (error) {
      console.error("Error adding clipboard item:", error);
      resolve({ success: false, error: error.message });
    }
  });
}

function updateClipboardItem(id, type, content, preview, size) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare("UPDATE clipboard_history SET type = ?, content = ?, preview = ?, size = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
      const result = stmt.run(type, content, preview || content.substring(0, 100), size || 0, id);
      resolve({ success: result.changes > 0 });
    } catch (error) {
      console.error("Error updating clipboard item:", error);
      resolve({ success: false, error: error.message });
    }
  });
}

function deleteClipboardItem(id) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare("DELETE FROM clipboard_history WHERE id = ?");
      const result = stmt.run(id);
      resolve({ success: result.changes > 0 });
    } catch (error) {
      console.error("Error deleting clipboard item:", error);
      resolve({ success: false, error: error.message });
    }
  });
}

function clearClipboardHistory() {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare("DELETE FROM clipboard_history");
      const result = stmt.run();
      resolve({ success: true, deletedCount: result.changes });
    } catch (error) {
      console.error("Error clearing clipboard history:", error);
      resolve({ success: false, error: error.message });
    }
  });
}

module.exports = {
  initDatabase,
  getAllSnippets,
  addSnippet,
  deleteSnippet,
  getAllDocuments,
  addDocument,
  deleteDocument,
  getAllBookmarks,
  addBookmark,
  deleteBookmark,
  getAllTools,
  addTool,
  deleteTool,
  getAllClipboardHistory,
  addClipboardItem,
  updateClipboardItem,
  deleteClipboardItem,
  clearClipboardHistory,
};
