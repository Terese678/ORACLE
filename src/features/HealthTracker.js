// ------ HealthTracker.js ------------------------------------
// ORACLE's health intelligence engine.
// This file does three things:
//   1. Saves today's health data to localStorage
//   2. Reads the last 7 days of health history
//   3. Detects patterns ORACLE uses to warn you before problems surface

// Why localStorage? So ORACLE remembers your health across sessions
// without needing a backend or login. Your data stays on your device.
// ------------------------------------------------------------

// The key we use to store health data in localStorage
const STORAGE_KEY = 'oracle_health_log'

// How many days of history we keep
// 7 days gives enough data to spot weekly patterns
const HISTORY_LIMIT = 7

// ------ saveHealthEntry -------------------------------------
// Called after the morning scan completes.
// Saves today's energy, physical state, and sleep to localStorage.
// If an entry for today already exists, it gets replaced.
//
// entry = { energy, physical, sleep, date }
// ------------------------------------------------------------
export function saveHealthEntry(entry) {
  // Read whatever health history already exists
  const history = getHealthHistory()

  // Get today's date as a clean string e.g. "2026-05-15"
  const today = getTodayDate()

  // Remove any existing entry for today so we don't get duplicates
  const filtered = history.filter(item => item.date !== today)

  // Add today's fresh entry at the front of the array
  const updated = [{ ...entry, date: today }, ...filtered]

  // Only keep the last 7 days — older data gets dropped
  const trimmed = updated.slice(0, HISTORY_LIMIT)

  // Save back to localStorage as a JSON string
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
}

// ------ getHealthHistory ------------------------------------
// Returns the full array of stored health entries.
// If nothing is stored yet, returns an empty array.
// ------------------------------------------------------------
export function getHealthHistory() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    // If nothing stored yet, return empty array
    return stored ? JSON.parse(stored) : []
  } catch {
    // If localStorage is corrupted somehow, start fresh
    return []
  }
}

// ------ detectHealthPatterns --------------------------------
// The intelligence layer. Looks at the last 7 days and finds
// patterns that ORACLE uses in the Morning Briefing.
//
// Returns a string summary of any patterns found.
// Returns null if nothing significant detected.
// ------------------------------------------------------------
export function detectHealthPatterns() {
  const history = getHealthHistory()

  // Need at least 2 days of data to detect a pattern
  if (history.length < 2) return null

  const patterns = []

  // --- Low energy streak ---
  // Count how many consecutive days started with low energy
  const lowEnergyStreak = countStreak(history, item =>
    item.energy?.toLowerCase() === 'low'
  )
  if (lowEnergyStreak >= 2) {
    patterns.push(`Low energy detected for ${lowEnergyStreak} consecutive mornings`)
  }

  // --- Poor sleep streak ---
  // Flag if the user has reported bad sleep 2+ days in a row
  const poorSleepStreak = countStreak(history, item =>
    item.sleep?.toLowerCase().includes('bad') ||
    item.sleep?.toLowerCase().includes('poor') ||
    item.sleep?.toLowerCase().includes('little') ||
    extractSleepHours(item.sleep) < 6
  )
  if (poorSleepStreak >= 2) {
    patterns.push(`Poor sleep reported for ${poorSleepStreak} consecutive days`)
  }

  // --- Recurring physical symptoms ---
  // If the same physical symptom appears 2+ times in the last 7 days
  const symptoms = history
    .map(item => item.physical?.toLowerCase())
    .filter(p => p && p !== 'clear' && p !== 'all good' && p !== 'none')

  if (symptoms.length >= 2) {
    patterns.push(`Recurring physical symptoms detected: ${symptoms[0]}`)
  }

  // --- Low energy + heavy schedule correlation ---
  // If today is low energy and yesterday was also low energy
  // this is worth flagging directly in the briefing
  if (
    history[0]?.energy?.toLowerCase() === 'low' &&
    history[1]?.energy?.toLowerCase() === 'low'
  ) {
    patterns.push('Energy has been low for multiple days — risk of compounding fatigue today')
  }

  // Return all patterns joined together, or null if none found
  return patterns.length > 0 ? patterns.join('. ') : null
}

// ------ getTodayDate ----------------------------------------
// Returns today's date as "YYYY-MM-DD"
// Used to tag each health entry with the correct day
// ------------------------------------------------------------
export function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

// ------ countStreak -----------------------------------------
// Helper that counts how many entries IN A ROW (starting from
// the most recent) match a given condition.
//
// history   = array of health entries, newest first
// condition = a function that returns true/false for each entry
// ------------------------------------------------------------
function countStreak(history, condition) {
  let streak = 0
  for (const entry of history) {
    if (condition(entry)) {
      streak++
    } else {
      // Streak broken — stop counting
      break
    }
  }
  return streak
}

// ------ extractSleepHours -----------------------------------
// Tries to pull a number out of a sleep string.
// e.g. "6 hours" → 6, "about 5hrs" → 5
// Returns 8 (assumed fine) if no number found
// ------------------------------------------------------------
function extractSleepHours(sleepText) {
  if (!sleepText) return 8
  const match = sleepText.match(/\d+/)
  return match ? parseInt(match[0]) : 8
}