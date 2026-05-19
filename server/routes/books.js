const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  try {
    const books = db.prepare('SELECT * FROM books ORDER BY acquired_at DESC').all();
    
    // Parsear subjects de JSON string a array
    const parsedBooks = books.map(book => ({
      ...book,
      subjects: JSON.parse(book.subjects || '[]')
    }));
    
    res.json(parsedBooks);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    
    res.json({
      ...book,
      subjects: JSON.parse(book.subjects || '[]')
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
