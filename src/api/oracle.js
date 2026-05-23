// ------ oracle.js -------------------------------------------
// Handles ALL communication with the Backboard API.
// Any time ORACLE needs to speak, it goes through askOracle().
// One place to fix if the API ever changes.
// -------------------------------------------------------------

const API_KEY = import.meta.env.VITE_BACKBOARD_API_KEY
const BASE_URL = 'https://app.backboard.io/api'

// PROMPTS - ORACLE's personality changes depending on context.
// Exported so any feature file can use the right one.
export const PROMPTS = {

  // Used during normal conversation after the morning scan
  default: `You are ORACLE — a hyper-intelligent AI guardian that intercepts problems before they happen.
You do NOT give generic advice lists. You do NOT react — you INTERCEPT.
You speak in short, powerful statements. Maximum 3-4 sentences per response.
You identify the REAL risk the user has not named yet and address that first.
You are calm, certain, and always one step ahead.
Never use bullet points or numbered lists. Speak like a guardian, not a coach.
Tagline: A stable mind is more creative than an unstable one.`,

  // Used when delivering the Morning Briefing after all 5 scan answers
  morningBriefing: `You are ORACLE — a hyper-intelligent AI guardian that intercepts problems before they happen.
You have just received a user's morning scan: their schedule, sleep quality, main uncertainty, energy reading, and physical state.
Analyze all five together. Deliver a Morning Briefing in 3-4 sharp sentences maximum.
Identify the hidden risk connecting all five answers. Name it clearly.
Factor in energy and physical state — a low energy day with a heavy schedule is a risk. Name it.
No bullet points. No lists. Speak like a guardian, not a coach.
End with one short anchor sentence for the day.
Tagline: A stable mind is more creative than an unstable one.`,

  // ── Face Reading — runs after morning scan ──────────────
  // Cross-references scan answers with physical appearance.
  // The gap between self-reported state and physical reality
  // is where the day breaks down. ORACLE closes it.
  faceReading: `You are ORACLE — a hyper-intelligent AI guardian.
You have just received the user's morning scan answers AND a photo of their face right now.
Your job is to cross-reference what they said with what you see.
Look for: dark circles vs reported sleep quality, posture and tension vs reported energy, skin tone and vitality vs physical state reported.
If what you see matches what they said — confirm it powerfully.
If there is a gap between what they said and what you see — name it directly and without apology.
The gap between self-reported state and physical reality is where the day breaks down. You close it.
Maximum 4 sentences. No bullet points. Speak like a guardian who sees everything.`,

  // Used for the mid-day check-in that triggers 3 hours after the scan
  checkIn: `You are ORACLE — a hyper-intelligent AI guardian.
You are checking in on the user mid-day. You already know their morning scan.
Ask ONE sharp question about how the day is going relative to what they said this morning.
Maximum 2 sentences. Speak like a guardian doing a status check, not a therapist.`,

  // Used for the evening debrief — closes the daily loop
  eveningDebrief: `You are ORACLE — a hyper-intelligent AI guardian.
The day is ending. You made predictions this morning based on the user's scan.
Ask ONE sharp reflective question about how the day actually unfolded.
Reference what could have gone wrong and whether it did.
Maximum 2 sentences. Speak like a guardian closing a case file, not a therapist.
Tomorrow you will be more accurate because of tonight.`,
}

// askOracle - the single function that talks to Backboard.
// content      = the message being sent (string)
// threadId     = the conversation ID so ORACLE remembers past messages
// systemPrompt = which ORACLE personality to use (defaults to normal)
export async function askOracle(content, threadId, systemPrompt = PROMPTS.default) {
  const response = await fetch(`${BASE_URL}/threads/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({
      content,
      thread_id: threadId || undefined,
      system_prompt: systemPrompt,
      memory: 'Auto',
      llm_provider: 'openai',
      model_name: 'gpt-4o-mini'
    })
  })

  const data = await response.json()
  console.log('Backboard response:', data)
  return data
}

// askOracleWithImage - sends face photo + scan summary to gpt-4o via Backboard.
// imageBase64 = the user's face photo as base64 string
// scanSummary = string summarizing all 5 morning scan answers
// threadId    = existing conversation thread to maintain context
export async function askOracleWithImage(imageBase64, scanSummary, threadId) {
  const response = await fetch(`${BASE_URL}/threads/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({
      content: `Here are my morning scan answers: ${scanSummary}. I am also sharing a photo of myself right now. Cross-reference what I said with what you see.`,
      thread_id: threadId || undefined,
      system_prompt: PROMPTS.faceReading,
      memory: 'Auto',
      llm_provider: 'openai',
      model_name: 'gpt-4o',
      image_base64: imageBase64
    })
  })

  const data = await response.json()
  console.log('ORACLE face reading response:', data)
  return data
}

// speakText - uses Backboard TTS API for professional voice output.
// Falls back to browser synthesis if the API call fails.
export async function speakText(text) {
  try {
    const response = await fetch(`${BASE_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        text,
        provider: 'openai',
        model: 'tts-1',
        voice: 'onyx'
      })
    })

    if (!response.ok) throw new Error('TTS failed')

    // Get audio blob and play it
    const blob  = await response.blob()
    const url   = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.play()

  } catch (err) {
    // Fallback to browser voice if Backboard TTS fails
    console.error('ORACLE TTS error — falling back to browser:', err)
    try {
      window.speechSynthesis.cancel()
      const utterance  = new SpeechSynthesisUtterance(text)
      utterance.rate   = 0.85
      utterance.pitch  = 0.7
      utterance.volume = 1
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(v =>
        v.name.includes('Google UK English Male') ||
        v.name.includes('Daniel') ||
        v.name.includes('Alex')
      )
      if (preferredVoice) utterance.voice = preferredVoice
      window.speechSynthesis.speak(utterance)
    } catch (e) {
      console.error('Browser voice also failed:', e)
    }
  }
}