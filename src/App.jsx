// ----- App.jsx ---------------------------------------------
// The main component. Manages all shared state and renders
// the layout. All actual feature logic lives in /features/.
// Think of this file as the skeleton — it connects everything
// but doesn't do the heavy lifting itself.
// ------------------------------------------------------------

import { useState, useEffect, useRef } from 'react'
import './App.css' // original styles - unchanged

// The function that talks to the Backboard API
import { askOracle } from './api/oracle'

// DailyScan = the input during morning scan
// ScanDots = the 3 progress dots
// FIRST_QUESTION = the first question shown before user types
import DailyScan, { ScanDots, FIRST_QUESTION } from './features/DailyScan'

// Slide-in panel showing what ORACLE remembers about you
import MemoryPanel from './features/MemoryPanel'

// Vertical bar on right edge showing your stability score
// calculateRiskScore = the function that works out the score
import RiskMeter, { calculateRiskScore } from './features/RiskMeter'

// CheckInBanner = the amber banner that appears after 3 hours
// EveningBanner = the purple banner that appears after 8 hours
// useCheckinTimer = the hook that counts down both timers
// triggerCheckin = fires the midday ORACLE check-in message
// triggerEveningDebrief = fires the evening ORACLE debrief message
import CheckInBanner, { useCheckinTimer, triggerCheckin, triggerEveningDebrief, EveningBanner } from './features/CheckIn'

import Onboarding from './features/Onboarding'

