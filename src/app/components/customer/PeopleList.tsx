import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Plus, Search, SlidersHorizontal, ArrowDownAZ, ArrowDownZA, ChevronRight, MapPin, X } from 'lucide-react';
import { Button } from '../buttons/Button';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { useInfoBarBottom } from '../../hooks/useInfoBarBottom';
import type { ListChip } from '../../data/customersListDummy';

// The shared UI of the Customers and Employees lists — the pinned toolbar (white
// panel with filter / sort / search), the A–Z bar, letter-grouped sections, the
// card (header, flags row, details, optional extra row, tag band) and every
// small piece they're built from. Each list supplies only its own data, its
// filter and sort options, and what goes in the card's flags / details / extra
// row, so the two screens stay identical by construction.

export const COLUMNS = 3;

// Whether area tags carry each area's own colour (the bg/fg/border on every
// region chip) or sit in plain neutral white. Owned by the page's bottom-right
// demo toggle and handed down through context, so the card chips and the "all
// tags" tooltip stay in step.
export const AreaColoursContext = createContext(true);
export const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#'];

export type SortDirection = 'asc' | 'desc';

export const letterOf = (surname: string) => {
  const ch = surname.trim()[0]?.toUpperCase() ?? '#';
  return /[A-Z]/.test(ch) ? ch : '#';
};

/**
 * Sections follow the production list: one per letter, except that neighbouring
 * letters are merged ("E · F") while the merged group still fits in a single
 * row of cards — so a lone card doesn't sit under its own heading.
 */
export function buildSections<T extends { surname: string }>(items: T[], direction: SortDirection = 'asc') {
  const byLetter = new Map<string, T[]>();
  items.forEach(c => {
    const l = letterOf(c.surname);
    byLetter.set(l, [...(byLetter.get(l) ?? []), c]);
  });
  const sections: { letters: string[]; items: T[] }[] = [];
  // Letters run A→Z, or Z→A when sorted descending; `items` is already in the
  // chosen order so each letter's own group is too.
  (direction === 'asc' ? LETTERS : [...LETTERS].reverse()).filter(l => byLetter.has(l)).forEach(l => {
    const group = byLetter.get(l)!;
    const last = sections[sections.length - 1];
    if (last && last.items.length + group.length <= COLUMNS) {
      last.letters.push(l);
      last.items.push(...group);
    } else {
      sections.push({ letters: [l], items: [...group] });
    }
  });
  return { sections, byLetter };
}

// Same size/weight as the badges on the Care Management tab (TaskBadge etc. in
// caremanagement/shared.tsx): px-3 py-1, text-sm, font-medium, 1px border. The
// weight goes through the font-medium utility, so the Bolder toggle steps it
// up like every other badge. Flags use rounded-md as those do; tags are
// fully rounded (rounded-full) so the two groups read as different things.
export const badge = 'inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-md border';
export const tagPill = 'inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full border';

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
// while the shadow still fades. Movement is dropped for people who ask for
// reduced motion.
export const CARD_HOVER =
  'cursor-pointer will-change-[translate,box-shadow] transition-[translate,box-shadow,border-color] duration-[400ms] ' +
  'ease-[cubic-bezier(0.22,1,0.36,1)] ' +
  'group-hover:-translate-y-1 group-hover:border-[rgba(154,38,214,0.55)] ' +
  'group-hover:shadow-[0_10px_24px_-8px_rgba(15,23,42,0.16),0_4px_10px_-4px_rgba(15,23,42,0.08)] ' +
  'motion-reduce:transition-none motion-reduce:group-hover:translate-y-0';

export const checkboxClass = 'w-4 h-4 accent-[rgb(154,38,214)] cursor-pointer flex-shrink-0';

// ─── Tags ───────────────────────────────────────────────────────────

export function Chip({ chip }: { chip: ListChip }) {
  const coloured = useContext(AreaColoursContext);
  if (chip.type === 'region') {
    return (
      <span
        className={coloured ? tagPill : `${tagPill} border-gray-200 bg-white text-gray-800`}
        style={coloured ? { backgroundColor: chip.bg, color: chip.fg, borderColor: chip.border } : undefined}
      >
        <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        {chip.label}
      </span>
    );
  }
  return (
    <span className={`${tagPill} border-gray-200 bg-white text-gray-800`}>
      <span className="font-semibold">{chip.key}:</span>
      {chip.value}
    </span>
  );
}

