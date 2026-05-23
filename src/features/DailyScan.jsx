// ----- DailyScan.jsx -------------------------------------
// Handles the morning scan — the 5 questions ORACLE asks
// when you first open the app each day.
//
// After all 5 answers, passes everything up to App.jsx.
// App.jsx then shows FaceCapture for the unified briefing.
// If user skips face capture, a text-only briefing is delivered.
// --------------------------------------------------------------

import { useState } from 'react'
import { saveHealthEntry, detectHealthPatterns } from './HealthTracker'

// The 5 questions ORACLE asks in order
const QUESTIONS = [
  "What's on your schedule today?",
  "How did you sleep last night?",
  "What's the one thing you're most uncertain about today?",
  "What is your energy reading right now — High, Medium, or Low?",
  "Any physical interference today — tension, headache, illness? Or say 'clear'"
]

// Export the first question so App.jsx can show it before the user types
export const FIRST_QUESTION = QUESTIONS[0]

/* ── ScanDots ─────────────────────────────────────────────
   5 progress dots shown below messages during the scan.
   step = which question we're currently on (0 through 4)
   ──────────────────────────────────────────────────────── */
export function ScanDots({ step }) {
  return (
    <div className="scan-dots">
      {QUESTIONS.map((_, i) => (
        <div
          key={i}
          className={`scan-dot ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`}
        />
      ))}
    </div>
  )
}

/* ── DailyScan ────────────────────────────────────────────
   The input area shown during the morning scan.
   Replaces the normal input in App.jsx while scanMode is true.
   ──────────────────────────────────────────────────────── */
export default function DailyScan({ threadId, setThreadId, onComplete, onMessage, onStepChange }) {

  const [step, setStep]       = useState(0)
  const [answers, setAnswers] = useState([])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleAnswer = async () => {
    if (!input.trim()) return

    const answer    = input.trim()
    const newAnswers = [...answers, answer]
    setInput('')
    setAnswers(newAnswers)

    // Show user's answer as a message bubble
    onMessage({ role: 'user', content: answer })

    // If questions remain, show the next one
    if (step < QUESTIONS.length - 1) {
      const nextStep = step + 1
      setStep(nextStep)
      onStepChange(nextStep)
      setTimeout(() => {
        onMessage({ role: 'oracle', content: QUESTIONS[nextStep], type: 'scan-question' })
      }, 500)
      return
    }

    // ── All 5 answered ──────────────────────────────────
    setLoading(true)

    // Save today's health data for pattern tracking
    saveHealthEntry({
      energy:   newAnswers[3],
      physical: newAnswers[4],
      sleep:    newAnswers[1]
    })

    // Check for health patterns from previous days
    const patterns = detectHealthPatterns()

    // Build the full briefing request — passed to App.jsx
    // Face reading will use this as context alongside the photo
    const briefingRequest = `Morning Scan Complete. Here are my five answers:
1. Schedule today: ${newAnswers[0]}
2. Sleep last night: ${newAnswers[1]}
3. Main uncertainty: ${newAnswers[2]}
4. Energy reading: ${newAnswers[3]}
5. Physical state: ${newAnswers[4]}
${patterns ? `Health patterns detected: ${patterns}` : 'No recurring health patterns detected.'}
Deliver my Morning Briefing. Factor in energy and physical state alongside schedule and sleep.`

    setLoading(false)

    // Pass all answers + briefing request up to App.jsx
    // App.jsx will show FaceCapture next
    onComplete({
      schedule:       newAnswers[0],
      sleep:          newAnswers[1],
      concern:        newAnswers[2],
      energy:         newAnswers[3],
      physical:       newAnswers[4],
      briefingRequest // face reading uses this as full context
    })
  }

  return (
    <div className="input-area">
      <div className="scan-indicator">
        MORNING SCAN — Question {step + 1} of {QUESTIONS.length}
      </div>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleAnswer()
          }
        }}
        placeholder={QUESTIONS[step]}
      />
      <button onClick={handleAnswer} disabled={loading}>
        {loading ? 'Scanning...' : 'Answer'}
      </button>
    </div>
  )
}