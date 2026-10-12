// Mock data model for the Office "Settings and Permissions" tab — the values
// shown on the live Bromley office. No backend, so this is a plain typed
// const standing in for what a real settings payload would carry, following
// the same lightweight pattern as officeMockData.ts and tagsMockData.ts.

export interface MockEmployee {
  id: string;
  name: string;
}

export interface RosterPermissions {
  scheduleView: string[];
  scheduleEdit: string[];
  finance: string[];
}

/** Which person Assessment Hero drafts in. */
export type DraftVoice = 'first' | 'third';

/** One voice per kind of output, since each is read by someone different. */
export interface AssessmentHeroVoice {
  /** Assessment documents — read by the customer, office and reviewers. */
  documents: DraftVoice;
  /** Outcomes — read by office staff, and kept in the care plan record. */
  outcomes: DraftVoice;
  /** Tasks — read by carers on the care app. */
  tasks: DraftVoice;
}

export interface OfficeSettings {
  // Overdue and missed visits
  /** % of visits that can be overdue at once before the KPI indicator turns red. */
  overdueVisitsThresholdPct: number;
  overdueMins: number;
  missedMins: number;
  missedTimeCriticalMins: number;

  // Permanent allocation
  heatmapLink: 'customer' | 'employee';

  // Employee punctuality
  punctualityDeficitPct: number;
  tagLeewayMins: number;
  visitDurationPct: number;

  // Journal categories — name → enabled
  journalCategories: Record<string, boolean>;

  // Roster permissions — employee ids
  permissions: RosterPermissions;

  // Assessment Hero drafting voice
  assessmentHeroVoice: AssessmentHeroVoice;
}

export const JOURNAL_CATEGORIES = [
  'Note',
  'HR',
  'Scheduling',
  'On-call',
  'Incident',
  'Compliment',
  'Complaint',
  'Training',
  'Hospital (admissions/discharge)',
  'Medication',
  'Sickness',
  'Handbacks',
  'Finance',
  'Holiday',
  'Live in',
  'Minor Concerns',
];

export const MOCK_EMPLOYEES: MockEmployee[] = [
  'Aisha Rahman', 'Beverley Okafor', 'Callum Reid', 'Deepa Nair', 'Elaine Whitcombe',
  'Fatima Hussain', 'Grace Adeyemi', 'Hannah Lowry', 'Imran Sheikh', 'Joanne Pryce',
  'Karen Tilley', 'Liam Gallagher', 'Maria Santos', 'Nadia Karim', 'Olivia Marsh',
  'Priya Venkat', 'Quentin Ashby', 'Rebecca Doyle', 'Samir Patel', 'Tracy Holloway',
  'Usman Farooq', 'Vanessa Clarke', 'Wendy Brannigan', 'Xavier Mensah', 'Yvonne Stubbs',
  'Zainab Ali', 'Adrian Cole', 'Bronwen Hughes', 'Chidi Eze', 'Danielle Fox',
].map((name, i) => ({ id: `emp-${i + 1}`, name }));

const ids = (from: number, to: number) => MOCK_EMPLOYEES.slice(from, to).map((e) => e.id);

export const DEFAULT_OFFICE_SETTINGS: OfficeSettings = {
  overdueVisitsThresholdPct: 15,
  overdueMins: 15,
  missedMins: 30,
  missedTimeCriticalMins: 0,

  heatmapLink: 'customer',

  punctualityDeficitPct: 15,
  tagLeewayMins: 10,
  visitDurationPct: 20,

  journalCategories: Object.fromEntries(JOURNAL_CATEGORIES.map((c) => [c, true])),

  // Matches the live office's counts: 0 can view, 23 can edit, 11 have finance.
  permissions: {
    scheduleView: [],
    scheduleEdit: ids(0, 23),
    finance: ids(0, 11),
  },

  // Documents and outcomes stay in the customer's own voice; tasks are
  // instructions to the carer, so they default to third person.
  assessmentHeroVoice: { documents: 'first', outcomes: 'first', tasks: 'third' },
};
