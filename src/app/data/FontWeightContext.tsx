import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type FontWeightMode = 'default' | 'bold';

const STORAGE_KEY = 'pass-font-weight-mode';
// Same shareable-link convention as NavModeContext's `?nav=` — lets a
// specific state be linked without depending on the recipient's own
// localStorage, e.g. for showing someone the bolder pass without them
// needing to find and click the toggle themselves first.
const QUERY_PARAM = 'weight';

function readModeFromQuery(): FontWeightMode | null {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get(QUERY_PARAM);
  return value === 'default' || value === 'bold' ? value : null;
}

interface FontWeightContextValue {
  mode: FontWeightMode;
  toggle: () => void;
}

const FontWeightContext = createContext<FontWeightContextValue | null>(null);

/**
 * A whole-app A/B toggle for the "make everything bolder" question raised
 * against the redesign (see memory: feedback_accessibility, the
 * 2026-09-23 font-weight note) — lets it be reviewed live across every
 * screen rather than argued about in the abstract or checked one component
 * at a time.
 *
 * This only works app-wide with a single CSS rule because every
 * `font-normal`/`font-medium`/`font-semibold`/`font-bold`/`font-extrabold`
 * utility (and the plain-element typography reset) already reads from the
 * `--font-weight-*` custom properties in globals.css, rather than
 * Tailwind's own hardcoded scale — see that same memory note for how that
 * got wired up. `data-font-weight="bold"` on `<html>` (set below, same
 * `document.documentElement.dataset` mechanism the mobile prototypes'
 * platform.js already uses to switch iOS/Android CSS) is all that's
 * needed for the override block in globals.css to take effect everywhere
 * at once — no component changes.
 *
 * Persisted to localStorage and lives above the router (see App.tsx),
 * same as NavModeContext, so it survives navigation/reload and applies
 * under both the legacy and new shell.
 */
export function FontWeightProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<FontWeightMode>(() => {
    if (typeof window === 'undefined') return 'default';
    return readModeFromQuery() ?? (window.localStorage.getItem(STORAGE_KEY) as FontWeightMode) ?? 'default';
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode);
    document.documentElement.dataset.fontWeight = mode;
  }, [mode]);

  const toggle = () => setMode(m => (m === 'default' ? 'bold' : 'default'));

  return <FontWeightContext.Provider value={{ mode, toggle }}>{children}</FontWeightContext.Provider>;
}

export function useFontWeightMode(): FontWeightContextValue {
  const ctx = useContext(FontWeightContext);
  if (!ctx) throw new Error('useFontWeightMode must be used within FontWeightProvider');
  return ctx;
}
