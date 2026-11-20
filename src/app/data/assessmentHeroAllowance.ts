// The allowance as the drafting screens see it (AIOP-25747): one monthly pool
// of documents for the whole office, shared by everyone who has been given
// Assessment Hero. It replaces the earlier per-customer rolling-30-day limit
// (12 per customer), so being out of documents is no longer something that
// happens to one customer — it blocks drafting for every customer until the
// pool resets.
//
// What counts: every document Assessment Hero drafts (assessments, other
// documents, each care plan section) uses 1 — one recording drafting 3
// documents uses 3, and drafts that are later discarded still count. The
// pool resets on the 1st of every month and usage goes back to 0.
//
// Numbers come from assessmentHeroUsage.ts so Office → Assessment Hero, My
// account and every warning here always agree.

import { getActiveScenario, getAssessmentHeroUsage } from './assessmentHeroUsage';

export interface AssessmentHeroAllowance {
  used: number;
  limit: number;
  remaining: number;
  /** The 1st of next month, when the pool resets and usage goes back to 0. */
  renewsAt: Date;
  daysUntilRenewal: number;
}

// Warn from this share of the pool used. Matches Office → Assessment Hero.
export const NEAR_ALLOWANCE_THRESHOLD = 0.8;

/**
 * The office's allowance, or null when there's nothing to warn about for
 * drafting: no allowance has been configured (the "No allowance set" state is
 * for managers to act on, it doesn't block anyone).
 */
export function getAssessmentHeroAllowance(): AssessmentHeroAllowance | null {
  const usage = getAssessmentHeroUsage(getActiveScenario());
  if (usage.limit === null) return null;
  return {
    used: usage.used,
    limit: usage.limit,
    remaining: usage.remaining,
    renewsAt: usage.renewsAt,
    daysUntilRenewal: usage.daysUntilRenewal,
  };
}

export const isAllowanceUsedUp = (a: AssessmentHeroAllowance | null) => !!a && a.remaining <= 0;
export const isAllowanceNearlyUsed = (a: AssessmentHeroAllowance | null) =>
  !!a && a.remaining > 0 && a.used / a.limit >= NEAR_ALLOWANCE_THRESHOLD;
