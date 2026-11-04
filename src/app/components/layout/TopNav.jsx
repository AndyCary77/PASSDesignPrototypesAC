import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import passgeniusUrl from '../icons/passgenius.svg'
import { Crown } from 'lucide-react'
import { NavModeToggle } from './NavModeToggle'
import { HeroTeaserDialog } from '../hero/HeroTeaserDialog'
import heroIconUrl from '../icons/assessment-hero.svg'
import { useEdgeAwareTooltip } from '../../hooks/useEdgeAwareTooltip'
import './styles/top-nav.css'

// ─── Nav icons ────────────────────────────────────────────────
// Copied verbatim from Icons/PASS nav new/*.svg (Lucide icons), just with
// the per-path hardcoded stroke="#9CA3AF" removed so they inherit
// stroke="currentColor" from the wrapping <svg>.

const JournalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 21h8" />
    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
  </svg>
)
const HelpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
)
// Profile avatar initials — mirrors the employees card convention
// (web/employees): strip titles, then first initial of first + last name.
function initials(name) {
  const parts = name.split(' ').filter(p => !/^(Mr|Mrs|Miss|Ms|Prof|Madam)\.?$/i.test(p))
  return ((parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')).toUpperCase()
}
// Carried over from the legacy WebNav (not part of the "PASS nav new" export set).
const MessagesIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
  </svg>
)

// ─── Component ─────────────────────────────────────────────────

export default function TopNav({ activeItem, unreadMessages = 0, onLogout, userName = 'Alex Morgan', userAvatar, appName = 'Office Name' }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [heroOpen, setHeroOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  // Custom tooltip, centered under the hovered icon (native title is too
  // slow). Portaled to <body> so it isn't clipped or stacked below the
  // sticky bars — same approach as the side-nav tooltip. Edge-aware since
  // the avatar/PASSgenius icons sit close to the right edge of the screen,
  // where a naively-centered tooltip would run off it.
  const [tipText, setTipText] = useState(null)
  const { anchor: tip, pos: tipPos, boxRef: tipBoxRef, show: showTipAt, hide: hideTip } = useEdgeAwareTooltip()
  const showTip = (e, text) => {
    setTipText(text)
    showTipAt(e)
  }

  return (
    <div className="top-nav">
      <span className="top-nav-title">{appName}</span>
      <button
        className="top-nav-icon-btn"
        aria-label="Journal"
        onMouseEnter={(e) => showTip(e, 'Journal')}
        onMouseLeave={hideTip}
      >
        <JournalIcon />
      </button>
      <button
        className={`top-nav-icon-btn${activeItem === 'messages' ? ' active' : ''}`}
        aria-label="Messages"
        onMouseEnter={(e) => showTip(e, 'Messages')}
        onMouseLeave={hideTip}
        onClick={() => {}}
      >
        <MessagesIcon />
        {unreadMessages > 0 && (
          <span className="top-nav-badge">{unreadMessages}</span>
        )}
      </button>
      <button
        className="top-nav-icon-btn"
        aria-label="Help & training"
        onMouseEnter={(e) => showTip(e, 'Help & training')}
        onMouseLeave={hideTip}
      >
        <HelpIcon />
      </button>
      <button
        className="top-nav-icon-btn top-nav-genius-btn"
        aria-label="PASSgenius"
        onMouseEnter={(e) => showTip(e, 'PASSgenius')}
        onMouseLeave={hideTip}
      >
        <object
          className="top-nav-genius"
          type="image/svg+xml"
          data={passgeniusUrl}
          aria-label="PASSgenius"
          tabIndex={-1}
        />
      </button>
      <div className="top-nav-profile" ref={menuRef}>
        <button
          className={`top-nav-icon-btn top-nav-profile-btn${menuOpen ? ' active' : ''}`}
          aria-label={userName}
          onMouseEnter={(e) => showTip(e, userName)}
          onMouseLeave={hideTip}
          onClick={() => { setMenuOpen(o => !o); hideTip() }}
        >
          {userAvatar
            ? <img className="top-nav-avatar" src={userAvatar} alt="" />
            : <span className="top-nav-avatar">{initials(userName)}</span>}
          {/* Marks that there are upgrade features to explore in this menu (Explore Hero features). */}
          <span className="top-nav-crown" aria-hidden="true"><Crown size={10} strokeWidth={2.5} /></span>
        </button>
        {menuOpen && (
          <div className="top-nav-profile-menu">
            {/* Placeholder upgrade teaser — opens a preview of the Hero features. */}
            <button
              className="top-nav-profile-item top-nav-profile-item--feature"
              onClick={() => { setMenuOpen(false); setHeroOpen(true) }}
            >
              <img src={heroIconUrl} alt="" />
              Explore Hero features
            </button>
            <button
              className="top-nav-profile-item"
              onClick={() => { setMenuOpen(false); onLogout?.() }}
            >
              Log out
            </button>
          </div>
        )}
      </div>

      {/* Marks the switch as its own zone rather than just another icon in
          the row — without it, the toggle read as fused onto the end of
          the icon strip instead of set apart from it. */}
      <span className="top-nav-divider" />

      {/* Far right, after everything else — lets someone opt back into the
          old single-top-bar layout without disrupting anyone happy with
          this one. */}
      <NavModeToggle variant="light" current="new" />

      <HeroTeaserDialog mode="explore" open={heroOpen} onOpenChange={setHeroOpen} />

      {tip && createPortal(
        <div
          ref={tipBoxRef}
          className="top-nav-tooltip"
          style={{
            top: tip.top,
            left: tipPos ? tipPos.left : tip.center,
            transform: tipPos ? 'none' : 'translateX(-50%)',
            visibility: tipPos ? 'visible' : 'hidden',
            '--arrow-left': tipPos ? `${tipPos.arrowLeft}px` : '50%',
          }}
        >
          {tipText}
        </div>,
        document.body
      )}
    </div>
  )
}
