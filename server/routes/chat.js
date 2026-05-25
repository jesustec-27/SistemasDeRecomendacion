const express = require('express');
const router = express.Router();
const { askBiblioFlix } = require('../services/gemini');

router.post('/', async (req, res) => {
  const { query, userId } = req.body;
  if (!query || !userId) return res.status(400).json({ error: 'Query and userId required' });

  const result = await askBiblioFlix(query, userId);
  res.json({ 
    response: result.text, 
    matchedBooks: result.matchedBooks 
  });
});

module.exports = router;
