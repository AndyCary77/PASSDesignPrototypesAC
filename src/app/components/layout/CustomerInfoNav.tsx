import { useMemo } from 'react';
import { Heart, ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { useScrolled } from '../../hooks/useScrolled';
import { useOverflowNav } from '../../hooks/useOverflowNav';
import { useCustomer } from '../../data/CustomerContext';
import { useFeatureFlag } from '../../data/FeatureFlagsContext';

const inactiveTabClass =
  'px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap border-b-2 border-transparent hover:border-gray-300 transition-colors';

const activeTabClass =
  'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 bg-purple-50 text-[rgb(154,38,214)] border-[rgb(154,38,214)]';

function tabClass(pathname: string, path: string) {
  // Match sub-routes too (e.g. Documents' click-throughs at /documents/care-plan
  // and /documents/recording/:id) so the tab stays highlighted there, not just
  // on the tab's own exact path.
  const active = pathname === path || pathname.startsWith(`${path}/`);
  return active ? activeTabClass : inactiveTabClass;
}

// ─── Nav item model ────────────────────────────────────────────────────────────
//
// The tab bar used to be one flat block of hand-written JSX with
// `overflow-x-auto` for whatever didn't fit — fine on a wide screen, but on
// a narrower one it just meant scrolling a barely-discoverable strip of
// tabs sideways to find e.g. "Medical History". Modelling the tabs as data
// is what makes progressive collapse into a "More" menu possible: the same
// list gets rendered three ways (as real visible tabs, as an invisible
// measuring row, and as menu entries once collapsed) — see
// `useOverflowNav` for the measuring mechanics.

interface DropdownItem {
  label: string;
  to: string;
}

type NavItem =
  | { key: string; type: 'link'; label: string; to: string; exact?: boolean }
  | { key: string; type: 'inert'; label: string }
  | { key: string; type: 'dropdown'; label: string; items: DropdownItem[] };

function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.type === 'link') {
    return item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
  }
  if (item.type === 'dropdown') {
    return item.items.some(sub => pathname === sub.to);
  }
  return false;
}

// ─── Dropdown tab (top-level "Care Records"-style tab) ──────────────────────────

