import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ChevronDown, Minus, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '../buttons/Button';
import { SegmentedControl } from '../buttons/SegmentedControl';
import { SegmentedToggle } from '../buttons/SegmentedToggle';
import { PaginationBar } from '../buttons/PaginationBar';
import { EditSlideout } from '../layout/EditSlideout';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { CheckGroup, FilterFooter, badge } from '../customer/PeopleList';
import { TagSummaryPill } from './TagSummaryPill';
import { BulkEditSlideout } from './BulkEditSlideout';
import type { TagSummary, TagType } from './tagsMockData';
import {
  ALL_TAG_TYPES,
  PLACEMENTS,
  PLACEMENT_GROUPS,
  placementInfo,
  type Allocation,
  type BulkChange,
  type Placement,
  type PersonKind,
} from './tagAllocations';

// Review allocations: where every tag is used. By tag, a grid of the tags against the six
// places a tag can sit (a number in each cell that opens the people behind it); or by person,
// one row each with everything they've been given. The visit-level switch is a preview of
// requirements that could be set on a single visit, which PASS doesn't have yet.

const LIGHT_TOOLTIP = {
  className: 'bg-white text-gray-900 border border-gray-200 shadow-lg',
  arrowClassName: 'bg-white fill-white',
} as const;

const PERSON_PAGE_SIZE = 12;
const GREY = '#f6f7f9';

const distinct = (list: Allocation[], scope: Allocation['scope']) =>
  new Set(list.filter(a => a.scope === scope).map(a => a.person.id)).size;

function CountCell({ n, m, label, onOpen }: { n: number; m: number; label: string; onOpen: () => void }) {
  if (n === 0 && m === 0) {
    return <span className="text-body text-gray-500" aria-label="None">–</span>;
  }
  return (
    <Button
      variant="tertiary"
      size="sm"
      aria-label={`${label}: ${n}${m > 0 ? `, plus ${m} on specific visits` : ''}. Show who`}
      onClick={onOpen}
      className="!h-8 !px-3 !bg-transparent hover:!bg-purple-100 !text-[rgb(109,27,152)]"
    >
      <span className="text-body font-semibold">{n}</span>
      {m > 0 && <span className="text-sm font-medium text-gray-700">+{m} on visits</span>}
    </Button>
  );
}

function PlacementHeading({ placement }: { placement: Placement }) {
  const { Icon, label, ticketLabel, description } = placementInfo(placement);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="inline-flex items-center gap-1.5 cursor-help outline-none focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50 rounded-sm">
          <Icon className="w-4 h-4 shrink-0 text-gray-600" aria-hidden="true" />
          <span className="text-sm font-semibold text-gray-900">{label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" {...LIGHT_TOOLTIP}>
        <span className="block text-sm font-semibold">{ticketLabel}</span>
        <span className="block text-sm">{description}</span>
      </TooltipContent>
    </Tooltip>
  );
}

const plainPill = (tag: TagSummary): TagSummary => ({ ...tag, count: undefined });

