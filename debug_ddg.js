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

async function searchDuckDuckGoAPI(query) {
  try {
    const q = encodeURIComponent(query);
    const url = `https://api.duckduckgo.com/?q=${q}&format=json&no_html=1&skip_disambig=1`;
    const raw = await fetchURL(url);
    if (!raw) return 'No raw';
    
    const data = JSON.parse(raw);
    let results = [];
    if (data.AbstractText) results.push(`• DDG Instant: ${data.AbstractText}`);
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      data.RelatedTopics.slice(0, 2).forEach(topic => {
        if (topic.Text) results.push(`• Related: ${topic.Text}`);
      });
    }
    return results.join('\n') || 'No abstract text or related topics';
  } catch (err) { return `Error: ${err.message}`; }
}

searchDuckDuckGoAPI("who won t20 world cup 2026 final").then(console.log);
