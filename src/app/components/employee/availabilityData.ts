export type TimeRange = { start: string; end: string };
/** A day can hold several slots of each kind, e.g. a split shift. */
export type DayAvail = { regular?: TimeRange[]; optional?: TimeRange[] };

export const DAYS = [
  { short: 'Mon', full: 'Monday' },
  { short: 'Tue', full: 'Tuesday' },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday' },
  { short: 'Fri', full: 'Friday' },
  { short: 'Sat', full: 'Saturday' },
  { short: 'Sun', full: 'Sunday' },
];

/** Availability is keyed `${weekIndex}-${shortDay}`, e.g. "1-Tue". */
export const availKey = (weekIndex: number, shortDay: string) => `${weekIndex}-${shortDay}`;

const DEFAULT_WEEK: Record<string, DayAvail> = {
  Mon: { regular: [{ start: '06:45', end: '19:00' }] },
  Tue: { regular: [{ start: '06:45', end: '19:00' }] },
  Wed: { regular: [{ start: '06:45', end: '22:00' }] },
};

/** Mock starting pattern — every week begins identical. */
export function buildInitialAvailability(): Record<string, DayAvail> {
  const out: Record<string, DayAvail> = {};
  for (let w = 0; w < 4; w++) {
    for (const { short } of DAYS) {
      out[availKey(w, short)] = DEFAULT_WEEK[short]
        ? { regular: DEFAULT_WEEK[short].regular!.map((r) => ({ ...r })) }
        : {};
    }
  }
  return out;
}

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export const rangeMinutes = (r: TimeRange) => toMinutes(r.end) - toMinutes(r.start);
export const slotsMinutes = (slots?: TimeRange[]) =>
  (slots ?? []).reduce((sum, r) => sum + rangeMinutes(r), 0);
export const isValidRange = (r: TimeRange) =>
  !!r.start && !!r.end && toMinutes(r.end) > toMinutes(r.start);
export const formatRange = (r: TimeRange) => `${r.start} – ${r.end}`;
export const sameSlots = (a: TimeRange[] = [], b: TimeRange[] = []) =>
  a.length === b.length && a.every((r, i) => r.start === b[i].start && r.end === b[i].end);

/** True if any two (valid) slots in the list overlap. */
export function slotsOverlap(slots: TimeRange[]) {
  const sorted = slots
    .filter(isValidRange)
    .map((r) => [toMinutes(r.start), toMinutes(r.end)])
    .sort((a, b) => a[0] - b[0]);
  return sorted.some(([, end], i) => i > 0 && sorted[i][0] < sorted[i - 1][1]);
}

/** A sensible next slot: starts where the last one ended, one hour long. */
export function nextSlot(slots: TimeRange[]): TimeRange {
  if (!slots.length) return { start: '09:00', end: '17:00' };
  const startMins = toMinutes(slots[slots.length - 1].end) || 0;
  const endMins = Math.min(startMins + 60, 23 * 60 + 59);
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  return { start: fmt(startMins), end: fmt(endMins) };
}

export function formatDuration(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m ? `${h}h ${m}m` : `${h} hours`;
}
