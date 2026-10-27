import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, CircleAlert, CircleCheck, CirclePlay, Clock, Download, Rows2, Rows4, Search, SlidersHorizontal, Upload, User, Users, X } from 'lucide-react';
import { Button } from '../buttons/Button';
import { SegmentedToggle } from '../buttons/SegmentedToggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { FilterFooter, TagFilterSection } from '../customer/PeopleList';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  BOOKING_STATUS_LABEL,
  ALL_CUSTOMERS,
  CUSTOMER_BOOKINGS,
  carerHref,
  TAG_GROUPS,
  TAG_GROUPS_OPEN,
  WEEK_LABEL,
  TODAY_LABEL,
  NOW,
  WEEK_START,
  type Booking,
  type CustomerBookings,
  type BookingStatus,
} from '../../data/bookingsDummy';

// The white tooltip variant already used on the Customers/Employees lists and Care Management.
const LIGHT_TOOLTIP = {
  className: 'bg-white text-gray-900 border border-gray-200 shadow-lg',
  arrowClassName: 'bg-white fill-white',
} as const;

// Card look matches the visit cards on the daily schedule timeline (ScheduleTimeline's
// VisitCardEl): rounded, hairline border, soft shadow and a thick status-coloured left
// edge. Text stays at 14px (text-sm) — hierarchy comes from weight and colour instead.
const STATUS_STYLE: Record<BookingStatus, { bg: string; edge: string; label: string }> = {
  scheduled: { bg: 'bg-white', edge: 'rgb(170,118,200)', label: 'text-gray-600' },
  'in-progress': { bg: 'bg-green-50', edge: '#16a34a', label: 'text-green-800' },
  completed: { bg: 'bg-white', edge: '#cbd5e1', label: 'text-gray-600' },
  missed: { bg: 'bg-red-50', edge: '#dc2626', label: 'text-red-800' },
};

// Compact cards show the status as a small icon in front of the employee's name.
const STATUS_ICON: Record<BookingStatus, { Icon: typeof Clock; color: string }> = {
  scheduled: { Icon: Clock, color: 'text-gray-600' },
  'in-progress': { Icon: CirclePlay, color: 'text-green-700' },
  completed: { Icon: CircleCheck, color: 'text-gray-600' },
  missed: { Icon: CircleAlert, color: 'text-red-700' },
};

