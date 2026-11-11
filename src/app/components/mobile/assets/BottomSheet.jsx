import { useEffect } from 'react'
import { useBackHandler } from './backStack'

// A sheet that slides up over the screen it's rendered in (that screen's container must be
// position: relative, and the sheet covers all of it). Purple header with a close button and title.
// Closes on the scrim, the close button, Escape and Android system back. Pair with bottom-sheet.css.
//
//   variant  'full' leaves a sliver of the screen behind showing at the top; 'auto' is only as tall as its content
export default function BottomSheet({ title, onClose, variant = 'full', children }) {
  useBackHandler(true, onClose)
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className={`sheet sheet--${variant}`} role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className="sheet-header">
          <button type="button" className="sheet-close" aria-label="Close" onClick={onClose}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
          </button>
          <span className="sheet-title">{title}</span>
          <span className="sheet-close-spacer" />
        </div>
        {children}
      </div>
    </div>
  )
}
