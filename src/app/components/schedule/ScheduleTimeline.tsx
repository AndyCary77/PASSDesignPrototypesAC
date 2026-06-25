import {
  Calendar,
  Route,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  Briefcase,
  Send,
  Settings2,
  HandHeart,
  UserCheck,
  MapPin,
  Clock,
  CircleAlert,
  ArrowDownUp,
  EllipsisVertical,
  Car,
  Plane,
  Users,
  AlertTriangle,
  X,
} from 'lucide-react';

// Flat, static prototype of the daily timeline schedule, matched to the production UI.
// The feature it demonstrates: a warning icon flagged against carer rows whose employee
// has restrictions added (David Bukowski — overseas worker).

type CardStatus = 'in-progress' | 'booked' | 'completed';
type VisitCard = {
  start: number;
  end: number;
  title: string;
  status: CardStatus;
  travel?: boolean;
  badge?: 'people' | 'count';
  rewind?: boolean;
};
type BarColor = 'green' | 'yellow' | 'purple' | 'green-striped';
type AvailBar = { start: number; end: number; color: BarColor };
type Restriction = { label: string; detail: string };
type Carer = {
  name: string;
  initials: string;
  allocated: number;
  dot: 'amber' | 'green';
  restriction?: Restriction;
  holiday?: { start: number; end: number };
  cards: VisitCard[];
  bars: AvailBar[];
};

const CARERS: Carer[] = [
  {
    name: 'David Bukowski',
    initials: 'DB',
    allocated: 24,
    dot: 'amber',
    restriction: {
      label: '10 hrs/wk max',
      detail: 'Student visa – non-HEP · 10 hrs/wk term-time.',
    },
    cards: [],
    bars: [{ start: 7, end: 13, color: 'yellow' }],
  },
  {
    name: 'Kathryn Perry',
    initials: 'KP',
    allocated: 0,
    dot: 'green',
    cards: [],
    bars: [],
  },
  {
    name: 'Adrianna Janowski',
    initials: 'AJ',
    allocated: 24,
    dot: 'green',
    cards: [
      { start: 9, end: 11, title: 'Anthony Dodd', status: 'in-progress', travel: true, rewind: true },
      { start: 17, end: 18.5, title: 'Mike Meakin', status: 'booked', travel: true },
      { start: 18.5, end: 20, title: 'Mike Meakin', status: 'booked' },
      { start: 20, end: 21, title: 'Stanley', status: 'booked', badge: 'people' },
    ],
    bars: [
      { start: 9, end: 11, color: 'green' },
      { start: 17, end: 21, color: 'green' },
    ],
  },
  {
    name: 'Amirah Marsden',
    initials: 'AM',
    allocated: 10,
    dot: 'green',
    cards: [
      { start: 8, end: 9, title: 'Chloe', status: 'completed' },
      { start: 19, end: 20, title: 'Chloe', status: 'completed', rewind: true },
    ],
    bars: [{ start: 8, end: 20, color: 'green' }],
  },
  {
    name: 'John Smith',
    initials: 'JS',
    allocated: 3,
    dot: 'green',
    holiday: { start: 0, end: 19 },
    cards: [],
    bars: [{ start: 13, end: 21, color: 'purple' }],
  },
  {
    name: 'Stephen Nicholls',
    initials: 'SN',
    allocated: 8,
    dot: 'green',
    cards: [],
    bars: [
      { start: 7, end: 19, color: 'green' },
      { start: 17, end: 19, color: 'green-striped' },
    ],
  },
  {
    name: 'Will Kingsley',
    initials: 'WK',
    allocated: 14,
    dot: 'green',
    cards: [
      { start: 7.5, end: 8.5, title: 'Stanley', status: 'completed' },
      { start: 8, end: 10, title: 'Miles Peters', status: 'in-progress' },
      { start: 10, end: 11, title: 'Stanley', status: 'booked', badge: 'people' },
    ],
    bars: [
      { start: 7.5, end: 11, color: 'yellow' },
      { start: 7, end: 19, color: 'green' },
    ],
  },
];

