const https = require('https');
const http = require('http');
const { URL } = require('url');

function fetchURL(urlStr, timeout = 6000, redirects = 0) {
  if (redirects > 3) return Promise.resolve('');
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(urlStr);
      const lib = urlObj.protocol === 'https:' ? https : http;
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=1.0',
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

async function searchWikipedia(query) {
  try {
    // 1. Search for top 3 titles
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' cricket')}&format=json&srlimit=3`;
    const searchRaw = await fetchURL(searchUrl);
    if (!searchRaw) return '';
    
    const searchData = JSON.parse(searchRaw);
    const titles = searchData.query?.search?.map(s => s.title) || [];
    if (titles.length === 0) return '';

    // 2. Get summaries for found titles in parallel
    const summaries = await Promise.all(titles.map(async (title) => {
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`;
      const summaryRaw = await fetchURL(summaryUrl);
      if (!summaryRaw) return null;
      try {
        const data = JSON.parse(summaryRaw);
        return data.extract ? `• Wikipedia (${title}): ${data.extract}` : null;
      } catch { return null; }
    }));

    return summaries.filter(s => s).join('\n\n');
  } catch { return ''; }
}

async function searchDuckDuckGoAPI(query) {
  try {
    const q = encodeURIComponent(query);
    const url = `https://api.duckduckgo.com/?q=${q}&format=json&no_html=1&skip_disambig=1`;
    const raw = await fetchURL(url);
    if (!raw) return '';
    
    const data = JSON.parse(raw);
    let results = [];
    if (data.AbstractText) results.push(`• DDG Instant: ${data.AbstractText}`);
    
    // Check related topics for more snippets
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      data.RelatedTopics.slice(0, 2).forEach(topic => {
        if (topic.Text) results.push(`• Related: ${topic.Text}`);
      });
    }
    return results.join('\n');
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

async function searchDuckDuckGoLite(query) {
  try {
    const q = encodeURIComponent(query);
    const html = await fetchURL(`https://duckduckgo.com/lite/?q=${q}`);
    if (!html) return '';
    
    // Lite version has results in table rows or specific classes
    const results = [];
    const snippets = [...html.matchAll(/class="result-snippet"[^>]*>(.*?)<\/td>/gs)]
      .map(m => cleanHTML(m[1])).filter(s => s.length > 30).slice(0, 5);
    
    return snippets.map(s => `• ${s}`).join('\n');
  } catch { return ''; }
}

async function searchCricketNews(query) {
  console.log(`🔍 Ultimate Research: ${query}`);
  
  // High-value targets in parallel
  const [wiki, genDDG, espn, cricbuzz] = await Promise.all([
    searchWikipedia(query),
    searchDuckDuckGoLite(query),
    searchDuckDuckGoLite(`${query} site:espncricinfo.com`),
    searchDuckDuckGoLite(`${query} site:cricbuzz.com`)
  ]);

  let parts = [];
  if (wiki) parts.push(wiki);
  if (espn) parts.push(`[News: ESPNCricinfo]\n${espn}`);
  if (cricbuzz) parts.push(`[News: Cricbuzz]\n${cricbuzz}`);
  if (genDDG) parts.push(`[Web Search]\n${genDDG}`);

  const context = parts.join('\n\n');
  if (context.length < 150) {
    // Greedy Keyword Fallback
    const keywords = query.replace(/who|is|the|of|match|final|won|winner|for|on/gi, '').trim();
    if (keywords.length > 3) {
      const fallback = await searchDuckDuckGoLite(`${keywords} cricket news results`);
      if (fallback) return `[Deep Research Context]\n${fallback}`;
    }
  }

  return context ? `[Authoritative Cricket Context]\n${context.slice(0, 7000)}` : 'Authoritative cricket information is being refined. Please specify the match or event more clearly.';
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
