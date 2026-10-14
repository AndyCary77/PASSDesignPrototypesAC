// Mocked response of the Assessment Hero allowance API (AIOP-24762 sibling
// ticket for desktop): how many documents have been drafted for a customer
// in the rolling last 30 days, against the office's limit.
//
// What counts: every document Assessment Hero drafts (assessments, other
// documents, each care plan section) — one recording drafting 3 documents
// uses 3. Per customer, shared across everyone in the office; drafts that
// are later discarded still count; a draft frees up again 30 days after it
// was generated (so there's no single "renewal date" — `nextAvailableAt` is
// when the oldest counted draft ages out). The limit is a per-office,
// server-driven setting (default 12).

export const ASSESSMENT_HERO_DEFAULT_LIMIT = 12;

export interface AssessmentHeroAllowance {
  used: number;
  limit: number;
  remaining: number;
  /** When the next draft(s) become available again; null while allowance remains. */
  nextAvailableAt: Date | null;
  /** How many drafts free up at `nextAvailableAt` (drafts generated together age out together). */
  nextAvailableCount: number;
}

// Only Edith has used up her allowance in this prototype; every other
// customer is treated as having plenty left, so no limit UI shows for them.
export function getAssessmentHeroAllowance(customerId: string): AssessmentHeroAllowance | null {
  if (customerId !== 'edith-caldwell') return null;
  // Relative to "now" so the demo never shows a date in the past.
  const next = new Date();
  next.setDate(next.getDate() + 4);
  next.setHours(14, 15, 0, 0);
  return {
    used: ASSESSMENT_HERO_DEFAULT_LIMIT,
    limit: ASSESSMENT_HERO_DEFAULT_LIMIT,
    remaining: 0,
    nextAvailableAt: next,
    nextAvailableCount: 2,
  };
}
