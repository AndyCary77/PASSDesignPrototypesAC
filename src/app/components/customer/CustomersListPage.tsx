import { Link } from 'react-router';
import { Search, SlidersHorizontal, ArrowUpDown, Heart, Plus } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { Button } from '../buttons/Button';
import { CUSTOMER_LIST, type CustomerProfile } from '../../data/customers';

function reviewBadgeStyle(daysLeft: number): React.CSSProperties {
  if (daysLeft <= 0) return { backgroundColor: '#fee2e2', color: '#991b1b' };
  return { backgroundColor: '#f3f4f6', color: '#6b7280' };
}

function reviewTooltipText(daysLeft: number, reviewDate: string) {
  if (daysLeft <= 0) return `Care plan review overdue — was due ${reviewDate}`;
  if (daysLeft <= 28) return `Care plan review due in ${daysLeft} days — ${reviewDate}`;
  return `Care plan review — ${reviewDate}`;
}

function StatusBadge({ customer }: { customer: CustomerProfile }) {
  if (customer.status === 'active') {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded uppercase" style={{ backgroundColor: '#D4EBC3', color: '#2D5F1E' }}>
        Active
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded uppercase bg-amber-100 text-amber-700">
      {customer.statusLabel}
    </span>
  );
}

function CustomerCard({ customer }: { customer: CustomerProfile }) {
  return (
    <Link
      to={`/customers/${customer.id}/${customer.landingTab}`}
      className="bg-white rounded-[10px] border border-gray-200 overflow-hidden shadow-sm hover:border-purple-300 hover:shadow-md transition-all block group"
    >
      {/* Header */}
      <div className="flex items-center px-5 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-base font-semibold text-gray-900 truncate">{customer.fullName}</span>
          {customer.highRisk && (
            <span className="flex-shrink-0 bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wide">
              High Risk
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {customer.reviewDate && customer.reviewDaysLeft !== undefined && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs font-semibold px-2 py-0.5 rounded cursor-default" style={reviewBadgeStyle(customer.reviewDaysLeft)}>
                  {customer.reviewDate}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                {reviewTooltipText(customer.reviewDaysLeft, customer.reviewDate)}
              </TooltipContent>
            </Tooltip>
          )}
          <StatusBadge customer={customer} />
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {customer.photo ? (
            <img
              src={customer.photo}
              alt={customer.fullName}
              className="w-20 h-20 rounded-full object-cover object-top bg-gray-100"
            />
          ) : (
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold ${customer.initialsColor}`}>
              {customer.initials}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          {/* Address + legal badges row */}
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm text-gray-700 leading-relaxed">
              {customer.addressLines.map(line => <p key={line}>{line}</p>)}
              {customer.suburb && <p>{customer.suburb}</p>}
              <p className="font-medium text-gray-900">{customer.postcode}</p>
            </div>
            {(customer.dnacpr || customer.dols) && (
              <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                {customer.dnacpr && (
                  <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded">
                    <Heart size={10} fill="currentColor" />
                    DNACPR
                  </span>
                )}
                {customer.dols && (
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded">
                    DoLS
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mt-1.5 space-y-0.5">
            {customer.tel && (
              <p className="text-sm text-gray-600">
                <span className="text-gray-500">Tel:</span> {customer.tel}
              </p>
            )}
            <p className="text-sm text-gray-600">
              <span className="text-gray-500">DOB:</span> {customer.dob}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CustomersListPage() {
  return (
    <div className="space-y-5">

      {/* Action bar */}
      <div className="-mx-6 -mt-6 px-6 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Customers</h1>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />}>Add Customer</Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search customers..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[rgb(154,38,214)] focus:ring-1 focus:ring-[rgb(154,38,214)]"
          />
        </div>
        <span className="text-sm text-gray-500 whitespace-nowrap">{CUSTOMER_LIST.length} results</span>
        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
          <SlidersHorizontal className="w-4 h-4" />
          Filter
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
          <ArrowUpDown className="w-4 h-4" />
          Sort
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {CUSTOMER_LIST.map(customer => (
          <CustomerCard key={customer.id} customer={customer} />
        ))}
      </div>
    </div>
  );
}
