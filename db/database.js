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

                  console.log("Database initialized successfully");
                  resolve();
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

function addSnippet(content) {
  return new Promise((resolve, reject) => {
    try {
      db.run(
        "INSERT INTO snippets (content) VALUES (?)",
        [content],
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

module.exports = {
  initDatabase,
  getAllSnippets,
  addSnippet,
  deleteSnippet,
  getAllDocuments,
  addDocument,
  deleteDocument,
};
