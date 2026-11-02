import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * Prototype-only review state for the Reasonable Adjustments tab: stands in for things that are
 * really decided by who you are and what the NHS holds, so each can be reviewed.
 *
 * Access level (audit page R10): Level 1 sees the adjustments only, Level 2 sees all content,
 * Level 3 can also create/add/remove/delete. 'none' means no RA access, which hides the tab.
 *
 * National flag: what PASS finds when it checks the NHS for a customer it has no flag for.
 *   'found'         the NHS already holds one, so PASS imports it
 *   'none'          the NHS holds none, so a flag can be created
 *   'no-nhs-number' no verified NHS number, so PASS can't check at all (R20)
 * `simulateNationalChange` stands in for another organisation changing the national flag
 * (what the NHS notification service would tell PASS about).
 *
 * Lives above the router so the tab bar (CustomerInfoNav), the floating switcher and the tab
 * itself read the same values.
 */
export type RafAccessLevel = 'none' | '1' | '2' | '3';
export type NationalFlagState = 'found' | 'none' | 'no-nhs-number';

const STORAGE_KEY = 'pass-raf-access-level';

function readStoredLevel(): RafAccessLevel {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'none' || stored === '1' || stored === '2' || stored === '3') return stored;
  } catch {
    // Storage unavailable — fall through to the default.
  }
  return '3';
}

interface RafAccessContextValue {
  level: RafAccessLevel;
  setLevel: (level: RafAccessLevel) => void;
  nationalFlag: NationalFlagState;
  setNationalFlag: (state: NationalFlagState) => void;
  /** Counts simulated changes by another organisation; the tab reacts whenever it goes up. */
  nationalChangeCount: number;
  simulateNationalChange: () => void;
}

// A default (rather than null + a throwing hook) so CustomerInfo still renders
// anywhere it's used outside the provider, e.g. component previews.
const RafAccessContext = createContext<RafAccessContextValue>({
  level: '3',
  setLevel: () => {},
  nationalFlag: 'found',
  setNationalFlag: () => {},
  nationalChangeCount: 0,
  simulateNationalChange: () => {},
});

export function RafAccessProvider({ children }: { children: ReactNode }) {
  const [level, setLevel] = useState<RafAccessLevel>(readStoredLevel);
  // Not persisted: it's a what-if for the current review, not a setting.
  const [nationalFlag, setNationalFlag] = useState<NationalFlagState>('found');
  const [nationalChangeCount, setNationalChangeCount] = useState(0);
  const simulateNationalChange = useCallback(() => setNationalChangeCount(n => n + 1), []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, level);
    } catch {
      // Non-critical: the level just won't survive a reload.
    }
  }, [level]);

  return (
    <RafAccessContext.Provider
      value={{ level, setLevel, nationalFlag, setNationalFlag, nationalChangeCount, simulateNationalChange }}
    >
      {children}
    </RafAccessContext.Provider>
  );
}

export function useRafAccess() {
  return useContext(RafAccessContext);
}
