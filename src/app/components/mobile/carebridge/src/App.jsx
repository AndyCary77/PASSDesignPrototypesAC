import { useState, useEffect } from 'react'
import PhoneFrame from '../../assets/PhoneFrame'
import StatusBar from '../../assets/StatusBar'
import AppHeader from '../../assets/AppHeader'
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
const MicIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
  </svg>
)
const StopIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2"/>
  </svg>
)
const SparkleIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 2zm7 12l.95 2.55L22.5 17.5l-2.55.95L19 21l-.95-2.55L15.5 17.5l2.55-.95L19 14z"/>
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
]

// Which document to surface first, based on where the customer is in the cadence.
const SUGGEST_MAP = { initial: 'careplan', review2: 'careplan', review6: 'confirm-instructions', review6m: 'careplan' }

const templateById = (id) => TEMPLATES.find(t => t.id === id)

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

// Per-section capture at a given progress fraction (0→1). CareBridge fills up
// to each section's target; sections with no target fill completely.
const sectionStates = (doc, progress) => (doc?.sections || []).map(s => {
  const target = s.target ?? s.fields
  const captured = Math.min(s.fields, Math.round(target * progress))
  return { group: s.group || 'Sections', name: s.name, fields: s.fields, captured, complete: captured >= s.fields }
})

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

// ─── Screen 1: choose customer ───────────────────────────────

