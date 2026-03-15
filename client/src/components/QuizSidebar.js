import React, { useState, useEffect } from 'react';

const QUIZ_POOL = [
  { q: "Who won the 1983 World Cup?", a: "India", o: ["West Indies", "India", "Australia", "England"] },
  { q: "Most runs in international cricket?", a: "Sachin Tendulkar", o: ["Brian Lara", "Ricky Ponting", "Sachin Tendulkar", "Virat Kohli"] },
  { q: "Highest individual score in ODIs?", a: "264", o: ["200", "210", "264", "237"] },
  { q: "Which bowler has most Test wickets?", a: "M. Muralitharan", o: ["Shane Warne", "James Anderson", "Anil Kumble", "M. Muralitharan"] },
  { q: "Who is the 'Hitman' of cricket?", a: "Rohit Sharma", o: ["Virat Kohli", "Shikhar Dhawan", "Rohit Sharma", "MS Dhoni"] },
  { q: "Who won IPL 2024?", a: "KKR", o: ["SRH", "RCB", "KKR", "CSK"] },
  { q: "Fastest century in ODIs (31 balls)?", a: "AB de Villiers", o: ["Chris Gayle", "Shahid Afridi", "Corey Anderson", "AB de Villiers"] },
  { q: "First player to hit 6 sixes in a T20I?", a: "Yuvraj Singh", o: ["Chris Gayle", "Kieron Pollard", "Yuvraj Singh", "Herschelle Gibbs"] },
  { q: "Where is the MCG located?", a: "Australia", o: ["England", "New Zealand", "South Africa", "Australia"] },
  { q: "Who is known as 'Captain Cool'?", a: "MS Dhoni", o: ["Sourav Ganguly", "Kane Williamson", "MS Dhoni", "Eoin Morgan"] },
  { q: "Which player has most IPL centuries?", a: "Virat Kohli", o: ["Chris Gayle", "Virat Kohli", "Jos Buttler", "David Warner"] },
  { q: "Who bowled the 'Ball of the Century'?", a: "Shane Warne", o: ["Wasim Akram", "Shane Warne", "Glenn McGrath", "Muralitharan"] },
  { q: "Which venue is called 'Lords of the East'?", a: "Eden Gardens", o: ["Wankhede", "Eden Gardens", "MCG", "The Gabba"] }
];

const QuizSidebar = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  // Initial shuffle
  useEffect(() => {
    shuffleNewSet();
  }, []);

  const shuffleNewSet = () => {
    const shuffled = [...QUIZ_POOL].sort(() => 0.5 - Math.random());
    setQuestions(shuffled);
    setCurrentIdx(0);
    setSelected(null);
  };

  const handleOption = (opt) => {
    if (selected) return;
    console.log("Selected:", opt); // Debugging click
    setSelected(opt);
    setTotalAnswered(prev => prev + 1);
    if (opt === questions[currentIdx].a) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelected(null);
    } else {
      // Endless mode: reshuffle and start again
      shuffleNewSet();
    }
  };

  if (questions.length === 0) return <div className="quiz-sidebar">Loading...</div>;

  const currentQ = questions[currentIdx];

  return (
    <div className="quiz-sidebar">
      <div className="quiz-header">
        <h3>🏆 CRICINFO QUIZ</h3>
        <div className="quiz-stats">Score: {score} | Played: {totalAnswered}</div>
      </div>
      
      <div className="quiz-content">
        <div className="quiz-progress">Challenge #{totalAnswered + 1}</div>
        <div className="quiz-q">{currentQ.q}</div>
        
        <div className="quiz-options">
          {currentQ.o.map(opt => {
            let statusClass = "";
            if (selected) {
              if (opt === currentQ.a) statusClass = "correct";
              else if (opt === selected) statusClass = "wrong";
            }
            
            return (
              <button 
                key={opt}
                className={`quiz-opt-btn ${statusClass}`}
                onClick={() => handleOption(opt)}
                disabled={!!selected}
              >
                {opt}
                {selected && opt === currentQ.a && <span className="tick"> ✓</span>}
                {selected && opt === selected && opt !== currentQ.a && <span className="cross"> ✗</span>}
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="quiz-feedback">
            <p className={selected === currentQ.a ? "text-success" : "text-error"}>
              {selected === currentQ.a ? "Excellent Shot! 🏏" : `Bowled! The answer was ${currentQ.a}`}
            </p>
            <button className="next-q-btn" onClick={nextQuestion}>
              Next Question →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizSidebar;
