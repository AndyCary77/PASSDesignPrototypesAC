import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Check, ChevronDown, ChevronsUpDown, ChevronUp, Plus, Search, X } from 'lucide-react';
import { Button } from '../buttons/Button';
import { SegmentedControl } from '../buttons/SegmentedControl';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { badge } from '../customer/PeopleList';
import { StatusBadge as CustomerStatusBadge } from '../customer/CustomersListDummy';
import { STATUS_LABEL as CUSTOMER_STATUS_LABEL } from '../../data/customersListDummy';
import {
  ENQUIRIES,
  ENQUIRY_STATUS_LABEL,
  formatReceived,
  type Enquiry,
  type EnquiryStatus,
} from '../../data/enquiriesDummy';

const PAGE_SIZE = 20;
// How many page numbers show at once either side of the current one.
const PAGE_WINDOW = 2;

// Same pills as the status badges on the Customers/Employees lists. Closed is green: a
// closed enquiry is one that became a customer.
const STATUS_STYLE: Record<EnquiryStatus, { className?: string; style?: React.CSSProperties }> = {
  open: { className: 'bg-amber-100 text-amber-800 border-amber-300' },
  closed: { style: { backgroundColor: '#D4EBC3', color: '#2D5F1E', borderColor: '#AFDB98' } },
};

// A closed enquiry also shows the customer it became, and that customer's status
// (as on the Customers list), beside the Closed badge.
function StatusBadge({ enquiry }: { enquiry: Enquiry }) {
  const { className = '', style } = STATUS_STYLE[enquiry.status];
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span className={`${badge} ${className}`} style={style}>
        {/* A tick on Closed: it closed because it became a customer. */}
        {enquiry.status === 'closed' && <Check className="w-4 h-4" aria-hidden="true" />}
        {ENQUIRY_STATUS_LABEL[enquiry.status]}
      </span>
      {enquiry.customerStatus && <CustomerStatusBadge status={enquiry.customerStatus} />}
    </div>
  );
}

// The enquirer's name as a link to their enquiry form, underlined on hover.
function EnquiryLink({ id, name }: { id: string; name: string }) {
  return (
    <Link
      to={`/enquiries/${id}`}
      className="font-semibold text-gray-900 hover:underline focus-visible:underline outline-none focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50 rounded-sm"
    >
      {name}
    </Link>
  );
}

// Which page numbers to show: a window around the current page, so a long list doesn't
// produce a long row of buttons.
function pageNumbers(current: number, total: number) {
  const start = Math.max(1, Math.min(current - PAGE_WINDOW, total - PAGE_WINDOW * 2));
  const end = Math.min(total, start + PAGE_WINDOW * 2);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function matchesQuery(e: Enquiry, query: string) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = [e.name, e.dob ?? '', e.address, e.tel ?? '', formatReceived(e.received), ENQUIRY_STATUS_LABEL[e.status], e.customerStatus ? CUSTOMER_STATUS_LABEL[e.customerStatus] : '']
    .join(' ')
    .toLowerCase();
  return terms.every(t => haystack.includes(t));
}

type StatusFilter = EnquiryStatus | 'all';

type SortKey = 'name' | 'dob' | 'address' | 'tel' | 'received' | 'status';
type SortDirection = 'asc' | 'desc';

// Names sort by surname (the last word), as the lists elsewhere do.
const surnameOf = (name: string) => name.trim().split(/\s+/).pop() ?? name;
const dobTime = (dob?: string) => {
  if (!dob) return null;
  const [d, m, y] = dob.split('/').map(Number);
  return new Date(y, m - 1, d).getTime();
};

// Empty values (no DOB, no phone) always go last, whichever way it's sorted.
function compare(a: Enquiry, b: Enquiry, key: SortKey): number | null {
  switch (key) {
    case 'name': return surnameOf(a.name).localeCompare(surnameOf(b.name)) || a.name.localeCompare(b.name);
    case 'address': return a.address.localeCompare(b.address, undefined, { numeric: true });
    case 'received': return a.received.getTime() - b.received.getTime();
    case 'status': return ENQUIRY_STATUS_LABEL[a.status].localeCompare(ENQUIRY_STATUS_LABEL[b.status]);
    case 'dob': {
      const x = dobTime(a.dob), y = dobTime(b.dob);
      return x === null || y === null ? (x === y ? 0 : null) : x - y;
    }
    case 'tel': return !a.tel || !b.tel ? (a.tel === b.tel ? 0 : null) : a.tel.localeCompare(b.tel);
  }
}

