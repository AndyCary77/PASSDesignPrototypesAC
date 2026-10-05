/**
 * The out-of-the-box visit care types from Roster settings → Visit and event
 * types. Colours match the swatches shown there.
 */
export const CARE_TYPES = [
  { id: 'personal-care', label: 'Personal care', colour: '#4A72E0' },
  { id: 'companionship', label: 'Companionship', colour: '#B5651D' },
  { id: 'live-in', label: 'Live-in', colour: '#8E52C8' },
  { id: 'sleeping-night', label: 'Sleeping night', colour: '#3A8FBF' },
  { id: 'waking-night', label: 'Waking night', colour: '#3F9A97' },
  { id: 'complex-care', label: 'Complex care', colour: '#C94448' },
  { id: 'shadowing', label: 'Shadowing', colour: '#9C6D1F' },
] as const;

export type CareTypeId = (typeof CARE_TYPES)[number]['id'];
export const DEFAULT_CARE_TYPE: CareTypeId = 'personal-care';
export const getCareType = (id: CareTypeId) =>
  CARE_TYPES.find((c) => c.id === id) ?? CARE_TYPES[0];

/** Each slot of availability carries the care type it's worked as. */
export type TimeRange = { start: string; end: string; careType: CareTypeId };
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

const slot = (start: string, end: string, careType: CareTypeId = DEFAULT_CARE_TYPE): TimeRange => ({
  start,
  end,
  careType,
});

// Homecare runs as split shifts around the customers' morning and evening
// calls (8h a day, 40h a week); live-in is one long block each day.
const split = () => [slot('07:00', '11:30'), slot('16:00', '19:30')];
const liveIn = () => [slot('08:00', '20:00', 'live-in')];

type WeekPattern = Record<string, DayAvail>;

/**
 * Mock starting pattern — a 4-week rotation of three weeks homecare then one
 * week live-in, with some optional overtime offered in the homecare weeks.
 */
const INITIAL_PATTERN: WeekPattern[] = [
  // Week 1 — Mon–Fri splits, Sat + Friday-evening overtime
  {
    Mon: { regular: split() },
    Tue: { regular: split() },
    Wed: { regular: split() },
    Thu: { regular: split() },
    Fri: { regular: split(), optional: [slot('19:30', '22:00')] },
    Sat: { optional: [slot('08:00', '14:00')] },
  },
  // Week 2 — Tue–Fri splits plus a Saturday day shift; Monday/Sunday overtime
  {
    Mon: { optional: [slot('16:00', '20:00')] },
    Tue: { regular: split() },
    Wed: { regular: split() },
    Thu: { regular: split() },
    Fri: { regular: split() },
    Sat: { regular: [slot('07:00', '15:00')] },
    Sun: { optional: [slot('09:00', '13:00')] },
  },
  // Week 3 — Mon–Fri splits, Wednesday-evening + Saturday overtime
  {
    Mon: { regular: split() },
    Tue: { regular: split() },
    Wed: { regular: split(), optional: [slot('19:30', '22:00')] },
    Thu: { regular: split() },
    Fri: { regular: split() },
    Sat: { optional: [slot('08:00', '14:00')] },
  },
  // Week 4 — live-in, every day
  Object.fromEntries(DAYS.map((d) => [d.short, { regular: liveIn() }])),
];

export function buildInitialAvailability(): Record<string, DayAvail> {
  const out: Record<string, DayAvail> = {};
  INITIAL_PATTERN.forEach((week, w) => {
    for (const { short } of DAYS) out[availKey(w, short)] = week[short] ?? {};
  });
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
  a.length === b.length && a.every((r, i) => r.start === b[i].start && r.end === b[i].end && r.careType === b[i].careType);

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
  if (!slots.length) return { start: '09:00', end: '17:00', careType: DEFAULT_CARE_TYPE };
  const startMins = toMinutes(slots[slots.length - 1].end) || 0;
  const endMins = Math.min(startMins + 60, 23 * 60 + 59);
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  // Another slot is most often the same kind of care, so inherit the last one's type.
  return { start: fmt(startMins), end: fmt(endMins), careType: slots[slots.length - 1].careType };
}

export function formatDuration(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m ? `${h}h ${m}m` : `${h} hours`;
}
