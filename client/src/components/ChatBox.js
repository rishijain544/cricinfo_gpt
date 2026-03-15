import React, { useState, useRef, useEffect } from 'react';
import config from '../config';
import MessageBubble from './MessageBubble';
import MicButton from './MicButton';
import SuggestedQuestions from './SuggestedQuestions';

const ChatBox = ({ isApiOnline }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (text) => {
    const query = text || input;
    if (!query.trim() || loading) return;

    const userMsg = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${config.API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          history: messages
        })
      });

      const data = await res.json();
      const botMsg = {
        role: 'assistant',
        content: data.answer,
        images: data.images,
        isImageResponse: data.isImageResponse,
        playerName: data.playerName
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "🏏 Opps! My connection to the pavilion is weak. Please check if the backend is running.",
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-history" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="welcome-screen">
            <h2 style={{ textAlign: 'center', marginTop: '40px' }}>Ask me about Cricket! 🏏</h2>
            <SuggestedQuestions onSelect={handleSend} />
          </div>
        )}
        
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {loading && (
          <div className="message-wrap assistant">
            <div className="bubble">
              <div className="typing">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-area">
        <div className="input-row">
          <button 
            className="clear-btn" 
            onClick={() => setMessages([])} 
            title="Clear Chat"
            disabled={messages.length === 0}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
          <MicButton onResult={setInput} />
          <input
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type a cricket question..."
            disabled={!isApiOnline}
          />
          <button 
            className="send-btn" 
            onClick={() => handleSend()}
            disabled={!isApiOnline}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
