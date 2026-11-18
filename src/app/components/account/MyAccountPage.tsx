import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { CalendarClock, TriangleAlert, Info } from 'lucide-react';
import { SegmentedControl } from '../buttons/SegmentedControl';
import { useFeatureFlag } from '../../data/FeatureFlagsContext';
import {
  CURRENT_USER_NAME,
  CURRENT_USER_ROLE,
  OFFICE_NAME,
  OFFICE_TYPE,
  getAssessmentHeroUsage,
  parseScenario,
  type AssessmentHeroUsage,
  type UsageRow,
} from '../../data/assessmentHeroUsage';
import assessmentHeroIconUrl from '../icons/assessment-hero.svg';

// Same convention as the avatar in the top bar: first initial of first + last name.
function initials(name: string) {
  const parts = name.split(' ').filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
}

function formatDate(d: Date, withYear = true) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' } : {}) });
}

type Level = 'ok' | 'near' | 'full';
const NEAR_THRESHOLD = 0.8;

function levelFor(usage: AssessmentHeroUsage): Level {
  if (usage.limit === null) return 'ok';
  if (usage.used >= usage.limit) return 'full';
  return usage.used / usage.limit >= NEAR_THRESHOLD ? 'near' : 'ok';
}

// The bar's colour never carries the state alone — the banner above and the
// "remaining" figure both say it in words too.
const BAR_COLOUR: Record<Level, string> = {
  ok: 'bg-[rgb(154,38,214)]',
  near: 'bg-amber-500',
  full: 'bg-red-600',
};

/**
 * My account — reached from the avatar menu. Read-only: it exists so people
 * who have been given Assessment Hero can see how much of the office's shared
 * monthly document allowance has been used, where it went, and when it
 * renews (AIOP-25747). `?demo=near|full|none` switches the scenario so each
 * state can be linked to directly from the landing page.
 */
export function MyAccountPage() {
  const canUseAssessmentHero = useFeatureFlag('canUseAssessmentHero');
  const [params] = useSearchParams();
  const usage = useMemo(() => getAssessmentHeroUsage(parseScenario(params.get('demo'))), [params]);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My account</h1>
      </div>

      <ProfileCard />

      {canUseAssessmentHero ? (
        <UsageSection usage={usage} />
      ) : (
        <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm px-5 py-6">
          <p className="text-base font-semibold text-gray-900">Assessment Hero isn't enabled for your account</p>
          <p className="text-body text-gray-600 mt-1">
            Ask your office manager to give you access, and your office's document usage will show here.
          </p>
        </div>
      )}
    </div>
  );
}

function ProfileCard() {
  return (
    <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4">
      <span
        aria-hidden="true"
        className="w-12 h-12 rounded-full bg-[#e3edf7] text-gray-800 text-base font-semibold flex items-center justify-center flex-shrink-0 select-none"
      >
        {initials(CURRENT_USER_NAME)}
      </span>
      <div className="min-w-0">
        <p className="text-lg font-semibold text-gray-900">{CURRENT_USER_NAME}</p>
        <p className="text-body text-gray-600">
          {CURRENT_USER_ROLE} · {OFFICE_NAME} ({OFFICE_TYPE})
        </p>
      </div>
    </div>
  );
}

function UsageSection({ usage }: { usage: AssessmentHeroUsage }) {
  return (
    <section aria-labelledby="ah-usage-heading" className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center gap-2.5">
        <img src={assessmentHeroIconUrl} alt="" className="w-6 h-6 flex-shrink-0" />
        <h2 id="ah-usage-heading" className="text-base font-semibold text-gray-900">
          Assessment Hero usage
        </h2>
      </div>

      {usage.limit === null ? <NoAllowance /> : <UsageBody usage={usage as AllowedUsage} />}
    </section>
  );
}

// Not "0 of 0" — an office that was never given an allowance hasn't used
// zero of something, it simply doesn't have one.
function NoAllowance() {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-xl font-semibold text-gray-900">No allowance set</p>
      <p className="text-body text-gray-600 mt-1.5 max-w-md mx-auto">
        Your office doesn't have an Assessment Hero document allowance yet, so there's no usage to show.
      </p>
    </div>
  );
}

// Usage once we know the office has an allowance (limit is a number).
type AllowedUsage = AssessmentHeroUsage & { limit: number };

