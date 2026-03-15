const https = require('https');
const http = require('http');

// Helper for fetching with redirect support
function fetchUrl(url, headers = { 'User-Agent': 'Mozilla/5.0' }) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location, headers).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Fetch from RapidAPI Cricbuzz
function fetchRapidAPI(path) {
  const apiKey = (process.env.RAPIDAPI_KEY || '').trim();
  if (!apiKey || apiKey.includes('your')) return Promise.resolve(null);

  return new Promise((resolve) => {
    const options = {
      hostname: 'cricbuzz-cricket.p.rapidapi.com',
      path,
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
      },
    };
    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        // Silent fail for 403/401 to avoid cluttering logs
        return resolve(null);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(4000, () => { req.destroy(); resolve(null); });
    req.end();
  });
}

async function getRSSScores() {
  const feeds = [
    { url: 'https://www.espncricinfo.com/rss/livescores.xml', source: 'ESPN' },
    { url: 'https://push.api.bbci.co.uk/pips/service/news/sport/cricket/rss.xml', source: 'BBC' }
  ];

  let allMatches = [];
  for (const feed of feeds) {
    try {
      const rssData = await fetchUrl(feed.url);
      if (!rssData || !rssData.includes('<item>')) continue;

      const items = rssData.split('<item>').slice(1);
      const matches = items.map((item, idx) => {
        const title = (item.match(/<title>(.*?)<\/title>/)?.[1] || 'Match').replace('<![CDATA[', '').replace(']]>', '');
        const desc = (item.match(/<description>(.*?)<\/description>/)?.[1] || '').replace('<![CDATA[', '').replace(']]>', '');
        
        const cleanTitle = title.replace(/&amp;/g, '&').trim();
        const cleanDesc = desc.replace(/&amp;/g, '&').trim();

        const isLive = cleanDesc.includes('*') || cleanDesc.toLowerCase().includes('needs') || cleanDesc.toLowerCase().includes('ongoing');
        
        return {
          id: `${feed.source}-${idx}`,
          name: cleanTitle,
          seriesName: feed.source === 'BBC' ? 'BBC Sport' : (cleanTitle.split(',')[1]?.trim() || 'International'),
          status: cleanDesc || 'Match in progress',
          venue: 'Various',
          matchType: cleanTitle.includes('Test') ? 'TEST' : (cleanTitle.includes('ODI') ? 'ODI' : 'T20'),
          isLive: isLive,
          priority: isLive ? 1 : 2,
          source: feed.source
        };
      });
      allMatches = [...allMatches, ...matches];
    } catch (err) {
      console.warn(`RSS feed fail (${feed.source}):`, err.message);
    }
  }
  return allMatches;
}

async function getLiveScores() {
  try {
    let matches = [];

    // 1. Try RapidAPI (Silently fails if 403)
    const data = await fetchRapidAPI('/matches/v1/live');
    if (data && data.typeMatches) {
        // ... (RapidAPI parsing logic stays same) ...
        const typeMatches = data.typeMatches || [];
        for (const type of typeMatches) {
          const seriesList = type.seriesMatches || [];
          for (const series of seriesList) {
            const seriesAdWrapper = series.seriesAdWrapper || series;
            const matchList = seriesAdWrapper.matches || [];
            for (const match of matchList) {
              const info = match.matchInfo || {};
              const score = match.matchScore || {};
              const team1 = info.team1?.teamName || '';
              const team2 = info.team2?.teamName || '';
              const extractScore = (ts) => {
                if (!ts) return null;
                const i = ts.inngs4 || ts.inngs3 || ts.inngs2 || ts.inngs1;
                return i ? { r: i.runs, w: i.wickets, o: i.overs } : null;
              };
              const s1 = extractScore(score.team1Score);
              const s2 = extractScore(score.team2Score);
              const scores = [];
              if (s1) scores.push({ inning: team1, ...s1 });
              if (s2) scores.push({ inning: team2, ...s2 });
              const state = (info.state || '').toLowerCase();
              const isLive = state === 'in progress' || state === 'live' || state === 'stumps';
              let priority = 4;
              if (isLive) priority = 1;
              else if (info.status?.toLowerCase().includes('won')) priority = 3;
              
              matches.push({
                id: info.matchId || Math.random().toString(),
                name: `${team1} vs ${team2}`,
                seriesName: info.seriesName || '',
                status: info.status || 'Upcoming',
                venue: info.venueInfo?.ground || '',
                matchType: (info.matchFormat || 'T20').toUpperCase(),
                teams: [team1, team2],
                score: scores,
                isLive: isLive,
                priority: priority,
                source: 'Cricbuzz'
              });
            }
          }
        }
    }

    // 2. Multi-RSS Fallback
    const rssMatches = await getRSSScores();
    if (rssMatches.length > 0) {
      const existingNames = new Set(matches.map(m => m.name.toLowerCase()));
      const uniqueRss = rssMatches.filter(m => !existingNames.has(m.name.toLowerCase()));
      matches = [...matches, ...uniqueRss];
    }

    // 3. Ultimate Mock Fallback if EVERYTHING failed (should not happen with RSS)
    if (matches.length === 0) {
      matches = getMockScores();
    }

    // Sort: Priority (1=Live, 2=Recent/RSS, etc)
    matches.sort((a, b) => (a.priority || 4) - (b.priority || 4));

    return matches.slice(0, 15);

  } catch (err) {
    console.error('Scores fetch error:', err.message);
    return getMockScores();
  }
}

function getMockScores() {
  return [
    {
      id: 'mock1', name: 'IND vs AUS', seriesName: 'BGT 2025',
      status: 'Live: Day 3 Stumps', matchType: 'TEST', isLive: true,
      teams: ['IND', 'AUS'],
      score: [
        { inning: 'AUS', r: 312, w: 10, o: 88.2 },
        { inning: 'IND', r: 245, w: 4, o: 72.0 },
      ],
      priority: 1, source: 'Mock'
    }
  ];
}

module.exports = { getLiveScores };
