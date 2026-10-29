import { useMemo, useState } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';
import { Button } from '../buttons/Button';
import { EditSlideout } from '../layout/EditSlideout';
import { tagPill } from '../customer/PeopleList';
import { Banner } from './Banner';
import type { TagSummary, TagType } from './tagsMockData';
import type { TagPerson } from './tagMembers';
import { CAREWORKERS, disfavouredOf, doublesUp, type RelationChange } from './personRelations';
import {
  ALL_TAG_TYPES,
  placementProblem,
  type Allocation,
  type BulkChange,
  type PersonKind,
  type Placement,
} from './tagAllocations';

// Add tags to, or remove tags from, several people at once. The panel mirrors the table behind it:
// pick one of its columns (same names, same order), then the tags that column can hold, and a plain
// description of exactly what will happen. Edits only ever merge: adding keeps everything a person
// already has, and removing takes out just that tag in just that column.

export interface BulkPerson {
  person: TagPerson;
  kind: PersonKind;
}

/** A column of the By person table that the panel can change, as it offers it. */
export type BulkColumn = { id: string; title: string; sub?: string } & (
  | {
      kind: 'tags';
      /** Where a tag added to this column is kept. */
      placement: Placement;
      /** The one tag type the column holds; omit for requirement columns, which take tags from any type. */
      typeIds?: string[];
    }
  // Named careworkers rather than tags: the employee's Disfavoured careworkers.
  | { kind: 'people'; relation: 'disfavoured' }
);

interface PlanRow {
  /** The tag's or careworker's id. */
  key: string;
  /** What's being added or removed, as the lines name it. */
  label: string;
  /** Will be changed. */
  ok: BulkPerson[];
  /** Left as they are: they already have it (adding) or don't have it here (removing). */
  skipped: BulkPerson[];
  /** Can't be changed: finished. */
  failed: BulkPerson[];
  /** Can't be changed for another reason, with that reason. */
  blocked: { person: BulkPerson; reason: string }[];
  /** Adding to a one-tag-per-person type: what they have now, taken off as this goes on. */
  replaces: Allocation[];
  replaceNote?: string;
  /** Tag rows. */
  type?: TagType;
  tag?: TagSummary;
  /** Careworker rows. */
  other?: TagPerson;
}

const noun = (kind: PersonKind, n: number) => (kind === 'customer' ? (n === 1 ? 'customer' : 'customers') : n === 1 ? 'employee' : 'employees');
const people = (n: number) => (n === 1 ? 'person' : 'people');

const SECTION = 'bg-white rounded-lg border border-gray-200 p-6';
const HEADING = 'text-body font-semibold text-gray-900';