function DropdownTab({ label, items, active }: { label: string; items: DropdownItem[]; active: boolean }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <button className={`${active ? activeTabClass : inactiveTabClass} inline-flex items-center gap-1 cursor-pointer`}>
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

/** A single visible tab — real navigation elements, exactly as the bar looked before collapse existed. */
function renderTab(item: NavItem, pathname: string) {
  switch (item.type) {
    case 'inert':
      return (
        <a key={item.key} href="#" className={inactiveTabClass}>
          {item.label}
        </a>
      );
    case 'dropdown':
      return <DropdownTab key={item.key} label={item.label} items={item.items} active={isItemActive(item, pathname)} />;
    case 'link':
      return (
        <Link key={item.key} to={item.to} className={item.exact ? (pathname === item.to ? activeTabClass : inactiveTabClass) : tabClass(pathname, item.to)}>
          {item.label}
        </Link>
      );
  }
}

/**
 * The same tab, sized identically but non-interactive and invisible — used
 * only to measure how wide each tab *would* be if shown, without mounting
 * real links/buttons (or duplicate Radix dropdown instances) purely for
 * that. Active vs. inactive styling never differs in anything that affects
 * width (padding, border width, font-weight are all shared), so this can
 * safely render everything in its plain/inactive shape regardless of the
 * real active tab.
 */
function MeasuringTab({ item }: { item: NavItem }) {
  if (item.type === 'dropdown') {
    return (
      <span className={`${inactiveTabClass} inline-flex items-center gap-1`}>
        {item.label}
        <ChevronDown className="w-3.5 h-3.5 opacity-80" />
      </span>
    );
  }
  return <span className={inactiveTabClass}>{item.label}</span>;
}

const MORE_BUTTON_CLASS = `${inactiveTabClass} inline-flex items-center gap-1 cursor-pointer`;

/** The collapsed items, as a dropdown menu — plain entries for links/inert tabs, a nested submenu for "Care Records" so its own 3 destinations stay reachable rather than being flattened or dropped. */
function MoreMenuItem({ item, pathname, navigate }: { item: NavItem; pathname: string; navigate: ReturnType<typeof useNavigate> }) {
  if (item.type === 'dropdown') {
    const active = isItemActive(item, pathname);
    return (
      <DropdownMenuPrimitive.Sub>
        <DropdownMenuPrimitive.SubTrigger
          className={`flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded mx-1 cursor-pointer outline-none select-none transition-colors ${
            active ? 'bg-purple-50 text-[rgb(154,38,214)]' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          {item.label}
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        </DropdownMenuPrimitive.SubTrigger>
        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.SubContent
            sideOffset={2}
            className="z-50 min-w-[160px] bg-white border border-gray-200 rounded-lg shadow-lg py-1 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          >
            {item.items.map(sub => {
              const subActive = pathname === sub.to;
              return (
                <DropdownMenuPrimitive.Item
                  key={sub.label}
                  onSelect={() => navigate(sub.to)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded mx-1 cursor-pointer outline-none select-none transition-colors ${
                    subActive ? 'bg-purple-50 text-[rgb(154,38,214)]' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {sub.label}
                </DropdownMenuPrimitive.Item>
              );
            })}
          </DropdownMenuPrimitive.SubContent>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Sub>
    );
  }

  const active = isItemActive(item, pathname);
  const stateClass = item.type === 'inert'
    ? 'text-gray-400 cursor-default'
    : active
      ? 'bg-purple-50 text-[rgb(154,38,214)] cursor-pointer'
      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer';
  return (
    <DropdownMenuPrimitive.Item
      onSelect={() => item.type === 'link' && navigate(item.to)}
      disabled={item.type === 'inert'}
      className={`flex items-center px-3 py-2 text-sm font-medium rounded mx-1 outline-none select-none transition-colors ${stateClass}`}
    >
      {item.label}
    </DropdownMenuPrimitive.Item>
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
  const navigate = useNavigate();
  const scrolled = useScrolled();
  const customer = useCustomer();
  const showCareBridgeTab = useFeatureFlag('customerCareBridgeTab');
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

  // 'Dashboard', 'Care Management' etc — same tabs as before, just modelled
  // as data now so the same list can be rendered three ways (visible tabs,
  // an invisible measuring row, and "More" menu entries) — see the Nav item
  // model note above and useOverflowNav.
  const navItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [{ key: 'dashboard', type: 'inert', label: 'Dashboard' }];
    if (showCareBridgeTab) {
      // Deprecated as a tab of its own — Assessment Hero is managed per
      // section now, with the recordings under Documents. Kept behind the
      // Admin feature switch so it can still be reviewed.
      items.push({ key: 'carebridge', type: 'link', label: 'Assessment Hero', to: `${base}/carebridge` });
    }
    items.push(
      { key: 'caremanagement', type: 'link', label: 'Care Management', to: `${base}/caremanagement` },
      {
        key: 'carerecords',
        type: 'dropdown',
        label: 'Care Records',
        items: [
          { label: 'Care Notes', to: `${base}/carenotes` },
          { label: 'MAR Chart', to: `${base}/marchart` },
          { label: 'Timeline', to: '#' },
        ],
      },
      { key: 'documents', type: 'link', label: 'Documents', to: `${base}/documents` },
      { key: 'aboutme', type: 'link', label: 'About Me', to: `${base}/aboutme` },
      { key: 'details', type: 'link', label: 'Details', to: `${base}/details` },
      { key: 'checklists', type: 'inert', label: 'Checklists' },
      { key: 'rostering', type: 'link', label: 'Rostering', to: base, exact: true },
      { key: 'communications', type: 'inert', label: 'Communications' },
      { key: 'medicalhistory', type: 'link', label: 'Medical History', to: `${base}/medicalhistory` },
      { key: 'customerfile', type: 'inert', label: 'Customer File' },
    );
    return items;
  }, [base, showCareBridgeTab]);

  const { containerRef, moreRef, itemRefs, visibleCount, hasOverflow } = useOverflowNav(navItems.length);

  // Whatever tab you're actually on should never be the one that vanishes
  // into "More" — if the plain width-based cut would hide it, swap it back
  // in for whichever visible tab is least important (the last one, since
  // priority here is just declaration order), rather than leaving the
  // active tab's own highlight invisible off in a closed menu.
  const activeIndex = navItems.findIndex(item => isItemActive(item, pathname));
  let visibleIndices = Array.from({ length: visibleCount }, (_, i) => i);
  if (hasOverflow && activeIndex >= visibleCount && visibleCount > 0) {
    visibleIndices = [...visibleIndices.slice(0, -1), activeIndex].sort((a, b) => a - b);
  }
  const visibleSet = new Set(visibleIndices);
  const hiddenItems = navItems.filter((_, i) => !visibleSet.has(i));

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
              <div className="text-sm font-medium text-gray-600 flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                {contactBits.map((bit, i) => (
                  <span key={bit.label} className="flex items-center gap-3">
                    {i > 0 && <span className="text-gray-300">•</span>}
                    <span><span className="text-gray-500">{bit.label}:</span> <span className="text-gray-700">{bit.value}</span></span>
                  </span>
                ))}
              </div>
              <div className="text-gray-700 text-[16px] font-medium">
                {customer.addressOneLine}
              </div>
            </div>

            {/* Condensed single line — shown when scrolled */}
            <div className={`transition-all duration-300 overflow-hidden ${scrolled ? 'max-h-10 opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}>
              <p className="text-sm font-medium text-gray-600 truncate">{condensed}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs — progressively collapse into "More" rather than
            scrolling sideways once they don't all fit; see useOverflowNav
            and the Nav item model note above for how. */}
        <div className="border-t border-gray-200 -mx-6 px-6">
          <nav ref={containerRef as React.RefObject<HTMLElement>} className="relative flex gap-1 flex-nowrap overflow-hidden">
            {visibleIndices.map(i => renderTab(navItems[i], pathname))}

            {hasOverflow && (
              <DropdownMenuPrimitive.Root>
                <DropdownMenuPrimitive.Trigger asChild>
                  <button
                    className={MORE_BUTTON_CLASS}
                    aria-label={`${hiddenItems.length} more tab${hiddenItems.length === 1 ? '' : 's'}`}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                    More
                  </button>
                </DropdownMenuPrimitive.Trigger>
                <DropdownMenuPrimitive.Portal>
                  <DropdownMenuPrimitive.Content
                    sideOffset={0}
                    align="end"
                    className="z-50 min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-lg py-1 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2"
                  >
                    {hiddenItems.map(item => (
                      <MoreMenuItem key={item.key} item={item} pathname={pathname} navigate={navigate} />
                    ))}
                  </DropdownMenuPrimitive.Content>
                </DropdownMenuPrimitive.Portal>
              </DropdownMenuPrimitive.Root>
            )}

            {/* Invisible measuring row — every tab at its natural width,
                plus the "More" trigger's own width, so both are known
                *before* deciding what's actually visible (see
                useOverflowNav). `moreRef` only ever attaches here (never to
                the real, conditionally-rendered trigger above) since this
                copy — same className/content — is always mounted,
                unaffected by whether "More" itself is currently showing.
                Plain non-interactive spans, not real links/dropdowns —
                nothing here is reachable by keyboard or announced to
                screen readers. */}
            <div aria-hidden="true" className="absolute top-0 left-0 flex gap-1 invisible pointer-events-none">
              {navItems.map((item, i) => (
                <span key={item.key} ref={el => { itemRefs.current[i] = el; }}>
                  <MeasuringTab item={item} />
                </span>
              ))}
              <span ref={el => { moreRef.current = el; }} className={MORE_BUTTON_CLASS}>
                <MoreHorizontal className="w-4 h-4" />
                More
              </span>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
