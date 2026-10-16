import { useMemo, useState } from 'react';
import { Bell, BellOff, Check, CircleArrowUp, CircleCheck } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import {
  EMPLOYEES_LIST_DUMMY, EMPLOYEE_ROLES, EMPLOYEE_STATUS_LABEL,
  type EmployeeAppInfo, type EmployeeRole, type EmployeeStatus, type ListEmployee,
} from '../../data/employeesListDummy';
import {
  PeopleListLayout, PersonCard, TagFilterSection, CheckGroup, FilterFooter, SortGroup,
  badge, checkboxClass, buildTagGroups, chipGroup, chipValue,
  type SortDirection, type TagGroups,
} from './PeopleList';

// The Employees list. Layout, toolbar, cards and every small piece are the
// shared ones in PeopleList.tsx — identical to the Customers list. This file
// holds what's specific to employees: their data, the role badge, the extra
// "app activity" row (notifications + when they last logged in to the PASS
// app), and the filter, sort and search rules.

type SortBy = 'surname' | 'login';

// ─── App activity ───────────────────────────────────────────────────

const daysSince = (a: EmployeeAppInfo | null | undefined) => (a ? a.daysAgo : null);

/** "today", "1 day ago", "16 days ago", "2 months ago". */
function ago(days: number) {
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 60) return `${days} days ago`;
  return `${Math.floor(days / 30)} months ago`;
}

// Logged in more than a month ago reads amber — someone who may not be seeing
// their rota or messages.
const STALE_DAYS = 30;

function sortEmployees(employees: ListEmployee[], by: SortBy, direction: SortDirection) {
  const sign = direction === 'asc' ? 1 : -1;
  return [...employees].sort((a, b) => {
    if (by === 'login') {
      const da = daysSince(a.app);
      const db = daysSince(b.app);
      // Never logged in always goes last, whichever way it's sorted.
      if (da === null && db === null) return a.surname.localeCompare(b.surname);
      if (da === null) return 1;
      if (db === null) return -1;
      // Ascending = oldest login first (most days ago); descending = most recent first.
      return sign * (db - da) || a.surname.localeCompare(b.surname);
    }
    return sign * a.surname.localeCompare(b.surname);
  });
}

// ─── Filters ────────────────────────────────────────────────────────
// Status, role and notifications: any ticked value matches. App login: one
// window. Tags: any value within a group matches, every group with something
// ticked has to.
type LoginWindow = 'week' | 'stale' | 'never';
type NotificationState = 'on' | 'off';

interface Filters {
  statuses: EmployeeStatus[];
  roles: EmployeeRole[];
  login: LoginWindow | null;
  notifications: NotificationState[];
  /** `${group}::${value}` */
  tags: string[];
}

const NO_FILTERS: Filters = { statuses: [], roles: [], login: null, notifications: [], tags: [] };

// The list opens showing only Active employees (inactive ones and leavers are
// one tick away in the filter). "Clear all" goes to no filters at all, i.e.
// everyone.
const DEFAULT_FILTERS: Filters = { ...NO_FILTERS, statuses: ['active'] };

const STATUS_OPTIONS: { key: EmployeeStatus; label: string }[] = (['active', 'inactive', 'leaver'] as EmployeeStatus[])
  .map(key => ({ key, label: EMPLOYEE_STATUS_LABEL[key] }));
const ROLE_OPTIONS = EMPLOYEE_ROLES.map(r => ({ key: r, label: r }));
const NOTIFICATION_OPTIONS: { key: NotificationState; label: string }[] = [
  { key: 'on', label: 'Notifications on' },
  { key: 'off', label: 'Notifications off' },
];
const LOGIN_OPTIONS: { value: LoginWindow; label: string }[] = [
  { value: 'week', label: 'Logged in this week' },
  { value: 'stale', label: `Not for ${STALE_DAYS}+ days` },
  { value: 'never', label: 'Never logged in' },
];

