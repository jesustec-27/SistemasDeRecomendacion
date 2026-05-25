const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  try {
    const topBooks = db.prepare(`
      SELECT id, title, author, interaction_count 
      FROM books 
      ORDER BY interaction_count DESC 
      LIMIT 10
    `).all();
    
    const categories = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM books 
      GROUP BY category
    `).all();
    
    const heatmap = db.prepare(`
      SELECT u.carrera, u.semestre, COUNT(i.id) as interactions
      FROM interactions i
      JOIN users u ON i.user_id = u.id
      GROUP BY u.carrera, u.semestre
    `).all();
    
    res.json({
      topBooks,
      categories,
      heatmap
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
