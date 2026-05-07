// -- CheckIn.jsx --------------------------------------------
// This file handles the mid-day check-in feature.
// 3 hours after the morning scan completes, a banner appears
// asking if you want ORACLE to check in on your day.
//
// Three exports:
//   useCheckinTimer  - hook that starts the 3-hour countdown
//   triggerCheckin   - fires the actual ORACLE check-in message
//   CheckInBanner    - the amber banner UI component
// -------------------------------------------------------------

import { useEffect } from 'react'
import { askOracle, PROMPTS } from '../api/oracle'

// useCheckinTimer - custom hook used in App.jsx.
// Runs two timers:
// 1. Midday check-in: triggers 3 hours after the morning scan
// 2. Evening debrief: triggers 8 hours after the morning scan
export function useCheckinTimer(scanComplete, lastCheckin, setCheckinDue, setEveningDue) {
    useEffect(() => {
        // Don't start either timer until the morning scan is done
        if (!scanComplete) return

        // Check every 60 seconds whether a check-in is due
        const interval = setInterval(() => {
            const threeHours = 3 * 60 * 60 * 1000  // 3 hours converted to milliseconds
            const eightHours = 8 * 60 * 60 * 1000  // 8 hours converted to milliseconds
            const now = Date.now()

            // Midday check-in - triggers after 3 hours
            if (!lastCheckin || now - lastCheckin > threeHours) {
                setCheckinDue(true)
            }

            // Evening debrief - triggers after 8 hours
            if (!lastCheckin || now - lastCheckin > eightHours) {
                setEveningDue(true)
            }
        }, 60000) // runs every 1 minute

        // Clean up the interval if the component unmounts
        return () => clearInterval(interval)
    }, [scanComplete, lastCheckin, setCheckinDue, setEveningDue])
}

// triggerCheckin — called when the user clicks "Answer" on the midday banner.
// Sends a check-in request to ORACLE and adds its response to messages.
export async function triggerCheckin({
    threadId, setThreadId,
    setCheckinDue, setLastCheckin,
    onMessage, setLoading
}) {
    setCheckinDue(false)           // hide the banner immediately
    setLastCheckin(Date.now())     // reset the timer
    setLoading(true)

    try {
        // Ask ORACLE for a midday status check
        const data = await askOracle(
            'Mid-day status check based on my morning scan.',
            threadId,
            PROMPTS.checkIn
        )

        if (data.thread_id) setThreadId(data.thread_id)

        // Add ORACLE's reply as a midday check-in message
        onMessage({
            role: 'oracle',
            content: data.content || 'How are you holding up?',
            type: 'checkin'  // App.jsx uses this to show the ⬡ MID-DAY CHECK-IN badge
        })
    } catch (err) {
        console.error('Check-in error:', err)
    }

    setLoading(false)
}

// triggerEveningDebrief - called when the user clicks "Debrief" on the evening banner.
// Uses the eveningDebrief prompt so ORACLE closes the day's case file.
export async function triggerEveningDebrief({
    threadId, setThreadId,
    setEveningDue, setLastCheckin,
    onMessage, setLoading
}) {
    setEveningDue(false)           // hide the evening banner
    setLastCheckin(Date.now())     // reset the timer so it doesn't retrigger
    setLoading(true)

    try {
        // Ask ORACLE to close the day using the evening debrief prompt
        const data = await askOracle(
            'The day is ending. Close my case file for today.',
            threadId,
            PROMPTS.eveningDebrief
        )

        if (data.thread_id) setThreadId(data.thread_id)

        // Add ORACLE's debrief as a special 'debrief' type message
        onMessage({
            role: 'oracle',
            content: data.content || 'How did today unfold?',
            type: 'debrief'  // App.jsx uses this to show the ◈ EVENING DEBRIEF badge
        })
    } catch (err) {
        console.error('Evening debrief error:', err)
    }

    setLoading(false)
}

// CheckInBanner - the amber notification bar that appears at the
// top of the messages area when a check-in is due.
// onAnswer  = user wants to check in now
// onDismiss = user wants to check in later
export default function CheckInBanner({ onAnswer, onDismiss }) {
  return (
    <div className="checkin-banner">
      <span>⬡ ORACLE wants to check in</span>
      <button className="checkin-btn" onClick={onAnswer}>Answer</button>
      <button className="checkin-dismiss" onClick={onDismiss}>Later</button>
    </div>
  )
}

// EveningBanner - purple banner that appears after 8 hours
// Distinct from the amber midday banner so the user knows
// this is the end-of-day debrief, not just a check-in
export function EveningBanner({ onAnswer, onDismiss }) {
    return (
        <div className="evening-banner">
            {/* Purple icon to distinguish from amber midday banner */}
            <span>◈ ORACLE is closing today's case file</span>
            <button className="evening-btn" onClick={onAnswer}>Debrief</button>
            <button className="evening-dismiss" onClick={onDismiss}>Not yet</button>
        </div>
    )
}
