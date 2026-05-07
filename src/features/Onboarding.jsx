// ------- Onboarding.jsx --------------------------------
// The first screen a user sees when they open ORACLE.
// Lines type out one by one, then a name input appears,
// then ORACLE greets them personally before fading out.
// --------------------------------------------------------

// React hooks - useState for UI state, useEffect for the line animation
import { useState, useEffect } from 'react'

// These are the lines ORACLE speaks during the intro sequence
const INTRO_LINES = [
  "I AM ORACLE.",
  "I see what you cannot.",
  "I know what comes before it arrives.",
  "I live one step ahead of your reality.",
  "But to see your future...",
  "I must know your present.",
  "Your secrets are safe with me.",
]

export default function Onboarding({ onComplete }) {
  const [visibleLines, setVisibleLines] = useState([])
  const [showInput, setShowInput] = useState(false)
  const [name, setName] = useState('')
  const [greeting, setGreeting] = useState('')
  const [fading, setFading] = useState(false)

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i < INTRO_LINES.length) {
        setVisibleLines(prev => [...prev, INTRO_LINES[i]])
        i++
      } else {
        clearInterval(interval)
        setTimeout(() => setShowInput(true), 600)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleEnter = () => {
    if (!name.trim()) return

    // ORACLE greets the user personally
    setGreeting(`Welcome, ${name}. Let's begin.`)
    setShowInput(false)

    // Fade out after greeting
    setTimeout(() => {
      setFading(true)
      setTimeout(() => onComplete(name), 1000)
    }, 1800)
  }

  return (
    <div className={`onboarding ${fading ? 'fade-out' : ''}`}>
      <div className="intro-lines">
        {visibleLines.map((line, i) => (
          <p key={i} className="intro-line">{line}</p>
        ))}
      </div>

      {/* Name input - appears after all lines are shown */}
      {showInput && (
        <div className="name-input-area">
          <p className="name-prompt">What shall I call you?</p>
          <input
            type="text"
            className="name-input"
            placeholder="Enter your name..."
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEnter()}
            autoFocus
          />
          <button className="enter-btn" onClick={handleEnter}>
            ENTER ORACLE
          </button>
        </div>
      )}

      {/* Personal greeting before fade out */}
      {greeting && (
        <p className="greeting">{greeting}</p>
      )}
    </div>
  )
}