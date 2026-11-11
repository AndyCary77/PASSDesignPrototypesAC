import StatusBar from '../../assets/StatusBar'
import { FlagChips, HighRiskBadge, KeyIcon } from '../../assets/CustomerFlags'
import { formatShortDuration } from './visitData'
import { BackArrowIcon, ChevronDownIcon, ClockIcon, ExternalLinkIcon, InProgressIcon, TagIcon } from './visitIcons'

// The purple header shared by every visit screen: back button, title (+ a "Visit in progress" line once
// started), an optional collapse chevron, and — unless collapsed — who the visit is for.
//
//   chips      FlagChips entries; pass buildFlagChips(...) to include the Adjustments chip
//   collapsed  hides the customer block (the chevron toggles it via onToggle)
//   tagTime    "HH:MM" the carer tagged in; shows a tag row under the address
export default function VisitHeader({ title, subtitle, onBack, onToggle, collapsed = false, customer, booking, tagTime, chips }) {
  return (
    <header className="vh">
      <StatusBar />
      <div className="vh-bar">
        <button type="button" className="vh-round" aria-label="Back" onClick={onBack}><BackArrowIcon /></button>
        <div className="vh-titles">
          <div className="vh-title">{title}</div>
          {subtitle && <div className="vh-subtitle"><InProgressIcon />{subtitle}</div>}
        </div>
        {onToggle
          ? (
            <button type="button" className="vh-round" aria-label={collapsed ? 'Show customer details' : 'Hide customer details'} aria-expanded={!collapsed} onClick={onToggle}>
              <ChevronDownIcon />
            </button>
          )
          : <span className="vh-round-spacer" />}
      </div>
      {!collapsed && (
        <div className="vh-customer">
          <div className="vh-info">
            <h2 className="vh-name">{customer.name}</h2>
            <div className="vh-line">D.O.B: {customer.dob}</div>
            <div className="vh-line vh-row"><ClockIcon />{booking.start} - {booking.end} ({formatShortDuration(booking.start, booking.end)})</div>
            <div className="vh-line vh-row vh-address">{customer.address}<ExternalLinkIcon /></div>
            {tagTime && <div className="vh-line vh-row vh-tag"><TagIcon />{tagTime}</div>}
          </div>
          <div className="vh-side">
            <img className={`vh-avatar${customer.highRisk ? ' vh-avatar--risk' : ''}`} src={customer.photo} alt="" />
            {customer.highRisk && <HighRiskBadge />}
            {customer.keySafe && <span className="vh-key" role="img" aria-label="Key safe"><KeyIcon size={26} /></span>}
          </div>
        </div>
      )}
      {!collapsed && chips && chips.length > 0 && <FlagChips chips={chips} className="vh-chips" />}
    </header>
  )
}
