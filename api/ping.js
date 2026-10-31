// Test function: confirms Vercel deploys the api folder
export default function handler(req, res) {
  res.status(200).json({ ok: true })
}