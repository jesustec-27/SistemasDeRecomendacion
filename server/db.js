const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'biblioia.db'));

// Inicializar tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    title TEXT,
    author TEXT,
    subjects TEXT,
    category TEXT,
    cover_url TEXT,
    link TEXT,
    acquired_at TEXT,
    branch TEXT,
    pages INTEGER,
    publisher TEXT,
    interaction_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    carrera TEXT,
    semestre INTEGER,
    interests TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    book_id TEXT,
    type TEXT,
    rating INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;
