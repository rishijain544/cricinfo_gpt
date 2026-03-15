const express = require('express');
const router = express.Router();
const { getPlayerImages } = require('../services/imageService');

router.get('/:player', async (req, res) => {
  try {
    const images = await getPlayerImages(req.params.player);
    res.json({ images });
  } catch (err) {
    res.status(500).json({ error: err.message, images: [] });
  }
});

module.exports = router;
