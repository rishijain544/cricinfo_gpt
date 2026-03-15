# 🏏 CricketGPT

CricketGPT is the ultimate AI-powered cricket analyst and companion. It provides real-time scores, deep historical insights, and interactive commentary using state-of-the-art AI.

## 🚀 Features

- **AI Cricket Analyst**: Ask anything about cricket from 1877 to future schedules like T20 WC 2026. Powered by **Groq** and a custom search engine.
- **Extreme Search Engine**: Heuristic tournament targeting and robust scrapers for high-precision data from Wikipedia, ESPNCricinfo, and more.
- **Live Score Ticker**: Real-time updates with multi-source RSS fallbacks (ESPN, BBC) to ensure zero downtime.
- **Cricket News Feed**: Latest headlines and daily updates from the cricket world.
- **Interactive Quiz**: Test your cricket knowledge with an integrated quiz system.
- **3D Immersive UI**: A modern, responsive design featuring interactive 3D elements.
- **Ad Integrated**: Ready for monetization with Adsterra integration.

## 🛠️ Tech Stack

- **Frontend**: React.js, Vanilla CSS, Three.js (for 3D scenes).
- **Backend**: Node.js, Express.
- **AI/LLM**: Groq Cloud SDK.
- **Data Sources**: Wikipedia REST API, ESPNCricinfo, BBC Sport (RSS).

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/rishijain544/cricinfo_gpt.git
   cd cricinfo_gpt
   ```

2. **Backend Setup**:
   - Navigate to the root or `api` directory.
   - Install dependencies: `npm install`
   - Create a `.env` file with:
     ```env
     GROQ_API_KEY=your_key_here
     RAPIDAPI_KEY=your_key_here (optional, has RSS fallback)
     ```

3. **Frontend Setup**:
   - Navigate to the `client` directory.
   - Install dependencies: `npm install`

4. **Run the Application**:
   - Use the root-level script:
     ```bash
     npm run dev
     ```
   - This starts both the backend (Port 3001) and frontend (Port 3000).

## 🌐 Deployment

Perfectly optimized for **Vercel** deployment with a monorepo structure.

---
*Created by Rishi Jain | © 2025*