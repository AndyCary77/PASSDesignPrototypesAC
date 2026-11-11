import { useState } from 'react'
import { activeItems, categoryName, formatRafDate, formatRafDateTime } from '../../../data/reasonableAdjustments'

// A customer's Reasonable Adjustments exactly as the mobile Reasonable adjustments screen shows them: the amber flag
// summary, then a purple card per section. Shared so that screen and any sheet that previews it can't drift apart.
// Pair with adjustments-content.css. Wording and order are fixed by the NHS spec: these terms, in this order, no acronyms.
//
//   record          the flag record (getRafRecord); null shows the "no current recorded need" card
//   level           '1' = Reasonable Adjustments only; anything else adds Impairments and Underlying Conditions
//   offline         true shows "Last synced" instead of "Last retrieved from the national flag"
//   retrievedAt / lastSyncedAt   Dates for those two labels
//   paginate        true (the screen's behaviour) shows five at a time with "Show more"; false lists everything, for a
//                   scrolling container where hiding an adjustment behind a tap isn't worth it (the visit sheet)
const PAGE_SIZE = 5

const FlagIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M14.4 6 14 4H5v17h2v-7h5.6l.4 2h7V6z" />
  </svg>
)
const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </svg>
)
const AccessibilityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.5 6c-2.61.7-5.67 1-8.5 1s-5.89-.3-8.5-1L3 8c1.86.5 4 .83 6 1v13h2v-6h2v6h2V9c2-.17 4.14-.5 6-1l-.5-2zM12 6c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
  </svg>
)
const ImpairmentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 12h4l2-5 4 10 2-5h6" />
  </svg>
)
const ConditionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3v6a4 4 0 0 0 8 0V3M10 13v2a4 4 0 0 0 8 0v-1" />
    <circle cx="18" cy="12" r="2" />
  </svg>
)

// Fixed by the NHS spec: these three terms, in this order, no acronyms.
const SECTIONS = [
  { section: 'adjustment', title: 'Reasonable Adjustments', Icon: AccessibilityIcon, empty: 'No reasonable adjustments have been recorded.' },
  { section: 'impairment', title: 'Impairments', Icon: ImpairmentIcon, empty: 'No impairments have been recorded.' },
  { section: 'condition', title: 'Underlying Conditions', Icon: ConditionIcon, empty: 'No underlying conditions have been recorded.' },
]

function Item({ item }) {
  return (
    <li className="ra-item">
      <p className="ra-item-term">{item.term}</p>
      {item.categoryCode && <span className="ra-tag">{categoryName(item.categoryCode)}</span>}
      {item.freeText && <p className="ra-item-text">{item.freeText}</p>}
      <p className="ra-item-meta">
        {item.source === 'national' && (
          <>
            <span className="ra-globe"><GlobeIcon /></span>
            <span className="ra-sr-only">From the national flag. </span>
          </>
        )}
        <span>Added: {formatRafDate(item.addedOn)} by {item.addedBy} at {item.organisation}</span>
      </p>
    </li>
  )
}

function Section({ def, items, paginate }) {
  // Paginate rather than truncate (the spec's rule): five at a time, the rest a tap away.
  const [shown, setShown] = useState(paginate ? PAGE_SIZE : items.length)
  const visible = items.slice(0, shown)
  const remaining = items.length - visible.length
  return (
    <section className="ra-section">
      <div className="ra-section-header">
        <span className="ra-section-icon"><def.Icon /></span>
        <h2 className="ra-section-title">{def.title}</h2>
        <span className="ra-section-count">{items.length}</span>
      </div>
      {items.length === 0
        ? <p className="ra-empty">{def.empty}</p>
        : <ul className="ra-list">{visible.map(i => <Item key={i.id} item={i} />)}</ul>}
      {paginate && remaining > 0 && (
        <button type="button" className="ra-more" onClick={() => setShown(s => s + PAGE_SIZE)}>
          Show {Math.min(remaining, PAGE_SIZE)} more
          <span className="ra-more-sub">{visible.length} of {items.length} shown</span>
        </button>
      )}
    </section>
  )
}


export default function AdjustmentsContent({ record, level = '2', offline = false, retrievedAt, lastSyncedAt, paginate = true }) {
  const sections = level === '1' ? SECTIONS.slice(0, 1) : SECTIONS
  if (!record) {
    return (
      <div className="ra-status">
        <p className="ra-status-title">No current recorded need for adjustments to care</p>
        {offline && <p className="ra-status-sync">Last synced: {formatRafDateTime(lastSyncedAt)}</p>}
      </div>
    )
  }
  return (
    <>
    <section className="ra-flag">
      <div className="ra-flag-header">
        <span className="ra-flag-circle"><FlagIcon /></span>
        <h1 className="ra-flag-title">Reasonable Adjustment Flag recorded</h1>
      </div>
      <dl className="ra-flag-body">
        <dt>Last updated on:</dt>
        <dd>{formatRafDate(record.lastUpdatedOn)}</dd>
        {offline ? (
          <>
            <dt>Last synced:</dt>
            <dd>{formatRafDateTime(lastSyncedAt)}</dd>
          </>
        ) : (
          <>
            <dt>Last retrieved from the national flag:</dt>
            <dd>{formatRafDateTime(retrievedAt)}</dd>
          </>
        )}
      </dl>
      <p className="ra-flag-note">
        {level === '1'
          ? 'You can see Reasonable Adjustments only. Changes are made in PASS.'
          : 'This is a view only. Changes are made in PASS.'}
        {offline && ' This is from the last sync and will update when you’re back online.'}
      </p>
    </section>
    {sections.map(def => <Section key={def.section} def={def} items={activeItems(record, def.section)} paginate={paginate} />)}
    </>
  )
}
