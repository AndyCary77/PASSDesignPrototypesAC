import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  Calendar,
  CalendarDays,
  Route,
  SquareActivity,
  Table2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  Briefcase,
  Send,
  Settings2,
  TrendingUp,
  HandHeart,
  UserCheck,
  MapPin,
  Map as MapIcon,
  Funnel,
  ChartNoAxesGantt,
  Clock,
  CircleAlert,
  ArrowDownNarrowWide,
  EllipsisVertical,
  Car,
  Plane,
  Stethoscope,
  Users,
  AlarmClock,
  AlertTriangle,
  GripHorizontal,
  WandSparkles,
  Plus,
  Printer,
  Mail,
} from 'lucide-react';
import { Button } from '../buttons/Button';
import heroIconUrl from '../icons/assessment-hero.svg';
import { HeroTeaserDialog } from '../hero/HeroTeaserDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

// Static prototype of the Daily Schedule (carer perspective, timeline view, colour-by-area),
// rebuilt from the design spec captured from the running scheduler (design-spec/daily-schedule).
// It renders inside the normal app shell: the side rail + top bar come from AppShell, the
// Schedule/Runs/… tab strip is <ScheduleSubnav/> (passed as the shell's infoBar), and everything
// else here is the page content.
//
// The feature it demonstrates is unchanged: a warning icon + amber hours pill against carer rows
// whose employee has restrictions added (David Bukowski — overseas worker).
//
// Deliberate departures from the spec, for legibility: no text below 14px (the spec uses 11–12px
// for status lines, axis labels and badges), and status labels use the area's darker "balanced"
// text colour rather than its base colour, which doesn't reach 4.5:1 on the tinted card.

// ─── Areas (spec: areas.*) ──────────────────────────────────────────────────

type AreaName = 'Bracknell' | 'Reading' | 'Windsor' | 'Wokingham';
type AreaPalette = {
  base: string;
  pending: string;
  text: string;
  tint06: string;
  tint08: string;
  tint12: string;
  tint30: string;
  tint50: string;
  alpha20: string;
};

const AREAS: Record<AreaName, AreaPalette> = {
  Bracknell: { pending: '#d8edc8', base: '#518e00', text: '#154800', tint06: '#ecf1e7', tint08: '#e8f0e3', tint12: '#e2eeda', tint30: '#c6e2b0', tint50: '#a7d580', alpha20: '#518e0033' },
  Reading: { pending: '#cee5ff', base: '#2f6ef7', text: '#00259d', tint06: '#e9effc', tint08: '#e5eefe', tint12: '#ddeaff', tint30: '#b8d8ff', tint50: '#90c2ff', alpha20: '#2f6ef733' },
  Windsor: { pending: '#ceefd3', base: '#00943c', text: '#004d00', tint06: '#e9f2ea', tint08: '#e5f1e6', tint12: '#ddefdf', tint30: '#b7e5be', tint50: '#8bda9a', alpha20: '#00943c33' },
  Wokingham: { pending: '#eed9ff', base: '#9a3cf2', text: '#550098', tint06: '#f2ecfb', tint08: '#f0e9fd', tint12: '#eee3ff', tint30: '#e5c7ff', tint50: '#daa5ff', alpha20: '#9a3cf233' },
};

// ─── Data ───────────────────────────────────────────────────────────────────

type CardStatus = 'pending' | 'booked' | 'in-progress' | 'completed';
type VisitCard = {
  start: number; // hours, 0–24
  end: number;
  title: string;
  status: CardStatus;
  area?: AreaName; // defaults to the carer's area
  travelMins?: number; // travel line drawn to the left of the card
  doubleUp?: boolean;
  timeAdjusted?: boolean;
};
type Run = { start: number; end: number; label: string; colour: string };
type Contract = 'salary' | 'fixed' | 'variable';
type AvailBar = { start: number; end: number; contract: Contract; optional?: boolean };
type Restriction = { label: string; detail: string };
type Absence = { type: 'holiday' | 'sick'; label: string };
type Carer = {
  name: string;
  initials: string;
  area: AreaName;
  contract: Contract;
  worked: number;
  scheduled: number;
  restriction?: Restriction;
  absence?: Absence;
  cards: VisitCard[];
  runs: Run[];
  bars: AvailBar[];
};

const RUN_DEFAULT = '#b173c7';

