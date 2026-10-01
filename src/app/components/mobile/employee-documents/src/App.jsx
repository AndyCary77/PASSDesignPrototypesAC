import { useState } from 'react'
import StatusBar from '../../assets/StatusBar'
import PhoneFrame from '../../assets/PhoneFrame'
import { handleSystemBack } from '../../assets/backStack'
import AssessmentHeroIcon from '../../assets/AssessmentHeroIcon'
// Same photo as the Employees list's own David Buckowski.
import davidImg from '../../assets/img/Employee=David Buckowski.jpg'

const PlusIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
)

const ChevronLeftIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
  </svg>
)

const ArrowLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.71969 12.6255L4.73999 12.6499C4.74414 12.6548 4.74834 12.6596 4.75259 12.6644L9.75259 18.2894C10.1195 18.7022 10.7516 18.7393 11.1644 18.3724C11.5771 18.0055 11.6143 17.3734 11.2474 16.9606L7.727 13L18.5 13C19.0523 13 19.5 12.5523 19.5 12C19.5 11.4477 19.0523 11 18.5 11L7.727 11L11.2474 7.03937C11.5861 6.65834 11.5805 6.09046 11.2529 5.71676L11.1644 5.6276C10.7516 5.26068 10.1195 5.29786 9.75259 5.71065L4.75259 11.3356L4.7402 11.3498C4.73323 11.358 4.72639 11.3662 4.71969 11.3746L4.75259 11.3356C4.72265 11.3693 4.69538 11.4045 4.67076 11.441C4.65284 11.4675 4.63629 11.4947 4.62104 11.5227C4.60922 11.5452 4.59534 11.5722 4.5711 11.629C4.56169 11.6537 4.52179 11.7614 4.5 12C4.5 12.1218 4.52179 12.2386 4.56167 12.3465C4.5711 12.3998 4.59534 12.4278 4.62098 12.4771C4.63629 12.5053 4.65284 12.5325 4.67061 12.5589L4.71969 12.6255Z"/>
  </svg>
)

const PhoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
  </svg>
)

const MessageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
  </svg>
)

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6C22 4.9 21.1 4 20 4ZM19 18H5C4.45 18 4 17.55 4 17V8L10.94 12.34C11.59 12.75 12.41 12.75 13.06 12.34L20 8V17C20 17.55 19.55 18 19 18ZM12 11L4 6H20L12 11Z"/>
  </svg>
)

// Copied verbatim from mobile/customer-documents' own icon set, for visual
// parity between the two "documents" screens.
const DocumentIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="-5.07 -3 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M8.10373 0C8.60602 0 9.08992 0.189001 9.45925 0.529434L13.22 3.99599C13.6308 4.37464 13.8645 4.90786 13.8645 5.46655V14.6896C13.8645 16.5169 12.3773 17.9986 10.5417 18H3.32534C1.48881 18 0 16.5179 0 14.6896V3.31042C0 1.48212 1.48881 0 3.32534 0H8.10373ZM7.94685 1.98153H3.41796C2.58954 1.98153 1.91796 2.6531 1.91796 3.48153V14.5127C1.91796 15.3411 2.58954 16.0127 3.41796 16.0127H10.4075C11.2359 16.0127 11.9075 15.3411 11.9075 14.5127V6.06202H9.73742C8.74852 6.06202 7.94685 5.26395 7.94685 4.27948V1.98153ZM6.88131 10.5C7.43359 10.5 7.88131 10.9477 7.88131 11.5C7.88131 12.0523 7.43359 12.5 6.88131 12.5H3.88131C3.32902 12.5 2.88131 12.0523 2.88131 11.5C2.88131 10.9477 3.32902 10.5 3.88131 10.5H6.88131ZM9.88131 7.5C10.4336 7.5 10.8813 7.94772 10.8813 8.5C10.8813 9.05228 10.4336 9.5 9.88131 9.5H3.88131C3.32902 9.5 2.88131 9.05228 2.88131 8.5C2.88131 7.94772 3.32902 7.5 3.88131 7.5H9.88131Z"/>
  </svg>
)
const DocumentCompleteIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill="#21A621" stroke="#21A621" strokeWidth="2" />
    <path d="M8 12.1732L10.6095 15L16 9" stroke="white" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// The one employee with a working mobile documents screen today (see
