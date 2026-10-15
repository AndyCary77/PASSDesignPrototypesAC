import { useEffect, useMemo, useRef, useState } from 'react';
import { useInfoBarBottom } from '../../hooks/useInfoBarBottom';
import { Link } from 'react-router';
import { Plus, Search, SlidersHorizontal, ArrowDownAZ, ArrowDownZA, ChevronRight, HeartPulse, Lock, MapPin, TriangleAlert, X } from 'lucide-react';
import { Button } from '../buttons/Button';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { CUSTOMERS_LIST_DUMMY, STATUS_LABEL, type ListChip, type ListCustomer, type ListStatus } from '../../data/customersListDummy';

// Static recreation of the production Customers list layout (header, filter/
// sort/search bar, A–Z letter bar, letter-grouped sections of three-up
// customer cards), built with this repo's own badge styling rather than the
// production CSS. Nothing here is interactive yet except the letter bar
// scrolling to a section and the scenario customers linking through.

const COLUMNS = 3;

// Area tags are currently shown in plain neutral grey (like the other tags,
// keeping their map pin). Flip to true to bring back each area's own colour
// (the bg/fg/border carried on every region chip in customersListDummy.ts).
const COLOURED_AREA_TAGS = false;
const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#'];

const letterOf = (c: ListCustomer) => {
  const ch = c.surname.trim()[0]?.toUpperCase() ?? '#';
  return /[A-Z]/.test(ch) ? ch : '#';
};

type SortBy = 'surname' | 'review';
type SortDirection = 'asc' | 'desc';

// dd-mm-yyyy -> sortable number; customers with no review date have none.
const reviewTime = (c: ListCustomer) => {
  if (!c.reviewDate) return null;
  const [d, m, y] = c.reviewDate.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
};

function sortCustomers(customers: ListCustomer[], by: SortBy, direction: SortDirection) {
  const sign = direction === 'asc' ? 1 : -1;
  return [...customers].sort((a, b) => {
    if (by === 'review') {
      const ta = reviewTime(a);
      const tb = reviewTime(b);
      // No review date always goes last, whichever way it's sorted.
      if (ta === null && tb === null) return a.surname.localeCompare(b.surname);
      if (ta === null) return 1;
      if (tb === null) return -1;
      return sign * (ta - tb) || a.surname.localeCompare(b.surname);
    }
    return sign * a.surname.localeCompare(b.surname);
  });
}

// ─── Filters ────────────────────────────────────────────────────────
// Status: any of the ticked statuses. Review date: one window. Tags: grouped
// like the dropdown — within a group any ticked value matches, across groups
// every group with something ticked has to match.
type ReviewWindow = 'today' | '7days' | '4weeks';

type AlertKey = 'highRisk' | 'dnacpr' | 'dols' | 'allergies';

interface Filters {
  statuses: ListStatus[];
  /** Safety / legal flags — a customer matches if they carry any of the ticked ones. */
  alerts: AlertKey[];
  review: ReviewWindow | null;
  /** `${group}::${value}` */
  tags: string[];
}

const NO_FILTERS: Filters = { statuses: [], alerts: [], review: null, tags: [] };

const ALERT_OPTIONS: { key: AlertKey; label: string }[] = [
  { key: 'highRisk', label: 'High risk' },
  { key: 'dnacpr', label: 'DNACPR' },
  { key: 'dols', label: 'DoLS' },
  { key: 'allergies', label: 'Allergies' },
];

const STATUS_ORDER: ListStatus[] = ['assessment-booked', 'assessment-completed', 'active', 'inactive', 'finished'];
const REVIEW_OPTIONS: { value: ReviewWindow; label: string }[] = [
  { value: 'today', label: 'Due today' },
  { value: '7days', label: 'Due in the next 7 days' },
  { value: '4weeks', label: 'Due in the next 4 weeks' },
];

const chipGroup = (chip: ListChip) => (chip.type === 'region' ? 'Area' : chip.key);
const chipValue = (chip: ListChip) => (chip.type === 'region' ? chip.label : chip.value);

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

function inReviewWindow(c: ListCustomer, window: ReviewWindow) {
  const t = reviewTime(c);
  if (t === null) return false;
  const days = Math.round((t - startOfToday()) / 86_400_000);
  if (window === 'today') return days === 0;
  if (window === '7days') return days >= 0 && days <= 7;
  return days >= 0 && days <= 28;
}

