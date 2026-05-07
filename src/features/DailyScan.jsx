// ----- DailyScan.jsx -------------------------------------
// Handles the morning scan - the 3 questions ORACLE asks
// when you first open the app each day.
// After all 3 answers, it sends them to ORACLE who delivers
// a Morning Briefing analysing your risks for the day.
//
// Props App.jsx passes in:
//   threadId      - current conversation ID
//   setThreadId   - saves the thread ID when Backboard returns one
//   onComplete    - called when briefing is done, passes scan answers up
//   onMessage     - adds a message to the shared messages list in App.jsx
//   onStepChange  - tells App.jsx which dot to highlight
// --------------------------------------------------------------

import { useState } from 'react'
import { askOracle, PROMPTS } from '../api/oracle'

// The three questions ORACLE asks in order
const QUESTIONS = [
  "What's on your schedule today?",
  "How did you sleep last night?",
  "What's the one thing you're most uncertain about today?"
]

// Export the first question so App.jsx can show it before the user types anything
export const FIRST_QUESTION = QUESTIONS[0]

// ScanDots - the three progress dots shown below messages during the scan.
// step = which question we're currently on (0, 1, or 2)
export function ScanDots({ step }) {
  return (
    <div className="scan-dots">
      {QUESTIONS.map((_, i) => (
        <div
          key={i}
          // 'done' = answered, 'active' = current question
          className={`scan-dot ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`}
        />
      ))}
    </div>
  )
}

// DailyScan - the input area shown during the morning scan.
// Replaces the normal input in App.jsx while scanMode is true.
export default function DailyScan({ threadId, setThreadId, onComplete, onMessage, onStepChange }) {
  // Which question we're currently on (0 = first, 2 = last)
  const [step, setStep] = useState(0)

  // Collects all answers as the user answers each question
  const [answers, setAnswers] = useState([])

  // The text currently typed in the input box
  const [input, setInput] = useState('')

  // True while waiting for ORACLE's Morning Briefing response
  const [loading, setLoading] = useState(false)

  const handleAnswer = async () => {
    // Don't submit empty answers
    if (!input.trim()) return

    const answer = input.trim()
    setInput('') // clear the input box immediately

    // Add this answer to our growing list
    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)

    // Show the user's answer as a message bubble
    onMessage({ role: 'user', content: answer })

    // If there are still questions left, show the next one
    if (step < QUESTIONS.length - 1) {
      const nextStep = step + 1
      setStep(nextStep)
      onStepChange(nextStep) // update the progress dot in App.jsx

      // Small delay so the next question feels like a response, not instant
      setTimeout(() => {
        onMessage({ role: 'oracle', content: QUESTIONS[nextStep], type: 'scan-question' })
      }, 500)
      return // stop here, don't fire the briefing yet
    }

    // All 3 questions answered — now request the Morning Briefing
    setLoading(true)

    // Bundle all 3 answers into one message for ORACLE to analyse together
    const briefingRequest = `Morning Scan Complete. Here are my three answers:
1. Schedule today: ${newAnswers[0]}
2. Sleep last night: ${newAnswers[1]}
3. Main uncertainty: ${newAnswers[2]}
Deliver my Morning Briefing.`

    try {
      // Call Backboard with the morning briefing prompt
      const data = await askOracle(briefingRequest, threadId, PROMPTS.morningBriefing)

      // Save the thread ID so future messages stay in the same conversation
      if (data.thread_id) setThreadId(data.thread_id)

      // Show ORACLE's briefing as a special 'briefing' type message
      onMessage({
        role: 'oracle',
        content: data.content || 'ORACLE is calibrating your briefing.',
        type: 'briefing' // App.jsx uses this to add the ◈ MORNING BRIEFING badge
      })

      // Tell App.jsx the scan is done and pass up the answers for the Memory Panel
      onComplete({
        schedule: newAnswers[0],
        sleep: newAnswers[1],
        concern: newAnswers[2]
      })

    } catch (err) {
      console.error('Scan briefing error:', err)
      onMessage({ role: 'oracle', content: 'ORACLE is recalibrating. Try again.' })
    }

    setLoading(false)
  }

  return (
    <div className="input-area">
      {/* Shows "MORNING SCAN — Question 1 of 3" above the input */}
      <div className="scan-indicator">
        MORNING SCAN — Question {step + 1} of {QUESTIONS.length}
      </div>

      {/* Input box - placeholder changes to match the current question */}
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          // Enter submits, Shift+Enter adds a new line
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleAnswer()
          }
        }}
        placeholder={QUESTIONS[step]}
      />

      {/* Button label changes while waiting for the briefing */}
      <button onClick={handleAnswer} disabled={loading}>
        {loading ? 'Scanning...' : 'Answer'}
      </button>
    </div>
  )
}