import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * Multi-row "show at most N rows, then a '+X more' chip" overflow for a
 * wrapping flex row (e.g. a row of badges) — the row-based counterpart to
 * useOverflowNav's single-row priority+ overflow. Measures each item's
 * real `offsetTop` (which row it landed in) against an always-mounted,
 * full-list *measuring* copy, and reports how many items fit within
 * `maxRows` before the rest should collapse into a "+X more" affordance —
 * recalculated live via ResizeObserver, not just on mount.
 *
 * Wire it up the same way as useOverflowNav:
 * 1. Attach `containerRef` to the wrapping element (whatever should be
 *    watched for width changes — typically an ancestor of both rows
 *    below, since its width is what drives how items wrap).
 * 2. Render the visible items, sliced to `visibleCount`, plus a "+X more"
 *    chip when `hasOverflow` is true.
 * 3. Render an "always all items" measuring copy — visually hidden,
 *    off-screen, non-interactive — with each item's DOM node registered
 *    via `itemRefs.current[i] = el`.
 *
 * One item of headroom is reserved automatically so a "+X more" chip
 * appended after `visibleCount` items always has room on that same row —
 * callers don't need a second measuring pass just for the chip's own
 * width.
 */
export function useWrapRowLimit(itemCount: number, maxRows: number) {
  const containerRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const [visibleCount, setVisibleCount] = useState(itemCount);

  const recalculate = useCallback(() => {
    if (itemCount === 0) return;
    const tops = itemRefs.current.slice(0, itemCount).map(el => el?.offsetTop ?? 0);
    let rows = 0;
    let lastTop = -1;
    let cutoff = itemCount;
    for (let i = 0; i < itemCount; i++) {
      if (tops[i] !== lastTop) {
        rows++;
        lastTop = tops[i];
        if (rows > maxRows) {
          cutoff = i;
          break;
        }
      }
    }
    // Leave room on the last visible row for a "+X more" chip rather than
    // running a second measuring pass that also accounts for its width.
    setVisibleCount(cutoff === itemCount ? itemCount : Math.max(cutoff - 1, 0));
  }, [itemCount, maxRows]);

  useLayoutEffect(() => {
    recalculate();
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => recalculate());
    observer.observe(container);
    return () => observer.disconnect();
    // Re-observe if the container element itself is swapped, and
    // re-measure whenever the item count changes.
  }, [recalculate]);

  return {
    containerRef,
    itemRefs,
    visibleCount,
    hasOverflow: visibleCount < itemCount,
  };
}
