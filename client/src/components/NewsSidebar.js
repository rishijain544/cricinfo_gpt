import React, { useState, useEffect } from 'react';
import config from '../config';

const NewsSidebar = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`${config.API_URL}/api/news`);
        const data = await res.json();
        setNews(data);
      } catch (err) {
        console.error('News fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
    const interval = setInterval(fetchNews, 600000); // 10 mins
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="news-sidebar">
      <div className="news-header">
        <h3>📰 DAILY NEWS</h3>
      </div>
      
      {loading ? (
        <div className="news-loading">Updating headlines...</div>
      ) : (
        <div className="news-list">
          {news.map((item, idx) => (
            <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="news-card">
              <div className="news-source">{item.source}</div>
              <div className="news-title">{item.title}</div>
              <div className="news-desc">{item.description}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsSidebar;
