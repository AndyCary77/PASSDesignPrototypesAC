// Static, made-up enquiries for the Enquiries screen (see EnquiriesPage.tsx). The shape
// follows the production list: who enquired, where they live, how to reach them and
// when the enquiry came in. Nothing here is wired to anything.

import type { ListStatus } from './customersListDummy';

export type EnquiryStatus = 'open' | 'closed';

export const ENQUIRY_STATUS_LABEL: Record<EnquiryStatus, string> = {
  open: 'Open',
  closed: 'Closed',
};

export interface Enquiry {
  id: string;
  /** Title and full name, as shown. */
  name: string;
  /** dd/mm/yyyy — only some enquiries have one. */
  dob?: string;
  address: string;
  /** Free text: a number and sometimes who it belongs to. */
  tel?: string;
  /** When it came in. */
  received: Date;
  status: EnquiryStatus;
  /** A closed enquiry became a customer: where that customer is now (the Customers list's statuses). */
  customerStatus?: ListStatus;
}

// Hand-written so the first page reads like the real list (blanks, long addresses, a
// note in the phone field); the rest are generated below, deterministically.
const HAND_WRITTEN: Omit<Enquiry, 'id'>[] = [
  { name: 'Mr Daniel Ashworth', dob: '13/04/1969', address: 'Flat 7 Marlow Road, Hartfield, HF5 2LW', received: new Date(2026, 9, 26, 9, 44), status: 'open' },
  { name: 'Mrs Helen Fairweather', address: '8 Elmstead Woods, Alder House, HF1 2WR', received: new Date(2026, 9, 23, 16, 20), status: 'open' },
  { name: 'Mrs Dorothy Pennington', address: '4 Mayfair Close, Beckwith, HF3 5EL', received: new Date(2026, 9, 21, 12, 48), status: 'open' },
  { name: 'Mrs Dorothy Lister', address: '65, HF2 8AZ', received: new Date(2026, 9, 20, 12, 16), status: 'open' },
  { name: 'Mrs Jean Leveson', address: '47, HF6 8BH', received: new Date(2026, 9, 20, 11, 49), status: 'open' },
  { name: 'Mr Steven Jarrett', address: '5 Sheridan Lodge, HF2 9SU', received: new Date(2026, 9, 19, 13, 56), status: 'open' },
  { name: 'Mrs Rose Wilkerson', address: '8 Long Acre, Orchard Vale, HF6 7RD', received: new Date(2026, 9, 16, 10, 39), status: 'open' },
  { name: 'Mrs Hilda Lennox', address: '37 Brookmead Way, Orchard Vale, HF5 2BQ', received: new Date(2026, 9, 14, 9, 4), status: 'open' },
  { name: 'Mr Leslie and Jean Crossley', address: '18 Faulkner House, St Pauls Cray Road, HF7 6FA', received: new Date(2026, 9, 12, 13, 3), status: 'open' },
  { name: 'Mrs Maureen Simmonds', address: '14 Henville, Freelands Road', tel: '020 7946 0869', received: new Date(2026, 9, 8, 12, 43), status: 'open' },
  { name: 'Mrs Anne Underwood', address: 'HF1 2NJ', received: new Date(2026, 9, 7, 15, 14), status: 'open' },
  { name: 'Mrs Joan Clarkson', address: '29 Brantwood Way, HF5 3WA', received: new Date(2026, 9, 5, 16, 43), status: 'open' },
  { name: 'Mrs Doreen Gold', address: '6 Hayes Court, 116 West Common Road, HF2 7EG', tel: '020 7946 0822 / 07700 900747 Brother - John', received: new Date(2026, 9, 1, 10, 30), status: 'open' },
  { name: 'Mr Brian Beswick', dob: '02/01/1933', address: '173 Wickham Chase, West Wickham, HF4 0BH', tel: '020 7946 0777', received: new Date(2026, 8, 30, 15, 49), status: 'open' },
  { name: 'Ms Joan Hartley', address: 'HF2 0UB', received: new Date(2026, 8, 23, 13, 11), status: 'open' },
  { name: 'Mrs Anne Collier', address: '28 Andringham Lodge, 51 Palace Grove, HF1 3HG', tel: '020 7946 0313', received: new Date(2026, 8, 21, 11, 5), status: 'open' },
  { name: 'Mrs Patricia Healey', dob: '15/08/1940', address: '11 Pope Road, Hartfield, HF2 9QA', received: new Date(2026, 8, 15, 15, 2), status: 'open' },
];

