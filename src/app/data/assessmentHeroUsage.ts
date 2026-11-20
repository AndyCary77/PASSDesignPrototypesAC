// Mocked response for the office-level Assessment Hero allowance (AIOP-25747,
// "My account"): one pool of documents per office per calendar month, shared by
// every user who has been given access to Assessment Hero.
//
// This is now the only allowance model: the old per-customer rolling-30-day
// limit (12 per customer) is gone, and so is the idea of a rolling window for
// the office: usage resets on the 1st of every month (fixed reset, decided
// Nov 2026), and an office that joins part-way through a month gets the full
// monthly allowance for the rest of that month. Every warning and blocked state in the
// prototype (customer document pages, mobile Documents) reads from the same
// office-wide figures via assessmentHeroAllowance.ts, using the scenario
// below so they all agree.
//
// What counts: each document Assessment Hero drafts counts once. Usage
// resets to zero on the 1st of the next month.

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
  /** First day of the current calendar month. */
  periodStart: Date;
  /** Last day of the current calendar month. */
  periodEnd: Date;
  /** The 1st of next month, when usage goes back to 0. */
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

export const USAGE_SCENARIOS: { value: UsageScenario; label: string; description: string }[] = [
  { value: 'default', label: 'In use', description: `${USED_BY_SCENARIO.default} of ${ASSESSMENT_HERO_OFFICE_ALLOWANCE} used. No warnings.` },
  { value: 'near', label: 'Nearly used', description: `${USED_BY_SCENARIO.near} of ${ASSESSMENT_HERO_OFFICE_ALLOWANCE} used (80% or more).` },
  { value: 'full', label: 'Used up', description: 'Every document used. Drafting is blocked for everyone until the allowance resets on the 1st.' },
  { value: 'none', label: 'No allowance set', description: 'Assessment Hero is on, but no allowance has been configured.' },
];

// The office's allowance state is one fact, so it's one setting for the whole
// prototype: remembered for this browser tab (sessionStorage, so a new visit
// starts from "in use" again) and read by every screen that warns about it.
// `?demo=` on Office/My account and `?allowance=` on any other page set it, so a
// link can land straight on a state.
const SCENARIO_KEY = 'pass-ah-allowance-scenario';
const SCENARIO_CHANGED = 'pass-ah-allowance-scenario-changed';

export function getActiveScenario(): UsageScenario {
  if (typeof window === 'undefined') return 'default';
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('allowance');
    if (fromUrl !== null) setActiveScenario(parseScenario(fromUrl));
    return parseScenario(window.sessionStorage.getItem(SCENARIO_KEY));
  } catch {
    return 'default';
  }
}

export function setActiveScenario(scenario: UsageScenario) {
  try {
    if (window.sessionStorage.getItem(SCENARIO_KEY) === scenario) return;
    window.sessionStorage.setItem(SCENARIO_KEY, scenario);
    window.dispatchEvent(new Event(SCENARIO_CHANGED));
  } catch {
    /* storage unavailable: the scenario just stays at its default */
  }
}

export function onScenarioChanged(listener: () => void) {
  window.addEventListener(SCENARIO_CHANGED, listener);
  return () => window.removeEventListener(SCENARIO_CHANGED, listener);
}

export function getAssessmentHeroUsage(scenario: UsageScenario): AssessmentHeroUsage {
  // Fixed monthly reset: usage goes back to 0 on the 1st. Relative to "now" so
  // the demo is always mid-way through a real month.
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const renewsAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysUntilRenewal = Math.round((renewsAt.getTime() - today.getTime()) / 86_400_000);

  if (scenario === 'none') {
    return { limit: null, used: 0, remaining: 0, periodStart, periodEnd, renewsAt, daysUntilRenewal, byCustomer: [], byEmployee: [] };
  }

  const used = USED_BY_SCENARIO[scenario];
  return {
    limit: ASSESSMENT_HERO_OFFICE_ALLOWANCE,
    used,
    remaining: ASSESSMENT_HERO_OFFICE_ALLOWANCE - used,
    periodStart,
    periodEnd,
    renewsAt,
    daysUntilRenewal,
    byCustomer: apportion(used, CUSTOMERS),
    byEmployee: apportion(used, EMPLOYEES),
  };
}
