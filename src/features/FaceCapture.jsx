// ====================================================
// FaceCapture.jsx — Captures a photo of the user after
// the morning scan. Sends face + scan answers to ORACLE
// via gpt-4o for cross-reference analysis.
// The gap between self-reported state and physical
// reality is where the day breaks down. ORACLE closes it.
// ====================================================

import { useState, useRef } from 'react'
import './FaceCapture.css'

export default function FaceCapture({ onCapture, onSkip }) {

  const [preview, setPreview]   = useState(null)
  const [image, setImage]       = useState(null)
  const fileInputRef            = useRef(null)

  /* ── Convert image to base64 ─────────────────── */
  const handleSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))

    const reader = new FileReader()
    reader.onload = () => setImage(reader.result.split(',')[1])
    reader.readAsDataURL(file)
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