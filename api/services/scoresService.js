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
  return new Promise((resolve) => {
    const options = {
      hostname: 'cricbuzz-cricket.p.rapidapi.com',
      path,
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com',
        'x-rapidapi-key': (process.env.RAPIDAPI_KEY || '').trim(),
      },
    };
    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        console.warn(`RapidAPI error: ${res.statusCode}`);
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
    req.setTimeout(5000, () => { req.destroy(); resolve(null); });
    req.end();
  });
}

async function getRSSScores() {
  try {
    const rssData = await fetchUrl('https://www.espncricinfo.com/rss/livescores.xml');
    if (!rssData || !rssData.includes('<item>')) return [];

    const items = rssData.split('<item>').slice(1);
    const matches = items.map((item, idx) => {
      const title = item.match(/<title>(.*?)<\/title>/)?.[1] || 'Match';
      const desc = item.match(/<description>(.*?)<\/description>/)?.[1] || '';
      const guid = item.match(/<guid>(.*?)<\/guid>/)?.[1] || idx.toString();

      // Basic cleanup
      const cleanTitle = title.replace('<![CDATA[', '').replace(']]>', '').replace(/&amp;/g, '&');
      const cleanDesc = desc.replace('<![CDATA[', '').replace(']]>', '').replace(/&amp;/g, '&');

      // Detect Live status based on description content
      const isLive = cleanDesc.includes('*') || cleanDesc.includes('needs') || cleanDesc.includes('won');
      
      // Parse teams from title: "Team A vs Team B, 2nd Test"
      const teams = cleanTitle.split(',')[0].split(' vs ');
      
      // Parse scores from description: "Team A 312/8 (50.0) v Team B 268/4 (43.4)"
      const scoreParts = cleanDesc.split(' v ');
      const scores = scoreParts.map(part => {
        const teamMatch = part.match(/(.*?) (\d+\/\d+|\d+)(?: \((\d+\.?\d*)\))?/);
        if (teamMatch) {
          return {
            inning: teamMatch[1].replace('*', '').trim(),
            r: parseInt(teamMatch[2].split('/')[0]),
            w: parseInt(teamMatch[2].split('/')[1] || 10),
            o: teamMatch[3] || '0.0'
          };
        }
        return null;
      }).filter(Boolean);

      return {
        id: guid.split('/').pop() || idx.toString(),
        name: teams.join(' vs '),
        seriesName: cleanTitle.split(',')[1]?.trim() || 'Series',
        status: cleanDesc,
        venue: 'International Grounds',
        matchType: cleanTitle.includes('Test') ? 'TEST' : (cleanTitle.includes('ODI') ? 'ODI' : 'T20'),
        teams: teams,
        score: scores,
        isLive: isLive,
        priority: isLive ? 1 : 2,
        source: 'RSS'
      };
    });

    return matches;
  } catch (err) {
    console.warn('RSS parse error:', err.message);
    return [];
  }
}

async function getLiveScores() {
  try {
    const apiKey = (process.env.RAPIDAPI_KEY || '').trim();
    let matches = [];

    // 1. Try RapidAPI first if key exists
    if (apiKey && !apiKey.includes('your')) {
      const data = await fetchRapidAPI('/matches/v1/live');
      if (data && data.typeMatches) {
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
              
              const extractScore = (teamScore) => {
                if (!teamScore) return null;
                const inngs = teamScore.inngs4 || teamScore.inngs3 || teamScore.inngs2 || teamScore.inngs1;
                return inngs ? { r: inngs.runs, w: inngs.wickets, o: inngs.overs } : null;
              };

              const s1 = extractScore(score.team1Score);
              const s2 = extractScore(score.team2Score);

              const scores = [];
              if (s1) scores.push({ inning: team1, ...s1 });
              if (s2) scores.push({ inning: team2, ...s2 });

              const state = (info.state || '').toLowerCase();
              const isLive = state === 'in progress' || state === 'live' || state === 'stumps';
              
              let priority = 4;
              if (state === 'in progress' || state === 'live') priority = 1;
              else if (state === 'stumps') priority = 2;
              else if (state === 'complete' || info.status?.toLowerCase().includes('won')) priority = 3;

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
    }

    // 2. Fallback to RSS if RapidAPI returned no live matches or failed
    const liveMatchesCount = matches.filter(m => m.isLive).length;
    if (liveMatchesCount === 0) {
      console.log('Falling back to RSS for live scores...');
      const rssMatches = await getRSSScores();
      if (rssMatches.length > 0) {
        // Filter out matches already in the list if any
        const existingNames = new Set(matches.map(m => m.name.toLowerCase()));
        const uniqueRss = rssMatches.filter(m => !existingNames.has(m.name.toLowerCase()));
        matches = [...uniqueRss, ...matches];
      }
    }

    // Sort: Live (1) -> Stumps (2) -> Results (3) -> Upcoming (4)
    matches.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return parseInt(b.id || 0) - parseInt(a.id || 0);
    });

    return matches.length > 0 ? matches.slice(0, 15) : getMockScores();

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
