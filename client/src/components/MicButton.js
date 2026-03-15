import React, { useState, useEffect } from 'react';

const MicButton = ({ onResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN';

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };

      setRecognition(rec);
    }
  }, [onResult]);

  const toggleListen = () => {
    if (isListening) {
      recognition.stop();
    } else {
      if (recognition) recognition.start();
      else alert("Speech Recognition not supported in this browser.");
    }
  };

  return (
    <button 
      className={`mic-btn ${isListening ? 'listening' : ''}`} 
      onClick={toggleListen}
      title={isListening ? "Listening..." : "Click to speak"}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
    </button>
  );
};

export default MicButton;
