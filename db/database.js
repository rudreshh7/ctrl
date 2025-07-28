const sqlite3 = require("sqlite3").verbose();
const path = require("path");

let db = null;

function initDatabase() {
  return new Promise((resolve, reject) => {
    try {
      db = new sqlite3.Database(
        path.join(__dirname, "..", "data.db"),
        (err) => {
          if (err) {
            console.error("Failed to connect to database:", err);
            reject(err);
            return;
          }

          // Create snippets table
          db.run(
            `
          CREATE TABLE IF NOT EXISTS snippets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `,
            (err) => {
              if (err) {
                console.error("Failed to create snippets table:", err);
                reject(err);
                return;
              }

              // Create documents table
              db.run(
                `
            CREATE TABLE IF NOT EXISTS documents (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT NOT NULL,
              link TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `,
                (err) => {
                  if (err) {
                    console.error("Failed to create documents table:", err);
                    reject(err);
                    return;
                  }

                  // Create bookmarks table
                  db.run(
                    `
                CREATE TABLE IF NOT EXISTS bookmarks (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  title TEXT NOT NULL,
                  url TEXT NOT NULL,
                  description TEXT,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
              `,
                    (err) => {
                      if (err) {
                        console.error("Failed to create bookmarks table:", err);
                        reject(err);
                        return;
                      }

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
                    }
                  );
                }
              );
            }
          );
        }
      );
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
      db.all("SELECT * FROM snippets ORDER BY created_at DESC", (err, rows) => {
        if (err) {
          console.error("Error getting snippets:", err);
          resolve([]);
        } else {
          resolve(rows);
        }
      });
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

      db.run(
        "INSERT INTO snippets (title, description, content) VALUES (?, ?, ?)",
        [title || "", description || "", content.trim()],
        function (err) {
          if (err) {
            console.error("Error adding snippet:", err);
            resolve({ success: false, error: err.message });
          } else {
            resolve({ id: this.lastID, success: true });
          }
        }
      );
    } catch (error) {
      console.error("Error adding snippet:", error);
      resolve({ success: false, error: error.message });
    }
  });
}

function deleteSnippet(id) {
  return new Promise((resolve, reject) => {
    try {
      db.run("DELETE FROM snippets WHERE id = ?", [id], function (err) {
        if (err) {
          console.error("Error deleting snippet:", err);
          resolve({ success: false, error: err.message });
        } else {
          resolve({ success: this.changes > 0 });
        }
      });
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
      db.all(
        "SELECT * FROM documents ORDER BY created_at DESC",
        (err, rows) => {
          if (err) {
            console.error("Error getting documents:", err);
            resolve([]);
          } else {
            resolve(rows);
          }
        }
      );
    } catch (error) {
      console.error("Error getting documents:", error);
      resolve([]);
    }
  });
}

function addDocument(title, link) {
  return new Promise((resolve, reject) => {
    try {
      db.run(
        "INSERT INTO documents (title, link) VALUES (?, ?)",
        [title, link],
        function (err) {
          if (err) {
            console.error("Error adding document:", err);
            resolve({ success: false, error: err.message });
          } else {
            resolve({ id: this.lastID, success: true });
          }
        }
      );
    } catch (error) {
      console.error("Error adding document:", error);
      resolve({ success: false, error: error.message });
    }
  });
}

function deleteDocument(id) {
  return new Promise((resolve, reject) => {
    try {
      db.run("DELETE FROM documents WHERE id = ?", [id], function (err) {
        if (err) {
          console.error("Error deleting document:", err);
          resolve({ success: false, error: err.message });
        } else {
          resolve({ success: this.changes > 0 });
        }
      });
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
      db.all(
        "SELECT * FROM bookmarks ORDER BY created_at DESC",
        (err, rows) => {
          if (err) {
            console.error("Error getting bookmarks:", err);
            resolve([]);
          } else {
            resolve(rows);
          }
        }
      );
    } catch (error) {
      console.error("Error getting bookmarks:", error);
      resolve([]);
    }
  });
}

function addBookmark(title, url, description = "") {
  return new Promise((resolve, reject) => {
    try {
      db.run(
        "INSERT INTO bookmarks (title, url, description) VALUES (?, ?, ?)",
        [title, url, description],
        function (err) {
          if (err) {
            console.error("Error adding bookmark:", err);
            resolve({ success: false, error: err.message });
          } else {
            resolve({ id: this.lastID, success: true });
          }
        }
      );
    } catch (error) {
      console.error("Error adding bookmark:", error);
      resolve({ success: false, error: error.message });
    }
  });
}

function deleteBookmark(id) {
  return new Promise((resolve, reject) => {
    try {
      db.run("DELETE FROM bookmarks WHERE id = ?", [id], function (err) {
        if (err) {
          console.error("Error deleting bookmark:", err);
          resolve({ success: false, error: err.message });
        } else {
          resolve({ success: this.changes > 0 });
        }
      });
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

    if (snippets.length > 0 || documents.length > 0 || bookmarks.length > 0) {
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

    console.log("Sample data added successfully");
  } catch (error) {
    console.error("Error adding sample data:", error);
  }
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
};