function matchesFilters(e: ListEmployee, f: Filters) {
  if (f.statuses.length > 0 && !f.statuses.includes(e.status)) return false;
  if (f.roles.length > 0 && !f.roles.includes(e.role)) return false;
  if (f.login) {
    if (f.login === 'never' && e.app) return false;
    if (f.login === 'week' && !(e.app && e.app.daysAgo <= 7)) return false;
    if (f.login === 'stale' && !(e.app && e.app.daysAgo >= STALE_DAYS)) return false;
  }
  // Someone who's never logged in has no notification setting, so neither matches.
  if (f.notifications.length > 0) {
    if (!e.app) return false;
    const state: NotificationState = e.app.notificationsOn ? 'on' : 'off';
    if (!f.notifications.includes(state)) return false;
  }
  if (f.tags.length > 0) {
    const mine = new Set(e.chips.map(chip => `${chipGroup(chip)}::${chipValue(chip)}`));
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

const activeFilterCount = (f: Filters) =>
  f.statuses.length + f.roles.length + (f.login ? 1 : 0) + f.notifications.length + f.tags.length;

// Everything on a card that a search should be able to find.
function searchableText(e: ListEmployee) {
  return [
    e.fullName,
    e.role,
    EMPLOYEE_STATUS_LABEL[e.status],
    e.mobile ?? '',
    e.telephone ?? '',
    e.email ?? '',
    e.app ? `${e.app.platform} ${e.app.version} notifications ${e.app.notificationsOn ? 'on' : 'off'}` : 'no login information never logged in',
    ...e.chips.map(chip => (chip.type === 'region' ? chip.label : `${chip.key} ${chip.value}`)),
  ]
    .join(' ')
    .toLowerCase();
}

/** Every space-separated term has to match somewhere, in any order ("careworker polish"). */
function matchesQuery(e: ListEmployee, query: string) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = searchableText(e);
  return terms.every(t => haystack.includes(t));
}

// ─── The card ───────────────────────────────────────────────────────

function StatusBadge({ status }: { status: EmployeeStatus }) {
  const label = EMPLOYEE_STATUS_LABEL[status];
  if (status === 'active') {
    return (
      <span className={`${badge} flex-shrink-0`} style={{ backgroundColor: '#D4EBC3', color: '#2D5F1E', borderColor: '#AFDB98' }}>
        {label}
      </span>
    );
  }
  return <span className={`${badge} flex-shrink-0 bg-gray-100 text-gray-600 border-gray-300`}>{label}</span>;
}

/**
 * An icon with its meaning on hover or keyboard focus (and as its screen-reader
 * label). Focusable and lifted above the card's stretched link, so the tooltip
 * works from the keyboard and under the pointer.
 */
function IconTip({ label, className, children }: { label: string; className: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          role="img"
          aria-label={label}
          className={`relative z-10 inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50 ${className}`}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-white text-gray-900 border border-gray-200 shadow-lg"
        arrowClassName="bg-white fill-white"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * A bell with a small tick badge overlaid at its bottom-right — drawn by hand,
 * since there's no ready-made bell-with-tick in the icon set. The badge is a
 * green-outlined circle with a green tick on a solid white fill (matching the
 * card behind it), so the bell's strokes stop at the badge's edge instead of
 * showing through it; a thin white ring keeps the green outline from running
 * into the bell's lines. mr-1.5 keeps the badge, which hangs a little outside the
 * bell's box, clear of what follows.
 */
function BellOnIcon() {
  return (
    <span className="relative inline-flex mr-1.5" aria-hidden="true">
      <Bell className="w-4 h-4" />
      <span className="absolute -right-1.5 -bottom-0.5 w-3 h-3 rounded-full bg-white border-[1.5px] border-green-700 ring-1 ring-white flex items-center justify-center text-green-700">
        <Check className="w-[7px] h-[7px]" strokeWidth={4.5} />
      </span>
    </span>
  );
}

/**
 * An icon-only marker of whether the employee's app is up to date: a green tick
 * when it's the latest version, an amber up-arrow when an update is available.
 * Shape differs as well as colour (tick vs arrow), so it doesn't rely on colour
 * alone.
 */
function VersionIndicator({ latest }: { latest: boolean }) {
  return latest ? (
    <IconTip label="Using the latest version of the PASS app" className="text-green-700">
      <CircleCheck className="w-4 h-4" aria-hidden="true" />
    </IconTip>
  ) : (
    <IconTip label="Update available for the PASS app" className="text-amber-700">
      <CircleArrowUp className="w-4 h-4" aria-hidden="true" />
    </IconTip>
  );
}

/**
 * The card's reserved extra row: whether the employee has app notifications on
 * (left), and — right-aligned — when they last logged in to the PASS app and on
 * what. Everyone gets the row (people who've never logged in say so), so it
 * lines up across a row of cards. A login more than a month ago reads amber.
 *
 * Version status is an icon after the version (see VersionIndicator): a quiet
 * green tick when current, an amber up-arrow when an update is available — the
 * case a manager has to act on, so it's the one with a different colour and
 * shape. (It used to be a star shown only when current, so an out-of-date app
 * had no mark at all.)
 */
function AppActivity({ app }: { app?: EmployeeAppInfo | null }) {
  return (
    // Each span carries its own text-sm: a bare span with no text class renders
    // at 16px under the globals.css reset, even inside a text-sm parent.
    <div className="border-t border-gray-100 pt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      {/* Notifications on is the normal case, so it's just a bell with the words on
          hover. Off is the one worth noticing, so it keeps visible amber words. */}
      {app && (app.notificationsOn ? (
        <IconTip label="App notifications enabled" className="text-gray-700">
          <BellOnIcon />
        </IconTip>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-sm text-amber-800 font-medium" title="App notifications are off">
          <BellOff className="w-4 h-4" aria-hidden="true" />
          Notifications off
        </span>
      ))}
      {/* Right-aligned: ml-auto keeps it on the right even when it wraps onto its own line. */}
      <div className="ml-auto flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-right">
        {app ? (
          <>
            <span className={`text-sm ${app.daysAgo >= STALE_DAYS ? 'text-amber-800 font-medium' : 'text-gray-700'}`}>
              Last login {ago(app.daysAgo)} · {app.platform} {app.version}
            </span>
            <VersionIndicator latest={app.latest} />
          </>
        ) : (
          <span className="text-sm text-gray-600">No login information</span>
        )}
      </div>
    </div>
  );
}

// Role: a plain line of text under the name — no pill, no icon. Roles above a
// careworker read in purple, everything else in grey, so people with more
// responsibility still stand out down the list. It sits beside the avatar (which
// is taller than the name alone), so it costs the card no extra height; a long
// role name truncates on its own line. (It used to be a small badge on the end
// of the name, which crowded long names at narrow widths.)
const ABOVE_CAREWORKER = new Set<EmployeeRole>(['Supervisor', 'Care Coordinator', 'Manager', 'Super user']);

function RoleSubtitle({ role }: { role: EmployeeRole }) {
  return (
    <span
      className={`text-sm font-medium truncate ${ABOVE_CAREWORKER.has(role) ? 'text-purple-800' : 'text-gray-600'}`}
      title={role}
    >
      {role}
    </span>
  );
}

function EmployeeCard({ employee }: { employee: ListEmployee }) {
  return (
    <PersonCard
      name={employee.fullName}
      href={employee.href}
      photo={employee.photo}
      initials={employee.initials}
      avatarColor={employee.avatarColor}
      status={<StatusBadge status={employee.status} />}
      // The role sits under the name; employees have no other flags, so there's
      // no flags row at all.
      subtitle={<RoleSubtitle role={employee.role} />}
      details={[
        { label: 'Mobile', value: employee.mobile ?? 'Not provided' },
        { label: 'Telephone', value: employee.telephone ?? 'Not provided' },
        { label: 'Email', value: employee.email ?? 'Not provided' },
      ]}
      extraRow={<AppActivity app={employee.app} />}
      chips={employee.chips}
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
  const toggle = <K extends 'statuses' | 'roles' | 'notifications' | 'tags'>(field: K, value: Filters[K][number]) => {
    const current = filters[field] as string[];
    onChange({ ...filters, [field]: current.includes(value as string) ? current.filter(x => x !== value) : [...current, value] });
  };

  return (
    <div className="flex flex-col max-h-[min(80vh,720px)]">
      <div className="overflow-y-auto pr-1">
        <div className="flex gap-8">
          <CheckGroup legend="Status" options={STATUS_OPTIONS} selected={filters.statuses} onToggle={k => toggle('statuses', k)} />
          <CheckGroup legend="Role" options={ROLE_OPTIONS} selected={filters.roles} onToggle={k => toggle('roles', k)} />

          <div className="space-y-3">
            <fieldset>
              <legend className="text-sm font-semibold text-gray-900 mb-1">App login</legend>
              <div className="space-y-0.5">
                {LOGIN_OPTIONS.map(o => (
                  <label key={o.value} className="flex items-center gap-2.5 py-0.5 text-sm text-gray-900 cursor-pointer">
                    <input
                      type="radio"
                      name="employees-filter-login"
                      className={checkboxClass}
                      checked={filters.login === o.value}
                      onChange={() => onChange({ ...filters, login: o.value })}
                    />
                    {o.label}
                  </label>
                ))}
                {/* A radio can't be un-picked, so there's an explicit way back to "any". */}
                {filters.login && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, login: null })}
                    className="mt-1 text-sm font-medium text-[rgb(109,27,152)] hover:underline cursor-pointer"
                  >
                    Any login
                  </button>
                )}
              </div>
            </fieldset>
            <CheckGroup legend="Notifications" options={NOTIFICATION_OPTIONS} selected={filters.notifications} onToggle={k => toggle('notifications', k)} />
          </div>
        </div>

        <TagFilterSection tagGroups={tagGroups} selected={filters.tags} onToggle={k => toggle('tags', k)} />
      </div>

      <FilterFooter
        resultCount={resultCount}
        noun="employee"
        nounPlural="employees"
        canClear={activeFilterCount(filters) > 0}
        onClear={() => onChange(NO_FILTERS)}
      />
    </div>
  );
}

