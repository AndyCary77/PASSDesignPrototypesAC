// Mocked response for the office-level Assessment Hero allowance (AIOP-25747,
// "My account"): one pool of documents per office per 30-day period, shared by
// every user who has been given access to Assessment Hero.
//
// Deliberately separate from assessmentHeroAllowance.ts, which models the
// older per-customer rolling-30-day limit — the two haven't been reconciled
// yet (see the notes handed back with this prototype).
//
// What counts: each document Assessment Hero drafts counts once. Usage
// resets to zero when the period renews, and the renewal date moves on 30
// days.

export const ASSESSMENT_HERO_PERIOD_DAYS = 30;
export const ASSESSMENT_HERO_OFFICE_ALLOWANCE = 300;

/** Who is "signed in" on My account — matches the TopNav's default user. */
export const CURRENT_USER_NAME = 'Alex Morgan';
export const CURRENT_USER_ROLE = 'Office manager';
export const OFFICE_NAME = 'Office Name';
export const OFFICE_TYPE = 'Domiciliary';

export type UsageScenario = 'default' | 'near' | 'full' | 'none';

export interface UsageRow {
  name: string;
  /** Documents drafted this period. */
  count: number;
  /** Present for customers that exist as real profiles in the prototype. */
  customerId?: string;
  /** True for the signed-in user's own row (employee breakdown). */
  isYou?: boolean;
}

export interface AssessmentHeroUsage {
  /** null = the office has no allowance configured ("No allowance set"). */
  limit: number | null;
  used: number;
  remaining: number;
  periodStart: Date;
  renewsAt: Date;
  daysUntilRenewal: number;
  byCustomer: UsageRow[];
  byEmployee: UsageRow[];
}

// Weights, not counts: the real counts are apportioned from `used` below, so
// each scenario's breakdown always adds up to exactly the total shown above it.
const CUSTOMERS: { row: Omit<UsageRow, 'count'>; weight: number }[] = [
  { row: { name: 'Arthur Barrington', customerId: 'arthur-barrington' }, weight: 30 },
  { row: { name: 'Edith Caldwell', customerId: 'edith-caldwell' }, weight: 24 },
  { row: { name: 'Vera Bramwell', customerId: 'vera-bramwell' }, weight: 18 },
  { row: { name: 'Harinder Kulkarni' }, weight: 14 },
  { row: { name: 'Mary McCarthy' }, weight: 12 },
  { row: { name: 'David Farrington' }, weight: 10 },
  { row: { name: 'Jim McLean' }, weight: 8 },
  { row: { name: 'Hilary Buxton' }, weight: 6 },
  { row: { name: 'Sam Malone' }, weight: 3 },
];

const EMPLOYEES: { row: Omit<UsageRow, 'count'>; weight: number }[] = [
  { row: { name: CURRENT_USER_NAME, isYou: true }, weight: 28 },
  { row: { name: 'Priya Shah' }, weight: 26 },
  { row: { name: 'Daniel Okafor' }, weight: 20 },
  { row: { name: 'Sophie Bennett' }, weight: 15 },
  { row: { name: 'Marcus Reid' }, weight: 11 },
  { row: { name: 'Hannah Lloyd' }, weight: 8 },
  { row: { name: 'Tom Whitaker' }, weight: 5 },
];

/** Largest-remainder split of `total` by weight — integer counts that sum exactly to `total`. */
function apportion(total: number, items: { row: Omit<UsageRow, 'count'>; weight: number }[]): UsageRow[] {
  const weightSum = items.reduce((s, i) => s + i.weight, 0);
  const shares = items.map(i => {
    const exact = (total * i.weight) / weightSum;
    return { item: i, count: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let leftover = total - shares.reduce((s, x) => s + x.count, 0);
  [...shares]
    .sort((a, b) => b.remainder - a.remainder)
    .forEach(x => {
      if (leftover > 0) {
        x.count += 1;
        leftover -= 1;
      }
    });
  return shares
    .map(x => ({ ...x.item.row, count: x.count }))
    .filter(r => r.count > 0)
    .sort((a, b) => b.count - a.count);
}

const USED_BY_SCENARIO: Record<Exclude<UsageScenario, 'none'>, number> = {
  default: 187,
  near: 276,
  full: ASSESSMENT_HERO_OFFICE_ALLOWANCE,
};

export function parseScenario(value: string | null): UsageScenario {
  return value === 'near' || value === 'full' || value === 'none' ? value : 'default';
}

export function getAssessmentHeroUsage(scenario: UsageScenario): AssessmentHeroUsage {
  // Relative to "now" so the demo never shows a renewal date in the past.
  const renewsAt = new Date();
  renewsAt.setDate(renewsAt.getDate() + 14);
  renewsAt.setHours(0, 0, 0, 0);
  const periodStart = new Date(renewsAt);
  periodStart.setDate(periodStart.getDate() - ASSESSMENT_HERO_PERIOD_DAYS);
  const daysUntilRenewal = 14;

  if (scenario === 'none') {
    return { limit: null, used: 0, remaining: 0, periodStart, renewsAt, daysUntilRenewal, byCustomer: [], byEmployee: [] };
  }

  const used = USED_BY_SCENARIO[scenario];
  return {
    limit: ASSESSMENT_HERO_OFFICE_ALLOWANCE,
    used,
    remaining: ASSESSMENT_HERO_OFFICE_ALLOWANCE - used,
    periodStart,
    renewsAt,
    daysUntilRenewal,
    byCustomer: apportion(used, CUSTOMERS),
    byEmployee: apportion(used, EMPLOYEES),
  };
}