const ordinal = (n: number) => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`;
};

const DAYS = Array.from({ length: 7 }, (_, i) => {
  const date = new Date(WEEK_START);
  date.setDate(WEEK_START.getDate() + i);
  return {
    weekday: date.toLocaleString('en-GB', { weekday: 'short' }),
    day: ordinal(date.getDate()),
    isToday: date.toDateString() === new Date().toDateString(),
  };
});

function PeopleBadge({ carers, className }: { carers: number; className: string }) {
  return (
    <span
      className={`w-5 h-5 rounded-full flex items-center justify-center ${className}`}
      style={{ backgroundColor: 'rgb(230,227,240)', border: '1px solid rgb(191,186,207)' }}
      title={`${carers} carers`}
    >
      <Users className="w-3 h-3 text-gray-700" aria-hidden="true" />
      <span className="sr-only">{carers} carers</span>
    </span>
  );
}

// A carer's name as a link: the purple used for today's column heading, underlined on
// hover. Like the Employees list, only carers with a profile page go anywhere.
function CarerLink({ name }: { name: string }) {
  const href = carerHref(name);
  const className =
    'text-[rgb(109,27,152)] hover:underline focus-visible:underline outline-none focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50 rounded-sm';
  return href ? (
    <Link to={href} className={className}>{name}</Link>
  ) : (
    <a href="#" onClick={e => e.preventDefault()} className={className}>{name}</a>
  );
}

function BookingCard({ booking, compact }: { booking: Booking; compact: boolean }) {
  const s = STATUS_STYLE[booking.status];
  const statusLabel = BOOKING_STATUS_LABEL[booking.status];
  const time = `${booking.start}–${booking.end}`;
  // A double-up lists every carer on their own row and carries the people badge, so the
  // badge and the extra rows always go together.
  const names = [booking.employee, ...(booking.alsoCarers ?? [])];
  const showBadge = names.length > 1;

  if (compact) {
    const { Icon, color } = STATUS_ICON[booking.status];
    // Two tight lines, no status line (about half the standard height). The status is
    // the icon before the name (as well as the edge colour), so it never relies on colour
    // alone; it's also in the hover text and read out by screen readers.
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`relative rounded-[7px] border border-gray-200 border-l-[5px] shadow-sm px-1.5 py-px ${s.bg}`}
            style={{ borderLeftColor: s.edge }}
          >
            <div className="text-xs font-semibold text-gray-900 leading-[1.15]">{time}</div>
            {names.map((name, i) => (
              <div key={name} className="flex items-center gap-1 text-sm font-medium leading-[1.15]">
                {/* Status icon on the first carer only; the rest line up under it. */}
                {i === 0
                  ? <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} aria-hidden="true" />
                  : <span className="w-3.5 shrink-0" aria-hidden="true" />}
                <span className="truncate"><CarerLink name={name} /></span>
              </div>
            ))}
            <span className="sr-only">{statusLabel}</span>
            {/* On the time line, which has room, so names aren't shortened. */}
            {showBadge && <PeopleBadge carers={names.length} className="absolute top-0.5 right-1.5 !w-4 !h-4" />}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" {...LIGHT_TOOLTIP}>{names.join(' & ')} · {time} · {statusLabel}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div
      className={`relative rounded-[7px] border border-gray-200 border-l-[5px] shadow-sm px-2 py-1.5 ${s.bg}`}
      style={{ borderLeftColor: s.edge }}
    >
      {/* Employee name stays at 14px; time and status are the secondary lines, so 12px. */}
      <div className="text-xs font-semibold text-gray-900 leading-snug">{time}</div>
      {names.map(name => (
        <div key={name} className="text-sm font-medium leading-snug"><CarerLink name={name} /></div>
      ))}
      <div className={`text-xs leading-snug pr-6 ${s.label}`}>{statusLabel}</div>
      {showBadge && <PeopleBadge carers={names.length} className="absolute bottom-1.5 right-1.5" />}
    </div>
  );
}

// The customer's name as a link: same colour as before, a person icon in front, underline
// on hover. Like the Customers list, only customers with a profile page go anywhere.
function CustomerLink({ name, href, faded }: { name: string; href?: string; faded?: boolean }) {
  // Faded (gray-500, the lightest grey that still passes AA contrast) for customers with nothing booked.
  const className =
    `group inline-flex items-start gap-1.5 text-sm font-semibold ${faded ? 'text-gray-500' : 'text-gray-900'} hover:underline focus-visible:underline outline-none focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50 rounded-sm`;
  const content = (
    <>
      <User className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      <span>{name}</span>
    </>
  );
  return href ? (
    <Link to={href} className={className}>{content}</Link>
  ) : (
    <a href="#" onClick={e => e.preventDefault()} className={className}>{content}</a>
  );
}

// ─── Today ────────────────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const pad = (h: number) => String(h).padStart(2, '0');

type TodayItem = { booking: Booking; customer: CustomerBookings };

// The day laid out hour by hour: an hour pill on the left, that hour's bookings as wide cards
// (when and what, the customer, then the carer(s)), and a line marking the current time.
function TodayBookings({ rows }: { rows: CustomerBookings[] }) {
  const byHour = useMemo(() => {
    const items: TodayItem[] = rows
      .flatMap(customer => customer.bookings.filter(b => b.day === 0).map(booking => ({ booking, customer })))
      .sort((a, b) => a.booking.start.localeCompare(b.booking.start) || a.customer.surname.localeCompare(b.customer.surname));
    const map = new Map<number, TodayItem[]>();
    items.forEach(it => {
      const h = parseInt(it.booking.start, 10);
      map.set(h, [...(map.get(h) ?? []), it]);
    });
    return map;
  }, [rows]);

  const nowHour = parseInt(NOW, 10);

  return (
    <div className="px-4 pb-4">
      <h2 className="text-base font-semibold text-gray-900 text-center py-4">Today&rsquo;s bookings</h2>
      <div className="border-t border-gray-200">
        {HOURS.map(h => {
          const items = byHour.get(h) ?? [];
          // The "now" line goes before the first booking that starts after it.
          const nowAt = h === nowHour ? items.findIndex(it => it.booking.start > NOW) : -2;
          const nowIndex = nowAt === -1 ? items.length : nowAt;
          return (
            <div key={h} className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 py-2 border-b border-gray-200">
              <div>
                <span className="inline-flex justify-center w-[76px] py-1 rounded-full bg-[rgb(109,27,152)] text-white text-sm font-semibold">
                  {pad(h)}:00
                </span>
              </div>
              <div className="space-y-1.5 min-w-0">
                {items.map((it, i) => (
                  <div key={`${it.booking.start}-${it.customer.id}-${it.booking.employee}`} className="space-y-1.5">
                    {h === nowHour && nowIndex === i && <NowLine />}
                    <TodayRow {...it} />
                  </div>
                ))}
                {h === nowHour && nowIndex >= items.length && <NowLine />}
              </div>
            </div>
          );
        })}
      </div>
      {byHour.size === 0 && (
        <p className="text-base font-semibold text-gray-900 text-center py-10">No bookings today match</p>
      )}
    </div>
  );
}

function NowLine() {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-[rgb(109,27,152)]" role="separator" aria-label={`Now, ${NOW}`}>
      <span>{NOW}</span>
      <span className="flex-1 h-px bg-[rgb(109,27,152)]" aria-hidden="true" />
    </div>
  );
}

function TodayRow({ booking, customer }: TodayItem) {
  const s = STATUS_STYLE[booking.status];
  const names = [booking.employee, ...(booking.alsoCarers ?? [])];
  return (
    <div
      className={`relative grid grid-cols-[140px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-4 rounded-[7px] border border-gray-200 border-l-[5px] shadow-sm pl-3 pr-10 py-1.5 ${s.bg}`}
      style={{ borderLeftColor: s.edge }}
    >
      <div>
        <div className="text-xs font-semibold text-gray-900 leading-snug">{booking.start}–{booking.end}</div>
        <div className={`text-xs leading-snug ${s.label}`}>{BOOKING_STATUS_LABEL[booking.status]}</div>
      </div>
      <div><CustomerLink name={customer.name} href={customer.href} /></div>
      <div className="flex items-start gap-2 text-sm font-medium">
        <ArrowLeft className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" aria-hidden="true" />
        <div>
          {names.map(name => <div key={name} className="leading-snug"><CarerLink name={name} /></div>)}
        </div>
      </div>
      {names.length > 1 && <PeopleBadge carers={names.length} className="absolute right-3 top-1/2 -translate-y-1/2" />}
    </div>
  );
}

export function BookingsPage() {
  const [query, setQuery] = useState('');
  // The two toggles and the week arrows are shown but not wired — this is a static week.
  const [weekView, setWeekView] = useState(true);
  const [bookedOnly, setBookedOnly] = useState(true);
  const [standardView, setStandardView] = useState(true);
  const compact = !standardView;

  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const toggleTag = (key: string) =>
    setTagFilters(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Any value within a group matches; every group with a selection must.
    const selectedByGroup = new Map<string, string[]>();
    tagFilters.forEach(k => {
      const [group] = k.split('::');
      selectedByGroup.set(group, [...(selectedByGroup.get(group) ?? []), k]);
    });
    // "All" adds the customers with nothing booked this week, as empty rows.
    return (bookedOnly ? CUSTOMER_BOOKINGS : ALL_CUSTOMERS).filter(c =>
      (!q || c.name.toLowerCase().includes(q)) &&
      [...selectedByGroup.values()].every(keys => keys.some(k => c.tags.includes(k))),
    );
  }, [query, tagFilters, bookedOnly]);

  return (
    // 1280px — the same cap as the Customer and Employee details pages. The MAR chart
    // has no cap of its own (it fills the 1600px page shell), which is too loose for a
    // seven-column grid: cards would stretch wider than their content needs.
    <div className="max-w-[1280px] w-full mx-auto space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl leading-none font-semibold text-gray-900">Bookings</h1>
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" icon={<Upload className="w-4 h-4" />} aria-label="Import bookings">Import</Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" {...LIGHT_TOOLTIP}>Import bookings</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" icon={<Download className="w-4 h-4" />} aria-label="Export bookings">Export</Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" {...LIGHT_TOOLTIP}>Export bookings</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="justify-self-start">
            <SegmentedToggle variant="track" neutral value={weekView} onChange={setWeekView} onLabel="Week" offLabel="Today" ariaLabel="Date range" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="tertiary" iconOnly aria-label="Previous week"><ChevronLeft className="w-4 h-4" /></Button>
            <span className="inline-flex items-center gap-2 text-body font-semibold text-gray-900 px-2">
              <Calendar className="w-4 h-4 text-gray-600" aria-hidden="true" />
              {weekView ? WEEK_LABEL : TODAY_LABEL}
            </span>
            <Button variant="tertiary" iconOnly aria-label="Next week"><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <div className="justify-self-end">
            <SegmentedToggle variant="track" neutral value={bookedOnly} onChange={setBookedOnly} onLabel="Booked only" offLabel="All" ariaLabel="Customers shown" />
          </div>
        </div>

      </div>

      <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
        {/* Docked to the top of the table, full width. */}
        <div className="flex items-center gap-3 p-3 border-b border-gray-200">
          <div role="search" className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') setQuery(''); }}
              placeholder="Search customers..."
              aria-label="Search customers"
              className="w-full pl-9 pr-9 py-2 bg-white border border-gray-200 rounded-lg text-body text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[rgb(154,38,214)] focus:ring-1 focus:ring-[rgb(154,38,214)]"
            />
            {query && (
              <Button
                variant="tertiary"
                iconOnly
                size="sm"
                aria-label="Clear search"
                onClick={() => setQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 !h-7 !w-7"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="tertiary"
                iconOnly
                className="relative"
                aria-label={tagFilters.length > 0 ? `Filter (${tagFilters.length} applied)` : 'Filter'}
              >
                <SlidersHorizontal className="w-4 h-4" />
                {/* Purple dot while any filter is applied. */}
                {tagFilters.length > 0 && <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[rgb(154,38,214)] border-2 border-white" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[min(560px,calc(100vw-3rem))] max-h-[70vh] overflow-y-auto p-4">
              <TagFilterSection tagGroups={TAG_GROUPS} selected={tagFilters} onToggle={toggleTag} display="pills" defaultOpen={TAG_GROUPS_OPEN} />
              <FilterFooter
                resultCount={rows.length}
                noun="customer"
                nounPlural="customers"
                canClear={tagFilters.length > 0}
                onClear={() => setTagFilters([])}
              />
            </PopoverContent>
          </Popover>
          {/* Row density only applies to the week grid. */}
          {weekView && (<SegmentedToggle variant="track" neutral value={standardView} onChange={setStandardView} onLabel={<Rows2 className="w-4 h-4" aria-hidden="true" />} offLabel={<Rows4 className="w-4 h-4" aria-hidden="true" />} onTooltip="Standard view" offTooltip="Compact view" ariaLabel="Row density" />)}
        </div>
        {weekView ? (
        <Table className="table-fixed min-w-[1100px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-gray-200 bg-white">
              <TableHead className="w-[150px] h-auto px-4 py-3 text-sm font-semibold text-gray-700">Customer</TableHead>
              {DAYS.map(d => (
                <TableHead
                  key={d.weekday + d.day}
                  className={`h-auto px-2.5 py-3 text-center border-l border-gray-300 text-sm font-semibold ${d.isToday ? 'text-[rgb(109,27,152)]' : 'text-gray-700'}`}
                >
                  {d.weekday} {d.day}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(customer => (
              // Alternating rows in grey (not purple-tinted).
              <TableRow key={customer.id} className="odd:bg-white even:bg-[#f6f7f9] odd:hover:bg-white even:hover:bg-[#f6f7f9] border-gray-200">
                <TableCell className="align-top px-4 py-3 whitespace-normal">
                  <CustomerLink name={customer.name} href={customer.href} faded={customer.bookings.length === 0} />
                  {/* pl-[22px] = the person icon (16px) + its gap (6px), so this lines up under the name. */}
                  <div className={`text-sm pl-[22px] ${customer.bookings.length === 0 ? 'text-gray-500' : 'text-gray-600'}`}>
                    {customer.bookings.length} {customer.bookings.length === 1 ? 'booking' : 'bookings'}
                  </div>
                </TableCell>
                {DAYS.map((d, dayIndex) => (
                  <TableCell key={d.weekday + d.day} className={`align-top whitespace-normal border-l border-gray-300 ${compact ? 'p-1' : 'p-1.5'}`}>
                    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
                      {customer.bookings
                        .filter(booking => booking.day === dayIndex)
                        .sort((x, y) => x.start.localeCompare(y.start))
                        .map(booking => <BookingCard key={`${booking.start}-${booking.employee}`} booking={booking} compact={compact} />)}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="py-12 text-center whitespace-normal">
                  <p className="text-base font-semibold text-gray-900">
                    No customers match{query.trim() && <> “{query.trim()}”</>}{tagFilters.length > 0 && ' with these filters'}
                  </p>
                  <div className="mt-3 flex justify-center gap-3">
                    {query && <Button variant="tertiary" onClick={() => setQuery('')}>Clear search</Button>}
                    {tagFilters.length > 0 && <Button variant="tertiary" onClick={() => setTagFilters([])}>Clear filters</Button>}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        ) : (
          <TodayBookings rows={rows} />
        )}
      </div>
    </div>
  );
}
