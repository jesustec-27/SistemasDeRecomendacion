const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', (req, res) => {
  const { id, carrera, semestre, interests } = req.body;
  
  try {
    const stmt = db.prepare(`
      INSERT INTO users (id, carrera, semestre, interests)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        carrera=excluded.carrera,
        semestre=excluded.semestre,
        interests=excluded.interests
    `);
    
    stmt.run(id, carrera, semestre, JSON.stringify(interests || []));
    
    res.json({ success: true, user: { id, carrera, semestre, interests } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({
      ...user,
      interests: JSON.parse(user.interests || '[]')
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
