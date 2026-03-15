const Groq = require('groq-sdk');
const { CRICKET_PROMPT } = require('../prompts/cricketPrompt');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function getCricketAnswer(question, history = [], liveContext = '') {
  const messages = [{ role: 'system', content: CRICKET_PROMPT }];

  // Add last 6 turns of history
  history.slice(-6).forEach(msg => {
    if (['user', 'assistant'].includes(msg.role)) {
      messages.push({ role: msg.role, content: msg.content });
    }
  });

  // Enrich with live data if available
  const userContent = liveContext
    ? `IMPORTANT: USE THE FOLLOWING SEARCH RESULTS TO ANSWER. DO NOT RELY ON YOUR TRAINING DATA FOR RECENT EVENTS.
    
Search Results:
${liveContext}

Question: ${question}

Answer confidently using the data above.`
    : question;

  messages.push({ role: 'user', content: userContent });

  const response = await groq.chat.completions.create({
    messages,
    model: 'llama-3.3-70b-versatile',
    temperature: 0.4,
    max_tokens: 1500,
    top_p: 0.9,
  });

  return response.choices[0].message.content;
}

module.exports = { getCricketAnswer };
