import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '../buttons/Button';
import { EditSlideout } from '../layout/EditSlideout';
import { TagFilterSection } from '../customer/PeopleList';
import { Banner } from './Banner';
import type { TagSummary, TagType } from './tagsMockData';
import type { TagPerson } from './tagMembers';
import {
  ALL_TAG_TYPES,
  PLACEMENTS,
  placementInfo,
  placementProblem,
  type Allocation,
  type BulkChange,
  type PersonKind,
  type Placement,
} from './tagAllocations';

// Add tags to, or remove tags from, several people at once. One panel, three parts that update
// as you go: the tags, where they go, and a plain description of exactly what will happen.
// Edits only ever merge: adding keeps everything a person already has, and removing takes out
// just that tag in just that place.

export interface BulkPerson {
  person: TagPerson;
  kind: PersonKind;
}

interface PlanRow {
  type: TagType;
  tag: TagSummary;
  kind: PersonKind;
  placement: Placement;
  /** Will be changed. */
  ok: BulkPerson[];
  /** Left as they are: they already have it (adding) or don't have it here (removing). */
  skipped: BulkPerson[];
  /** Can't be changed. */
  failed: BulkPerson[];
}

const KIND_ORDER: PersonKind[] = ['customer', 'employee'];
const noun = (kind: PersonKind, n: number) => (kind === 'customer' ? (n === 1 ? 'customer' : 'customers') : n === 1 ? 'employee' : 'employees');
const people = (n: number) => (n === 1 ? 'person' : 'people');

const SECTION = 'bg-white rounded-lg border border-gray-200 p-6';
const HEADING = 'text-body font-semibold text-gray-900';

