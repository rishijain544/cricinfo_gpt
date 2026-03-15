require('dotenv').config();
const express = require('express');
const cors = require('cors');
const chatRoute = require('./routes/chat');
const scoresRoute = require('./routes/scores');
const imagesRoute = require('./routes/images');
const newsRoute = require('./routes/news');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/chat', chatRoute);
app.use('/api/scores', scoresRoute);
app.use('/api/images', imagesRoute);
app.use('/api/news', newsRoute);

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'CricketGPT API' }));

if (require.main === module) {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

module.exports = app;
