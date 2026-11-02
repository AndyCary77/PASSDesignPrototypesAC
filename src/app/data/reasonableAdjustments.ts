// Mock data for the Reasonable Adjustments tab (AIOP-25290 / AIOP-22349).
//
// The three sections, their order and the display wording follow the NHS
// Reasonable Adjustment Flag integration spec (v1.14) as summarised on the
// RAF audit page. The valuesets themselves (adjustment categories, impairments)
// are the real NHS ones — see nhsRafValuesets.ts. The records below are demo data.

import { ADJUSTMENT_CATEGORIES } from './nhsRafValuesets';

export { ADJUSTMENT_CATEGORIES, IMPAIRMENT_VALUES, type RafValue, type RafAdjustmentCategory } from './nhsRafValuesets';

export type RafSection = 'adjustment' | 'impairment' | 'condition';

export interface RafItem {
  id: string;
  section: RafSection;
  /** Valueset code: SNOMED CT for adjustments, the harmonised-standard number for impairments. Never shown. */
  code: string;
  /** Adjustments only: which of the 11 categories (1–11) this was added under. */
  categoryCode?: string;
  /** Display value, exactly as recorded from the valueset. */
  term: string;
  freeText?: string;
  /** ISO date (yyyy-mm-dd). */
  addedOn: string;
  addedBy: string;
  organisation: string;
  /** Set when removed. Inactive items are never shown — the spec says made inactive with an end date, not hard-deleted. */
  endedOn?: string;
  /** 'national' = came from the national flag (another organisation's entry), absent = recorded in PASS. */
  source?: 'national';
}

export interface RafRecord {
  createdOn: string;
  createdBy: string;
  /** Set when the flag was created elsewhere and imported, so "Created on" can say who and where. */
  createdByOrganisation?: string;
  lastUpdatedOn: string;
  items: RafItem[];
  source?: 'national';
}

/** Who the user is acting as — used for "Added: … by …" on anything created in the prototype. */
export const CURRENT_USER = { name: 'Sharon Hunter', organisation: 'Everylife Care' };

/** Category 11, "Bespoke reasonable adjustments": the only category whose single value needs free text to mean anything. */
export const BESPOKE_CATEGORY_CODE = '11';

/** "Other (please specify)" needs text; "Patient would prefer not to say" can't be combined with anything. */
export const IMPAIRMENT_OTHER_CODE = '10';
export const IMPAIRMENT_PREFER_NOT_TO_SAY_CODE = '12';

export const REMOVAL_REASONS: { value: string; label: string; hint: string }[] = [
  { value: 'error', label: 'Added in error', hint: 'It should never have been recorded.' },
  { value: 'patient-objection', label: 'The person objects', hint: 'The person does not want it recorded or shared.' },
  { value: 'best-interest', label: 'Best interest', hint: 'Removing it is in the person’s best interests.' },
  { value: 'does-not-apply', label: 'No longer applies', hint: 'It was correct once, but is not needed now.' },
];

export const MAX_FREE_TEXT = 5000;

const NHS_PRACTICE = { addedBy: 'Dr Anita Patel', organisation: 'Tamworth Medical Practice' };
const LOCAL = { addedBy: 'Sharon Hunter', organisation: 'Everylife Care' };

const EYE_CLINIC = { addedBy: 'Priya Shah', organisation: 'Midlands Community Eye Clinic' };

/**
 * What the NHS national flag holds for a person PASS has no record for yet. Used when PASS
 * checks and finds it (see "found" in RafAccessContext), so the same content is used for any
 * such customer. Everything here was added by other organisations, hence `source: 'national'`.
 */
