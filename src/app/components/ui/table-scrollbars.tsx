import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Horizontal scrollbars above and below a wide table, for a table whose first `pinnedWidth` pixels
 * are pinned (sticky) while the rest scrolls. The bars start after the pinned part, so they span only
 * what actually scrolls, and the table's own scrollbar is hidden in their favour. Wrap a `Table`
 * (it finds the table's scrolling container itself).
 *
 * The bars are drawn by hand, not native scrollbars: dragging a native one reports its position a frame
 * late, so a table following it lags behind the handle. Here the drag sets the table's scroll position
 * and moves the handles in the same event, so they stay together. The bars are a convenience, so
 * they're hidden from assistive tech and the keyboard; the table scrolls as it always did.
 */
export function TableScrollbars({ pinnedWidth, background, children }: {
  pinnedWidth: number;
  /** The colour of the band each bar sits in, so it matches the table's header. */
  background: string;
  children: ReactNode;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const tracks = useRef<(HTMLDivElement | null)[]>([null, null]);
  const thumbs = useRef<(HTMLDivElement | null)[]>([null, null]);
  const refresh = useRef<() => void>(() => {});

  useEffect(() => {
    const table = wrap.current?.querySelector<HTMLElement>('[data-slot="table-container"]');
    if (!table) return;

    // Size and place both handles from the table's scroll position. Called on every scroll and resize,
    // and straight from the drag, so nothing waits for a scroll event to come back round.
    const update = () => {
      const range = table.scrollWidth - table.clientWidth;
      tracks.current.forEach(track => { if (track) track.style.display = range > 1 ? 'block' : 'none'; });
      // Measured from the track itself, so the handle always fits the bar it's drawn in.
      const trackW = thumbs.current[0]?.parentElement?.clientWidth ?? 0;
      if (trackW === 0) return;
      const thumbW = Math.min(trackW, Math.max(40, (trackW * trackW) / (trackW + Math.max(range, 0))));
      // Clamped, since some browsers report positions just outside the range while bouncing at an end.
      const at = Math.min(Math.max(table.scrollLeft, 0), Math.max(range, 0));
      const left = range > 0 ? (at / range) * (trackW - thumbW) : 0;
      thumbs.current.forEach(thumb => {
        if (!thumb) return;
        thumb.style.width = `${thumbW}px`;
        thumb.style.left = `${left}px`;
      });
    };
    update();
    refresh.current = update;
    table.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(table);
    if (table.firstElementChild) ro.observe(table.firstElementChild);
    return () => { table.removeEventListener('scroll', update); ro.disconnect(); };
  }, [pinnedWidth]);

  const scroller = () => wrap.current?.querySelector<HTMLElement>('[data-slot="table-container"]') ?? null;

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const table = scroller();
    if (!table || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const thumb = e.currentTarget;
    const startX = e.clientX;
    const startScroll = table.scrollLeft;
    // How far the table moves for each pixel the handle does.
    const trackW = thumb.parentElement?.clientWidth ?? 0;
    const range = table.scrollWidth - table.clientWidth;
    const perPx = range / Math.max(1, trackW - thumb.offsetWidth);
    thumb.setPointerCapture(e.pointerId);
    // Place the handle straight away from where the table actually ended up, rather than waiting for
    // the browser to report the scroll back, so the two can't disagree while dragging.
    const move = (ev: PointerEvent) => { table.scrollLeft = startScroll + (ev.clientX - startX) * perPx; refresh.current(); };
    const end = () => {
      refresh.current();
      thumb.removeEventListener('pointermove', move);
      thumb.removeEventListener('pointerup', end);
      thumb.removeEventListener('pointercancel', end);
    };
    thumb.addEventListener('pointermove', move);
    thumb.addEventListener('pointerup', end);
    thumb.addEventListener('pointercancel', end);
  };

  // Clicking the track outside the handle moves a page towards the click, as a scrollbar does.
  const trackClick = (e: React.PointerEvent<HTMLDivElement>) => {
    const table = scroller();
    if (!table || e.target !== e.currentTarget) return;
    const thumb = e.currentTarget.firstElementChild as HTMLElement;
    const before = e.clientX < thumb.getBoundingClientRect().left;
    table.scrollLeft += (before ? -1 : 1) * (table.clientWidth - pinnedWidth);
  };

  // Each bar is a full-width band (so there's no gap beside the pinned columns) with a rounded track in it.
  const bar = (i: number) => (
    <div
      ref={el => { tracks.current[i] = el; }}
      aria-hidden="true"
      style={{ display: 'none', backgroundColor: background }}
      className={`py-1.5 border-gray-200 ${i === 0 ? 'border-b' : 'border-t'}`}
    >
      <div onPointerDown={trackClick} style={{ marginLeft: pinnedWidth }} className="relative h-3 rounded-full bg-gray-200">
        <div
          ref={el => { thumbs.current[i] = el; }}
          onPointerDown={startDrag}
          className="absolute top-0 left-0 h-full rounded-full bg-gray-400 hover:bg-gray-500 active:bg-gray-500 touch-none"
        />
      </div>
    </div>
  );

  return (
    <div ref={wrap} className="table-scrollbars-wrap">
      {bar(0)}
      {children}
      {bar(1)}
    </div>
  );
}
