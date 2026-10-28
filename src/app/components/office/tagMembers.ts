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

/**
 * Who's on a tag. The tag's usage count is split between employees and customers
 * (when the type applies to both, roughly one employee to three customers); each list
 * is capped at what the Customers and Employees lists hold, so very large counts
 * (e.g. 231) show a believable handful rather than every person.
 */
export function tagMembers(tagType: TagType, tag: TagSummary) {
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