function CustomerScreen({ onPick }) {
  return (
    <div className="cb-screen">
      <StatusBar />
      <AppHeader title="New Assessment" onBack={() => { window.location.href = '../account/' }} />
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
                <SparkleIcon size={16} />
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

function ConsentScreen({ customer, template, consent, setConsent, share, setShare, onBack, onStart }) {
  const first = customer?.name.split(' ')[0] || 'the customer'
  return (
    <div className="cb-screen">
      <StatusBar />
      <AppHeader title="Consent to Record" onBack={onBack} />
      <div className="cb-body cb-body-flush">
        <div className="cb-consent-intro">
          With consent, <strong>CareBridge</strong> records the conversation and fills
          in the {template?.short || template?.name} as you talk — so you can focus on {first}, not paperwork.
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
            <div><div className="cb-cpoint-t">Keeps recording</div><div className="cb-cpoint-d">Through screen lock, backgrounding and calls. Works offline.</div></div>
          </div>
        </div>

        <button className={`cb-consent-confirm${consent ? ' on' : ''}`} onClick={() => setConsent(c => !c)}>
          <span className="cb-check">{consent && <CheckIcon />}</span>
          <span className="cb-consent-confirm-text">{first} has given verbal consent to be recorded</span>
        </button>

        <div className="cb-share-row">
          <span className="cb-share-label">Share a copy of the recording with {first}</span>
          <button className={`tog${share ? ' tog-on' : ''}`} onClick={() => setShare(s => !s)} aria-label="Share recording">
            <span className="tog-thumb" />
          </button>
        </div>

        <div className="cb-consent-audit">A consent record is saved for audit.</div>
      </div>

      <div className="cb-footer">
        <button className="round-btn primary-btn cb-full-btn" disabled={!consent} onClick={onStart}>
          <MicIcon size={20} /> Start recording
        </button>
      </div>
    </div>
  )
}

// ─── Screen 4: recording — "set it down and ignore it" ───────

function RecordScreen({ customer, template, seconds, states, onEnd, onLock }) {
  const first = customer?.name.split(' ')[0] || 'the customer'
  const totalFields = sumFields(states, 'fields')
  const capturedFields = sumFields(states, 'captured')
  const pct = totalFields ? Math.round((capturedFields / totalFields) * 100) : 0
  const groups = groupStates(states)
  return (
    <div className="cb-screen cb-screen-record">
      <StatusBar />
      <AppHeader
        title={template?.short || template?.name || 'Recording'}
        right={<button className="app-header-action" onClick={onLock} aria-label="Lock screen"><LockIcon /></button>}
      />
      <div className="cb-record-body">
        <div className="cb-rec-visual">
          <span className="cb-rec-ring" />
          <span className="cb-rec-ring cb-rec-ring-2" />
          <span className="cb-rec-core"><MicIcon size={30} /></span>
        </div>
        <div className="cb-rec-timer">{fmt(seconds)}</div>
        <div className="cb-magic-chip"><SparkleIcon size={14} /> CareBridge is listening</div>
        <div className="cb-rec-sub">Recording {first}’s assessment. You can set the phone aside.</div>

        <div className="cb-capture">
          <div className="cb-capture-row">
            <span>Filling the {template?.short}</span>
            <span className="cb-capture-count">{capturedFields} of {totalFields} fields</span>
          </div>
          <div className="cb-capture-bar"><span style={{ width: `${pct}%` }} /></div>

          {groups.length > 1 && (
            <div className="cb-group-list">
              {groups.map(g => (
                <div key={g.name} className="cb-group-row">
                  <div className="cb-group-head">
                    <span className="cb-group-name">{g.name}</span>
                    <span className="cb-group-count">{g.captured}/{g.fields}</span>
                  </div>
                  <div className="cb-group-bar"><span style={{ width: `${g.fields ? Math.round((g.captured / g.fields) * 100) : 0}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="cb-rec-note" onClick={onLock}>
          <LockIcon />
          Keeps recording through screen lock and calls — tap to preview
        </button>
      </div>
      <div className="cb-footer">
        <button className="round-btn cb-end-btn cb-full-btn" onClick={onEnd}>
          <StopIcon size={18} /> End assessment
        </button>
      </div>
    </div>
  )
}

// Simulated iOS lock screen — shows recording persists discreetly when the
// phone is set down and locked (tap anywhere to unlock).
function LockScreen({ customer, seconds, onUnlock }) {
  return (
    <div className="cb-lock" onClick={onUnlock}>
      <div className="cb-lock-top"><LockIcon /></div>
      <div className="cb-lock-clock">
        <div className="cb-lock-time">9:41</div>
        <div className="cb-lock-date">Thursday 17 July</div>
      </div>
      <div className="cb-lock-activity">
        <span className="cb-lock-dot" />
        <div className="cb-lock-activity-main">
          <div className="cb-lock-activity-title">CareBridge · Recording</div>
          <div className="cb-lock-activity-sub">{customer?.name || 'Assessment'}</div>
        </div>
        <div className="cb-lock-activity-timer">{fmt(seconds)}</div>
      </div>
      <div className="cb-lock-bottom">
        <div className="cb-lock-hint">Tap to unlock</div>
        <div className="cb-lock-home" />
      </div>
    </div>
  )
}

// ─── Screen 5: end-of-visit coverage check ───────────────────

function ReviewScreen({ customer, template, seconds, states, triage, setTriage, onResume, onFinish }) {
  const first = customer?.name.split(' ')[0] || 'the customer'
  const groups = groupStates(states)
  const totalFields = sumFields(states, 'fields')
  const capturedFields = sumFields(states, 'captured')
  const incomplete = states.filter(s => !s.complete)
  const completeCount = states.length - incomplete.length
  const askNow = incomplete.filter(s => triage[s.name] === 'ask')
  const setItem = (name, val) => setTriage(t => ({ ...t, [name]: t[name] === val ? undefined : val }))

  return (
    <div className="cb-screen">
      <StatusBar />
      <AppHeader title="Before You Finish" onBack={onResume} />
      <div className="cb-body">
        <div className="cb-review-summary">
          <div className="cb-review-check"><SparkleIcon size={18} /></div>
          <div>
            <div className="cb-review-title">{completeCount} of {states.length} sections complete</div>
            <div className="cb-review-sub">CareBridge filled {capturedFields} of {totalFields} fields · {fmt(seconds)} recorded</div>
          </div>
        </div>

        <div className="cb-check-intro">Complete sections are ready to write up. For anything part-filled, ask {first} now or follow up later.</div>

        {groups.map(group => (
          <div key={group.name}>
            <div className="menu-section-label">{group.name}</div>
            <div className="cb-sec-list">
              {group.sections.map(s => (
                <div key={s.name} className={`cb-sec-row${s.complete ? '' : ' incomplete'}`}>
                  <span className={`cb-sec-badge${s.complete ? ' done' : ''}`}>
                    {s.complete ? <CheckIcon /> : `${s.captured}/${s.fields}`}
                  </span>
                  <div className="cb-sec-main">
                    <div className="cb-sec-name">{s.name}</div>
                    {!s.complete && (
                      <div className="cb-triage">
                        <button className={`cb-triage-btn${triage[s.name] === 'ask' ? ' ask' : ''}`} onClick={() => setItem(s.name, 'ask')}>Ask now</button>
                        <button className={`cb-triage-btn${triage[s.name] === 'later' ? ' later' : ''}`} onClick={() => setItem(s.name, 'later')}>Follow up</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="cb-body-pad" />
      </div>

      <div className="cb-footer cb-footer-stack">
        {askNow.length > 0 && (
          <button className="round-btn secondary-btn cb-full-btn" onClick={onResume}>
            <MicIcon size={18} /> Resume to ask {askNow.length} {askNow.length === 1 ? 'section' : 'sections'}
          </button>
        )}
        <button className="round-btn primary-btn cb-full-btn" onClick={onFinish}>
          Finish &amp; write up in PASS
        </button>
      </div>
    </div>
  )
}

// ─── App ─────────────────────────────────────────────────────

const STEPS = ['customer', 'template', 'consent', 'record', 'review']

export default function App() {
  const [step, setStep] = useState('customer')
  const [customer, setCustomer] = useState(null)
  const [template, setTemplate] = useState(null)
  const [consent, setConsent] = useState(false)
  const [share, setShare] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [triage, setTriage] = useState({})
  const [locked, setLocked] = useState(false)
  const [overlay, setOverlay] = useState(null) // null | 'uploading' | 'done'
  const [entering] = useState(() =>
    new URLSearchParams(window.location.search).get('transition') === '1'
  )

  // Recording clock runs only while on the record step (resumes where it left off).
  useEffect(() => {
    if (step !== 'record') return
    const id = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [step])

  // CareBridge fills the document automatically as the conversation flows.
  const recStates = sectionStates(template, Math.min(1, seconds / RECORD_RAMP))
  const finalStates = sectionStates(template, 1)
  const idx = STEPS.indexOf(step)
  const followUps = finalStates.filter(s => !s.complete && triage[s.name] === 'later').length

  const pickCustomer = (c) => { setCustomer(c); setTemplate(null); setConsent(false); setShare(false); setSeconds(0); setTriage({}); setStep('template') }
  const pickTemplate = (t) => { setTemplate(t); setConsent(false); setShare(false); setSeconds(0); setTriage({}); setStep('consent') }
  const finish = () => { setOverlay('uploading'); setTimeout(() => setOverlay('done'), 1700) }

  return (
    <>
      <a href="/" className="back-link"><ChevronLeftIcon size={16} /> Prototypes</a>
      <PhoneFrame>
        <div className={`screen-area page-slide ${entering ? 'slide-entering' : ''}`}>
          <div className="cb-track" style={{ width: `${STEPS.length * 100}%`, transform: `translateX(-${idx * (100 / STEPS.length)}%)` }}>
            <div className="cb-track-item" style={{ width: `${100 / STEPS.length}%` }}>
              <CustomerScreen onPick={pickCustomer} />
            </div>
            <div className="cb-track-item" style={{ width: `${100 / STEPS.length}%` }}>
              <TemplateScreen customer={customer} onBack={() => setStep('customer')} onPick={pickTemplate} />
            </div>
            <div className="cb-track-item" style={{ width: `${100 / STEPS.length}%` }}>
              <ConsentScreen
                customer={customer} template={template}
                consent={consent} setConsent={setConsent} share={share} setShare={setShare}
                onBack={() => setStep('template')} onStart={() => setStep('record')}
              />
            </div>
            <div className="cb-track-item" style={{ width: `${100 / STEPS.length}%` }}>
              <RecordScreen customer={customer} template={template} seconds={seconds} states={recStates} onEnd={() => { setLocked(false); setStep('review') }} onLock={() => setLocked(true)} />
            </div>
            <div className="cb-track-item" style={{ width: `${100 / STEPS.length}%` }}>
              <ReviewScreen customer={customer} template={template} seconds={seconds} states={finalStates} triage={triage} setTriage={setTriage} onResume={() => setStep('record')} onFinish={finish} />
            </div>
          </div>

          {locked && step === 'record' && (
            <LockScreen customer={customer} seconds={seconds} onUnlock={() => setLocked(false)} />
          )}

          {overlay && (
            <div className="cb-overlay">
              <div className="cb-overlay-card">
                {overlay === 'uploading' && (
                  <>
                    <div className="cb-spinner" />
                    <div className="cb-overlay-title">Uploading recording…</div>
                    <div className="cb-overlay-text">Sending {customer?.name.split(' ')[0]}’s assessment to PASS.</div>
                  </>
                )}
                {overlay === 'done' && (
                  <>
                    <div className="cb-success-icon"><CheckIcon /></div>
                    <div className="cb-overlay-title">Sent to PASS</div>
                    <div className="cb-overlay-text">
                      CareBridge has drafted {customer?.name.split(' ')[0]}’s {template?.short || template?.name}.
                      Write up the care plan, risk assessments and templates in PASS.
                      {followUps > 0 && ` ${followUps} item${followUps === 1 ? '' : 's'} flagged to follow up.`}
                    </div>
                    <button className="round-btn primary-btn cb-full-btn" onClick={() => { window.location.href = '../account/' }}>
                      Done
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </PhoneFrame>
    </>
  )
}
