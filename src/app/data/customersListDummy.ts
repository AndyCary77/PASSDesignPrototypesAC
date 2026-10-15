// Static, made-up customers for the "new list layout" demo on the Customers
// list (see CustomersListDummy.tsx). Lets the card pattern be designed against
// a realistic spread — photos vs initials, with/without chips, long addresses,
// "+N more" overflow — rather than just our three scenario customers.
//
// The three scenario customers (Arthur, Edith, Vera) are built from the real
// CUSTOMERS records so they still link through to their own pages; everything
// else is dummy and doesn't navigate anywhere.
import { CUSTOMERS, type CustomerProfile } from './customers';
import davidPhoto from '../components/mobile/assets/img/Customer=David Farrington.png';
import jimPhoto from '../components/mobile/assets/img/Customer=Jim McLean.png';
import harinderPhoto from '../components/mobile/assets/img/Customer=Harinder Kulkarni.png';
import maryPhoto from '../components/mobile/assets/img/Customer=Mary McCarthy.png';
import hilaryPhoto from '../components/mobile/assets/img/Customer=Hilary Buxton.png';
import samPhoto from '../components/mobile/assets/img/Customer=Sam Malone.png';

/** A custom attribute ("Territory: Hampshire") or a colour-coded region (with a map pin). */
export type ListChip =
  | { type: 'attr'; key: string; value: string }
  | { type: 'region'; label: string; bg: string; fg: string; border: string };

export type ListStatus = 'assessment-booked' | 'assessment-completed' | 'active' | 'inactive' | 'finished';

export const STATUS_LABEL: Record<ListStatus, string> = {
  'assessment-booked': 'Assessment booked',
  'assessment-completed': 'Assessment completed',
  active: 'Active',
  inactive: 'Inactive',
  finished: 'Finished',
};

