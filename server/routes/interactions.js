const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', (req, res) => {
  const { user_id, book_id, type, rating } = req.body;
  
  try {
    const insertInteraction = db.prepare(`
      INSERT INTO interactions (user_id, book_id, type, rating)
      VALUES (?, ?, ?, ?)
    `);
    
    const updateBookCount = db.prepare(`
      UPDATE books SET interaction_count = interaction_count + 1 WHERE id = ?
    `);
    
    // Ejecutar en transacción
    const transaction = db.transaction(() => {
      insertInteraction.run(user_id, book_id, type, rating || null);
      updateBookCount.run(book_id);
    });
    
    transaction();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/user/:userId', (req, res) => {
  try {
    const interactions = db.prepare(`
      SELECT i.*, b.title, b.author, b.cover_url 
      FROM interactions i
      JOIN books b ON i.book_id = b.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
    `).all(req.params.userId);
    
    res.json(interactions);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
