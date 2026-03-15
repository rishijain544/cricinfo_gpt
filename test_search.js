const { searchCricketNews } = require('./api/services/searchService');

async function test() {
    const queries = [
        "who won t20wc2026",
        "who is the player of the match of t20wc2026 final"
    ];
    
    for (const query of queries) {
        console.log(`\n--- Testing query: ${query} ---`);
        const results = await searchCricketNews(query);
        console.log(results);
    }
}

test();
