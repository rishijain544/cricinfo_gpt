const https = require('https');
const http = require('http');
const { URL } = require('url');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0'
];

function getRandomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function fetchURL(urlStr, timeout = 7000, redirects = 0) {
  if (redirects > 4) return Promise.resolve('');
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(urlStr);
      const lib = urlObj.protocol === 'https:' ? https : http;
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        headers: {
          'User-Agent': getRandomUA(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=1.0',
          'Referer': 'https://www.google.com/',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout,
      };
      const req = lib.get(options, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = new URL(res.headers.location, urlStr).href;
          return fetchURL(nextUrl, timeout, redirects + 1).then(resolve);
        }
        res.setEncoding('utf8');
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });
      req.on('error', () => resolve(''));
      req.on('timeout', () => { req.destroy(); resolve(''); });
    } catch { resolve(''); }
  });
}

function cleanHTML(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&amp;|&quot;|&#39;|&lt;|&gt;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveTournament(query) {
  let q = query.toLowerCase();
  
  // Specific catch-all for 2024-2026 World Cups
  if (q.includes('2026') && (q.includes('t20') || q.includes('world cup'))) {
    return "2026 ICC Men's T20 World Cup";
  }
  if (q.includes('2024') && (q.includes('t20') || q.includes('world cup'))) {
    return "2024 ICC Men's T20 World Cup";
  }
  if (q.includes('2025') && q.includes('champions trophy')) {
    return "2025 ICC Champions Trophy";
  }

  const yearMatch = q.match(/20\d{2}/);
  const year = yearMatch ? yearMatch[0] : null;

  if (q.includes('t20wc') || q.includes('t20 world cup')) {
    return `${year || '2026'} ICC Men's T20 World Cup`;
  }
  if (q.includes('odi wc') || (q.includes('world cup') && !q.includes('t20'))) {
    return `${year || '2027'} ICC Cricket World Cup`;
  }
  if (q.includes('ipl')) {
    // Standardize to "YYYY Indian Premier League" for Wikipedia
    const iplRes = year ? `${year} Indian Premier League` : "Indian Premier League";
    // Also include TATA IPL for better matching
    if (year) return `${year} TATA IPL winner final`;
    return iplRes;
  }
  if (q.includes('wpl')) {
    return year ? `${year} Women's Premier League (cricket)` : "Women's Premier League (cricket)";
  }
  return query;
}

async function searchWikipedia(query) {
  try {
    const targetQuery = resolveTournament(query);
    const isHistorical = query.match(/20\d{2}/) && !query.includes('2026') && !query.includes('2027');
    
    // Try multiple search variations
    const queries = [
      targetQuery,
      isHistorical ? `${targetQuery} winner` : `${targetQuery} final`,
      isHistorical ? `${targetQuery} champion` : `${targetQuery} result`
    ];
    
    const allTitles = await Promise.all(queries.map(async (q) => {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&srlimit=5`;
      const raw = await fetchURL(searchUrl);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return data.query?.search?.map(s => s.title) || [];
    }));

    const titles = [...new Set(allTitles.flat())].slice(0, 6);
    if (titles.length === 0) return '';

    const summaries = await Promise.all(titles.map(async (title) => {
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`;
      const summaryRaw = await fetchURL(summaryUrl);
      if (!summaryRaw) return null;
      try {
        const data = JSON.parse(summaryRaw);
        // Prioritize extracts that mention "winner", "defeated", "champion", or "final"
        const extract = data.extract || '';
        const weight = (extract.toLowerCase().includes('winner') || extract.toLowerCase().includes('defeated')) ? '[KEY FACT] ' : '';
        return extract ? `• Source Wikipedia (${title}): ${weight}${extract}` : null;
      } catch { return null; }
    }));

    return summaries.filter(s => s).join('\n\n');
  } catch { return ''; }
}

