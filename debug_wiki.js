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

async function searchWikipedia(query) {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' cricket')}&format=json&srlimit=1`;
    console.log(`Search URL: ${searchUrl}`);
    const searchRaw = await fetchURL(searchUrl);
    console.log(`Search Raw sample: ${searchRaw.slice(0, 100)}`);
    
    if (!searchRaw) return 'No search results';
    
    const searchData = JSON.parse(searchRaw);
    const title = searchData.query?.search?.[0]?.title;
    if (!title) return 'No title found';
    console.log(`Found title: ${title}`);

    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`;
    console.log(`Summary URL: ${summaryUrl}`);
    const summaryRaw = await fetchURL(summaryUrl);
    
    const summaryData = JSON.parse(summaryRaw);
    return summaryData.extract || 'No extract';
  } catch (err) { return `Error: ${err.message}`; }
}

searchWikipedia("t20 world cup 2026 winner").then(console.log);
