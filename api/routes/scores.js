const express = require('express');
const router = express.Router();
const { getLiveScores } = require('../services/scoresService');

router.get('/', async (req, res) => {
  try {
    const scores = await getLiveScores();
    res.json({ scores });
  } catch (err) {
    console.error('Scores error:', err);
    res.status(500).json({ error: err.message, scores: [] });
  }
});

module.exports = router;