export function BulkEditSlideout({ mode, selected, allocations, onClose, onApply, onUndo }: {
  mode: 'add' | 'remove';
  selected: BulkPerson[];
  /** Everything currently allocated (finished people included), to know who already has what. */
  allocations: Allocation[];
  onClose: () => void;
  onApply: (changes: BulkChange[], text: string) => void;
  onUndo: () => void;
}) {
  const adding = mode === 'add';
  const kinds = KIND_ORDER.filter(k => selected.some(p => p.kind === k));
  const selectedIds = useMemo(() => new Set(selected.map(p => p.person.id)), [selected]);

  // ── 1. The tags on offer: any when adding; only ones the selected people hold when removing. ──
  const lookup = useMemo(() => {
    const held = new Set(allocations.filter(a => selectedIds.has(a.person.id)).map(a => a.tag.id));
    const map = new Map<string, { type: TagType; tag: TagSummary }>();
    const groups = ALL_TAG_TYPES.map(type => {
      const tags = type.tags.filter(t => adding || held.has(t.id));
      tags.forEach(tag => map.set(`${type.name}::${tag.name}`, { type, tag }));
      return { group: type.name, values: tags.map(t => t.name) };
    }).filter(g => g.values.length > 0);
    return { map, groups };
  }, [allocations, selectedIds, adding]);

  const [chosen, setChosen] = useState<string[]>([]);
  const chosenTags = chosen.map(k => lookup.map.get(k)!).filter(Boolean);
  const toggleTag = (k: string) => setChosen(l => (l.includes(k) ? l.filter(x => x !== k) : [...l, k]));

  // ── 2. Where, for each kind of person selected. ──
  const [picked, setPicked] = useState<Partial<Record<PersonKind, Placement>>>({});
  const has = (personId: string, tagId: string, placement: Placement) =>
    allocations.some(a => a.person.id === personId && a.tag.id === tagId && a.placement === placement);

  const problemFor = (kind: PersonKind, placement: Placement): string | null => {
    if (chosenTags.length === 0) return null;
    for (const { type } of chosenTags) {
      const p = placementProblem(kind, type, placement);
      if (p) return p;
    }
    // Removing: there has to be something to take out.
    if (!adding) {
      const anyone = chosenTags.some(({ tag }) => selected.some(s => s.kind === kind && has(s.person.id, tag.id, placement)));
      if (!anyone) return 'None of them have the chosen tags here';
    }
    return null;
  };
  const effective = (kind: PersonKind): Placement | null => {
    const options = PLACEMENTS.filter(p => p.entity === kind);
    const want = picked[kind];
    if (want && !problemFor(kind, want)) return want;
    return options.find(o => !problemFor(kind, o.id))?.id ?? null;
  };

  // ── 3. What will happen. ──
  const plan: PlanRow[] = useMemo(() => {
    const rows: PlanRow[] = [];
    for (const { type, tag } of chosenTags) {
      for (const kind of kinds) {
        const placement = effective(kind);
        if (!placement) continue;
        const row: PlanRow = { type, tag, kind, placement, ok: [], skipped: [], failed: [] };
        for (const s of selected.filter(p => p.kind === kind)) {
          if (s.person.finished) row.failed.push(s);
          else if (has(s.person.id, tag.id, placement) === adding) row.skipped.push(s);
          else row.ok.push(s);
        }
        rows.push(row);
      }
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen, picked, selected, allocations, adding]);

  const updated = new Set(plan.flatMap(r => r.ok.map(p => p.person.id))).size;
  const failedPeople = [...new Map(plan.flatMap(r => r.failed).map(p => [p.person.id, p])).values()];

  // ── The result, once applied. ──
  const [result, setResult] = useState<{ plan: PlanRow[]; updated: number; failed: BulkPerson[] } | null>(null);
  const [undone, setUndone] = useState(false);

  const apply = () => {
    const changes: BulkChange[] = plan.flatMap(r =>
      r.ok.map(p => ({ op: mode, person: p.person, tagTypeId: r.type.id, tagId: r.tag.id, placement: r.placement })),
    );
    const names = [...new Set(chosenTags.map(t => t.tag.name))].join(', ');
    onApply(changes, `${updated} ${people(updated)} updated: ${adding ? 'added' : 'removed'} ${names}.`);
    setResult({ plan, updated, failed: failedPeople });
  };

  const counts = KIND_ORDER.map(k => ({ k, n: selected.filter(p => p.kind === k).length })).filter(c => c.n > 0);
  const whoLabel = counts.map(c => `${c.n} ${noun(c.k, c.n)}`).join(' and ');

  const line = (r: PlanRow, n: number) => (
    <>
      <span className="font-semibold">{r.type.name}: {r.tag.name}</span>{' '}
      {adding ? 'added to' : 'removed from'} <span className="font-semibold">{placementInfo(r.placement).label}</span> for {n} {noun(r.kind, n)}
    </>
  );

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
              {result.plan.map((r, i) => (
                <li key={i} className="text-body text-gray-900">
                  {r.ok.length > 0 ? line(r, r.ok.length) : <span className="text-gray-700">No {noun(r.kind, 2)} changed for {r.tag.name}</span>}
                  {r.skipped.length > 0 && (
                    <div className="text-sm text-gray-600">
                      {r.skipped.length} {adding ? (r.skipped.length === 1 ? 'already had it' : 'already had it') : (r.skipped.length === 1 ? "didn't have it here" : "didn't have it here")}, so nothing changed for {r.skipped.length === 1 ? 'them' : 'them'}.
                    </div>
                  )}
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
        <p className="text-body text-gray-800">
          {adding ? 'Adding tags for' : 'Removing tags from'} <span className="font-semibold">{whoLabel}</span>.{' '}
          {adding ? 'Anything they already have is kept.' : 'Only the tags you choose are removed.'}
        </p>

        <section className={SECTION} aria-labelledby="bulk-tags">
          <h3 id="bulk-tags" className={HEADING}>1. Which tags?</h3>
          {lookup.groups.length === 0 ? (
            <p className="mt-2 text-body text-gray-700">None of the selected people have any tags to remove.</p>
          ) : (
            <TagFilterSection tagGroups={lookup.groups} selected={chosen} onToggle={toggleTag} display="pills" defaultOpen={lookup.groups.slice(0, 2).map(g => g.group)} />
          )}
        </section>

        <section className={SECTION} aria-labelledby="bulk-where">
          <h3 id="bulk-where" className={HEADING}>2. Where should {adding ? 'they go' : 'they come off'}?</h3>
          {chosenTags.length === 0 ? (
            <p className="mt-2 text-body text-gray-700">Choose a tag first.</p>
          ) : (
            <div className="mt-3 space-y-5">
              {kinds.map(kind => {
                const current = effective(kind);
                const n = selected.filter(p => p.kind === kind).length;
                return (
                  <fieldset key={kind}>
                    {kinds.length > 1 && <legend className="mb-2 text-body font-medium text-gray-700">For the {n} {noun(kind, n)}</legend>}
                    <div className="space-y-2">
                      {PLACEMENTS.filter(p => p.entity === kind).map(p => {
                        const problem = problemFor(kind, p.id);
                        const on = current === p.id;
                        return (
                          <label
                            key={p.id}
                            className={`flex items-start gap-3 rounded-lg border p-3 ${problem ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : on ? 'border-[rgb(154,38,214)] bg-purple-50 cursor-pointer' : 'border-gray-300 bg-white hover:bg-gray-50 cursor-pointer'}`}
                          >
                            <input
                              type="radio"
                              name={`placement-${kind}`}
                              className="mt-1 h-5 w-5 accent-[rgb(154,38,214)]"
                              checked={on}
                              disabled={!!problem}
                              onChange={() => setPicked(s => ({ ...s, [kind]: p.id }))}
                            />
                            <p.Icon className={`w-5 h-5 mt-0.5 shrink-0 ${problem ? 'text-gray-500' : 'text-gray-700'}`} aria-hidden="true" />
                            <span className="flex-1">
                              <span className={`block text-body font-semibold ${problem ? 'text-gray-600' : 'text-gray-900'}`}>{p.label}</span>
                              <span className="block text-sm text-gray-700">{problem ? `Not available: ${problem}.` : p.description}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}
            </div>
          )}
        </section>

        <section className={SECTION} aria-labelledby="bulk-what" aria-live="polite">
          <h3 id="bulk-what" className={HEADING}>What will happen</h3>
          {plan.length === 0 ? (
            <p className="mt-2 text-body text-gray-700">Choose at least one tag to see exactly what will change.</p>
          ) : (
            <>
              <ul className="mt-3 space-y-3">
                {plan.map((r, i) => (
                  <li key={i} className="text-body text-gray-900">
                    {r.ok.length > 0 ? line(r, r.ok.length) : <span className="text-gray-700">No {noun(r.kind, 2)} to change for {r.tag.name}</span>}
                    {r.skipped.length > 0 && (
                      <div className="text-sm text-gray-600">
                        {r.skipped.length} {adding ? (r.skipped.length === 1 ? 'already has it' : 'already have it') : (r.skipped.length === 1 ? "doesn't have it here" : "don't have it here")}, so nothing changes for them.
                      </div>
                    )}
                    {r.failed.length > 0 && (
                      <div className="text-sm text-red-700">{r.failed.length} can't be changed: finished.</div>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-4 pt-3 border-t border-gray-200 text-body text-gray-800">
                <span className="font-semibold">{updated} {people(updated)}</span> will be updated.{' '}
                {adding ? "Their other tags, here and everywhere else, are kept." : 'Everything else they have stays as it is.'}
              </p>
            </>
          )}
        </section>
      </div>
    </EditSlideout>
  );
}
