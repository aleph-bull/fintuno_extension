import fintunoLogo from '/long.png'
import './App.css'
import { useState, useEffect, useRef } from 'react'
import { QuestionGenerator } from './utils/question_generation';
import type { QuestionResponse } from './utils/question_generation';

const generator = new QuestionGenerator();



function App() {
  const params = new URLSearchParams(window.location.search);
  const siteName = params.get('site') || 'Site';
  const resetTimestamp = params.get('resetAt');

  let resetText = "";
  if (resetTimestamp) {
    const date = new Date(parseInt(resetTimestamp));
    resetText = `Resets at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} otherwise.`;
  }

  const [question, setQuestion] = useState<QuestionResponse | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);

  // Animation states
  const [isShaking, setIsShaking] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [inputClass, setInputClass] = useState(""); // 'answer-input-correct' | 'answer-input-wrong' | ''

  const inputRef = useRef<HTMLInputElement>(null);

  /* 
   * LOCAL GENERATOR LOGIC 
   */
  const fetchQuestion = () => {
    const q = generator.generate({
      user_id: 'extension_user',
      possible_qtypes: [
        'arithmetic', 'multiplication', 'division',
        'growth_compounding', 'ratios_margins',
        'breakeven_estimation', 'splits_allocation'
      ],
      difficulty_range: [0, 4]
    });
    setQuestion(q);
  };

  useEffect(() => {
    fetchQuestion();
  }, []);

  const handleSubmit = () => {
    if (!question || !userAnswer) return;

    const res = generator.verifyAnswer(question.qid, userAnswer);

    if (res.ok) {
      // Correct
      setInputClass("answer-input-correct");
      setIsBouncing(true);

      setTimeout(() => {
        const newCount = correctCount + 1;
        setCorrectCount(newCount);
        if (newCount >= 3) {
          setIsUnlocked(true);
        } else {
          // Next question
          setQuestion(null);
          setUserAnswer("");
          setInputClass("");
          setIsBouncing(false);
          fetchQuestion();
        }
      }, 1000);
    } else {
      // Incorrect
      setIsShaking(true);
      setInputClass("answer-input-wrong");
      setTimeout(() => {
        setIsShaking(false);
        setInputClass("");
      }, 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const getDifficultyLabel = (d: number) => {
    if (d === 0) return "easy";
    if (d === 1) return "medium";
    if (d === 2) return "hard";
    if (d === 3) return "very hard";
    return "expert";
  };

  if (isUnlocked) {
    return (
      <>
        <div className="logo-container">
          <a href="https://fintuno.com" target="_blank">
            <img src={fintunoLogo} className="logo" alt="Fintuno logo" />
          </a>
        </div>
        <h1 className="gradient-text">{siteName} is unlocked!</h1>
        <div className="unlock-message">Great job! Access granted.</div>
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

      <div className={`box ${isShaking ? 'shake' : ''} ${isBouncing ? 'success-bounce' : ''}`}>
        <p className="box-answer-text">
          Answer {3 - correctCount} more to unlock
        </p>

        {question ? (
          <>
            <p className="box-question-text">{question.prompt}</p>
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              className={`box-input ${inputClass}`}
              placeholder="Input your answer"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </>
        ) : (
          <p className="box-question-text">Loading question...</p>
        )}

        <button className="submission-button" onClick={handleSubmit}>Submit</button>
      </div>

      <div className="tags-dropdown-container">
        <span
          className="tags-label"
          onClick={() => setTagsOpen(!tagsOpen)}
        >
          question tags: {tagsOpen ? '▲' : '▼'}
        </span>
        <div className={`tags-menu ${tagsOpen ? 'open' : ''}`}>
          <div className="scroll-arrow left" onClick={(e) => {
            const scrollArea = e.currentTarget.nextElementSibling;
            if (scrollArea) {
              scrollArea.scrollBy({ left: -100, behavior: 'smooth' });
            }
          }}>
            ←
          </div>
          <div className="tags-scroll-area">
            {question && (
              <>
                <span className="tag-item">{getDifficultyLabel(question.difficulty)}</span>
                <span className="tag-item">{question.type.replace('_', ' ')}</span>
                <span className="tag-item">{question.format}</span>
              </>
            )}
          </div>
          <div className="scroll-arrow right" onClick={(e) => {
            const scrollArea = e.currentTarget.previousElementSibling;
            if (scrollArea) {
              scrollArea.scrollBy({ left: 100, behavior: 'smooth' });
            }
          }}>
            →
          </div>
        </div>
      </div>

      <div className="question-number-text">Progress: {correctCount} / 3</div>

      <div className="card">
        <p className="fine-text">
          Fintuno, all rights reserved
        </p>
      </div>
    </>
  )
}

export default App
