import { useState } from 'react'
import StatusBar from '../../assets/StatusBar'
import AppHeader from '../../assets/AppHeader'
import AppNav from '../../assets/AppNav'
import PhoneFrame from '../../assets/PhoneFrame'
import placeholderImg from '../../assets/img/Employee Placeholder.png'
// Same photo as the web app's David Buckowski (EmployeeInfoNav.tsx's
// `davidPhoto`) — the one employee here with a real desktop record gets his
// real photo; Adrianna/Kathryn have none, so they keep the placeholder.
import davidImg from '../../assets/img/Employee=David Buckowski.jpg'

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

// The logged-in persona used throughout these mobile prototypes (see
// AccountScreen.jsx's own "Adrianna Janowski / Careworker") pinned at the
// top under "You", same as the real app. David Buckowski is the one real
// desktop employee example with a full record (EmployeeDetailsPage.tsx /
// EmployeeInfoNav.tsx); Kathryn Perry is a second real desktop carer name
// (ScheduleTimeline.tsx's CARERS list) — three examples total, as asked.
const YOU = { id: 'you', name: 'Adrianna Janowski', role: 'Careworker' }

// Only David has a real desktop address on record (EmployeeInfoNav.tsx) —
// Adrianna/Kathryn have none anywhere upstream, so they stay without one
// rather than inventing one. David is also the only one with a working
// mobile documents screen today (mobile/employee-documents) — same honest
// gap as Edith/Vera on the Customers list.
const EMPLOYEES = [
  { id: 'david-buckowski', name: 'David Buckowski', surname: 'Buckowski', role: 'Careworker', img: davidImg, address: '11 Matlock Close, Walsall, WS3 3QE', href: '../employee-documents/?transition=1' },
  { id: 'kathryn-perry', name: 'Kathryn Perry', surname: 'Perry', role: 'Careworker' },
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

function EmployeeRow({ name, role, img, address, href, you = false }) {
  const Tag = href ? 'a' : 'div'
  return (
    <Tag className={`emp-row${you ? ' emp-row-you' : ''}${href ? ' emp-row-tap' : ''}`} href={href}>
      <div className="emp-avatar"><img src={img || placeholderImg} alt="" /></div>
      <div className="emp-info">
        <div className="emp-name">{name}</div>
        {address && <div className="emp-address">{address}</div>}
        <div className="emp-role">{role}</div>
      </div>
    </Tag>
  )
}

export default function App() {
  const groups = groupBySurname(EMPLOYEES)
  // Only true arriving back from a detail screen (e.g. employee-documents'
  // own back link) plays the reverse slide — a direct visit or a bottom-nav
  // tap into Employees shouldn't replay it.
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
            title="Employees"
            right={<button className="app-header-action"><SearchIcon /></button>}
          />
          <div className="emp-list">
            <div className="list-group-label">You</div>
            <EmployeeRow name={YOU.name} role={YOU.role} you />
            {groups.map(group => (
              <div key={group.letter}>
                <div className="list-group-label">{group.letter}</div>
                {group.people.map(e => <EmployeeRow key={e.id} name={e.name} role={e.role} img={e.img} address={e.address} href={e.href} />)}
              </div>
            ))}
          </div>
          <AppNav
            activeTab="employees"
            links={{ customers: '../customers/', notifications: '../notifications/', account: '../account/' }}
          />
        </div>
      </PhoneFrame>
    </>
  )
}