function matchesFilters(c: ListCustomer, f: Filters) {
  if (f.statuses.length > 0 && !f.statuses.includes(c.status)) return false;
  if (f.alerts.length > 0 && !f.alerts.some(k => c[k])) return false;
  if (f.review && !inReviewWindow(c, f.review)) return false;
  if (f.tags.length > 0) {
    const mine = new Set(c.chips.map(chip => `${chipGroup(chip)}::${chipValue(chip)}`));
    const byGroup = new Map<string, string[]>();
    f.tags.forEach(t => {
      const group = t.split('::')[0];
      byGroup.set(group, [...(byGroup.get(group) ?? []), t]);
    });
    for (const selected of byGroup.values()) {
      if (!selected.some(t => mine.has(t))) return false;
    }
  }
  return true;
}

const activeFilterCount = (f: Filters) => f.statuses.length + f.alerts.length + (f.review ? 1 : 0) + f.tags.length;

/**
 * Sections follow the production list: one per letter, except that neighbouring
 * letters are merged ("E · F") while the merged group still fits in a single
 * row of cards — so a lone card doesn't sit under its own heading.
 */
function buildSections(customers: ListCustomer[], direction: SortDirection = 'asc') {
  const byLetter = new Map<string, ListCustomer[]>();
  customers.forEach(c => {
    const l = letterOf(c);
    byLetter.set(l, [...(byLetter.get(l) ?? []), c]);
  });
  const sections: { letters: string[]; customers: ListCustomer[] }[] = [];
  // Letters run A→Z, or Z→A when sorted descending; `customers` is already in
  // the chosen order so each letter's own group is too.
  (direction === 'asc' ? LETTERS : [...LETTERS].reverse()).filter(l => byLetter.has(l)).forEach(l => {
    const group = byLetter.get(l)!;
    const last = sections[sections.length - 1];
    if (last && last.customers.length + group.length <= COLUMNS) {
      last.letters.push(l);
      last.customers.push(...group);
    } else {
      sections.push({ letters: [l], customers: [...group] });
    }
  });
  return { sections, byLetter };
}

// Same size/weight as the badges on the Care Management tab (TaskBadge etc. in
// caremanagement/shared.tsx): px-3 py-1, text-sm, font-medium, 1px border. The
// weight goes through the font-medium utility, so the Bolder toggle steps it
// up like every other badge. Flags use rounded-md as those do; tags are
// fully rounded (rounded-full) so the two groups read as different things.
// Hover on every card (as the real list's cards are all clickable): the card
// lifts 4px and its shadow spreads wider and softer, so it reads as being
// picked up off the page rather than just darkening — kept gentle. The brand-
// purple border stays clearly visible through the shadow.
//
// Two layers on purpose: a static wrapper (the hover target, `group`) and the
// card inside it, which is what actually moves (`group-hover:`). If the moving
// element were also the hover target, lifting it would pull its bottom edge
// out from under a pointer resting near it, un-hovering it, dropping it back,
// re-hovering it... — the jitter. With a static target the pointer is never
// "outside" mid-move.
//
// Easing is a long-tailed ease-out (fast start, very soft landing) over 400ms,
// with the shadow/border on the same curve so they settle together.
// NB Tailwind v4's translate-* utilities set the CSS `translate` property, not
// `transform` — so it's `translate` that has to be listed in the transition
// (and will-change); listing `transform` leaves the move un-animated (a snap)
// while the shadow still fades. Movement is dropped for
// people who ask for reduced motion.
const CARD_HOVER =
  'cursor-pointer will-change-[translate,box-shadow] transition-[translate,box-shadow,border-color] duration-[400ms] ' +
  'ease-[cubic-bezier(0.22,1,0.36,1)] ' +
  'group-hover:-translate-y-1 group-hover:border-[rgba(154,38,214,0.55)] ' +
  'group-hover:shadow-[0_10px_24px_-8px_rgba(15,23,42,0.16),0_4px_10px_-4px_rgba(15,23,42,0.08)] ' +
  'motion-reduce:transition-none motion-reduce:group-hover:translate-y-0';

