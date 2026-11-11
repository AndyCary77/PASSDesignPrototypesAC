import { FlagChips, HighRiskBadge, KeyIcon, buildFlagChips } from '../../assets/CustomerFlags'
import { adjustmentsHref, formatDuration, hasAdjustmentsFlag } from './bookingsData'

// One booking in the day list. `status` is 'upcoming' | 'inProgress' | 'complete'.
//
// The Adjustments chip is here so the careworker sees the flag before they arrive. It links into
// the Reasonable adjustments screen, whose back returns to the list. Tapping the card opens the visit.

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 7v5.5l3.5 2" />
  </svg>
)

// The marker straddling the card's left edge.
function StatusMarker({ status }) {
  if (status === 'complete') {
    return (
      <span className="bk-marker bk-marker--complete" role="img" aria-label="Complete">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      </span>
    )
  }
  if (status === 'inProgress') {
    return (
      <span className="bk-marker bk-marker--progress" role="img" aria-label="In progress">
        <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
          <circle cx="13" cy="13" r="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 3.6" />
          <path d="M10.5 8.5v9l7.5-4.5z" fill="currentColor" />
        </svg>
      </span>
    )
  }
  return <span className="bk-marker bk-marker--upcoming" role="img" aria-label="Not started" />
}

export default function BookingCard({ booking, customer, status = 'upcoming', onOpen }) {
  const chips = buildFlagChips({
    legalChips: customer.legalChips,
    hasAdjustments: hasAdjustmentsFlag(customer),
    adjustmentsHref: adjustmentsHref(booking.id),
  })
  return (
    <li className={`bk-card bk-card--${status}`}>
      <StatusMarker status={status} />
      <div className="bk-main">
        <div className="bk-text">
          <div className="bk-time">
            <ClockIcon />
            {status === 'inProgress'
              ? <span>{booking.start} – <strong>In progress</strong> with me</span>
              : <span>{booking.start} – {booking.end} ({formatDuration(booking.start, booking.end)})</span>}
          </div>
          <h3 className="bk-title">
            {/* A button whose ::after stretches over the whole card, so the card opens the visit while the Adjustments chip stays its own link. */}
            <button type="button" className="bk-open" onClick={onOpen}>
              <strong>{booking.title}</strong> with <strong>{customer.name}</strong>
            </button>
          </h3>
          <div className="bk-address">{customer.address}</div>
        </div>
        <div className="bk-side">
          <img className={`bk-avatar${customer.highRisk ? ' bk-avatar--risk' : ''}`} src={customer.photo} alt="" />
          {customer.highRisk && <HighRiskBadge />}
          {/* The key is for getting in; once the visit has started it's no use. */}
          {customer.keySafe && status === 'upcoming' && <span className="bk-key" role="img" aria-label="Key safe"><KeyIcon size={24} /></span>}
        </div>
      </div>
      <div className="bk-chips"><FlagChips chips={chips} /></div>
    </li>
  )
}
