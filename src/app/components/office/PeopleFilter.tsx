import { ListFilter } from 'lucide-react';
import { Button } from '../buttons/Button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { FilterFooter, tagPill } from '../customer/PeopleList';
import type { TagSummary, TagType } from './tagsMockData';

// The By person filters, in the table's own words.
//   Column filters: a small filter button in each column header. Per column: everyone, only people
//     with something in it, only people with nothing in it, or only people with particular tags.
//     Filters on different columns narrow the list together, so "Area: North Tyneside" and
//     "Territory: nothing" is the people in North Tyneside who have no territory.
//   Top filter: "Missing a tag in…" (people with an empty cell in any ticked column, the profile
//     completeness check) and "Show columns" (which columns the table shows; it never removes anyone).

export interface FilterColumn {
  id: string;
  title: string;
  sub?: string;
  /** The tags the column can hold, by type. Omitted for a column of named people, which has no tags to pick. */
  groups?: { type: TagType; tags: TagSummary[] }[];
  /** A tag type's own column, which is what "missing" is checked against. */
  isType: boolean;
}

export interface FilterRule {
  id: string;
  colId: string;
  /** true: has; false: doesn't have. */
  has: boolean;
  /** Empty: any tag. */
  tagIds: string[];
}

export interface PeopleFilters {
  rules: FilterRule[];
  missing: { colIds: string[]; mode: 'any' | 'all' };
  /** Columns switched off. */
  hidden: string[];
}

export const NO_FILTERS: PeopleFilters = { rules: [], missing: { colIds: [], mode: 'any' }, hidden: [] };

/** Whether a person, who holds `held` (tag ids, or named people's ids) in the rule's column, passes it. */
export function ruleMatches(rule: FilterRule, held: Set<string>) {
  const any = rule.tagIds.length > 0 ? rule.tagIds.some(id => held.has(id)) : held.size > 0;
  return rule.has ? any : !any;
}

const tagName = (col: FilterColumn | undefined, id: string) =>
  col?.groups?.flatMap(g => g.tags).find(t => t.id === id)?.name ?? id;

/** One line for a column's filter, as its chip reads. */
export function describeRule(rule: FilterRule, columns: FilterColumn[]) {
  const col = columns.find(c => c.id === rule.colId);
  const what = rule.tagIds.length > 0
    ? `${rule.has ? '' : "not "}${rule.tagIds.map(id => tagName(col, id)).join(' or ')}`
    : rule.has ? 'has something' : 'nothing';
  return `${col?.title ?? rule.colId}: ${what}`;
}

export function describeMissing(missing: PeopleFilters['missing'], columns: FilterColumn[]) {
  return `Missing ${missing.colIds.map(id => columns.find(c => c.id === id)?.title ?? id).join(' or ')}`;
}

const HEADING = 'text-body font-semibold text-gray-900';

