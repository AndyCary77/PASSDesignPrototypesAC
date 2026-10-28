import { useMemo, useState } from 'react';
import { Check, Search, Tag as TagIcon, X } from 'lucide-react';
import { Button } from '../buttons/Button';
import { SegmentedControl } from '../buttons/SegmentedControl';
import { PaginationBar } from '../buttons/PaginationBar';
import { EditSlideout } from '../layout/EditSlideout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { badge } from '../customer/PeopleList';
import { ALL_TAG_TYPES, MANDATORY_TYPES, typeName, type MissingRow, type PersonKind } from './tagAllocations';

// Missing tags: active customers and employees who have no tag from a tag type that's mandatory for
// them, soonest-needed first. Fix one person, or tick several and assign the same tag to all.

const PAGE_SIZE = 12;
const GREY = '#f6f7f9';
const INPUT_CLASS = 'w-full px-3 py-2 border border-gray-300 rounded-md text-body bg-white';
const LABEL_CLASS = 'block text-body font-medium text-gray-700 mb-2';

function AssignSlideout({ people, preferredType, onClose, onAssign }: {
  people: MissingRow[];
  preferredType: string | null;
  onClose: () => void;
  onAssign: (people: MissingRow[], typeId: string, tagId: string) => void;
}) {
  const typeIds = [...new Set(people.flatMap(p => p.missing))];
  const [typeId, setTypeId] = useState(preferredType && typeIds.includes(preferredType) ? preferredType : typeIds[0]);
  const type = ALL_TAG_TYPES.find(t => t.id === typeId)!;
  const [tagId, setTagId] = useState(type.tags[0].id);
  const target = people.filter(p => p.missing.includes(typeId));
  const tag = type.tags.find(t => t.id === tagId) ?? type.tags[0];
  const noun = target.every(p => p.kind === 'customer') ? 'customer' : target.every(p => p.kind === 'employee') ? 'employee' : 'person';
  const count = target.length;

  return (
    <EditSlideout
      title="Assign a tag"
      onClose={onClose}
      saveLabel={`Assign to ${count} ${count === 1 ? noun : noun === 'person' ? 'people' : `${noun}s`}`}
      onSave={close => { onAssign(target, typeId, tag.id); close(); }}
    >
      <div className="space-y-5">
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
          <div>
            <label htmlFor="assign-type" className={LABEL_CLASS}>Tag type</label>
            <select
              id="assign-type"
              className={INPUT_CLASS}
              value={typeId}
              onChange={e => { setTypeId(e.target.value); setTagId(ALL_TAG_TYPES.find(t => t.id === e.target.value)!.tags[0].id); }}
            >
              {typeIds.map(id => {
                const n = people.filter(p => p.missing.includes(id)).length;
                return <option key={id} value={id}>{typeName(id)}{typeIds.length > 1 ? ` (${n} of ${people.length} missing it)` : ''}</option>;
              })}
            </select>
          </div>
          <div>
            <label htmlFor="assign-tag" className={LABEL_CLASS}>Tag</label>
            <select id="assign-tag" className={INPUT_CLASS} value={tag.id} onChange={e => setTagId(e.target.value)}>
              {type.tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-body font-semibold text-gray-900">What will happen</h3>
          <p className="mt-2 text-body text-gray-800">
            <span className="font-semibold">{type.name}: {tag.name}</span> will be added to{' '}
            {count} {count === 1 ? noun : noun === 'person' ? 'people' : `${noun}s`}. Any tags they already have are kept.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="People who will get this tag">
            {target.slice(0, 10).map(p => (
              <li key={p.person.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-gray-800" style={{ backgroundColor: 'rgb(220, 217, 228)' }}>
                {p.person.name}
              </li>
            ))}
            {target.length > 10 && <li className="inline-flex items-center px-3 py-1 text-sm text-gray-700">and {target.length - 10} more</li>}
          </ul>
        </div>
      </div>
    </EditSlideout>
  );
}

export function MissingTagsView({ rows, onAssign }: {
  rows: MissingRow[];
  onAssign: (people: MissingRow[], typeId: string, tagId: string) => void;
}) {
  const [kind, setKind] = useState<PersonKind>('customer');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [assigning, setAssigning] = useState<MissingRow[] | null>(null);

  const ofKind = useMemo(() => rows.filter(r => r.kind === kind), [rows, kind]);
  const customerCount = rows.filter(r => r.kind === 'customer').length;
  const employeeCount = rows.length - customerCount;

  // The mandatory types that apply to this kind of person, with how many are missing each.
  const typeCounts = MANDATORY_TYPES.filter(m => m.entities.includes(kind))
    .map(m => ({ typeId: m.typeId, n: ofKind.filter(r => r.missing.includes(m.typeId)).length }))
    .filter(t => t.n > 0);
  const activeType = typeFilter && typeCounts.some(t => t.typeId === typeFilter) ? typeFilter : null;

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () => ofKind.filter(r => (!activeType || r.missing.includes(activeType)) && (!q || r.person.name.toLowerCase().includes(q))),
    [ofKind, activeType, q],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const selectedRows = filtered.filter(r => selected.includes(r.person.id));
  const allSelected = filtered.length > 0 && selectedRows.length === filtered.length;
  const reset = () => { setPage(1); setSelected([]); };
  const toggleOne = (id: string) => setSelected(l => (l.includes(id) ? l.filter(x => x !== id) : [...l, id]));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#D4EBC3', color: '#2D5F1E' }}>
              <Check className="w-6 h-6" aria-hidden="true" />
            </span>
            <p className="text-base font-semibold text-gray-900">Nobody is missing a mandatory tag</p>
            <p className="text-body text-gray-600">Every active customer and employee has a tag from each mandatory tag type.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 p-3 border-b border-gray-200">
              <SegmentedControl
                value={kind}
                onChange={v => { setKind(v); setTypeFilter(null); reset(); }}
                ariaLabel="Customers or employees"
                options={[
                  { value: 'customer', label: `Customers · ${customerCount}` },
                  { value: 'employee', label: `Employees · ${employeeCount}` },
                ]}
              />
              <div role="search" className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" aria-hidden="true" />
                <input
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); reset(); }}
                  onKeyDown={e => { if (e.key === 'Escape') { setQuery(''); reset(); } }}
                  placeholder={`Search ${kind === 'customer' ? 'customers' : 'employees'}...`}
                  aria-label={`Search ${kind === 'customer' ? 'customers' : 'employees'}`}
                  className="w-full pl-9 pr-40 py-2 bg-white border border-gray-200 rounded-lg text-body text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[rgb(154,38,214)] focus:ring-1 focus:ring-[rgb(154,38,214)]"
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {query && (
                    <Button variant="tertiary" iconOnly size="sm" aria-label="Clear search" onClick={() => { setQuery(''); reset(); }} className="!h-7 !w-7">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  <span aria-live="polite" className={`${badge} bg-gray-100 text-gray-700 border-gray-300 whitespace-nowrap`}>
                    {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
                  </span>
                </div>
              </div>
            </div>

            {/* Which type they're missing. */}
            <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-gray-200" style={{ backgroundColor: GREY }}>
              <span className="text-body text-gray-700 mr-1">Missing</span>
              <Button variant={activeType === null ? 'primary' : 'tertiary'} size="sm" aria-pressed={activeType === null} onClick={() => { setTypeFilter(null); reset(); }}>
                Any type · {ofKind.length}
              </Button>
              {typeCounts.map(t => (
                <Button
                  key={t.typeId}
                  variant={activeType === t.typeId ? 'primary' : 'tertiary'}
                  size="sm"
                  aria-pressed={activeType === t.typeId}
                  onClick={() => { setTypeFilter(t.typeId); reset(); }}
                >
                  {typeName(t.typeId)} · {t.n}
                </Button>
              ))}
            </div>

            {selectedRows.length > 0 && (
              <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-b border-purple-200 bg-purple-50">
                <span aria-live="polite" className="text-body font-semibold text-purple-900">{selectedRows.length} selected</span>
                <div className="flex items-center gap-2">
                  <Button variant="tertiary" size="sm" onClick={() => setSelected([])}>Clear</Button>
                  <Button size="sm" icon={<TagIcon className="w-4 h-4" />} onClick={() => setAssigning(selectedRows)}>Assign a tag</Button>
                </div>
              </div>
            )}

            <Table className="table-fixed min-w-[900px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-gray-200" style={{ backgroundColor: GREY }}>
                  <TableHead className="w-[56px] h-auto px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={allSelected ? 'Deselect everyone' : `Select all ${filtered.length}`}
                      className="h-5 w-5 accent-[rgb(154,38,214)] cursor-pointer"
                      checked={allSelected}
                      ref={el => { if (el) el.indeterminate = selectedRows.length > 0 && !allSelected; }}
                      onChange={() => setSelected(allSelected ? [] : filtered.map(r => r.person.id))}
                    />
                  </TableHead>
                  <TableHead className="h-auto px-4 py-3 text-sm font-semibold text-gray-700">{kind === 'customer' ? 'Customer' : 'Employee'}</TableHead>
                  <TableHead className="w-[320px] h-auto px-4 py-3 text-sm font-semibold text-gray-700">Missing</TableHead>
                  <TableHead className="w-[180px] h-auto px-4 py-3 text-sm font-semibold text-gray-700">{kind === 'customer' ? 'Next visit' : 'Next shift'}</TableHead>
                  <TableHead className="w-[150px] h-auto px-4 py-3"><span className="sr-only">Action</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map(r => (
                  <TableRow key={r.person.id} className="bg-white hover:bg-purple-50 border-gray-200">
                    <TableCell className="px-4 py-3 align-middle">
                      <input
                        type="checkbox"
                        aria-label={`Select ${r.person.name}`}
                        className="h-5 w-5 accent-[rgb(154,38,214)] cursor-pointer"
                        checked={selected.includes(r.person.id)}
                        onChange={() => toggleOne(r.person.id)}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3 align-middle whitespace-normal">
                      <div className="text-body font-semibold text-gray-900">{r.person.name}</div>
                      {(r.person.role || r.person.note) && (
                        <div className="text-sm text-gray-600">{[r.person.role, r.person.note].filter(Boolean).join(' · ')}</div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 align-middle whitespace-normal">
                      <ul className="flex flex-wrap gap-1.5" aria-label="Missing tag types">
                        {r.missing.map(id => (
                          <li key={id} className={`${badge} bg-amber-100 text-amber-800 border-amber-300`}>{typeName(id)}</li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell className="px-4 py-3 align-middle text-body text-gray-900">{r.next}</TableCell>
                    <TableCell className="px-4 py-3 align-middle text-right">
                      <Button variant="secondary" size="sm" aria-label={`Add a tag for ${r.person.name}`} onClick={() => setAssigning([r])}>Add tag</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="py-12 text-center whitespace-normal">
                      <p className="text-base font-semibold text-gray-900">No one matches{q && <> “{query.trim()}”</>}</p>
                      <div className="mt-3 flex justify-center gap-3">
                        {query && <Button variant="tertiary" onClick={() => { setQuery(''); reset(); }}>Clear search</Button>}
                        {activeType && <Button variant="tertiary" onClick={() => { setTypeFilter(null); reset(); }}>Show any type</Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {filtered.length > 0 && (
              <PaginationBar
                page={current}
                pageCount={pageCount}
                from={start + 1}
                to={start + visible.length}
                total={filtered.length}
                onPage={setPage}
              />
            )}
          </>
        )}
      </div>

      {assigning && (
        <AssignSlideout
          people={assigning}
          preferredType={activeType}
          onClose={() => setAssigning(null)}
          onAssign={(people, typeId, tagId) => { onAssign(people, typeId, tagId); setSelected([]); }}
        />
      )}
    </div>
  );
}