export default function App() {

  // ---- Core state ---------------------------------------------

  // All messages shown in the chat (both user and ORACLE)
  const [messages, setMessages] = useState([])

  // What the user is currently typing in the normal input box
  const [input, setInput] = useState('')

  // True while we are waiting for ORACLE to respond
  const [loading, setLoading] = useState(false)

  // Persist thread ID in localStorage so ORACLE remembers the conversation across refreshes
  const [threadId, setThreadId] = useState(() => localStorage.getItem('oracle_thread_id') || null)

  // --------- Scan state ------------------------------------------------

  // Persist scan mode so refreshing doesn't restart the morning scan
  const [scanMode, setScanMode] = useState(() => {
    return localStorage.getItem('oracle_scan_done') ? false : true
  })

  // Tracks which of the 3 scan questions we are on (0, 1, or 2)
  // Used to highlight the correct progress dot
  const [scanStep, setScanStep] = useState(0)

  // ----- Feature state -------------------------------------
  // True = memory panel is visible on the left
  const [memoryOpen, setMemoryOpen] = useState(false)

  // Array of strings shown inside the memory panel
  // e.g. ["Schedule: meetings all day", "Sleep: 6 hours"]
  const [memoryFacts, setMemoryFacts] = useState([])

  // Current stability score (10–95). Starts neutral at 50.
  const [riskScore, setRiskScore] = useState(50)

  // True = show the check-in banner at the top of messages
  const [checkinDue, setCheckinDue] = useState(false)

  // True = show the evening debrief banner after 8 hours
  const [eveningDue, setEveningDue] = useState(false)

  // Persist last check-in time so the timer doesn't restart from zero on refresh
  const [lastCheckin, setLastCheckin] = useState(() => {
    const saved = localStorage.getItem('oracle_last_checkin')
    return saved ? parseInt(saved) : null
  })

  // Persist scan complete so the check-in timer resumes after refresh
  const [scanComplete, setScanComplete] = useState(() => {
    return localStorage.getItem('oracle_scan_done') === 'true'
  })

  // True once the user has completed the onboarding screen
  const [onboardingDone, setOnboardingDone] = useState(false)

  // The name the user entered during onboarding - used to personalise ORACLE
  const [userName, setUserName] = useState('')

  // A ref attached to an invisible div at the bottom of messages
  // We scroll this into view every time a new message arrives
  const messagesEndRef = useRef(null)

  // ----- Effects -------------------------------------------------

  // Scroll to the bottom every time messages change or loading changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Request browser notification permission when the app loads
  // This enables ORACLE to notify the user even when the tab is not in focus
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Recalculate the risk score every time the messages list changes
  useEffect(() => {
    setRiskScore(calculateRiskScore(messages))
  }, [messages])

  // Start the 3-hour check-in countdown once the scan is complete
  // This hook lives in CheckIn.jsx and sets checkinDue = true after 3 hours
  useCheckinTimer(scanComplete, lastCheckin, setCheckinDue, setEveningDue)

  // ----- Helpers --------------------------------------------------
  // addMessage — adds one message object to the messages array
  // Used by DailyScan and CheckIn so they don't touch state directly
  const addMessage = (msg) => setMessages(prev => [...prev, msg])

  // handleScanComplete - called by DailyScan after the Morning Briefing
  // Receives all 5 scan answers and saves them to the memory panel
  const handleScanComplete = ({ schedule, sleep, concern, energy, physical }) => {
    setScanMode(false)         // switch to normal input
    setScanComplete(true)      // start the check-in countdown
    setLastCheckin(Date.now()) // record when the scan finished
    localStorage.setItem('oracle_scan_done', 'true')           // persist scan completion across refreshes
    localStorage.setItem('oracle_last_checkin', Date.now())    // persist check-in time across refreshes

    // Populate the memory panel with all 5 morning scan answers
    // energy and physical are the new health intelligence fields
    setMemoryFacts([
      `Schedule: ${schedule}`,
      `Sleep: ${sleep}`,
      `Main concern: ${concern}`,
      `Energy: ${energy}`,
      `Physical: ${physical}`
    ])
  }

  // sendMessage - handles normal conversation after the scan is done
  const sendMessage = async () => {
    if (!input.trim()) return // ignore empty messages
    setLoading(true)

    const userMessage = input.trim()
    setInput('') // clear the input box immediately

    // Show the user's message in the chat right away
    addMessage({ role: 'user', content: userMessage })

    try {
      // Send to Backboard and wait for ORACLE's reply
      const data = await askOracle(userMessage, threadId)

      // Save the thread ID so the next message stays in the same conversation
      if (data.thread_id) setThreadId(data.thread_id)

      if (data.thread_id) localStorage.setItem('oracle_thread_id', data.thread_id)

      // Add ORACLE's reply to the chat
      addMessage({ role: 'oracle', content: data.content || 'ORACLE is recalibrating.' })

      // If the user mentioned something emotional, save it to memory
      const emotional = ['worried','nervous','anxious','feeling','afraid','excited','confident','stressed']
      if (emotional.some(w => userMessage.toLowerCase().includes(w))) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        // Save a timestamped snippet — e.g. "9:45 AM: I'm worried about..."
        setMemoryFacts(prev =>
          [`${time}: "${userMessage.slice(0, 50)}${userMessage.length > 50 ? '...' : ''}"`,
          ...prev].slice(0, 8) // keep only the 8 most recent facts
        )
      }
    } catch (err) {
      console.error('ORACLE error:', err)
      addMessage({ role: 'oracle', content: 'ORACLE is recalibrating. Try again.' })
    }

    setLoading(false)
  }

  // Enter key sends the message. Shift+Enter adds a new line instead.
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Converts **bold** markdown and line breaks into HTML for rendering
  const renderContent = (text) =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')

  // ------ RENDER --------------------------------------------
  if (!onboardingDone) {
    return (
      <Onboarding
        onComplete={(name) => {
          setUserName(name)
          setOnboardingDone(true)
        }}
      />
    )
  }
  return (
    // oracle-container is the original CSS class - unchanged
    <div className="oracle-container">

      {/* Risk meter - fixed to the right edge, always visible */}
      <RiskMeter score={riskScore} />

      {/* Memory panel + its MEM toggle button on the left edge */}
      <MemoryPanel
        facts={memoryFacts}
        isOpen={memoryOpen}
        onToggle={() => setMemoryOpen(!memoryOpen)}
      />

      {/* Header - identical markup to the original App.jsx */}
      <div className="oracle-header">
        <h1>ORACLE</h1>
        <p className="tagline">A stable mind is more creative than an unstable one</p>
        <p className="sub-tagline">Your mental crack into tomorrow</p>
      </div>

      {/* Messages area - same class as original */}
      <div className="messages">

        {/* Check-in banner - only renders when checkinDue is true */}
        {checkinDue && (
          <CheckInBanner
            onAnswer={() => triggerCheckin({
              threadId,
              setThreadId,
              setCheckinDue,
              setLastCheckin,
              onMessage: addMessage,
              setLoading
            })}
            onDismiss={() => setCheckinDue(false)} // hide the banner
          />
        )}

        {/* Evening debrief banner - purple, appears after 8 hours */}
        {eveningDue && (
          <EveningBanner
            onAnswer={() => triggerEveningDebrief({
              threadId, setThreadId,
              setEveningDue, setLastCheckin,
              onMessage: addMessage,
              setLoading
            })}
            onDismiss={() => setEveningDue(false)}
          />
        )}

        {/* Show the first scan question before the user has typed anything */}
        {scanMode && messages.length === 0 && (
          <div className="message oracle">
            <span className="role">ORACLE</span>
            <p className="scan-q">{FIRST_QUESTION}</p>
          </div>
        )}

        {/* Render every message bubble in the list */}
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role} ${msg.type || ''}`}>
            {/* Shows "ORACLE" or "YOU" above each bubble */}
            <span className="role">{msg.role === 'oracle' ? 'ORACLE' : 'YOU'}</span>
            {/* Renders message text with bold and line break support */}
            <p dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
            {/* Badge shown under the Morning Briefing message */}
            {msg.type === 'briefing' && <div className="bubble-badge">◈ MORNING BRIEFING</div>}
            {/* Badge shown under the Mid-day Check-in message */}
            {msg.type === 'checkin'  && <div className="bubble-badge checkin-tag">⬡ MID-DAY CHECK-IN</div>}
            {/* Badge shown under Evening Debrief messages */}
            {msg.type === 'debrief' && <div className="bubble-badge debrief-tag">◈ EVENING DEBRIEF</div>}
          </div>
        ))}

        {/* Shown while waiting for ORACLE to respond */}
        {loading && (
          <div className="message oracle">
            <span className="role">ORACLE</span>
            <p className="thinking">Scanning ahead...</p>
          </div>
        )}

        {/* Progress dots shown during the morning scan */}
        {scanMode && <ScanDots step={scanStep} />}

        {/* Invisible div at the bottom - scrolled into view on new messages */}
        <div ref={messagesEndRef} />
      </div>

      {/* During scan: DailyScan handles its own input
          After scan: normal textarea input */}
      {scanMode ? (
        <DailyScan
          threadId={threadId}
          setThreadId={setThreadId}
          onComplete={handleScanComplete}
          onMessage={(msg) => {
            addMessage(msg)
            // When DailyScan pushes the next question, advance the dot
            if (msg.type === 'scan-question') setScanStep(prev => prev + 1)
          }}
          onStepChange={setScanStep}
        />
      ) : (
        // Normal input - same markup as the original App.jsx
        <div className="input-area">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell ORACLE what's on your mind..."
          />
          <button onClick={sendMessage} disabled={loading}>
            {loading ? 'Scanning...' : 'Consult ORACLE'}
          </button>
        </div>
      )}

    </div>
  )
}