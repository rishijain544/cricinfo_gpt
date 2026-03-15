import React from 'react';

const questions = [
  "Who is the current #1 Test batsman?",
  "Show me photos of Virat Kohli",
  "How does DRS work in cricket?",
  "Who won the most IPL titles?",
  "Live scores please!",
  "Tell me about the 1983 World Cup"
];

const SuggestedQuestions = ({ onSelect }) => {
  return (
    <div className="suggestions">
      {questions.map((q, i) => (
        <button 
          key={i} 
          className="pill"
          onClick={() => onSelect(q)}
        >
          {q}
        </button>
      ))}
    </div>
  );
};

export default SuggestedQuestions;
