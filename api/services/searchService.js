const https = require('https');
const http = require('http');
const { URL } = require('url');

function fetchURL(urlStr, timeout = 6000) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(urlStr);
      const lib = urlObj.protocol === 'https:' ? https : http;
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/json',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout,
      };
      const req = lib.get(options, (res) => {
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

async function searchDuckDuckGo(query) {
  try {
    const q = encodeURIComponent(query);
    const html = await fetchURL(`https://html.duckduckgo.com/html/?q=${q}`);
    if (!html) return '';
    const snippets = [...html.matchAll(/class="result__snippet"[^>]*>(.*?)<\/a>/gs)]
      .map(m => cleanHTML(m[1])).filter(s => s.length > 30).slice(0, 5);
    const titles = [...html.matchAll(/class="result__title"[^>]*>.*?<a[^>]*>(.*?)<\/a>/gs)]
      .map(m => cleanHTML(m[1])).slice(0, 5);
    return titles.map((t, i) => `• ${t}: ${snippets[i] || ''}`).filter(r => r.length > 10).join('\n');
  } catch { return ''; }
}

async function searchBing(query) {
  try {
    const q = encodeURIComponent(query);
    const html = await fetchURL(`https://www.bing.com/search?q=${q}&count=5`);
    if (!html) return '';
    const results = [...html.matchAll(/<p[^>]*>(.*?)<\/p>/gs)]
      .map(m => cleanHTML(m[1])).filter(s => s.length > 40 && s.length < 400).slice(0, 5);
    return results.map(r => `• ${r}`).join('\n');
  } catch { return ''; }
}

async function searchWikipedia(query) {
  try {
    const q = encodeURIComponent(query + ' cricket');
    const raw = await fetchURL(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q}&format=json&srlimit=3`);
    if (!raw) return '';
    const data = JSON.parse(raw);
    return data.query?.search?.slice(0, 3)
      .map(r => `• ${r.title}: ${cleanHTML(r.snippet)}`)
      .join('\n') || '';
  } catch { return ''; }
}

async function searchCricketNews(query) {
  console.log(`🔍 Searching: ${query}`);
  let result = await searchDuckDuckGo(query);
  if (result) return `[Live Search: "${query}"]\n${result}`;
  result = await searchBing(query);
  if (result) return `[Live Search: "${query}"]\n${result}`;
  result = await searchWikipedia(query);
  if (result) return `[Wikipedia: "${query}"]\n${result}`;
  return '';
}

function needsLiveSearch(question) {
  const keywords = [
    '2024','2025','2026','2027','current','today','now','latest','recent','live',
    'score','scorecard','result','winner','won','lost','who won','playing now',
    'match today','next match','upcoming','ipl','world cup','champions trophy',
    'ashes','series','final','semi-final','schedule','ranking','number 1',
    'new captain','appointed','retired','debut','injured','injury','squad',
    'selected','dropped','auction','record','broke','broken','new record',
    'wtc','test championship',
  ];
  const q = question.toLowerCase();
  return keywords.some(kw => q.includes(kw));
}

module.exports = { searchCricketNews, needsLiveSearch };