async function searchDuckDuckGoLite(query) {
  try {
    const q = encodeURIComponent(query);
    const html = await fetchURL(`https://duckduckgo.com/lite/?q=${q}`);
    if (!html) return '';
    const snippets = [...html.matchAll(/class="result-snippet"[^>]*>(.*?)<\/td>/gs)]
      .map(m => cleanHTML(m[1])).filter(s => s.length > 20).slice(0, 8);
    
    // Weight snippets that look like they contain the answer
    return snippets.map(s => {
      const lower = s.toLowerCase();
      const isWinner = lower.includes('winner') || lower.includes('champion') || lower.includes('defeated') || lower.includes('won by') || lower.includes('triumphed');
      const prefix = isWinner ? '[KEY RESULT] ' : '• ';
      return `${prefix}${s}`;
    }).join('\n');
  } catch { return ''; }
}

async function searchOfficialSites(query) {
  const q = query.toLowerCase();
  const yearMatch = q.match(/20\d{2}/);
  const year = yearMatch ? yearMatch[0] : '';
  let siteQueries = [];

  if (q.includes('ipl')) {
    // Targeted searches for IPL winner and final
    siteQueries.push(`site:iplt20.com ${year} IPL winner`);
    siteQueries.push(`site:iplt20.com ${year} TATA IPL final`);
    siteQueries.push(`site:iplt20.com ${year} IPL champions`);
    // Fallback to other authoritative site if iplt20.com is silent
    siteQueries.push(`site:espncricinfo.com ${year} IPL final match report winner`);
  } else {
    // For general cricket queries, target ICC
    siteQueries.push(`site:icc-cricket.com ${query}`);
    if (year) {
      siteQueries.push(`site:icc-cricket.com ${year} world cup winner`);
    }
  }

  try {
    const results = await Promise.all(siteQueries.map(sq => searchDuckDuckGoLite(sq)));
    return results.filter(r => r).join('\n');
  } catch { return ''; }
}

async function searchCricketNews(query) {
  console.log(`🔍 Extreme Research: ${query}`);
  const tournament = resolveTournament(query);
  const isHistorical = query.match(/20\d{2}/) && !query.includes('2026') && !query.includes('2027');
  
  // High-value targeted searches
  const searchTerms = isHistorical 
    ? `${tournament} winner final result match summary`
    : `${tournament} final match details summary`;

  const [official, wiki, mainResults] = await Promise.all([
    searchOfficialSites(query),
    searchWikipedia(query),
    searchDuckDuckGoLite(searchTerms)
  ]);

  let parts = [];
  if (official) parts.push(`[Official Site Information]\n${official}`);
  if (wiki) parts.push(wiki);
  if (mainResults) parts.push(`[Authoritative Data Snippets]\n${mainResults}`);

  // If match specific info (like scorecard) is requested, or if it's historical and we haven't found much
  if (query.includes('scorecard') || query.includes('stat') || query.includes('result') || (isHistorical && parts.join('').length < 500)) {
    const deepSearch = await searchDuckDuckGoLite(`${query} winner result scorecard espncricinfo`);
    if (deepSearch) parts.push(`[Detailed Historical Context]\n${deepSearch}`);
  }

  const context = parts.join('\n\n');
  return context ? `[Authoritative Cricket Context]\n${context.slice(0, 8000)}` : '';
}

function needsLiveSearch(question) {
  const keywords = [
    '2024','2025','2026','2027','current','today','now','latest','recent','live',
    'score','scorecard','result','winner','won','lost','who won','playing now',
    'match today','next match','upcoming','ipl','world cup','champions trophy',
    'ashes','series','final','semi-final','schedule','ranking','number 1',
    'new captain','appointed','retired','debut',
    'selected','dropped','auction','record','broke','broken','new record',
    'wtc','test championship','wplt20','t20wc',
  ];
  const q = question.toLowerCase();
  return keywords.some(kw => q.includes(kw)) || q.match(/\d{4}/);
}

module.exports = { searchCricketNews, needsLiveSearch };
