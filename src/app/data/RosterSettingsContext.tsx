import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { CARE_TYPES } from '../components/employee/availabilityData';

/**
 * Office-level Roster settings that other screens need to read. Lives above
 * the router (see App.tsx) so the Roster Settings page, which writes them, and
 * the Employee Contract screen, which reacts to them, share one source.
 * Persisted to localStorage so the journey survives a reload.
 */
export type AdvancedSettingKey =
  | 'clashWithHoliday'
  | 'publishClashes'
  | 'autoVerifyTimesheets'
  | 'editSentInvoices'
  | 'availabilityByCareType';

export type AdvancedSettings = Record<AdvancedSettingKey, boolean>;

export interface TableSettings {
  rowsPerPage: number;
  /** How people are ordered in tables; null = not set. */
  ordering: 'first-name' | 'last-name' | null;
}

const DEFAULT_TABLE: TableSettings = { rowsPerPage: 10, ordering: null };

/**
 * Edits made to the visit types / non-contact event types tables, keyed by
 * `visit:<id>` or `event:<name>`. Only what differs from the defaults is kept.
 */
export interface TypeOverride {
  enabled?: boolean;
  includeInHolidayPay?: boolean;
  payEmployee?: boolean;
  payMileage?: boolean;
  payTravelTime?: boolean;
}
export type TypeOverrides = Record<string, TypeOverride>;
export const visitTypeKey = (id: string) => `visit:${id}`;
export const eventTypeKey = (name: string) => `event:${name}`;

const DEFAULT_ADVANCED: AdvancedSettings = {
  clashWithHoliday: false,
  publishClashes: false,
  autoVerifyTimesheets: false,
  editSentInvoices: false,
  // Off by default: not every customer works rotations by care type.
  availabilityByCareType: false,
};

interface Stored {
  advanced: AdvancedSettings;
  table: TableSettings;
  typeOverrides: TypeOverrides;
  /** Has "Availability by care type" ever been switched on? Drives the first-time notice. */
  careTypeEverEnabled: boolean;
}

const STORAGE_KEY = 'pass-roster-settings';

function read(): Stored {
  const fallback = { advanced: DEFAULT_ADVANCED, table: DEFAULT_TABLE, typeOverrides: {}, careTypeEverEnabled: false };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      advanced: { ...DEFAULT_ADVANCED, ...parsed.advanced },
      table: { ...DEFAULT_TABLE, ...parsed.table },
      typeOverrides: parsed.typeOverrides ?? {},
      careTypeEverEnabled: !!parsed.careTypeEverEnabled,
    };
  } catch {
    return fallback;
  }
}

interface RosterSettingsContextValue {
  advanced: AdvancedSettings;
  table: TableSettings;
  typeOverrides: TypeOverrides;
  saveTypeOverrides: (next: TypeOverrides) => void;
  /**
   * Saves the advanced settings. Returns true when this save turned
   * "Availability by care type" on for the very first time, so the caller can
   * show the "existing availability is treated as Personal care" notice.
   */
  saveAdvanced: (next: AdvancedSettings, table: TableSettings) => boolean;
}

const RosterSettingsContext = createContext<RosterSettingsContextValue | null>(null);

export function RosterSettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Stored>(read);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const saveAdvanced = (next: AdvancedSettings, table: TableSettings) => {
    const firstTime = next.availabilityByCareType && !state.careTypeEverEnabled;
    setState(prev => ({
      ...prev,
      advanced: next,
      table,
      careTypeEverEnabled: prev.careTypeEverEnabled || next.availabilityByCareType,
    }));
    return firstTime;
  };

  const saveTypeOverrides = (next: TypeOverrides) => setState(prev => ({ ...prev, typeOverrides: next }));

  return (
    <RosterSettingsContext.Provider value={{
        advanced: state.advanced,
        table: state.table,
        typeOverrides: state.typeOverrides,
        saveTypeOverrides,
        saveAdvanced,
      }}>
      {children}
    </RosterSettingsContext.Provider>
  );
}

export function useRosterSettings(): RosterSettingsContextValue {
  const ctx = useContext(RosterSettingsContext);
  if (!ctx) throw new Error('useRosterSettings must be used within RosterSettingsProvider');
  return ctx;
}

/** Is care type shown on (and used by) availability for this office? */
export function useAvailabilityByCareType(): boolean {
  return useRosterSettings().advanced.availabilityByCareType;
}

/** The visit (care) types with any edits applied. Disabled ones are kept, flagged `enabled: false`. */
export function useVisitTypes() {
  const { typeOverrides } = useRosterSettings();
  return CARE_TYPES.map(c => {
    const o = typeOverrides[visitTypeKey(c.id)] ?? {};
    return {
      ...c,
      includeInHolidayPay: o.includeInHolidayPay ?? c.includeInHolidayPay,
      enabled: o.enabled ?? true,
    };
  });
}
