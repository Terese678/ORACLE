// ------ api/backboard/[...path].js ----------------------------
// Vercel serverless function. The browser calls
// /api/backboard/<endpoint> and this file adds the secret key
// before forwarding to Backboard. The key only exists on the
// server, so visitors can never see it in their browser.
// -------------------------------------------------------------

const BACKBOARD = 'https://app.backboard.io/api'

/* Only these Backboard endpoints can be reached through the proxy */
const ALLOWED_PATHS = ['threads/messages', 'tts']

/* Only these models can be requested */
const ALLOWED_MODELS = ['gpt-4o-mini', 'gpt-4o']

// Websites allowed to call this function.
// Vercel preview URLs are not listed, so previews will be blocked.
const ALLOWED_ORIGINS = ['https://oracle-six-snowy.vercel.app']

export default async function handler(req, res) {
  // Block calls that come from other websites
  const origin = req.headers.origin
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Origin not allowed' })
  }

  // The app only ever sends POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' })
  }

  // /api/backboard/threads/messages becomes "threads/messages"
  const path = [].concat(req.query.path || []).join('/')
  if (!ALLOWED_PATHS.includes(path)) {
    return res.status(404).json({ error: 'Not found' })
  }

  const body = req.body || {}

  // Chat calls must name one of the allowed models.
  // A request with no model_name is rejected too, so Backboard
  // can never fall back to a default (more expensive) model.
  // TTS has no model_name field, so it is not checked here.
  if (path === 'threads/messages' && !ALLOWED_MODELS.includes(body.model_name)) {
    return res.status(400).json({ error: 'Model not allowed' })
  }

  // The key comes from a Vercel environment variable (no VITE_ prefix)
  const key = process.env.BACKBOARD_API_KEY
  if (!key) {
    return res.status(500).json({ error: 'Server key missing' })
  }

  try {
    // Forward the request to Backboard with the key added
    const upstream = await fetch(`${BACKBOARD}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': key },
      body: JSON.stringify(body)
    })

    // Send the reply back untouched (JSON for chat, audio for tts)
    const data = Buffer.from(await upstream.arrayBuffer())
    res.status(upstream.status)
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
    res.send(data)
  } catch {
    // Backboard did not answer
    res.status(502).json({ error: 'Backboard unreachable' })
  }
}