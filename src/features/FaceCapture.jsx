// ====================================================
// FaceCapture.jsx — Captures a photo of the user after
// the morning scan. Sends face + scan answers to ORACLE
// via gpt-4o for cross-reference analysis.
// The gap between self-reported state and physical
// reality is where the day breaks down. ORACLE closes it.
// ====================================================

import { useState, useRef } from 'react'
import './FaceCapture.css'

/* ── Shrink the photo, then convert to base64 ───────────
   Phone photos are several MB. The server function accepts
   about 4.5MB per request, so we resize to 1024px first. */
const resizeToBase64 = (file) =>
  new Promise((resolve) => {
    const img = new Image()
    img.onerror = () => resolve(null)
    img.onload = () => {
      // scale = 1 means the photo is already small, leave it alone
      const scale  = Math.min(1, 1024 / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(img.src)
      resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1])
    }
    img.src = URL.createObjectURL(file)
  })

export default function FaceCapture({ onCapture, onSkip }) {

  const [preview, setPreview]   = useState(null)
  const [image, setImage]       = useState(null)
  const fileInputRef            = useRef(null)

  /* ── Show a preview and prepare the base64 image ─ */
  const handleSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setImage(await resizeToBase64(file))
  }

  /* ── Render ──────────────────────────────────── */
  return (
    <div className="face-capture-container">

      <div className="face-capture-header">
        <span className="face-icon">◈</span>
        <h2>One last thing.</h2>
        <p>Let ORACLE see you — not just your answers.</p>
        <p className="face-sub">
          Your face tells a story your words sometimes hide.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        className={`face-zone ${preview ? 'has-image' : ''}`}
        onClick={() => fileInputRef.current.click()}
      >
        {preview
          ? <img src={preview} alt="Your face" className="face-preview" />
          : <div className="face-prompt">
              <span>📷</span>
              <p>Tap to take or upload a photo</p>
            </div>
        }
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* Actions */}
      <div className="face-actions">
        {image && (
          <button className="face-submit" onClick={() => onCapture(image)}>
            Let ORACLE Read This
          </button>
        )}
        <button className="face-skip" onClick={onSkip}>
          Skip for now
        </button>
      </div>

    </div>
  )
}