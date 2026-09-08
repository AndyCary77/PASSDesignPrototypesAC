import { useState, useEffect, useRef } from 'react'
import PhoneFrame from '../../assets/PhoneFrame'
import StatusBar from '../../assets/StatusBar'
import AppHeader from '../../assets/AppHeader'
import CareBridgeIcon from '../../assets/CareBridgeIcon'
import { usePlatform } from '../../assets/platform'
import { addRecording } from '../../assets/recordings'
import { handleSystemBack, useBackHandler } from '../../assets/backStack'
import arthurImg from '../../assets/img/Customer=Arthur.png'
import davidImg from '../../assets/img/Customer=David Farrington.png'
import jimImg from '../../assets/img/Customer=Jim McLean.png'
import harinderImg from '../../assets/img/Customer=Harinder Kulkarni.png'

// ─── Icons ───────────────────────────────────────────────────

const ChevronLeftIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
  </svg>
)
const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M5 12l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const PauseIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="5" width="4" height="14" rx="1"/>
    <rect x="14" y="5" width="4" height="14" rx="1"/>
  </svg>
)
const PlayIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
)
const RetryIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M18 3v4h-4M6 21v-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
)
const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1.06 14.54L7.4 12l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41-5.64 5.65z"/>
  </svg>
)
const StopCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3 12H9V9h6v6z"/>
  </svg>
)
const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm3 11c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
  </svg>
)
const UsersIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
)
const MicIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M19 11a7 7 0 01-14 0M12 18v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
)
// A live level-meter, not a pre-recorded clip: every bar stays in its own
// fixed slot and pulses in place, the way a real "recording…" indicator
// looks (Voice Memos, WhatsApp) — nothing slides across the screen, and
// there's no earlier/later portion to shade differently, so a single
// colour is the honest choice, not a stylistic one.
//
// The row's base heights trace a real amplitude envelope rather than
// uniform noise: near-silent at both ends, a quick rise into a front-loaded
// loud stretch, then a long, gradual taper back down — matching how a
// spoken utterance actually looks (quick to start, slow to trail off), not
// symmetric. Fixed/hand-authored (not Math.random) so the shape is stable
// across re-renders (this screen re-renders every second, on the record
// clock).
const WAVE_HEIGHTS = [
  3, 4, 3,                              // quiet — nothing said yet
  10, 19,                               // quick rise
  28, 33, 30, 34, 29, 32, 27, 31, 28,   // front-loaded, sustained peak
  22, 18, 24, 19, 21, 17, 20,           // stepping down
  13, 10, 14, 9, 12, 8, 11,
  9, 7, 8, 5, 6, 4,                     // long, gradual taper — more
  4, 3,                                 // bars here than the rise had
]
// The near-silent bars at both ends (matching the quiet heights above)
// barely move at all, rather than pulsing through the same wide range as
// the loud stretch — a flat line is what real silence looks like.
const QUIET_INDICES = new Set([0, 1, 2, 34, 35])
// Bars pulse in groups of 3, not independently — neighbours share a
// duration and are within a few hundredths of a second of each other in
// phase, so a cluster visibly breathes together, the way adjacent moments
// of the same word do. Groups themselves get a scrambled (not left→right
// increasing) delay order specifically so nothing reads as travelling
// across the row — that's the one thing this must not look like.
const GROUP_SIZE = 3
const GROUP_DELAYS = [0, -0.6, -0.3, -0.75, -0.15, -0.5, -0.9, -0.2, -0.65, -0.4, -0.1, -0.55]
const GROUP_DURATIONS = [0.7, 0.85, 0.65, 0.95, 0.75, 0.8]
const BAR_JITTER = [0, -0.04, -0.08]
// `size="small"` is the same 36-bar shape at half scale (see
// .cb-live-wave--small) — reused as-is on Consent's mic-check card rather
// than a second waveform built from scratch, so "this is what CareBridge
// will sound like recording" and "this is what you just heard back" are
// visibly the same visual language.
//
// `playing` defaults to true for the record screen's own always-live use.
// When false (the mic-check test, before/after playback), no animation
// name is applied at all — bars sit at their plain authored height, a
// static snapshot of the clip's shape, rather than freezing mid-pulse at
// an arbitrary transform value, which would look broken, not paused.
const LiveWaveform = ({ size, playing = true, label = 'Assessment Hero is listening' }) => (
  <div className={`cb-live-wave${size === 'small' ? ' cb-live-wave--small' : ''}`} role="img" aria-label={label}>
    {WAVE_HEIGHTS.map((h, i) => {
      const quiet = QUIET_INDICES.has(i)
      const group = Math.floor(i / GROUP_SIZE)
      const toneClass = quiet ? 'cb-live-wave-bar--quiet' : `cb-live-wave-bar--${(group % 3) + 1}`
      return (
        <span
          key={i}
          className={`cb-live-wave-bar${playing ? ' ' + toneClass : ''}`}
          style={playing ? {
            height: `${h}px`,
            animationDuration: quiet ? '1.6s' : `${GROUP_DURATIONS[group % GROUP_DURATIONS.length]}s`,
            animationDelay: `${GROUP_DELAYS[group % GROUP_DELAYS.length] + BAR_JITTER[i % BAR_JITTER.length]}s`,
          } : { height: `${h}px` }}
        />
      )
    })}
  </div>
)

// ─── Data ────────────────────────────────────────────────────

