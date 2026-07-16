import arthurPhoto from '../imports/david_f.jpg';

export type CustomerStatus = 'active' | 'assessment-completed' | 'assessment-booked' | 'inactive';

export interface CustomerProfile {
  id: string;
  fullName: string;          // e.g. "Mr Arthur Barrington"
  photo?: string;
  initials: string;
  initialsColor: string;     // tailwind classes for the initials avatar
  status: CustomerStatus;
  statusLabel: string;       // display label, e.g. "ACTIVE"
  dob: string;
  nhs?: string;
  tel?: string;
  mob?: string;
  addressLines: string[];    // street / locality lines (no postcode)
  suburb?: string;
  postcode: string;
  addressOneLine: string;    // full address for the condensed header
  dnacpr?: boolean;
  highRisk?: boolean;
  dols?: boolean;
  /** Whether a care plan / assessment already exists. Drives CareBridge CTA + empty states. */
  hasCarePlan: boolean;
  reviewDate?: string;
  reviewDaysLeft?: number;
  /** Tab a customer card links to (their most relevant landing screen). */
  landingTab: string;
}

export const CUSTOMERS: Record<string, CustomerProfile> = {
  'arthur-barrington': {
    id: 'arthur-barrington',
    fullName: 'Mr Arthur Barrington',
    photo: arthurPhoto,
    initials: 'AB',
    initialsColor: 'bg-purple-100 text-[rgb(109,27,152)]',
    status: 'active',
    statusLabel: 'ACTIVE',
    dob: '22/07/1937',
    nhs: '488 754 3816',
    tel: '0121 353 4695',
    mob: '07980 077250 (David)',
    addressLines: ['91 Westwood Road'],
    suburb: 'Sutton Coldfield',
    postcode: 'B73 6UJ',
    addressOneLine: '91 Westwood Road, Sutton Coldfield, B73 6UJ',
    dnacpr: true,
    highRisk: true,
    hasCarePlan: true,
    reviewDate: '20/09/2026',
    reviewDaysLeft: 67,
    landingTab: 'caremanagement',
  },
  'edith-caldwell': {
    id: 'edith-caldwell',
    fullName: 'Mrs Edith Caldwell',
    initials: 'EC',
    initialsColor: 'bg-teal-100 text-teal-700',
    status: 'assessment-completed',
    statusLabel: 'ASSESSMENT COMPLETED',
    dob: '03/02/1942',
    tel: '01543 415 208',
    mob: '07712 660 145 (Susan, daughter)',
    addressLines: ['7 Meadowbank Close'],
    suburb: 'Lichfield',
    postcode: 'WS13 6RT',
    addressOneLine: '7 Meadowbank Close, Lichfield, WS13 6RT',
    hasCarePlan: false,
    landingTab: 'carebridge',
  },
};

export const DEFAULT_CUSTOMER = CUSTOMERS['arthur-barrington'];

export function getCustomer(id?: string): CustomerProfile {
  return (id && CUSTOMERS[id]) || DEFAULT_CUSTOMER;
}

export const CUSTOMER_LIST: CustomerProfile[] = [
  CUSTOMERS['arthur-barrington'],
  CUSTOMERS['edith-caldwell'],
];
