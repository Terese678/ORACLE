// ------- Onboarding.jsx --------------------------------
// The first screen a user sees when they open ORACLE.
// All 7 lines are rendered immediately with CSS animation
// delays — each line fades in 1 second after the last.
// No interval needed, no StrictMode issues.
// --------------------------------------------------------

// useState tracks UI state, useEffect runs the input timer
import { useState, useEffect } from 'react'

// The 7 lines ORACLE speaks during the intro sequence
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
  // Controls whether the name input is visible
  const [showInput, setShowInput] = useState(false)

  // The name the user types in
  const [name, setName] = useState('')

  // The personal greeting shown before fading out
  const [greeting, setGreeting] = useState('')

  // True when the screen is fading out into the main app
  const [fading, setFading] = useState(false)

  // Wait for all 7 lines to finish animating (7 seconds + 0.8s fade + 0.6s buffer)
  // then show the name input
  useEffect(() => {
    const timer = setTimeout(() => setShowInput(true), 8200)
    // Clean up the timer if the component unmounts early
    return () => clearTimeout(timer)
  }, [])

  const handleEnter = () => {
    // Do nothing if the user hasn't typed a name
    if (!name.trim()) return

    // Show the personal greeting
    setGreeting(`Welcome, ${name}. Let's begin.`)
    setShowInput(false)

    // After 1.8 seconds start fading out, then hand off to the main app
    setTimeout(() => {
      setFading(true)
      setTimeout(() => onComplete(name), 1000)
    }, 1800)
  }

  return (
    // Add fade-out class when transitioning into the main app
    <div className={`onboarding ${fading ? 'fade-out' : ''}`}>

      <div className="intro-lines">
        {/* Render all lines at once — CSS animationDelay staggers their appearance */}
        {INTRO_LINES.map((line, i) => (
          <p
            key={i}
            className="intro-line"
            style={{ animationDelay: `${i}s` }}
          >
            {line}
          </p>
        ))}
      </div>

      {/* Name input — appears after all lines have faded in */}
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

      {/* Personal greeting shown before the screen fades out */}
      {greeting && <p className="greeting">{greeting}</p>}

    </div>
  )
}