// The customer is created in PASS during the phone enquiry, so this is a
// picker of people with an assessment due — each carries the suggested
// template (in a real build, pre-suggested from inbound HubSpot data).
const CUSTOMERS = [
  { id: 'arthur',   name: 'Arthur Barrington', img: arthurImg,   due: 'initial',  dueLabel: 'Initial assessment due' },
  { id: 'harinder', name: 'Harinder Kulkarni', img: harinderImg, due: 'review2',  dueLabel: '2-week review due' },
  { id: 'jim',      name: 'Jim McLean',        img: jimImg,      due: 'review6',  dueLabel: '6-week review due' },
  { id: 'david',    name: 'David Farrington',  img: davidImg,    due: 'review6m', dueLabel: '6-month review due' },
]

// Real PASS assessment documents (Bluebird references removed). Each doc is a
// set of sections (grouped, like the PASS sub-nav) that each hold many fields.
// `fields` = inputs in that section; `target` = how many CareBridge fills from
// the conversation (omitted = all → section completes). This drives the live
// recording progress and the end-of-visit completion indicators.
const TEMPLATES = [
  { id: 'careplan', name: 'Customer Care and Support Plan', short: 'Care & Support Plan', created: '30/12/2026',
    sections: [
      { group: 'Hospital passport', name: 'Personal details', fields: 12 },
      { group: 'Hospital passport', name: 'Section 1 · Profile and background', fields: 14 },
      { group: 'Care plan', name: 'Section 2 · Personal care and daily routine', fields: 22 },
      { group: 'Care plan', name: 'Section 3 · Activities, exercise and socialising', fields: 16 },
      { group: 'Care plan', name: 'Section 4 · Nutrition and hydration', fields: 18 },
      { group: 'Care plan', name: 'Section 5 · Mobility', fields: 20 },
      { group: 'Care plan', name: 'Section 6 · Health and medication', fields: 24, target: 21 },
      { group: 'Care plan', name: 'Section 7 · Domestic and financial support', fields: 15, target: 10 },
      { group: 'Care plan', name: 'Section 8 · Additional support', fields: 12 },
      { group: 'Assessments', name: 'Needs assessment', fields: 18 },
      { group: 'Assessments', name: 'Moving and positioning assessment', fields: 14 },
      { group: 'Assessments', name: 'Companionship / home help / financial assessment', fields: 16, target: 11 },
      { group: 'Assessments', name: 'Home environment assessment', fields: 12, target: 8 },
    ] },
  { id: 'consent-care', name: 'Consent to Care', short: 'Consent to Care', created: '20/12/2026',
    sections: [
      { name: 'Consent to care & support', fields: 6 },
      { name: 'Decision-making & capacity', fields: 5 },
      { name: 'Information sharing', fields: 4, target: 3 },
    ] },
  { id: 'confirm-receipt', name: 'Confirmation of Receipt', short: 'Confirmation of Receipt', created: '20/12/2026',
    sections: [
      { name: 'Documents received', fields: 5 },
      { name: 'Understanding confirmed', fields: 3 },
    ] },
  { id: 'confirm-instructions', name: 'Confirmation of Instructions', short: 'Confirmation of Instructions', created: '20/12/2026',
    sections: [
      { name: 'Care plan accuracy', fields: 8 },
      { name: 'Agreed visits & tasks', fields: 6 },
      { name: 'Outcomes & goals', fields: 5, target: 3 },
      { name: 'Consent to plan', fields: 4 },
    ] },
  { id: 'privacy', name: 'Privacy Policy', short: 'Privacy Policy', created: '20/12/2026',
    sections: [
      { name: 'Privacy explained', fields: 4 },
      { name: 'How data is used', fields: 3 },
    ] },
  { id: 'terms', name: 'Terms and Conditions of Business', short: 'Terms & Conditions', created: '20/12/2026',
    sections: [
      { name: 'Terms explained', fields: 5 },
      { name: 'Fees & charges', fields: 4 },
      { name: 'Cancellation', fields: 3 },
    ] },
  { id: 'customer-guide', name: 'Customer Guide – Windsor & Maidenhead', short: 'Customer Guide', created: '20/12/2026',
    sections: [
      { name: 'Guide provided', fields: 3 },
      { name: 'Key contacts', fields: 3 },
    ] },
  // Other Documents' own pack (BBC SD09(2) Best Interest Decision Making
  // Framework, applied to three separate decisions, plus two ad hoc
  // reviews) — offered by "Record with CareBridge" alongside the
  // Assessments pack above, since a recording links to a document from
  // either source in that picker.
  { id: 'best-interest-consent', name: 'Best Interest Decision Making - Consent to care', short: 'Best Interest · Consent to Care', created: '10/08/2026',
    sections: [
      { name: 'Decision context', fields: 5 },
      { name: 'Best interests reached', fields: 4 },
    ] },
  { id: 'best-interest-cotsides', name: 'Best Interest Decision Making - Cot Sides', short: 'Best Interest · Cot Sides', created: '28/07/2026',
    sections: [
      { name: 'Decision context', fields: 5 },
      { name: 'Best interests reached', fields: 4 },
    ] },
  { id: 'best-interest-medication', name: 'Best Interest Decision Making - Medication', short: 'Best Interest · Medication', created: '05/07/2026',
    sections: [
      { name: 'Decision context', fields: 5 },
      { name: 'Best interests reached', fields: 4 },
    ] },
  { id: 'communication-chart', name: 'Communication Chart', short: 'Communication Chart', created: '01/05/2026',
    sections: [
      { name: 'Communication preferences', fields: 6 },
      { name: 'Support strategies', fields: 5, target: 4 },
    ] },
  { id: 'waterlow', name: 'Waterlow Score Assessment', short: 'Waterlow Score', created: '01/12/2025',
    sections: [
      { name: 'Risk factors', fields: 8 },
      { name: 'Score & plan', fields: 4 },
    ] },
]

// Which document to surface first, based on where the customer is in the cadence.
const SUGGEST_MAP = { initial: 'careplan', review2: 'careplan', review6: 'confirm-instructions', review6m: 'careplan' }

