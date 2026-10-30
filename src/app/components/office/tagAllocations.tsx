import { Ban, House, Lock, Star, User, UserCheck, type LucideIcon } from 'lucide-react';
import { TAG_TYPE_GROUPS, type TagSummary, type TagType } from './tagsMockData';
import { ALL_CUSTOMERS, ALL_EMPLOYEES, hash, pick, tagMembers, type TagPerson } from './tagMembers';

// Made-up data for the Tag assignments and Missing tags views: who a tag is applied to,
// and in which of the six places a tag can sit. Deterministic, so the same tag always shows
// the same people; the people come from the Customers and Employees lists.

// ─── Placements ─────────────────────────────────────────────────────────────

export type Placement = 'customer-tag' | 'employee-tag' | 'restriction' | 'mandatory' | 'preferred' | 'environment';

export interface PlacementInfo {
  id: Placement;
  /** Plain English, as shown on the screens. */
  label: string;
  /** The name used in the tickets and the guide, kept as secondary text. */
  ticketLabel: string;
  group: 'profile' | 'roster';
  /** Who it's about. */
  entity: 'customer' | 'employee';
  /** One line on what it does. */
  description: string;
  Icon: LucideIcon;
}

export const PLACEMENTS: PlacementInfo[] = [
  { id: 'customer-tag', label: 'Customer has', ticketLabel: 'Customer tag', group: 'profile', entity: 'customer', description: "A tag on the customer's profile, used for grouping and filtering.", Icon: User },
  { id: 'employee-tag', label: 'Employee has', ticketLabel: 'Employee tag', group: 'profile', entity: 'employee', description: "A tag on the employee's profile, used for grouping and filtering.", Icon: UserCheck },
  { id: 'restriction', label: 'Employee restriction', ticketLabel: 'Employee restriction', group: 'roster', entity: 'employee', description: "From the employee's Roster Matching Profile. Anything that stops them attending a visit; for now, a home environment tag on the customer (pets, smoking).", Icon: Ban },
  { id: 'mandatory', label: 'Customer needs', ticketLabel: 'Customer mandatory requirement', group: 'roster', entity: 'customer', description: 'From Care requirements. Only employees who have this tag can be matched.', Icon: Lock },
  { id: 'preferred', label: 'Customer prefers', ticketLabel: 'Customer preferred requirement', group: 'roster', entity: 'customer', description: 'From Care requirements. Employees who have this tag are matched first.', Icon: Star },
  { id: 'environment', label: 'Home has', ticketLabel: 'Customer environment', group: 'roster', entity: 'customer', description: 'Household conditions (pets, smoking). Used to rule out employees with a matching restriction.', Icon: House },
];

export const PLACEMENT_GROUPS = [
  { id: 'profile' as const, label: 'On their profile' },
  { id: 'roster' as const, label: 'In roster matching' },
];

export const placementInfo = (id: Placement) => PLACEMENTS.find(p => p.id === id)!;

// ─── Allocations ────────────────────────────────────────────────────────────

export type PersonKind = 'customer' | 'employee';
export const kindOf = (p: TagPerson): PersonKind => (p.id.startsWith('c-') ? 'customer' : 'employee');

export interface Allocation {
  id: string;
  tagType: TagType;
  tag: TagSummary;
  placement: Placement;
  person: TagPerson;
  kind: PersonKind;
  /**
   * Requirements only. 'customer' is the customer's default, as in PASS today. 'visit' is the
   * preview of tags that could be set on one visit instead, which is switched off (see VISIT_LEVEL).
   */
  scope: 'customer' | 'visit';
  visit?: string;
}

export const ALL_TAG_TYPES: TagType[] = TAG_TYPE_GROUPS.flatMap(g => g.tagTypes);

const VISITS = ['Morning visit', 'Lunch visit', 'Teatime visit', 'Bedtime visit'];

/**
 * Whether some requirements are shown as set on a single visit. Parked until the customer table is
 * right: with it off, every requirement is a customer default, and the screens don't mention visits.
 */
const VISIT_LEVEL = false;