const UNALLOCATED: Array<{ start: number; end: number; title: string; row: 0 | 1; badge?: 'clock' | 'count' }> = [
  { start: 6.5, end: 7.5, title: 'Mike', row: 0 },
  { start: 8, end: 9, title: 'Louis', row: 0 },
  { start: 8.6, end: 9.2, title: 'L', row: 0 },
  { start: 9.5, end: 11.5, title: 'Mike Meakin', row: 0 },
  { start: 12.4, end: 13, title: 'H', row: 0 },
  { start: 15, end: 16, title: 'Miles', row: 0 },
  { start: 18, end: 19, title: 'Edmund', row: 0 },
  { start: 20.5, end: 21.5, title: 'Sol', row: 0, badge: 'clock' },
  { start: 7, end: 8, title: 'Mike', row: 1 },
  { start: 8.4, end: 9.4, title: 'Sol', row: 1, badge: 'clock' },
  { start: 11, end: 11.6, title: 'S', row: 1, badge: 'count' },
  { start: 12, end: 15, title: 'Mike Meakin', row: 1 },
  { start: 16.5, end: 17.5, title: 'Stanley', row: 1 },
  { start: 21, end: 22, title: 'S', row: 1, badge: 'count' },
];

// Availability-bar palette, keyed to contract type. Each has a border + fill (light mode);
// striped variants use a diagonal stripe of the same two colours for optional/overtime time.
const BAR_PALETTE: Record<'purple' | 'yellow' | 'green', { border: string; fill: string }> = {
  purple: { border: '#BFBACF', fill: '#E6E3F0' }, // Salary
  yellow: { border: '#E9D189', fill: '#F5EBC5' }, // Fixed-hours
  green: { border: '#B7DDA8', fill: '#E8F1E8' }, // Variable hours (default)
};

// 16 muted fills for daily-timeline avatars; initials render in dark slate.
const AVATAR_COLORS = [
  '#BFBACF', '#E0E9F2', '#B7DDA8', '#B1C8DE', '#A4D5D0', '#C9B4DE', '#DE9F9E', '#AF9B91',
  '#D4C5D0', '#C9D4C0', '#D9C4B8', '#B8CAD4', '#D5B8C4', '#C4D5BA', '#D8C4AF', '#B8C9D8',
];
const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const HOURS = Array.from({ length: 25 }, (_, i) => i); // 0..24
const NOW = 10.75;
const pct = (h: number) => `${(h / 24) * 100}%`;
const fmt = (h: number) => {
  const hh = Math.floor(h);
  const mm = h % 1 === 0 ? '00' : '30';
  return `${String(hh).padStart(2, '0')}:${mm}`;
};

