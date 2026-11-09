import { useState } from 'react'
import StatusBar from '../../assets/StatusBar'
import PhoneFrame from '../../assets/PhoneFrame'
import { handleSystemBack } from '../../assets/backStack'
// The same customer record as mobile/customer-documents' profile header, so the
// two screens show the same person (name, address, DOB, photo, flags).
import { CUSTOMER } from '../../customer-documents/src/customerDocumentsData'
import {
  VisitsIcon, MarChartIcon, AboutMeIcon, DetailsIcon, CarePackageIcon, CommunicationIcon,
  DocumentsIcon, MedicalHistoryIcon, OpenPassIcon, ReasonableAdjustmentsIcon,
  AllergiesIcon, DnacprIcon, DolsIcon, FlagChipIcon,
} from './menuIcons'

const ChevronLeftIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
  </svg>
)

const ArrowLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.72 11.37L4.75 11.34C4.72 11.37 4.70 11.40 4.67 11.44C4.65 11.47 4.64 11.49 4.62 11.52C4.61 11.54 4.60 11.57 4.57 11.63C4.56 11.65 4.52 11.76 4.5 12C4.5 12.12 4.52 12.24 4.56 12.35C4.57 12.40 4.60 12.43 4.62 12.48C4.64 12.51 4.65 12.53 4.67 12.56L4.72 12.63L4.74 12.65L9.75 18.29C10.12 18.70 10.75 18.74 11.16 18.37C11.58 18.01 11.61 17.37 11.25 16.96L7.73 13H18.5C19.05 13 19.5 12.55 19.5 12C19.5 11.45 19.05 11 18.5 11H7.73L11.25 7.04C11.59 6.66 11.58 6.09 11.25 5.72L11.16 5.63C10.75 5.26 10.12 5.30 9.75 5.71L4.75 11.34L4.74 11.35C4.73 11.36 4.73 11.37 4.72 11.37Z"/>
  </svg>
)

const KeyIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
  </svg>
)

const CHIP_ICONS = { allergies: AllergiesIcon, dnacpr: DnacprIcon, dols: DolsIcon }

// Documents and Reasonable adjustments lead somewhere (mobile/customer-documents,
// mobile/customer-adjustments); the other sections have no mobile screen in this
// prototype, so their tiles are display-only — an honest gap, same as the
// non-tappable rows on the Customers list. Reasonable adjustments is new (AIOP-25290).
const TILES = [
  { id: 'visits',   label: 'Visits',    Icon: VisitsIcon,    bg: '#fbf1dd', fg: '#e5a43a' },
  { id: 'mar',      label: 'MAR Chart', Icon: MarChartIcon,  bg: '#faeae9', fg: '#e57373' },
  { id: 'about',    label: 'About me',  Icon: AboutMeIcon,   bg: '#eff2e5', fg: '#98aa58' },
  { id: 'details',  label: 'Details',   Icon: DetailsIcon,   bg: '#eae8ee', fg: '#6f6593' },
  { id: 'care',     label: 'Care package',  Icon: CarePackageIcon,  bg: '#e4f2fa', fg: '#59a8df' },
  { id: 'comms',    label: 'Communication', Icon: CommunicationIcon, bg: '#f4ebe7', fg: '#b97f5b' },
  { id: 'docs',     label: 'Documents', Icon: DocumentsIcon, bg: '#e6f5f0', fg: '#6abd9a', href: '../customer-documents/?transition=1' },
  { id: 'medical',  label: 'Medical history', Icon: MedicalHistoryIcon, bg: '#f1eaf6', fg: '#a87bc6' },
  { id: 'openpass', label: 'OpenPASS',  Icon: OpenPassIcon,  bg: '#d2d8ed', fg: '#3d57a6' },
  { id: 'ra',       label: 'Reasonable adjustments', Icon: ReasonableAdjustmentsIcon, bg: '#fbe4f0', fg: '#c4488c', href: '../customer-adjustments/?transition=1' },
]

function Tile({ tile }) {
  const Tag = tile.href ? 'a' : 'div'
  return (
    <Tag
      className={`cm-tile${tile.href ? ' cm-tile-tap' : ''}`}
      href={tile.href}
      style={{ '--tile-bg': tile.bg, '--tile-fg': tile.fg }}
    >
      <tile.Icon />
      <span className="cm-tile-label">{tile.label}</span>
    </Tag>
  )
}

export default function App() {
  // Slides in from the right arriving from the Customers list, and from the
  // left coming back from Documents.
  const [transition] = useState(() => new URLSearchParams(window.location.search).get('transition'))
  const entering = transition === '1'
  const enteringBack = transition === 'back'
  const systemBack = () => handleSystemBack(() => { window.location.href = '../customers/?transition=back' })

  return (
    <>
      <a href="/" className="back-link"><ChevronLeftIcon size={16} /> Prototypes</a>
      <PhoneFrame onSystemBack={systemBack}>
        <div className={`screen-area page-slide${entering ? ' slide-entering' : ''}${enteringBack ? ' slide-entering-left' : ''}`}>
          <div className="screen cm-screen">
            <StatusBar />
            <div className="app-header">
              <a className="app-header-back" href="../customers/?transition=back"><ArrowLeftIcon /></a>
              <span className="app-header-title">All customers</span>
              <div style={{ width: 36 }} />
            </div>

            <div className="cm-customer-card">
              <h1 className="cm-customer-name">{CUSTOMER.name}</h1>
              <div className="cm-meta"><span className="cm-meta-label">Address</span>{CUSTOMER.addressLine1}, {CUSTOMER.addressLine2}</div>
              <div className="cm-meta"><span className="cm-meta-label">Date of Birth</span>{CUSTOMER.dob}</div>
              <div className="cm-chips">
                {CUSTOMER.legalChips.map(chip => {
                  const ChipIcon = CHIP_ICONS[chip.id]
                  return <span key={chip.id} className="cm-chip">{ChipIcon && <ChipIcon />}{chip.label}</span>
                })}
                {/* Not a legal decision, so its own purple treatment rather than the red chips; the same
                    flag as the desktop ADJUSTMENTS badge. Arthur has a Reasonable Adjustment Flag. */}
                <a className="cm-chip cm-chip-adjustments cm-chip-link" href="../customer-adjustments/?transition=1" aria-label="Reasonable adjustments flag recorded. Open reasonable adjustments."><FlagChipIcon />Adjustments</a>
              </div>
              <img className="cm-avatar" src={CUSTOMER.photo} alt="" />
              {CUSTOMER.highRisk && <span className="cm-high-risk">HIGH RISK</span>}
              <span className="cm-key"><KeyIcon size={22} /></span>
            </div>

            <nav className="cm-grid" aria-label="Customer menu">
              {TILES.map(tile => <Tile key={tile.id} tile={tile} />)}
            </nav>
          </div>
        </div>
      </PhoneFrame>
    </>
  )
}
