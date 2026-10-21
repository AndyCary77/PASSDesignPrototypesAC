import { useId } from 'react';
import { Info } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../../ui/hover-card';
import { useCustomer } from '../../../data/CustomerContext';
import { getAssessmentHeroAllowance, type AssessmentHeroAllowance } from '../../../data/assessmentHeroAllowance';
import assessmentHeroIconUrl from '../../icons/assessment-hero.svg';

// "Mrs Edith Caldwell" -> "Edith". Titles are dropped so the copy reads like a
// person talking about a customer rather than a form letter.
const TITLES = new Set(['mr', 'mrs', 'ms', 'miss', 'mx', 'dr']);
function firstNameOf(fullName: string) {
  const parts = fullName.split(' ').filter(p => !TITLES.has(p.toLowerCase().replace('.', '')));
  return parts[0] ?? fullName;
}

function formatWhen(date: Date) {
  const day = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const time = date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: false });
  return `${day} at ${time}`;
}

/**
 * Shown on a customer's Assessment Hero document pages once their drafting
 * allowance for the rolling 30 days is used up. Deliberately the same slim
 * single-line shape as the "Assessment Hero - AI-powered document drafts…"
 * invitation banner it replaces, in amber (blocked for now, clears by
 * itself) rather than red (an error); the detail lives behind the info icon.
 * role="status" so it's announced when the page loads without interrupting.
 */
export function AssessmentHeroLimitBanner({ customerFullName, allowance }: { customerFullName: string; allowance: AssessmentHeroAllowance }) {
  const first = firstNameOf(customerFullName);
  const meterId = useId();
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 shadow"
      role="status"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <img src={assessmentHeroIconUrl} className="w-6 h-6 flex-shrink-0" alt="" />
        <p className="text-body font-medium text-gray-900">
          Assessment Hero limit reached for {first}
          {allowance.nextAvailableAt && <> — available again from <strong>{formatWhen(allowance.nextAvailableAt)}</strong></>}
        </p>
      </div>

      {/* Hover (and keyboard focus) rather than click — the detail is
          reference, not a task, so it shouldn't need a deliberate tap. */}
      <HoverCard openDelay={100} closeDelay={150}>
        <HoverCardTrigger asChild>
          <button
            type="button"
            aria-label="About the Assessment Hero drafting limit"
            className="flex-shrink-0 rounded-full p-1 text-amber-800 hover:bg-amber-100 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50"
          >
            <Info className="w-5 h-5" />
          </button>
        </HoverCardTrigger>
        <HoverCardContent align="end" className="w-96 p-5">
          <p className="text-base font-semibold text-gray-900">Assessment Hero drafting limit</p>
          <p className="text-body text-gray-800 mt-1.5">
            {first} has reached the limit of {allowance.limit} Assessment Hero drafts in the last 30 days, so no new
            documents can be drafted for {first} right now.
          </p>

          <div className="mt-3">
            <p id={meterId} className="text-body font-semibold text-gray-900">
              {allowance.used} of {allowance.limit} drafts used · rolling 30 days
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

          {allowance.nextAvailableAt && (
            <p className="text-body text-gray-800 mt-3">
              Next available: <strong>{formatWhen(allowance.nextAvailableAt)}</strong>
              {allowance.nextAvailableCount > 0 && <> ({allowance.nextAvailableCount === 1 ? '1 draft' : `${allowance.nextAvailableCount} drafts`})</>}
            </p>
          )}

          <ul className="mt-3 list-disc pl-5 space-y-1 text-body text-gray-700">
            <li>The limit is per customer and shared across everyone in your office.</li>
            <li>Every document Assessment Hero drafts counts, including drafts that are later discarded.</li>
            <li>Each draft frees up again 30 days after it was generated.</li>
            <li>Recordings and transcripts are still saved, and documents can still be completed by hand.</li>
          </ul>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}

/**
 * Whether the customer's Assessment Hero drafting allowance is used up —
 * what every drafting control (Change recording(s), Replace recording,
 * Update documents…) checks so it can disable itself in step with the banner.
 */
export function isAssessmentHeroLimitReached(customerId: string) {
  const allowance = getAssessmentHeroAllowance(customerId);
  return !!allowance && allowance.remaining <= 0;
}

/** The banner for the current customer, or nothing when they still have drafts left. */
export function AssessmentHeroLimitNotice() {
  const customer = useCustomer();
  const allowance = getAssessmentHeroAllowance(customer.id);
  if (!allowance || allowance.remaining > 0) return null;
  return <AssessmentHeroLimitBanner customerFullName={customer.fullName} allowance={allowance} />;
}

export const LIMIT_REACHED_TITLE = "Assessment Hero's drafting limit has been reached for this customer";
