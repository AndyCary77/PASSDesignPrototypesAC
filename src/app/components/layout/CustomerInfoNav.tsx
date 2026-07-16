import { Heart, ChevronDown } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { useScrolled } from '../../hooks/useScrolled';
import { useCustomer } from '../../data/CustomerContext';

const inactiveTabClass =
  'px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap border-b-2 border-transparent hover:border-gray-300 transition-colors';

const activeTabClass =
  'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 bg-purple-50 text-[rgb(154,38,214)] border-[rgb(154,38,214)]';

function tabClass(pathname: string, path: string) {
  return pathname === path ? activeTabClass : inactiveTabClass;
}

// ─── Dropdown tab ──────────────────────────────────────────────────────────────

interface DropdownItem {
  label: string;
  to: string;
}

function DropdownTab({ label, items }: { label: string; items: DropdownItem[] }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isActive = items.some(item => pathname === item.to);

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <button className={`${isActive ? activeTabClass : inactiveTabClass} inline-flex items-center gap-1 cursor-pointer`}>
          {label}
          <ChevronDown className="w-3.5 h-3.5 opacity-80" />
        </button>
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          sideOffset={0}
          align="start"
          className="z-50 min-w-[160px] bg-white border border-gray-200 rounded-lg shadow-lg py-1 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2"
        >
          {items.map(item => {
            const itemActive = pathname === item.to;
            return (
              <DropdownMenuPrimitive.Item
                key={item.label}
                onSelect={() => navigate(item.to)}
                className={`flex items-center px-3 py-2 text-sm rounded mx-1 cursor-pointer outline-none select-none transition-colors ${
                  itemActive
                    ? 'bg-purple-50 text-[rgb(154,38,214)] font-medium'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.label}
              </DropdownMenuPrimitive.Item>
            );
          })}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status, label }: { status: string; label: string }) {
  if (status === 'active') {
    return (
      <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ backgroundColor: '#D4EBC3', color: '#2D5F1E' }}>
        {label}
      </span>
    );
  }
  // assessment stages / inactive — amber
  return (
    <span className="text-xs px-2 py-0.5 rounded font-semibold bg-amber-100 text-amber-700">
      {label}
    </span>
  );
}

// ─── Customer info nav ─────────────────────────────────────────────────────────

export function CustomerInfo({ withSlideOffset = false }: { withSlideOffset?: boolean }) {
  const { pathname } = useLocation();
  const scrolled = useScrolled();
  const customer = useCustomer();
  const base = `/customers/${customer.id}`;

  const contactBits = [
    customer.tel && { label: 'Tel', value: customer.tel },
    customer.mob && { label: 'Mob', value: customer.mob },
    { label: 'DOB', value: customer.dob },
    customer.nhs && { label: 'NHS', value: customer.nhs },
  ].filter(Boolean) as { label: string; value: string }[];

  const condensed = [
    customer.tel,
    customer.mob,
    `DOB: ${customer.dob}`,
    customer.addressOneLine,
  ].filter(Boolean).join('  ·  ');

  return (
    <div className={`bg-white border-b border-gray-200 transition-[margin] duration-300 ${scrolled && withSlideOffset ? '-mt-12' : 'mt-0'}`}>
      <div className="px-6">
        <div className={`flex gap-4 transition-all duration-300 ${scrolled ? 'py-1.5 items-center' : 'py-4 items-start'}`}>
          {/* Avatar */}
          {customer.photo ? (
            <div
              className={`rounded-full flex-shrink-0 bg-cover bg-center bg-gray-300 transition-all duration-300 ${scrolled ? 'h-9 w-9' : 'h-16 w-16'}`}
              style={{ backgroundImage: `url(${customer.photo})` }}
            />
          ) : (
            <div
              className={`rounded-full flex-shrink-0 flex items-center justify-center font-bold transition-all duration-300 ${customer.initialsColor} ${scrolled ? 'h-9 w-9 text-sm' : 'h-16 w-16 text-xl'}`}
            >
              {customer.initials}
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Name and Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-gray-900 font-semibold">{customer.fullName}</h2>
              {customer.dnacpr && (
                <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1">
                  <Heart size={12} fill="currentColor" />
                  <span>DNACPR</span>
                </span>
              )}
              {customer.highRisk && (
                <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded">
                  <span>HIGH RISK</span>
                </span>
              )}
              <StatusBadge status={customer.status} label={customer.statusLabel} />
            </div>

            {/* Full details — shown when not scrolled */}
            <div className={`transition-all duration-300 overflow-hidden ${scrolled ? 'max-h-0 opacity-0 mt-0' : 'max-h-32 opacity-100 mt-1'}`}>
              <div className="text-sm text-gray-600 flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                {contactBits.map((bit, i) => (
                  <span key={bit.label} className="flex items-center gap-3">
                    {i > 0 && <span className="text-gray-300">•</span>}
                    <span><span className="text-gray-500">{bit.label}:</span> <span className="text-gray-700">{bit.value}</span></span>
                  </span>
                ))}
              </div>
              <div className="text-gray-700 text-[16px]">
                {customer.addressOneLine}
              </div>
            </div>

            {/* Condensed single line — shown when scrolled */}
            <div className={`transition-all duration-300 overflow-hidden ${scrolled ? 'max-h-10 opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}>
              <p className="text-sm text-gray-600 truncate">{condensed}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-gray-200 -mx-6 px-6">
          <nav className="flex gap-1 overflow-x-auto">
            <a href="#" className={inactiveTabClass}>Dashboard</a>
            <Link to={`${base}/carebridge`} className={tabClass(pathname, `${base}/carebridge`)}>CareBridge</Link>
            <Link to={`${base}/caremanagement`} className={tabClass(pathname, `${base}/caremanagement`)}>Care Management</Link>
            <DropdownTab
              label="Care Records"
              items={[
                { label: 'Care Notes', to: `${base}/carenotes` },
                { label: 'MAR Chart', to: `${base}/marchart` },
                { label: 'Timeline', to: '#' },
              ]}
            />
            <Link to={`${base}/documents`} className={tabClass(pathname, `${base}/documents`)}>Documents</Link>
            <Link to={`${base}/aboutme`} className={tabClass(pathname, `${base}/aboutme`)}>About Me</Link>
            <Link to={`${base}/details`} className={tabClass(pathname, `${base}/details`)}>Details</Link>
            <a href="#" className={inactiveTabClass}>Checklists</a>
            <Link to={base} className={pathname === base ? activeTabClass : inactiveTabClass}>Rostering</Link>
            <a href="#" className={inactiveTabClass}>Communications</a>
            <a href="#" className={inactiveTabClass}>Medical History</a>
            <a href="#" className={inactiveTabClass}>Customer File</a>
          </nav>
        </div>
      </div>
    </div>
  );
}
