const db = require('../db');

try {
  const rowCount = db.prepare('SELECT COUNT(*) as count FROM books').get();
  console.log('Total books:', rowCount.count);

  const sampleBooks = db.prepare('SELECT id, title, category, subjects FROM books LIMIT 10').all();
  console.log('Sample books:', JSON.stringify(sampleBooks, null, 2));

  const categories = db.prepare('SELECT category, COUNT(*) as count FROM books GROUP BY category').all();
  console.log('Categories distribution:', JSON.stringify(categories, null, 2));
} catch (err) {
  console.error('Error querying DB:', err);
}
