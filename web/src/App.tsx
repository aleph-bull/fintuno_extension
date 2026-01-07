import fintunoLogo from '/long.png'
import './App.css'
import { useState, useEffect, useRef } from 'react'

interface Question {
  qid: string;
  prompt: string;
  format: string;
  type: string;
  difficulty: number;
}

const DIFFICULTY_LABELS: Record<number, string> = {
  0: 'easy',
  1: 'medium',
  2: 'hard',
  3: 'very hard',
  4: 'expert'
};

function App() {
  const params = new URLSearchParams(window.location.search);
  const siteName = params.get('site') || 'Site';
  const resetTimestamp = params.get('resetAt');

  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [inputClass, setInputClass] = useState('');
  const [tagsOpen, setTagsOpen] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Vercel env var
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  let resetText = "";
  if (resetTimestamp) {
    const date = new Date(parseInt(resetTimestamp));
    resetText = `Resets at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} otherwise.`;
  }

  const fetchQuestion = async () => {
    if (!API_BASE) {
      setApiError("API not configured");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'user_' + Math.random().toString(36).substr(2, 9),
          possible_qformats: ["enter_number"],
          difficulty_range: [0, 4] // Allow all diffs
        })
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setQuestion(data);
      setAnswer('');
      if (inputRef.current) inputRef.current.focus();
    } catch (e) {
      console.error(e);
      setApiError("Failed to load question");
    }
  };

  const submitAnswer = async () => {
    if (!question || !answer || !API_BASE) return;

    try {
      const res = await fetch(`${API_BASE}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'anon',
          qid: question.qid,
          answer: answer
        })
      });
      const data = await res.json();

      if (data.ok) {
        // Correct
        setInputClass('success');
        setTimeout(() => {
          setInputClass('');
          const newCount = correctCount + 1;
          setCorrectCount(newCount);
          if (newCount >= 3) {
            setIsUnlocked(true);
            // Trigger existing unlock if available (e.g. postMessage)
            // Assuming "unlocked" UI state is enough for this task
          } else {
            fetchQuestion();
          }
        }, 500);
      } else {
        // Incorrect
        setInputClass('shake');
        setAnswer(''); // Clear wrong answer
        setTimeout(() => setInputClass(''), 500);
      }
    } catch (e) {
      console.error(e);
      setApiError("Verification error");
    }
  };

  // Initial load
  useEffect(() => {
    if (API_BASE) {
      fetchQuestion();
    } else {
      setApiError("API configuration missing. Check VITE_API_BASE_URL.");
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitAnswer();
    }
  };

  if (isUnlocked) {
    return (
      <>
        <div className="logo-container">
          <a href="https://fintuno.com" target="_blank">
            <img src={fintunoLogo} className="logo" alt="Fintuno logo" />
          </a>
        </div>
        <h1 className="gradient-text">{siteName} Unlocked!</h1>
        <div className="box" style={{ height: '150px' }}>
          <p className="box-answer-text" style={{ textAlign: 'center' }}>Great job!</p>
          <button className="submission-button" onClick={() => window.location.reload()}>Reload</button>
        </div>
      </>
    );
  }

  return (
    <>
      {resetText && <div className="question-number-text">{resetText}</div>}
      <div className="logo-container">
        <a href="https://fintuno.com" target="_blank">
          <img src={fintunoLogo} className="logo" alt="Fintuno logo" />
        </a>
      </div>

      <h1 className="gradient-text">{siteName} is blocked</h1>

      <div className="box">
        <p className="box-answer-text">Answer the question(s) to unlock {siteName}</p>

        {apiError ? (
          <p className="box-question-text" style={{ color: '#ff4d4d' }}>{apiError}</p>
        ) : (
          <p className="box-question-text">{question ? question.prompt : "Loading..."}</p>
        )}

        {/* Existing Layout maintained but dynamic input */}
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          className={`box-input ${inputClass}`}
          placeholder="input your answer here"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!question}
        />

        <button className="submission-button" onClick={submitAnswer} disabled={!question}>
          Submit
        </button>



      </div>

      <div className="tags-dropdown-container">
        <span
          className="tags-label"
          onClick={() => setTagsOpen(!tagsOpen)}
        >
          question tags: {tagsOpen ? '▲' : '▼'}
        </span>
        <div className={`tags-menu ${tagsOpen ? 'open' : ''}`}>
          {/* Reusing existing scroll logic structure but ignoring for minimal implementation since we show active tags above */}
          {/* <span className="tag-item">All Topics</span> */}
          {question ? (
            <>
              <span className="tag-item">{DIFFICULTY_LABELS[question.difficulty]}</span>
              <span className="tag-item">{question.type.replace('_', ' ')}</span>
              <span className="tag-item">{question.format}</span>
            </>
          ) : (
            <span className="tag-item">Loading tags...</span>
          )}
        </div>
      </div>

      <div className="question-number-text">Question {correctCount + 1} of 3</div>

      <div className="card">
        <p className="fine-text">
          Fintuno v0.0.1 alpha
        </p>
      </div>
    </>
  )
}

export default App
