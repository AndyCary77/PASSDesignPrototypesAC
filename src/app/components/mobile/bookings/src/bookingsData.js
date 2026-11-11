// Mock data for the Bookings prototype, built from the design screenshots: one day (Monday 21) of
// three visits for the signed-in careworker, with Arthur's the one that moves through
// upcoming / in progress / complete.
//
// Customers are the prototype's existing ones — Arthur's photo and legal chips are the same
// record mobile/customer-menu and customer-documents use, and whether a customer shows the
// Adjustments chip comes from the same Reasonable Adjustment Flag record the web tab and
// mobile/customer-adjustments read (getRafRecord), so the three can't disagree. Hilary and Lily
// are the screenshots' other two; neither has a flag.

import { CUSTOMER as ARTHUR } from '../../customer-documents/src/customerDocumentsData'
import hilaryImg from '../../assets/img/Customer=Hilary Buxton.png'
import lilyImg from '../../assets/img/Customer=Lily.png'
import { getRafRecord } from '../../../../data/reasonableAdjustments'

// The screenshots show the same three legal chips on every card, so each customer carries them.
const LEGAL_CHIPS = ARTHUR.legalChips

// "Today" in the prototype — fixed so the screen reads the same whenever it's opened. Monday 21st,
// in a week that starts on Sunday the 20th (the screenshot's strip), matching its highlighted day.
export const TODAY = new Date(2026, 8, 21)
export const WEEK_START = new Date(2026, 8, 20)
// The strip's dots: every day this week except Saturday has bookings. Only the 21st has any in the prototype.
export const MARKED_DATES = ['2026-09-20', '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25']

const ADDRESS = '22 Dunlop Street, Farnham, GU23 4EE'

export const CUSTOMERS = {
  arthur: {
    id: 'arthur', recordId: 'arthur-barrington', name: ARTHUR.name, photo: ARTHUR.photo,
    dob: ARTHUR.dob, address: ADDRESS, highRisk: ARTHUR.highRisk, keySafe: true, legalChips: LEGAL_CHIPS,
  },
  hilary: {
    id: 'hilary', recordId: 'hilary-buxton', name: 'Hilary Buxton', photo: hilaryImg,
    dob: '03/05/41', address: ADDRESS, highRisk: false, keySafe: true, legalChips: LEGAL_CHIPS,
  },
  lily: {
    id: 'lily', recordId: 'lily-finch', name: 'Lily Finch', photo: lilyImg,
    dob: '22/11/39', address: ADDRESS, highRisk: false, keySafe: true, legalChips: LEGAL_CHIPS,
  },
}

// `start`/`end` in minutes would be tidier, but the strings are what's shown.
export const BOOKINGS = [
  { id: 'b1', date: '2026-09-21', start: '16:00', end: '17:00', title: 'Afternoon visit', customerId: 'arthur' },
  { id: 'b2', date: '2026-09-21', start: '17:15', end: '17:45', title: 'Tea visit', customerId: 'hilary' },
  { id: 'b3', date: '2026-09-21', start: '18:00', end: '18:30', title: 'Companionship cinema', customerId: 'lily' },
]

/** True when the customer has a Reasonable Adjustment Flag — the same check the other screens make. */
export const hasAdjustmentsFlag = customer => getRafRecord(customer.recordId) !== null

/** "1hr", "30m", "1hr 30m" */
export function formatDuration(start, end) {
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  const mins = toMin(end) - toMin(start)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return [h ? `${h}hr` : '', m ? `${m}m` : ''].filter(Boolean).join(' ')
}

/**
 * Link into the Reasonable adjustments screen that brings you back to where you were: the Bookings list, or
 * (view = 'visit') the visit for `bookingId`. The visit itself is kept in sessionStorage (visitStore.js).
 */
export function adjustmentsHref(bookingId, view) {
  const back = `../bookings/?transition=back${view ? `&view=${view}&booking=${bookingId}` : ''}`
  return `../customer-adjustments/?transition=1&back=${encodeURIComponent(back)}`
}