const CARERS: Carer[] = [
  {
    name: 'David Bukowski',
    initials: 'DB',
    area: 'Reading',
    contract: 'fixed',
    worked: 24,
    scheduled: 40,
    restriction: {
      label: '10 hrs/wk max',
      detail: 'Student visa – non-HEP · 10 hrs/wk term-time.',
    },
    cards: [],
    runs: [],
    bars: [{ start: 7, end: 13, contract: 'fixed' }],
  },
  {
    name: 'Kathryn Perry',
    initials: 'KP',
    area: 'Windsor',
    contract: 'variable',
    worked: 0,
    scheduled: 40,
    cards: [],
    runs: [],
    bars: [],
  },
  {
    name: 'Adrianna Janowski',
    initials: 'AJ',
    area: 'Wokingham',
    contract: 'variable',
    worked: 24,
    scheduled: 40,
    cards: [
      { start: 9, end: 11, title: 'Anthony Dodd', status: 'completed', timeAdjusted: true },
      { start: 17, end: 18.5, title: 'Mike Meakin', status: 'booked', travelMins: 20 },
      { start: 18.5, end: 20, title: 'Mike Meakin', status: 'booked', travelMins: 10 },
      { start: 20, end: 21, title: 'Stanley Cole', status: 'pending', doubleUp: true, travelMins: 15 },
    ],
    runs: [{ start: 16.6, end: 21.2, label: 'Wokingham Evening A', colour: RUN_DEFAULT }],
    bars: [
      { start: 9, end: 11, contract: 'variable' },
      { start: 17, end: 21, contract: 'variable' },
    ],
  },
  {
    name: 'Amirah Marsden',
    initials: 'AM',
    area: 'Bracknell',
    contract: 'variable',
    worked: 10,
    scheduled: 40,
    cards: [
      { start: 8, end: 9, title: 'Chloe Barnes', status: 'completed' },
      { start: 11, end: 12.5, title: 'Chloe Barnes', status: 'in-progress', travelMins: 25 },
      { start: 19, end: 20, title: 'Chloe Barnes', status: 'booked', travelMins: 30 },
    ],
    runs: [],
    bars: [{ start: 8, end: 20, contract: 'variable' }],
  },
  {
    name: 'John Smith',
    initials: 'JS',
    area: 'Windsor',
    contract: 'salary',
    worked: 3,
    scheduled: 40,
    absence: { type: 'holiday', label: 'Holiday' },
    cards: [],
    runs: [],
    bars: [{ start: 13, end: 21, contract: 'salary' }],
  },
  {
    name: 'Stephen Nicholls',
    initials: 'SN',
    area: 'Reading',
    contract: 'variable',
    worked: 8,
    scheduled: 40,
    cards: [{ start: 13, end: 14, title: 'Doris Hale', status: 'pending', travelMins: 20 }],
    runs: [],
    bars: [
      { start: 7, end: 19, contract: 'variable' },
      { start: 17, end: 19, contract: 'variable', optional: true },
    ],
  },
  {
    name: 'Will Kingsley',
    initials: 'WK',
    area: 'Wokingham',
    contract: 'fixed',
    worked: 14,
    scheduled: 40,
    cards: [
      { start: 7.5, end: 8.5, title: 'Stanley Cole', status: 'completed' },
      { start: 9, end: 11, title: 'Miles Peters', status: 'completed', travelMins: 20 },
      { start: 11, end: 12.5, title: 'Stanley Cole', status: 'in-progress', doubleUp: true, travelMins: 10 },
    ],
    runs: [],
    bars: [{ start: 7, end: 19, contract: 'fixed' }],
  },
];

type UnallocatedVisit = {
  start: number;
  end: number;
  title: string;
  row: 0 | 1;
  area: AreaName;
  badge?: 'time-critical' | 'count';
};

const UNALLOCATED: UnallocatedVisit[] = [
  { start: 6.5, end: 7.5, title: 'Mike Meakin', row: 0, area: 'Windsor' },
  { start: 8, end: 9, title: 'Louis Grant', row: 0, area: 'Windsor' },
  { start: 9.5, end: 11.5, title: 'Mike Meakin', row: 0, area: 'Windsor' },
  { start: 12.4, end: 13.2, title: 'Harold Gill', row: 0, area: 'Windsor' },
  { start: 15, end: 16, title: 'Miles Peters', row: 0, area: 'Reading' },
  { start: 18, end: 19, title: 'Edmund Hart', row: 0, area: 'Reading' },
  { start: 20.5, end: 21.5, title: 'Sol Weiss', row: 0, area: 'Wokingham', badge: 'time-critical' },
  { start: 7, end: 8, title: 'Mike Meakin', row: 1, area: 'Windsor' },
  { start: 8.4, end: 9.4, title: 'Sol Weiss', row: 1, area: 'Wokingham', badge: 'time-critical' },
  { start: 11, end: 11.6, title: 'Stanley Cole', row: 1, area: 'Bracknell', badge: 'count' },
  { start: 12, end: 15, title: 'Mike Meakin', row: 1, area: 'Windsor' },
  { start: 16.5, end: 17.5, title: 'Stanley Cole', row: 1, area: 'Bracknell' },
  { start: 21, end: 22, title: 'Stanley Cole', row: 1, area: 'Bracknell', badge: 'count' },
];
// The orange outline the spec draws round a run that contains unallocated visits.
const UNALLOCATED_GROUP = { start: 6.3, end: 13.4, label: 'Windsor Day B' };

// ─── Geometry (spec: timeline) ──────────────────────────────────────────────

const LABEL_W = 300;
const HOUR_PX = 73.78; // spec example at a 1600px viewport
const TIMELINE_W = HOUR_PX * 24; // the 24h axis is always rendered; the window is a scroll position
const INITIAL_SCROLL_LEFT = 475; // puts ≈07:00 at the left edge, as captured
const UNALLOCATED_H = 142;
// Carer-row vertical layout: a visit card sits directly on top of the 8px availability bar at the
// bottom of the row. Cards inside a run container are lifted so the whole card fits inside the
// container with a small gap above it.
const ROW_H = 72;
const BAR_H = 8;
const CARD_H = 46;
const CARD_TOP = ROW_H - BAR_H - CARD_H; // 18 — resting on the availability bar
const RUN_TOP = 4;
const RUN_H = 58;
const CARD_TOP_IN_RUN = RUN_TOP + 2 + 4; // container top + 2px border + 4px gap = 10
const HANDLE_H = 8;
const NOW = 11.5; // the spec pins the clock to 11:30
const HOURS = Array.from({ length: 25 }, (_, i) => i);

