import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ChevronDown, Minus, Plus, Search, SlidersHorizontal, X, type LucideIcon } from 'lucide-react';
import { Button } from '../buttons/Button';
import { SegmentedControl } from '../buttons/SegmentedControl';
import { PaginationBar } from '../buttons/PaginationBar';
import { EditSlideout } from '../layout/EditSlideout';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { CheckGroup, FilterFooter, badge } from '../customer/PeopleList';
import { TagSummaryPill } from './TagSummaryPill';
import { Tag } from '../ui/tag';
import { TableScrollbars } from '../ui/table-scrollbars';
import { customerRelationsOf, disfavouredOf, relationsOf, type RelationChange } from './personRelations';
import { BulkEditSlideout, type BulkColumn } from './BulkEditSlideout';
import { ColumnFilter, NO_FILTERS, PeopleFilterPanel, describeMissing, describeRule, ruleMatches, type FilterColumn, type FilterRule, type PeopleFilters } from './PeopleFilter';
import { ALL_CUSTOMERS, ALL_EMPLOYEES, type TagPerson } from './tagMembers';
import type { TagSummary, TagType } from './tagsMockData';
import {
  ALL_TAG_TYPES,
  PLACEMENTS,
  placementInfo,
  typeName,
  type Allocation,
  type BulkChange,
  type Placement,
  type PersonKind,
  kindOf,
} from './tagAllocations';

// Tag assignments (Review allocations in the code): where every tag is used. By tag, a grid of the tags against the six
// places a tag can sit (a number in each cell that opens the people behind it); or by person,
// one row each with everything they've been given.

const LIGHT_TOOLTIP = {
  className: 'bg-white text-gray-900 border border-gray-200 shadow-lg',
  arrowClassName: 'bg-white fill-white',
} as const;

const PERSON_PAGE_SIZES = [12, 50, 100];
const GREY = '#f6f7f9';

const noun = (kind: PersonKind, n: number) => (kind === 'customer' ? (n === 1 ? 'customer' : 'customers') : n === 1 ? 'employee' : 'employees');
const distinct = (list: Allocation[]) => new Set(list.map(a => a.person.id)).size;

function CountCell({ n, label, onOpen }: { n: number; label: string; onOpen: () => void }) {
  if (n === 0) {
    return <span className="text-body text-gray-500" aria-label="None">–</span>;
  }
  return (
    <Button
      variant="tertiary"
      size="sm"
      aria-label={`${label}: ${n}. Show who`}
      onClick={onOpen}
      className="!h-8 !px-3 !bg-transparent hover:!bg-purple-100 !text-[rgb(109,27,152)]"
    >
      <span className="text-body font-semibold">{n}</span>
    </Button>
  );
}

// The By tag columns. A tag only ever sits in one place per column, and which place depends on its type
// (Environment tags are the home / the restriction), so a column says what it is in general and the type's
// own row says what it's called for that type.
type TagCol = {
  id: 'customers' | 'employees' | 'mandatory' | 'preferred';
  group: 'profile' | 'roster';
  title: string;
  description: string;
  Icon: LucideIcon;
  /** Every place this column can hold, for the "Where it sits" filter. */
  placements: Placement[];
  /** Where a tag of this type sits in this column, or null if the type doesn't go here. */
  placementFor: (type: TagType) => Placement | null;
  /** What the column is called for this type, where that isn't its general name. */
  termFor: (type: TagType) => string | null;
};

const isEnvironment = (type: TagType) => type.id === 'environment';

const TAG_COLUMNS: TagCol[] = [
  {
    id: 'customers', group: 'profile', title: 'Customers', Icon: placementInfo('customer-tag').Icon,
    description: "Customers who have this tag on their profile. For Environment tags, it's the conditions in their home.",
    placements: ['customer-tag', 'environment'],
    placementFor: t => (!t.appliesTo.includes('Customers') ? null : isEnvironment(t) ? 'environment' : 'customer-tag'),
    termFor: t => CUSTOMER_TERMS[t.id]?.title ?? null,
  },
  {
    id: 'employees', group: 'profile', title: 'Employees', Icon: placementInfo('employee-tag').Icon,
    description: 'Employees who have this tag on their profile. Medical Conditions are their training, and Environment tags are their restrictions.',
    placements: ['employee-tag', 'restriction'],
    placementFor: t => (!t.appliesTo.includes('Employees') ? null : isEnvironment(t) ? 'restriction' : 'employee-tag'),
    termFor: t => EMPLOYEE_TERMS[t.id]?.title ?? null,
  },
  {
    id: 'mandatory', group: 'roster', title: 'Mandatory', Icon: placementInfo('mandatory').Icon,
    description: placementInfo('mandatory').description,
    placements: ['mandatory'],
    placementFor: t => (isEnvironment(t) ? null : 'mandatory'),
    termFor: () => null,
  },
  {
    id: 'preferred', group: 'roster', title: 'Preferred', Icon: placementInfo('preferred').Icon,
    description: placementInfo('preferred').description,
    placements: ['preferred'],
    placementFor: t => (isEnvironment(t) ? null : 'preferred'),
    termFor: () => null,
  },
];
const TAG_GROUP_LABELS = { profile: 'On their profile', roster: 'Customer care requirements' } as const;

function ColumnHeading({ col }: { col: TagCol }) {
  const { Icon, title, description } = col;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="inline-flex items-center gap-1.5 cursor-help outline-none focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50 rounded-sm">
          <Icon className="w-4 h-4 shrink-0 text-gray-600" aria-hidden="true" />
          <span className="text-sm font-semibold text-gray-900">{title}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" {...LIGHT_TOOLTIP}>
        <span className="block text-sm">{description}</span>
      </TooltipContent>
    </Tooltip>
  );
}

