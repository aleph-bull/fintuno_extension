import fintunoLogo from '/long.png'
import './App.css'
import { useState } from 'react'

function App() {
  const params = new URLSearchParams(window.location.search);
  const siteName = params.get('site') || 'Site';

  const resetTimestamp = params.get('resetAt');
  let resetText = "";
  if (resetTimestamp) {
    const date = new Date(parseInt(resetTimestamp));
    resetText = `Resets at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} otherwise.`;
  }

  const [tagsOpen, setTagsOpen] = useState(false);

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
        <p className="box-question-text">What is 2+2?</p>
        <input type="text" inputMode="decimal" className="box-input" placeholder="input your answer here" />
        <button className="submission-button">Submit</button>

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
            <span className="tag-item">interest</span>
            <span className="tag-item">hard</span>
            <span className="tag-item">mental math</span>
            <span className="tag-item">trigonometry</span>
            <span className="tag-item">calculus</span>
            <span className="tag-item">algebra</span>
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
      <div className="question-number-text">Question 1 of 3</div>
      <div className="card">
        <p className="fine-text">
          Fintuno, all rights reserved
        </p>
      </div>
    </>
  )
}

export default App
