import { useEffect } from 'react';

/**
 * On first load, scroll to the section named in the URL hash (e.g.
 * /office/roster-settings#advanced-settings), so a section can be linked to
 * directly. Waits `ready` — pages that pin a header measure it after first
 * paint, and each section's scroll-margin depends on that measurement — then
 * a beat longer for layout to settle.
 */
export function useScrollToHash(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, 150);
    return () => window.clearTimeout(timer);
    // Only on first load: later hash changes come from the menu, which scrolls itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
}
