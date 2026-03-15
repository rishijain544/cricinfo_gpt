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

async function searchWikipedia(query) {
  try {
    const q = encodeURIComponent(query + ' cricket');
    const raw = await fetchURL(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q}&format=json&srlimit=3`);
    if (!raw) return '';
    const data = JSON.parse(raw);
    return data.query?.search?.slice(0, 3)
      .map(r => `• Wiki: ${r.title} - ${cleanHTML(r.snippet)}`)
      .join('\n') || '';
  } catch { return ''; }
}

const JUNK_KEYWORDS = ['currency', 'exchange', 'rate', 'price', 'related searches', 'feedback', 'settings'];

function isJunk(text) {
  const lower = text.toLowerCase();
  return JUNK_KEYWORDS.some(kw => lower.includes(kw));
}

async function searchDuckDuckGo(query) {
  try {
    const enrichedQuery = query.toLowerCase().includes('cricket') ? query : `${query} cricket`;
    const q = encodeURIComponent(enrichedQuery);
    const html = await fetchURL(`https://html.duckduckgo.com/html/?q=${q}`);
    if (!html) return '';
    
    const results = [];
    const mainMatches = [...html.matchAll(/class="result__body"[^>]*>(.*?)<\/div>/gs)];
    
    for (const match of mainMatches.slice(0, 10)) {
      const body = match[1];
      const titleMatch = body.match(/class="result__a"[^>]*>(.*?)<\/a>/s);
      const snippetMatch = body.match(/class="result__snippet"[^>]*>(.*?)<\/a>/s);
      
      if (titleMatch) {
        const title = cleanHTML(titleMatch[1]);
        const snippet = snippetMatch ? cleanHTML(snippetMatch[1]) : '';
        const combined = `${title}: ${snippet}`;
        
        if (!isJunk(combined) && combined.length > 50) {
          results.push(`• ${combined}`);
        }
      }
    }
    return results.slice(0, 5).join('\n');
  } catch { return ''; }
}

async function searchBing(query) {
  try {
    const q = encodeURIComponent(`${query} cricket updates`);
    const html = await fetchURL(`https://www.bing.com/search?q=${q}`);
    if (!html) return '';
    
    const results = [];
    const snippets = [...html.matchAll(/<div class="b_caption"[^>]*>(.*?)<\/div>/gs)]
      .map(m => cleanHTML(m[1]));
    
    const paragraphs = [...html.matchAll(/<p[^>]*>(.*?)<\/p>/gs)]
      .map(m => cleanHTML(m[1]));

    const all = [...snippets, ...paragraphs];
    for (const r of all) {
      if (!isJunk(r) && r.length > 40 && !results.includes(`• ${r}`)) {
        results.push(`• ${r}`);
      }
    }
    return results.slice(0, 5).join('\n');
  } catch { return ''; }
}

async function searchCricketNews(query) {
  console.log(`🔍 Deep Search: ${query}`);
  
  // Try very specific sources first
  const specificQueries = [
    `${query} site:espncricinfo.com`,
    `${query} site:bcci.tv`,
    `${query} site:icc-cricket.com`
  ];

  let combinedResults = [];
  
  // Try one specific site search
  const siteResults = await searchDuckDuckGo(specificQueries[0]);
  if (siteResults) combinedResults.push(siteResults);

  // If we still don't have enough, try general search
  if (combinedResults.length === 0 || combinedResults.join('\n').length < 500) {
    const generalDDG = await searchDuckDuckGo(query);
    if (generalDDG) combinedResults.push(generalDDG);
  }

  // Backup results
  if (combinedResults.length === 0 || combinedResults.join('\n').length < 800) {
    const bing = await searchBing(query);
    if (bing) combinedResults.push(bing);
    
    const wiki = await searchWikipedia(query);
    if (wiki) combinedResults.push(wiki);
  }

  const finalResults = [...new Set(combinedResults)].join('\n');
  return finalResults ? `[Live Cricket Search Results]\n${finalResults.slice(0, 4000)}` : '';
}

function needsLiveSearch(question) {
  const keywords = [
    '2024','2025','2026','2027','current','today','now','latest','recent','live',
    'score','scorecard','result','winner','won','lost','who won','playing now',
    'match today','next match','upcoming','ipl','world cup','champions trophy',
    'ashes','series','final','semi-final','schedule','ranking','number 1',
    'new captain','appointed','retired','debut','injured','injury','squad',
    'selected','dropped','auction','record','broke','broken','new record',
    'wtc','test championship','wplt20','t20wc',
  ];
  const q = question.toLowerCase();
  return keywords.some(kw => q.includes(kw)) || q.match(/\d{4}/);
}

module.exports = { searchCricketNews, needsLiveSearch };