// Title and first name together, so they always agree.
const FIRST = ['Mrs Margaret', 'Mr Alan', 'Mrs Brenda', 'Mr Ronald', 'Mrs Sheila', 'Mr Geoffrey', 'Mrs Pauline', 'Mr Colin', 'Ms Irene', 'Mr Norman', 'Mrs Edna', 'Mr Raymond', 'Mrs Joyce', 'Mr Kenneth', 'Ms Beryl', 'Mr Derek'];
const LAST = ['Aldridge', 'Bellamy', 'Cartwright', 'Denholm', 'Eastwood', 'Fenwick', 'Garrity', 'Holloway', 'Ingram', 'Jessop', 'Kershaw', 'Lovell', 'Marchant', 'Naylor', 'Oakley', 'Prentice'];
const STREETS = ['Willow Drive', 'Church Lane', 'Station Road', 'Meadow View', 'Park Avenue', 'The Crescent', 'Orchard Close', 'High Street'];
const TOWNS = ['Hartfield', 'Beckwith', 'Orchard Vale', 'West Wickham'];
// Where the customers from closed enquiries have got to.
const CUSTOMER_STATUSES: ListStatus[] = ['active', 'assessment-booked', 'active', 'assessment-completed', 'active', 'inactive'];
const PHONES = [undefined, undefined, undefined, '020 7946 0412', '020 7946 0587', '020 7946 0731 / 07700 900123 Daughter - Claire'];

// 72 open enquiries (as in the production screenshot) plus some closed ones the
// status filter can reveal.
const GENERATED: Omit<Enquiry, 'id'>[] = Array.from({ length: 55 + 14 }, (_, i) => {
  const status: EnquiryStatus = i < 55 ? 'open' : 'closed';
  return {
    name: `${FIRST[(i * 5) % FIRST.length]} ${LAST[(i * 7 + Math.floor(i / FIRST.length)) % LAST.length]}`,
    dob: i % 6 === 0 ? `${String(1 + (i % 27)).padStart(2, '0')}/${String(1 + (i % 12)).padStart(2, '0')}/19${35 + (i % 25)}` : undefined,
    address: `${1 + ((i * 11) % 140)} ${STREETS[i % STREETS.length]}, ${TOWNS[i % TOWNS.length]}, HF${1 + (i % 7)} ${1 + (i % 9)}${'ABDEFGHJLNPQRSTUWXYZ'[i % 20]}${'ABDEFGHJLNPQRSTUWXYZ'[(i * 3) % 20]}`,
    tel: PHONES[i % PHONES.length],
    // Working back from mid-September, a couple of days apart.
    received: new Date(2026, 8, 14 - Math.floor(i * 1.5), 9 + (i % 8), (i * 17) % 60),
    status,
    customerStatus: status === 'closed' ? CUSTOMER_STATUSES[i % CUSTOMER_STATUSES.length] : undefined,
  };
});

export const ENQUIRIES: Enquiry[] = [...HAND_WRITTEN, ...GENERATED]
  .map((e, i) => ({ ...e, id: `enq-${i + 1}` }))
  .sort((a, b) => b.received.getTime() - a.received.getTime());

const pad = (n: number) => String(n).padStart(2, '0');
/** dd/mm/yyyy hh:mm */
export const formatReceived = (d: Date) =>
  `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