function sortEnquiries(list: Enquiry[], key: SortKey, direction: SortDirection) {
  const sign = direction === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    const c = compare(a, b, key);
    if (c === null) return (key === 'dob' ? (dobTime(a.dob) === null ? 1 : -1) : !a.tel ? 1 : -1);
    // Ties fall back to newest first.
    return sign * c || b.received.getTime() - a.received.getTime();
  });
}

// A column heading you can click to sort by. It's the global Button, flattened to look like
// heading text: the chevron shows the direction once it's the sorted column, and a faint
// up/down pair marks the others as sortable.
function SortHeading({ label, column, sort, onSort }: {
  label: string; column: SortKey; sort: { key: SortKey; direction: SortDirection }; onSort: (key: SortKey) => void;
}) {
  const active = sort.key === column;
  const Icon = !active ? ChevronsUpDown : sort.direction === 'asc' ? ChevronUp : ChevronDown;
  return (
    <Button
      variant="tertiary"
      size="sm"
      onClick={() => onSort(column)}
      className={`-ml-3 !h-8 !px-3 !bg-transparent hover:!bg-gray-200/70 !text-sm !font-semibold ${active ? '!text-[rgb(109,27,152)]' : '!text-gray-700'}`}
    >
      {label}
      <Icon className={`w-4 h-4 ${active ? '' : 'text-gray-500'}`} aria-hidden="true" />
    </Button>
  );
}

const HEAD = 'h-auto px-4 py-3 text-sm font-semibold text-gray-700';
const CELL = 'align-top whitespace-normal px-4 py-3 text-body text-gray-900';

