// ----- App.jsx ---------------------------------------------
// The main component. Manages all shared state and renders
// the layout. All actual feature logic lives in /features/.
// Think of this file as the skeleton — it connects everything
// but doesn't do the heavy lifting itself.
// ------------------------------------------------------------

import { useState, useEffect, useRef } from 'react'
import './App.css'

/* ── API ─────────────────────────────────────────── */
import { askOracle, askOracleWithImage, speakText, PROMPTS } from './api/oracle'

/* ── Features ────────────────────────────────────── */
import DailyScan, { ScanDots, FIRST_QUESTION } from './features/DailyScan'
import MemoryPanel from './features/MemoryPanel'
import RiskMeter, { calculateRiskScore } from './features/RiskMeter'
import CheckInBanner, { useCheckinTimer, triggerCheckin, triggerEveningDebrief, EveningBanner } from './features/CheckIn'
import Onboarding from './features/Onboarding'
import FaceCapture from './features/FaceCapture'

export default function App() {

  // ── Core state ──────────────────────────────────────────
  const [messages, setMessages]   = useState([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [threadId, setThreadId]   = useState(() =>
    localStorage.getItem('oracle_thread_id') || null
  )

  // ── Scan state ──────────────────────────────────────────
  const [scanMode, setScanMode] = useState(() => {
    const saved = localStorage.getItem('oracle_scan_done')
    return saved === new Date().toDateString() ? false : true
  })
  const [scanStep, setScanStep]         = useState(0)
  const [scanComplete, setScanComplete] = useState(() => {
    const saved = localStorage.getItem('oracle_scan_done')
    return saved === new Date().toDateString()
  })

  // ── Face capture state ──────────────────────────────────
  // showFaceCapture = true after scan, before briefing
  const [showFaceCapture, setShowFaceCapture]   = useState(false)
  // Full briefing request string from DailyScan
  const [scanSummary, setScanSummary]           = useState('')

  // ── Feature state ───────────────────────────────────────
  const [memoryOpen, setMemoryOpen]   = useState(false)
  const [memoryFacts, setMemoryFacts] = useState([])
  const [riskScore, setRiskScore]     = useState(50)
  const [checkinDue, setCheckinDue]   = useState(false)
  const [eveningDue, setEveningDue]   = useState(false)
  const [lastCheckin, setLastCheckin] = useState(() => {
    const saved = localStorage.getItem('oracle_last_checkin')
    return saved ? parseInt(saved) : null
  })

  // ── Onboarding state ────────────────────────────────────
  const [onboardingDone, setOnboardingDone] = useState(false)
  const [userName, setUserName]             = useState('')

  const messagesEndRef = useRef(null)

  // ── Effects ─────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (!scanComplete) return
    const now        = Date.now()
    const threeHours = 3 * 60 * 60 * 1000
    const eightHours = 8 * 60 * 60 * 1000
    const saved      = localStorage.getItem('oracle_last_checkin')
    const last       = saved ? parseInt(saved) : null
    if (!last || now - last > eightHours) {
      setEveningDue(true)
    } else if (now - last > threeHours) {
      setCheckinDue(true)
    }
  }, [scanComplete])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    setRiskScore(calculateRiskScore(messages))
  }, [messages])

  useCheckinTimer(scanComplete, lastCheckin, setCheckinDue, setEveningDue)

  // ── Helpers ─────────────────────────────────────────────

  const addMessage = (msg) => setMessages(prev => [...prev, msg])

  // ── completeScan ────────────────────────────────────────
  // Shared logic that finalises scan state after face capture or skip
  const completeScan = () => {
    setScanMode(false)
    setScanComplete(true)
    setLastCheckin(Date.now())
    localStorage.setItem('oracle_scan_done', new Date().toDateString())
    localStorage.setItem('oracle_last_checkin', Date.now())
    localStorage.removeItem('oracle_thread_id')
  }

  // ── handleScanComplete ──────────────────────────────────
  // Called by DailyScan after all 5 questions answered.
  // Saves memory facts, stores briefing request, shows FaceCapture.
  const handleScanComplete = ({ schedule, sleep, concern, energy, physical, briefingRequest }) => {
    setMemoryFacts([
      `Schedule: ${schedule}`,
      `Sleep: ${sleep}`,
      `Main concern: ${concern}`,
      `Energy: ${energy}`,
      `Physical: ${physical}`
    ])
    setScanSummary(briefingRequest)
    setShowFaceCapture(true)
  }

  // ── handleFaceCapture ───────────────────────────────────
  // Called when user submits face photo.
  // Sends face + full scan context to gpt-4o via Backboard.
  // ORACLE cross-references what user said vs what it sees.
  const handleFaceCapture = async (imageBase64) => {
    setShowFaceCapture(false)
    setLoading(true)

    try {
      const data = await askOracleWithImage(imageBase64, scanSummary, threadId)

      if (data.thread_id) {
        setThreadId(data.thread_id)
        localStorage.setItem('oracle_thread_id', data.thread_id)
      }

      const content = data.content || 'ORACLE is reading your state.'
      addMessage({ role: 'oracle', content, type: 'briefing' })
      speakText(content)

    } catch (err) {
      console.error('Face reading error:', err)
      addMessage({ role: 'oracle', content: 'ORACLE could not read your state. Proceeding.' })
    }

    completeScan()
    setLoading(false)
  }

  // ── handleFaceSkip ──────────────────────────────────────
  // Called when user skips face capture.
  // Delivers text-only Morning Briefing without face reading.
  const handleFaceSkip = async () => {
    setShowFaceCapture(false)
    setLoading(true)

    try {
      const data = await askOracle(scanSummary, threadId, PROMPTS.morningBriefing)

      if (data.thread_id) {
        setThreadId(data.thread_id)
        localStorage.setItem('oracle_thread_id', data.thread_id)
      }

      const content = data.content || 'ORACLE is calibrating your briefing.'
      addMessage({ role: 'oracle', content, type: 'briefing' })
      speakText(content)

    } catch (err) {
      console.error('Skip briefing error:', err)
      addMessage({ role: 'oracle', content: 'ORACLE is recalibrating. Try again.' })
    }

    completeScan()
    setLoading(false)
  }

  // ── sendMessage ─────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim()) return
    setLoading(true)

    const userMessage = input.trim()
    setInput('')
    addMessage({ role: 'user', content: userMessage })

    try {
      const data = await askOracle(userMessage, threadId)

      if (data.thread_id) {
        setThreadId(data.thread_id)
        localStorage.setItem('oracle_thread_id', data.thread_id)
      }

      addMessage({ role: 'oracle', content: data.content || 'ORACLE is recalibrating.' })

      const emotional = ['worried','nervous','anxious','feeling','afraid','excited','confident','stressed']
      if (emotional.some(w => userMessage.toLowerCase().includes(w))) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        setMemoryFacts(prev =>
          [`${time}: "${userMessage.slice(0, 50)}${userMessage.length > 50 ? '...' : ''}"`,
          ...prev].slice(0, 8)
        )
      }
    } catch (err) {
      console.error('ORACLE error:', err)
      addMessage({ role: 'oracle', content: 'ORACLE is recalibrating. Try again.' })
    }

    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const renderContent = (text) =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')

  // ── RENDER ──────────────────────────────────────────────

  // Gate 1 — Onboarding
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

  // Gate 2 — Face Capture (after morning scan, before briefing)
  if (showFaceCapture) {
    return (
      <FaceCapture
        onCapture={handleFaceCapture}
        onSkip={handleFaceSkip}
      />
    )
  }

  // ── Main App ────────────────────────────────────────────
  return (
    <div className="oracle-container">

      <RiskMeter score={riskScore} />

      <MemoryPanel
        facts={memoryFacts}
        isOpen={memoryOpen}
        onToggle={() => setMemoryOpen(!memoryOpen)}
      />

      <div className="oracle-header">
        <h1>ORACLE</h1>
        <p className="tagline">A stable mind is more creative than an unstable one</p>
        <p className="sub-tagline">Your mental crack into tomorrow</p>
      </div>

      <div className="messages">

        {checkinDue && (
          <CheckInBanner
            onAnswer={() => triggerCheckin({
              threadId, setThreadId,
              setCheckinDue, setLastCheckin,
              onMessage: addMessage,
              setLoading
            })}
            onDismiss={() => setCheckinDue(false)}
          />
        )}

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

        {scanMode && messages.length === 0 && (
          <div className="message oracle">
            <span className="role">ORACLE</span>
            <p className="scan-q">{FIRST_QUESTION}</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role} ${msg.type || ''}`}>
            <span className="role">{msg.role === 'oracle' ? 'ORACLE' : 'YOU'}</span>
            <p dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
            {msg.type === 'briefing' && <div className="bubble-badge">◈ MORNING BRIEFING</div>}
            {msg.type === 'checkin'  && <div className="bubble-badge checkin-tag">⬡ MID-DAY CHECK-IN</div>}
            {msg.type === 'debrief'  && <div className="bubble-badge debrief-tag">◈ EVENING DEBRIEF</div>}
          </div>
        ))}

        {loading && (
          <div className="message oracle">
            <span className="role">ORACLE</span>
            <p className="thinking">Scanning ahead...</p>
          </div>
        )}

        {scanMode && <ScanDots step={scanStep} />}

        <div ref={messagesEndRef} />
      </div>

      {scanMode ? (
        <DailyScan
          threadId={threadId}
          setThreadId={setThreadId}
          onComplete={handleScanComplete}
          onMessage={(msg) => {
            addMessage(msg)
            if (msg.type === 'scan-question') setScanStep(prev => prev + 1)
          }}
          onStepChange={setScanStep}
        />
      ) : (
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