// ----------- RiskMeter.jsx ---------------------------------
// A vertical bar on the right edge of the screen showing your
// current mental stability score (10–95).
//
// How scoring works:
//   Starts at 50. Scans the last 6 messages for stress or
//   stable words and adjusts the score up or down.
//   Cyan (#00ffcc) = STABLE (70+)
//   Amber (#f5a623) = MONITOR (45–69)
//   Red   (#ff3b5c) = ALERT   (<45)
//
// Props:
//   score — number 10–95, calculated by calculateRiskScore()
// ------------------------------------------------------------
// Words that push the score DOWN (more stress = lower stability)
const STRESS_WORDS = [
  'nervous','anxious','worried','stressed','overwhelmed',
  'tired','exhausted','scared','panic','fear','doubt',
  'uncertain','confused','behind','failing','lost'
]

// Words that push the score UP (positivity = higher stability)
const STABLE_WORDS = [
  'good','ready','confident','calm','prepared','focused',
  'clear','strong','well','great','okay','fine','rested','energized'
]

// calculateRiskScore - runs in App.jsx every time messages change.
// messages = the full message array from state
export function calculateRiskScore(messages) {
  // No messages yet, start neutral at 50
  if (messages.length === 0) return 50

  // Only look at the 6 most recent messages to keep score current
  const recent = messages.slice(-6).map(m => m.content.toLowerCase()).join(' ')

  let score = 50 // neutral starting point

  // Each stress word found drops the score by 8
  STRESS_WORDS.forEach(w => { if (recent.includes(w)) score -= 8 })

  // Each stable word found raises the score by 6
  STABLE_WORDS.forEach(w => { if (recent.includes(w)) score += 6 })

  // Clamp between 10 and 95 so it never hits 0 or 100
  return Math.max(10, Math.min(95, score))
}

// Returns the right colour for the current score level
function getRiskColor(score) {
  if (score >= 70) return '#00ffcc' // stable - matches ORACLE's main colour
  if (score >= 45) return '#f5a623' // monitor - amber warning
  return '#ff3b5c'                  // alert - red danger
}

// Returns the label text for the current score level
function getRiskLabel(score) {
  if (score >= 70) return 'STABLE'
  if (score >= 45) return 'MONITOR'
  return 'ALERT'
}

// RiskMeter component - fixed to the right side of the screen
export default function RiskMeter({ score }) {
  const color = getRiskColor(score)

  return (
    <div className="risk-meter">
      {/* Label at top: STABLE / MONITOR / ALERT */}
      <span className="risk-label" style={{ color }}>{getRiskLabel(score)}</span>

      {/* The vertical track - the fill bar grows upward as score increases */}
      <div className="risk-track">
        <div
          className="risk-fill"
          style={{
            height: `${score}%`,       // height reflects the score directly
            background: color,
            boxShadow: `0 0 8px ${color}` // glow matches the status colour
          }}
        />
      </div>

      {/* Numeric score at bottom */}
      <span className="risk-num" style={{ color }}>{score}</span>
    </div>
  )
}

