import { useState } from 'react'
import StatusBar from '../../assets/StatusBar'
import AppHeader from '../../assets/AppHeader'
import AppNav from '../../assets/AppNav'
import PhoneFrame from '../../assets/PhoneFrame'
// Same photo as the web app's Arthur Barrington and mobile/customer-documents'
// own Arthur — all prototypes show the same person.
import arthurImg from '../../assets/img/Customer=Arthur Barrington.jpg'
// The same flag record and chip icons as mobile/customer-menu's profile header (and
// customer-documents / customer-adjustments), so the list shows every badge his
// interior pages do and the two can't drift apart.
import { CUSTOMER as ARTHUR } from '../../customer-documents/src/customerDocumentsData'
import { AllergiesIcon, DnacprIcon, DolsIcon, FlagChipIcon } from '../../customer-menu/src/menuIcons'

const ChevronLeftIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
  </svg>
)

const SearchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
)

// The same 3 example customers as the desktop prototype (src/app/data/customers.ts
// CUSTOMER_LIST). Arthur is the only one with a working mobile detail screen
// today (mobile/customer-menu, which leads on to customer-documents) — Edith and Vera are shown for parity
// with the desktop list, same as it, but aren't tappable yet; an honest gap
// rather than wiring them to Arthur's own screen and misrepresenting it as
// theirs.
const CHIP_ICONS = { allergies: AllergiesIcon, dnacpr: DnacprIcon, dols: DolsIcon, adjustments: FlagChipIcon }

// HIGH RISK first (its own solid treatment), then the legal flags, then Adjustments —
// Arthur has a Reasonable Adjustment Flag. Not a legal decision, so its own purple chip.
const ARTHUR_BADGES = [
  ...(ARTHUR.highRisk ? [{ id: 'high-risk', label: 'HIGH RISK', kind: 'high-risk' }] : []),
  ...ARTHUR.legalChips.map(c => ({ ...c, kind: 'legal' })),
  { id: 'adjustments', label: 'Adjustments', kind: 'adjustments', href: '../customer-adjustments/?transition=1' },
]

const CUSTOMERS = [
  {
    id: 'arthur-barrington', name: 'Arthur Barrington', surname: 'Barrington',
    address: '91 Westwood Road, Sutton Coldfield, B73 6UJ',
    img: arthurImg, badges: ARTHUR_BADGES, href: '../customer-menu/?transition=1',
  },
  {
    id: 'vera-bramwell', name: 'Vera Bramwell', surname: 'Bramwell',
    address: '22 Ashcroft Gardens, Tamworth, B79 8QN',
    initials: 'VB', color: 'green',
  },
  {
    id: 'edith-caldwell', name: 'Edith Caldwell', surname: 'Caldwell',
    address: '7 Meadowbank Close, Lichfield, WS13 6RT',
    initials: 'EC', color: 'blue',
  },
]

function groupBySurname(list) {
  const sorted = [...list].sort((a, b) => a.surname.localeCompare(b.surname))
  const groups = []
  for (const person of sorted) {
    const letter = person.surname[0].toUpperCase()
    let group = groups[groups.length - 1]
    if (!group || group.letter !== letter) {
      group = { letter, people: [] }
      groups.push(group)
    }
    group.people.push(person)
  }
  return groups
}

// The row opens the customer's menu through a "stretched" link on the name (its ::after covers the whole row), so the
// Adjustments badge can be a link of its own without nesting one link inside another.
function CustomerRow({ customer }) {
  return (
    <div className={`cust-row${customer.href ? ' cust-row-tap' : ''}`}>
      <div className="cust-avatar">
        {customer.img
          ? <img src={customer.img} alt="" />
          : <span className={`cust-avatar-initials cust-avatar-${customer.color}`}>{customer.initials}</span>}
      </div>
      <div className="cust-info">
        <div className="cust-name">
          {customer.href ? <a className="cust-row-link" href={customer.href}>{customer.name}</a> : customer.name}
        </div>
        {customer.address && <div className="cust-address">{customer.address}</div>}
        {customer.badges && (
          <div className="cust-badges">
            {customer.badges.map(b => {
              const BadgeIcon = CHIP_ICONS[b.id]
              const content = <>{BadgeIcon && <BadgeIcon />}{b.label}</>
              return b.href
                ? (
                  <a
                    key={b.id}
                    href={b.href}
                    className={`cust-badge cust-badge-${b.kind} cust-badge-link`}
                    aria-label="Reasonable adjustments flag recorded. Open reasonable adjustments."
                  >
                    {content}
                  </a>
                )
                : <span key={b.id} className={`cust-badge cust-badge-${b.kind}`}>{content}</span>
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const groups = groupBySurname(CUSTOMERS)
  // Only true arriving back from a detail screen (e.g. customer-documents'
  // own "All customers" link) plays the reverse slide — a direct visit or a
  // bottom-nav tap into Customers shouldn't replay it.
  const [enteringBack] = useState(() =>
    new URLSearchParams(window.location.search).get('transition') === 'back'
  )
  return (
    <>
      <a href="/" className="back-link"><ChevronLeftIcon size={16} /> Prototypes</a>
      <PhoneFrame>
        <div className={`screen page-slide${enteringBack ? ' slide-entering-left' : ''}`}>
          <StatusBar />
          <AppHeader
            title="Customers"
            right={<button className="app-header-action"><SearchIcon /></button>}
          />
          <div className="cust-list">
            {groups.map(group => (
              <div key={group.letter}>
                <div className="list-group-label">{group.letter}</div>
                {group.people.map(c => <CustomerRow key={c.id} customer={c} />)}
              </div>
            ))}
          </div>
          <AppNav
            activeTab="customers"
            links={{ employees: '../employees/', notifications: '../notifications/', account: '../account/' }}
          />
        </div>
      </PhoneFrame>
    </>
  )
}