function UsageBody({ usage }: { usage: AllowedUsage }) {
  const [view, setView] = useState<'customer' | 'employee'>('customer');
  const level = levelFor(usage);
  const pct = Math.min(100, Math.round((usage.used / usage.limit) * 100));
  const myCount = usage.byEmployee.find(r => r.isYou)?.count ?? 0;

  return (
    <div className="px-5 py-5 space-y-6">
      <p className="text-body text-gray-700">
        Your office has a pool of <strong>{usage.limit} documents</strong> each month. Everyone in the office who has been given
        Assessment Hero draws from the same pool.
      </p>

      {level !== 'ok' && <LevelBanner usage={usage} level={level} />}

      {/* Allowance / used / remaining. Remaining is the figure people act on, so it leads. */}
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Remaining" value={usage.remaining} emphasis />
        <Stat label="Used" value={usage.used} note={myCount > 0 ? `${myCount} by you` : undefined} />
        <Stat label="Total allowance" value={usage.limit} />
      </dl>

      <div>
        <div
          role="progressbar"
          aria-label="Assessment Hero documents used"
          aria-valuemin={0}
          aria-valuemax={usage.limit}
          aria-valuenow={usage.used}
          aria-valuetext={`${usage.used} of ${usage.limit} documents used`}
          className="h-3 w-full rounded-full bg-gray-200 overflow-hidden"
        >
          <div className={`h-full rounded-full transition-all ${BAR_COLOUR[level]}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-body text-gray-700 mt-2">
          <span className="font-semibold">{pct}%</span> of this month's allowance used
        </p>
      </div>

      {/* Renewal — stated plainly, with what actually happens on that day. */}
      <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <CalendarClock className="w-5 h-5 text-[rgb(154,38,214)] flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-body font-semibold text-gray-900">
            Renews on {formatDate(usage.renewsAt)}{' '}
            <span className="font-medium text-gray-600">
              (in {usage.daysUntilRenewal} {usage.daysUntilRenewal === 1 ? 'day' : 'days'})
            </span>
          </p>
          <p className="text-body text-gray-600">
            Current period: {formatDate(usage.periodStart, false)} – {formatDate(usage.renewsAt)}. Usage goes back to 0 when it
            renews.
          </p>
        </div>
      </div>

      <div className="pt-1">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Where usage has gone</h3>
          <SegmentedControl
            ariaLabel="Break usage down by"
            value={view}
            onChange={setView}
            options={[
              { value: 'customer', label: 'By customer' },
              { value: 'employee', label: 'By employee' },
            ]}
          />
        </div>

        <BreakdownTable
          key={view}
          rows={view === 'customer' ? usage.byCustomer : usage.byEmployee}
          nameHeading={view === 'customer' ? 'Customer' : 'Employee'}
          total={usage.used}
        />

        <p className="flex items-start gap-2 text-body text-gray-600 mt-3">
          <Info className="w-4 h-4 flex-shrink-0 mt-1" aria-hidden="true" />
          Each document Assessment Hero drafts counts once towards the allowance.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, note, emphasis }: { label: string; value: number; note?: string; emphasis?: boolean }) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${emphasis ? 'border-[rgb(154,38,214)]/40 bg-[rgb(250,244,253)]' : 'border-gray-200 bg-white'}`}>
      <dt className="text-body font-medium text-gray-600">{label}</dt>
      <dd className="mt-0.5">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        <span className="text-body text-gray-600 ml-1.5">documents</span>
        {note && <span className="block text-body text-gray-600">{note}</span>}
      </dd>
    </div>
  );
}

function LevelBanner({ usage, level }: { usage: AssessmentHeroUsage; level: Exclude<Level, 'ok'> }) {
  const renews = formatDate(usage.renewsAt);
  const isFull = level === 'full';
  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
        isFull ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'
      }`}
    >
      <TriangleAlert className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isFull ? 'text-red-700' : 'text-amber-700'}`} aria-hidden="true" />
      <p className="text-body font-medium text-gray-900">
        {isFull ? (
          <>The office has used all {usage.limit} documents. The allowance renews on {renews}.</>
        ) : (
          <>
            Only {usage.remaining} {usage.remaining === 1 ? 'document' : 'documents'} left this month. The allowance renews on{' '}
            {renews}.
          </>
        )}
      </p>
    </div>
  );
}

function BreakdownTable({ rows, nameHeading, total }: { rows: UsageRow[]; nameHeading: string; total: number }) {
  if (rows.length === 0) {
    return (
      <p className="text-body text-gray-600 rounded-lg border border-gray-200 px-4 py-6 text-center">
        No documents have been drafted yet this month.
      </p>
    );
  }
  const max = Math.max(...rows.map(r => r.count));

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th scope="col" className="px-4 py-2.5 text-sm font-semibold text-gray-700">
              {nameHeading}
            </th>
            <th scope="col" className="px-4 py-2.5 text-sm font-semibold text-gray-700 text-right whitespace-nowrap">
              Documents
            </th>
            <th scope="col" className="px-4 py-2.5 text-sm font-semibold text-gray-700 w-[38%] hidden sm:table-cell">
              Share of usage
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.map(row => (
            <tr key={row.name} className={row.isYou ? 'bg-[rgb(250,244,253)]' : undefined}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    aria-hidden="true"
                    className="w-8 h-8 rounded-full bg-[#e3edf7] text-gray-800 text-sm font-semibold flex items-center justify-center flex-shrink-0 select-none"
                  >
                    {initials(row.name)}
                  </span>
                  {row.customerId ? (
                    <Link
                      to={`/customers/${row.customerId}`}
                      className="text-body font-medium text-[rgb(154,38,214)] hover:underline focus-visible:underline outline-none"
                    >
                      {row.name}
                    </Link>
                  ) : (
                    <span className="text-body font-medium text-gray-900">{row.name}</span>
                  )}
                  {row.isYou && (
                    <span className="inline-flex items-center rounded-full border border-[rgb(154,38,214)]/40 bg-white px-2.5 py-0.5 text-sm font-semibold text-[rgb(154,38,214)]">
                      You
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-body font-semibold text-gray-900 text-right tabular-nums">{row.count}</td>
              <td className="px-4 py-3 hidden sm:table-cell">
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden" aria-hidden="true">
                    <div className="h-full rounded-full bg-[rgb(154,38,214)]" style={{ width: `${(row.count / max) * 100}%` }} />
                  </div>
                  <span className="text-body text-gray-700 w-10 text-right tabular-nums">{Math.round((row.count / total) * 100)}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50 border-t border-gray-200">
          <tr>
            <th scope="row" className="px-4 py-3 text-body font-semibold text-gray-900">
              Total
            </th>
            <td className="px-4 py-3 text-body font-bold text-gray-900 text-right tabular-nums">{total}</td>
            <td className="hidden sm:table-cell" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