// A cell where a tag type doesn't go in that column at all, as opposed to going there with nobody in it.
const NOT_USED = 'bg-gray-100';

const TYPE_COL_WIDTH = 156;
const REQUIREMENT_COL_WIDTH = 190;
// The pinned part of the By person table: the checkbox column and the name column.
const PINNED_WIDTH = 56 + 220;

// The right edge of the pinned name column. It's a shadow, not a border: borders on sticky cells in a
// collapsed table scroll away with the content, a shadow stays put, so the edge shows while scrolled.
const NAME_EDGE = 'shadow-[inset_-1px_0_0_0_#9ca3af]';

// What a tag type is called on a customer's or an employee's profile, where that isn't just the type's
// name. The same tags mean different things to each: a customer has a medical condition, an employee has
// it as Training; Environment tags are a customer's home and an employee's restriction. Both tables use
// these, so a column or row reads the same wherever it appears.
type Term = { title: string; sub?: string };
const CUSTOMER_TERMS: Record<string, Term> = {
  environment: { title: 'Home environment' },
};
const EMPLOYEE_TERMS: Record<string, Term> = {
  'medical-conditions': { title: 'Training', sub: 'Medical conditions' },
  environment: { title: placementInfo('restriction').label, sub: 'Home environment' },
  'care-setting': { title: 'Eligible care setting', sub: 'Availability types' },
};

// The By person columns, one list per kind of person. The two lists follow the same order, so a column
// that means the same thing sits in the same place in both, and each follows its profile page:
//   1-4  What they are: Area, Territory, Language, Medical conditions (a customer's conditions, which
//        an employee has as Training).
//   5    Environment: a customer's home, which an employee has as a restriction (the same tags).
//   6-7  What roster matching uses: a customer's Mandatory and Preferred requirements, which an
//        employee meets with their Staff type and Eligible care setting.
//   8-9  Named people: Preferred and Excluded (employees for a customer, customers for an employee).
//   10   Disfavoured careworkers, which only an employee has.
// The people columns aren't tags, so they use the profile's own gold (preferred) and red chips.
type PersonCol =
  | { id: string; kind: 'type'; typeId: string; title: string; sub?: string; placements: Placement[]; width: number }
  | { id: string; kind: 'requirement'; placement: 'mandatory' | 'preferred'; title: string; sub?: string; width: number }
  | { id: string; kind: 'people'; relation: 'preferred' | 'excluded' | 'disfavoured'; title: string; variant: 'preferred' | 'excluded'; width: number };

const typeCol = (typeId: string, kind: PersonKind): PersonCol => {
  const term = (kind === 'employee' ? EMPLOYEE_TERMS : CUSTOMER_TERMS)[typeId];
  return {
    id: typeId, kind: 'type', typeId, title: term?.title ?? typeName(typeId), sub: term?.sub,
    placements: kind === 'employee' ? EMPLOYEE_PLACEMENTS : CUSTOMER_PLACEMENTS, width: TYPE_COL_WIDTH,
  };
};
const requirementCol = (placement: 'mandatory' | 'preferred', title: string): PersonCol =>
  ({ id: `requirement-${placement}`, kind: 'requirement', placement, title, sub: 'Care requirements', width: REQUIREMENT_COL_WIDTH });
const peopleCol = (relation: 'preferred' | 'excluded' | 'disfavoured', title: string, variant: 'preferred' | 'excluded'): PersonCol =>
  ({ id: `people-${relation}`, kind: 'people', relation, title, variant, width: TYPE_COL_WIDTH });

const CUSTOMER_PLACEMENTS: Placement[] = ['customer-tag', 'environment'];
const EMPLOYEE_PLACEMENTS: Placement[] = ['employee-tag', 'restriction'];

const CUSTOMER_COLUMNS: PersonCol[] = [
  typeCol('area', 'customer'),
  typeCol('territory', 'customer'),
  typeCol('language', 'customer'),
  typeCol('medical-conditions', 'customer'),
  typeCol('environment', 'customer'),
  requirementCol('mandatory', 'Mandatory'),
  requirementCol('preferred', 'Preferred'),
  peopleCol('preferred', 'Preferred employees', 'preferred'),
  peopleCol('excluded', 'Excluded careworkers', 'excluded'),
];

const EMPLOYEE_COLUMNS: PersonCol[] = [
  typeCol('area', 'employee'),
  typeCol('territory', 'employee'),
  typeCol('language', 'employee'),
  typeCol('medical-conditions', 'employee'),
  typeCol('environment', 'employee'),
  typeCol('staff-type', 'employee'),
  typeCol('care-setting', 'employee'),
  peopleCol('preferred', 'Preferred customers', 'preferred'),
  peopleCol('excluded', 'Excluded customers', 'excluded'),
  peopleCol('disfavoured', 'Disfavoured careworkers', 'excluded'),
];

/** The columns the bulk Add / Remove tags panel offers: this table's tag columns, with the same names. */
const bulkColumns = (kind: PersonKind): BulkColumn[] =>
  (kind === 'employee' ? EMPLOYEE_COLUMNS : CUSTOMER_COLUMNS).flatMap((c): BulkColumn[] => {
    // Only Disfavoured careworkers has real state behind it so far; the other named-people lists are still made up.
    if (c.kind === 'people') return c.relation === 'disfavoured' ? [{ id: c.id, title: c.title, sub: 'Named careworkers, not tags', kind: 'people', relation: 'disfavoured' }] : [];
    if (c.kind === 'requirement') return [{ id: c.id, title: c.title, sub: c.sub, kind: 'tags', placement: c.placement }];
    // Environment is the only type whose place differs from a plain profile tag (home / restriction).
    const placement = c.placements[c.typeId === 'environment' ? 1 : 0];
    return [{ id: c.id, title: c.title, sub: c.sub, kind: 'tags', placement, typeIds: [c.typeId] }];
  });

