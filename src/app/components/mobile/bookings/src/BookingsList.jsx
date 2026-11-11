import { useRef } from 'react'
import StatusBar from '../../assets/StatusBar'
import AppHeader from '../../assets/AppHeader'
import AppNav from '../../assets/AppNav'
import WeekStrip from '../../assets/WeekStrip'
import useDragScroll from '../../assets/useDragScroll'
import BookingCard from './BookingCard'
import { InProgressIcon } from './visitIcons'
import { CUSTOMERS, MARKED_DATES, TODAY, WEEK_START } from './bookingsData'

const FilterIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3 6h18v2H3zm3 5h12v2H6zm3 5h6v2H9z"/>
  </svg>
)
const SearchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
)

// The day's bookings. While a visit is in progress a green banner replaces the nav bar (as in the design) and reopens it.
export default function BookingsList({ selected, onSelect, day, weekday, statusOf, active, activeElapsed, onOpen }) {
  const scrollRef = useRef(null)
  useDragScroll(scrollRef)
  return (
    <>
      <StatusBar />
      <AppHeader
        title="Bookings"
        left={<button type="button" className="app-header-action" aria-label="Filter"><FilterIcon /></button>}
        right={<button type="button" className="app-header-action" aria-label="Search"><SearchIcon /></button>}
      />
      <WeekStrip weekStart={WEEK_START} selected={selected} today={TODAY} markedDates={MARKED_DATES} onSelect={onSelect} />
      <div className="bk-scroll" ref={scrollRef}>
        <div className="bk-day">
          <div className="bk-rail">
            <span className="bk-rail-dot" aria-hidden="true" />
            <span className="bk-rail-num">{selected.getDate()}</span>
            <span className="bk-rail-day">{weekday}</span>
          </div>
          {day.length > 0
            ? (
              <ul className="bk-list">
                {day.map(b => (
                  <BookingCard key={b.id} booking={b} customer={CUSTOMERS[b.customerId]} status={statusOf(b)} onOpen={() => onOpen(b.id)} />
                ))}
              </ul>
            )
            : <p className="bk-empty">Only Monday 21’s bookings are in this prototype.</p>}
        </div>
      </div>
      {active
        ? (
          <button type="button" className="bk-banner" onClick={() => onOpen(active.id)}>
            <img className="bk-banner-avatar" src={CUSTOMERS[active.customerId].photo} alt="" />
            <span className="bk-banner-text">
              <span className="bk-banner-title"><strong>{active.title}</strong> with <strong>{CUSTOMERS[active.customerId].name}</strong></span>
              <span className="bk-banner-sub"><InProgressIcon size={20} /> In progress ({activeElapsed})</span>
            </span>
          </button>
        )
        : (
          <AppNav
            activeTab="bookings"
            links={{ customers: '../customers/', employees: '../employees/', notifications: '../notifications/', account: '../account/' }}
          />
        )}
    </>
  )
}
