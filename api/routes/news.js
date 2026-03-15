const express = require('express');
const router = express.Router();
const newsService = require('../services/newsService');

router.get('/', async (req, res) => {
  try {
    const news = await newsService.getLatestNews();
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

module.exports = router;
