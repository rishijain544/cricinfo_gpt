const { searchCricketNews } = require('./api/services/searchService');

async function testIPL() {
    const questions = [
        "who won ipl 2024",
        "who won ipl 2025",
        "ipl 2024 winner"
    ];

    for (const q of questions) {
        console.log(`\nTesting: ${q}`);
        const res = await searchCricketNews(q);
        console.log("--- RESULT ---");
        console.log(res);
        console.log("--------------");
    }
}

testIPL();
