import { useEffect, useState } from 'react';

/**
 * Tracks the current bottom edge (in px) of AppShell's pinned info-bar —
 * Header/TopNav plus CustomerInfo and any subnav, all rendered together in
 * the `.sticky.top-0.z-40` wrapper in routes.tsx. Used to pin a *second*
 * sticky element (e.g. a document's title bar) flush beneath it.
 *
 * Deliberately measured every frame via requestAnimationFrame rather than
 * read once and hardcoded as a pixel constant per scrolled/unscrolled
 * state: the info-bar's own height animates (its sub-nav's padding shrinks
 * on scroll, via its own separate useScrolled() call), and that content
 * component doesn't know anything about the info-bar's internals. Trying
 * to mirror that animation with a second, independently-triggered CSS
 * transition (two different useScrolled() instances, each racing to flip
 * their own state and animate their own element) reliably drifts out of
 * sync for the ~300ms the transition is playing — during a real scroll
 * gesture the two rarely finish at exactly the same moment, briefly
 * exposing scrolled-past content in the gap between them. Reading the
 * info-bar's actual rendered position every frame sidesteps that
 * entirely: whatever height it currently is (mid-animation or not), this
 * always matches it exactly, this frame.
 */
export function useInfoBarBottom(): number {
  const [bottom, setBottom] = useState(0);

  useEffect(() => {
    const el = document.querySelector('.sticky.top-0.z-40');
    if (!el) return;
    let raf = 0;
    const tick = () => {
      setBottom(prev => {
        const next = el.getBoundingClientRect().bottom;
        return next === prev ? prev : next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return bottom;
}
