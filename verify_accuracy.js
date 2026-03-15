const { searchCricketNews } = require('./api/services/searchService');

async function verify() {
    const questions = [
        "give me scorecard of ind vs nz t20 worldcup 2026 final",
        "who takes most important catch of t20 worldcup 2024"
    ];

    for (const q of questions) {
        console.log(`\nTesting: ${q}`);
        const res = await searchCricketNews(q);
        console.log("--- RESULT ---");
        console.log(res);
        console.log("--------------");
    }
}

verify();