const templateById = (id) => TEMPLATES.find(t => t.id === id)

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

// "Mon 21 Aug 2026" — the reference recording-card design's date style
// ("Mon 3 Aug") plus a year, since a title (unlike a card sitting in a
// dated list) can persist somewhere without other date context next to it.
// Built from fixed arrays rather than toLocaleDateString so it reads the
// same regardless of the browser's locale (some locales insert a comma —
// "Mon, 21 Aug" — that reference doesn't have).
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const formatTitleDate = (d) => `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`

// Reads ?customer=<id>&templates=<id,id,...> — the deep link a customer's
// own Documents/Assessments picker (mobile/customer-documents) hands off
// to, once the reviewer has chosen which documents this recording is for.
// Parsed once via lazy useState init (not an effect) so a deep-linked visit
// never flashes the Customer/Template steps before jumping to Consent.
function parseDeepLink() {
  const params = new URLSearchParams(window.location.search)
  const customerId = params.get('customer')
  const templateIds = (params.get('templates') || '').split(',').filter(Boolean)
  if (!customerId || templateIds.length === 0) return null
  const customer = CUSTOMERS.find(c => c.id === customerId)
  const templates = templateIds.map(templateById).filter(Boolean)
  if (!customer || templates.length === 0) return null
  return { customer, templates }
}

// Per-section capture at a given progress fraction (0→1), across every
// selected document (usually one, but a recording can cover several — see
// parseDeepLink above). CareBridge fills up to each section's target;
// sections with no target fill completely. A document's own internal
// groups are kept (e.g. the Care & Support Plan's "Hospital passport" /
// "Care plan" / "Assessments"); a flatter document with none falls back to
// its own name as the group, so multiple documents still read as distinct
// sections in the end-of-visit review rather than one undifferentiated list.
const sectionStates = (docs, progress) => docs.flatMap(doc => (doc?.sections || []).map(s => {
  const target = s.target ?? s.fields
  const captured = Math.min(s.fields, Math.round(target * progress))
  return { group: s.group || doc?.short || doc?.name || 'Sections', name: s.name, fields: s.fields, captured, complete: captured >= s.fields }
}))

// Roll section states up into their groups, preserving order.
const groupStates = (states) => {
  const order = []
  const map = {}
  states.forEach(s => {
    if (!map[s.group]) { map[s.group] = { name: s.group, fields: 0, captured: 0, sections: [] }; order.push(s.group) }
    map[s.group].fields += s.fields
    map[s.group].captured += s.captured
    map[s.group].sections.push(s)
  })
  return order.map(g => map[g])
}

const sumFields = (states, key) => states.reduce((n, s) => n + s[key], 0)
const RECORD_RAMP = 24 // seconds to a full first-pass capture (simulated)

// How long the "introduce everyone" prompt holds the record screen's
// subtitle before handing it back to the normal "set the phone aside" line.
// Feedback: transcription can only label speakers by name if someone says
// them out loud, and the moment recording actually starts — not the Consent
// screen, a step earlier and a tap removed from anyone actually talking — is
// when that's still actionable. Keyed off `seconds` itself (not a step
// change or a separate timer) so it naturally never reappears after a
// pause/resume once the session is already under way.
const SPEAKER_INTRO_WINDOW = 8

// Temporarily off — the per-section completion checklist on the "Before
// You Finish" review screen (X of Y sections complete, the field-count
// badges, the grouped section list) is a later-phase feature, not
// necessarily committed to. All the underlying tracking (sectionStates,
// groupStates, the states passed into ReviewScreen) is untouched — this
// only gates what ReviewScreen renders, so flipping it back to true is the
// entire job of restoring it. See memory: carebridge-completion-checklist.
const SHOW_COMPLETION_CHECKLIST = false

// ─── Screen 1: choose customer ───────────────────────────────

