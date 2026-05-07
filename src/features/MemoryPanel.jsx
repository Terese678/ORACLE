// ------- MemoryPanel.jsx ----------------------------------------
// Shows what ORACLE has captured about you across the session.
// Slides in from the left when you click the ▶ MEM button.
//
// Props:
//   facts    - array of strings (schedule, sleep, concern, emotional moments)
//   isOpen   - true = panel visible, false = hidden
//   onToggle - called when the MEM button is clicked
// ------------------------------------------------------------------

export default function MemoryPanel({ facts, isOpen, onToggle }) {
  return (
    <>
      {/* MEM button fixed to the left edge of the screen.
          Rotated vertically so it sits neatly on the edge.
          Clicking it toggles the panel open/closed. */}
      <button className="mem-toggle" onClick={onToggle}>
        {isOpen ? '◀' : '▶'} MEM
      </button>

      {/* The panel itself. CSS class 'open' slides it into view.
          When closed, it's hidden off-screen to the left. */}
      <div className={`mem-panel ${isOpen ? 'open' : ''}`}>

        {/* Panel title */}
        <div className="mem-header">◈ ORACLE REMEMBERS</div>

        {/* If no facts yet, prompt the user to complete the scan */}
        {facts.length === 0
          ? <p className="mem-empty">Complete your morning scan to begin.</p>

          // Each fact is one thing ORACLE remembers - e.g. "Schedule: meetings all day"
          : facts.map((fact, i) => (
            <div key={i} className="mem-fact">
              <span className="mem-dot">◆</span> {/* decorative diamond bullet */}
              <span>{fact}</span>
            </div>
          ))
        }
      </div>
    </>
  )
}