export function ScheduleTimeline({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-8">
          <TabItem icon={<Calendar className="w-4 h-4" />} label="Schedule" active />
          <TabItem icon={<Route className="w-4 h-4" />} label="Runs" />
          <TabItem icon={<CalendarDays className="w-4 h-4" />} label="Holidays & Absences" />
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-800 cursor-pointer"
          aria-label="Close schedule preview"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Header row */}
      <div className="bg-white px-6 py-4 flex items-center justify-between relative flex-shrink-0">
        <h1 className="text-[20px] font-medium text-slate-900">Daily Schedule</h1>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
          <button className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600" aria-label="Previous day">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="h-9 px-4 flex items-center gap-2 rounded-md hover:bg-gray-100 text-sm font-medium text-gray-800">
            <Calendar className="w-4 h-4" />
            Monday, June 22, 2026
          </button>
          <button className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600" aria-label="Next day">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button className="h-9 px-5 flex items-center gap-1.5 rounded-full text-sm font-medium bg-[#EDECF1] text-gray-700 hover:bg-[#DCD9E4]">
            <Briefcase className="w-4 h-4" />
            Actions
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className="h-9 px-5 flex items-center gap-1.5 rounded-full text-sm font-medium bg-[rgb(154,38,214)] text-white hover:bg-[rgb(134,28,194)] relative">
            <Send className="w-4 h-4" />
            Publish
            <span className="absolute -top-2 -right-2 min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center border-2 border-white bg-[#d4183d] text-white text-[11px] font-medium">
              1
            </span>
          </button>
          <button className="h-9 w-9 flex items-center justify-center rounded-full bg-[#EDECF1] text-gray-700 hover:bg-[#DCD9E4]" aria-label="View settings">
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="h-px bg-gray-200 flex-shrink-0" />

      {/* Filters row */}
      <div className="bg-gray-50 px-6 py-3 flex items-center gap-3 flex-shrink-0">
        <FilterPill icon={<HandHeart className="w-4 h-4" />} label="All carers" />
        <FilterPill icon={<UserCheck className="w-4 h-4" />} label="All care receivers" />
        <FilterPill icon={<MapPin className="w-4 h-4" />} label="All areas" />
        <div className="ml-auto">
          <FilterPill icon={<Clock className="w-4 h-4" />} label="00:00 – 24:00" />
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto bg-white border-t border-gray-200">
        <div className="min-w-[1500px]">
          {/* Unallocated lane */}
          <div className="flex border-b border-gray-200 bg-[#f4f3f6]">
            <div className="w-[300px] flex-shrink-0 border-r border-[#dcd9e3] p-3">
              <div className="flex items-start gap-2">
                <CircleAlert className="w-5 h-5 text-[#6b6578] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#3d3848] font-medium">Unallocated</p>
                  <span className="inline-flex items-center mt-1 px-3 py-0.5 rounded-full text-xs font-medium bg-orange-600/10 text-orange-800 border border-orange-600/40">
                    24 Visits
                  </span>
                </div>
              </div>
            </div>
            <div className="relative flex-1 h-[150px]">
              <Gridlines />
              <NowLine />
              {UNALLOCATED.map((u, i) => (
                <div
                  key={i}
                  className="absolute h-9"
                  style={{ left: pct(u.start), width: pct(u.end - u.start), top: u.row === 0 ? 12 : 58 }}
                >
                  <div className="h-full rounded-[7px] border border-gray-200 bg-white shadow-sm border-l-[5px] border-l-orange-500 px-2 flex items-center overflow-hidden relative">
                    <span className="text-[13px] text-gray-900 truncate">{u.title}</span>
                    {u.badge === 'clock' && (
                      <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-[#d4183d] text-white flex items-center justify-center">
                        <Plane className="w-2.5 h-2.5" />
                      </span>
                    )}
                    {u.badge === 'count' && (
                      <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[11px] font-semibold" style={{ backgroundColor: 'rgb(230,227,240)', color: '#000', border: '1px solid rgb(191,186,207)' }}>
                        1
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carers header / time axis */}
          <div className="flex sticky top-0 z-20 bg-[#f4f3f6] border-b border-gray-200">
            <div className="w-[300px] flex-shrink-0 border-r border-[#dcd9e3] px-4 flex items-center justify-between h-12">
              <span className="font-medium text-gray-800">Carers (7)</span>
              <ArrowDownUp className="w-4 h-4 text-gray-500" />
            </div>
            <div className="relative flex-1 h-12">
              {HOURS.map((h) => (
                <div key={h} className="absolute top-0 bottom-0" style={{ left: pct(h) }}>
                  <span className="absolute top-1/2 -translate-y-1/2 pl-1 text-xs text-gray-500 whitespace-nowrap">
                    {String(h % 24).padStart(2, '0')}:00
                  </span>
                </div>
              ))}
              <NowLine dot />
            </div>
          </div>

          {/* Carer rows */}
          {CARERS.map((carer) => (
            <CarerRow key={carer.name} carer={carer} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CarerRow({ carer }: { carer: Carer }) {
  return (
    <div className="flex border-b border-gray-100">
      {/* Name column */}
      <div className="w-[300px] flex-shrink-0 border-r border-[#dcd9e3] p-3 flex items-start justify-between">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="relative flex-shrink-0">
            <div
              className="w-9 h-9 rounded-full text-xs font-semibold flex items-center justify-center"
              style={{ backgroundColor: getAvatarColor(carer.name), color: '#1e293b' }}
            >
              {carer.initials}
            </div>
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                carer.dot === 'amber' ? 'bg-amber-400' : 'bg-green-500'
              }`}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-gray-900 truncate">{carer.name}</span>
              {carer.restriction && (
                <Tooltip text={carer.restriction.detail}>
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                </Tooltip>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
              <Car className="w-3.5 h-3.5" />
              {carer.restriction ? (
                <>
                  <Tooltip text={carer.restriction.detail}>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 cursor-pointer">
                      <AlertTriangle className="w-3 h-3" />
                      {carer.allocated} hrs
                    </span>
                  </Tooltip>
                  <span>/ 40 hrs sch.</span>
                </>
              ) : (
                <span>{carer.allocated} hrs / 40 hrs sch.</span>
              )}
            </div>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 flex-shrink-0" aria-label="Row actions">
          <EllipsisVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Timeline track */}
      <div className="relative flex-1 h-[72px]">
        <Gridlines />
        <NowLine />

        {/* Holiday */}
        {carer.holiday && (
          <div
            className="absolute top-3 h-12 rounded-lg border border-blue-200 bg-blue-50 flex items-center justify-center gap-2"
            style={{ left: pct(carer.holiday.start), width: pct(carer.holiday.end - carer.holiday.start) }}
          >
            <Plane className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Holiday</span>
          </div>
        )}

        {/* Visit cards */}
        {carer.cards.map((c, i) => (
          <VisitCardEl key={i} card={c} />
        ))}

        {/* Availability bars */}
        {carer.bars.map((b, i) => (
          <AvailabilityBar key={i} bar={b} />
        ))}
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<CardStatus, { bg: string; border: string; label: string; labelColor: string }> = {
  'in-progress': { bg: 'bg-green-50', border: '#16a34a', label: 'In Progress', labelColor: 'text-green-700' },
  booked: { bg: 'bg-white', border: '#a78bfa', label: 'Booked', labelColor: 'text-gray-500' },
  completed: { bg: 'bg-white', border: '#cbd5e1', label: 'Completed', labelColor: 'text-gray-400' },
};

function VisitCardEl({ card }: { card: VisitCard }) {
  const s = STATUS_STYLE[card.status];
  return (
    <div className="absolute top-3 h-12" style={{ left: pct(card.start), width: pct(card.end - card.start) }}>
      {/* Travel marker */}
      {card.travel && (
        <div className="absolute right-full top-1/2 -translate-y-1/2 flex items-center text-gray-300">
          <span className="w-px h-3 bg-gray-300" />
          <span className="w-2.5 h-px bg-gray-300" />
        </div>
      )}
      <div
        className={`h-full rounded-[7px] border border-gray-200 shadow-sm border-l-[5px] px-2 py-1 overflow-hidden relative ${s.bg}`}
        style={{ borderLeftColor: s.border }}
      >
        <div className="text-[13px] font-medium text-gray-900 truncate leading-tight">{card.title}</div>
        <div className={`text-[11px] truncate ${s.labelColor}`}>{s.label}</div>

        {card.rewind && (
          <span className="absolute bottom-0.5 right-0.5 text-orange-500">
            <ChevronsLeft className="w-3.5 h-3.5" />
          </span>
        )}
        {card.badge === 'people' && (
          <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgb(230,227,240)', border: '1px solid rgb(191,186,207)' }}>
            <Users className="w-2.5 h-2.5 text-gray-700" />
          </span>
        )}
      </div>
    </div>
  );
}

function AvailabilityBar({ bar }: { bar: AvailBar }) {
  const style: React.CSSProperties = { left: pct(bar.start), width: pct(bar.end - bar.start) };
  if (bar.color === 'green-striped') {
    const { border, fill } = BAR_PALETTE.green;
    style.backgroundImage = `repeating-linear-gradient(45deg, ${border} 0, ${border} 5px, ${fill} 5px, ${fill} 10px)`;
    style.border = `1px solid ${border}`;
  } else {
    const { border, fill } = BAR_PALETTE[bar.color];
    style.backgroundColor = fill;
    style.border = `1px solid ${border}`;
  }
  return <div className="absolute bottom-1.5 h-1.5 rounded-full" style={style} />;
}

function Gridlines() {
  return (
    <>
      {HOURS.map((h) => (
        <div
          key={h}
          className={`absolute top-0 bottom-0 w-px ${h % 2 === 0 ? 'bg-gray-200' : 'bg-gray-100'}`}
          style={{ left: pct(h) }}
        />
      ))}
    </>
  );
}

function NowLine({ dot }: { dot?: boolean }) {
  return (
    <div className="absolute top-0 bottom-0 w-px bg-[rgb(154,38,214)] z-10 pointer-events-none" style={{ left: pct(NOW) }}>
      {dot && <span className="absolute -top-1 -left-[3px] w-2 h-2 rounded-full bg-[rgb(154,38,214)]" />}
    </div>
  );
}

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="relative inline-flex items-center group/tip cursor-pointer">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full mt-1.5 z-50 w-64 rounded-md bg-white border border-gray-200 text-gray-700 text-sm leading-snug px-3 py-2 shadow-lg opacity-0 invisible transition-opacity duration-75 group-hover/tip:opacity-100 group-hover/tip:visible"
      >
        {text}
      </span>
    </span>
  );
}

function TabItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button
      className={`flex items-center gap-1.5 py-5 text-sm font-medium border-b-2 ${
        active
          ? 'text-gray-900 border-[rgb(154,38,214)]'
          : 'text-gray-500 border-transparent hover:text-gray-800'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function FilterPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="h-9 px-4 flex items-center gap-2 rounded-md border border-gray-300 bg-white text-sm text-gray-700">
      {icon}
      <span className="truncate">{label}</span>
      <ChevronDown className="w-4 h-4 opacity-50" />
    </div>
  );
}
