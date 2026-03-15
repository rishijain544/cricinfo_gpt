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
      req.on('error', (e) => resolve(`Error: ${e.message}`));
      req.on('timeout', () => { req.destroy(); resolve('Timeout'); });
    } catch (e) { resolve(`Catch Error: ${e.message}`); }
  });
}

async function debugLite() {
    const query = "who won t20 world cup 2026 winner";
    const q = encodeURIComponent(query);
    const html = await fetchURL(`https://duckduckgo.com/lite/?q=${q}`);
    console.log("--- HTML SAMPLE (LAST 2000 chars) ---");
    console.log(html.slice(-2000));
    console.log("-------------------");
    
    // Attempt multiple regexes
    const r1 = [...html.matchAll(/class="result-snippet"[^>]*>(.*?)<\/td>/gs)];
    const r2 = [...html.matchAll(/<td[^>]*>(.*?)<\/td>/gs)];
    
    console.log(`R1 (result-snippet): ${r1.length} matches`);
    console.log(`R2 (all columns): ${r2.length} matches`);
    
    if (r2.length > 0) {
        console.log("Sample R2 results:");
        r2.slice(4, 10).forEach(m => console.log(`- ${m[1].slice(0, 100)}`));
    }
}

debugLite();
