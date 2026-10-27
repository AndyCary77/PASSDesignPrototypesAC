// Static, made-up bookings for the Bookings screen (see BookingsPage.tsx): one
// week, one row per customer. Names and times follow the production screen the
// design is based on; nothing here is wired to anything.

import { CUSTOMERS_LIST_DUMMY } from './customersListDummy';
import { EMPLOYEES_LIST_DUMMY } from './employeesListDummy';

export type BookingStatus = 'scheduled' | 'missed' | 'in-progress' | 'completed';

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  scheduled: 'Scheduled',
  missed: 'Missed',
  'in-progress': 'In progress',
  completed: 'Completed',
};

export interface Booking {
  /** 0 = first day of the week shown (Tuesday 27 Oct), 6 = last (Monday 2 Nov). */
  day: number;
  start: string;
  end: string;
  employee: string;
  status: BookingStatus;
  /** Double-up visits: the other carer(s) on the visit. Each is shown on their own row, with the people badge. */
  alsoCarers?: string[];
}

export interface CustomerBookings {
  id: string;
  /** As shown in the Customers list (title and full name). */
  name: string;
  /** What the rows are sorted by, as in that list. */
  surname: string;
  /** Customer profile, where the Customers list links one (as there, most are inert). */
  href?: string;
  /** `${group}::${value}`, matching TAG_GROUPS. */
  tags: string[];
  bookings: Booking[];
}

// Written out per employee (easier to keep consistent by hand), then turned
// into one row per customer below.
interface SourceBooking extends Omit<Booking, 'employee' | 'alsoCarers'> {
  customer: string;
  /** Other carers on a double-up, by the names used in this file. */
  also?: string[];
}

/** The week on show: Tuesday 27 October – Monday 2 November 2026. */
export const WEEK_START = new Date(2026, 9, 27);
/** Today's view: Tuesday 27 October (the first day of the week), with the clock fixed at 10:20 so the demo doesn't drift. */
export const TODAY_LABEL = 'Tue 27 Oct 2026';
export const NOW = '10:20';

export const WEEK_LABEL = 'Tue 27 Oct 2026 – Mon 02 Nov 2026';

// The bookings below are written with the names from the production screen the
// design is based on; these swap them for the people in the Customers and Employees
// lists (matched on surname), so the same person has the same name everywhere.
const CUSTOMER_SURNAME: Record<string, string> = {
  'Compston, Martin': 'Compston',
  'Customer 1, Wednesday': 'Bennett',
  'Farrigton, David': 'Farrington',
  'Gilham, Peter': 'Ellis',
  'Henry, Rico': 'Barrington',
  'McClaude, Claude': 'McCarthy',
  'Onboard, New': 'Fitzgerald',
  'Test, Test': 'Gill',
  'Williams, Hugh': 'Grant',
};
const EMPLOYEE_SURNAME: Record<string, string> = {
  'Kayleigh Clegg': 'Chambers',
  'Steven Hendry': 'Buckowski',
  'James Bullard': 'Bullard',
  'Meera Patel': 'Patel',
  'Thomas Frank': 'Cooper',
  'Jenny Newark': 'Dhillon',
  'Holiday Guy': 'Edwards',
  'Balazs Toth': 'Evans',
};
const listCustomer = (name: string) => {
  const found = CUSTOMERS_LIST_DUMMY.find(c => c.surname === CUSTOMER_SURNAME[name]);
  return { fullName: found?.fullName ?? name, surname: found?.surname ?? name, href: found?.href };
};
// Employees on the cards drop the title ("Mr David Buckowski" → "David Buckowski"):
// with it, the longer names don't fit a day column.
const listEmployeeName = (name: string) =>
  (EMPLOYEES_LIST_DUMMY.find(e => e.surname === EMPLOYEE_SURNAME[name])?.fullName ?? name).replace(/^(Mr|Mrs|Ms|Miss|Dr) /, '');

const b = (day: number, start: string, end: string, customer: string, status: BookingStatus = 'scheduled', also?: string[]): SourceBooking =>
  ({ day, start, end, customer, status, also });