// Everything on a card that a search should be able to find: name, status,
// contact and address details, flags, and every tag (area, territory, etc.).
function searchableText(c: ListCustomer) {
  return [
    c.fullName,
    STATUS_LABEL[c.status],
    c.dob,
    c.telephone ?? '',
    c.address,
    c.highRisk ? 'high risk' : '',
    c.dnacpr ? 'dnacpr' : '',
    c.dols ? 'dols' : '',
    c.allergies ? 'allergies' : '',
    c.reviewDate ? `review ${c.reviewDate}` : '',
    ...c.chips.map(chip => (chip.type === 'region' ? chip.label : `${chip.key} ${chip.value}`)),
  ]
    .join(' ')
    .toLowerCase();
}

/** Every space-separated term has to match somewhere, in any order ("lichfield dnacpr"). */
function matchesQuery(c: ListCustomer, query: string) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = searchableText(c);
  return terms.every(t => haystack.includes(t));
}

const badge = 'inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-md border';
const tagPill = 'inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full border';

function StatusBadge({ customer }: { customer: ListCustomer }) {
  const label = STATUS_LABEL[customer.status];
  if (customer.status === 'active') {
    return (
      <span className={`${badge} flex-shrink-0`} style={{ backgroundColor: '#D4EBC3', color: '#2D5F1E', borderColor: '#AFDB98' }}>
        {label}
      </span>
    );
  }
  // Assessment stages read amber; inactive / finished are muted grey.
  const tone = customer.status === 'inactive' || customer.status === 'finished'
    ? 'bg-gray-100 text-gray-600 border-gray-300'
    : 'bg-amber-100 text-amber-700 border-amber-300';
  return <span className={`${badge} flex-shrink-0 ${tone}`}>{label}</span>;
}

function Chip({ chip }: { chip: ListChip }) {
  if (chip.type === 'region') {
    return (
      <span
        className={COLOURED_AREA_TAGS ? tagPill : `${tagPill} border-gray-200 bg-gray-100 text-gray-800`}
        style={COLOURED_AREA_TAGS ? { backgroundColor: chip.bg, color: chip.fg, borderColor: chip.border } : undefined}
      >
        <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        {chip.label}
      </span>
    );
  }
  return (
    <span className={`${tagPill} border-gray-200 bg-gray-100 text-gray-800`}>
      <span className="font-semibold">{chip.key}:</span>
      {chip.value}
    </span>
  );
}

