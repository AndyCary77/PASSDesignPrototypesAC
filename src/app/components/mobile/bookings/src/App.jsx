import { useState } from 'react'
import PhoneFrame from '../../assets/PhoneFrame'
import { dateKey } from '../../assets/WeekStrip'
import TouchCursor from '../../assets/TouchCursor'
import { handleSystemBack, useBackHandler } from '../../assets/backStack'
import BookingsList from './BookingsList'
import VisitScreen from './VisitScreen'
import TagInSheet from './TagInSheet'
import TaskDetail from './TaskDetail'
import { BOOKINGS, CUSTOMERS, TODAY } from './bookingsData'
import { TASKS } from './visitData'
import { cancelVisit, completeTask, setVisitStatus, startVisit, useVisits } from './visitStore'
import { useElapsed } from './useElapsed'

const ChevronLeftIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
  </svg>
)
// Arthur's 16:00 visit can be put in any state from the switch outside the phone; the real flow
// (open the booking → Tag in → tasks) drives the same store, so the two stay in step.
const ARTHUR_VISIT_STATES = [
  { id: 'upcoming', label: 'Not started' },
  { id: 'inProgress', label: 'In progress' },
  { id: 'complete', label: 'Complete' },
]
const DRIVEN_BOOKING = 'b1'
const TASK_IDS = TASKS.map(t => t.id)

// Screens: 'list' → 'visit' (preview, then in progress once tagged in) → 'task'. The tag-in method is a sheet over 'visit'.
// `dir` says which way the incoming screen slides: forward for deeper, back for returning.
function initialNav() {
  const q = new URLSearchParams(window.location.search)
  const dir = q.get('transition') === 'back' ? 'back' : null
  const id = q.get('booking')
  // Coming back from Reasonable adjustments lands on the visit you left.
  if (q.get('view') === 'visit' && BOOKINGS.some(b => b.id === id)) return { view: 'visit', bookingId: id, taskId: null, dir }
  return { view: 'list', bookingId: null, taskId: null, dir }
}

export default function App() {
  const [selected, setSelected] = useState(TODAY)
  const [nav, setNav] = useState(initialNav)
  const [sheetOpen, setSheetOpen] = useState(false)
  const visits = useVisits()

  const go = (view, patch = {}, dir = 'forward') => setNav(n => ({ ...n, view, taskId: null, ...patch, dir }))
  const toList = () => go('list', { bookingId: null }, 'back')
  useBackHandler(nav.view === 'task', () => go('visit', {}, 'back'))
  useBackHandler(nav.view === 'visit', toList)

  const statusOf = b => visits[b.id]?.status ?? 'upcoming'
  const active = BOOKINGS.find(b => statusOf(b) === 'inProgress')
  const activeElapsed = useElapsed(active ? visits[active.id].startedAt : null)
  const arthurState = statusOf(BOOKINGS.find(b => b.id === DRIVEN_BOOKING))

  const day = BOOKINGS.filter(b => b.date === dateKey(selected))
  const weekday = selected.toLocaleDateString('en-GB', { weekday: 'short' })
  const booking = BOOKINGS.find(b => b.id === nav.bookingId)
  const customer = booking && CUSTOMERS[booking.customerId]
  const visit = booking && visits[booking.id]

  const tagIn = () => { startVisit(booking.id); setSheetOpen(false) }

  let screen
  if (nav.view === 'task' && booking) {
    screen = (
      <TaskDetail
        key="task"
        taskId={nav.taskId}
        booking={booking}
        customer={customer}
        visit={visit}
        onBack={() => go('visit', {}, 'back')}
        onRecord={() => { completeTask(booking.id, nav.taskId); go('visit', {}, 'back') }}
      />
    )
  } else if (nav.view === 'visit' && booking) {
    screen = (
      <VisitScreen
        key="visit"
        booking={booking}
        customer={customer}
        visit={visit}
        onBack={toList}
        onTagIn={() => setSheetOpen(true)}
        onCancel={() => { cancelVisit(booking.id); toList() }}
        onOpenTask={taskId => go('task', { taskId })}
      />
    )
  } else {
    screen = (
      <BookingsList
        selected={selected}
        onSelect={setSelected}
        day={day}
        weekday={weekday}
        statusOf={statusOf}
        active={active}
        activeElapsed={activeElapsed}
        onOpen={id => go('visit', { bookingId: id })}
      />
    )
  }

  return (
    <>
      <a href="/" className="back-link"><ChevronLeftIcon size={16} /> Prototypes</a>
      {/* Demo-only switch, outside the phone, bottom-right, same placement as customer-adjustments' controls. */}
      <div className="bk-demo" role="group" aria-label="Demo: Arthur's visit">
        <span className="bk-demo-title">Arthur’s 16:00 visit</span>
        {ARTHUR_VISIT_STATES.map(s => (
          <button
            key={s.id}
            type="button"
            className={`bk-demo-btn${arthurState === s.id ? ' bk-demo-btn--on' : ''}`}
            aria-pressed={arthurState === s.id}
            onClick={() => setVisitStatus(DRIVEN_BOOKING, s.id, TASK_IDS)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <PhoneFrame onSystemBack={() => handleSystemBack()}>
        <div className="screen-area">
          <div key={nav.view} className={`screen page-slide${nav.dir === 'forward' ? ' slide-entering' : nav.dir === 'back' ? ' slide-entering-left' : ''}`}>
            {screen}
            {sheetOpen && booking && <TagInSheet customer={customer} onClose={() => setSheetOpen(false)} onTagIn={tagIn} />}
          </div>
        </div>
      </PhoneFrame>
      <TouchCursor />
    </>
  )
}