const SOURCE: { name: string; bookings: SourceBooking[] }[] = [
  {
    name: 'Kayleigh Clegg',
    bookings: [
      b(0, '14:35', '15:35', 'Farrigton, David'),
      b(0, '23:40', '23:45', 'Williams, Hugh'),
      b(1, '14:35', '15:35', 'Farrigton, David'),
      b(1, '15:00', '16:00', 'McClaude, Claude'),
      b(1, '18:45', '19:45', 'Farrigton, David'),
      b(2, '15:00', '17:00', 'Henry, Rico'),
      b(4, '13:00', '15:00', 'Henry, Rico', 'scheduled', ['Steven Hendry']),
    ],
  },
  {
    name: 'Steven Hendry',
    bookings: [
      b(0, '13:00', '15:00', 'Henry, Rico'),
      b(0, '15:00', '16:00', 'Henry, Rico'),
      b(0, '18:55', '19:55', 'Williams, Hugh'),
      b(1, '12:00', '13:00', 'Customer 1, Wednesday', 'scheduled', ['Kayleigh Clegg']),
      b(1, '13:00', '15:00', 'Henry, Rico', 'scheduled', ['Jenny Newark']),
      b(1, '18:55', '19:55', 'Williams, Hugh'),
      b(3, '15:00', '16:00', 'Henry, Rico'),
      b(4, '18:55', '19:55', 'Williams, Hugh'),
    ],
  },
  {
    name: 'James Bullard',
    bookings: [
      b(0, '20:50', '22:50', 'Farrigton, David'),
      b(0, '10:25', '10:45', 'Gilham, Peter'),
      b(4, '16:15', '17:15', 'Gilham, Peter'),
      b(4, '12:00', '13:00', 'Onboard, New'),
      b(4, '15:00', '16:00', 'Williams, Hugh'),
    ],
  },
  {
    name: 'Meera Patel',
    bookings: [
      b(0, '17:00', '18:00', 'Onboard, New'),
      b(1, '12:00', '17:00', 'Henry, Rico'),
      b(4, '12:00', '17:00', 'Henry, Rico'),
      b(4, '13:30', '14:00', 'Customer 1, Wednesday', 'scheduled', ['Jenny Newark']),
      b(0, '08:00', '10:00', 'Customer 1, Wednesday', 'missed', ['Holiday Guy']),
    ],
  },
  {
    name: 'Thomas Frank',
    bookings: [
      b(0, '00:00', '01:00', 'Customer 1, Wednesday', 'missed', ['Jenny Newark']),
      b(4, '00:00', '01:00', 'Customer 1, Wednesday', 'scheduled', ['Jenny Newark']),
    ],
  },
  {
    name: 'Jenny Newark',
    bookings: [
      b(0, '15:00', '16:00', 'McClaude, Claude'),
      b(2, '20:50', '22:50', 'Farrigton, David'),
    ],
  },
  {
    name: 'Holiday Guy',
    bookings: [
      b(0, '11:15', '12:15', 'Onboard, New'),
      b(0, '14:15', '15:15', 'Williams, Hugh'),
      b(0, '15:30', '16:30', 'Gilham, Peter'),
    ],
  },
  {
    name: 'Balazs Toth',
    bookings: [
      b(5, '08:00', '14:00', 'Compston, Martin', 'scheduled', ['Holiday Guy']),
      b(6, '09:30', '10:30', 'Test, Test'),
    ],
  },
];

/** The tags the filter offers, grouped as in the production filter. */
export const TAG_GROUPS: { group: string; values: string[] }[] = [
  { group: 'Apples', values: ['cherry', 'lemon', 'orange'] },
  { group: 'Area', values: ['Berkshire', 'Hampshire', 'Surrey'] },
  { group: 'Area2', values: ['Kent edited 24911', 'South'] },
  { group: 'Chk List Tags', values: ['Evening checks', 'Morning checks'] },
  { group: 'Customer Only', values: ['Key safe', 'Lives alone'] },
  { group: 'Environment', values: ['Cats', 'Dogs', 'Env Test 1', 'Other Pets', 'Smoker'] },
  {
    group: 'Language',
    values: ['Arabic', 'Bengali / Sylheti', 'English', 'Gujarati', 'Hamster 24911', 'Hindi', 'Polish', 'Portuguese', 'Punjabi / Urdu', 'Romanian', 'Tagalog / Filipino', 'Twi / Akan', 'Yoruba / Igbo'],
  },
  { group: 'Limited Tag', values: ['Limited 1', 'Limited 2'] },
  { group: 'Medical Conditions', values: ['Dementia', 'Diabetes', 'PEG feeding'] },
  { group: 'Territory', values: ['Lichfield', 'Tamworth'] },
];

