import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * Progressive-disclosure ("priority+") navigation: measures each item's
 * real rendered width against its container's *available* width and
 * reports how many items fit before the rest need to collapse into an
 * overflow ("More") menu — recalculated live via ResizeObserver, not just
 * on mount, so it keeps up with window resizes (or anything else that
 * changes the container's width).
 *
 * This hook only computes numbers; it doesn't render anything itself, so
 * it stays agnostic to how different nav items actually look (plain
 * links, dropdown tabs, inert placeholders, ...). Wire it up by:
 *
 * 1. Attaching `containerRef` to the real, visible nav (a non-wrapping
 *    flex row).
 * 2. Rendering the visible items themselves, sliced to `visibleCount`.
 * 3. Rendering an "always all items" *measuring* copy — visually hidden,
 *    off-screen, non-interactive — with each item's DOM node registered
 *    via `itemRefs.current[i] = el`, plus the "More" trigger's own node
 *    registered via `moreRef`. Measuring the *full* list up front (not
 *    just whichever ones are currently visible) is what avoids a
 *    chicken-and-egg problem: every item's width is needed to decide how
 *    many fit, before knowing how many will actually be shown.
 * 4. Rendering the real "More" trigger only once `hasOverflow` is true —
 *    using the exact same markup as the measuring copy, so its measured
 *    width matches what actually ends up on screen.
 */
export function useOverflowNav(itemCount: number) {
  const containerRef = useRef<HTMLElement | null>(null);
  const moreRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const [visibleCount, setVisibleCount] = useState(itemCount);

  const recalculate = useCallback(() => {
    const container = containerRef.current;
    if (!container || itemCount === 0) return;
    const containerWidth = container.clientWidth;
    const gap = 4; // matches the nav's own `gap-1` (0.25rem)

    const widths = itemRefs.current.slice(0, itemCount).map(el => el?.offsetWidth ?? 0);
    const totalWidth = widths.reduce((sum, w) => sum + w, 0) + gap * (itemCount - 1);

    // Everything fits without needing a "More" menu at all.
    if (totalWidth <= containerWidth) {
      setVisibleCount(itemCount);
      return;
    }

    const moreWidth = (moreRef.current?.offsetWidth ?? 0) + gap;
    let used = 0;
    let count = 0;
    for (let i = 0; i < itemCount; i++) {
      const next = used + widths[i] + (i > 0 ? gap : 0);
      if (next + moreWidth > containerWidth) break;
      used = next;
      count++;
    }
    setVisibleCount(count);
  }, [itemCount]);

  useLayoutEffect(() => {
    recalculate();
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => recalculate());
    observer.observe(container);
    return () => observer.disconnect();
    // Re-observe if the container element itself is swapped, and
    // re-measure whenever the item count changes (a feature flag adding/
    // removing a tab, say) since `recalculate` is only recreated then.
  }, [recalculate]);

  return {
    containerRef,
    moreRef,
    itemRefs,
    visibleCount,
    hasOverflow: visibleCount < itemCount,
  };
}