// Area/territory tags are classification, not alerts — so they live in their
// own quiet footer, apart from the flags that someone needs to see before they
// go anywhere near the person. Mixing them let tags push flags out of the row
// and made every card a different shape. Only the first tag is shown (regions
// first, since area is what coordinators scan by); the rest are one
// hover/focus away.
// The tag row sits in a very light grey band running edge to edge along the
// bottom of the card: negative margins cancel the card's own padding (p-4) on
// the sides and bottom, and the bottom corners follow the card's radius.
export const TAGS_BAND = '-mx-4 -mb-4 px-4 py-3 bg-gray-50 border-t border-gray-100 rounded-b-[9px]';

export function TagsFooter({ chips }: { chips: ListChip[] }) {
  // Rendered even with no tags — it's the card's last grid row (see
  // PersonCard), which has to exist for the rows to line up across a row.
  if (chips.length === 0) return <div className={TAGS_BAND} aria-hidden="true" />;
  const ordered = [...chips].sort((a, b) => Number(b.type === 'region') - Number(a.type === 'region'));
  const [first, ...rest] = ordered;
  return (
    <div className={`${TAGS_BAND} flex items-center gap-1.5`}>
      <Chip chip={first} />
      {rest.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            {/* A real button so keyboard users can reach the full list too;
                lifted above the card's stretched link so it isn't swallowed by it. */}
            <button
              type="button"
              aria-label={`Show all ${chips.length} tags`}
              className={`relative z-10 ${tagPill} border-gray-200 bg-white text-gray-700 hover:bg-gray-100 cursor-default outline-none focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50`}
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
export function DetailValue({ text }: { text: string }) {
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

// ─── The card ───────────────────────────────────────────────────────

export interface PersonCardProps {
  name: string;
  /** Only linked cards go anywhere; the made-up ones are inert. */
  href?: string;
  photo?: string;
  initials: string;
  avatarColor: string;
  /** The status badge — pinned to the card's top-right corner. */
  status: ReactNode;
  /**
   * A line of text under the name, beside the avatar (an employee's role). The
   * avatar is 56px tall, so a name plus one 14px line fit within it and the
   * subtitle costs the card no extra height.
   */
  subtitle?: ReactNode;
  /**
   * The flags row's contents. When given (even empty) the row is always
   * rendered, so it's reserved and details line up across cards. Leave it out
   * to drop the row altogether (the Employees list has no flags).
   */
  flags?: ReactNode;
  details: { label: string; value: string }[];
  /**
   * An optional extra row between the details and the tag band — a reserved
   * place for information only some people have (an employee's app activity),
   * so it lines up across a row of cards whether or not a given card has it.
   */
  extraRow?: ReactNode;
  chips: ListChip[];
}

export function PersonCard({ name, href, photo, initials, avatarColor, status, subtitle, flags, details, extraRow, chips }: PersonCardProps) {
  // The whole card is clickable for linked cards, via a "stretched link" on the
  // name — rather than wrapping everything in an <a>, which would put the tags
  // button inside a link (invalid, and it would navigate).
  // font-weight-fixed: the name keeps its normal weight when the Bolder toggle
  // is on — the toggle is about body text, and a name is already a title.
  const nameClass = 'font-weight-fixed min-w-0 max-w-full text-base font-semibold text-gray-900 truncate';
  const stretched = 'after:absolute after:inset-0 after:content-[""] outline-none';
  // Static class strings (Tailwind can't see a built-up `row-span-${n}`).
  // Rows: header / [flags] / details / [extra] / tags.
  const rows = 3 + (flags !== undefined ? 1 : 0) + (extraRow ? 1 : 0);
  const rowSpan = rows === 5 ? 'row-span-5' : rows === 4 ? 'row-span-4' : 'row-span-3';

  return (
    // Static wrapper: the hover target and the card's slot in the list grid
    // (spanning its rows via subgrid). The card inside re-spans them.
    <div className={`group relative hover:z-[5] grid grid-cols-1 grid-rows-subgrid ${rowSpan} mb-4`}>
      <div
        className={`${CARD_HOVER} relative grid grid-cols-1 grid-rows-subgrid ${rowSpan} bg-white rounded-[10px] border border-gray-200 shadow-sm p-4 ${
          href ? 'focus-within:ring-2 focus-within:ring-[rgb(154,38,214)]/50' : ''
        }`}
      >
        {/* items-start: the status badge sits in the top-right corner of the card
            rather than centring against the avatar; the name stays centred on
            the avatar via its own self-center. */}
        <div className="flex items-start gap-3">
          {photo ? (
            <img src={photo} alt="" className="w-14 h-14 rounded-full object-cover object-top bg-gray-100 flex-shrink-0" />
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold text-gray-800 flex-shrink-0"
              style={{ backgroundColor: avatarColor }}
              aria-hidden="true"
            >
              {initials}
            </div>
          )}
          {/* Name, with an optional subtitle line beneath it. Both truncate on their
              own line, so a long name or role never squeezes the other. */}
          <div className="flex-1 min-w-0 self-center flex flex-col">
            {href ? (
              <Link to={href} className={`${nameClass} ${stretched}`} title={name}>{name}</Link>
            ) : (
              <span className={nameClass} title={name}>{name}</span>
            )}
            {subtitle}
          </div>
          {status}
        </div>

        {/* Always rendered when flags are supported: it's the card's second grid
            row, so cards without any still reserve the space and their details
            line up with the neighbouring cards' details. */}
        {flags !== undefined && <div className="flex flex-wrap content-start gap-1.5 pt-3">{flags}</div>}

        {/* text-sm goes on each dt/dd, not the <dl>: a bare dt/dd with no text
            class of its own renders at 16px under the globals.css reset even
            inside a text-sm parent. */}
        {/* With no flags row to give the header some breathing room, the details
            start further down (20px, not 12px) so they don't crowd the name. */}
        <dl className={`space-y-1 ${flags !== undefined ? 'pt-3' : 'pt-5'} ${extraRow ? 'pb-2' : 'pb-3'}`}>
          {details.map(d => (
            <div key={d.label} className="flex gap-2">
              <dt className="text-sm text-gray-500 flex-shrink-0">{d.label}:</dt>
              <DetailValue text={d.value} />
            </div>
          ))}
        </dl>

        {extraRow && <div className="pb-3">{extraRow}</div>}

        <TagsFooter chips={chips} />
      </div>
    </div>
  );
}

// ─── Filter / sort building blocks ──────────────────────────────────

export const chipGroup = (chip: ListChip) => (chip.type === 'region' ? 'Area' : chip.key);
export const chipValue = (chip: ListChip) => (chip.type === 'region' ? chip.label : chip.value);

/** Tag groups for the filter, built from whatever tags the people actually carry (A–Z, values A–Z). */
export function buildTagGroups(people: { chips: ListChip[] }[]) {
  const groups = new Map<string, Set<string>>();
  people.forEach(c => c.chips.forEach(chip => {
    const g = chipGroup(chip);
    if (!groups.has(g)) groups.set(g, new Set());
    groups.get(g)!.add(chipValue(chip));
  }));
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, values]) => ({ group, values: [...values].sort((a, b) => a.localeCompare(b)) }));
}

export type TagGroups = { group: string; values: string[] }[];

/** The collapsible "Tags" part of a filter panel: any value in a group matches, every group with a selection must. */
export function TagFilterSection({ tagGroups, selected, onToggle }: {
  tagGroups: TagGroups;
  /** `${group}::${value}` */
  selected: string[];
  onToggle: (key: string) => void;
}) {
  // A tag group opens by default if something in it is already ticked.
  const [open, setOpen] = useState<Set<string>>(() => new Set(selected.map(t => t.split('::')[0])));
  const toggleOpen = (g: string) => setOpen(prev => {
    const next = new Set(prev);
    next.has(g) ? next.delete(g) : next.add(g);
    return next;
  });
  return (
    <>
      <h3 className="text-sm font-semibold text-gray-900 mt-4 mb-0.5">Tags</h3>
      <div>
        {tagGroups.map(({ group, values }) => {
          const isOpen = open.has(group);
          const ticked = values.filter(v => selected.includes(`${group}::${v}`)).length;
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
                      <input type="checkbox" className={checkboxClass} checked={selected.includes(`${group}::${v}`)} onChange={() => onToggle(`${group}::${v}`)} />
                      {v}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

/** One column of checkboxes in a filter panel. */
export function CheckGroup<K extends string>({ legend, options, selected, onToggle }: {
  legend: string;
  options: { key: K; label: string }[];
  selected: K[];
  onToggle: (key: K) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-gray-900 mb-1">{legend}</legend>
      <div className="space-y-0.5">
        {options.map(o => (
          <label key={o.key} className="flex items-center gap-2.5 py-0.5 text-sm text-gray-900 cursor-pointer">
            <input type="checkbox" className={checkboxClass} checked={selected.includes(o.key)} onChange={() => onToggle(o.key)} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** The panel's footer: live result count and Clear all. */
export function FilterFooter({ resultCount, noun, nounPlural, canClear, onClear }: {
  resultCount: number;
  noun: string;
  nounPlural: string;
  canClear: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 pt-2 mt-2 border-t border-gray-200">
      <span aria-live="polite" className="text-sm text-gray-600">{resultCount} {resultCount === 1 ? noun : nounPlural}</span>
      <Button variant="tertiary" disabled={!canClear} onClick={onClear}>Clear all</Button>
    </div>
  );
}

export function SortGroup({ legend, name, value, onChange, options }: {
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

// ─── The page shell ─────────────────────────────────────────────────

export interface PeopleListLayoutProps<T extends { id: string; surname: string }> {
  title: string;
  addLabel: string;
  noun: string;
  nounPlural: string;
  /** Used for DOM ids (letter-section anchors). */
  idPrefix: string;
  searchPlaceholder: string;
  /** Sample hint in the empty state, e.g. "a name, address, phone number…". */
  emptyHint: string;
  query: string;
  onQueryChange: (q: string) => void;
  filtersCount: number;
  filterPanel: ReactNode;
  onClearFilters: () => void;
  sortPanel: ReactNode;
  sortDirection: SortDirection;
  /** True while the sort is the default one (no dot on the sort icon). */
  sortIsDefault: boolean;
  /** Grouped under A–Z headings (sorted by surname) or one flat run of cards. */
  groupedByLetter: boolean;
  /** Already filtered and sorted. */
  items: T[];
  renderCard: (item: T) => ReactNode;
  colouredAreaTags: boolean;
}

export function PeopleListLayout<T extends { id: string; surname: string }>(p: PeopleListLayoutProps<T>) {
  const total = p.items.length;
  // Sections and the A–Z bar are built from the matches, so letters with no
  // matching person grey out as you type.
  const { sections, byLetter } = buildSections(p.items, p.sortDirection);
  const displaySections = p.groupedByLetter ? sections : [{ letters: [] as string[], items: p.items }];

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
    document.getElementById(`${p.idPrefix}-section-${letter}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const countLabel = `${total} ${total === 1 ? p.noun : p.nounPlural}`;

  return (
    <AreaColoursContext.Provider value={p.colouredAreaTags}>
      <div className="space-y-4">
        {/* -mx-6/-mt-6 with matching padding: the pinned block reaches the full
            width of <main>'s gutters and tucks up into its top padding, so
            scrolled content can't show around it, without moving it at rest. */}
        <div
          ref={toolbarRef}
          className="sticky z-30 -mx-6 -mt-6 px-6 pt-3.5 pb-3 bg-gray-50 border-b border-gray-200 space-y-4"
          style={{ top: headerBottom }}
        >
          {/* items-start + leading-none: the title's top lines up with the top of
              the add button, rather than floating at the row's vertical centre.
              mb-3.5 (14px) replaces the 16px that space-y-4 would put beneath
              this row, paying for the 2px added to the padding above it: the two
              gaps match. (It overrides, not adds to, space-y's margin.) */}
          <div className="flex items-start justify-between gap-4 mb-3.5">
            <h1 className="text-xl leading-none font-semibold text-gray-900">{p.title}</h1>
            <Button variant="primary" icon={<Plus className="w-4 h-4" />}>{p.addLabel}</Button>
          </div>

          {/* Filter, sort and search share one white panel — only as wide as its
              contents, not the full page width. */}
          <div className="flex items-center gap-3 w-fit max-w-full bg-white rounded-[10px] border border-gray-200 shadow-sm p-3">
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" aria-label={p.filtersCount > 0 ? `Filter (${p.filtersCount} applied)` : 'Filter'} className="relative p-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                  <SlidersHorizontal className="w-5 h-5" />
                  {/* Purple dot while any filter is applied. */}
                  {p.filtersCount > 0 && <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[rgb(154,38,214)] border-2 border-white" />}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[min(720px,calc(100vw-3rem))] p-4">
                {p.filterPanel}
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" aria-label="Sort" className="relative p-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                  {p.sortDirection === 'asc' ? <ArrowDownAZ className="w-5 h-5" /> : <ArrowDownZA className="w-5 h-5" />}
                  {/* Small purple dot while the sort differs from the default (surname, A–Z). */}
                  {!p.sortIsDefault && <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[rgb(154,38,214)] border-2 border-white" />}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-4">
                {p.sortPanel}
              </PopoverContent>
            </Popover>
            <div role="search" className="relative w-[36rem] min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" aria-hidden="true" />
              <input
                type="text"
                value={p.query}
                onChange={e => p.onQueryChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') p.onQueryChange(''); }}
                placeholder={p.searchPlaceholder}
                aria-label={p.searchPlaceholder.replace(/\.+$/, '')}
                className="w-full pl-9 pr-40 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[rgb(154,38,214)] focus:ring-1 focus:ring-[rgb(154,38,214)]"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                {p.query && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => p.onQueryChange('')}
                    className="pointer-events-auto p-0.5 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {/* Live region so a screen reader hears the count change as you type. */}
                <span aria-live="polite" className="text-sm text-gray-600">{countLabel}</span>
              </div>
            </div>
          </div>

          {/* A–Z jump bar — letters with nobody in them are disabled, and so is
              the whole bar when the list isn't grouped by surname. */}
          <div
            role="navigation"
            aria-label="Jump to letter"
            title={p.groupedByLetter ? undefined : 'Letters are only available when sorted by surname'}
            className="flex flex-wrap gap-0.5"
          >
            {LETTERS.map(l => {
              const count = byLetter.get(l)?.length ?? 0;
              return (
                <button
                  key={l}
                  type="button"
                  disabled={!p.groupedByLetter || count === 0}
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

        {total === 0 && (
          <div className="py-16 text-center">
            <p className="text-base font-semibold text-gray-900">
              {p.query.trim()
                ? <>No {p.nounPlural} match “{p.query.trim()}”{p.filtersCount > 0 && ' with these filters'}</>
                : `No ${p.nounPlural} match these filters`}
            </p>
            <p className="text-sm text-gray-600 mt-1">Try {p.emptyHint}, or loosen the filters.</p>
            <div className="mt-4 flex justify-center gap-3">
              {p.query && <Button variant="tertiary" onClick={() => p.onQueryChange('')}>Clear search</Button>}
              {p.filtersCount > 0 && <Button variant="tertiary" onClick={p.onClearFilters}>Clear filters</Button>}
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
                        <span id={`${p.idPrefix}-section-${l}`} style={{ scrollMarginTop: headerBottom + toolbarHeight + 8 }}>{l}</span>
                      </span>
                    ))}
                  </span>
                  <span aria-hidden="true" className="flex-1 h-0.5 bg-gray-200" />
                </h2>
              )}
              {/* Each card spans its rows of this grid via subgrid (header / flags /
                  details / [extra] / tags), so those rows are as tall as the tallest
                  card in the row — which is what lines details and tag rows up
                  across cards. Vertical spacing between card rows is the cards' own
                  bottom margin, since a row-gap here would also open up inside every
                  card. */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-0 mt-1">
                {section.items.map(item => <div key={item.id} className="contents">{p.renderCard(item)}</div>)}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AreaColoursContext.Provider>
  );
}