// ─── The page ───────────────────────────────────────────────────────

export function EmployeesListDummy({ colouredAreaTags = true }: { colouredAreaTags?: boolean }) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('surname');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  // Active employees only until the filter is changed.
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const tagGroups = useMemo(() => buildTagGroups(EMPLOYEES_LIST_DUMMY), []);
  const filtersCount = activeFilterCount(filters);
  const filtered = useMemo(
    () => sortEmployees(EMPLOYEES_LIST_DUMMY.filter(e => matchesFilters(e, filters) && matchesQuery(e, query)), sortBy, sortDirection),
    [query, filters, sortBy, sortDirection],
  );

  return (
    <PeopleListLayout
      title="Employees"
      addLabel="Add employee"
      noun="employee"
      nounPlural="employees"
      idPrefix="employees"
      searchPlaceholder="Search employees..."
      emptyHint="a name, role, phone number, email, area or app version"
      query={query}
      onQueryChange={setQuery}
      filtersCount={filtersCount}
      filterPanel={<FilterPanel filters={filters} onChange={setFilters} tagGroups={tagGroups} resultCount={filtered.length} />}
      onClearFilters={() => setFilters(NO_FILTERS)}
      sortPanel={
        <div className="flex gap-8">
          <SortGroup
            legend="Sort by"
            name="employees-sort-by"
            value={sortBy}
            onChange={v => setSortBy(v as SortBy)}
            options={[{ value: 'surname', label: 'Surname' }, { value: 'login', label: 'Last app login' }]}
          />
          <SortGroup
            legend="Sort direction"
            name="employees-sort-direction"
            value={sortDirection}
            onChange={v => setSortDirection(v as SortDirection)}
            // "Ascending" says little about a login time, so say which end comes first.
            options={sortBy === 'login'
              ? [{ value: 'asc', label: 'Oldest login first' }, { value: 'desc', label: 'Most recent first' }]
              : [{ value: 'asc', label: 'Ascending' }, { value: 'desc', label: 'Descending' }]}
          />
        </div>
      }
      sortDirection={sortDirection}
      sortIsDefault={sortBy === 'surname' && sortDirection === 'asc'}
      // Grouped under A–Z headings only when sorted by surname.
      groupedByLetter={sortBy === 'surname'}
      items={filtered}
      renderCard={e => <EmployeeCard employee={e} />}
      colouredAreaTags={colouredAreaTags}
    />
  );
}