const pct = (h: number) => `${(h / 24) * 100}%`;

const AVATAR_COLORS = [
  '#bfbacf', '#e0e9f2', '#b7dda8', '#b1c8de', '#a4d5d0', '#c9b4de', '#de9f9e', '#af9b91',
  '#d4c5d0', '#c9d4c0', '#d9c4b8', '#b8cad4', '#d5b8c4', '#c4d5ba', '#d8c4af', '#b8c9d8',
];
const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// Contract type → dot colour on the avatar, and the availability bar's fill/edge (spec: contractFallback).
const CONTRACT: Record<Contract, { dot: string; fill: string; edge: string }> = {
  salary: { dot: '#bfbacf', fill: '#e6e3f0', edge: '#bfbacf' },
  fixed: { dot: '#e9d189', fill: '#f5ebc5', edge: '#e9d189' },
  variable: { dot: '#b7dda8', fill: '#e8f1e8', edge: '#b7dda8' },
};

const LIGHT_TOOLTIP = {
  className: 'bg-white text-gray-900 border border-gray-200 shadow-lg max-w-xs text-body',
  arrowClassName: 'bg-white fill-white',
} as const;

const SOFT_SHADOW = '0 1px 3px 0 rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1)';

// ─── Tab strip (pinned in the shell's infoBar) ──────────────────────────────

const TABS = [
  { label: 'Schedule', icon: Calendar },
  { label: 'Runs', icon: Route },
  { label: 'Roster Review', icon: SquareActivity },
  { label: 'Capacity', icon: Table2 },
  { label: 'Holidays & Absences', icon: CalendarDays },
];

