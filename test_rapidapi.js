const https = require('https');
const fs = require('fs');
const path = require('path');

// Manually parse .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const RAPIDAPI_KEY = envVars.RAPIDAPI_KEY;

function fetchRapidAPI(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'cricbuzz-cricket.p.rapidapi.com',
      path,
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com',
        'x-rapidapi-key': (RAPIDAPI_KEY || '').trim(),
      },
    };
    console.log(`Fetching: ${options.hostname}${options.path}`);
    const req = https.request(options, (res) => {
      console.log(`Status Code: ${res.statusCode}`);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, error: 'JSON Parse Error', raw: data });
        }
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.end();
  });
}

async function runTest() {
  console.log('Testing RapidAPI Key:', RAPIDAPI_KEY ? 'Present' : 'MISSING');
  if (!RAPIDAPI_KEY) return;
  const result = await fetchRapidAPI('/matches/v1/live');
  console.log('Result:', JSON.stringify(result, null, 2));
}

runTest();
