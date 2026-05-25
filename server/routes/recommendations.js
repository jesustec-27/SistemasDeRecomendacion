const express = require('express');
const router = express.Router();
const { getHybridRecommendations } = require('../services/hybrid');

router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  const { contentWeight, collabWeight, boosted } = req.query;
  
  try {
    const recommendations = getHybridRecommendations(userId, {
      contentWeight: contentWeight ? parseFloat(contentWeight) : 0.6,
      collabWeight: collabWeight ? parseFloat(collabWeight) : 0.4,
      boosted: boosted !== 'false'
    });
    
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