// mobile/employees' own CUSTOMERS/EMPLOYEES honest-gap comments) — fixed
// data, same pattern as mobile/customer-documents being Arthur-only.
const DAVID = { name: 'David Buckowski', role: 'Careworker', img: davidImg }

const DOCUMENTS = [
  { id: 'induction', title: 'Induction', sub: 'Completed 15/03/2025' },
  { id: 'supervision-q1', title: 'Supervision', sub: 'Q1 2026' },
  { id: 'supervision-q3', title: 'Supervision', sub: 'Q3 2026' },
]

function AssessmentHeroBanner() {
  return (
    <div className="docs-cb-banner">
      <div className="docs-cb-banner-top">
        <span className="docs-cb-banner-icon"><AssessmentHeroIcon size={18} /></span>
        <div className="docs-cb-banner-body">
          <p className="docs-cb-banner-title">Record and Draft with Assessment Hero</p>
        </div>
      </div>
      <div className="docs-cb-banner-cta-row">
        {/* No employee recording flow exists yet (CareBridge's customer
            picker has no concept of an employee) — same honest gap as the
            rest of this screen, not wired to anything. */}
        <button className="docs-cb-banner-cta">Select documents</button>
      </div>
    </div>
  )
}

export default function App() {
  // Plays a slide-in-from-right entrance only when arriving from a tap on
  // the Employees list (which links here with ?transition=1).
  const [entering] = useState(() =>
    new URLSearchParams(window.location.search).get('transition') === '1'
  )
  const systemBack = () => handleSystemBack(() => { window.location.href = '../employees/?transition=back' })

  return (
    <>
      <a href="/" className="back-link"><ChevronLeftIcon size={16} /> Prototypes</a>
      <PhoneFrame onSystemBack={systemBack}>
        <div className={`screen-area page-slide${entering ? ' slide-entering' : ''}`}>
          <div className="screen">
            <StatusBar />
            <div className="app-header">
              <a className="app-header-back" href="../employees/?transition=back"><ArrowLeftIcon /></a>
              <span className="app-header-title">Documents</span>
              <div style={{ width: 36 }} />
            </div>

            <div className="empdoc-body">
              <div className="empdoc-profile-card">
                <div className="empdoc-avatar"><img src={DAVID.img} alt="" /></div>
                <div className="empdoc-profile-info">
                  <div className="empdoc-name">{DAVID.name}</div>
                  <span className="empdoc-role-badge">{DAVID.role}</span>
                  <div className="empdoc-contact-row">
                    <button className="empdoc-contact-btn"><PhoneIcon /></button>
                    <button className="empdoc-contact-btn"><MessageIcon /></button>
                    <button className="empdoc-contact-btn"><MailIcon /></button>
                  </div>
                </div>
              </div>

              <AssessmentHeroBanner />

              <div className="empdoc-section-label">Documents</div>
              <div className="empdoc-doc-list">
                {DOCUMENTS.map(doc => (
                  <div key={doc.id} className="docs-doc-row">
                    <span className="docs-doc-row-icon"><DocumentIcon size={22} /></span>
                    <span className="docs-doc-row-body">
                      <div className="docs-doc-row-title">{doc.title}</div>
                      <div className="docs-doc-row-sub">{doc.sub}</div>
                    </span>
                    <span className="docs-doc-row-status"><DocumentCompleteIcon /></span>
                  </div>
                ))}
              </div>
              <div className="empdoc-body-pad" />
            </div>

            <div className="docs-fab-wrap">
              {/* Decorative, like the rest of this screen — no add-document
                  flow exists for employees yet. */}
              <button className="docs-fab"><PlusIcon size={18} /> Add document</button>
            </div>
          </div>
        </div>
      </PhoneFrame>
    </>
  )
}