function CustomerScreen({ onPick, onBack }) {
  return (
    <div className="cb-screen">
      <StatusBar />
      <AppHeader title="New Assessment" onBack={onBack} />
      <div className="cb-body">
        <div className="menu-section-label">Assessments due</div>
        <div className="cb-list">
          {CUSTOMERS.map(c => (
            <button key={c.id} className="cb-crow" onClick={() => onPick(c)}>
              <img className="cb-avatar" src={c.img} alt="" />
              <div className="cb-crow-main">
                <div className="cb-crow-name">{c.name}</div>
                <div className="cb-crow-sub">{c.dueLabel}</div>
              </div>
              <div className="cb-crow-chev"><ChevronRightIcon /></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Screen 2: choose template (fast, low-tap) ───────────────

function TemplateRow({ t, onPick }) {
  return (
    <button className="cb-trow" onClick={() => onPick(t)}>
      <span className="cb-doc-todo" />
      <div className="cb-trow-main">
        <div className="cb-trow-title">{t.name}</div>
      </div>
      <div className="cb-trow-date">Created Date {t.created}</div>
      <div className="cb-crow-chev"><ChevronRightIcon /></div>
    </button>
  )
}

function TemplateScreen({ customer, onBack, onPick }) {
  const [query, setQuery] = useState('')
  const suggested = customer ? templateById(SUGGEST_MAP[customer.due]) : null

  const q = query.trim().toLowerCase()
  const filtered = q
    ? TEMPLATES.filter(t => t.name.toLowerCase().includes(q))
    : TEMPLATES

  return (
    <div className="cb-screen">
      <StatusBar />
      <AppHeader title="Choose Document" onBack={onBack} />
      {customer && (
        <div className="cb-context-bar">
          <img className="cb-avatar cb-avatar-sm" src={customer.img} alt="" />
          <span className="cb-context-name">{customer.name}</span>
        </div>
      )}
      <div className="cb-body">
        {!q && suggested && (
          <>
            <div className="menu-section-label">Suggested</div>
            <button className="cb-suggested" onClick={() => onPick(suggested)}>
              <div className="cb-suggested-top">
                <CareBridgeIcon size={16} />
                <span className="cb-suggested-tag">Suggested for {customer.name.split(' ')[0]}</span>
              </div>
              <div className="cb-suggested-name">{suggested.name}</div>
              <div className="cb-suggested-desc">Created Date {suggested.created}</div>
            </button>
          </>
        )}

        <div className="cb-search">
          <SearchIcon />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search documents"
          />
        </div>

        <div className="menu-section-label">{q ? 'Results' : 'Assessment documents'}</div>
        <div className="cb-list">
          {filtered.length === 0
            ? <div className="cb-empty">No templates match “{query}”.</div>
            : filtered.map(t => <TemplateRow key={t.id} t={t} onPick={onPick} />)}
        </div>
        <div className="cb-body-pad" />
      </div>
    </div>
  )
}

// ─── Screen 3: consent ───────────────────────────────────────

function ConsentScreen({ customer, template, docsLabel, consent, setConsent, onBack, onStart }) {
  const first = customer?.name.split(' ')[0] || 'the customer'
  const [platform] = usePlatform()
  const [micTest, setMicTest] = useState('idle') // idle | testing | ok
  // Whether the seeded test clip (public/audio-test.m4a — a stand-in for
  // "what was just recorded", since there's no real capture here) is
  // currently playing back, so the reviewer can actually hear the mic
  // worked rather than just being told so.
  const [playingBack, setPlayingBack] = useState(false)
  const audioRef = useRef(null)
  // The screen stays mounted across a template switch (all steps render in a
  // single sliding track), so reset the test whenever a fresh visit begins.
  useEffect(() => {
    setMicTest('idle')
    setPlayingBack(false)
    audioRef.current?.pause()
  }, [template])
  const testMic = () => { setMicTest('testing'); setTimeout(() => setMicTest('ok'), 1400) }
  // Re-runs the test from scratch — stop any playback in progress first, so
  // it can't keep playing under the new "testing" state.
  const retryMicTest = () => {
    audioRef.current?.pause()
    setPlayingBack(false)
    testMic()
  }
  const toggleListenBack = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playingBack) {
      audio.pause()
    } else {
      audio.currentTime = 0
      audio.play()
    }
    setPlayingBack(p => !p)
  }
  return (
    <div className="cb-screen">
      <StatusBar />
      <AppHeader title="Consent to Record" onBack={onBack} />
      <div className="cb-body cb-body-flush">
        <div className="cb-consent-intro">
          With consent, <strong>Assessment Hero</strong> records the conversation and fills
          in the {docsLabel} as you talk — so you can focus on {first}, not paperwork.
        </div>

        <div className="cb-consent-points">
          <div className="cb-cpoint">
            <ShieldIcon />
            <div><div className="cb-cpoint-t">Private &amp; secure</div><div className="cb-cpoint-d">Used only to draft this assessment.</div></div>
          </div>
          <div className="cb-cpoint">
            <StopCircleIcon />
            <div><div className="cb-cpoint-t">Stop any time</div><div className="cb-cpoint-d">{first} can ask to pause or delete the recording.</div></div>
          </div>
          <div className="cb-cpoint">
            <LockIcon />
            <div>
              <div className="cb-cpoint-t">Keeps recording</div>
              {/* iOS sustains this with a Live Activity; Android needs a
                  foreground service, which by design always surfaces an
                  ongoing notification the reviewer can stop it from. Worth
                  saying plainly, since it's what they'll actually see. */}
              <div className="cb-cpoint-d">
                {platform === 'android'
                  ? 'Through screen lock and other apps, with a notification you can stop it from. Works offline.'
                  : 'Through screen lock, backgrounding and calls. Works offline.'}
              </div>
            </div>
          </div>
        </div>

        <div className={`cb-mic-check${micTest === 'ok' ? ' ok' : ''}`}>
          <div className="cb-mic-check-row">
            <div className="cb-mic-check-main">
              <span className="cb-mic-check-icon">{micTest === 'ok' ? <CheckIcon /> : <MicIcon />}</span>
              {micTest === 'idle' ? (
                <div className="cb-mic-check-t">Check your microphone</div>
              ) : (
                // One waveform, not two different bar treatments — it
                // pulses live while actually testing, the same visual
                // language "Listen back" reuses below rather than a
                // separate 5-bar meter. Replaces the "Microphone sounds
                // good" / "Say something…" copy entirely: a live mic level
                // and a playable clip both show their own state better
                // than a caption next to them would.
                <LiveWaveform
                  size="small"
                  playing={micTest === 'testing' || playingBack}
                  label={micTest === 'testing' ? 'Testing microphone' : 'Recording preview'}
                />
              )}
            </div>
            {micTest === 'ok' ? (
              // Retry keeps a text label — a redo glyph alone reads as
              // ambiguous (sync? reload?) in a way play/pause doesn't, and
              // "Test again" matches the idle state's own "Test microphone"
              // verb rather than introducing a second one ("Try"). Play/
              // pause stays icon-only: there's still no ambiguity there,
              // and it's the one place condensing actually matters.
              <div className="cb-mic-check-actions">
                <button className="cb-mic-check-btn cb-mic-retry-btn" onClick={retryMicTest}>
                  <RetryIcon size={13} /> Test again
                </button>
                <button className="cb-mic-icon-btn" onClick={toggleListenBack} aria-label={playingBack ? 'Pause' : 'Listen back'}>
                  {playingBack ? <PauseIcon size={15} /> : <PlayIcon size={15} />}
                </button>
              </div>
            ) : (
              <button className="cb-mic-check-btn" disabled={micTest === 'testing'} onClick={testMic}>
                {micTest === 'testing' ? 'Testing…' : 'Test microphone'}
              </button>
            )}
          </div>
          {/* Stand-in for "what was just recorded" — there's no real
              capture in this prototype, so the test always plays back the
              same seeded clip regardless of what was actually said. */}
          <audio ref={audioRef} src="/audio-test.m4a" onEnded={() => setPlayingBack(false)} />
        </div>

        <button className={`cb-consent-confirm${consent ? ' on' : ''}`} onClick={() => setConsent(c => !c)}>
          <span className="cb-check">{consent && <CheckIcon />}</span>
          <span className="cb-consent-confirm-text">{first} has given verbal consent to be recorded</span>
        </button>

        <div className="cb-consent-audit">A consent record is saved for audit.</div>
      </div>

      <div className="cb-footer">
        <button className="round-btn primary-btn cb-full-btn" disabled={!consent} onClick={onStart}>
          <CareBridgeIcon size={20} /> Start recording
        </button>
      </div>
    </div>
  )
}

// ─── Screen 4: recording — "set it down and ignore it" ───────

function RecordScreen({ customer, template, docsLabel, seconds, states, onEnd, onLock }) {
  const first = customer?.name.split(' ')[0] || 'the customer'
  const [platform] = usePlatform()
  const totalFields = sumFields(states, 'fields')
  const capturedFields = sumFields(states, 'captured')
  const pct = totalFields ? Math.round((capturedFields / totalFields) * 100) : 0
  return (
    <div className="cb-screen cb-screen-record">
      {/* The one screen where the mic is genuinely open, so both platforms'
          OS-level recording indicators apply: Android's green mic chip, and
          iOS's Dynamic Island carrying a compact Live Activity. */}
      <StatusBar recording recordingTime={fmt(seconds)} />
      <AppHeader
        title={docsLabel || 'Recording'}
        right={<button className="app-header-action" onClick={onLock} aria-label="Lock screen"><LockIcon /></button>}
      />
      <div className="cb-record-body">
        <div className="cb-rec-visual">
          <span className="cb-rec-ring" />
          <span className="cb-rec-ring cb-rec-ring-2" />
          <span className="cb-rec-core"><CareBridgeIcon size={30} /></span>
        </div>
        <div className="cb-rec-timer">{fmt(seconds)}</div>
        <LiveWaveform />
        {seconds < SPEAKER_INTRO_WINDOW ? (
          // Its own tinted card rather than the plain caption below — this is
          // the one thing worth actually noticing in the first few seconds
          // (everything else on this screen is "ignore me, keep talking"),
          // so it borrows the mic-check card's card-not-caption treatment to
          // read as a distinct, brief prompt rather than blend into the
          // normal status text it's about to be replaced by.
          <div className="cb-speaker-tip">
            <UsersIcon size={17} />
            <span>Ask everyone in the room to say their name — it helps tell voices apart later.</span>
          </div>
        ) : (
          <div className="cb-rec-sub">Recording {first}’s assessment. You can set the phone aside.</div>
        )}

        {/* Tied to the same per-section completion tracking as the review
            checklist — temporarily off alongside it, see
            SHOW_COMPLETION_CHECKLIST and memory: carebridge-completion-checklist. */}
        {SHOW_COMPLETION_CHECKLIST && (
          <div className="cb-capture">
            <div className="cb-capture-row">
              <span>Filling the {docsLabel}</span>
            </div>
            <div className="cb-capture-bar"><span style={{ width: `${pct}%` }} /></div>
          </div>
        )}

        <button className="cb-rec-note" onClick={onLock}>
          <LockIcon />
          {platform === 'android'
            ? 'Keeps recording in the background — controls stay in your notifications'
            : 'Keeps recording through screen lock and calls — tap to preview'}
        </button>
      </div>
      <div className="cb-footer">
        <button className="round-btn cb-end-btn cb-full-btn" onClick={onEnd}>
          <PauseIcon size={18} /> Pause recording
        </button>
      </div>
    </div>
  )
}

// Simulated lock screen — shows the recording persists discreetly once the
// phone is set down and locked.
//
// This is the one screen where the two platforms genuinely diverge rather
// than just look different. iOS keeps a background recording alive with a
// Live Activity — a frosted, glanceable pill that carries no controls.
// Android requires a foreground service to hold the mic, and the OS
// *mandates* that service post an ongoing notification, conventionally
// with its own actions. So Android gets a real notification card with
// Pause/Stop on it, plus the green mic privacy indicator. Same moment in
// the flow, materially different affordances.
function LockScreen({ customer, seconds, onUnlock }) {
  const [platform] = usePlatform()
  if (platform === 'android') {
    return (
      <div className="cb-lock cb-lock--android" onClick={onUnlock}>
        <div className="cb-lock-android-status">
          <span className="cb-lock-android-mic" title="Microphone in use">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3zm7-3a7 7 0 01-6 6.92V22h-2v-3.08A7 7 0 015 12h2a5 5 0 0010 0h2z"/>
            </svg>
          </span>
        </div>

        <div className="cb-lock-clock cb-lock-clock--android">
          <div className="cb-lock-time">9:41</div>
          <div className="cb-lock-date">Thu, 17 July</div>
        </div>

        {/* Material notification, not a Live Activity — app row, content,
            then the actions the foreground service is required to expose. */}
        <div className="cb-lock-notif" onClick={e => e.stopPropagation()}>
          <div className="cb-lock-notif-app">
            <span className="cb-lock-notif-icon"><CareBridgeIcon size={12} /></span>
            <span className="cb-lock-notif-appname">Assessment Hero</span>
            <span className="cb-lock-notif-sep">•</span>
            <span className="cb-lock-notif-elapsed">{fmt(seconds)}</span>
          </div>
          <div className="cb-lock-notif-title">Recording assessment</div>
          <div className="cb-lock-notif-body">{customer?.name || 'Assessment'}</div>
          <div className="cb-lock-notif-actions">
            <button type="button" className="cb-lock-notif-action">Pause</button>
            <button type="button" className="cb-lock-notif-action">Stop</button>
          </div>
        </div>

        <div className="cb-lock-bottom">
          <div className="cb-lock-hint">Swipe up to unlock</div>
        </div>
      </div>
    )
  }
  return (
    <div className="cb-lock" onClick={onUnlock}>
      <div className="cb-lock-top"><LockIcon /></div>
      <div className="cb-lock-clock">
        <div className="cb-lock-time">9:41</div>
        <div className="cb-lock-date">Thursday 17 July</div>
      </div>
      {/* A Live Activity, not a notification banner — the two are visually
          distinct on iOS and this is genuinely the former (ActivityKit),
          not a system notification that happens to persist. Same anatomy
          every real one has: an attribution row naming both the specific
          thing and the app behind it (an Activity has no icon of its own
          in the tray the way a notification does, so the app still has to
          say who it is), a bold glanceable headline, a muted detail line,
          and — the part every Live Activity is actually built around — a
          bespoke visual specific to what's happening (a delivery app draws
          a route; this one reuses the same waveform "Listen back" and the
          record screen itself use, since that's the real content of a
          recording in a way a generic progress bar wouldn't be). */}
      <div className="cb-lock-activity">
        <div className="cb-lock-activity-row">
          <span className="cb-lock-activity-app">{customer?.name || 'Assessment'}</span>
          <span className="cb-lock-activity-brand"><CareBridgeIcon size={12} /> Assessment Hero</span>
        </div>
        <div className="cb-lock-activity-headline">
          <span className="cb-lock-dot" />
          Recording <span className="cb-lock-activity-timer">{fmt(seconds)}</span>
        </div>
        <div className="cb-lock-activity-sub">Assessment audio · captured in the background</div>
        <LiveWaveform playing label="Recording in progress" />
      </div>
      <div className="cb-lock-bottom">
        <div className="cb-lock-hint">Tap to unlock</div>
        <div className="cb-lock-home" />
      </div>
    </div>
  )
}

// ─── Android: app backgrounded, recording continues ──────────
//
// What Android's system back actually does from the root of a task: it
// moves the app to the background. It does *not* stop the work — the
// foreground service holding the mic keeps running, which is the entire
// reason this flow uses one. So back here isn't a destructive action to
// guard against with a confirm dialog; it's the feature, and showing the
// ongoing notification still ticking is the clearest way to demonstrate
// that. iOS has no equivalent (its back is purely in-app), so this surface
// is Android-only.
function BackgroundedScreen({ customer, seconds, onReturn }) {
  return (
    <div className="cb-bg">
      <div className="cb-bg-status">
        <span className="cb-bg-time">9:41</span>
        <span className="cb-bg-mic" title="Microphone in use">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3zm7-3a7 7 0 01-6 6.92V22h-2v-3.08A7 7 0 015 12h2a5 5 0 0010 0h2z"/>
          </svg>
        </span>
      </div>

      {/* The notification shade, pulled down far enough to show the ongoing
          notification the service posts — same card as the lock screen. */}
      <button type="button" className="cb-lock-notif cb-bg-notif" onClick={onReturn}>
        <div className="cb-lock-notif-app">
          <span className="cb-lock-notif-icon"><CareBridgeIcon size={12} /></span>
          <span className="cb-lock-notif-appname">Assessment Hero</span>
          <span className="cb-lock-notif-sep">•</span>
          <span className="cb-lock-notif-elapsed">{fmt(seconds)}</span>
        </div>
        <div className="cb-lock-notif-title">Recording assessment</div>
        <div className="cb-lock-notif-body">{customer?.name || 'Assessment'}</div>
        <div className="cb-lock-notif-actions">
          <span className="cb-lock-notif-action">Pause</span>
          <span className="cb-lock-notif-action">Stop</span>
        </div>
      </button>

      <div className="cb-bg-hint">
        Still recording in the background.<br />Tap the notification to come back.
      </div>
    </div>
  )
}

// ─── Screen 5: end-of-visit coverage check ───────────────────

function ReviewScreen({ customer, template, seconds, states, title, setTitle, onResume, onFinish, onDelete }) {
  const groups = groupStates(states)
  const totalFields = sumFields(states, 'fields')
  const capturedFields = sumFields(states, 'captured')
  const incomplete = states.filter(s => !s.complete)
  const completeCount = states.length - incomplete.length

  return (
    <div className="cb-screen">
      <StatusBar />
      <AppHeader title="Before You Finish" onBack={onResume} />
      <div className="cb-body">
        <div className="cb-review-summary">
          <div className="cb-review-check"><CareBridgeIcon size={18} /></div>
          <div>
            {SHOW_COMPLETION_CHECKLIST ? (
              <>
                <div className="cb-review-title">{completeCount} of {states.length} sections complete</div>
                <div className="cb-review-sub">Assessment Hero filled {capturedFields} of {totalFields} fields · {fmt(seconds)} recorded</div>
              </>
            ) : (
              <>
                <div className="cb-review-title">Recording paused</div>
                <div className="cb-review-sub">{fmt(seconds)} recorded</div>
              </>
            )}
          </div>
        </div>

        {/* Optional — worth naming now the conversation's actually happened
            (guessing beforehand, on Consent, would just be a worse version
            of the same pre-filled default), and before it's sent off. */}
        <div className="cb-title-field">
          <label htmlFor="cb-recording-title">Recording title <span className="cb-title-optional">(optional)</span></label>
          <input
            id="cb-recording-title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Fall risk discussion"
          />
        </div>

        <div className="cb-check-intro">
          {SHOW_COMPLETION_CHECKLIST
            ? 'Scan for anything left incomplete, then resume the conversation or finish up.'
            : 'Give this recording a title, then resume the conversation or finish up.'}
        </div>

        {SHOW_COMPLETION_CHECKLIST && groups.map(group => (
          <div key={group.name}>
            <div className="menu-section-label">{group.name}</div>
            <div className="cb-sec-list">
              {group.sections.map(s => (
                <div key={s.name} className={`cb-sec-row${s.complete ? '' : ' incomplete'}`}>
                  <span className={`cb-sec-badge${s.complete ? ' done' : ''}`}>
                    {s.complete ? <CheckIcon /> : `${s.captured}/${s.fields}`}
                  </span>
                  <div className="cb-sec-name">{s.name}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="cb-body-pad" />
      </div>

      <div className="cb-footer cb-footer-stack">
        <button className="round-btn secondary-btn cb-full-btn" onClick={onResume}>
          <CareBridgeIcon size={18} /> Resume recording
        </button>
        <button className="round-btn primary-btn cb-full-btn" onClick={onFinish}>
          Finish and Send
        </button>
        {/* A distinct action, not the consent checkbox re-surfaced and
            unticked — see memory: carebridge-delete-recording for why.
            Deliberately quiet relative to the two buttons above: this is
            the rare, destructive path, not a third equally-weighted
            choice. */}
        <button type="button" className="cb-delete-link" onClick={onDelete}>
          Delete recording
        </button>
      </div>
    </div>
  )
}

// ─── App ─────────────────────────────────────────────────────

const STEPS = ['customer', 'template', 'consent', 'record', 'review']

export default function App() {
  // Computed once — a deep link from customer-documents' "Record with
  // CareBridge" picker (?customer=&templates=) preselects the customer and
  // every chosen document and jumps straight to Consent, skipping the
  // Customer/Template steps that only exist to make those two choices.
  const [deepLink] = useState(parseDeepLink)
  const [step, setStep] = useState(() => deepLink ? 'consent' : 'customer')
  const [customer, setCustomer] = useState(() => deepLink?.customer ?? null)
  const [template, setTemplate] = useState(() => deepLink?.templates[0] ?? null)
  // Any documents selected beyond the primary `template` — same recording,
  // drafting several documents from the one conversation (how CareBridge
  // really works; the picker upstream allows multi-select for this reason).
  const [extraTemplates, setExtraTemplates] = useState(() => deepLink?.templates.slice(1) ?? [])
  const [consent, setConsent] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [locked, setLocked] = useState(false)
  // Android only: the app moved to the background but the foreground
  // service is still recording. Deliberately not a step change — the
  // record clock keys off `step`, so leaving it on 'record' is what keeps
  // the timer running underneath, which is the whole point.
  const [backgrounded, setBackgrounded] = useState(false)
  // Confirming a delete, requested from the paused/review screen — see
  // memory: carebridge-delete-recording for why this is its own button
  // rather than the consent checkbox re-surfaced and unticked. This one
  // needs a Cancel path back to Review rather than always resolving forward.
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [entering] = useState(() =>
    new URLSearchParams(window.location.search).get('transition') === '1'
  )

  // Recording clock runs only while on the record step (resumes where it left off).
  useEffect(() => {
    if (step !== 'record') return
    const id = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [step])

  // CareBridge fills every selected document automatically as the
  // conversation flows.
  const allTemplates = [template, ...extraTemplates].filter(Boolean)
  const recStates = sectionStates(allTemplates, Math.min(1, seconds / RECORD_RAMP))
  const finalStates = sectionStates(allTemplates, 1)
  const idx = STEPS.indexOf(step)
  // What to call "the document(s)" in copy across Consent/Record/the finish
  // overlay — the primary template's short name, plus a count when more
  // than one was selected.
  const docsLabel = allTemplates.length > 1
    ? `${template?.short || template?.name} +${allTemplates.length - 1} more`
    : (template?.short || template?.name)

  // Optional recording title — editable on the review screen, once there's
  // an actual conversation to name (guessing beforehand, on Consent, would
  // just be a worse version of this same default). Pre-filled the first
  // time review is reached so most visits need zero taps; once the
  // reviewer has typed their own, resuming to record more and coming back
  // to review again won't stomp it.
  //
  // A single document names itself fine ("Arthur's Consent to Care"), but
  // docsLabel's "+1 more" is UI chrome, not something you'd want inside an
  // actual title — so once more than one is selected, fall back to
  // "Recording with Arthur" rather than trying to cram every document name
  // in. Deliberately not "Arthur's Visit" — Visit is already a real, fairly
  // loaded concept elsewhere in the platform (a scheduled visit record with
  // its own cadence/duration), so a recording titled that way would read
  // like it *is* one of those rather than a CareBridge session that
  // happened to occur during one. Also deliberately not the customer's
  // dueLabel (e.g. "Initial assessment due") — that's a fixed property of
  // the customer, not of what was actually picked in this recording, so
  // it'd claim something we don't actually know (a demo customer's
  // dueLabel could read "Initial assessment" while the reviewer selected
  // two Other Documents with nothing to do with an assessment).
  //
  // Both cases get a date suffix — even a single specific document name
  // would otherwise collide with a second recording of the same document
  // on a different day.
  const [title, setTitle] = useState('')
  useEffect(() => {
    if (step === 'review' && !title && customer) {
      const first = customer.name.split(' ')[0]
      const what = allTemplates.length > 1 ? `Recording with ${first}` : `${first}’s ${docsLabel}`
      setTitle(`${what} – ${formatTitleDate(new Date())}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // Where every exit from this flow (backing out via Customer's header
  // arrow, or finishing via the "Done" overlay button) lands — a
  // deep-linked visit came from customer-documents' own "Record and Draft
  // with CareBridge" banner, so it should return there rather than to
  // Account, which has no relation to how this recording began.
  const entryPointHref = deepLink ? '../customer-documents/' : '../account/'

  const pickCustomer = (c) => { setCustomer(c); setTemplate(null); setExtraTemplates([]); setConsent(false); setSeconds(0); setTitle(''); setStep('template') }
  const pickTemplate = (t) => { setTemplate(t); setExtraTemplates([]); setConsent(false); setSeconds(0); setTitle(''); setStep('consent') }
  // No blocking "uploading" modal — the app can't rely on a user staying put
  // for one, especially on a poor connection. Write the recording as queued
  // and leave immediately; the Recordings list on the far end is the
  // confirmation. See memory: project_carebridge_mobile.
  const finish = () => {
    addRecording(customer?.id || 'arthur', { title: title || docsLabel })
    window.location.href = deepLink ? `${entryPointHref}?showRecordings=1` : entryPointHref
  }

  // Android's system back exists on every screen whether or not the app
  // draws its own affordance. Transient surfaces register as back layers so
  // they're dismissed one press at a time; the step machine below is the
  // fallback for when there's nothing overlaid.
  useBackHandler(backgrounded, () => {})         // already at the home screen
  useBackHandler(locked, () => setLocked(false))

  const systemBack = () => handleSystemBack(() => {
    if (step === 'review') { setStep('record'); return }
    // NOT "stop and go to review": back from the root of a task backgrounds
    // the app, and the foreground service keeps the mic open. Stopping the
    // recording here would contradict the capability this whole flow is
    // built to demonstrate.
    if (step === 'record') { setBackgrounded(true); return }
    if (step === 'consent') {
      if (deepLink) { window.location.href = entryPointHref } else { setStep('template') }
      return
    }
    if (step === 'template') { setStep('customer'); return }
    window.location.href = entryPointHref
  })

  return (
    <>
      <a href="/" className="back-link"><ChevronLeftIcon size={16} /> Prototypes</a>
      <PhoneFrame onSystemBack={systemBack}>
        <div className={`screen-area page-slide ${entering ? 'slide-entering' : ''}`}>
          <div className="cb-track" style={{ width: `${STEPS.length * 100}%`, transform: `translateX(-${idx * (100 / STEPS.length)}%)` }}>
            <div className="cb-track-item" style={{ width: `${100 / STEPS.length}%` }}>
              <CustomerScreen onPick={pickCustomer} onBack={() => { window.location.href = entryPointHref }} />
            </div>
            <div className="cb-track-item" style={{ width: `${100 / STEPS.length}%` }}>
              <TemplateScreen customer={customer} onBack={() => setStep('customer')} onPick={pickTemplate} />
            </div>
            <div className="cb-track-item" style={{ width: `${100 / STEPS.length}%` }}>
              <ConsentScreen
                customer={customer} template={template} docsLabel={docsLabel}
                consent={consent} setConsent={setConsent}
                // A deep-linked visit never went through Customer/Template
                // (those steps only exist to make the choices the picker
                // upstream already made) — so backing out of Consent should
                // exit straight to the entry point, not reveal them.
                onBack={() => { if (deepLink) { window.location.href = entryPointHref } else { setStep('template') } }}
                onStart={() => setStep('record')}
              />
            </div>
            <div className="cb-track-item" style={{ width: `${100 / STEPS.length}%` }}>
              <RecordScreen customer={customer} template={template} docsLabel={docsLabel} seconds={seconds} states={recStates} onEnd={() => { setLocked(false); setStep('review') }} onLock={() => setLocked(true)} />
            </div>
            <div className="cb-track-item" style={{ width: `${100 / STEPS.length}%` }}>
              <ReviewScreen customer={customer} template={template} seconds={seconds} states={finalStates} title={title} setTitle={setTitle} onResume={() => setStep('record')} onFinish={finish} onDelete={() => setConfirmingDelete(true)} />
            </div>
          </div>

          {locked && step === 'record' && (
            <LockScreen customer={customer} seconds={seconds} onUnlock={() => setLocked(false)} />
          )}

          {backgrounded && step === 'record' && (
            <BackgroundedScreen customer={customer} seconds={seconds} onReturn={() => setBackgrounded(false)} />
          )}

          {confirmingDelete && (
            <div className="cb-overlay">
              <div className="cb-overlay-card">
                <div className="cb-overlay-title">Delete this recording?</div>
                <div className="cb-overlay-text">
                  This can't be undone. Nothing will be sent to PASS.
                </div>
                {/* Same iOS-stacked / Android-text-row pattern as the finish
                    overlay's own .cb-overlay-actions, just with two actions
                    instead of one. Delete is deliberately not the button in
                    the "primary" position either platform's eye lands on
                    first (bottom of an iOS stack, trailing on an Android
                    row) — Cancel is. */}
                <div className="cb-overlay-actions">
                  <button
                    type="button"
                    className="round-btn secondary-btn cb-full-btn"
                    onClick={() => setConfirmingDelete(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="round-btn cb-full-btn cb-delete-confirm-btn"
                    onClick={() => { window.location.href = entryPointHref }}
                  >
                    Delete recording
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PhoneFrame>
    </>
  )
}
