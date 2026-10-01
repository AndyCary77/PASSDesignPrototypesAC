import assessmentHeroIconUrl from '../../icons/assessment-hero.svg'

// The same Assessment Hero brand mark used on desktop (CareBridgePage.tsx's
// own `assessmentHeroIconUrl`) — used everywhere the feature/brand itself is
// represented. CareBridgeIcon (mic + sparkles) stays reserved for screens
// where a recording is actually in progress or about to start.
export default function AssessmentHeroIcon({ size = 24, className = '' }) {
  return <img src={assessmentHeroIconUrl} width={size} height={size} alt="" className={className} />
}
