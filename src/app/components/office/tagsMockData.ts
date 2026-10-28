// Dummy data for the Office › Tags prototype page. Modelled on a real PASS
// tenant's tag-type list (see the DOM sample + reference screenshot supplied
// when this page was built) — trimmed down to a believable handful of tags
// per type rather than the full lists (Medical Conditions alone runs to ~50
// tags in prod).

export interface TagSummary {
  id: string;
  name: string;
  /** Omit to match tag types that don't surface a usage count (e.g. Care Setting, Language). */
  count?: number;
  /** Omit for an uncoloured/"plain" pill — only Area has colours assigned. */
  colour?: { bg: string; text: string; border: string };
}

export interface TagType {
  id: string;
  name: string;
  appliesTo: Array<'Customers' | 'Employees'>;
  description: string;
  limitOnePerTag?: boolean;
  mandatoryOnboarding?: boolean;
  /** Flags this as the new type this page exists to prototype banners for. */
  isNew?: boolean;
  tags: TagSummary[];
}

export interface TagTypeGroup {
  heading: string;
  tagTypes: TagType[];
}

// Five-tone pastel palette lifted from the real tenant's chip colours —
// used for Area only; every other tag type renders plain/uncoloured pills.
export const PALETTE = [
  { bg: '#f8e9ef', text: '#65263d', border: '#eabfcf' }, // pink
  { bg: '#e0f1f1', text: '#004947', border: '#a6d7d6' }, // teal
  { bg: '#eaeefa', text: '#2a3c70', border: '#c2cef1' }, // blue
  { bg: '#e0f2e9', text: '#004c26', border: '#a6d9c0' }, // green
  { bg: '#f7ebe0', text: '#632e00', border: '#e9c5a6' }, // orange
];

export const TAG_TYPE_GROUPS: TagTypeGroup[] = [
  {
    heading: 'Default Tags',
    tagTypes: [
      {
        id: 'area',
        name: 'Area',
        appliesTo: ['Customers', 'Employees'],
        description: 'Contains the different locations or areas your service are grouped into',
        tags: [
          { id: 'durham-north', name: 'Durham North', count: 58, colour: PALETTE[0] },
          { id: 'live-in', name: 'Live in', count: 25, colour: PALETTE[1] },
          { id: 'north-northumberland', name: 'North Northumberland', count: 107, colour: PALETTE[2] },
          { id: 'north-tyneside', name: 'North Tyneside', count: 231, colour: PALETTE[3] },
          { id: 'sunderland', name: 'Sunderland', count: 80, colour: PALETTE[4] },
        ],
      },
      {
        id: 'territory',
        name: 'Territory',
        appliesTo: ['Customers', 'Employees'],
        description: 'Contains the different territories your service are split into',
        tags: [
          { id: 'territory-durham-north', name: 'Durham North', count: 24 },
          { id: 'territory-north-tyneside', name: 'North Tyneside', count: 321 },
          { id: 'territory-sunderland', name: 'Sunderland', count: 54 },
        ],
      },
      {
        id: 'environment',
        name: 'Environment',
        appliesTo: ['Customers', 'Employees'],
        description: 'Environmental considerations for visits',
        isNew: true,
        tags: [
          { id: 'dogs', name: 'Dogs', count: 0 },
          { id: 'cats', name: 'Cats', count: 0 },
          { id: 'other-pets', name: 'Other Pets', count: 0 },
          { id: 'smoker', name: 'Smoker', count: 0 },
        ],
      },
      {
        id: 'medical-conditions',
        name: 'Medical Conditions',
        appliesTo: ['Customers', 'Employees'],
        description:
          'Contains the top 50 most commonly used medical conditions held within PASS. A customer is assigned this tag for their medical condition. An employee can be assigned this tag to show that they have knowledge and/or training with a medical condition.',
        tags: [
          { id: 'dementia', name: 'Dementia', count: 4 },
          { id: 'parkinsons', name: 'Parkinson’s disease', count: 2 },
          { id: 'stroke', name: 'Stroke', count: 1 },
          { id: 'diabetes', name: 'Diabetes mellitus', count: 0 },
          { id: 'epilepsy', name: 'Epilepsy', count: 0 },
          { id: 'copd', name: 'COPD - Chronic obstructive pulmonary disease', count: 3 },
        ],
      },
      {
        id: 'training-qualifications',
        name: 'Training & Qualifications',
        appliesTo: ['Employees'],
        description: 'Contains the different training and qualifications your employees have',
        tags: [
          { id: 'duodopa', name: 'Duodopa', count: 10 },
        ],
      },
      {
        id: 'care-setting',
        name: 'Care Setting',
        appliesTo: ['Employees'],
        description: 'Care settings an employee can work in, used by the AI solver for roster matching.',
        tags: [
          { id: 'live-in-setting', name: 'Live-in' },
          { id: 'waking-night', name: 'Waking Night' },
          { id: 'sleeping-night', name: 'Sleeping Night' },
        ],
      },
      {
        id: 'language',
        name: 'Language',
        appliesTo: ['Customers', 'Employees'],
        description: 'Contains the languages spoken by your customers and employees',
        tags: [
          { id: 'english', name: 'English' },
          { id: 'romanian', name: 'Romanian' },
          { id: 'polish', name: 'Polish' },
          { id: 'punjabi-urdu', name: 'Punjabi / Urdu' },
          { id: 'hindi', name: 'Hindi' },
          { id: 'tagalog-filipino', name: 'Tagalog / Filipino' },
          { id: 'yoruba-igbo', name: 'Yoruba / Igbo' },
          { id: 'portuguese', name: 'Portuguese' },
          { id: 'bengali-sylheti', name: 'Bengali / Sylheti' },
          { id: 'gujarati', name: 'Gujarati' },
          { id: 'arabic', name: 'Arabic' },
          { id: 'twi-akan', name: 'Twi / Akan' },
        ],
      },
      {
        id: 'staff-type',
        name: 'Staff Type',
        appliesTo: ['Employees'],
        description: 'Identifies whether an employee is based in the office or works in the field',
        tags: [
          { id: 'office-staff', name: 'Office Staff' },
          { id: 'field-staff', name: 'Field Staff' },
        ],
      },
    ],
  },
];
