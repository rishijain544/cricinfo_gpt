const https = require('https');
const http = require('http');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function getLatestNews() {
  const sources = [
    { name: 'ESPNCricinfo', url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml' },
    { name: 'BBC Cricket', url: 'https://feeds.bbci.co.uk/sport/cricket/rss.xml' }
  ];

  let allNews = [];

  for (const source of sources) {
    try {
      console.log(`Fetching news from ${source.name}...`);
      const xml = await fetchUrl(source.url);
      
      // Better split handling case-insensitivity and attributes
      const items = xml.split(/<item[\s>]/i).slice(1);
      console.log(`Found ${items.length} raw items from ${source.name}`);
      
      const parsed = items.map(item => {
        // Use [\s\S]*? for multiline matching
        const title = (item.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '')
          .replace('<![CDATA[', '').replace(']]>', '').trim();
        const link = (item.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || '')
          .replace('<![CDATA[', '').replace(']]>', '').trim();
        const desc = (item.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || '')
          .replace('<![CDATA[', '').replace(']]>', '').trim();
        const date = (item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || '').trim();

        if (!title) return null;

        return {
          title: title.replace(/&amp;/g, '&'),
          link,
          description: desc.replace(/&amp;/g, '&').replace(/<[^>]*>?/gm, '').substring(0, 150) + (desc.length > 150 ? '...' : ''),
          source: source.name,
          date: date
        };
      }).filter(Boolean);
      
      console.log(`Successfully parsed ${parsed.length} news items from ${source.name}`);
      allNews = [...allNews, ...parsed];
    } catch (err) {
      console.error(`Error fetching news from ${source.name}:`, err.message);
    }
  }

  // Shuffle and limit
  return allNews.sort(() => 0.5 - Math.random()).slice(0, 15);
}

module.exports = { getLatestNews };