const plainPill = (tag: TagSummary): TagSummary => ({ ...tag, count: undefined });

/** The named people in a People column. */
function namedIn(col: Extract<PersonCol, { kind: 'people' }>, person: TagPerson, kind: PersonKind, relations: RelationChange[]): TagPerson[] {
  if (kind === 'employee' && col.relation === 'disfavoured') return disfavouredOf(person, relations);
  const named = kind === 'employee' ? relationsOf(person) : customerRelationsOf(person);
  return (named as Record<string, TagPerson[]>)[col.relation] ?? [];
}

/** What a person holds in a column, as ids (tags, or named people), for the filter to test. */
function heldIn(col: PersonCol, person: TagPerson, items: Allocation[], kind: PersonKind, relations: RelationChange[]) {
  if (col.kind === 'people') return new Set(namedIn(col, person, kind, relations).map(p => p.id));
  return new Set(items.filter(a => (col.kind === 'type' ? a.tagType.id === col.typeId && col.placements.includes(a.placement) : a.placement === col.placement)).map(a => a.tag.id));
}

/** The filter's view of a column: its name, and which tags it could hold. */
function filterColumn(col: PersonCol): FilterColumn {
  if (col.kind === 'people') return { id: col.id, title: col.title, isType: false };
  if (col.kind === 'type') {
    const type = ALL_TAG_TYPES.find(t => t.id === col.typeId)!;
    return { id: col.id, title: col.title, sub: col.sub, isType: true, groups: [{ type, tags: type.tags }] };
  }
  // A requirement can be any tag an employee can hold, bar Environment (that's a home / restriction, not a skill).
  return {
    id: col.id, title: col.title, sub: col.sub, isType: false,
    groups: ALL_TAG_TYPES.filter(t => t.appliesTo.includes('Employees') && t.id !== 'environment').map(type => ({ type, tags: type.tags })),
  };
}

/** One cell of the By person table: the tags, requirements or named people for one column. */
function PersonCell({ col, person, kind, items, relations, faded }: { col: PersonCol; person: Allocation['person']; kind: PersonKind; items: Allocation[]; relations: RelationChange[]; faded?: boolean }) {
  // Inactive and finished people's tags are faded (the grey labels aren't: any lighter fails contrast).
  const fade = faded ? 'opacity-75' : '';
  const none = <span className="text-body text-gray-500" aria-label="None">–</span>;

  if (col.kind === 'people') {
    const list = namedIn(col, person, kind, relations);
    return list.length === 0 ? none : (
      <ul className={`flex flex-wrap gap-1.5 ${fade}`}>
        {list.map(p => <li key={p.id} className="max-w-full"><Tag label={p.name} variant={col.variant} /></li>)}
      </ul>
    );
  }

  const here = items.filter(a => (col.kind === 'type' ? a.tagType.id === col.typeId && col.placements.includes(a.placement) : a.placement === col.placement));
  if (here.length === 0) return none;
  const pills = (list: Allocation[]) => (
    <ul className={`flex flex-wrap gap-1.5 ${fade}`}>
      {list.map(a => <li key={a.id}><TagSummaryPill tag={plainPill(a.tag)} /></li>)}
    </ul>
  );
  // A type column's header already says which type it is. A requirements column mixes types, so group
  // them, and "North Tyneside" under Area isn't confused with the one under Territory.
  if (col.kind === 'type') return pills(here);
  return (
    <div className="space-y-2.5">
      {[...new Set(here.map(a => a.tagType.id))].map(typeId => {
        const inType = here.filter(a => a.tagType.id === typeId);
        return (
          <div key={typeId}>
            <div className="mb-1 text-sm text-gray-600">{inType[0].tagType.name}</div>
            {pills(inType)}
          </div>
        );
      })}
    </div>
  );
}