export function BulkEditSlideout({ mode, selected, kind, candidates, onAddPerson, onRemovePerson, columns, allocations, relations, onClose, onApply, onUndo }: {
  mode: 'add' | 'remove';
  /** The people ticked in the table. It lists one kind of person at a time, so they're all the same kind. */
  selected: BulkPerson[];
  kind: PersonKind;
  /** Everyone who could be added to the group: the same kind of person, not finished. */
  candidates: BulkPerson[];
  onAddPerson: (id: string) => void;
  onRemovePerson: (id: string) => void;
  /** The table's columns for that kind of person that can be changed, in the table's order. */
  columns: BulkColumn[];
  /** Everything currently allocated (finished people included), to know who already has what. */
  allocations: Allocation[];
  /** Careworkers added to or taken off disfavoured lists so far. */
  relations: RelationChange[];
  onClose: () => void;
  onApply: (changes: BulkChange[], text: string, relations: RelationChange[]) => void;
  onUndo: () => void;
}) {
  const adding = mode === 'add';
  const selectedIds = useMemo(() => new Set(selected.map(p => p.person.id)), [selected]);

  // ── Who has what, per column, among the people selected: option id (tag or careworker) → who. ──
  const inColumn = (a: Allocation, col: BulkColumn) =>
    col.kind === 'tags' && a.placement === col.placement && (!col.typeIds || col.typeIds.includes(a.tagType.id));
  const heldBy = useMemo(() => {
    const out = new Map<string, Map<string, Set<string>>>();
    const note = (byOption: Map<string, Set<string>>, optionId: string, personId: string) =>
      byOption.set(optionId, (byOption.get(optionId) ?? new Set()).add(personId));
    for (const col of columns) {
      const byOption = new Map<string, Set<string>>();
      if (col.kind === 'people') {
        selected.forEach(s => disfavouredOf(s.person, relations).forEach(o => note(byOption, o.id, s.person.id)));
      } else {
        allocations.forEach(a => selectedIds.has(a.person.id) && inColumn(a, col) && note(byOption, a.tag.id, a.person.id));
      }
      out.set(col.id, byOption);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allocations, relations, selected, selectedIds, columns]);
  const has = (person: TagPerson, optionId: string, col: BulkColumn) =>
    col.kind === 'people'
      ? disfavouredOf(person, relations).some(o => o.id === optionId)
      : allocations.some(a => a.person.id === person.id && a.tag.id === optionId && inColumn(a, col));

  // ── 1. Which column. ──
  const [columnId, setColumnId] = useState<string | null>(null);
  const column = columns.find(c => c.id === columnId) ?? null;
  const [chosen, setChosen] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const pickColumn = (id: string) => { setColumnId(id); setChosen([]); setSearch(''); };
  /** People who hold anything in the column, for the remove tiles. */
  const holdersIn = (col: BulkColumn) => new Set([...(heldBy.get(col.id)?.values() ?? [])].flatMap(s => [...s])).size;

  // ── 2. Which tags (or careworkers): only what the column can hold, and when removing only what they hold. ──
  const groups = useMemo(() => {
    if (!column || column.kind !== 'tags') return [];
    const held = heldBy.get(column.id)!;
    return ALL_TAG_TYPES
      .filter(t => (column.typeIds ? column.typeIds.includes(t.id) : t.appliesTo.includes('Employees')) && !placementProblem(kind, t, column.placement))
      .map(type => ({ type, tags: type.tags.filter(t => adding || held.has(t.id)) }))
      .filter(g => g.tags.length > 0);
  }, [column, heldBy, kind, adding]);
  const careworkers = useMemo(() => {
    if (!column || column.kind !== 'people') return [];
    const held = heldBy.get(column.id)!;
    const q = search.trim().toLowerCase();
    return CAREWORKERS.filter(c => (adding || held.has(c.id)) && (!q || c.name.toLowerCase().includes(q)));
  }, [column, heldBy, adding, search]);

  const chosenTags = groups.flatMap(g => g.tags.filter(t => chosen.includes(t.id)).map(tag => ({ type: g.type, tag })));
  const chosenCareworkers = column?.kind === 'people' ? CAREWORKERS.filter(c => chosen.includes(c.id)) : [];

  const toggleTag = (type: TagType, tagId: string) =>
    setChosen(l => {
      if (l.includes(tagId)) return l.filter(x => x !== tagId);
      // A type that allows one tag per person takes one choice at a time.
      return adding && type.limitOnePerTag ? [...l.filter(x => !type.tags.some(t => t.id === x)), tagId] : [...l, tagId];
    });
  const toggleCareworker = (id: string) => setChosen(l => (l.includes(id) ? l.filter(x => x !== id) : [...l, id]));

  // ── 3. What will happen. ──
  const plan: PlanRow[] = useMemo(() => {
    if (!column) return [];
    const rowFor = (init: Pick<PlanRow, 'key' | 'label'> & Partial<PlanRow>, optionId: string, blockReason: (s: BulkPerson) => string | null) => {
      const row: PlanRow = { ok: [], skipped: [], failed: [], blocked: [], replaces: [], ...init };
      for (const s of selected) {
        const reason = adding ? blockReason(s) : null;
        if (s.person.finished) row.failed.push(s);
        else if (reason) row.blocked.push({ person: s, reason });
        else if (has(s.person, optionId, column) === adding) row.skipped.push(s);
        else row.ok.push(s);
      }
      return row;
    };
    if (column.kind === 'people') {
      return chosenCareworkers.map(other =>
        rowFor({ key: other.id, label: other.name, other }, other.id, s =>
          s.person.id === other.id ? "can't be disfavoured with themselves"
          : !doublesUp(s.person) ? "live-in carers don't double up" : null),
      );
    }
    return chosenTags.map(({ type, tag }) => {
      const row = rowFor(
        { key: tag.id, label: column.typeIds ? tag.name : `${type.name}: ${tag.name}`, type, tag },
        tag.id,
        () => null,
      );
      if (adding && type.limitOnePerTag) {
        row.replaces = allocations.filter(a => row.ok.some(s => s.person.id === a.person.id) && a.tagType.id === type.id && inColumn(a, column));
        row.replaceNote = `${type.name} allows one tag per person, so ${row.replaces.length === 1 ? 'their current one is' : `${row.replaces.length} current ones are`} replaced.`;
      }
      return row;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [column, chosen, selected, allocations, relations, adding]);

  const updated = new Set(plan.flatMap(r => r.ok.map(p => p.person.id))).size;
  const failedPeople = [...new Map(plan.flatMap(r => r.failed).map(p => [p.person.id, p])).values()];

  // ── The result, once applied. ──
  const [result, setResult] = useState<{ plan: PlanRow[]; column: BulkColumn; updated: number; failed: BulkPerson[] } | null>(null);
  const [undone, setUndone] = useState(false);

  const apply = () => {
    if (!column) return;
    const tagChanges: BulkChange[] = column.kind === 'people' ? [] : plan.flatMap(r => [
      ...r.replaces.map(a => ({ op: 'remove' as const, person: a.person, tagTypeId: a.tagType.id, tagId: a.tag.id, placement: a.placement })),
      ...r.ok.map(p => ({ op: mode, person: p.person, tagTypeId: r.type!.id, tagId: r.tag!.id, placement: column.placement })),
    ]);
    const relationChanges: RelationChange[] = column.kind === 'people'
      ? plan.flatMap(r => r.ok.map(p => ({ op: mode, person: p.person, relation: column.relation, other: r.other! })))
      : [];
    const names = plan.map(r => r.tag?.name ?? r.label).join(', ');
    onApply(tagChanges, `${updated} ${people(updated)} updated: ${adding ? 'added' : 'removed'} ${names} ${adding ? 'to' : 'from'} ${column.title}.`, relationChanges);
    setResult({ plan, column, updated, failed: failedPeople });
  };
  const another = () => { setResult(null); setUndone(false); setColumnId(null); setChosen([]); setSearch(''); };

  const whoLabel = `${selected.length} ${noun(kind, selected.length)}`;
  const [addQuery, setAddQuery] = useState('');
  const matches = addQuery.trim()
    ? candidates.filter(c => !selectedIds.has(c.person.id) && c.person.name.toLowerCase().includes(addQuery.trim().toLowerCase())).slice(0, 6)
    : [];

  const line = (col: BulkColumn, r: PlanRow, n: number) => (
    <>
      <span className="font-semibold">{r.label}</span> {adding ? 'added to' : 'removed from'}{' '}
      <span className="font-semibold">{col.title}</span> for {n} {noun(kind, n)}
    </>
  );
  const skippedText = (n: number) =>
    `${n} ${adding ? (n === 1 ? 'already has it' : 'already have it') : n === 1 ? "doesn't have it here" : "don't have it here"}, so nothing changes for them.`;
  /** "1 can't be changed: live-in carers don't double up." — one line per reason. */
  const blockedLines = (r: PlanRow) =>
    [...new Set(r.blocked.map(b => b.reason))].map(reason => (
      <div key={reason} className="text-sm text-red-700">{r.blocked.filter(b => b.reason === reason).length} can't be changed: {reason}.</div>
    ));

  // ── Result view ──
  if (result) {
    return (
      <EditSlideout title={adding ? 'Tags added' : 'Tags removed'} readOnly onClose={onClose}>
        <div className="space-y-5">
          <div className={`${SECTION} flex items-start gap-4`}>
            <span className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: '#D4EBC3', color: '#2D5F1E' }}>
              <Check className="w-5 h-5" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <p className="text-base font-semibold text-gray-900">
                {undone ? 'Undone: nothing was changed' : `${result.updated} ${people(result.updated)} updated`}
              </p>
              {!undone && result.failed.length > 0 && (
                <p className="mt-1 text-body text-gray-700">{result.failed.length} couldn't be changed (see below).</p>
              )}
              <p className="mt-1 text-body text-gray-700">Recorded in the audit log: who made the change, when, the people, the tags and where.</p>
            </div>
            {!undone && (
              <Button variant="tertiary" size="sm" onClick={() => { onUndo(); setUndone(true); }}>Undo</Button>
            )}
          </div>

          {!undone && (
            <div className={SECTION}>
              <h3 className={HEADING}>What changed</h3>
              <ul className="mt-3 space-y-3">
                {result.plan.map(r => (
                  <li key={r.key} className="text-body text-gray-900">
                    {r.ok.length > 0 ? line(result.column, r, r.ok.length) : <span className="text-gray-700">No {noun(kind, 2)} changed for {r.label}</span>}
                    {r.replaces.length > 0 && <div className="text-sm text-gray-600">{r.replaceNote}</div>}
                    {r.skipped.length > 0 && <div className="text-sm text-gray-600">{skippedText(r.skipped.length)}</div>}
                    {blockedLines(r)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.failed.length > 0 && !undone && (
            <Banner variant="warning">
              <p className="font-semibold">{result.failed.length} {people(result.failed.length)} couldn't be updated</p>
              <ul className="space-y-1">
                {result.failed.map(f => (
                  <li key={f.person.id} className="text-body">{f.person.name}: finished, so their tags can't be changed.</li>
                ))}
              </ul>
            </Banner>
          )}

          <Button variant="secondary" onClick={another}>{adding ? 'Add to another column' : 'Remove from another column'}</Button>
        </div>
      </EditSlideout>
    );
  }

  // ── Form view ──
  return (
    <EditSlideout
      title={adding ? 'Add tags' : 'Remove tags'}
      onClose={onClose}
      saveLabel={updated > 0 ? `${adding ? 'Add' : 'Remove'} for ${updated} ${people(updated)}` : adding ? 'Add tags' : 'Remove tags'}
      saveDisabled={updated === 0}
      onSave={() => apply()}
    >
      <div className="space-y-5">
        <section className={SECTION} aria-labelledby="bulk-who">
          <h3 id="bulk-who" className={HEADING}>
            {adding ? 'Adding tags for' : 'Removing tags from'} {selected.length === 0 ? `no ${noun(kind, 2)}` : whoLabel}
          </h3>
          <p className="mt-1 text-sm text-gray-700">{adding ? 'Anything they already have is kept.' : 'Only the tags you choose are removed.'}</p>
          {selected.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {selected.map(({ person }) => (
                <li key={person.id} className="inline-flex items-center gap-0.5 rounded-full border border-gray-300 bg-white pl-3 pr-1 text-sm font-medium text-gray-900">
                  {person.name}
                  <Button variant="tertiary" iconOnly size="sm" aria-label={`Remove ${person.name}`} onClick={() => onRemovePerson(person.id)} className="!h-7 !w-7">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" aria-hidden="true" />
            <input
              type="search"
              value={addQuery}
              onChange={e => setAddQuery(e.target.value)}
              placeholder={`Add ${noun(kind, 2)} by name`}
              aria-label={`Add ${noun(kind, 2)} by name`}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-300 bg-white text-body text-gray-900 placeholder:text-gray-600"
            />
          </div>
          {addQuery.trim() && (
            <ul className="mt-2 rounded-lg border border-gray-200 divide-y divide-gray-200 bg-white">
              {matches.map(({ person }) => (
                <li key={person.id}>
                  <button
                    type="button"
                    onClick={() => { onAddPerson(person.id); setAddQuery(''); }}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left cursor-pointer hover:bg-gray-50"
                  >
                    <span className="min-w-0">
                      <span className="block text-body font-medium text-gray-900">{person.name}</span>
                      {(person.role || person.note) && <span className="block text-sm text-gray-600">{[person.role, person.note].filter(Boolean).join(' · ')}</span>}
                    </span>
                    <Plus className="w-4 h-4 shrink-0 text-gray-700" aria-hidden="true" />
                  </button>
                </li>
              ))}
              {matches.length === 0 && <li className="px-3 py-2 text-body text-gray-700">No one else matches.</li>}
            </ul>
          )}
        </section>

        <section className={SECTION} aria-labelledby="bulk-column">
          <h3 id="bulk-column" className={HEADING}>1. Which column?</h3>
          <p className="mt-1 text-sm text-gray-700">The same columns as the table.</p>
          <fieldset className="mt-3">
            <legend className="sr-only">Column</legend>
            <div className="grid grid-cols-2 gap-2">
              {columns.map(col => {
                const n = holdersIn(col);
                const unavailable = !adding && n === 0;
                const on = columnId === col.id;
                return (
                  <label
                    key={col.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 ${unavailable ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : on ? 'border-[rgb(154,38,214)] bg-purple-50 cursor-pointer' : 'border-gray-300 bg-white hover:bg-gray-50 cursor-pointer'}`}
                  >
                    <input
                      type="radio"
                      name="bulk-column"
                      className="mt-1 h-5 w-5 shrink-0 accent-[rgb(154,38,214)]"
                      checked={on}
                      disabled={unavailable}
                      onChange={() => pickColumn(col.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-body font-semibold ${unavailable ? 'text-gray-600' : 'text-gray-900'}`}>{col.title}</span>
                      {col.sub && <span className="block text-sm text-gray-700">{col.sub}</span>}
                      {!adding && <span className="block text-sm text-gray-600">{n === 0 ? 'None have any' : `${n} of ${selected.length} have some`}</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </section>

        <section className={SECTION} aria-labelledby="bulk-tags">
          <h3 id="bulk-tags" className={HEADING}>2. {column?.kind === 'people' ? 'Which careworkers?' : 'Which tags?'}</h3>
          {!column ? (
            <p className="mt-2 text-body text-gray-700">Choose a column first.</p>
          ) : column.kind === 'people' ? (
            <div className="mt-3">
              {adding && (
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" aria-hidden="true" />
                  <input
                    type="search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search careworkers"
                    aria-label="Search careworkers"
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-300 bg-white text-body text-gray-900 placeholder:text-gray-600"
                  />
                </div>
              )}
              <ul className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-200">
                {careworkers.map(c => {
                  const n = heldBy.get(column.id)!.get(c.id)?.size ?? 0;
                  return (
                    <li key={c.id}>
                      <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" className="h-5 w-5 accent-[rgb(154,38,214)]" checked={chosen.includes(c.id)} onChange={() => toggleCareworker(c.id)} />
                        <span className="flex-1 min-w-0">
                          <span className="block text-body font-medium text-gray-900">{c.name}</span>
                          {c.role && <span className="block text-sm text-gray-600">{c.role}</span>}
                        </span>
                        {!adding && <span className="text-sm text-gray-700">({n})</span>}
                      </label>
                    </li>
                  );
                })}
                {careworkers.length === 0 && <li className="px-3 py-3 text-body text-gray-700">{adding ? 'No careworkers match.' : "There's nothing to remove here."}</li>}
              </ul>
              {chosen.length > 0 && <p className="mt-2 text-sm text-gray-700">{chosen.length} chosen</p>}
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              {groups.map(({ type, tags }) => (
                <div key={type.id}>
                  {/* A column for one type is already named by its heading; a requirements column mixes types. */}
                  {!column.typeIds && <div className="mb-1.5 text-sm font-semibold text-gray-700">{type.name}</div>}
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => {
                      const on = chosen.includes(tag.id);
                      const n = heldBy.get(column.id)!.get(tag.id)?.size ?? 0;
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleTag(type, tag.id)}
                          className={`${tagPill} max-w-full rounded-2xl text-left cursor-pointer transition-colors ${on
                            ? 'bg-purple-100 border-[rgb(154,38,214)] text-[rgb(109,27,152)]'
                            : 'bg-white border-gray-400 text-gray-900 hover:bg-gray-50'}`}
                        >
                          <span className="min-w-0 break-words">{tag.name}</span>
                          {!adding && <span className="font-normal">({n})</span>}
                        </button>
                      );
                    })}
                  </div>
                  {adding && type.limitOnePerTag && <p className="mt-1.5 text-sm text-gray-700">One per person: choosing this replaces the one they have now.</p>}
                </div>
              ))}
              {groups.length === 0 && <p className="text-body text-gray-700">There's nothing to remove here.</p>}
            </div>
          )}
        </section>

        <section className={SECTION} aria-labelledby="bulk-what" aria-live="polite">
          <h3 id="bulk-what" className={HEADING}>What will happen</h3>
          {!column || plan.length === 0 ? (
            <p className="mt-2 text-body text-gray-700">Choose at least one tag to see exactly what will change.</p>
          ) : (
            <>
              <ul className="mt-3 space-y-3">
                {plan.map(r => (
                  <li key={r.key} className="text-body text-gray-900">
                    {r.ok.length > 0 ? line(column, r, r.ok.length) : <span className="text-gray-700">No {noun(kind, 2)} to change for {r.label}</span>}
                    {r.replaces.length > 0 && <div className="text-sm text-gray-600">{r.replaceNote}</div>}
                    {r.skipped.length > 0 && <div className="text-sm text-gray-600">{skippedText(r.skipped.length)}</div>}
                    {blockedLines(r)}
                    {r.failed.length > 0 && <div className="text-sm text-red-700">{r.failed.length} can't be changed: finished.</div>}
                  </li>
                ))}
              </ul>
              <p className="mt-4 pt-3 border-t border-gray-200 text-body text-gray-800">
                <span className="font-semibold">{updated} {people(updated)}</span> will be updated.{' '}
                {adding ? (column.kind === 'people' ? 'Anyone already on their list is kept.' : 'Their other tags, here and everywhere else, are kept.') : 'Everything else they have stays as it is.'}
              </p>
            </>
          )}
        </section>
      </div>
    </EditSlideout>
  );
}