const NATIONAL_FLAG: RafRecord = {
  createdOn: '2026-03-02',
  createdBy: 'Dr Anita Patel',
  createdByOrganisation: 'Tamworth Medical Practice',
  lastUpdatedOn: '2026-06-11',
  source: 'national',
  items: [
    { id: 'n1', section: 'adjustment', code: '957371000000106', categoryCode: '4', term: 'Requires written information in at least 28 point sans serif font', addedOn: '2026-03-02', ...NHS_PRACTICE, source: 'national' },
    { id: 'n2', section: 'adjustment', code: '1108131000000104', categoryCode: '5', term: 'Requires appointment reminders', freeText: 'Send a reminder by letter a week before any appointment.', addedOn: '2026-03-02', ...NHS_PRACTICE, source: 'national' },
    { id: 'n3', section: 'adjustment', code: '1325421000000100', categoryCode: '5', term: 'Requires approach to care to be discussed with carer', freeText: 'A family member should be present when changes to care are discussed.', addedOn: '2026-06-11', ...EYE_CLINIC, source: 'national' },
    { id: 'n4', section: 'impairment', code: '1', term: 'Vision (for example blindness or partial sight)', addedOn: '2026-06-11', ...EYE_CLINIC, source: 'national' },
  ],
};

/** Changes "another organisation" makes in the demo, one per simulated update, in this order. */
const NATIONAL_CHANGES: Omit<RafItem, 'id' | 'addedOn'>[] = [
  { section: 'adjustment', code: '936741000000100', categoryCode: '3', term: 'Requires contact by email', ...NHS_PRACTICE, source: 'national' },
  { section: 'adjustment', code: '796161000000101', categoryCode: '4', term: 'Requires information in Easyread', ...NHS_PRACTICE, source: 'national' },
  { section: 'adjustment', code: '198061000000105', categoryCode: '1', term: 'Uses hearing loop', ...NHS_PRACTICE, source: 'national' },
];

const RAF_RECORDS: Record<string, RafRecord> = {
  // Arthur has enough adjustments (8) to spill onto a second page, so the
  // pagination the spec asks for ("paginate rather than truncate") shows.
  'arthur-barrington': {
    createdOn: '2026-09-14',
    createdBy: 'Sharon Hunter',
    lastUpdatedOn: '2026-10-21',
    items: [
      { id: 'a1', section: 'adjustment', code: '285055002', categoryCode: '1', term: 'Does use hearing aid', freeText: 'Hearing aids are kept in a pot on the bedside table. Check the batteries before the visit starts.', addedOn: '2026-09-14', ...LOCAL },
      { id: 'a2', section: 'adjustment', code: '737350008', categoryCode: '5', term: 'Needs assistance with communication', freeText: 'Arthur is hard of hearing in his left ear. Sit or stand on his right-hand side.', addedOn: '2026-09-14', ...LOCAL },
      { id: 'a3', section: 'adjustment', code: '936721000000107', categoryCode: '3', term: 'Requires contact by letter', freeText: 'Leave a note in the folder in the hallway after any change to his visits.', addedOn: '2026-09-22', ...LOCAL },
      { id: 'a4', section: 'adjustment', code: '957351000000102', categoryCode: '4', term: 'Requires written information in at least 24 point sans serif font', addedOn: '2026-09-14', ...LOCAL },
      { id: 'a5', section: 'adjustment', code: '1108171000000102', categoryCode: '8', term: 'Requires extended appointment', freeText: 'Allow extra time at each visit. Arthur likes to take his time over decisions.', addedOn: '2026-09-22', ...LOCAL },
      { id: 'a6', section: 'adjustment', code: '1325771000000108', categoryCode: '10', term: 'Screening for risk of falls indicated', freeText: 'Uses a wheeled frame outside. Allow extra time at the front door and on the two steps to the garden.', addedOn: '2026-09-14', ...LOCAL },
      { id: 'a7', section: 'adjustment', code: '1108131000000104', categoryCode: '5', term: 'Requires appointment reminders', freeText: 'Offer visits at a consistent time of day, and remind Arthur the evening before any change.', addedOn: '2026-10-21', ...LOCAL },
      { id: 'a8', section: 'adjustment', code: '1108111000000107', categoryCode: '11', term: 'Requires reasonable adjustment for health and care access (Equality Act 2010)', freeText: 'The doorbell cannot be heard from the back room. Knock firmly, then call out your name.', addedOn: '2026-10-21', ...LOCAL },
      { id: 'i1', section: 'impairment', code: '2', term: 'Hearing (for example deafness or partial hearing)', addedOn: '2026-09-14', ...LOCAL },
      { id: 'i2', section: 'impairment', code: '3', term: 'Mobility (for example walking short distances or climbing stairs)', freeText: 'Fractured hip in 2025. Some ongoing pain and reduced mobility.', addedOn: '2026-09-14', ...LOCAL },
      { id: 'c1', section: 'condition', code: 'osteoarthritis', term: 'Osteoarthritis', addedOn: '2026-08-03', ...NHS_PRACTICE, source: 'national' },
      { id: 'c2', section: 'condition', code: 'hypertension', term: 'Essential hypertension', addedOn: '2026-08-03', ...NHS_PRACTICE, source: 'national' },
    ],
  },
  'edith-caldwell': {
    createdOn: '2026-10-02',
    createdBy: 'Sharon Hunter',
    lastUpdatedOn: '2026-10-02',
    items: [
      { id: 'a1', section: 'adjustment', code: '957351000000102', categoryCode: '4', term: 'Requires written information in at least 24 point sans serif font', addedOn: '2026-10-02', ...LOCAL },
      { id: 'a2', section: 'adjustment', code: '1325771000000108', categoryCode: '10', term: 'Screening for risk of falls indicated', freeText: 'Uses a walking frame indoors. Needs a hand with the two steps down to the back door.', addedOn: '2026-10-02', ...LOCAL },
      { id: 'a3', section: 'adjustment', code: '1108171000000102', categoryCode: '8', term: 'Requires extended appointment', freeText: 'Allow extra time. Edith is slower on her feet since her hip fracture.', addedOn: '2026-10-02', ...LOCAL },
      { id: 'i1', section: 'impairment', code: '3', term: 'Mobility (for example walking short distances or climbing stairs)', addedOn: '2026-10-02', ...LOCAL },
      { id: 'c1', section: 'condition', code: 'osteoarthritis', term: 'Osteoarthritis', addedOn: '2026-09-18', ...NHS_PRACTICE, source: 'national' },
    ],
  },
};

