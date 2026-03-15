import React, { useState, useEffect } from 'react';
import Scene3D from './components/Scene3D';
import ChatBox from './components/ChatBox';
import LiveScores from './components/LiveScores';
import QuizSidebar from './components/QuizSidebar';
import NewsSidebar from './components/NewsSidebar';
import config from './config';
import './styles/App.css';

function App() {
  const [isApiOnline, setIsApiOnline] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${config.API_URL}/api/health`);
        const data = await res.json();
        setIsApiOnline(data.status === 'ok');
      } catch {
        setIsApiOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <header className="header">
        <div className="logo">🏏 CRICINFO<span>GPT</span></div>
        <div className={`api-status ${isApiOnline ? 'online' : 'offline'}`}>
          <div className="status-dot"></div>
          {isApiOnline ? 'LIVE' : 'OFFLINE'}
        </div>
      </header>
      
      <LiveScores />
      
      <div className="ad-container top-banner">
        {/* Placeholder for Top Banner Ad */}
        <div className="ad-placeholder">PROMOTED AD SLOT</div>
      </div>

      <main className="main-content">
        <QuizSidebar />
        <ChatBox isApiOnline={isApiOnline} />
        <NewsSidebar />
        <Scene3D />
      </main>

      <footer className="footer">
        Powered by Cricinfo GPT | Created by rishi jain | © 2025
      </footer>
    </div>
  );
}

export default App;
