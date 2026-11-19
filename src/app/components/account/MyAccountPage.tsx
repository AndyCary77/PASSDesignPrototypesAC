import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useAllowanceScenario } from '../../data/useAllowanceScenario';
import { useFeatureFlag } from '../../data/FeatureFlagsContext';
import {
  CURRENT_USER_NAME,
  CURRENT_USER_ROLE,
  OFFICE_NAME,
  OFFICE_TYPE,
  getAssessmentHeroUsage,
} from '../../data/assessmentHeroUsage';
import { LevelBanner, initials, levelFor } from '../office/AssessmentHeroUsageTab';
import { officeTabPath } from '../office/OfficeContext';
import assessmentHeroIconUrl from '../icons/assessment-hero.svg';

/**
 * My account — reached from the avatar menu. About the signed-in person, so
 * the Assessment Hero card here is only *their* part of the story: how many
 * documents they've drafted this month and how many the office has left.
 * The full office-wide breakdown (by customer and employee, renewal, etc.)
 * lives under Office → Assessment Hero, for managers (AIOP-25747).
 * `?demo=near|full|none` carries through to that page.
 */
export function MyAccountPage() {
  const canUseAssessmentHero = useFeatureFlag('canUseAssessmentHero');
  const [params] = useSearchParams();
  const demo = params.get('demo');
  const scenario = useAllowanceScenario();
  const usage = useMemo(() => getAssessmentHeroUsage(scenario), [scenario]);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My account</h1>
      </div>

      <ProfileCard />

      {canUseAssessmentHero && <MyUsageCard usage={usage} demo={demo} />}
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

function MyUsageCard({ usage, demo }: { usage: ReturnType<typeof getAssessmentHeroUsage>; demo: string | null }) {
  const canViewOffice = useFeatureFlag('canViewOfficeAssessmentHero');
  const mine = usage.byEmployee.find(r => r.isYou)?.count ?? 0;
  // The same warning managers get on Office → Assessment Hero (amber from 80%, red once used up). It's on
  // this card, which only people with Assessment Hero ever see, so it never reaches anyone it doesn't concern.
  const level = levelFor(usage);
  const officePath = officeTabPath('hero') + (demo ? `?demo=${encodeURIComponent(demo)}` : '');

  return (
    <section aria-labelledby="my-ah-heading" className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center gap-2.5">
        <img src={assessmentHeroIconUrl} alt="" className="w-6 h-6 flex-shrink-0" />
        <h2 id="my-ah-heading" className="text-base font-semibold text-gray-900">
          Your Assessment Hero usage
        </h2>
      </div>

      <div className="px-5 py-5 space-y-3">
        {level !== 'ok' && <LevelBanner usage={usage} level={level} />}

        <p className="text-body text-gray-700">
          <span className="text-3xl font-bold text-gray-900 align-middle">{mine}</span>{' '}
          <span className="align-middle">{mine === 1 ? 'document' : 'documents'} drafted by you this month</span>
        </p>

        {usage.limit === null ? (
          <p className="text-body text-gray-600">
            Your office doesn't have a monthly document allowance set up yet. Ask your office manager to check.
          </p>
        ) : (
          <p className="text-body text-gray-600">
            The office has <strong className="font-semibold text-gray-900">{usage.remaining}</strong> of {usage.limit} documents left
            this month, shared between everyone with Assessment Hero.
          </p>
        )}

        {canViewOffice && (
          <p className="text-body">
            <Link to={officePath} className="font-semibold text-[rgb(154,38,214)] hover:underline focus-visible:underline outline-none">
              View usage for the whole office
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
