import { useSearchParams } from 'react-router';
import { getActiveScenario, parseScenario, setActiveScenario, type UsageScenario } from './assessmentHeroUsage';

/**
 * The office's Assessment Hero allowance state for pages that deep-link to one
 * with `?demo=near|full|none|default` (Office → Assessment Hero, My account).
 * A recognised value is remembered, so the customer pages the reviewer clicks
 * through to afterwards show the same state.
 */
export function useAllowanceScenario(): UsageScenario {
  const [params] = useSearchParams();
  const demo = params.get('demo');
  if (demo === 'near' || demo === 'full' || demo === 'none' || demo === 'default') setActiveScenario(parseScenario(demo));
  return getActiveScenario();
}
