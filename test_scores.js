const { getLiveScores } = require('./api/services/scoresService');
const fs = require('fs');
const path = require('path');

// Basic env mock for test
process.env.RAPIDAPI_KEY = ''; 

async function test() {
    console.log('--- Testing Scores Service Fallbacks (No Key) ---');
    try {
        const scores = await getLiveScores();
        console.log(`Found ${scores.length} matches.`);
        scores.forEach(m => {
            console.log(`[${m.source}] ${m.name}: ${m.status} (Live: ${m.isLive})`);
        });
    } catch (e) {
        console.error('Test failed:', e);
    }
    console.log('--- Test Complete ---');
}

test();
