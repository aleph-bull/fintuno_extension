import fintunoLogo from '/single.png'
import './App.css'

function App() {
  const params = new URLSearchParams(window.location.search);
  const siteName = params.get('site') || 'Site';

  return (
    <>
      <div className="logo-container">
        <a href="https://fintuno.com" target="_blank">
          <img src={fintunoLogo} className="logo" alt="Fintuno logo" />
        </a>
      </div>
      <h1 className="gradient-text">{siteName} is Blocked</h1>
      <div className="box">
        <p className="box-answer-text">Answer the question(s) to unlock {siteName}</p>
        <p className="box-question-text">What is 2+2?</p>
        <input type="text" inputMode="decimal" className="box-input" placeholder="input your answer here" />
        <button className="submission-button">Submit</button>
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
