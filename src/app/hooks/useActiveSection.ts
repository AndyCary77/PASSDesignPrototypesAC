import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Scroll-spy for a list of section ids: the active one is the last section
 * whose top has scrolled up to `offset` (the bottom of whatever is pinned
 * above the content). Falls back to the first, and to the last when the page
 * is scrolled to the very bottom (a short final section may never reach the
 * offset).
 *
 * With `syncHash`, the URL hash follows the active section as the page is
 * scrolled (replaceState, so no history entry per section), which keeps the
 * address bar a shareable link to wherever you are. Nothing is written on first
 * load (so an incoming #link isn't clobbered before it's scrolled to), and at
 * the very top the hash is cleared.
 *
 * Returns a `select` too, for when the user picks a section from the menu:
 * it sets the active section straight away and pauses the spy until the
 * resulting smooth scroll settles, so the highlight doesn't flick through
 * every section it passes on the way.
 */
export function useActiveSection(
  ids: string[],
  offset: number,
  { syncHash = false }: { syncHash?: boolean } = {},
): [string, (id: string) => void] {
  const [active, setActive] = useState(ids[0]);
  const locked = useRef(false);
  const settleTimer = useRef<number | undefined>(undefined);
  const key = ids.join('|');

  const select = useCallback((id: string) => {
    setActive(id);
    locked.current = true;
    // If nothing scrolls (already there), release the lock anyway.
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => { locked.current = false; }, 300);
  }, []);

  useEffect(() => {
    let raf = 0;
    const update = (fromScroll = false) => {
      raf = 0;
      if (locked.current) return;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset + 8) current = id;
      }
      if (atBottom) current = ids[ids.length - 1];
      setActive(current);
      if (syncHash && fromScroll) {
        const atTop = window.scrollY <= 1 && current === ids[0];
        // A link to something *inside* the active section (e.g. a sub-panel)
        // stays as it is until you scroll out of that section.
        const hashEl = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
        if (hashEl && document.getElementById(current)?.contains(hashEl) && !atTop) return;
        const want = atTop ? '' : `#${current}`;
        if (window.location.hash !== want) {
          window.history.replaceState(
            window.history.state,
            '',
            window.location.pathname + window.location.search + want,
          );
        }
      }
    };
    const onScroll = () => {
      if (locked.current) {
        // Still moving: push the release back until scrolling has stopped.
        window.clearTimeout(settleTimer.current);
        settleTimer.current = window.setTimeout(() => { locked.current = false; update(true); }, 150);
        return;
      }
      if (!raf) raf = requestAnimationFrame(() => update(true));
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.clearTimeout(settleTimer.current);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, offset, syncHash]);

  return [active, select];
}
