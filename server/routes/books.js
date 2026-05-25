const express = require('express');
const router = express.Router();
const db = require('../db');
const { getHybridRecommendations } = require('../services/hybrid');

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
    const { userId } = req.query;
    let book = null;

    if (userId) {
      // Intentar obtener de las recomendaciones híbridas para tener la explicación personalizada
      const recommendations = getHybridRecommendations(userId);
      book = recommendations.find(b => b.id === req.params.id);
    }

    if (!book) {
      // Fallback a buscar directo en la base de datos si no hay userId o no se encontró en recomendaciones
      const rawBook = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
      if (!rawBook) return res.status(404).json({ error: 'Book not found' });
      
      book = {
        ...rawBook,
        subjects: JSON.parse(rawBook.subjects || '[]'),
        explanation: "Te recomendamos este libro por su relevancia general en el catálogo de ingeniería."
      };
    }
    
    res.json(book);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
