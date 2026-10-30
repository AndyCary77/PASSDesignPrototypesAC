// Made-up "who has this tag" lists for the tag detail page, drawn from the same
// Customers and Employees lists the rest of the prototype uses so the names match.
// Deterministic (seeded by the tag's id) so a tag always shows the same people.

import { CUSTOMERS_LIST_DUMMY, STATUS_LABEL, type ListCustomer } from '../../data/customersListDummy';
import { EMPLOYEES_LIST_DUMMY, EMPLOYEE_STATUS_LABEL, type ListEmployee } from '../../data/employeesListDummy';
import type { TagSummary, TagType } from './tagsMockData';

export interface TagPerson {
  id: string;
  /** Without the title, as the chips show it ("Martin Compston"). */
  name: string;
  /** Shown in brackets after the name when they aren't a plain active person ("Assessment booked"). */
  note?: string;
  /** Finished customers / employee leavers — hidden until "Show finished" is ticked. */
  finished?: boolean;
  /** Employees only: their role (Careworker, Supervisor, Care Manager…), which is how they're described. */
  role?: string;
}

const stripTitle = (name: string) => name.replace(/^(Mr|Mrs|Ms|Miss|Dr|Prof) /, '');

const customerPerson = (c: ListCustomer): TagPerson => ({
  id: `c-${c.id}`,
  name: stripTitle(c.fullName),
  note: c.status === 'active' ? undefined : STATUS_LABEL[c.status],
  finished: c.status === 'finished',
});

const employeePerson = (e: ListEmployee): TagPerson => ({
  id: `e-${e.id}`,
  name: stripTitle(e.fullName),
  note: e.status === 'active' ? undefined : EMPLOYEE_STATUS_LABEL[e.status],
  finished: e.status === 'leaver',
  role: e.role,
});

export const ALL_CUSTOMERS: TagPerson[] = CUSTOMERS_LIST_DUMMY.map(customerPerson);
export const ALL_EMPLOYEES: TagPerson[] = EMPLOYEES_LIST_DUMMY.map(employeePerson);

export const hash = (s: string) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

/** `count` people from `pool`, starting at a point seeded by `seed`. */
export function pick(pool: TagPerson[], count: number, seed: string) {
  const n = Math.min(count, pool.length);
  const start = hash(seed) % Math.max(pool.length, 1);
  return Array.from({ length: n }, (_, i) => pool[(start + i) % pool.length]);
}

// Territory and Area are assigned per person rather than per tag, so the data stays tidy:
// everyone sits in exactly one territory, and their area(s) follow from it. Customers (and
// employees) mostly have a single area, with the odd second one (Live in, or a neighbouring area).
const TERRITORIES = [
  { tagId: 'territory-durham-north', weight: 1, areas: ['durham-north'], neighbour: 'sunderland' },
  { tagId: 'territory-north-tyneside', weight: 6, areas: ['north-tyneside', 'north-tyneside', 'north-tyneside', 'north-northumberland'], neighbour: 'north-northumberland' },
  { tagId: 'territory-sunderland', weight: 2, areas: ['sunderland'], neighbour: 'durham-north' },
];

function territoryOf(person: TagPerson) {
  const total = TERRITORIES.reduce((sum, t) => sum + t.weight, 0);
  let n = hash(`${person.id}-territory`) % total;
  return TERRITORIES.find(t => (n -= t.weight) < 0)!;
}

/** The one territory tag a person has. */
export const territoryTagOf = (person: TagPerson) => territoryOf(person).tagId;

function allAreaTagsOf(person: TagPerson) {
  const t = territoryOf(person);
  const first = t.areas[hash(`${person.id}-area`) % t.areas.length];
  if (hash(`${person.id}-area2`) % 5 !== 0) return [first];
  const second = hash(`${person.id}-area3`) % 2 === 0 ? 'live-in' : t.neighbour;
  return second === first ? [first] : [first, second];
}

const isEmployee = (person: TagPerson) => person.id.startsWith('e-');

/**
 * Live-in carers: the example office had no way to say a carer does live-in work, so it added
 * "Live-in" as an Area as a workaround. Those carers (plus anyone already eligible for live-in) now
 * have it as their care setting instead, and it's taken off their areas.
 */
export const isLiveInCarer = (person: TagPerson) =>
  isEmployee(person) && (allAreaTagsOf(person).includes('live-in') || hash(`${person.id}-care`) % 12 === 0);

/** A person's area tags: one, and about one in five also have a second. Carers' live-in has moved to care setting. */
export function areaTagsOf(person: TagPerson) {
  const areas = allAreaTagsOf(person);
  return isEmployee(person) ? areas.filter(a => a !== 'live-in') : areas;
}