// Area/territory tags are classification, not alerts — so they live in their
// own quiet footer, apart from the flags (High risk, DNACPR, DoLS, review
// date) that someone needs to see before they go anywhere near the customer.
// Mixing them let tags push flags out of the row and made every card a
// different shape. Only the first tag is shown (regions first, since area is
// what coordinators scan by); the rest are one hover/focus away.
function TagsFooter({ chips }: { chips: ListChip[] }) {
  // Rendered even with no tags — it's the card's last grid row (see
  // CustomerCard), which has to exist for the rows to line up across a row.
  if (chips.length === 0) return <div className="pt-3 border-t border-gray-100" aria-hidden="true" />;
  const ordered = [...chips].sort((a, b) => Number(b.type === 'region') - Number(a.type === 'region'));
  const [first, ...rest] = ordered;
  return (
    <div className="flex items-center gap-1.5 pt-3 border-t border-gray-100">
      <Chip chip={first} />
      {rest.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            {/* A real button so keyboard users can reach the full list too;
                lifted above the card's stretched link so it isn't swallowed by it. */}
            <button
              type="button"
              aria-label={`Show all ${chips.length} tags`}
              className={`relative z-10 ${tagPill} border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-default outline-none focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50`}
            >
              +{rest.length} more
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-sm bg-white text-gray-900 border border-gray-200 shadow-lg p-3"
            arrowClassName="bg-white fill-white"
          >
            <p className="text-sm font-semibold text-gray-900 mb-2">All tags</p>
            <div className="flex flex-wrap gap-1.5">
              {ordered.map((chip, i) => <Chip key={i} chip={chip} />)}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

/**
 * A detail value that truncates with an ellipsis when it doesn't fit, and only
 * then shows the full text in a tooltip on hover — so a short value never gets
 * a pointless tooltip. Truncation is re-measured as the card resizes. When it
 * is truncated the value is lifted above the card's stretched link (so it can
 * receive the hover); when it isn't, it stays under it and the whole card
 * remains one click target.
 */
function DetailValue({ text }: { text: string }) {
  const ref = useRef<HTMLElement>(null);
  const [truncated, setTruncated] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setTruncated(el.scrollWidth > el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  return (
    <Tooltip open={open && truncated} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <dd ref={ref} className={`text-sm text-gray-900 truncate min-w-0 ${truncated ? 'relative z-10' : ''}`}>{text}</dd>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs break-words bg-white text-gray-900 border border-gray-200 shadow-lg"
        arrowClassName="bg-white fill-white"
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function CustomerCard({ customer }: { customer: ListCustomer }) {
  // Flags: the safety/legal/review information, always shown in full.
  const flags: React.ReactNode[] = [];
  if (customer.highRisk) {
    flags.push(
      <span key="hr" className={`${badge} bg-red-700 text-white border-red-700`}>
        HIGH RISK
      </span>,
    );
  }
  if (customer.dnacpr) {
    flags.push(
      <span key="dnr" className={`${badge} bg-red-100 text-red-800 border-red-200`}>
        <HeartPulse className="w-4 h-4" aria-hidden="true" />
        DNACPR
      </span>,
    );
  }
  if (customer.dols) {
    flags.push(
      <span key="dols" className={`${badge} bg-red-100 text-red-800 border-red-200`}>
        <Lock className="w-4 h-4" aria-hidden="true" />
        DoLS
      </span>,
    );
  }
  if (customer.allergies) {
    flags.push(
      <span key="allergies" className={`${badge} bg-red-100 text-red-800 border-red-200`}>
        <TriangleAlert className="w-4 h-4" aria-hidden="true" />
        Allergies
      </span>,
    );
  }
  if (customer.reviewDate) {
    flags.push(
      <span
        key="review"
        title={customer.reviewOverdue ? 'Care plan review overdue' : 'Care plan review date'}
        className={`${badge} ${customer.reviewOverdue ? 'bg-red-100 text-red-800 border-red-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
      >
        Review {customer.reviewDate}
      </span>,
    );
  }

  // The whole card is clickable for the scenario customers, via a "stretched
  // link" on the name — rather than wrapping everything in an <a>, which
  // would put the tags button inside a link (invalid, and it would navigate).
  const nameClass = 'flex-1 min-w-0 self-center text-base font-semibold text-gray-900 truncate';
  const stretched = 'after:absolute after:inset-0 after:content-[""] outline-none';

  return (
    // Static wrapper: the hover target and the card's slot in the list grid
    // (spanning its 4 rows via subgrid). The card inside re-spans them.
    <div className="group relative hover:z-[5] grid grid-cols-1 grid-rows-subgrid row-span-4 mb-4">
    <div
      className={`${CARD_HOVER} relative grid grid-cols-1 grid-rows-subgrid row-span-4 bg-white rounded-[10px] border border-gray-200 shadow-sm p-4 ${
        customer.href ? 'focus-within:ring-2 focus-within:ring-[rgb(154,38,214)]/50' : ''
      }`}
    >
      {/* items-start: the status badge sits in the top-right corner of the card
          rather than centring against the avatar; the name stays centred on
          the avatar via its own self-center. */}
      <div className="flex items-start gap-3">
        {customer.photo ? (
          <img src={customer.photo} alt="" className="w-14 h-14 rounded-full object-cover object-top bg-gray-100 flex-shrink-0" />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold text-gray-800 flex-shrink-0"
            style={{ backgroundColor: customer.avatarColor }}
            aria-hidden="true"
          >
            {customer.initials}
          </div>
        )}
        {customer.href ? (
          <Link to={customer.href} className={`${nameClass} ${stretched}`} title={customer.fullName}>{customer.fullName}</Link>
        ) : (
          <span className={nameClass} title={customer.fullName}>{customer.fullName}</span>
        )}
        <StatusBadge customer={customer} />
      </div>

      {/* Always rendered: flags are the card's second grid row, so cards
          without any still reserve the space and their details line up with
          the neighbouring cards' details. */}
      <div className="flex flex-wrap content-start gap-1.5 pt-3">{flags}</div>

      {/* text-sm goes on each dt/dd, not the <dl>: a bare dt/dd with no text
          class of its own renders at 16px under the globals.css reset even
          inside a text-sm parent. */}
      <dl className="pt-3 pb-3 space-y-1">
        <div className="flex gap-2"><dt className="text-sm text-gray-500 flex-shrink-0">Date of Birth:</dt><DetailValue text={customer.dob} /></div>
        <div className="flex gap-2"><dt className="text-sm text-gray-500 flex-shrink-0">Telephone:</dt><DetailValue text={customer.telephone ?? 'Not provided'} /></div>
        <div className="flex gap-2"><dt className="text-sm text-gray-500 flex-shrink-0">Address:</dt><DetailValue text={customer.address} /></div>
      </dl>

      <TagsFooter chips={customer.chips} />
    </div>
    </div>
  );
}

/** Tag groups for the filter, built from whatever tags the customers actually carry (A–Z, values A–Z). */
function buildTagGroups(customers: ListCustomer[]) {
  const groups = new Map<string, Set<string>>();
  customers.forEach(c => c.chips.forEach(chip => {
    const g = chipGroup(chip);
    if (!groups.has(g)) groups.set(g, new Set());
    groups.get(g)!.add(chipValue(chip));
  }));
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, values]) => ({ group, values: [...values].sort((a, b) => a.localeCompare(b)) }));
}

const checkboxClass = 'w-4 h-4 accent-[rgb(154,38,214)] cursor-pointer flex-shrink-0';

function FilterPanel({ filters, onChange, tagGroups, resultCount }: {
  filters: Filters;
  onChange: (f: Filters) => void;
  tagGroups: { group: string; values: string[] }[];
  resultCount: number;
}) {
  // A tag group opens by default if something in it is already ticked.
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(filters.tags.map(t => t.split('::')[0])),
  );
  const toggleOpen = (g: string) => setOpen(prev => {
    const next = new Set(prev);
    next.has(g) ? next.delete(g) : next.add(g);
    return next;
  });
  const toggleStatus = (s: ListStatus) =>
    onChange({ ...filters, statuses: filters.statuses.includes(s) ? filters.statuses.filter(x => x !== s) : [...filters.statuses, s] });
  const toggleAlert = (k: AlertKey) =>
    onChange({ ...filters, alerts: filters.alerts.includes(k) ? filters.alerts.filter(x => x !== k) : [...filters.alerts, k] });
  const toggleTag = (key: string) =>
    onChange({ ...filters, tags: filters.tags.includes(key) ? filters.tags.filter(x => x !== key) : [...filters.tags, key] });
  const count = activeFilterCount(filters);

  return (
    <div className="flex flex-col max-h-[min(80vh,720px)]">
      <div className="overflow-y-auto pr-1">
        <div className="flex gap-8">
          <fieldset>
            <legend className="text-sm font-semibold text-gray-900 mb-1">Status</legend>
            <div className="space-y-0.5">
              {STATUS_ORDER.map(s => (
                <label key={s} className="flex items-center gap-2.5 py-0.5 text-sm text-gray-900 cursor-pointer">
                  <input type="checkbox" className={checkboxClass} checked={filters.statuses.includes(s)} onChange={() => toggleStatus(s)} />
                  {STATUS_LABEL[s]}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-gray-900 mb-1">Review date</legend>
            <div className="space-y-0.5">
              {REVIEW_OPTIONS.map(o => (
                <label key={o.value} className="flex items-center gap-2.5 py-0.5 text-sm text-gray-900 cursor-pointer">
                  <input
                    type="radio"
                    name="customers-filter-review"
                    className={checkboxClass}
                    checked={filters.review === o.value}
                    onChange={() => onChange({ ...filters, review: o.value })}
                  />
                  {o.label}
                </label>
              ))}
              {/* A radio can't be un-picked, so there's an explicit way back to "any". */}
              {filters.review && (
                <button
                  type="button"
                  onClick={() => onChange({ ...filters, review: null })}
                  className="mt-1 text-sm font-medium text-[rgb(109,27,152)] hover:underline cursor-pointer"
                >
                  Any review date
                </button>
              )}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-gray-900 mb-1">Alerts</legend>
            <div className="space-y-0.5">
              {ALERT_OPTIONS.map(o => (
                <label key={o.key} className="flex items-center gap-2.5 py-0.5 text-sm text-gray-900 cursor-pointer">
                  <input type="checkbox" className={checkboxClass} checked={filters.alerts.includes(o.key)} onChange={() => toggleAlert(o.key)} />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <h3 className="text-sm font-semibold text-gray-900 mt-4 mb-0.5">Tags</h3>
        <div>
          {tagGroups.map(({ group, values }) => {
            const isOpen = open.has(group);
            const ticked = values.filter(v => filters.tags.includes(`${group}::${v}`)).length;
            return (
              <div key={group} className="border-b border-gray-300 last:border-b-0">
                <button
                  type="button"
                  onClick={() => toggleOpen(group)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-2 py-2 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                >
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
                  {group}
                  {ticked > 0 && <span className="text-sm font-medium text-[rgb(109,27,152)]">({ticked})</span>}
                </button>
                {isOpen && (
                  <div className="pb-2 pl-6 grid grid-cols-3 gap-x-4">
                    {values.map(v => (
                      <label key={v} className="flex items-center gap-2.5 py-0.5 text-sm text-gray-900 cursor-pointer">
                        <input type="checkbox" className={checkboxClass} checked={filters.tags.includes(`${group}::${v}`)} onChange={() => toggleTag(`${group}::${v}`)} />
                        {v}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-2 mt-2 border-t border-gray-200">
        <span aria-live="polite" className="text-sm text-gray-600">{resultCount} {resultCount === 1 ? 'customer' : 'customers'}</span>
        <Button variant="tertiary" disabled={count === 0} onClick={() => onChange(NO_FILTERS)}>Clear all</Button>
      </div>
    </div>
  );
}

function SortGroup({ legend, name, value, onChange, options }: {
  legend: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-gray-900 mb-1">{legend}</legend>
      <div className="space-y-1">
        {options.map(o => (
          <label key={o.value} className="flex items-center gap-2.5 py-0.5 text-sm text-gray-900 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="w-4 h-4 accent-[rgb(154,38,214)] cursor-pointer"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function CustomersListDummy() {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('surname');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  // Nothing is filtered by default (the production dropdown can start with
  // Active ticked; here that would hide the assessment-stage scenario customers).
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const tagGroups = useMemo(() => buildTagGroups(CUSTOMERS_LIST_DUMMY), []);
  const filtersCount = activeFilterCount(filters);
  const filtered = useMemo(
    () => sortCustomers(CUSTOMERS_LIST_DUMMY.filter(c => matchesFilters(c, filters) && matchesQuery(c, query)), sortBy, sortDirection),
    [query, filters, sortBy, sortDirection],
  );
  // Grouped under A–Z headings only when sorted by surname — a review-date
  // order has no letters to group by, so it's one flat run of cards and the
  // A–Z bar is switched off. Sections and the bar are built from the matches,
  // so letters with no matching customer grey out as you type.
  const groupedByLetter = sortBy === 'surname';
  const { sections, byLetter } = buildSections(filtered, sortDirection);
  const displaySections = groupedByLetter ? sections : [{ letters: [] as string[], customers: filtered }];
  const total = filtered.length;
  const sortIsDefault = sortBy === 'surname' && sortDirection === 'asc';

  // The header row, filters and letter bar are pinned just below the app's
  // own sticky header so the list scrolls underneath them. `headerBottom` is
  // where that header currently ends; `toolbarHeight` is how tall the pinned
  // block is, so the sticky letter headings (and letter-bar jumps) can stop
  // below both rather than sliding under the toolbar.
  const headerBottom = useInfoBarBottom();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  useEffect(() => {
    const el = toolbarRef.current;
    if (!el) return;
    const measure = () => setToolbarHeight(el.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const jumpTo = (letter: string) => {
    document.getElementById(`customers-section-${letter}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-4">
      {/* -mx-6/-mt-6 with matching padding: the pinned block reaches the full
          width of <main>'s gutters and tucks up into its top padding, so
          scrolled content can't show around it, without moving it at rest. */}
      <div
        ref={toolbarRef}
        className="sticky z-30 -mx-6 -mt-6 px-6 pt-6 pb-3 bg-gray-50 border-b border-gray-200 space-y-4"
        style={{ top: headerBottom }}
      >
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-900">Customers</h1>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />}>Add customer</Button>
      </div>

      {/* Filter, sort and search share one white panel — only as wide as its
          contents, not the full page width. */}
      <div className="flex items-center gap-3 w-fit max-w-full bg-white rounded-[10px] border border-gray-200 shadow-sm p-3">
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" aria-label={filtersCount > 0 ? `Filter (${filtersCount} applied)` : 'Filter'} className="relative p-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
              <SlidersHorizontal className="w-5 h-5" />
              {/* Purple dot while any filter is applied. */}
              {filtersCount > 0 && <span aria-hidden="true" className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[rgb(154,38,214)] border-2 border-gray-50" />}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[min(720px,calc(100vw-3rem))] p-4">
            <FilterPanel filters={filters} onChange={setFilters} tagGroups={tagGroups} resultCount={total} />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" aria-label="Sort" className="relative p-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
              {sortDirection === 'asc' ? <ArrowDownAZ className="w-5 h-5" /> : <ArrowDownZA className="w-5 h-5" />}
              {/* Small purple dot while the sort differs from the default (surname, A–Z). */}
              {!sortIsDefault && <span aria-hidden="true" className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[rgb(154,38,214)] border-2 border-gray-50" />}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-4">
            <div className="flex gap-8">
              <SortGroup
                legend="Sort by"
                name="customers-sort-by"
                value={sortBy}
                onChange={v => setSortBy(v as SortBy)}
                options={[{ value: 'surname', label: 'Surname' }, { value: 'review', label: 'Review date' }]}
              />
              <SortGroup
                legend="Sort direction"
                name="customers-sort-direction"
                value={sortDirection}
                onChange={v => setSortDirection(v as SortDirection)}
                options={[{ value: 'asc', label: 'Ascending' }, { value: 'desc', label: 'Descending' }]}
              />
            </div>
          </PopoverContent>
        </Popover>
        <div role="search" className="relative w-[36rem] min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') setQuery(''); }}
            placeholder="Search customers..."
            aria-label="Search customers"
            className="w-full pl-9 pr-40 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[rgb(154,38,214)] focus:ring-1 focus:ring-[rgb(154,38,214)]"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery('')}
                className="pointer-events-auto p-0.5 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {/* Live region so a screen reader hears the count change as you type. */}
            <span aria-live="polite" className="text-sm text-gray-600">{total} {total === 1 ? 'customer' : 'customers'}</span>
          </div>
        </div>
      </div>

      {/* A–Z jump bar — letters with no customers are disabled, and so is the
          whole bar when the list isn't grouped by surname. */}
      <div
        role="navigation"
        aria-label="Jump to letter"
        title={groupedByLetter ? undefined : 'Letters are only available when sorted by surname'}
        className="flex flex-wrap gap-0.5"
      >
        {LETTERS.map(l => {
          const count = byLetter.get(l)?.length ?? 0;
          return (
            <button
              key={l}
              type="button"
              disabled={!groupedByLetter || count === 0}
              aria-label={`${l} (${count})`}
              onClick={() => jumpTo(l)}
              className="w-8 h-8 rounded-md text-sm font-semibold text-[rgb(109,27,152)] hover:bg-purple-50 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-default cursor-pointer"
            >
              {l}
            </button>
          );
        })}
      </div>
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-base font-semibold text-gray-900">
            {query.trim() ? <>No customers match “{query.trim()}”{filtersCount > 0 && ' with these filters'}</> : 'No customers match these filters'}
          </p>
          <p className="text-sm text-gray-600 mt-1">Try a name, address, phone number, area or flag like DNACPR, or loosen the filters.</p>
          <div className="mt-4 flex justify-center gap-3">
            {query && <Button variant="tertiary" onClick={() => setQuery('')}>Clear search</Button>}
            {filtersCount > 0 && <Button variant="tertiary" onClick={() => setFilters(NO_FILTERS)}>Clear filters</Button>}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {displaySections.map(section => (
          <section key={section.letters.join('') || 'all'}>
            {/* The letter, then a subtle rule running out to the right edge of
                the content so each group reads as a labelled band. Not shown
                when the list isn't grouped by letter. */}
            {section.letters.length > 0 && (
            <h2
              className="sticky z-10 bg-gray-50 py-2 flex items-center gap-4 text-lg font-semibold text-gray-900"
              style={{ top: headerBottom + toolbarHeight }}
            >
              <span>
                {section.letters.map((l, i) => (
                  <span key={l}>
                    {i > 0 && <span className="mx-2 text-gray-400">·</span>}
                    <span id={`customers-section-${l}`} style={{ scrollMarginTop: headerBottom + toolbarHeight + 8 }}>{l}</span>
                  </span>
                ))}
              </span>
              <span aria-hidden="true" className="flex-1 h-0.5 bg-gray-200" />
            </h2>
            )}
            {/* Each card spans 4 rows of this grid via subgrid (header / flags /
                details / tags), so those rows are as tall as the tallest card in
                the row — which is what lines details and tag rows up across cards.
                Vertical spacing between card rows is the cards' own bottom margin,
                since a row-gap here would also open up inside every card. */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-0 mt-1">
              {section.customers.map(c => <CustomerCard key={c.id} customer={c} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