export function ReviewAllocationsView({ allocations, relations, onBulkApply, onBulkUndo }: {
  allocations: Allocation[];
  /** Careworkers added to or taken off disfavoured lists so far. */
  relations: RelationChange[];
  /** A bulk add or remove was confirmed. */
  onBulkApply: (changes: BulkChange[], text: string, relations: RelationChange[]) => void;
  onBulkUndo: () => void;
}) {
  const [mode, setMode] = useState<'tag' | 'person'>('person');
  const [query, setQuery] = useState('');
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [showFinished, setShowFinished] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  // The By person filter: conditions on columns, a "missing a tag" check, and which columns show.
  const [filters, setFilters] = useState<PeopleFilters>(NO_FILTERS);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [open, setOpen] = useState<{ type: TagType; tag: TagSummary; placement: Placement; label: string } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PERSON_PAGE_SIZES[0]);
  // Bulk selection, in the By person list.
  const [selected, setSelected] = useState<string[]>([]);
  const [bulk, setBulk] = useState<'add' | 'remove' | null>(null);
  // By person is split into customers and employees: they're managed as separate groups and
  // have different things to show, so each gets only the columns that apply to it.
  const [personKind, setPersonKind] = useState<PersonKind>('customer');

  const q = query.trim().toLowerCase();
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  // What's counted at all: finished and inactive people are hidden by default.
  const base = useMemo(
    () => allocations.filter(a => (showFinished || !a.person.finished) && (showInactive || a.person.note !== 'Inactive')),
    [allocations, showFinished, showInactive],
  );
  const cols = TAG_COLUMNS.filter(c => placements.length === 0 || c.placements.some(p => placements.includes(p)));
  const profileCols = cols.filter(c => c.group === 'profile').length;
  const rosterCols = cols.length - profileCols;
  // The By person columns for this kind of person, less any switched off in the filter.
  const allPersonCols = personKind === 'employee' ? EMPLOYEE_COLUMNS : CUSTOMER_COLUMNS;
  const personCols = allPersonCols.filter(c => !filters.hidden.includes(c.id));
  const filterColumns = useMemo(() => allPersonCols.map(filterColumn), [allPersonCols]);
  // Conditions on a column the other kind of person doesn't have (Staff Type on customers) wait until it's back.
  const activeRules = filters.rules.filter(r => allPersonCols.some(c => c.id === r.colId));
  const missingIds = filters.missing.colIds.filter(id => allPersonCols.some(c => c.id === id));
  /** Set (or with null, clear) the one filter a column's heading holds. */
  const setColumnRule = (colId: string, rule: Pick<FilterRule, 'has' | 'tagIds'> | null) => {
    setFilters(f => ({ ...f, rules: [...f.rules.filter(r => r.colId !== colId), ...(rule ? [{ id: `col-${colId}`, colId, ...rule }] : [])] }));
    reset();
  };
  const personFilterCount = activeRules.length + (missingIds.length > 0 ? 1 : 0) + (filters.hidden.length > 0 ? 1 : 0);
  // A heavier divider where the named people begin, since they're a different kind of thing from tags.
  const colEdge = (i: number) =>
    i === 0 ? '' : personCols[i].kind === 'people' && personCols[i - 1].kind !== 'people' ? 'border-l-2 border-gray-400' : 'border-l border-gray-300';
  const typeList = ALL_TAG_TYPES.filter(t => types.length === 0 || types.includes(t.id));

  // ── By tag ──
  const byTag = useMemo(() => {
    const byTagId = new Map<string, Allocation[]>();
    base.forEach(a => byTagId.set(a.tag.id, [...(byTagId.get(a.tag.id) ?? []), a]));
    return typeList
      .map(type => ({
        type,
        rows: type.tags
          .map(tag => {
            const tagMatch = !q || tag.name.toLowerCase().includes(q) || type.name.toLowerCase().includes(q);
            const mine = (byTagId.get(tag.id) ?? []).filter(a => tagMatch || a.person.name.toLowerCase().includes(q));
            return { tag, tagMatch, mine };
          })
          .filter(r => !q || r.tagMatch || r.mine.length > 0),
      }))
      .filter(g => g.rows.length > 0);
  }, [base, typeList, q]);
  const tagRowCount = byTag.reduce((n, g) => n + g.rows.length, 0);

  // ── By person ──
  // Everyone of this kind, not only those with a tag: the people with nothing in a column are exactly
  // the ones "missing" is looking for.
  const isShown = (p: TagPerson) => (showFinished || !p.finished) && (showInactive || p.note !== 'Inactive');
  const byPerson = useMemo(() => {
    const itemsByPerson = new Map<string, Allocation[]>();
    base.forEach(a => itemsByPerson.set(a.person.id, [...(itemsByPerson.get(a.person.id) ?? []), a]));
    const heldFor = (colId: string, e: { person: TagPerson; items: Allocation[] }) =>
      heldIn(allPersonCols.find(c => c.id === colId)!, e.person, e.items, personKind, relations);
    return (personKind === 'customer' ? ALL_CUSTOMERS : ALL_EMPLOYEES)
      .filter(isShown)
      .map(person => ({ person, kind: personKind, items: itemsByPerson.get(person.id) ?? [] }))
      .filter(e => !q || e.person.name.toLowerCase().includes(q) || e.items.some(a => a.tag.name.toLowerCase().includes(q) || a.tagType.name.toLowerCase().includes(q)))
      .filter(e => activeRules.every(r => ruleMatches(r, heldFor(r.colId, e))))
      .filter(e => missingIds.length === 0 || (filters.missing.mode === 'any' ? missingIds.some(id => heldFor(id, e).size === 0) : missingIds.every(id => heldFor(id, e).size === 0)))
      .sort((x, y) => x.person.name.localeCompare(y.person.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, q, personKind, filters, relations, showFinished, showInactive]);
  const kindCounts = useMemo(() => ({
    customer: ALL_CUSTOMERS.filter(isShown).length,
    employee: ALL_EMPLOYEES.filter(isShown).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [showFinished, showInactive]);
  const pageCount = Math.max(1, Math.ceil(byPerson.length / pageSize));
  const current = Math.min(page, pageCount);
  const personStart = (current - 1) * pageSize;
  const visiblePeople = byPerson.slice(personStart, personStart + pageSize);

  // The selection is a list of people, not rows: it holds across pages and filters, so a person ticked
  // on page one stays ticked when you search, filter or move on. Switching between customers and
  // employees starts a new one, since a bulk edit is for one or the other.
  const personIndex = useMemo(() => {
    const m = new Map<string, { person: Allocation['person']; kind: Allocation['kind'] }>();
    [...ALL_CUSTOMERS, ...ALL_EMPLOYEES].forEach(person => m.set(person.id, { person, kind: kindOf(person) }));
    return m;
  }, []);
  const selectedPeople = useMemo(
    () => selected.map(id => personIndex.get(id)).filter(<T,>(e: T | undefined): e is T => !!e).sort((x, y) => x.person.name.localeCompare(y.person.name)),
    [selected, personIndex],
  );
  const matchingIds = byPerson.map(e => e.person.id);
  const pageIds = visiblePeople.map(e => e.person.id);
  const pageAll = pageIds.length > 0 && pageIds.every(id => selected.includes(id));
  const pageSome = pageIds.some(id => selected.includes(id));
  const allMatching = matchingIds.length > 0 && matchingIds.every(id => selected.includes(id));
  // Whether a search or filter is narrowing the list, so "all" means all of those rather than everyone.
  const narrowed = q !== '' || activeRules.length > 0 || missingIds.length > 0;
  const hiddenByFilters = selectedPeople.filter(e => !matchingIds.includes(e.person.id)).length;
  const toggleOne = (id: string) => setSelected(l => toggle(l, id));
  const togglePage = () => setSelected(l => (pageAll ? l.filter(id => !pageIds.includes(id)) : [...new Set([...l, ...pageIds])]));
  // Whether a bulk edit has gone through: then closing the panel also ends the selection.
  const bulkApplied = useRef(false);


  const resultCount = mode === 'tag' ? tagRowCount : byPerson.length;
  const filterCount = mode === 'person' ? personFilterCount : placements.length + types.length;
  // Anything that changes what's listed goes back to page one. The selection is kept.
  const reset = () => setPage(1);

  // From a By tag count: the same people in By person, filtered to that tag in the column it sits in, so they can be acted on.
  const openInByPerson = () => {
    if (!open) return;
    const kind = placementInfo(open.placement).entity;
    const cols = kind === 'employee' ? EMPLOYEE_COLUMNS : CUSTOMER_COLUMNS;
    const col = cols.find(c => (c.kind === 'type' ? c.typeId === open.type.id && c.placements.includes(open.placement) : c.kind === 'requirement' && c.placement === open.placement));
    setMode('person');
    setPersonKind(kind);
    setQuery('');
    setPlacements([]);
    setTypes([]);
    setSelected([]);
    setFilters({ ...NO_FILTERS, rules: col ? [{ id: `col-${col.id}`, colId: col.id, has: true, tagIds: [open.tag.id] }] : [] });
    setPage(1);
    setOpen(null);
  };
  const openList = open
    ? base
        .filter(a => a.tag.id === open.tag.id && a.placement === open.placement)
        .sort((x, y) => x.person.name.localeCompare(y.person.name))
    : [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-clip">
        {/* Docked bar, as on Bookings and Enquiries. */}
        <div className="flex items-center gap-3 p-3 border-b border-gray-200">
          <SegmentedControl
            value={mode}
            onChange={v => {
              setMode(v);
              if (v === 'person') setPlacements(l => l.filter(id => placementInfo(id).entity === personKind));
              reset();
            }}
            ariaLabel="Group by"
            options={[{ value: 'person', label: 'By person' }, { value: 'tag', label: 'By tag' }]}
          />
          {mode === 'person' && (
            <SegmentedControl
              value={personKind}
              onChange={v => {
                setPersonKind(v);
                setSelected([]);
                // Keep only the "where it sits" choices that belong to this group.
                setPlacements(l => l.filter(id => placementInfo(id).entity === v));
                reset();
              }}
              ariaLabel="Customers or employees"
              options={[
                { value: 'customer', label: `Customers · ${kindCounts.customer}` },
                { value: 'employee', label: `Employees · ${kindCounts.employee}` },
              ]}
            />
          )}
          <div role="search" className="relative flex-1 min-w-0 max-w-[560px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); reset(); }}
              onKeyDown={e => { if (e.key === 'Escape') { setQuery(''); reset(); } }}
              placeholder="Search tags or people..."
              aria-label="Search tags or people"
              className="w-full pl-9 pr-44 py-2 bg-white border border-gray-200 rounded-lg text-body text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[rgb(154,38,214)] focus:ring-1 focus:ring-[rgb(154,38,214)]"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {query && (
                <Button variant="tertiary" iconOnly size="sm" aria-label="Clear search" onClick={() => { setQuery(''); reset(); }} className="!h-7 !w-7">
                  <X className="w-4 h-4" />
                </Button>
              )}
              <span aria-live="polite" className={`${badge} bg-gray-100 text-gray-700 border-gray-300 whitespace-nowrap`}>
                {resultCount} {mode === 'tag' ? (resultCount === 1 ? 'tag' : 'tags') : personKind === 'customer' ? (resultCount === 1 ? 'customer' : 'customers') : (resultCount === 1 ? 'employee' : 'employees')}
              </span>
            </div>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="tertiary" iconOnly className="relative" aria-label={filterCount > 0 ? `Filter (${filterCount} applied)` : 'Filter'}>
                <SlidersHorizontal className="w-4 h-4" />
                {filterCount > 0 && <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[rgb(154,38,214)] border-2 border-white" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className={`${mode === 'person' ? 'w-[min(560px,calc(100vw-3rem))]' : 'w-[min(520px,calc(100vw-3rem))]'} max-h-[75vh] overflow-y-auto p-4`}>
              {mode === 'person' ? (
                <PeopleFilterPanel
                  columns={filterColumns}
                  filters={filters}
                  onChange={f => { setFilters(f); reset(); }}
                  resultCount={resultCount}
                  noun={personKind}
                  nounPlural={personKind === 'customer' ? 'customers' : 'employees'}
                />
              ) : (
              <>
              <div className="grid grid-cols-2 gap-6">
                <CheckGroup
                  legend="Where it sits"
                  options={(mode === 'person' ? PLACEMENTS.filter(p => p.entity === personKind) : PLACEMENTS).map(p => ({ key: p.id, label: p.label }))}
                  selected={placements}
                  onToggle={k => { setPlacements(l => toggle(l, k)); reset(); }}
                />
                <CheckGroup
                  legend="Tag type"
                  options={ALL_TAG_TYPES.map(t => ({ key: t.id, label: t.name }))}
                  selected={types}
                  onToggle={k => { setTypes(l => toggle(l, k)); reset(); }}
                />
              </div>
              <FilterFooter
                resultCount={resultCount}
                noun={mode === 'tag' ? 'tag' : 'person'}
                nounPlural={mode === 'tag' ? 'tags' : 'people'}
                canClear={filterCount > 0}
                onClear={() => { setPlacements([]); setTypes([]); reset(); }}
              />
              </>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* What the By person filter is doing, so it can be read and taken off at a glance. */}
        {mode === 'person' && (activeRules.length > 0 || missingIds.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-gray-200 bg-white">
            <span className="text-body text-gray-700">Showing people where</span>
            {[
              ...activeRules.map(r => ({ key: r.id, text: describeRule(r, filterColumns), remove: () => setFilters(f => ({ ...f, rules: f.rules.filter(x => x.id !== r.id) })) })),
              ...(missingIds.length > 0 ? [{ key: 'missing', text: describeMissing({ ...filters.missing, colIds: missingIds }, filterColumns), remove: () => setFilters(f => ({ ...f, missing: { ...f.missing, colIds: [] } })) }] : []),
            ].map(chip => (
              <span key={chip.key} className="inline-flex items-center gap-0.5 rounded-full border border-purple-200 bg-purple-50 pl-3 pr-1 text-sm font-medium text-purple-900">
                {chip.text}
                <Button variant="tertiary" iconOnly size="sm" aria-label={`Remove filter: ${chip.text}`} onClick={() => { chip.remove(); reset(); }} className="!h-7 !w-7">
                  <X className="w-3.5 h-3.5" />
                </Button>
              </span>
            ))}
            <Button variant="tertiary" size="sm" onClick={() => { setFilters(f => ({ ...f, rules: [], missing: { ...f.missing, colIds: [] } })); reset(); }}>Clear filters</Button>
          </div>
        )}

        {/* Second bar: what's included. */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5 border-b border-gray-200" style={{ backgroundColor: GREY }}>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <label className="flex items-center gap-2.5 text-body text-gray-800 cursor-pointer w-fit">
              <input type="checkbox" className="h-5 w-5 accent-[rgb(154,38,214)] cursor-pointer" checked={showInactive} onChange={e => { setShowInactive(e.target.checked); reset(); }} />
              Show inactive
            </label>
            <label className="flex items-center gap-2.5 text-body text-gray-800 cursor-pointer w-fit">
              <input type="checkbox" className="h-5 w-5 accent-[rgb(154,38,214)] cursor-pointer" checked={showFinished} onChange={e => { setShowFinished(e.target.checked); reset(); }} />
              Show finished
            </label>
          </div>
        </div>

        {mode === 'tag' ? (
          <Table className="table-fixed min-w-[980px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-gray-200 border-b-0" style={{ backgroundColor: GREY }}>
                <TableHead rowSpan={2} className="w-[260px] h-auto px-4 py-3 align-bottom text-sm font-semibold text-gray-700">Tag</TableHead>
                {profileCols > 0 && (
                  <TableHead colSpan={profileCols} className="h-auto px-3 pt-3 pb-1 text-center border-l border-gray-300 text-sm font-semibold text-gray-700">{TAG_GROUP_LABELS.profile}</TableHead>
                )}
                {rosterCols > 0 && (
                  <TableHead colSpan={rosterCols} className="h-auto px-3 pt-3 pb-1 text-center border-l border-gray-300 text-sm font-semibold text-gray-700">{TAG_GROUP_LABELS.roster}</TableHead>
                )}
              </TableRow>
              <TableRow className="hover:bg-transparent border-gray-200" style={{ backgroundColor: GREY }}>
                {cols.map(c => (
                  <TableHead
                    key={c.id}
                    className="h-auto px-3 pt-1 pb-3 text-center align-bottom border-l border-gray-300"
                  >
                    <ColumnHeading col={c} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {byTag.map(({ type, rows }) => {
                const isCollapsed = collapsed.includes(type.id);
                return [
                  <TableRow key={type.id} className="bg-gray-50 hover:bg-gray-50 border-gray-200">
                    <TableCell className="px-4 py-1.5">
                      <Button
                        variant="tertiary"
                        size="sm"
                        aria-expanded={!isCollapsed}
                        onClick={() => setCollapsed(l => toggle(l, type.id))}
                        className="!bg-transparent hover:!bg-gray-200/70 !-ml-3 !px-3"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} aria-hidden="true" />
                        <span className="text-sm font-semibold text-gray-900">{type.name}</span>
                        <span className="text-sm font-normal text-gray-600">{rows.length} {rows.length === 1 ? 'tag' : 'tags'}</span>
                      </Button>
                    </TableCell>
                    {/* What each column is called for this type, where it differs ("Training", "Employee restriction"),
                        and a shaded cell where the type doesn't go in that column at all. */}
                    {cols.map(c => {
                      const term = c.termFor(type);
                      return (
                        <TableCell key={c.id} className={`px-3 py-1.5 text-center border-l border-gray-300 ${c.placementFor(type) ? '' : NOT_USED}`}>
                          {c.placementFor(type) && term && <span className="text-sm font-medium text-gray-700">{term}</span>}
                        </TableCell>
                      );
                    })}
                  </TableRow>,
                  ...(isCollapsed ? [] : rows.map(({ tag, mine }) => (
                    <TableRow key={tag.id} className="bg-white hover:bg-purple-50 border-gray-200">
                      <TableCell className="px-4 py-2.5 whitespace-normal">
                        <Link
                          to={`/office/tags/${type.id}/${tag.id}`}
                          className="inline-block rounded-full outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50"
                        >
                          <TagSummaryPill tag={plainPill(tag)} />
                        </Link>
                      </TableCell>
                      {cols.map(c => {
                        const placement = c.placementFor(type);
                        if (!placement) {
                          return (
                            <TableCell key={c.id} className={`px-3 py-2.5 border-l border-gray-300 ${NOT_USED}`}>
                              <span className="sr-only">Not used for {type.name}</span>
                            </TableCell>
                          );
                        }
                        const term = c.termFor(type);
                        const here = mine.filter(a => a.placement === placement);
                        return (
                          <TableCell key={c.id} className="px-3 py-2.5 text-center border-l border-gray-300">
                            <CountCell
                              n={distinct(here)}
                              label={`${tag.name}, ${term ?? c.title}`}
                              onOpen={() => setOpen({ type, tag, placement, label: term ?? placementInfo(placement).label })}
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))),
                ];
              })}
              {byTag.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={cols.length + 1} className="py-12 text-center whitespace-normal">
                    <p className="text-base font-semibold text-gray-900">No tags match{q && <> “{query.trim()}”</>}</p>
                    <div className="mt-3 flex justify-center">
                      <Button variant="tertiary" onClick={() => { setQuery(''); setPlacements([]); setTypes([]); setFilters(NO_FILTERS); reset(); }}>Clear search and filters</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          <>
            {(selectedPeople.length > 0 || pageAll) && (
              <div className="border-b border-purple-200 bg-purple-50">
                <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="tertiary" size="sm" aria-live="polite" aria-label={`${selectedPeople.length} selected. Review who`} className="!text-purple-900 !font-semibold">
                          {allMatching && byPerson.length > 1 ? `All ${byPerson.length} selected` : `${selectedPeople.length} selected`} <ChevronDown className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-[min(360px,calc(100vw-3rem))] p-0">
                        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-gray-200">
                          <span className="text-body font-semibold text-gray-900">Selected {noun(personKind, selectedPeople.length)}</span>
                          <Button variant="tertiary" size="sm" onClick={() => setSelected([])}>Clear all</Button>
                        </div>
                        <ul className="max-h-72 overflow-y-auto divide-y divide-gray-200">
                          {selectedPeople.map(({ person }) => (
                            <li key={person.id} className="flex items-center justify-between gap-3 pl-4 pr-2 py-1.5">
                              <span className="min-w-0">
                                <span className="block text-body font-medium text-gray-900 truncate">{person.name}</span>
                                {(person.role || person.note) && <span className="block text-sm text-gray-600 truncate">{[person.role, person.note].filter(Boolean).join(' · ')}</span>}
                              </span>
                              <Button variant="tertiary" iconOnly size="sm" aria-label={`Remove ${person.name} from the selection`} onClick={() => toggleOne(person.id)} className="!h-8 !w-8">
                                <X className="w-4 h-4" />
                              </Button>
                            </li>
                          ))}
                          {selectedPeople.length === 0 && <li className="px-4 py-3 text-body text-gray-700">No one selected.</li>}
                        </ul>
                      </PopoverContent>
                    </Popover>
                    {/* The header tick only does this page, so offer everyone on the list in one go. */}
                    {pageAll && !allMatching && byPerson.length > visiblePeople.length && (
                      <Button variant="tertiary" size="sm" onClick={() => setSelected(l => [...new Set([...l, ...matchingIds])])}>
                        Select all {byPerson.length} {noun(personKind, byPerson.length)}{narrowed && ' in this search'}
                      </Button>
                    )}
                    {hiddenByFilters > 0 && <span className="text-sm text-purple-900">{hiddenByFilters} not shown by the current search or filters</span>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="tertiary" size="sm" onClick={() => setSelected([])}>Clear</Button>
                    <Button variant="secondary" size="sm" icon={<Minus className="w-4 h-4" />} disabled={selectedPeople.length === 0} onClick={() => setBulk('remove')}>Remove tags</Button>
                    <Button size="sm" icon={<Plus className="w-4 h-4" />} disabled={selectedPeople.length === 0} onClick={() => setBulk('add')}>Add tags</Button>
                  </div>
                </div>
              </div>
            )}
            <TableScrollbars pinnedWidth={PINNED_WIDTH} background={GREY}>
            <Table className="table-fixed" style={{ minWidth: PINNED_WIDTH + personCols.reduce((n, c) => n + c.width, 0) }}>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-gray-200" style={{ backgroundColor: GREY }}>
                  <TableHead className="w-[56px] h-auto px-4 py-3 align-top sticky left-0 z-10 bg-inherit">
                    <input
                      type="checkbox"
                      aria-label={pageAll ? 'Deselect everyone on this page' : 'Select everyone on this page'}
                      className="h-5 w-5 accent-[rgb(154,38,214)] cursor-pointer"
                      checked={pageAll}
                      ref={el => { if (el) el.indeterminate = pageSome && !pageAll; }}
                      onChange={togglePage}
                    />
                  </TableHead>
                  <TableHead className={`w-[220px] h-auto px-4 py-3 align-top text-sm font-semibold text-gray-700 sticky left-[56px] z-10 bg-inherit ${NAME_EDGE}`}>Person</TableHead>
                  {personCols.map((c, i) => (
                    <TableHead key={c.id} style={{ width: c.width }} className={`h-auto px-3 py-3 align-top whitespace-normal ${colEdge(i)}`}>
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <span className="block text-sm font-semibold text-gray-900">{c.title}</span>
                          {'sub' in c && c.sub && <span className="block text-sm font-normal text-gray-600">{c.sub}</span>}
                        </div>
                        <ColumnFilter column={filterColumns.find(f => f.id === c.id)!} rule={activeRules.find(r => r.colId === c.id)} onChange={r => setColumnRule(c.id, r)} />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiblePeople.map(({ person, items }) => {
                  // Inactive and finished people only show when asked for, so they're faded and badged.
                  const dormant = person.finished || person.note === 'Inactive';
                  return (
                  <TableRow key={person.id} className={`${dormant ? 'bg-gray-50' : 'bg-white'} hover:bg-purple-50 border-gray-200`}>
                    <TableCell className="align-top px-4 py-3.5 sticky left-0 z-10 bg-inherit">
                      <input
                        type="checkbox"
                        aria-label={`Select ${person.name}`}
                        className="h-5 w-5 accent-[rgb(154,38,214)] cursor-pointer"
                        checked={selected.includes(person.id)}
                        onChange={() => toggleOne(person.id)}
                      />
                    </TableCell>
                    <TableCell className={`align-top px-4 py-3 whitespace-normal sticky left-[56px] z-10 bg-inherit ${NAME_EDGE}`}>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className={`text-body font-semibold ${dormant ? 'text-gray-600' : 'text-gray-900'}`}>{person.name}</span>
                        {dormant && (
                          <span className={`${badge} !px-2 !py-0 whitespace-nowrap ${person.finished ? 'bg-gray-200 text-gray-900 border-gray-400' : 'bg-amber-50 text-amber-900 border-amber-300'}`}>
                            {person.note}
                          </span>
                        )}
                      </div>
                      {/* An employee is described by their role (Careworker, Supervisor, Care Manager…). The status shows as a badge instead where it's inactive or finished. */}
                      {(person.role || (person.note && !dormant)) && (
                        <div className="text-sm text-gray-600">{[person.role, dormant ? undefined : person.note].filter(Boolean).join(' · ')}</div>
                      )}
                    </TableCell>
                    {personCols.map((c, ci) => (
                      <TableCell key={c.id} className={`align-top px-3 py-3 whitespace-normal ${colEdge(ci)}`}>
                        <PersonCell col={c} person={person} kind={personKind} items={items} relations={relations} faded={dormant} />
                      </TableCell>
                    ))}
                  </TableRow>
                  );
                })}
                {byPerson.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={personCols.length + 2} className="py-12 text-center whitespace-normal">
                      <p className="text-base font-semibold text-gray-900">No people match{q && <> “{query.trim()}”</>}</p>
                      <div className="mt-3 flex justify-center">
                        <Button variant="tertiary" onClick={() => { setQuery(''); setPlacements([]); setTypes([]); setFilters(NO_FILTERS); reset(); }}>Clear search and filters</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </TableScrollbars>
            {byPerson.length > 0 && (
              <PaginationBar
                page={current}
                pageCount={pageCount}
                from={personStart + 1}
                to={personStart + visiblePeople.length}
                total={byPerson.length}
                onPage={setPage}
                pageSize={pageSize}
                pageSizes={PERSON_PAGE_SIZES}
                onPageSize={n => { setPageSize(n); setPage(1); }}
                docked
              />
            )}
          </>
        )}
      </div>

      {bulk && (
        <BulkEditSlideout
          mode={bulk}
          selected={selectedPeople}
          columns={bulkColumns(personKind)}
          relations={relations}
          allocations={allocations}
          kind={personKind}
          candidates={[...personIndex.values()].filter(e => e.kind === personKind && !e.person.finished).sort((x, y) => x.person.name.localeCompare(y.person.name))}
          onAddPerson={id => setSelected(l => [...new Set([...l, id])])}
          onRemovePerson={id => setSelected(l => l.filter(x => x !== id))}
          onClose={() => { setBulk(null); if (bulkApplied.current) setSelected([]); bulkApplied.current = false; }}
          onApply={(...args) => { bulkApplied.current = true; onBulkApply(...args); }}
          onUndo={onBulkUndo}
        />
      )}

      {open && (
        <EditSlideout title={`${open.label}: ${open.tag.name}`} readOnly onClose={() => setOpen(null)}>
          <div className="space-y-4">
            <div>
              <p className="text-body text-gray-900">
                <span className="font-semibold">{placementInfo(open.placement).ticketLabel}</span> · {open.type.name}
              </p>
              <p className="mt-1 text-body text-gray-700">{placementInfo(open.placement).description}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-gray-200" style={{ backgroundColor: GREY }}>
                    <TableHead className="h-auto px-4 py-3 text-sm font-semibold text-gray-700">{placementInfo(open.placement).entity === 'customer' ? 'Customer' : 'Employee'}</TableHead>
                    <TableHead className="h-auto px-4 py-3 text-sm font-semibold text-gray-700">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openList.map(a => (
                    <TableRow key={a.id} className="bg-white hover:bg-purple-50 border-gray-200">
                      <TableCell className="px-4 py-3 text-body font-semibold text-gray-900">{a.person.name}</TableCell>
                      <TableCell className="px-4 py-3 text-body text-gray-700">{a.person.note ?? 'Active'}</TableCell>
                    </TableRow>
                  ))}
                  {openList.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={3} className="py-8 text-center text-body text-gray-600">Nobody yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {openList.length > 0 && (
              <Button variant="secondary" onClick={openInByPerson}>
                {(() => {
                  const n = new Set(openList.map(a => a.person.id)).size;
                  const who = noun(placementInfo(open.placement).entity, n);
                  return n === 1 ? `Open this ${who} in By person` : `Open these ${n} ${who} in By person`;
                })()}
              </Button>
            )}
            <Link to={`/office/tags/${open.type.id}/${open.tag.id}`} className="inline-block text-body font-semibold text-[rgb(109,27,152)] hover:underline">
              Open the {open.tag.name} tag
            </Link>
          </div>
        </EditSlideout>
      )}
    </div>
  );
}
