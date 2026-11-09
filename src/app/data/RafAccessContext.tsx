import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { RAF_WRITE_ENABLED, getRafRecord, type RafRecord } from './reasonableAdjustments';

/**
 * Prototype-only review state for the Reasonable Adjustments tab: stands in for things that are
 * really decided by who you are and what the NHS holds, so each can be reviewed.
 *
 * Access level (audit page R10): Level 1 sees the adjustments only, Level 2 sees all content,
 * Level 3 can also create/add/remove/delete (parked for phase 1, see RAF_WRITE_ENABLED).
 * 'admin' is an internal EveryLife admin user (design call, Nov 2026): the starting position is that they can't see the
 * details, as with GP Connect, so the tab is hidden. They still see that a flag exists (the badge, the lists, the
 * Details status line, the alert) but never what is in it. Every place that shows detail must check `canSeeRafDetail`.
 *
 * National flag: what PASS finds when it checks the NHS for a customer it has no flag for.
 *   'found'         the NHS already holds one, so PASS imports it
 *   'none'          the NHS holds none, so a flag can be created
 *   'no-nhs-number' no verified NHS number, so PASS can't check at all (R20)
 * `simulateNationalChange` stands in for another organisation changing the national flag
 * (what the NHS notification service would tell PASS about).
 *
 * Next save: whether the next create/add/remove/delete is accepted by the national flag service.
 *   'ok'        accepted
 *   'error'     rejected, so nothing is saved and the dialog says so
 *   'conflict'  an adjustment being added is rejected as conflicting with one already on the national flag
 * One-shot: it returns to 'ok' once a save has been rejected, so the retry then succeeds.
 *
 * NHS request: whether the live request the tab makes to the NHS each time it opens (or is refreshed) gets an
 * answer. 'error' = the NHS couldn't be reached or didn't answer, so the tab can't show the current flag.
 * Stays 'error' until switched back, so Try again can be shown failing and then succeeding.
 *
 * Flag records: the flag PASS holds for each customer, shared so everything that shows it (the header
 * badge on every customer tab, the Customers list, the Customer Details status line, the visit panel's
 * Customer Details tab) agrees with the Reasonable Adjustments tab, which is what changes it (an import
 * from the national flag, a create, an add, a remove, a delete). Until the tab has said otherwise it's
 * whatever the demo data holds. Kept for the session, as PASS would keep it.
 *
 * Lives above the router so the tab bar (CustomerInfoNav), the floating switcher and the tab
 * itself read the same values.
 */
export type RafAccessLevel = 'admin' | '1' | '2' | '3';

/** Can this user see what a Reasonable Adjustment Flag says? False for internal admins: they only see that one exists. */
export const canSeeRafDetail = (level: RafAccessLevel) => level !== 'admin';
export type NationalFlagState = 'found' | 'none' | 'no-nhs-number';
export type SaveOutcome = 'ok' | 'error' | 'conflict';
export type NhsRequestState = 'ok' | 'error';

const STORAGE_KEY = 'pass-raf-access-level';

function readStoredLevel(): RafAccessLevel {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // 'none' is what this was called before it was recognised as the internal admin state.
    if (stored === 'none' || stored === 'admin') return 'admin';
    if (stored === '1' || stored === '2') return stored;
    // Level 3 (write) is parked for phase 1, so a stored 3 falls back to Level 2, the highest read level.
    if (stored === '3') return RAF_WRITE_ENABLED ? '3' : '2';
  } catch {
    // Storage unavailable — fall through to the default.
  }
  return RAF_WRITE_ENABLED ? '3' : '2';
}

interface RafAccessContextValue {
  level: RafAccessLevel;
  setLevel: (level: RafAccessLevel) => void;
  nationalFlag: NationalFlagState;
  setNationalFlag: (state: NationalFlagState) => void;
  /** Counts simulated changes by another organisation; the tab reacts whenever it goes up. */
  nationalChangeCount: number;
  simulateNationalChange: () => void;
  saveOutcome: SaveOutcome;
  setSaveOutcome: (outcome: SaveOutcome) => void;
  nhsRequest: NhsRequestState;
  setNhsRequest: (state: NhsRequestState) => void;
  /** The flag PASS holds for this customer, or null if it holds none. */
  getFlagRecord: (customerId: string) => RafRecord | null;
  setFlagRecord: (customerId: string, record: RafRecord | null) => void;
  /** Does PASS hold a Reasonable Adjustment Flag for this customer? */
  hasFlag: (customerId: string) => boolean;
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
  saveOutcome: 'ok',
  setSaveOutcome: () => {},
  nhsRequest: 'ok',
  setNhsRequest: () => {},
  getFlagRecord: id => getRafRecord(id),
  setFlagRecord: () => {},
  hasFlag: id => getRafRecord(id) !== null,
});

export function RafAccessProvider({ children }: { children: ReactNode }) {
  const [level, setLevel] = useState<RafAccessLevel>(readStoredLevel);
  // Not persisted: it's a what-if for the current review, not a setting.
  const [nationalFlag, setNationalFlag] = useState<NationalFlagState>('found');
  const [nationalChangeCount, setNationalChangeCount] = useState(0);
  const [saveOutcome, setSaveOutcome] = useState<SaveOutcome>('ok');
  const [nhsRequest, setNhsRequest] = useState<NhsRequestState>('ok');
  const simulateNationalChange = useCallback(() => setNationalChangeCount(n => n + 1), []);
  const [flagRecords, setFlagRecords] = useState<Record<string, RafRecord | null>>({});
  const getFlagRecord = useCallback((id: string) => (id in flagRecords ? flagRecords[id] : getRafRecord(id)), [flagRecords]);
  const hasFlag = useCallback((id: string) => getFlagRecord(id) !== null, [getFlagRecord]);
  const setFlagRecord = useCallback(
    (id: string, record: RafRecord | null) => setFlagRecords(prev => (prev[id] === record ? prev : { ...prev, [id]: record })),
    [],
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, level);
    } catch {
      // Non-critical: the level just won't survive a reload.
    }
  }, [level]);

  return (
    <RafAccessContext.Provider
      value={{ level, setLevel, nationalFlag, setNationalFlag, nationalChangeCount, simulateNationalChange, saveOutcome, setSaveOutcome, nhsRequest, setNhsRequest, getFlagRecord, setFlagRecord, hasFlag }}
    >
      {children}
    </RafAccessContext.Provider>
  );
}

export function useRafAccess() {
  return useContext(RafAccessContext);
}
