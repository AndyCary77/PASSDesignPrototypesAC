import { useState } from 'react'

// A soft client-side gate, not real security — this prototype has no
// backend to authenticate against (see CLAUDE.md: "no backend, no auth").
// Its only job is to stop a shared link being casually opened by someone
// who wasn't given the password; PASSWORD is plain text in the bundle,
// readable by anyone who looks.
//
// Kept in sync by hand with the desktop app's own copy — src/app/auth.tsx —
// since these mobile pages are separate standalone entries that don't
// import from that tree (see CLAUDE.md's mobile/vs desktop split). Change
// the password in both places.
const PASSWORD = 'Qwaszx123456'
const STORAGE_KEY = 'pass-proto-unlocked'

function isUnlocked() {
  try { return localStorage.getItem(STORAGE_KEY) === 'true' } catch { return false }
}

function unlock() {
  try { localStorage.setItem(STORAGE_KEY, 'true') } catch {}
}

/**
 * Wraps a mobile prototype's root — nothing behind it renders (not even
 * PhoneFrame or the platform chrome) until the right password has been
 * entered once in this browser. Same "gate above everything, no redirect"
 * shape as the desktop app's PasswordGate: whatever this page was actually
 * opened with — a deep link into a specific customer/template query string
 * included — is still sitting in the address bar the moment it unlocks,
 * since nothing about the URL ever changes.
 */
export function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(isUnlocked)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  if (unlocked) return children

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password === PASSWORD) {
      unlock()
      setUnlocked(true)
    } else {
      setError(true)
    }
  }

  return (
    <div className="auth-gate">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm3 11c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
          </svg>
        </div>
        <h1 className="auth-title">PASS UX Prototypes</h1>
        <p className="auth-subtitle">Enter the password to view this prototype.</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={e => { setPassword(e.target.value); setError(false) }}
          placeholder="Password"
          className={`auth-input${error ? ' auth-input--error' : ''}`}
        />
        {error && <p className="auth-error">That password isn't right — try again.</p>}
        <button type="submit" className="auth-submit">Continue</button>
      </form>
    </div>
  )
}
