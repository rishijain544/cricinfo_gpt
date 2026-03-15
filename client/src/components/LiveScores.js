import React, { useState, useEffect } from 'react';
import config from '../config';

const LiveScores = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchScores = async () => {
    try {
      const res = await fetch(`${config.API_URL}/api/scores`);
      const data = await res.json();
      setScores(data.scores || []);
      setError(null);
    } catch (err) {
      console.error('Scores fetch err:', err);
      setError('Live scores unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
    const interval = setInterval(fetchScores, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading && scores.length === 0) {
    return (
      <div className="live-scores-placeholder">
        <div className="skeleton-ticker"></div>
      </div>
    );
  }

  if (error && scores.length === 0) {
    return <div className="live-scores-error">{error}</div>;
  }

  return (
    <div className="live-scores-container">
      <div className="ticker-wrapper">
        <div className="ticker-content">
          {[...scores, ...scores].map((match, idx) => (
            <div 
              key={`${match.id}-${idx}`} 
              className={`score-card ${match.isLive ? 'live' : ''}`}
              onClick={() => setExpandedId(expandedId === match.id ? null : match.id)}
            >
              <div className="match-info">
                <span className={`match-badge ${match.matchType.toLowerCase()}`}>
                  {match.matchType}
                </span>
                <span className="match-name">{match.name}</span>
              </div>
              <div className="current-score">
                {match.score && match.score.length > 0 ? (
                  match.score.map((s, i) => (
                    <span key={i} className="inning-score">
                      {s.inning}: <strong>{s.r}/{s.w}</strong> ({s.o})
                    </span>
                  ))
                ) : (
                  <span className="upcoming-time">{match.status}</span>
                )}
              </div>
              <div className="match-status">{match.isLive ? '🔴 LIVE' : match.status}</div>
            </div>
          ))}
        </div>
      </div>

      {expandedId && (
        <div className="scorecard-overlay" onClick={() => setExpandedId(null)}>
          <div className="scorecard-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setExpandedId(null)}>×</button>
            {scores.find(m => m.id === expandedId) && (
              <div className="modal-content">
                <h3>{scores.find(m => m.id === expandedId).name}</h3>
                <p className="series">{scores.find(m => m.id === expandedId).seriesName}</p>
                <div className="full-scores">
                  {scores.find(m => m.id === expandedId).score.map((s, i) => (
                    <div key={i} className="score-row">
                      <span>{s.inning}</span>
                      <strong>{s.r}/{s.w} ({s.o} ov)</strong>
                    </div>
                  ))}
                </div>
                <div className="modal-status">{scores.find(m => m.id === expandedId).status}</div>
                <div className="venue">{scores.find(m => m.id === expandedId).venue}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveScores;
