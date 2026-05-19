const express = require('express');
const router = express.Router();
const { askBiblioIA } = require('../services/gemini');

router.post('/', async (req, res) => {
  const { query, userId } = req.body;
  if (!query || !userId) return res.status(400).json({ error: 'Query and userId required' });

  const response = await askBiblioIA(query, userId);
  res.json({ response });
});

module.exports = router;