// Language is also per person: only about one in five people has a language tag, and then just
// one. The first customer and the first employee who have one are given a second, as the demo of
// someone who speaks two.
const LANGUAGES = [
  { tagId: 'english', weight: 3 },
  { tagId: 'polish', weight: 3 },
  { tagId: 'romanian', weight: 2 },
  { tagId: 'punjabi-urdu', weight: 2 },
  { tagId: 'hindi', weight: 2 },
  { tagId: 'bengali-sylheti', weight: 2 },
  { tagId: 'portuguese', weight: 1 },
  { tagId: 'tagalog-filipino', weight: 1 },
  { tagId: 'yoruba-igbo', weight: 1 },
  { tagId: 'gujarati', weight: 1 },
  { tagId: 'arabic', weight: 1 },
  { tagId: 'twi-akan', weight: 1 },
];

function firstLanguageOf(person: TagPerson) {
  if (hash(`${person.id}-lang`) % 5 !== 0) return undefined;
  const total = LANGUAGES.reduce((sum, l) => sum + l.weight, 0);
  let n = hash(`${person.id}-lang1`) % total;
  return LANGUAGES.find(l => (n -= l.weight) < 0)!.tagId;
}

const withLanguage = (pool: TagPerson[]) => pool.filter(p => firstLanguageOf(p));
const twoLanguagePeople = new Set([withLanguage(ALL_CUSTOMERS)[0]?.id, withLanguage(ALL_EMPLOYEES)[0]?.id]);

/** A person's language tags: usually none, sometimes one, and one customer and one employee have two. */
export function languageTagsOf(person: TagPerson) {
  const first = firstLanguageOf(person);
  if (!first) return [];
  if (!twoLanguagePeople.has(person.id)) return [first];
  const others = LANGUAGES.filter(l => l.tagId !== first);
  return [first, others[hash(`${person.id}-lang2`) % others.length].tagId];
}

// Care setting is per person too: the availability types they're eligible for. Most are Day care, and
// about one in four is on live-in or nights instead (never more than one, and never alongside Day care).
/** The one care setting a person is eligible for. */
export const careSettingOf = (person: TagPerson) =>
  isLiveInCarer(person) ? 'live-in-setting' : [1, 2].includes(hash(`${person.id}-care`) % 12) ? 'nights' : 'day-care';

// Staff type follows the role: the office team are Office Staff, careworkers and supervisors Field Staff.
// A few active employees have none yet (about one in twelve), so there's something for a "missing" check to find.
const OFFICE_ROLES = ['Manager', 'Care Coordinator', 'Super user', 'Test'];
/** The one staff type an employee has, if they've been given one. */
export const staffTypeOf = (person: TagPerson) =>
  hash(`${person.id}-staff`) % 12 === 0 ? undefined : OFFICE_ROLES.includes(person.role ?? '') ? 'office-staff' : 'field-staff';

/**
 * Who's on a tag. The tag's usage count is split between employees and customers
 * (when the type applies to both, roughly one employee to three customers); each list
 * is capped at what the Customers and Employees lists hold, so very large counts
 * (e.g. 231) show a believable handful rather than every person.
 */
export function tagMembers(tagType: TagType, tag: TagSummary) {
  if (tagType.id === 'territory' || tagType.id === 'area' || tagType.id === 'language' || tagType.id === 'care-setting' || tagType.id === 'staff-type') {
    const has = (p: TagPerson) =>
      tagType.id === 'care-setting' ? careSettingOf(p) === tag.id
      : tagType.id === 'staff-type' ? staffTypeOf(p) === tag.id
      : tagType.id === 'territory' ? territoryTagOf(p) === tag.id
      : tagType.id === 'area' ? areaTagsOf(p).includes(tag.id)
      : languageTagsOf(p).includes(tag.id);
    return {
      employees: tagType.appliesTo.includes('Employees') ? ALL_EMPLOYEES.filter(has) : [],
      customers: tagType.appliesTo.includes('Customers') ? ALL_CUSTOMERS.filter(has) : [],
    };
  }
  const hasEmployees = tagType.appliesTo.includes('Employees');
  const hasCustomers = tagType.appliesTo.includes('Customers');
  const total = tag.count ?? 6;
  const employeeCount = hasEmployees ? (hasCustomers ? Math.round(total * 0.25) : total) : 0;
  const customerCount = hasCustomers ? total - (hasEmployees ? employeeCount : 0) : 0;
  return {
    employees: pick(ALL_EMPLOYEES, employeeCount, `${tag.id}-e`),
    customers: pick(ALL_CUSTOMERS, customerCount, `${tag.id}-c`),
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "Modified" and "Created" lines for the footer of the tag type and tag pages. */
export function tagAudit(id: string) {
  const h = hash(id);
  const modified = `${pad(1 + (h % 27))}/${pad(1 + (h % 9))}/2026 ${pad(8 + (h % 10))}:${pad(h % 60)}`;
  return { modified: `${modified} by Admin`, created: '05/03/2025 by Admin' };
}