export function ScheduleSubnav() {
  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <nav className="px-6 flex items-center gap-8" aria-label="Schedule sections">
        {TABS.map(({ label, icon: Icon }, i) => {
          const active = i === 0;
          return (
            // Raw button on purpose: the spec'd tab strip (left-aligned, icon + label, underline) isn't
            // the centred SubnavTabs look, and these tabs don't navigate anywhere in the prototype.
            <button
              key={label}
              type="button"
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-1.5 h-[50px] text-sm font-medium border-b-2 cursor-pointer whitespace-nowrap ${
                active
                  ? 'text-black border-[#9a26d6]'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export function ScheduleTimeline() {
  const [metricsOpen, setMetricsOpen] = useState(false);

  return (
    <div>
      <PageHeader metricsOpen={metricsOpen} onToggleMetrics={() => setMetricsOpen((o) => !o)} />
      <div className="h-px bg-gray-200 mt-4" />
      {metricsOpen && <MetricsPanel />}
      <FilterToolbar />
      <Scheduler />
    </div>
  );
}

function PageHeader({ metricsOpen, onToggleMetrics }: { metricsOpen: boolean; onToggleMetrics: () => void }) {
  const [heroTeaserOpen, setHeroTeaserOpen] = useState(false);
  return (
    <div className="relative flex items-center justify-between h-9">
      <h1 className="flex items-baseline">
        <span className="text-[20px] leading-[30px] font-medium text-slate-900">Daily Schedule</span>
        <span className="ml-2 text-[18px] leading-[27px] text-slate-600">- Week 2 of 2</span>
      </h1>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        <Button variant="tertiary" iconOnly size="md" className="!rounded-lg bg-transparent! hover:bg-gray-100!" aria-label="Previous day">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="tertiary" size="md" className="!rounded-lg bg-transparent! hover:bg-gray-100! !px-3 gap-2 text-gray-900" icon={<Calendar className="w-4 h-4" />}>
          Monday, October 5, 2026
        </Button>
        <Button variant="tertiary" iconOnly size="md" className="!rounded-lg bg-transparent! hover:bg-gray-100!" aria-label="Next day">
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="tertiary" size="md" className="!rounded-lg !px-3 bg-[#eceef2]! text-[#030213]!">
          Today
        </Button>
      </div>

      <div className="flex items-center gap-3 mr-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="tertiary" icon={<Briefcase className="w-4 h-4" />} className="data-[state=open]:bg-[#DCD9E4]!">
              Actions
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6} className="min-w-[260px] rounded-xl border-gray-200 bg-white p-1.5 shadow-lg">
            {/* Static prototype: the items look live but don't do anything yet. */}
            <DropdownMenuItem className="gap-3 rounded-lg px-3 py-2 text-body font-medium text-gray-900 cursor-pointer focus:bg-gray-100 focus:text-gray-900">
              <WandSparkles className="!size-5 text-gray-600" aria-hidden="true" />
              Auto Assign
            </DropdownMenuItem>
            {/* Schedule Hero is the highlighted (AI) entry: tinted fill and outline in the brand purple. */}
            <DropdownMenuItem
              onSelect={() => setHeroTeaserOpen(true)}
              className="my-0.5 gap-3 rounded-lg border border-purple-300 bg-[#f3e8fb] px-3 py-2 text-body font-medium text-[rgb(154,38,214)] cursor-pointer focus:bg-[#ead7f7] focus:text-[rgb(154,38,214)]"
            >
              <img src={heroIconUrl} alt="" className="size-5" />
              Schedule Hero
              {/* Upgrade teaser: this account doesn't have the feature, so the item opens a preview instead. */}
              <span className="ml-auto rounded-full bg-[rgb(154,38,214)] px-2 py-px text-sm font-semibold text-white">Upgrade</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 rounded-lg px-3 py-2 text-body font-medium text-gray-900 cursor-pointer focus:bg-gray-100 focus:text-gray-900">
              <Plus className="!size-5 text-gray-600" aria-hidden="true" />
              Add Event
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 rounded-lg px-3 py-2 text-body font-medium text-gray-900 cursor-pointer focus:bg-gray-100 focus:text-gray-900">
              <Printer className="!size-5 text-gray-600" aria-hidden="true" />
              Print Schedule
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 rounded-lg px-3 py-2 text-body font-medium text-gray-900 cursor-pointer focus:bg-gray-100 focus:text-gray-900">
              <Mail className="!size-5 text-gray-600" aria-hidden="true" />
              Email Schedule
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <HeroTeaserDialog mode="schedule-hero" open={heroTeaserOpen} onOpenChange={setHeroTeaserOpen} />
        <div className="relative">
          <Button variant="primary" icon={<Send className="w-4 h-4" />}>Publish</Button>
          <span className="absolute -top-3 -right-2 min-w-6 h-6 px-[5px] rounded-full border-2 border-white bg-[#d4183d] text-white text-sm font-medium leading-none flex items-center justify-center pointer-events-none">
            37
          </span>
        </div>
        <Button
          variant="tertiary"
          iconOnly
          aria-label="Show metrics"
          aria-pressed={metricsOpen}
          onClick={onToggleMetrics}
          className={`border! border-gray-200! text-gray-600! ${metricsOpen ? 'bg-gray-100!' : 'bg-white!'} hover:bg-gray-50!`}
        >
          <TrendingUp className="w-4 h-4" />
        </Button>
        <div className="relative">
          <Button variant="tertiary" iconOnly aria-label="View settings" className="text-gray-700!">
            <Settings2 className="w-4 h-4" />
          </Button>
          <span className="absolute -top-3 -right-2 min-w-6 h-6 px-[5px] rounded-full border-2 border-white bg-[#9a26d6] text-white text-sm font-medium leading-none flex items-center justify-center pointer-events-none">
            1
          </span>
        </div>
      </div>
    </div>
  );
}

const METRICS = [
  { label: 'Total Hours', value: '152.0h', icon: Clock, bg: '#eff6ff', labelColour: '#1447e6', valueColour: '#1c398e' },
  { label: 'Allocated', value: '238 / 304', icon: Calendar, bg: '#f0fdf4', labelColour: '#008236', valueColour: '#0d542b' },
  { label: 'Unallocated', value: '13', icon: CircleAlert, bg: '#fff7ed', labelColour: '#ca3500', valueColour: '#7e2a0c' },
  { label: 'Active Carers', value: '5 / 7', icon: HandHeart, bg: '#faf5ff', labelColour: '#8200db', valueColour: '#59168b' },
  { label: 'Coverage', value: '78%', icon: MapIcon, bg: '#f3f4f6', labelColour: '#4a5565', valueColour: '#101828' },
];

function MetricsPanel() {
  return (
    <div className="grid grid-cols-5 gap-4 mt-6">
      {METRICS.map(({ label, value, icon: Icon, bg, labelColour, valueColour }) => (
        <div key={label} className="rounded-[10px] p-3" style={{ backgroundColor: bg }}>
          <div className="flex items-center gap-2 mb-1 text-sm font-medium" style={{ color: labelColour }}>
            <Icon className="w-4 h-4" aria-hidden="true" />
            {label}
          </div>
          <div className="text-base font-medium" style={{ color: valueColour }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Filter toolbar ─────────────────────────────────────────────────────────

function FilterToolbar() {
  return (
    <div className="mt-6 flex items-center justify-between gap-4">
      {/* The filter dropdowns give up width first (flex-shrink) so the right-hand controls never get pushed off-screen. */}
      <div className="flex items-center gap-3 min-w-0">
        <Segmented showLabels items={[{ label: 'Employees', active: true }, { label: 'Customers' }]} />
        <Segmented showLabels items={[{ label: 'Daily', active: true }, { label: 'Weekly' }]} />
        <FilterSelect icon={<HandHeart className="w-4 h-4" />} label="All carers" width={192} minWidth={140} />
        <FilterSelect icon={<UserCheck className="w-4 h-4" />} label="All care receivers" width={192} minWidth={215} />
        <FilterSelect icon={<MapPin className="w-4 h-4" />} label="All areas" width={208} minWidth={135} />
        <FilterSelect icon={<Funnel className="w-4 h-4" />} label="More" width={160} minWidth={100} />
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Raw button on purpose: a select-style trigger, not an action button. */}
        <button
          type="button"
          className="w-40 h-9 px-3 flex items-center gap-2 rounded-lg border border-transparent bg-gray-100 text-sm text-gray-600 cursor-pointer"
        >
          <Briefcase className="w-4 h-4" aria-hidden="true" />
          <span className="flex-1 text-left truncate">07:00 - 22:00</span>
          <ChevronDown className="w-4 h-4 opacity-50" aria-hidden="true" />
        </button>
        <Segmented
          items={[
            { icon: <ChartNoAxesGantt className="w-4 h-4" />, label: 'Timeline', active: true },
            { icon: <MapIcon className="w-4 h-4" />, label: 'Map' },
          ]}
        />
      </div>
    </div>
  );
}

function FilterSelect({ icon, label, width, minWidth }: { icon: ReactNode; label: string; width: number; minWidth: number }) {
  return (
    // Raw button on purpose: a select-style trigger (white, hairline border, chevron), not an action button.
    <button
      type="button"
      style={{ flex: `0 1 ${width}px`, minWidth }}
      className="h-9 px-3 flex items-center gap-2 rounded-lg border border-black/10 bg-white text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50"
    >
      <span aria-hidden="true">{icon}</span>
      <span className="flex-1 text-left truncate">{label}</span>
      <ChevronDown className="w-4 h-4 opacity-50" aria-hidden="true" />
    </button>
  );
}

// Spec: filterToolbar.segmentedControl — a grey track with a raised white active segment. With
// `showLabels` each segment shows its word; otherwise it's icon-only, and each segment carries a
// white tooltip and an accessible name.
function Segmented({ items, showLabels }: { items: Array<{ icon?: ReactNode; label: string; active?: boolean }>; showLabels?: boolean }) {
  if (showLabels) {
    return (
      <div className="h-9 p-[3px] flex items-center rounded-lg bg-[#ececf0]">
        {items.map((item) => (
          // Raw button on purpose: a segment of the spec'd segmented control.
          <button
            key={item.label}
            type="button"
            aria-pressed={!!item.active}
            className={`h-[30px] px-4 flex items-center justify-center rounded-md text-body font-medium cursor-pointer ${
              item.active ? 'bg-white text-black shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="h-9 p-[3px] flex items-center rounded-lg bg-[#ececf0]">
      {items.map((item) => (
        <Tooltip key={item.label}>
          <TooltipTrigger asChild>
            {/* Raw button on purpose: a segment of the spec'd segmented control. */}
            <button
              type="button"
              aria-label={item.label}
              aria-pressed={!!item.active}
              className={`h-[30px] px-2.5 flex items-center justify-center rounded-md cursor-pointer ${
                item.active ? 'bg-white text-black shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {item.icon}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" {...LIGHT_TOOLTIP}>{item.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

// ─── Scheduler ──────────────────────────────────────────────────────────────

function Scheduler() {
  const scroller = useRef<HTMLDivElement>(null);

  // Scroll so the 07:00 window is in view; the full 24h axis stays rendered either side of it.
  useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = INITIAL_SCROLL_LEFT;
  }, []);

  return (
    <div className="mt-6">
      {/* 11px custom scrollbar, spec: scrollbars */}
      <style>{`
        .schedule-scroller { scrollbar-width: thin; scrollbar-color: #cac6d7 #f5f5f5; }
        .schedule-scroller::-webkit-scrollbar { width: 11px; height: 11px; }
        .schedule-scroller::-webkit-scrollbar-track { background: #f5f5f5; }
        .schedule-scroller::-webkit-scrollbar-thumb { background: #cac6d7; border-radius: 4px; border: 2px solid #f5f5f5; }
        .schedule-scroller::-webkit-scrollbar-thumb:hover { background: #b5b0c7; }
        .schedule-scroller::-webkit-scrollbar-corner { background: #f5f5f5; }
      `}</style>
      <div
        ref={scroller}
        className="schedule-scroller relative overflow-auto rounded-[10px] border border-gray-200 bg-white"
        style={{ height: 'max(560px, calc(100vh - 340px))' }}
      >
        <div className="relative" style={{ width: LABEL_W + TIMELINE_W }}>
          <UnallocatedPanel />
          {/* Resize handle (grip appears on hover) */}
          <div
            className="group sticky z-30 flex items-center justify-center bg-[#dcd9e3] cursor-ns-resize"
            style={{ top: UNALLOCATED_H, height: HANDLE_H }}
            aria-hidden="true"
          >
            <GripHorizontal className="w-4 h-4 text-[#9d97a6] opacity-0 group-hover:opacity-100" />
          </div>
          <CarersHeader />
          {CARERS.map((carer, i) => (
            <CarerRow key={carer.name} carer={carer} first={i === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}

function UnallocatedPanel() {
  const lanes = [24, 70];
  const [groupHover, setGroupHover] = useState(false);
  return (
    <div className="sticky top-0 z-30 flex bg-[#f4f3f6]" style={{ height: UNALLOCATED_H }}>
      <div className="sticky left-0 z-40 flex-shrink-0 bg-[#f4f3f6] border-r border-[#dcd9e3] p-3" style={{ width: LABEL_W }}>
        <div className="flex items-start gap-2">
          <CircleAlert className="w-5 h-5 mt-0.5 text-[#6b6578] flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-base text-[#3d3848]">Unallocated</p>
            <span className="mt-1 inline-flex items-center px-3 py-1 rounded-xl border text-sm font-medium text-[#9a3412]" style={{ backgroundColor: 'rgba(234,88,12,0.082)', borderColor: 'rgba(234,88,12,0.4)' }}>
              {UNALLOCATED.length} Visits
            </span>
          </div>
        </div>
      </div>

      <div className="relative bg-[#f4f3f6] overflow-hidden" style={{ width: TIMELINE_W }}>
        <Gridlines />
        {/* Orange outline round a run that holds unallocated visits */}
        <div
          className="absolute rounded-[10px] border-2 border-[#f97316] pt-1"
          style={{ left: pct(UNALLOCATED_GROUP.start), width: pct(UNALLOCATED_GROUP.end - UNALLOCATED_GROUP.start), top: 18, height: 48, backgroundColor: 'rgba(249,115,22,0.08)' }}
          onMouseEnter={() => setGroupHover(true)}
          onMouseLeave={() => setGroupHover(false)}
        >
          <RunPill label={UNALLOCATED_GROUP.label} colour="#f97316" visible={groupHover} />
        </div>
        {UNALLOCATED.map((u, i) => (
          <VisitCardEl
            key={i}
            start={u.start}
            end={u.end}
            title={u.title}
            area={u.area}
            unallocated
            top={lanes[u.row]}
            height={36}
            badge={u.badge}
            onHoverChange={u.row === 0 && u.start >= UNALLOCATED_GROUP.start && u.end <= UNALLOCATED_GROUP.end ? setGroupHover : undefined}
          />
        ))}
        <NowLine dot />
        {/* Bottom shade, spec: unallocatedPanel.timelinePane.bottomShade */}
        <div
          className="absolute left-0 right-0 bottom-0 h-6 pointer-events-none"
          style={{ background: 'linear-gradient(rgba(0,0,0,.08) 0%, rgba(0,0,0,.02) 40%, rgba(0,0,0,0) 100%)' }}
        />
      </div>
    </div>
  );
}

function CarersHeader() {
  return (
    <div className="sticky z-30 flex bg-gray-50 border-b-2 border-gray-300" style={{ top: UNALLOCATED_H + HANDLE_H, height: 58 }}>
      <div className="sticky left-0 z-40 flex-shrink-0 bg-gray-50 border-r border-gray-300 px-3 flex items-center justify-between" style={{ width: LABEL_W }}>
        <span className="text-base text-[#0a0a0a]">Carers ({CARERS.length})</span>
        <Button variant="tertiary" iconOnly size="sm" aria-label="Sort carers" className="bg-transparent! hover:bg-gray-200! text-gray-700!">
          <ArrowDownNarrowWide className="w-4 h-4" />
        </Button>
      </div>
      <div className="relative" style={{ width: TIMELINE_W }}>
        {HOURS.map((h) => (
          <div key={h} className="absolute top-0" style={{ left: pct(h) }}>
            <span className="absolute top-0 left-0 w-px h-2 bg-gray-300" />
            <span className="absolute top-3 left-0 -translate-x-1/2 text-sm text-gray-600 whitespace-nowrap">
              {String(h).padStart(2, '0')}:00
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Carer row ──────────────────────────────────────────────────────────────

const ROW_MENU_ITEMS = ['Reassign Visits', 'Unassign all', 'Mark as absent', 'Add availability'];

function CarerRow({ carer, first }: { carer: Carer; first: boolean }) {
  const area = AREAS[carer.area];
  const contract = CONTRACT[carer.contract];
  const restriction = carer.restriction;
  // Which run (if any) the pointer is over — either its own outline or one of the cards inside it.
  const [hoverRun, setHoverRun] = useState<string | null>(null);
  const runOf = (c: VisitCard) => carer.runs.find((r) => c.start >= r.start && c.end <= r.end);

  return (
    <div className="flex">
      {/* Label cell */}
      <div className="sticky left-0 z-30 flex-shrink-0 bg-white border-r border-b border-gray-200 p-3 flex items-center gap-3" style={{ width: LABEL_W, height: ROW_H }}>
        <span className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: area.base }} aria-hidden="true" />
        <div className="relative flex-shrink-0">
          <div
            className="w-8 h-8 rounded-full text-sm font-semibold flex items-center justify-center"
            style={{ backgroundColor: getAvatarColor(carer.name), color: '#1e293b', boxShadow: '0 0 0 3px #fff, 0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1)' }}
          >
            {carer.initials}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: contract.dot }} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium leading-tight text-[#0a0a0a] truncate max-w-[180px]">{carer.name}</span>
            {restriction && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} aria-label={`Restriction: ${restriction.detail}`} className="inline-flex cursor-pointer">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start" {...LIGHT_TOOLTIP}>{restriction.detail}</TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-sm text-gray-600">
            <Car className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            {restriction ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="inline-flex items-center gap-1 px-2 rounded-full text-sm font-medium bg-amber-50 text-amber-900 border border-amber-200 cursor-pointer">
                      <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                      {carer.worked} hrs
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start" {...LIGHT_TOOLTIP}>{restriction.detail}</TooltipContent>
                </Tooltip>
                <span className="truncate">/ {carer.scheduled} hrs sch.</span>
              </>
            ) : (
              <span className="truncate">{carer.worked} hrs / {carer.scheduled} hrs sch.</span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="tertiary" iconOnly size="sm" aria-label={`Actions for ${carer.name}`} className="!h-6 !w-6 bg-transparent! hover:bg-gray-100! data-[state=open]:bg-gray-100! text-gray-600! flex-shrink-0">
              <EllipsisVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={6} className="min-w-[180px] rounded-lg border-gray-200 bg-white p-1.5 shadow-lg">
            {ROW_MENU_ITEMS.map((label) => (
              // Static prototype: the items are live-looking but don't do anything yet.
              <DropdownMenuItem key={label} className="rounded-md px-2.5 py-1.5 text-body font-semibold text-gray-900 cursor-pointer focus:bg-gray-100 focus:text-gray-900">
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Timeline cell */}
      <div className="relative bg-white border-b border-gray-200" style={{ width: TIMELINE_W, height: ROW_H }}>
        <Gridlines />

        {carer.absence ? <AbsenceBlock absence={carer.absence} /> : null}

        {carer.runs.map((run) => (
          <div
            key={run.label}
            className="absolute rounded-[10px] border-2"
            style={{
              left: pct(run.start),
              width: pct(run.end - run.start),
              top: RUN_TOP,
              height: RUN_H,
              borderColor: run.colour,
              backgroundColor: `${run.colour}0d`,
            }}
            onMouseEnter={() => setHoverRun(run.label)}
            onMouseLeave={() => setHoverRun(null)}
          >
            <RunPill label={run.label} colour={run.colour} visible={hoverRun === run.label} />
          </div>
        ))}

        {carer.cards.map((c, i) => {
          const run = runOf(c);
          return (
          <VisitCardEl
            key={i}
            start={c.start}
            end={c.end}
            title={c.title}
            area={c.area ?? carer.area}
            status={c.status}
            top={run ? CARD_TOP_IN_RUN : CARD_TOP}
            height={CARD_H}
            onHoverChange={run ? (h) => setHoverRun(h ? run.label : null) : undefined}
            travelMins={c.travelMins}
            doubleUp={c.doubleUp}
            timeAdjusted={c.timeAdjusted}
          />
          );
        })}

        {carer.bars.map((b, i) => (
          <AvailabilityBar key={i} bar={b} />
        ))}

        <NowLine dot={first} />
      </div>
    </div>
  );
}

// Shown on hover. The run outline has no stacking context of its own (no z-index), so this z-index
// competes directly with the visit cards (z-20) and the pill draws on top of them.
function RunPill({ label, colour, visible }: { label: string; colour: string; visible: boolean }) {
  return (
    <span
      className={`absolute -top-3.5 left-2 z-[28] flex items-center gap-1.5 rounded-full pl-2 pr-0.5 py-0.5 text-sm font-medium text-white pointer-events-none transition-opacity ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ backgroundColor: colour, boxShadow: SOFT_SHADOW }}
    >
      <Users className="w-3 h-3" aria-hidden="true" />
      {label}
      <EllipsisVertical className="w-3 h-3 mr-1" aria-hidden="true" />
    </span>
  );
}

const ABSENCE_STYLE = {
  holiday: { border: '#8ec5ff', bg: 'rgba(239,246,255,0.8)', colour: '#1447e6', Icon: Plane },
  sick: { border: '#ffa2a2', bg: 'rgba(254,242,242,0.8)', colour: '#c10007', Icon: Stethoscope },
};

function AbsenceBlock({ absence }: { absence: Absence }) {
  const s = ABSENCE_STYLE[absence.type];
  return (
    <div
      className="absolute left-0 w-full z-[5] flex items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium"
      style={{ top: 8, height: 56, borderColor: s.border, backgroundColor: s.bg, color: s.colour, boxShadow: SOFT_SHADOW }}
    >
      <s.Icon className="w-4 h-4 opacity-80" aria-hidden="true" />
      {absence.label}
    </div>
  );
}

function AvailabilityBar({ bar }: { bar: AvailBar }) {
  const { fill, edge } = CONTRACT[bar.contract];
  const style: CSSProperties = {
    left: pct(bar.start),
    width: pct(bar.end - bar.start),
    border: `1px solid ${edge}`,
    backgroundColor: fill,
  };
  if (bar.optional) {
    // Optional / overtime time: diagonal stripes of the same two colours.
    style.backgroundImage = `repeating-linear-gradient(-45deg, ${fill} 0 6px, ${edge} 6px 10px)`;
  }
  return <div className="absolute bottom-0 rounded-full" style={{ ...style, height: BAR_H }} />;
}

// ─── Visit card (spec: visitCard) ───────────────────────────────────────────

const STATUS_LABEL: Record<CardStatus, string> = {
  pending: 'Pending',
  booked: 'Booked',
  'in-progress': 'In Progress',
  completed: 'Completed',
};

function VisitCardEl({
  start, end, title, area, status, top, height, unallocated, travelMins, doubleUp, timeAdjusted, badge, onHoverChange,
}: {
  start: number;
  end: number;
  title: string;
  area: AreaName;
  status?: CardStatus;
  top: number;
  height: number;
  unallocated?: boolean;
  travelMins?: number;
  doubleUp?: boolean;
  timeAdjusted?: boolean;
  badge?: 'time-critical' | 'count';
  /** Fired as the pointer enters/leaves the card — lets a run outline show its label while a card inside it is hovered. */
  onHoverChange?: (hovered: boolean) => void;
}) {
  const a = AREAS[area];
  const widthPx = (end - start) * HOUR_PX;
  const durationMins = (end - start) * 60;
  // Names are hard-cut by card size, then softened by a 6px fade mask (spec: name.maxChars).
  const maxChars = durationMins < 25 ? 4 : widthPx < 80 ? 12 : 24;

  // Spec colour table: unallocated uses the area tint with a pale outer edge and no status line.
  const look = unallocated
    ? { bg: a.tint12, left: a.base, outer: '#f1f1f1', label: undefined as string | undefined }
    : status === 'pending'
      ? { bg: a.tint06, left: a.pending, outer: a.tint30, label: '#4b5563' }
      : status === 'in-progress'
        ? { bg: a.alpha20, left: a.base, outer: a.tint30, label: a.text }
        : status === 'completed'
          ? { bg: a.tint08, left: a.tint50, outer: a.tint30, label: a.text }
          : { bg: a.tint12, left: a.base, outer: a.tint30, label: a.text }; // booked

  const past = end < NOW;

  return (
    <div
      className="absolute z-20"
      style={{ left: pct(start), width: pct(end - start), top, height, opacity: past ? 0.5 : 1 }}
      onMouseEnter={onHoverChange ? () => onHoverChange(true) : undefined}
      onMouseLeave={onHoverChange ? () => onHoverChange(false) : undefined}
    >
      {travelMins ? <TravelLine mins={travelMins} /> : null}
      <div className="h-full rounded-[7px] overflow-hidden" style={{ border: `1px solid ${look.outer}` }}>
        <div
          className="relative h-full rounded-md pt-1.5 px-2 pb-2"
          style={{ backgroundColor: look.bg, borderLeft: `5px solid ${look.left}`, boxShadow: SOFT_SHADOW }}
        >
          <div
            className={`${unallocated ? 'text-sm leading-[21px]' : '-mt-1 text-base leading-6'} whitespace-nowrap overflow-hidden text-[#0a0a0a]`}
            style={{ maskImage: 'linear-gradient(to right, black calc(100% - 6px), transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 6px), transparent 100%)' }}
          >
            {title.slice(0, maxChars)}
          </div>
          {!unallocated && status && (
            <div className="-mt-0.5 text-sm leading-[14px] whitespace-nowrap overflow-hidden" style={{ color: look.label }}>
              {STATUS_LABEL[status]}
            </div>
          )}

          {/* Icon cluster, bottom-right */}
          <div className="absolute bottom-0.5 right-0.5 flex flex-row-reverse items-center gap-0.5">
            {badge === 'count' && (
              <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-sm font-semibold leading-none text-black" style={{ backgroundColor: '#e6e3f0', border: '1px solid #bfbacf' }}>
                1
              </span>
            )}
            {badge === 'time-critical' && (
              <span className="rounded-full p-0.5 flex" style={{ backgroundColor: '#fecaca', border: '1px solid #f87171' }}>
                <AlarmClock className="w-3 h-3 text-[#dc2626]" aria-label="Time critical" />
              </span>
            )}
            {doubleUp && (
              <span className="rounded-full p-px flex" style={{ backgroundColor: '#e6e3f0', border: '1px solid #bfbacf' }}>
                <Users className="w-3 h-3 text-black" aria-label="Double-up" />
              </span>
            )}
            {timeAdjusted && (
              <span className="rounded-full p-0.5 flex" style={{ backgroundColor: look.bg }}>
                <ChevronsLeft className="w-3 h-3 text-[#f59e0b]" aria-label="Time adjusted" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Travel line to the card's left: 2px line, 2×8 end cap, length = travel minutes at the timeline's scale.
function TravelLine({ mins }: { mins: number }) {
  const px = (mins * HOUR_PX) / 60;
  return (
    <div className="absolute right-full top-1/2 -translate-y-1/2 flex items-center pointer-events-none" style={{ width: px, height: 14 }} aria-hidden="true">
      <span className="block w-full h-0.5 bg-[#9ca3af]" />
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-2 rounded bg-[#9ca3af]" />
    </div>
  );
}

// ─── Grid + now line ────────────────────────────────────────────────────────

function Gridlines() {
  return (
    <>
      {Array.from({ length: 49 }, (_, i) => i / 2).map((h) => (
        <div
          key={h}
          className="absolute top-0 bottom-0 w-px"
          style={{ left: pct(h), backgroundColor: Number.isInteger(h) ? '#e5e7eb' : '#f3f4f6' }}
        />
      ))}
    </>
  );
}

function NowLine({ dot }: { dot?: boolean }) {
  return (
    <div className="absolute top-0 bottom-0 w-px bg-[#9a26d6] z-[25] pointer-events-none" style={{ left: pct(NOW) }}>
      {dot && <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#9a26d6]" />}
    </div>
  );
}
