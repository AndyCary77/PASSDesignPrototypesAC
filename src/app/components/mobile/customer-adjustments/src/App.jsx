import { useRef, useState } from 'react'
import StatusBar from '../../assets/StatusBar'
import PhoneFrame from '../../assets/PhoneFrame'
import { handleSystemBack } from '../../assets/backStack'
// The same customer record and profile header as mobile/customer-documents and mobile/customer-menu: the purple
// header persists across the customer's screens.
import { CUSTOMER as PROFILE } from '../../customer-documents/src/customerDocumentsData'
import { AllergiesIcon, DnacprIcon, DolsIcon, FlagChipIcon } from '../../customer-menu/src/menuIcons'
// The same flag record, wording and ordering rules as the web platform's Reasonable Adjustments tab
// (src/app/components/customer/ReasonableAdjustmentsPage.tsx), so the two never disagree.
import AdjustmentsContent from '../../assets/AdjustmentsContent'
import { formatRafDateTime, getRafRecord } from '../../../../data/reasonableAdjustments'

// Offline keeps showing the flag and its details from the last sync, with the last-synced time (call on the open questions, Nov 2026).
// Read-only, per the ticket (AIOP-25290, apps): Level 1 users see Reasonable Adjustments only, Level 2 users
// see all three sections. Nothing on the app creates, adds, removes or deletes; that happens in PASS.
// Level 3 users are Level 2 here.
const CUSTOMER = { name: PROFILE.name, recordId: 'arthur-barrington' }
const CHIP_ICONS = { allergies: AllergiesIcon, dnacpr: DnacprIcon, dols: DolsIcon }
// How far the content scrolls while the header collapses from full to compact.
const COLLAPSE_RANGE = 110

const ArrowLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.72 11.37L4.75 11.34C4.72 11.37 4.70 11.40 4.67 11.44C4.65 11.47 4.64 11.49 4.62 11.52C4.61 11.54 4.60 11.57 4.57 11.63C4.56 11.65 4.52 11.76 4.5 12C4.5 12.12 4.52 12.24 4.56 12.35C4.57 12.40 4.60 12.43 4.62 12.48C4.64 12.51 4.65 12.53 4.67 12.56L4.72 12.63L4.74 12.65L9.75 18.29C10.12 18.70 10.75 18.74 11.16 18.37C11.58 18.01 11.61 17.37 11.25 16.96L7.73 13H18.5C19.05 13 19.5 12.55 19.5 12C19.5 11.45 19.05 11 18.5 11H7.73L11.25 7.04C11.59 6.66 11.58 6.09 11.25 5.72L11.16 5.63C10.75 5.26 10.12 5.30 9.75 5.71L4.75 11.34L4.74 11.35C4.73 11.36 4.73 11.37 4.72 11.37Z"/>
  </svg>
)
const ChevronLeftIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
  </svg>
)
const CloudOffIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3 0 1.13-.64 2.11-1.56 2.62l1.45 1.45C23.16 18.16 24 16.68 24 15c0-2.64-2.05-4.78-4.65-4.96zM3 5.27l2.75 2.74C2.56 8.15 0 10.77 0 14c0 3.31 2.69 6 6 6h11.73l2 2L21 20.73 4.27 4 3 5.27zM7.73 10l8 8H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h1.73z"/>
  </svg>
)
const KeyIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
  </svg>
)
const GridMenuIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M4 8H8V4H4V8ZM10 20H14V16H10V20ZM4 20H8V16H4V20ZM4 14H8V10H4V14ZM10 14H14V10H10V14ZM16 4V8H20V4H16ZM10 8H14V4H10V8ZM16 14H20V10H16V14ZM16 20H20V16H16V20Z"/>
  </svg>
)
export default function App() {
  const [transition] = useState(() => new URLSearchParams(window.location.search).get('transition'))
  const [level, setLevel] = useState('2')
  const [offline, setOffline] = useState(false)
  // The purple header shrinks as the content scrolls: --p (0 at the top, 1 after COLLAPSE_RANGE px) drives every
  // measurement in the CSS, so it follows the finger continuously instead of snapping between two states. Written
  // straight to the element rather than through React state, so scrolling doesn't re-render the screen.
  const cardRef = useRef(null)
  const handleScroll = (e) => {
    const p = Math.min(1, Math.max(0, e.currentTarget.scrollTop / COLLAPSE_RANGE))
    cardRef.current?.style.setProperty('--p', p.toFixed(3))
    cardRef.current?.querySelector('.cm-key')?.setAttribute('aria-hidden', p > 0.9 ? 'true' : 'false')
  }
  // When this device last heard from the national flag; shown as the spec's "last retrieved" time. Offline, the
  // device keeps showing what it held from its last sync, so this is the time it is labelled with instead.
  const [retrievedAt] = useState(() => new Date())
  const [lastSyncedAt] = useState(() => new Date(Date.now() - (2 * 60 + 37) * 60_000))
  const record = getRafRecord(CUSTOMER.recordId)
  // Back goes to wherever you came from: a screen can pass `back` (a relative '../…' URL — Bookings and its visit
  // do) and otherwise it's the customer menu.
  const requestedBack = new URLSearchParams(window.location.search).get('back')
  const backHref = requestedBack && requestedBack.startsWith('../') && !requestedBack.includes('//')
    ? requestedBack
    : '../customer-menu/?transition=back'
  const back = () => { window.location.href = backHref }
  const systemBack = () => handleSystemBack(back)

  return (
    <>
      <a href="/" className="back-link"><ChevronLeftIcon size={16} /> Prototypes</a>
      {/* Demo-only switches, outside the phone, bottom-right, same as customer-documents' offline switch. */}
      <div className="ra-demo">
        <button type="button" className="ra-demo-btn" onClick={() => setLevel(l => (l === '1' ? '2' : '1'))}>
          View as: Level {level}
        </button>
        <button type="button" className={`ra-demo-btn${offline ? ' ra-demo-btn--on' : ''}`} aria-pressed={offline} onClick={() => setOffline(o => !o)}>
          <CloudOffIcon size={18} />
          {offline ? 'Offline mode: on' : 'Offline mode: off'}
        </button>
      </div>
      <PhoneFrame onSystemBack={systemBack}>
        <div className={`screen-area page-slide${transition === '1' ? ' slide-entering' : ''}`} data-offline={offline ? 'true' : undefined}>
          <div className="screen">
            <StatusBar />
            <div className="app-header">
              <a className="app-header-back" href={backHref}><ArrowLeftIcon /></a>
              <span className="app-header-title">All customers</span>
              <div style={{ width: 36 }} />
            </div>
            {offline && (
              <div className="ra-offline-banner" role="status">
                <CloudOffIcon size={20} />
                <span>You’re offline. Showing the last sync, <span style={{ whiteSpace: 'nowrap' }}>{formatRafDateTime(lastSyncedAt)}</span>.</span>
              </div>
            )}

            <div className="cm-customer-card" ref={cardRef}>
              <h1 className="cm-customer-name">{PROFILE.name}</h1>
              <div className="cm-meta cm-meta--address"><span className="cm-meta-label">Address</span>{PROFILE.addressLine1}, {PROFILE.addressLine2}</div>
              <div className="cm-meta cm-meta--dob"><span className="cm-meta-label">Date of Birth</span>{PROFILE.dob}</div>
              <div className="cm-chips">
                {PROFILE.legalChips.map(chip => {
                  const ChipIcon = CHIP_ICONS[chip.id]
                  return <span key={chip.id} className="cm-chip">{ChipIcon && <ChipIcon />}{chip.label}</span>
                })}
                <span className="cm-chip cm-chip-adjustments"><FlagChipIcon />Adjustments</span>
              </div>
              <img className="cm-avatar" src={PROFILE.photo} alt="" />
              {PROFILE.highRisk && <span className="cm-high-risk">HIGH RISK</span>}
              <span className="cm-key"><KeyIcon size={22} /></span>
            </div>

            <div className="ra-menu-bar">
              <h2>Reasonable adjustments</h2>
              <a className="ra-menu-action" href="../customer-menu/?transition=back"><GridMenuIcon size={18} /> Menu</a>
            </div>

            <div className="ra-body" onScroll={handleScroll}>
              <AdjustmentsContent record={record} level={level} offline={offline} retrievedAt={retrievedAt} lastSyncedAt={lastSyncedAt} />
            </div>
          </div>
        </div>
      </PhoneFrame>
    </>
  )
}
