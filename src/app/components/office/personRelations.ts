import { ALL_CUSTOMERS, ALL_EMPLOYEES, hash, isLiveInCarer, type TagPerson } from './tagMembers';

// The lists on a profile that name people, not tags. On an employee's Roster Matching Profile: careworkers
// they're disfavoured to double up with, customers they're preferred for, and customers they're excluded
// from. On a customer's Care requirements: preferred employees and excluded careworkers. Made up like
// the rest, and stable per person. Finished people are never named.

export interface EmployeeRelations {
  disfavoured: TagPerson[];
  preferred: TagPerson[];
  excluded: TagPerson[];
}

const activeCustomers = ALL_CUSTOMERS.filter(c => !c.finished);
const activeEmployees = ALL_EMPLOYEES.filter(e => !e.finished);

/** Up to `max` distinct people from `pool` (never `not`), none if the 1-in-`oneIn` seed doesn't land. */
function some(pool: TagPerson[], seed: string, oneIn: number, max: number, not?: TagPerson) {
  if (hash(`${seed}-has`) % oneIn !== 0) return [];
  const n = 1 + (hash(`${seed}-n`) % max);
  const out: TagPerson[] = [];
  for (let i = 0; out.length < n && i < pool.length; i++) {
    const p = pool[(hash(`${seed}-at`) + i * 7) % pool.length];
    if (p !== not && !out.includes(p)) out.push(p);
  }
  return out;
}

export function relationsOf(person: TagPerson): EmployeeRelations {
  return {
    // Live-in carers don't double up, so nobody is disfavoured for them.
    disfavoured: isLiveInCarer(person) ? [] : some(activeEmployees, `${person.id}-dis`, 5, 1, person),
    preferred: some(activeCustomers, `${person.id}-pref`, 3, 2),
    excluded: some(activeCustomers, `${person.id}-exc`, 5, 1),
  };
}

export interface CustomerRelations {
  preferred: TagPerson[];
  excluded: TagPerson[];
}

export function customerRelationsOf(person: TagPerson): CustomerRelations {
  const preferred = some(activeEmployees, `${person.id}-pemp`, 3, 2);
  return {
    preferred,
    // Never someone they also prefer.
    excluded: some(activeEmployees, `${person.id}-xemp`, 5, 1).filter(e => !preferred.includes(e)),
  };
}

// ─── Edits ──────────────────────────────────────────────────────────────────

/** Careworkers who can be named, as the bulk edit's picker offers them. */
export const CAREWORKERS = activeEmployees;

/** Live-in carers don't double up, so nobody is disfavoured for them. */
export const doublesUp = (person: TagPerson) => !isLiveInCarer(person);

/** One careworker added to, or taken off, someone's disfavoured list, from the bulk edit. */
export interface RelationChange {
  op: 'add' | 'remove';
  /** Whose list it is. */
  person: TagPerson;
  relation: 'disfavoured';
  /** The careworker named. */
  other: TagPerson;
}

/** An employee's disfavoured careworkers: the made-up starting list with the bulk edits made since applied in order. */
export function disfavouredOf(person: TagPerson, changes: RelationChange[] = []): TagPerson[] {
  let list = relationsOf(person).disfavoured;
  for (const c of changes) {
    if (c.person.id !== person.id || c.relation !== 'disfavoured') continue;
    list = c.op === 'add'
      ? (list.some(p => p.id === c.other.id) ? list : [...list, c.other])
      : list.filter(p => p.id !== c.other.id);
  }
  return list;
}