export function EnquiriesPage() {
  const [query, setQuery] = useState('');
  // Opens on Open enquiries, as the production list does.
  const [status, setStatus] = useState<StatusFilter>('open');
  const [page, setPage] = useState(1);
  // Newest first, as the production list opens.
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'received', direction: 'desc' });
  const navigate = useNavigate();

  const rows = useMemo(
    () => sortEnquiries(ENQUIRIES.filter(e => (status === 'all' || e.status === status) && matchesQuery(e, query)), sort.key, sort.direction),
    [query, status, sort],
  );

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const first = (current - 1) * PAGE_SIZE;
  const visible = rows.slice(first, first + PAGE_SIZE);

  // Any change to what's listed goes back to page one.
  const changeQuery = (v: string) => { setQuery(v); setPage(1); };
  const changeStatus = (v: StatusFilter) => { setStatus(v); setPage(1); };
  const ariaSort = (key: SortKey) => (sort.key === key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none') as 'ascending' | 'descending' | 'none';
  // Clicking the sorted column flips it; a new column starts A–Z (the time stamp starts newest first).
  const changeSort = (key: SortKey) => {
    setSort(s => (s.key === key ? { key, direction: s.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: key === 'received' ? 'desc' : 'asc' }));
    setPage(1);
  };

  return (
    // 1280px, as on Bookings and the Customer and Employee details pages.
    <div className="max-w-[1280px] w-full mx-auto space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl leading-none font-semibold text-gray-900">Enquiries</h1>
        {/* Not wired — this is a static list. */}
        <Button variant="primary" icon={<Plus className="w-4 h-4" />}>Add enquiry</Button>
      </div>

      <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
        {/* Docked to the top of the table, full width — the same bar as Bookings. */}
        <div className="flex items-center gap-3 p-3 border-b border-gray-200">
          <SegmentedControl
            value={status}
            onChange={changeStatus}
            ariaLabel="Enquiry status"
            options={[{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }, { value: 'all', label: 'All' }]}
          />
          <div role="search" className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={e => changeQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') changeQuery(''); }}
              placeholder="Search enquiries..."
              aria-label="Search enquiries"
              className="w-full pl-9 pr-40 py-2 bg-white border border-gray-200 rounded-lg text-body text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[rgb(154,38,214)] focus:ring-1 focus:ring-[rgb(154,38,214)]"
            />
            {/* Clear button and result count sit inside the input, on the right. */}
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {query && (
                <Button
                  variant="tertiary"
                  iconOnly
                  size="sm"
                  aria-label="Clear search"
                  onClick={() => changeQuery('')}
                  className="!h-7 !w-7"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              <span aria-live="polite" className={`${badge} bg-gray-100 text-gray-700 border-gray-300 whitespace-nowrap`}>
                {rows.length} {rows.length === 1 ? 'result' : 'results'}
              </span>
            </div>
          </div>
        </div>

        <Table className="table-fixed min-w-[1180px]">
          <TableHeader>
            <TableRow className="hover:bg-[#f6f7f9] border-gray-200 bg-[#f6f7f9]">
              <TableHead aria-sort={ariaSort('name')} className={`${HEAD} w-[190px]`}><SortHeading label="Name" column="name" sort={sort} onSort={changeSort} /></TableHead>
              <TableHead aria-sort={ariaSort('dob')} className={`${HEAD} w-[110px]`}><SortHeading label="DOB" column="dob" sort={sort} onSort={changeSort} /></TableHead>
              <TableHead aria-sort={ariaSort('address')} className={HEAD}><SortHeading label="Address" column="address" sort={sort} onSort={changeSort} /></TableHead>
              <TableHead aria-sort={ariaSort('tel')} className={`${HEAD} w-[190px]`}><SortHeading label="Tel/Mobile" column="tel" sort={sort} onSort={changeSort} /></TableHead>
              <TableHead aria-sort={ariaSort('received')} className={`${HEAD} w-[150px]`}><SortHeading label="Time stamp" column="received" sort={sort} onSort={changeSort} /></TableHead>
              <TableHead aria-sort={ariaSort('status')} className={`${HEAD} w-[310px]`}><SortHeading label="Status" column="status" sort={sort} onSort={changeSort} /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map(e => (
              // Plain white rows; the row under the pointer picks up a light purple tint. The whole
              // row opens the enquiry (the name is the keyboard-focusable link).
              <TableRow
                key={e.id}
                className="bg-white hover:bg-purple-50 border-gray-200 cursor-pointer"
                onClick={ev => { if (!(ev.target as HTMLElement).closest('a')) navigate(`/enquiries/${e.id}`); }}
              >
                <TableCell className={CELL}><EnquiryLink id={e.id} name={e.name} /></TableCell>
                <TableCell className={CELL}>{e.dob}</TableCell>
                <TableCell className={CELL}>{e.address}</TableCell>
                <TableCell className={CELL}>{e.tel}</TableCell>
                <TableCell className={CELL}>{formatReceived(e.received)}</TableCell>
                <TableCell className={CELL}><StatusBadge enquiry={e} /></TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-12 text-center whitespace-normal">
                  <p className="text-base font-semibold text-gray-900">
                    No enquiries match{query.trim() && <> “{query.trim()}”</>}
                  </p>
                  <div className="mt-3 flex justify-center gap-3">
                    {query && <Button variant="tertiary" onClick={() => changeQuery('')}>Clear search</Button>}
                    {status !== 'all' && <Button variant="tertiary" onClick={() => changeStatus('all')}>Show all statuses</Button>}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Docked to the bottom of the table. */}
        {rows.length > 0 && (
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 p-3 border-t border-gray-200">
            <span aria-live="polite" className="text-body text-gray-600">
              Showing {first + 1}–{first + visible.length} of {rows.length}
            </span>
            <nav aria-label="Pagination" className="flex items-center gap-1.5">
              <Button variant="tertiary" size="sm" disabled={current === 1} onClick={() => setPage(1)}>First</Button>
              {pageNumbers(current, pageCount).map(n => (
                <Button
                  key={n}
                  variant={n === current ? 'primary' : 'tertiary'}
                  size="sm"
                  iconOnly
                  aria-label={`Page ${n}`}
                  aria-current={n === current ? 'page' : undefined}
                  onClick={() => setPage(n)}
                >
                  {n}
                </Button>
              ))}
              <Button variant="tertiary" size="sm" disabled={current === pageCount} onClick={() => setPage(pageCount)}>Last</Button>
            </nav>
            {/* Empty third column keeps the pagination centred. */}
            <span aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}
