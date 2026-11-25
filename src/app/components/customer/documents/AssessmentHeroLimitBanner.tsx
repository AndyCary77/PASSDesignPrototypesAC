import { useId } from 'react';
import { Link } from 'react-router';
import { Info } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../../ui/hover-card';
import { useFeatureFlag } from '../../../data/FeatureFlagsContext';
import { getAssessmentHeroAllowance, isAllowanceNearlyUsed, isAllowanceUsedUp, type AssessmentHeroAllowance } from '../../../data/assessmentHeroAllowance';
import { officeTabPath } from '../../office/OfficeContext';
import assessmentHeroIconUrl from '../../icons/assessment-hero.svg';

function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

/**
 * Shown on Assessment Hero document pages once the office's monthly document
 * allowance is nearly used (80% or more) and again once it's used up
 * (AIOP-25747). The allowance belongs to the whole office, so this appears for
 * every customer, not one. Deliberately the same slim single-line shape as the
 * "Assessment Hero - AI-powered document drafts…" invitation banner, in amber
 * either way: nearly used is a heads-up, used up is blocked for now but clears
 * by itself on the 1st of the month — neither is an error, so neither is red. The
 * detail lives behind the info icon. role="status" so it's announced when the
 * page loads without interrupting.
 */
export function AssessmentHeroLimitBanner({ allowance }: { allowance: AssessmentHeroAllowance }) {
  const meterId = useId();
  const usedUp = allowance.remaining <= 0;
  const canViewOfficeUsage = useFeatureFlag('canViewOfficeAssessmentHero');
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 shadow"
      role="status"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <img src={assessmentHeroIconUrl} className="w-6 h-6 flex-shrink-0" alt="" />
        <p className="text-body font-medium text-gray-900">
          {usedUp ? (
            <>
              Your office has used all its Assessment Hero documents for this month — available again from{' '}
              <strong>{formatDate(allowance.renewsAt)}</strong>
            </>
          ) : (
            <>
              <strong>
                Only {allowance.remaining} Assessment Hero {allowance.remaining === 1 ? 'document' : 'documents'} left
              </strong>{' '}
              for your office this month — the allowance renews on <strong>{formatDate(allowance.renewsAt)}</strong>
            </>
          )}
        </p>
      </div>

      {/* Hover (and keyboard focus) rather than click — the detail is
          reference, not a task, so it shouldn't need a deliberate tap. */}
      <HoverCard openDelay={100} closeDelay={150}>
        <HoverCardTrigger asChild>
          <button
            type="button"
            aria-label="About the Assessment Hero document allowance"
            className="flex-shrink-0 rounded-full p-1 text-amber-800 hover:bg-amber-100 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50"
          >
            <Info className="w-5 h-5" />
          </button>
        </HoverCardTrigger>
        <HoverCardContent align="end" className="w-96 p-5">
          <p className="text-base font-semibold text-gray-900">Assessment Hero document allowance</p>
          <p className="text-body text-gray-800 mt-1.5">
            {usedUp ? (
              <>
                Your office has used all {allowance.limit} of its Assessment Hero documents for this month, so no new documents can
                be drafted for any customer or careworker right now.
              </>
            ) : (
              <>
                Your office has used {allowance.used} of its {allowance.limit} Assessment Hero documents for this month. Once they
                are used up, no new documents can be drafted for any customer or careworker until the allowance resets.
              </>
            )}
          </p>

          <div className="mt-3">
            <p id={meterId} className="text-body font-semibold text-gray-900">
              {allowance.used} of {allowance.limit} documents used · resets on the 1st of every month
            </p>
            <div
              role="progressbar"
              aria-labelledby={meterId}
              aria-valuemin={0}
              aria-valuemax={allowance.limit}
              aria-valuenow={allowance.used}
              className="mt-1.5 h-2 rounded-full bg-amber-200 overflow-hidden"
            >
              <div className="h-full bg-amber-600" style={{ width: `${Math.min(100, (allowance.used / allowance.limit) * 100)}%` }} />
            </div>
          </div>

          <p className="text-body text-gray-800 mt-3">
            Renews on <strong>{formatDate(allowance.renewsAt)}</strong>
            {' '}(in {allowance.daysUntilRenewal} {allowance.daysUntilRenewal === 1 ? 'day' : 'days'}). Usage goes back to 0 then, for the whole office.
          </p>

          <ul className="mt-3 list-disc pl-5 space-y-1 text-body text-gray-700">
            <li>The allowance is shared across your whole office and all customers and careworkers, not set per customer or careworker.</li>
            <li>Every document Assessment Hero drafts counts once, including drafts that are later discarded.</li>
            <li>
              {usedUp ? 'Recordings' : 'If the allowance runs out, recordings'} and transcripts are still saved, and documents can
              still be completed by hand.
            </li>
          </ul>

          {canViewOfficeUsage && (
            <p className="text-body mt-3">
              <Link to={officeTabPath('hero')} className="font-semibold text-[rgb(154,38,214)] hover:underline focus-visible:underline outline-none">
                See where the documents went
              </Link>
            </p>
          )}
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}

/**
 * Whether the office's Assessment Hero allowance is used up — what every
 * drafting control (Change recording(s), Replace recording, Update
 * documents…) checks so it can disable itself in step with the banner.
 */
export function isAssessmentHeroLimitReached() {
  return isAllowanceUsedUp(getAssessmentHeroAllowance());
}

/** Whether the banner is due: the allowance is nearly used or used up. Drafting is only blocked once it's used up. */
export function shouldShowAllowanceBanner(allowance: AssessmentHeroAllowance | null): allowance is AssessmentHeroAllowance {
  return isAllowanceUsedUp(allowance) || isAllowanceNearlyUsed(allowance);
}

/** The banner, or nothing while the office has plenty of documents left. */
export function AssessmentHeroLimitNotice() {
  const allowance = getAssessmentHeroAllowance();
  if (!shouldShowAllowanceBanner(allowance)) return null;
  return <AssessmentHeroLimitBanner allowance={allowance} />;
}

export const LIMIT_REACHED_TITLE = "Your office has used all its Assessment Hero documents for this month";