/** dd-mm-yyyy, `days` from today — keeps the review-date filters demonstrable whenever the prototype is opened. */
export function reviewIn(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

export interface ListCustomer {
  id: string;
  fullName: string;
  /** Sort/section key — the surname, since the list is grouped A–Z by it. */
  surname: string;
  photo?: string;
  initials: string;
  /** Avatar background for initials, as a hex (text is always dark grey). */
  avatarColor: string;
  status: ListStatus;
  highRisk?: boolean;
  dnacpr?: boolean;
  dols?: boolean;
  allergies?: boolean;
  /** dd-mm-yyyy */
  reviewDate?: string;
  reviewOverdue?: boolean;
  chips: ListChip[];
  dob: string;
  telephone?: string;
  address: string;
  /** Only the real scenario customers link somewhere. */
  href?: string;
}

const REGION = {
  teal: { bg: '#e0f1f4', fg: '#004753', border: '#a6d6de' },
  blue: { bg: '#e5ecfd', fg: '#13337a', border: '#b3c8f8' },
  pink: { bg: '#fbe4e9', fg: '#750f25', border: '#f5b0bf' },
  green: { bg: '#e3f4e1', fg: '#1f5a1a', border: '#b5dcb0' },
  amber: { bg: '#fdf0d5', fg: '#6b4400', border: '#f1d18f' },
  violet: { bg: '#eee8fb', fg: '#3d2380', border: '#cbbdf0' },
} as const;

const region = (label: string, color: keyof typeof REGION): ListChip => ({ type: 'region', label, ...REGION[color] });
const attr = (key: string, value: string): ListChip => ({ type: 'attr', key, value });

const AVATAR = ['#c9b4de', '#b7dda8', '#b1c8de', '#f0c9a8', '#a8d8d4', '#e8b4c4'];

function fromScenario(c: CustomerProfile, surname: string, extra: Partial<ListCustomer>): ListCustomer {
  return {
    id: c.id,
    fullName: c.fullName,
    surname,
    photo: c.photo,
    initials: c.initials,
    avatarColor: AVATAR[0],
    status: c.status === 'active' ? 'active' : 'assessment-completed',
    highRisk: c.highRisk,
    dnacpr: c.dnacpr,
    dols: c.dols,
    reviewDate: c.reviewDate?.replace(/\//g, '-'),
    reviewOverdue: c.reviewDaysLeft !== undefined && c.reviewDaysLeft <= 0,
    chips: [],
    dob: c.dob,
    telephone: c.tel,
    address: c.addressOneLine,
    href: `/customers/${c.id}/${c.landingTab === 'carebridge' ? 'caremanagement' : c.landingTab}`,
    ...extra,
  };
}

const dummy = (
  id: string,
  fullName: string,
  surname: string,
  o: Partial<ListCustomer> & Pick<ListCustomer, 'dob' | 'address'>,
  i: number,
): ListCustomer => ({
  id,
  fullName,
  surname,
  initials: fullName.replace(/^(Mr|Mrs|Ms|Miss|Master|Dr) /, '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(),
  avatarColor: AVATAR[i % AVATAR.length],
  status: 'active',
  chips: [],
  ...o,
});

const LIST: ListCustomer[] = [
  fromScenario(CUSTOMERS['arthur-barrington'], 'Barrington', {
    chips: [attr('Territory', 'West Midlands'), attr('Area', 'Sutton'), region('Warwickshire', 'teal'), attr('Environment', 'Smoker')],
  }),
  fromScenario(CUSTOMERS['vera-bramwell'], 'Bramwell', {
    avatarColor: AVATAR[5],
    reviewDate: '14-11-2026',
    chips: [attr('Territory', 'Staffordshire'), region('Tamworth', 'green'), attr('Environment', 'Cats')],
  }),
  dummy('d-bennett', 'Mrs Jean Bennett', 'Bennett', {
    telephone: '01902 442 118', dob: '30/03/1941', address: '14 Orchard Way, Wolverhampton, WV3 9DT',
    chips: [attr('Territory', 'West Midlands'), region('Wolverhampton', 'amber')],
  }, 1),
  dummy('d-buxton', 'Mrs Hilary Buxton', 'Buxton', {
    photo: hilaryPhoto, dnacpr: true, reviewDate: reviewIn(3), dob: '12/09/1936', telephone: '01283 551 204',
    address: '3 Church Lane, Burton upon Trent, DE14 2AB',
    chips: [attr('Territory', 'Staffordshire'), region('Burton', 'violet')],
  }, 2),
  fromScenario(CUSTOMERS['edith-caldwell'], 'Caldwell', {
    avatarColor: AVATAR[2],
    reviewDate: '28-10-2026',
    chips: [attr('Territory', 'Staffordshire'), region('Lichfield', 'blue'), attr('Environment', 'Dogs')],
  }),
  dummy('d-compston', 'Mr Martin Compston', 'Compston', {
    reviewDate: reviewIn(0), dob: '11/05/1984', address: 'East wing first floor, Cody Technology Park, Concorde Road, GU14 0LS',
    chips: [attr('Apples', 'cherry'), region('Berkshire', 'teal'), region('Hampshire', 'blue'), attr('Area2', 'South'), attr('Environment', 'Smoker'), attr('Territory', 'Hampshire')],
  }, 3),
  dummy('d-customer', 'Mr another customer', 'customer', {
    dob: '05/10/2026', address: '5 Highfield Road, Alum Rock, B8 3QD',
    chips: [attr('Apples', 'cherry'), region('Surrey', 'pink'), attr('Area2', 'South'), attr('Territory', 'Kent')],
  }, 4),
  dummy('d-customer1', 'Master Wednesday Customer 1', 'Customer 1', {
    dob: '08/01/2001', address: '1 The Heritage Wednesbury Road, WS1 3RD',
    chips: [attr('Apples', 'lemon'), region('Berkshire', 'teal'), attr('Area2', 'South'), attr('Environment', 'Cats'), attr('Environment', 'Env Test 1'), attr('Environment', 'Other Pets'), attr('Territory', 'Kent')],
  }, 5),
  dummy('d-ellis', 'Mr Colin Ellis', 'Ellis', {
    dols: true, dob: '21/06/1938', telephone: '0121 773 0921', address: '9 Hagley Road, Edgbaston, B16 8PA',
    chips: [attr('Territory', 'West Midlands'), attr('Environment', 'Smoker')],
  }, 0),
  dummy('d-farrington', 'Mr David Farrington', 'Farrington', {
    photo: davidPhoto, highRisk: true, dnacpr: true, dols: true, reviewDate: reviewIn(90), dob: '06/12/1937',
    address: '54 Reading Road, RG41 1EH',
    chips: [attr('Apples', 'lemon'), attr('Area2', 'South'), region('Berkshire', 'teal'), region('Hampshire', 'blue'), attr('Territory', 'Berkshire'), attr('Environment', 'Cats'), attr('Environment', 'Smoker'), attr('Environment', 'Oxygen')],
  }, 1),
  dummy('d-fitzgerald', 'Mrs Nora Fitzgerald', 'Fitzgerald', {
    telephone: '01543 280 337', dob: '17/04/1943', address: '28 Beacon Street, Lichfield, WS13 7AA',
    chips: [attr('Territory', 'Staffordshire'), region('Lichfield', 'blue')],
  }, 2),
  dummy('d-gill', 'Mr Harbans Gill', 'Gill', {
    reviewDate: reviewIn(6), dob: '02/02/1946', telephone: '024 7655 1180', address: '77 Foleshill Road, Coventry, CV6 5AJ',
    chips: [attr('Territory', 'Warwickshire'), region('Coventry', 'green')],
  }, 3),
  dummy('d-grant', 'Mrs Ruth Grant', 'Grant', {
    dnacpr: true, dob: '25/08/1935', address: '6 Elm Close, Solihull, B91 3QP',
    chips: [attr('Territory', 'West Midlands'), region('Solihull', 'amber'), attr('Environment', 'Dogs')],
  }, 4),
  dummy('d-hall', 'Mr Stanley Hall', 'Hall', {
    reviewDate: reviewIn(60), dob: '14/11/1940', telephone: '01922 616 402', address: '41 Lichfield Road, Walsall, WS4 2DJ',
    chips: [attr('Territory', 'West Midlands')],
  }, 5),
  dummy('d-kulkarni', 'Mr Harinder Kulkarni', 'Kulkarni', {
    photo: harinderPhoto, highRisk: true, reviewDate: reviewIn(-5), reviewOverdue: true, dob: '09/07/1944',
    telephone: '0121 440 9382', address: '18 Park Avenue, Harborne, B17 9QT',
    chips: [attr('Territory', 'West Midlands'), region('Birmingham', 'pink'), attr('Environment', 'Smoker')],
  }, 0),
  dummy('d-malone', 'Mr Sam Malone', 'Malone', {
    photo: samPhoto, dob: '28/01/1950', telephone: '01384 255 619', address: '12 Kingswinford Road, Dudley, DY1 4NH',
    chips: [attr('Territory', 'West Midlands'), region('Dudley', 'violet')],
  }, 1),
  dummy('d-mccarthy', 'Mrs Mary McCarthy', 'McCarthy', {
    photo: maryPhoto, reviewDate: reviewIn(26), dob: '03/05/1939', address: '65 Station Road, Four Oaks, B74 4NX',
    chips: [attr('Territory', 'West Midlands'), region('Sutton Coldfield', 'teal'), attr('Environment', 'Cats')],
  }, 2),
  dummy('d-mclean', 'Mr Jim McLean', 'McLean', {
    photo: jimPhoto, dols: true, dob: '19/10/1941', telephone: '01782 331 075', address: '2 Queens Park Gardens, Stoke-on-Trent, ST1 4EX',
    chips: [attr('Territory', 'Staffordshire'), region('Stoke', 'amber')],
  }, 3),
  dummy('d-okafor', 'Mrs Grace Okafor', 'Okafor', {
    dob: '07/03/1948', telephone: '0121 603 7714', address: '33 Brookvale Road, Erdington, B23 6QU',
    chips: [attr('Territory', 'West Midlands'), region('Birmingham', 'pink')],
  }, 4),
  dummy('d-quinn', 'Mr Desmond Quinn', 'Quinn', {
    reviewDate: reviewIn(20), dob: '24/09/1937', telephone: '01785 249 160', address: '8 Rowley Park, Stafford, ST17 9AB',
    chips: [attr('Territory', 'Staffordshire'), region('Stafford', 'green')],
  }, 5),
  dummy('d-osborne', 'Mr Frank Osborne', 'Osborne', {
    status: 'finished', dob: '15/05/1931', telephone: '01283 702 118', address: '10 Orchard Close, Burton upon Trent, DE15 9QX',
    chips: [attr('Territory', 'Staffordshire'), region('Burton', 'violet')],
  }, 1),
  dummy('d-pike', 'Mr Leonard Pike', 'Pike', {
    status: 'assessment-booked', dob: '04/08/1947', telephone: '0121 561 4409', address: '67 Chester Road, Sutton Coldfield, B73 5BJ',
    chips: [attr('Territory', 'West Midlands'), region('Sutton Coldfield', 'teal')],
  }, 2),
  dummy('d-ward', 'Mrs Doris Ward', 'Ward', {
    status: 'inactive', dob: '27/02/1933', address: '3 Meadow View, Tamworth, B77 2AT',
    chips: [attr('Territory', 'Staffordshire'), region('Tamworth', 'green')],
  }, 3),
  dummy('d-taylor', 'Mrs Elsie Taylor', 'Taylor', {
    dnacpr: true, dob: '13/06/1934', address: '19 Mill Lane, Nuneaton, CV11 4HP',
    chips: [attr('Territory', 'Warwickshire'), region('Nuneaton', 'blue'), attr('Environment', 'Oxygen')],
  }, 0),
  dummy('d-thomas', 'Mr Gareth Thomas', 'Thomas', {
    dob: '01/12/1952', telephone: '01922 722 540', address: '51 Bridge Street, Walsall, WS1 1JQ',
    chips: [attr('Territory', 'West Midlands'), attr('Environment', 'Smoker')],
  }, 1),
  dummy('d-walker', 'Mrs Pauline Walker', 'Walker', {
    reviewDate: reviewIn(45), dob: '29/07/1945', telephone: '01543 506 233', address: '4 Cannock Road, Rugeley, WS15 2HD',
    chips: [attr('Territory', 'Staffordshire'), region('Rugeley', 'violet')],
  }, 2),
];

// Extra tags (Language, Medical Conditions) so the tag filter has more than
// territory/area groups to show — merged in here rather than repeated inline.
// Allergies flag (the card badge and the "Alerts" filter) — a handful of
// customers, including Arthur (who carries it on the mobile prototype too) and Edith.
const ALLERGIES = new Set(['arthur-barrington', 'edith-caldwell', 'd-buxton', 'd-ellis', 'd-grant', 'd-quinn', 'd-taylor', 'd-mclean']);

const EXTRA_TAGS: Record<string, ListChip[]> = {
  'd-gill': [attr('Language', 'Punjabi')],
  'd-kulkarni': [attr('Language', 'Gujarati')],
  'd-okafor': [attr('Language', 'Igbo')],
  'd-ellis': [attr('Medical Conditions', 'Diabetes')],
  'd-fitzgerald': [attr('Medical Conditions', 'Dementia')],
  'd-grant': [attr('Medical Conditions', 'Diabetes')],
  'd-taylor': [attr('Medical Conditions', 'COPD')],
};

export const CUSTOMERS_LIST_DUMMY: ListCustomer[] = LIST.map(c => ({ ...c, allergies: ALLERGIES.has(c.id) || undefined, chips: [...c.chips, ...(EXTRA_TAGS[c.id] ?? [])] })).sort((a, b) => a.surname.localeCompare(b.surname));