export function getRafRecord(customerId: string): RafRecord | null {
  const record = RAF_RECORDS[customerId];
  return record ? { ...record, items: record.items.map(i => ({ ...i })) } : null;
}

export function getNationalFlag(): RafRecord {
  return { ...NATIONAL_FLAG, items: NATIONAL_FLAG.items.map(i => ({ ...i })) };
}

/** The next change another organisation "makes" that PASS doesn't already hold, or null once they've all landed. */
export function nextNationalChange(record: RafRecord): RafItem | null {
  const held = new Set(record.items.filter(i => !i.endedOn).map(i => i.code));
  const next = NATIONAL_CHANGES.find(c => !held.has(c.code));
  return next ? { ...next, id: `nat-${Date.now()}`, addedOn: todayIso() } : null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** dd-Mmm-yyyy, e.g. 23-Apr-2024, as the spec requires everywhere a date is shown. */
export function formatRafDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(`${input}T00:00:00`) : input;
  return `${String(d.getDate()).padStart(2, '0')}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
}

export function formatRafDateTime(d: Date): string {
  return `${formatRafDate(d)} at ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Fixed display order: adjustments by category code then A–Z, impairments by code, conditions A–Z. Inactive items are dropped. */
export function activeItems(record: RafRecord, section: RafSection): RafItem[] {
  const items = record.items.filter(i => i.section === section && !i.endedOn);
  if (section === 'adjustment') {
    return items.sort((a, b) => Number(a.categoryCode) - Number(b.categoryCode) || a.term.localeCompare(b.term));
  }
  if (section === 'impairment') {
    return items.sort((a, b) => Number(a.code) - Number(b.code));
  }
  return items.sort((a, b) => a.term.localeCompare(b.term));
}

export function categoryName(code?: string): string {
  return ADJUSTMENT_CATEGORIES.find(c => c.code === code)?.name ?? '';
}
