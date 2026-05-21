const db = require('./db');

try {
  const books = db.prepare('SELECT id, title, pages, publisher FROM books WHERE pages IS NOT NULL LIMIT 20').all();
  console.log("Books with non-null pages:", books);
  
  const count = db.prepare('SELECT count(*) as total FROM books WHERE pages IS NOT NULL').get();
  console.log("Total books with pages:", count.total);
  
  const total = db.prepare('SELECT count(*) as total FROM books').get();
  console.log("Total books in DB:", total.total);
} catch (e) {
  console.error(e);
}