// How many people sit in the roster-matching places for a tag (the profile counts come from the
// tag's own usage count). Only some tags are used this way.
const ROSTER_COUNTS: Record<string, Partial<Record<Placement, number>>> = {
  dogs: { environment: 6, restriction: 5 },
  cats: { environment: 4, restriction: 4 },
  'other-pets': { environment: 2, restriction: 2 },
  smoker: { environment: 5, restriction: 4 },
  duodopa: { mandatory: 4, preferred: 1 },
  dementia: { mandatory: 2, preferred: 2 },
  parkinsons: { mandatory: 1 },
  stroke: { mandatory: 1 },
  copd: { preferred: 1 },
  nights: { mandatory: 2, preferred: 1 },
  'live-in-setting': { mandatory: 1 },
  english: { preferred: 3 },
  polish: { preferred: 1 },
  'punjabi-urdu': { mandatory: 1, preferred: 1 },
  hindi: { preferred: 1 },
  'north-tyneside': { preferred: 2 },
  'live-in': { mandatory: 1 },
};

/**
 * A tag type that's mandatory (at onboarding) for customers, employees or both. For now only Territory:
 * everyone should have one, and it's what the Missing tags view looks for.
 */
export const MANDATORY_TYPES: { typeId: string; entities: PersonKind[] }[] = [
  { typeId: 'territory', entities: ['customer', 'employee'] },
];

export const typeName = (typeId: string) => ALL_TAG_TYPES.find(t => t.id === typeId)?.name ?? typeId;

/** Active people only: finished customers, leavers and inactive people are never "missing" anything. */
export const isActive = (p: TagPerson) => !p.finished && p.note !== 'Inactive';

/** Whether this person lacks a mandatory tag type (decided by a seeded 1-in-9, so it's stable). */
function lacks(person: TagPerson, typeId: string) {
  const kind = kindOf(person);
  const rule = MANDATORY_TYPES.find(m => m.typeId === typeId);
  return !!rule && rule.entities.includes(kind) && isActive(person) && hash(`${person.id}-${typeId}`) % 9 === 0;
}

/** A mandatory tag assigned from the Missing tags view. */
export interface Assigned {
  person: TagPerson;
  typeId: string;
  tagId: string;
}

/** One tag added to, or removed from, one place on one person, from the bulk edit. */
export interface BulkChange {
  op: 'add' | 'remove';
  person: TagPerson;
  tagTypeId: string;
  tagId: string;
  placement: Placement;
}

/**
 * Why a tag can't go in a placement, or null if it can. This is a first cut of the rules the
 * bulk edit applies, to be confirmed: Environment tags only describe a home (customers) or a
 * restriction (employees); a plain profile tag needs the tag type to apply to that kind of person.
 */
export function placementProblem(kind: PersonKind, type: TagType, placement: Placement): string | null {
  const info = placementInfo(placement);
  if (info.entity !== kind) return `Only for ${info.entity === 'customer' ? 'customers' : 'employees'}`;
  if (type.id === 'environment') {
    return placement === 'environment' || placement === 'restriction'
      ? null
      : `${type.name} tags can only go in "${placementInfo(kind === 'customer' ? 'environment' : 'restriction').label}"`;
  }
  if (placement === 'environment') return 'Only Environment tags can go here';
  if (placement === 'customer-tag' && !type.appliesTo.includes('Customers')) return `${type.name} doesn't apply to customers`;
  if (placement === 'employee-tag' && !type.appliesTo.includes('Employees')) return `${type.name} doesn't apply to employees`;
  return null;
}

