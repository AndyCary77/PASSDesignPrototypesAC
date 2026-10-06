import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * Prototype-level switches for surfaces that are on their way out (or not
 * yet in), so a deprecated flow can still be pulled up and reviewed rather
 * than deleted outright. Toggled from the Admin page (see
 * components/admin/AdminSettingsPage.tsx).
 */
export type FeatureFlag = 'customerCareBridgeTab' | 'canEditRosterSettings';

export const FEATURE_FLAG_DEFAULTS: Record<FeatureFlag, boolean> = {
  // Deprecated: CareBridge is no longer a customer tab of its own. Recordings
  // live under Documents → CareBridge and link into whichever section they
  // draft (assessment, document, care management), so the review happens
  // where the content lives. Off by default, kept behind this switch so the
  // old tab can still be looked at.
  customerCareBridgeTab: false,
  // Stands in for the user's permission to change Roster settings. On by default
  // so the prototype is editable; switch it off to review the read-only view.
  canEditRosterSettings: true,
};

const STORAGE_KEY = 'pass-feature-flags';

function readStoredFlags(): Record<FeatureFlag, boolean> {
  if (typeof window === 'undefined') return FEATURE_FLAG_DEFAULTS;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // Merged over the defaults rather than used as-is, so a flag added after
    // someone's last visit picks up its default instead of coming back
    // undefined from whatever they already have saved.
    return stored ? { ...FEATURE_FLAG_DEFAULTS, ...JSON.parse(stored) } : FEATURE_FLAG_DEFAULTS;
  } catch {
    return FEATURE_FLAG_DEFAULTS;
  }
}

interface FeatureFlagsContextValue {
  flags: Record<FeatureFlag, boolean>;
  setFlag: (flag: FeatureFlag, value: boolean) => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null);

/**
 * Lives above the router (see App.tsx) so every route reads the same values.
 * Persisted to localStorage — someone switching a deprecated surface back on
 * to review it shouldn't lose that the moment they reload.
 */
export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Record<FeatureFlag, boolean>>(readStoredFlags);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  }, [flags]);

  const setFlag = (flag: FeatureFlag, value: boolean) => setFlags(prev => ({ ...prev, [flag]: value }));

  return <FeatureFlagsContext.Provider value={{ flags, setFlag }}>{children}</FeatureFlagsContext.Provider>;
}

export function useFeatureFlags(): FeatureFlagsContextValue {
  const ctx = useContext(FeatureFlagsContext);
  if (!ctx) throw new Error('useFeatureFlags must be used within FeatureFlagsProvider');
  return ctx;
}

export function useFeatureFlag(flag: FeatureFlag): boolean {
  return useFeatureFlags().flags[flag];
}