export function ReviewAllocationsView({ allocations, onBulkApply, onBulkUndo }: {
  allocations: Allocation[];
  /** A bulk add or remove was confirmed. */
  onBulkApply: (changes: BulkChange[], text: string) => void;
  onBulkUndo: () => void;
}) {
  const [mode, setMode] = useState<'tag' | 'person'>('tag');
  const [query, setQuery] = useState('');
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [showFinished, setShowFinished] = useState(false);
  const [includeVisits, setIncludeVisits] = useState(false);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [open, setOpen] = useState<{ type: TagType; tag: TagSummary; placement: Placement } | null>(null);
  const [page, setPage] = useState(1);
  // Bulk selection, in the By person list.
  const [selected, setSelected] = useState<string[]>([]);
  const [bulk, setBulk] = useState<'add' | 'remove' | null>(null);
  // By person is split into customers and employees: they're managed as separate groups and
  // have different things to show, so each gets only the columns that apply to it.
  const [personKind, setPersonKind] = useState<PersonKind>('customer');

  const q = query.trim().toLowerCase();
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  // What's counted at all: finished people are hidden by default, and requirements set on a
  // single visit only count when the preview switch is on.
  const base = useMemo(
    () => allocations.filter(a => (showFinished || !a.person.finished) && (includeVisits || a.scope === 'customer')),
    [allocations, showFinished, includeVisits],
  );
  const cols = PLACEMENTS.filter(p => placements.length === 0 || placements.includes(p.id));
  const profileCols = cols.filter(c => c.group === 'profile').length;
  const rosterCols = cols.length - profileCols;
  const personCols = PLACEMENTS.filter(p => p.entity === personKind && (placements.length === 0 || placements.includes(p.id)));
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
  const byPerson = useMemo(() => {
    const m = new Map<string, { person: Allocation['person']; kind: Allocation['kind']; items: Allocation[] }>();
    base
      .filter(a => a.kind === personKind && (placements.length === 0 || placements.includes(a.placement)) && (types.length === 0 || types.includes(a.tagType.id)))
      .filter(a => !q || a.person.name.toLowerCase().includes(q) || a.tag.name.toLowerCase().includes(q) || a.tagType.name.toLowerCase().includes(q))
      .forEach(a => {
        const e = m.get(a.person.id) ?? { person: a.person, kind: a.kind, items: [] };
        e.items.push(a);
        m.set(a.person.id, e);
      });
    return [...m.values()].sort((x, y) => x.person.name.localeCompare(y.person.name));
  }, [base, placements, types, q, personKind]);
  const kindCounts = useMemo(() => ({
    customer: new Set(base.filter(a => a.kind === 'customer').map(a => a.person.id)).size,
    employee: new Set(base.filter(a => a.kind === 'employee').map(a => a.person.id)).size,
  }), [base]);
  const pageCount = Math.max(1, Math.ceil(byPerson.length / PERSON_PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const personStart = (current - 1) * PERSON_PAGE_SIZE;
  const visiblePeople = byPerson.slice(personStart, personStart + PERSON_PAGE_SIZE);

  const selectedPeople = byPerson.filter(e => selected.includes(e.person.id));
  const allSelected = byPerson.length > 0 && selectedPeople.length === byPerson.length;
  const toggleOne = (id: string) => setSelected(l => toggle(l, id));


  const resultCount = mode === 'tag' ? tagRowCount : byPerson.length;
  const filterCount = placements.length + types.length;
  // Anything that changes what's listed goes back to page one and clears the selection.
  const reset = () => { setPage(1); setSelected([]); };

  const openList = open
    ? base
        .filter(a => a.tag.id === open.tag.id && a.placement === open.placement)
        .sort((x, y) => x.person.name.localeCompare(y.person.name))
    : [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
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
            options={[{ value: 'tag', label: 'By tag' }, { value: 'person', label: 'By person' }]}
          />
          {mode === 'person' && (
            <SegmentedControl
              value={personKind}
              onChange={v => {
                setPersonKind(v);
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
          <div role="search" className="relative flex-1 min-w-0">
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
            <PopoverContent align="end" className="w-[min(520px,calc(100vw-3rem))] max-h-[70vh] overflow-y-auto p-4">
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
            </PopoverContent>
          </Popover>
        </div>

        {/* Second bar: what's included. */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5 border-b border-gray-200" style={{ backgroundColor: GREY }}>
          <label className="flex items-center gap-2.5 text-body text-gray-800 cursor-pointer w-fit">
            <input type="checkbox" className="h-5 w-5 accent-[rgb(154,38,214)] cursor-pointer" checked={showFinished} onChange={e => { setShowFinished(e.target.checked); reset(); }} />
            Show finished
          </label>
          {/* Visit-level only applies to customers' requirements, so it's hidden for employees. */}
          {!(mode === 'person' && personKind === 'employee') && (
          <div className="flex items-center gap-3">
            <span className="text-body text-gray-700">Requirements</span>
            <SegmentedToggle
              variant="track"
              neutral
              offFirst
              value={includeVisits}
              onChange={v => { setIncludeVisits(v); reset(); }}
              onLabel="Include visit-level"
              offLabel="Customer level"
              ariaLabel="Requirement level"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className={`${badge} bg-purple-50 text-purple-800 border-purple-200 cursor-help outline-none focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50`}>Preview</span>
              </TooltipTrigger>
              <TooltipContent side="top" {...LIGHT_TOOLTIP}>
                <span className="block text-sm">Visit-level tags don't exist in PASS yet. This shows how requirements set on a single visit could appear.</span>
              </TooltipContent>
            </Tooltip>
          </div>
          )}
        </div>

        {mode === 'tag' ? (
          <Table className="table-fixed min-w-[980px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-gray-200 border-b-0" style={{ backgroundColor: GREY }}>
                <TableHead rowSpan={2} className="w-[260px] h-auto px-4 py-3 align-bottom text-sm font-semibold text-gray-700">Tag</TableHead>
                {profileCols > 0 && (
                  <TableHead colSpan={profileCols} className="h-auto px-3 pt-3 pb-1 text-center border-l border-gray-300 text-sm font-semibold text-gray-700">{PLACEMENT_GROUPS[0].label}</TableHead>
                )}
                {rosterCols > 0 && (
                  <TableHead colSpan={rosterCols} className="h-auto px-3 pt-3 pb-1 text-center border-l border-gray-300 text-sm font-semibold text-gray-700">{PLACEMENT_GROUPS[1].label}</TableHead>
                )}
              </TableRow>
              <TableRow className="hover:bg-transparent border-gray-200" style={{ backgroundColor: GREY }}>
                {cols.map((c, i) => (
                  <TableHead
                    key={c.id}
                    className={`h-auto px-3 pt-1 pb-3 text-center align-bottom border-l ${i === profileCols && profileCols > 0 ? 'border-gray-300' : 'border-gray-300'}`}
                  >
                    <PlacementHeading placement={c.id} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {byTag.map(({ type, rows }) => {
                const isCollapsed = collapsed.includes(type.id);
                return [
                  <TableRow key={type.id} className="bg-gray-50 hover:bg-gray-50 border-gray-200">
                    <TableCell colSpan={cols.length + 1} className="px-4 py-1.5">
                      <Button
                        variant="tertiary"
                        size="sm"
                        aria-expanded={!isCollapsed}
                        onClick={() => setCollapsed(l => toggle(l, type.id))}
                        className="!bg-transparent hover:!bg-gray-200/70 !-ml-3 !px-3"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} aria-hidden="true" />
                        <span className="text-sm font-semibold text-gray-900">{type.name}</span>
                        <span className="text-sm font-normal text-gray-600">{rows.length} {rows.length === 1 ? 'tag' : 'tags'} · {type.appliesTo.join(' & ')}</span>
                      </Button>
                    </TableCell>
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
                        const here = mine.filter(a => a.placement === c.id);
                        return (
                          <TableCell key={c.id} className="px-3 py-2.5 text-center border-l border-gray-300">
                            <CountCell
                              n={distinct(here, 'customer')}
                              m={distinct(here, 'visit')}
                              label={`${tag.name}, ${c.label}`}
                              onOpen={() => setOpen({ type, tag, placement: c.id })}
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
                      <Button variant="tertiary" onClick={() => { setQuery(''); setPlacements([]); setTypes([]); reset(); }}>Clear search and filters</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          <>
            {selectedPeople.length > 0 && (
              <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-b border-purple-200 bg-purple-50">
                <span aria-live="polite" className="text-body font-semibold text-purple-900">
                  {selectedPeople.length} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="tertiary" size="sm" onClick={() => setSelected([])}>Clear</Button>
                  <Button variant="secondary" size="sm" icon={<Minus className="w-4 h-4" />} onClick={() => setBulk('remove')}>Remove tags</Button>
                  <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setBulk('add')}>Add tags</Button>
                </div>
              </div>
            )}
            <Table className="table-fixed min-w-[980px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-gray-200" style={{ backgroundColor: GREY }}>
                  <TableHead className="w-[56px] h-auto px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={allSelected ? 'Deselect everyone' : `Select all ${byPerson.length}`}
                      className="h-5 w-5 accent-[rgb(154,38,214)] cursor-pointer"
                      checked={allSelected}
                      ref={el => { if (el) el.indeterminate = selectedPeople.length > 0 && !allSelected; }}
                      onChange={() => setSelected(allSelected ? [] : byPerson.map(e => e.person.id))}
                    />
                  </TableHead>
                  <TableHead className="w-[220px] h-auto px-4 py-3 text-sm font-semibold text-gray-700">Person</TableHead>
                  {personCols.map(c => (
                    <TableHead key={c.id} className="h-auto px-3 py-3 border-l border-gray-300 align-bottom">
                      <PlacementHeading placement={c.id} />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiblePeople.map(({ person, items }) => (
                  <TableRow key={person.id} className="bg-white hover:bg-purple-50 border-gray-200">
                    <TableCell className="align-top px-4 py-3.5">
                      <input
                        type="checkbox"
                        aria-label={`Select ${person.name}`}
                        className="h-5 w-5 accent-[rgb(154,38,214)] cursor-pointer"
                        checked={selected.includes(person.id)}
                        onChange={() => toggleOne(person.id)}
                      />
                    </TableCell>
                    <TableCell className="align-top px-4 py-3 whitespace-normal">
                      <div className="text-body font-semibold text-gray-900">{person.name}</div>
                      {/* An employee is described by their role (Careworker, Supervisor, Care Manager…). */}
                      {(person.role || person.note) && (
                        <div className="text-sm text-gray-600">{[person.role, person.note].filter(Boolean).join(' · ')}</div>
                      )}
                    </TableCell>
                    {personCols.map(c => {
                      const here = items.filter(a => a.placement === c.id);
                      return (
                        <TableCell key={c.id} className="align-top px-3 py-3 whitespace-normal border-l border-gray-300">
                          {here.length === 0 ? (
                            <span className="text-body text-gray-500" aria-label="None">–</span>
                          ) : (
                            // Grouped by tag type, so "North Tyneside" under Area isn't confused with the one under Territory.
                            <div className="space-y-2.5">
                              {[...new Set(here.map(a => a.tagType.id))].map(typeId => {
                                const inType = here.filter(a => a.tagType.id === typeId);
                                return (
                                  <div key={typeId}>
                                    <div className="mb-1 text-sm text-gray-600">{inType[0].tagType.name}</div>
                                    <ul className="flex flex-wrap gap-1.5 [&_span]:whitespace-nowrap">
                                      {inType.map(a => (
                                        <li key={a.id}>
                                          <TagSummaryPill tag={plainPill(a.tag)} />
                                          {a.scope === 'visit' && <div className="mt-0.5 text-sm text-gray-600">{a.visit} only</div>}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
                {byPerson.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={personCols.length + 2} className="py-12 text-center whitespace-normal">
                      <p className="text-base font-semibold text-gray-900">No people match{q && <> “{query.trim()}”</>}</p>
                      <div className="mt-3 flex justify-center">
                        <Button variant="tertiary" onClick={() => { setQuery(''); setPlacements([]); setTypes([]); reset(); }}>Clear search and filters</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {byPerson.length > 0 && (
              <PaginationBar
                page={current}
                pageCount={pageCount}
                from={personStart + 1}
                to={personStart + visiblePeople.length}
                total={byPerson.length}
                onPage={setPage}
              />
            )}
          </>
        )}
      </div>

      {bulk && (
        <BulkEditSlideout
          mode={bulk}
          selected={selectedPeople.map(e => ({ person: e.person, kind: e.kind }))}
          allocations={allocations}
          onClose={() => { setBulk(null); setSelected([]); }}
          onApply={onBulkApply}
          onUndo={onBulkUndo}
        />
      )}

      {open && (
        <EditSlideout title={`${placementInfo(open.placement).label}: ${open.tag.name}`} readOnly onClose={() => setOpen(null)}>
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
                    {includeVisits && (open.placement === 'mandatory' || open.placement === 'preferred') && (
                      <TableHead className="h-auto px-4 py-3 text-sm font-semibold text-gray-700">Applies to</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openList.map(a => (
                    <TableRow key={a.id} className="bg-white hover:bg-purple-50 border-gray-200">
                      <TableCell className="px-4 py-3 text-body font-semibold text-gray-900">{a.person.name}</TableCell>
                      <TableCell className="px-4 py-3 text-body text-gray-700">{a.person.note ?? 'Active'}</TableCell>
                      {includeVisits && (open.placement === 'mandatory' || open.placement === 'preferred') && (
                        <TableCell className="px-4 py-3 text-body text-gray-900">{a.scope === 'visit' ? `${a.visit} only` : 'All visits'}</TableCell>
                      )}
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
            <Link to={`/office/tags/${open.type.id}/${open.tag.id}`} className="inline-block text-body font-semibold text-[rgb(109,27,152)] hover:underline">
              Open the {open.tag.name} tag
            </Link>
          </div>
        </EditSlideout>
      )}
    </div>
  );
}