export function buildAllocations(assigned: Assigned[], bulk: BulkChange[] = []): Allocation[] {
  const out: Allocation[] = [];
  const push = (a: Omit<Allocation, 'id' | 'kind' | 'scope'> & { scope?: Allocation['scope'] }) =>
    out.push({ ...a, scope: a.scope ?? 'customer', kind: kindOf(a.person), id: `${a.tag.id}|${a.placement}|${a.person.id}` });

  for (const tagType of ALL_TAG_TYPES) {
    const isEnv = tagType.id === 'environment';
    for (const tag of tagType.tags) {
      // On their profile. Environment is its own thing for customers, so it isn't also a plain tag.
      if (!isEnv) {
        const members = tagMembers(tagType, tag);
        if (tagType.appliesTo.includes('Customers')) {
          members.customers.filter(p => !lacks(p, tagType.id)).forEach(person => push({ tagType, tag, placement: 'customer-tag', person }));
        }
        if (tagType.appliesTo.includes('Employees')) {
          members.employees.filter(p => !lacks(p, tagType.id)).forEach(person => push({ tagType, tag, placement: 'employee-tag', person }));
        }
      }

      // In roster matching.
      const counts = ROSTER_COUNTS[tag.id] ?? {};
      if (counts.environment) pick(ALL_CUSTOMERS, counts.environment, `${tag.id}-env`).forEach(person => push({ tagType, tag, placement: 'environment', person }));
      if (counts.restriction) pick(ALL_EMPLOYEES, counts.restriction, `${tag.id}-res`).forEach(person => push({ tagType, tag, placement: 'restriction', person }));
      for (const placement of ['mandatory', 'preferred'] as const) {
        const n = counts[placement];
        if (!n) continue;
        pick(ALL_CUSTOMERS, n, `${tag.id}-${placement}`).forEach(person => {
          // Roughly one requirement in three is shown as set on a single visit, for the preview.
          const h = hash(`${person.id}-${tag.id}-${placement}`);
          const onVisit = VISIT_LEVEL && h % 3 === 0;
          push({ tagType, tag, placement, person, scope: onVisit ? 'visit' : 'customer', visit: onVisit ? VISITS[h % VISITS.length] : undefined });
        });
      }
    }
  }

  // Tags given from the Missing tags view are now on the person's profile.
  for (const a of assigned) {
    const tagType = ALL_TAG_TYPES.find(t => t.id === a.typeId);
    const tag = tagType?.tags.find(t => t.id === a.tagId);
    if (!tagType || !tag) continue;
    push({ tagType, tag, placement: kindOf(a.person) === 'customer' ? 'customer-tag' : 'employee-tag', person: a.person });
  }

  // Then the bulk edits, in order. An add never duplicates one that's already there, and a
  // remove only takes out that tag in that placement, nothing else on the person.
  let result = out;
  for (const c of bulk) {
    const key = `${c.tagId}|${c.placement}|${c.person.id}`;
    if (c.op === 'remove') {
      result = result.filter(a => a.id !== key);
    } else if (!result.some(a => a.id === key)) {
      const tagType = ALL_TAG_TYPES.find(t => t.id === c.tagTypeId);
      const tag = tagType?.tags.find(t => t.id === c.tagId);
      if (tagType && tag) result = [...result, { id: key, tagType, tag, placement: c.placement, person: c.person, kind: kindOf(c.person), scope: 'customer' }];
    }
  }
  return result;
}

// ─── Missing tags ───────────────────────────────────────────────────────────

export interface MissingRow {
  person: TagPerson;
  kind: PersonKind;
  /** The mandatory tag types they have no tag from. */
  missing: string[];
  /** When they're next needed, which is how the list is ordered. */
  next: string;
  urgency: number;
}

const NEXT_DAYS = ['Today', 'Tomorrow', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const pad = (n: number) => String(n).padStart(2, '0');

export function buildMissing(assigned: Assigned[]): MissingRow[] {
  const done = new Set(assigned.map(a => `${a.person.id}|${a.typeId}`));
  const rows: MissingRow[] = [];
  for (const person of [...ALL_CUSTOMERS, ...ALL_EMPLOYEES]) {
    const missing = MANDATORY_TYPES.filter(m => lacks(person, m.typeId) && !done.has(`${person.id}|${m.typeId}`)).map(m => m.typeId);
    if (missing.length === 0) continue;
    const h = hash(`${person.id}-next`);
    const day = h % NEXT_DAYS.length;
    const urgency = day * 100 + ((7 + (h % 12)) * 4 + (h % 4));
    rows.push({
      person,
      kind: kindOf(person),
      missing,
      next: `${NEXT_DAYS[day]} ${pad(7 + (h % 12))}:${pad((h % 4) * 15)}`,
      urgency,
    });
  }
  return rows.sort((a, b) => a.urgency - b.urgency || a.person.name.localeCompare(b.person.name));
}