/** The filter button in a column's header, and what it opens. */
export function ColumnFilter({ column, rule, onChange }: {
  column: FilterColumn;
  rule: FilterRule | undefined;
  /** null clears the column's filter. */
  onChange: (rule: Pick<FilterRule, 'has' | 'tagIds'> | null) => void;
}) {
  const mode = !rule ? 'everyone' : rule.tagIds.length > 0 ? 'tags' : rule.has ? 'something' : 'nothing';
  const choices = [
    { id: 'everyone' as const, label: 'Everyone', set: () => onChange(null) },
    { id: 'something' as const, label: 'Only people with something here', set: () => onChange({ has: true, tagIds: [] }) },
    { id: 'nothing' as const, label: 'Only people with nothing here', set: () => onChange({ has: false, tagIds: [] }) },
  ];
  const toggleTag = (id: string) => {
    const ids = rule?.tagIds ?? [];
    const next = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
    onChange(next.length > 0 ? { has: true, tagIds: next } : null);
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="tertiary"
          iconOnly
          size="sm"
          aria-label={rule ? `Filter ${column.title} (on)` : `Filter ${column.title}`}
          className={`!h-7 !w-7 shrink-0 ${rule ? '!bg-purple-100 !text-[rgb(109,27,152)]' : ''}`}
        >
          <ListFilter className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(340px,calc(100vw-3rem))] max-h-[60vh] overflow-y-auto p-4">
        <div className="text-body font-semibold text-gray-900">Show in {column.title}</div>
        <fieldset className="mt-2 space-y-0.5">
          <legend className="sr-only">Show</legend>
          {choices.map(c => (
            <label key={c.id} className="flex items-center gap-2.5 py-1 text-body text-gray-900 cursor-pointer">
              <input type="radio" name={`cf-${column.id}`} className="h-5 w-5 accent-[rgb(154,38,214)]" checked={mode === c.id} onChange={c.set} />
              {c.label}
            </label>
          ))}
        </fieldset>
        {column.groups && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2.5">
            <div className="text-body font-semibold text-gray-900">Or only people with</div>
            {column.groups.map(({ type, tags }) => (
              <div key={type.id}>
                {column.groups!.length > 1 && <div className="mb-1 text-sm font-semibold text-gray-700">{type.name}</div>}
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => {
                    const on = !!rule?.has && rule.tagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleTag(tag.id)}
                        className={`${tagPill} max-w-full rounded-2xl text-left cursor-pointer transition-colors ${on
                          ? 'bg-purple-100 border-[rgb(154,38,214)] text-[rgb(109,27,152)]'
                          : 'bg-white border-gray-400 text-gray-900 hover:bg-gray-50'}`}
                      >
                        <span className="min-w-0 break-words">{tag.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="text-sm text-gray-700">Pick more than one to include people with any of them.</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** The top filter: people missing a tag, and which columns show. */
export function PeopleFilterPanel({ columns, filters, onChange, resultCount, noun, nounPlural }: {
  columns: FilterColumn[];
  filters: PeopleFilters;
  onChange: (f: PeopleFilters) => void;
  resultCount: number;
  noun: string;
  nounPlural: string;
}) {
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);
  const typeColumns = columns.filter(c => c.isType);
  const canClear = filters.rules.length > 0 || filters.missing.colIds.length > 0 || filters.hidden.length > 0;

  return (
    <div className="space-y-6">
      <section aria-labelledby="pf-missing">
        <h3 id="pf-missing" className={HEADING}>Show people missing a tag in…</h3>
        <p className="mt-0.5 text-sm text-gray-700">People with an empty cell (–) in any column you tick.</p>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
          {typeColumns.map(c => (
            <label key={c.id} className="flex items-center gap-2.5 py-0.5 text-body text-gray-900 cursor-pointer">
              <input
                type="checkbox"
                className="h-5 w-5 accent-[rgb(154,38,214)]"
                checked={filters.missing.colIds.includes(c.id)}
                onChange={() => onChange({ ...filters, missing: { ...filters.missing, colIds: toggle(filters.missing.colIds, c.id) } })}
              />
              {c.title}
            </label>
          ))}
        </div>
        <p className="mt-2 text-sm text-gray-700">To filter one column, use the filter button in its heading.</p>
      </section>

      <section aria-labelledby="pf-cols">
        <h3 id="pf-cols" className={HEADING}>Show columns</h3>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
          {columns.map(c => (
            <label key={c.id} className="flex items-center gap-2.5 py-0.5 text-body text-gray-900 cursor-pointer">
              <input
                type="checkbox"
                className="h-5 w-5 accent-[rgb(154,38,214)]"
                checked={!filters.hidden.includes(c.id)}
                onChange={() => onChange({ ...filters, hidden: toggle(filters.hidden, c.id) })}
              />
              {c.title}
            </label>
          ))}
        </div>
      </section>

      <FilterFooter resultCount={resultCount} noun={noun} nounPlural={nounPlural} canClear={canClear} onClear={() => onChange(NO_FILTERS)} />
    </div>
  );
}
