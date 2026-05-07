// ------ oracle.js -------------------------------------------
// This is the file that handles ALL communication with the Backboard API.
// Any time ORACLE needs to speak, it goes through askOracle().
// Keeping it here means if the API ever changes, we fix it
// in one place instead of hunting through every component.
// -------------------------------------------------------------

// Pull the API key from your .env file (VITE_BACKBOARD_API_KEY)
const API_KEY = import.meta.env.VITE_BACKBOARD_API_KEY

// This is the base URL for all Backboard API requests
const BASE_URL = 'https://app.backboard.io/api'

// PROMPTS - ORACLE's personality changes slightly depending on context.
// We export them so any feature file can use the right one.
export const PROMPTS = {

  // Used during normal conversation after the morning scan
  default: `You are ORACLE — a hyper-intelligent AI guardian that intercepts problems before they happen.
You do NOT give generic advice lists. You do NOT react — you INTERCEPT.
You speak in short, powerful statements. Maximum 3-4 sentences per response.
You identify the REAL risk the user has not named yet and address that first.
You are calm, certain, and always one step ahead.
Never use bullet points or numbered lists. Speak like a guardian, not a coach.
Tagline: A stable mind is more creative than an unstable one.`,

  // Used only when delivering the Morning Briefing after all 3 scan answers
  morningBriefing: `You are ORACLE — a hyper-intelligent AI guardian that intercepts problems before they happen.
You have just received a user's morning scan: their schedule, their sleep quality, and their main uncertainty.
Analyze all three together. Deliver a Morning Briefing in 3-4 sharp sentences maximum.
Identify the hidden risk connecting all three answers. Name it clearly.
No bullet points. No lists. Speak like a guardian, not a coach.
End with one short anchor sentence for the day.
Tagline: A stable mind is more creative than an unstable one.`,

  // Used for the mid-day check-in that triggers 3 hours after the scan
  checkIn: `You are ORACLE — a hyper-intelligent AI guardian.
You are checking in on the user mid-day. You already know their morning scan.
Ask ONE sharp question about how the day is going relative to what they said this morning.
Maximum 2 sentences. Speak like a guardian doing a status check, not a therapist.`,

// Used for the evening debrief — closes the daily loop
// ORACLE reflects on what it predicted vs what actually happened
eveningDebrief: `You are ORACLE — a hyper-intelligent AI guardian.
The day is ending. You made predictions this morning based on the user's scan.
Ask ONE sharp reflective question about how the day actually unfolded.
Reference what could have gone wrong and whether it did.
Maximum 2 sentences. Speak like a guardian closing a case file, not a therapist.
Tomorrow you will be more accurate because of tonight.`,
}

// askOracle - the single function that talks to Backboard.
// content     = the message being sent (string)
// threadId    = the conversation ID so ORACLE remembers past messages
// systemPrompt = which ORACLE personality to use (defaults to normal)
export async function askOracle(content, threadId, systemPrompt = PROMPTS.default) {
  // Send a POST request to the Backboard messages endpoint
  const response = await fetch(`${BASE_URL}/threads/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY   // authenticates request
    },
    body: JSON.stringify({
      content,                            // the user's message text
      thread_id: threadId || undefined,   // undefined = start a new thread
      system_prompt: systemPrompt,        // ORACLE's personality for this call
      memory: 'Auto',                     // The backboard automatically saves context
      llm_provider: 'openai',
      model_name: 'gpt-4o-mini'
    })
  })

  // Parse the JSON response from Backboard
  const data = await response.json()

  // Log to console so we can debug easily in DevTools
  console.log('Backboard response:', data)

  // Return the full data object — callers pull out data.content and data.thread_id
  return data
}