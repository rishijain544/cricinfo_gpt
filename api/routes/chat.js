const express = require('express');
const router = express.Router();
const { getCricketAnswer } = require('../services/aiService');
const { needsLiveSearch, searchCricketNews } = require('../services/searchService');
const { isImageRequest, getPlayerImages } = require('../services/imageService');
const { getLiveScores } = require('../services/scoresService');

router.post('/', async (req, res) => {
  try {
    const { question, history = [] } = req.body;
    if (!question) return res.status(400).json({ error: 'Question required' });

    // Check if image request
    const playerName = isImageRequest(question);
    if (playerName) {
      const images = await getPlayerImages(playerName);
      const answer = await getCricketAnswer(
        `Give a 3 sentence exciting intro about cricketer ${playerName} — country, role, and greatest achievement.`,
        []
      );
      return res.json({ answer, images, isImageResponse: true, playerName });
    }

    // Check if needs live search/context
    let combinedContext = '';
    if (needsLiveSearch(question)) {
      const [searchResults, liveScores] = await Promise.all([
        searchCricketNews(question),
        getLiveScores(),
      ]);

      // Gather all context
      // PLACE SEARCH CONTEXT AT TOP - It is the most specific to the query
      if (searchResults) {
        combinedContext += `${searchResults}\n\n`;
      }

      // Append live score summary if relevant
      if (liveScores && liveScores.length > 0) {
        const scoreSummary = liveScores
          .filter(m => m.isLive)
          .map(m => `• ${m.name} (${m.seriesName}): ${m.status}`)
          .join('\n');
        
        if (scoreSummary) {
          combinedContext += `[Current Live Scores]\n${scoreSummary}\n\n`;
        }
      }
    }

    const answer = await getCricketAnswer(question, history, combinedContext);
    res.json({ answer, images: null, isImageResponse: false });

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
