// ----- DailyScan.jsx -------------------------------------
// Handles the morning scan - the 5 questions ORACLE asks
// when you first open the app each day.
//
// Questions 1-3: schedule, sleep, main uncertainty (existing)
// Questions 4-5: energy reading, physical interference (new health questions)
//
// After all 5 answers, sends everything to ORACLE who delivers
// a Morning Briefing that now includes health pattern analysis.
//
// Props App.jsx passes in:
//   threadId      - current conversation ID
//   setThreadId   - saves the thread ID when Backboard returns one
//   onComplete    - called when briefing is done, passes all 5 answers up
//   onMessage     - adds a message to the shared messages list in App.jsx
//   onStepChange  - tells App.jsx which dot to highlight
// --------------------------------------------------------------

import { useState } from 'react'
import { askOracle, PROMPTS } from '../api/oracle'
import { saveHealthEntry, detectHealthPatterns } from './HealthTracker'

// The 5 questions ORACLE asks in order
// Questions 1-3 are the original scan questions
// Questions 4-5 are the new health intelligence questions
const QUESTIONS = [
  "What's on your schedule today?",
  "How did you sleep last night?",
  "What's the one thing you're most uncertain about today?",
  "What is your energy reading right now — High, Medium, or Low?",
  "Any physical interference today — tension, headache, illness? Or say 'clear'"
]

// Export the first question so App.jsx can show it before the user types anything
export const FIRST_QUESTION = QUESTIONS[0]

// ScanDots - the 5 progress dots shown below messages during the scan.
// step = which question we're currently on (0 through 4)
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
  // Which question we're currently on (0 = first, 4 = last)
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
    setInput('')

    // Add this answer to our growing list
    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)

    // Show the user's answer as a message bubble
    onMessage({ role: 'user', content: answer })

    // If there are still questions left, show the next one
    if (step < QUESTIONS.length - 1) {
      const nextStep = step + 1
      setStep(nextStep)
      onStepChange(nextStep)

      // Small delay so the next question feels like a response, not instant
      setTimeout(() => {
        onMessage({ role: 'oracle', content: QUESTIONS[nextStep], type: 'scan-question' })
      }, 500)
      return
    }

    // All 5 questions answered — now build the Morning Briefing
    setLoading(true)

    // Save today's health data to localStorage for pattern tracking
    // newAnswers[1] = sleep, newAnswers[3] = energy, newAnswers[4] = physical
    saveHealthEntry({
      energy: newAnswers[3],
      physical: newAnswers[4],
      sleep: newAnswers[1]
    })

    // Check if ORACLE has detected any health patterns from previous days
    const patterns = detectHealthPatterns()

    // Build the briefing request — include health data and any patterns found
    const briefingRequest = `Morning Scan Complete. Here are my five answers:
1. Schedule today: ${newAnswers[0]}
2. Sleep last night: ${newAnswers[1]}
3. Main uncertainty: ${newAnswers[2]}
4. Energy reading: ${newAnswers[3]}
5. Physical state: ${newAnswers[4]}
${patterns ? `Health patterns detected from previous days: ${patterns}` : 'No recurring health patterns detected.'}
Deliver my Morning Briefing. Factor in my energy and physical state alongside my schedule and sleep.`

    try {
      // Call Backboard with the morning briefing prompt
      const data = await askOracle(briefingRequest, threadId, PROMPTS.morningBriefing)

      if (data.thread_id) setThreadId(data.thread_id)

      // Show ORACLE's briefing as a special 'briefing' type message
      onMessage({
        role: 'oracle',
        content: data.content || 'ORACLE is calibrating your briefing.',
        type: 'briefing'
      })

      // Pass all 5 answers up to App.jsx for the Memory Panel
      onComplete({
        schedule: newAnswers[0],
        sleep: newAnswers[1],
        concern: newAnswers[2],
        energy: newAnswers[3],
        physical: newAnswers[4]
      })

    } catch (err) {
      console.error('Scan briefing error:', err)
      onMessage({ role: 'oracle', content: 'ORACLE is recalibrating. Try again.' })
    }

    setLoading(false)
  }

  return (
    <div className="input-area">
      {/* Shows "MORNING SCAN — Question 1 of 5" above the input */}
      <div className="scan-indicator">
        MORNING SCAN — Question {step + 1} of {QUESTIONS.length}
      </div>

      {/* Input box - placeholder changes to match the current question */}
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

      {/* Button label changes while waiting for the briefing */}
      <button onClick={handleAnswer} disabled={loading}>
        {loading ? 'Scanning...' : 'Answer'}
      </button>
    </div>
  )
}