/** Groups the filter shows open to begin with (the rest start collapsed). */
export const TAG_GROUPS_OPEN = ['Apples', 'Area', 'Area2', 'Environment', 'Language'];

const CUSTOMER_TAGS: Record<string, string[]> = {
  'Compston, Martin': ['Area::Surrey', 'Language::English', 'Environment::Cats'],
  'Customer 1, Wednesday': ['Area::Berkshire', 'Language::English', 'Environment::Smoker', 'Medical Conditions::Diabetes'],
  'Farrigton, David': ['Area::Hampshire', 'Language::English', 'Language::Polish', 'Environment::Dogs'],
  'Gilham, Peter': ['Area::Surrey', 'Language::Hindi', 'Language::English', 'Medical Conditions::Dementia'],
  'Henry, Rico': ['Area::Berkshire', 'Language::Portuguese', 'Medical Conditions::PEG feeding', 'Environment::Other Pets'],
  'McClaude, Claude': ['Area2::South', 'Language::English', 'Customer Only::Lives alone'],
  'Onboard, New': ['Area::Hampshire', 'Language::Arabic', 'Environment::Cats', 'Environment::Dogs'],
  'Test, Test': ['Area2::Kent edited 24911', 'Language::English', 'Apples::lemon'],
  'Williams, Hugh': ['Area::Surrey', 'Language::Punjabi / Urdu', 'Environment::Smoker', 'Territory::Tamworth'],
};

/** Profile page for a carer, by the name shown on the cards (as in the Employees list, only some have one). */
export const carerHref = (name: string) =>
  EMPLOYEES_LIST_DUMMY.find(e => e.fullName.replace(/^(Mr|Mrs|Ms|Miss|Dr) /, '') === name)?.href;

export const CUSTOMER_BOOKINGS: CustomerBookings[] = (() => {
  const byCustomer = new Map<string, Booking[]>();
  SOURCE.forEach(({ name, bookings }) =>
    bookings.forEach(({ customer, also, ...rest }) =>
      byCustomer.set(customer, [
        ...(byCustomer.get(customer) ?? []),
        { ...rest, employee: listEmployeeName(name), alsoCarers: also?.map(listEmployeeName) },
      ]),
    ),
  );
  return [...byCustomer.entries()]
    .map(([customer, bookings]) => {
      const { fullName, surname, href } = listCustomer(customer);
      return { id: surname.toLowerCase(), name: fullName, surname, href, tags: CUSTOMER_TAGS[customer] ?? [], bookings };
    })
    .sort((x, y) => x.surname.localeCompare(y.surname));
})();

// Customers with nothing booked this week — shown as empty rows when the page is set to
// "All" rather than "Booked only". Picked from the Customers list, matched on surname.
const UNBOOKED: Record<string, string[]> = {
  Buxton: ['Area::Berkshire', 'Language::English', 'Medical Conditions::Dementia'],
  Hall: ['Area::Hampshire', 'Language::English', 'Environment::Dogs'],
  Kulkarni: ['Area::Surrey', 'Language::Hindi', 'Language::Gujarati'],
  McLean: ['Area2::South', 'Language::English', 'Environment::Smoker'],
  Okafor: ['Area::Berkshire', 'Language::English', 'Customer Only::Lives alone'],
};

export const ALL_CUSTOMERS: CustomerBookings[] = [
  ...CUSTOMER_BOOKINGS,
  ...CUSTOMERS_LIST_DUMMY.filter(c => c.surname in UNBOOKED).map(c => ({
    id: c.surname.toLowerCase(),
    name: c.fullName,
    surname: c.surname,
    href: c.href,
    tags: UNBOOKED[c.surname],
    bookings: [],
  })),
].sort((x, y) => x.surname.localeCompare(y.surname));
