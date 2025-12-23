import { useState } from 'react'
import viteLogo from '/single.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="logo-container">
        <a href="https://fintuno.com" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
      </div>
      <h1>'[site name]' is Blocked</h1>
      <div className="box">

      </div>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Essswwwsssd
        </p>
      </div>
    </>
  )
}

export default App
