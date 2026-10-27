import { useMemo, useState } from 'react';
import { HeartPulse, Lock, TriangleAlert } from 'lucide-react';
import { CUSTOMERS_LIST_DUMMY, STATUS_LABEL, reviewTimeOf, type ListCustomer, type ListStatus } from '../../data/customersListDummy';
import {
  PeopleListLayout, PersonCard, TagFilterSection, CheckGroup, FilterFooter, SortGroup,
  badge, checkboxClass, buildTagGroups, chipGroup, chipValue,
  type SortDirection, type TagGroups,
} from './PeopleList';

// The Customers list. The layout, toolbar, cards and every small piece are the
// shared ones in PeopleList.tsx (the Employees list uses the same); this file
// holds what's specific to customers: their data, the flags on a card, and the
// filter, sort and search rules.

type SortBy = 'surname' | 'review';

function sortCustomers(customers: ListCustomer[], by: SortBy, direction: SortDirection) {
  const sign = direction === 'asc' ? 1 : -1;
  return [...customers].sort((a, b) => {
    if (by === 'review') {
      const ta = reviewTimeOf(a);
      const tb = reviewTimeOf(b);
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

// The list opens showing only Active customers (assessment-stage, inactive and
// finished ones are one tick away in the filter). "Clear all" goes to no
// filters at all, i.e. everyone.
const DEFAULT_FILTERS: Filters = { ...NO_FILTERS, statuses: ['active'] };

const ALERT_OPTIONS: { key: AlertKey; label: string }[] = [
  { key: 'highRisk', label: 'High risk' },
  { key: 'dnacpr', label: 'DNACPR' },
  { key: 'dols', label: 'DoLS' },
  { key: 'allergies', label: 'Allergies' },
];

const STATUS_OPTIONS: { key: ListStatus; label: string }[] = (
  ['assessment-booked', 'assessment-completed', 'active', 'inactive', 'finished'] as ListStatus[]
).map(key => ({ key, label: STATUS_LABEL[key] }));

const REVIEW_OPTIONS: { value: ReviewWindow; label: string }[] = [
  { value: 'today', label: 'Due today' },
  { value: '7days', label: 'Due in the next 7 days' },
  { value: '4weeks', label: 'Due in the next 4 weeks' },
];

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

function inReviewWindow(c: ListCustomer, window: ReviewWindow) {
  const t = reviewTimeOf(c);
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

// ─── The card ───────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: ListStatus }) {
  const label = STATUS_LABEL[status];
  if (status === 'active') {
    return (
      <span className={`${badge} flex-shrink-0`} style={{ backgroundColor: '#D4EBC3', color: '#2D5F1E', borderColor: '#AFDB98' }}>
        {label}
      </span>
    );
  }
  // Assessment stages read amber; inactive / finished are muted grey.
  const tone = status === 'inactive' || status === 'finished'
    ? 'bg-gray-100 text-gray-600 border-gray-300'
    : 'bg-amber-100 text-amber-700 border-amber-300';
  return <span className={`${badge} flex-shrink-0 ${tone}`}>{label}</span>;
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

  return (
    <PersonCard
      name={customer.fullName}
      href={customer.href}
      photo={customer.photo}
      initials={customer.initials}
      avatarColor={customer.avatarColor}
      status={<StatusBadge status={customer.status} />}
      flags={flags}
      details={[
        { label: 'Date of Birth', value: customer.dob },
        { label: 'Telephone', value: customer.telephone ?? 'Not provided' },
        { label: 'Address', value: customer.address },
      ]}
      chips={customer.chips}
    />
  );
}

// ─── Filter panel ───────────────────────────────────────────────────

function FilterPanel({ filters, onChange, tagGroups, resultCount }: {
  filters: Filters;
  onChange: (f: Filters) => void;
  tagGroups: TagGroups;
  resultCount: number;
}) {
  const toggle = <K extends 'statuses' | 'alerts' | 'tags'>(field: K, value: Filters[K][number]) => {
    const current = filters[field] as string[];
    onChange({ ...filters, [field]: current.includes(value as string) ? current.filter(x => x !== value) : [...current, value] });
  };

  return (
    <div className="flex flex-col max-h-[min(80vh,720px)]">
      <div className="overflow-y-auto pr-1">
        <div className="flex gap-8">
          <CheckGroup legend="Status" options={STATUS_OPTIONS} selected={filters.statuses} onToggle={k => toggle('statuses', k)} />

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

          <CheckGroup legend="Alerts" options={ALERT_OPTIONS} selected={filters.alerts} onToggle={k => toggle('alerts', k)} />
        </div>

        <TagFilterSection tagGroups={tagGroups} selected={filters.tags} onToggle={k => toggle('tags', k)} />
      </div>

      <FilterFooter
        resultCount={resultCount}
        noun="customer"
        nounPlural="customers"
        canClear={activeFilterCount(filters) > 0}
        onClear={() => onChange(NO_FILTERS)}
      />
    </div>
  );
}

// ─── The page ───────────────────────────────────────────────────────

export function CustomersListDummy({ colouredAreaTags = true }: { colouredAreaTags?: boolean }) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('surname');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  // Active customers only until the filter is changed.
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const tagGroups = useMemo(() => buildTagGroups(CUSTOMERS_LIST_DUMMY), []);
  const filtersCount = activeFilterCount(filters);
  const filtered = useMemo(
    () => sortCustomers(CUSTOMERS_LIST_DUMMY.filter(c => matchesFilters(c, filters) && matchesQuery(c, query)), sortBy, sortDirection),
    [query, filters, sortBy, sortDirection],
  );

  return (
    <PeopleListLayout
      title="Customers"
      addLabel="Add customer"
      noun="customer"
      nounPlural="customers"
      idPrefix="customers"
      searchPlaceholder="Search customers..."
      emptyHint="a name, address, phone number, area or flag like DNACPR"
      query={query}
      onQueryChange={setQuery}
      filtersCount={filtersCount}
      filterPanel={<FilterPanel filters={filters} onChange={setFilters} tagGroups={tagGroups} resultCount={filtered.length} />}
      onClearFilters={() => setFilters(NO_FILTERS)}
      sortPanel={
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
      }
      sortDirection={sortDirection}
      sortIsDefault={sortBy === 'surname' && sortDirection === 'asc'}
      // Grouped under A–Z headings only when sorted by surname — a review-date
      // order has no letters to group by, so it's one flat run of cards.
      groupedByLetter={sortBy === 'surname'}
      items={filtered}
      renderCard={c => <CustomerCard customer={c} />}
      colouredAreaTags={colouredAreaTags}
    />
  );
}
