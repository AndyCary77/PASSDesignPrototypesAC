import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  FileText,
  CalendarDays,
  Palmtree,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertTriangle,
  Calendar,
  Info,
} from 'lucide-react';
import { PencilSolidIcon } from '../icons/PencilSolidIcon';
import { Button } from '../buttons/Button';
import { InfoBanner } from '../banners/InfoBanner';
import { SectionNav } from '../layout/SectionNav';
import { useScrollToHash } from '../../hooks/useScrollToHash';
import { useAvailabilityByCareType } from '../../data/RosterSettingsContext';
import { useInfoBarBottom } from '../../hooks/useInfoBarBottom';
import { AvailabilityModal, type AvailabilityChange } from './AvailabilityModal';
import {
  DAYS,
  availKey,
  getCareType,
  buildInitialAvailability,
  formatDuration,
  formatRange,
  slotsMinutes,
  type DayAvail,
  type TimeRange,
} from './availabilityData';

const NAV_ITEMS = [
  { id: 'contract-summary', label: 'Contract summary', Icon: FileText },
  { id: 'availability', label: 'Availability', Icon: CalendarDays },
  { id: 'holiday', label: 'Holiday', Icon: Palmtree },
];

// Availability repeats on a 1–4 week cycle; the cadence picked decides how many
// week blocks the pattern shows for review and editing.
const CADENCE_OPTIONS = [
  { weeks: 1, label: 'Weekly' },
  { weeks: 2, label: 'Bi-Weekly' },
  { weeks: 3, label: 'Tri-Weekly (3 weeks)' },
  { weeks: 4, label: 'Every 4 weeks' },
];

const SUMMARY_FIELDS = [
  { label: 'Contract start date', value: '07/11/2022' },
  { label: 'Employee start date', value: '07/11/2022' },
  { label: 'Contract type', value: 'Variable hours' },
  { label: 'Holiday scheme', value: 'flexible', note: '(Default for contract type)' },
];

// Working hours & Restrictions — constraints a coordinator must respect when rostering.
const RESTRICTION_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'benefits', label: 'Benefits-restricted' },
  { value: 'student-hep', label: 'Student visa – HEP' },
  { value: 'student-non-hep', label: 'Student visa – non-HEP' },
  { value: 'overseas-worker', label: 'Overseas worker' },
];

const BENEFITS_INFO =
  'It is the employer’s responsibility to ensure this employee does not work more than their weekly hours limit.';

type Constraints = {
  wtdOptOut: boolean;
  restriction: string;
  benefitsWeeklyLimit: number;
  studentHepLimit: number;
  studentNonHepLimit: number;
  secondaryJob: boolean;
  minHours: number;
  supplementaryCap: number;
};

// David's default configuration — drives the read-only view and seeds the edit form.
// He's a non-HEP student visa holder (10 hrs/wk term-time limit). Secondary-job rules apply to
// overseas workers only, so that section is hidden for him; the values below seed the edit form
// if the restriction is switched to Overseas worker.
// Statutory limits default to current values but are editable, so future legislation changes are easy to apply.
const DEFAULT_CONSTRAINTS: Constraints = {
  wtdOptOut: false,
  restriction: 'student-non-hep',
  benefitsWeeklyLimit: 16,
  studentHepLimit: 20,
  studentNonHepLimit: 10,
  secondaryJob: true, // Yes → supplementary cap applies
  minHours: 38,
  supplementaryCap: 20,
};

const STORAGE_KEY = 'david-contract-constraints';

function loadConstraints(): Constraints {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_CONSTRAINTS, ...JSON.parse(raw) };
  } catch {
    /* ignore malformed storage */
  }
  return DEFAULT_CONSTRAINTS;
}

function saveConstraints(next: Constraints) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore storage failures */
  }
}

const FINANCE_FIELDS = [
  { label: 'Pay rate sheet', value: 'EveryLife Care' },
  { label: 'Mode of transport', value: 'Driving' },
];

const HOLIDAY_STATS = [
  { label: 'Entitlement', value: '28 Days' },
  { label: 'Adjustment', value: '0 Days' },
  { label: 'Booked & taken', value: '2 Days' },
  { label: 'Remaining', value: '26 Days' },
];

export function EmployeeContractScreen() {
  const [activeNav, setActiveNav] = useState('contract-summary');
  const [editingSummary, setEditingSummary] = useState(false);
  const [constraints, setConstraints] = useState<Constraints>(loadConstraints);
  const availabilityByCareType = useAvailabilityByCareType();
  const [cadenceWeeks, setCadenceWeeks] = useState(4);
  // Selected availability days, keyed `${weekIndex}-${day}`. Keys for weeks
  // that no longer exist (cadence shortened) are ignored rather than cleared.
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [availability, setAvailability] = useState<Record<string, DayAvail>>(buildInitialAvailability);
  const [editAvailabilityOpen, setEditAvailabilityOpen] = useState(false);
  const activeSelection = [...selectedDays].filter((k) => Number(k.split('-')[0]) < cadenceWeeks);
  const applyAvailabilityChange = (change: AvailabilityChange) => {
    setAvailability((prev) => {
      const next = { ...prev };
      for (const key of activeSelection) {
        const day = { ...next[key] };
        if (change.regular !== undefined) day.regular = change.regular;
        if (change.optional !== undefined) day.optional = change.optional;
        next[key] = day;
      }
      return next;
    });
    setSelectedDays(new Set());
    setEditAvailabilityOpen(false);
  };
  // Clicking "+" on an empty day selects just that day and opens the modal.
  const addHoursForDay = (key: string) => {
    setSelectedDays(new Set([key]));
    setEditAvailabilityOpen(true);
  };
  const setWeekSelected = (weekIndex: number, selected: boolean) =>
    setSelectedDays((prev) => {
      const next = new Set(prev);
      for (const d of DAYS) {
        if (selected) next.add(availKey(weekIndex, d.short));
        else next.delete(availKey(weekIndex, d.short));
      }
      return next;
    });
  const toggleDay = (key: string) =>
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // The title row and left nav pin beneath AppShell's sticky info-bar. The
  // info-bar's real bottom edge is measured live (it shrinks on scroll), and
  // the title row's own height is measured so the nav can sit flush below it.
  const infoBarBottom = useInfoBarBottom();
  const titleRowRef = useRef<HTMLDivElement>(null);
  const [titleRowHeight, setTitleRowHeight] = useState(0);
  useEffect(() => {
    const el = titleRowRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTitleRowHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const stickyOffset = infoBarBottom + titleRowHeight;
  useScrollToHash(titleRowHeight > 0 && infoBarBottom > 0);
  const sectionStyle = { scrollMarginTop: stickyOffset + 16 };

  const handleSaveConstraints = (next: Constraints) => {
    setConstraints(next);
    saveConstraints(next);
    setEditingSummary(false);
  };

  return (
    <div>
      {/* Breadcrumb */}
      <ul className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <li>
          <button className="text-[rgb(154,38,214)] hover:underline cursor-pointer">Employees</button>
        </li>
        <li className="text-gray-300">/</li>
        <li className="text-gray-700">Mr David Buckowski</li>
      </ul>

      {/* Title + actions */}
      {/* Pinned flush beneath the info-bar, on an opaque page-coloured shell so
          content scrolling underneath doesn't show through. */}
      <div
        ref={titleRowRef}
        className="sticky z-30 bg-gray-50 pt-4 pb-4 mb-6 border-b border-gray-200"
        style={{ top: infoBarBottom }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Employee Contract</h3>
          <div className="flex items-center gap-4">
            <Button variant="secondary">Add version</Button>
            <Button disabled>Save</Button>
          </div>
        </div>
      </div>

      <div className="flex gap-8 items-start">
        {/* Left nav */}
        <SectionNav
          items={NAV_ITEMS}
          activeId={activeNav}
          onSelect={setActiveNav}
          top={stickyOffset + 24}
          ariaLabel="Contract sections"
        />

        {/* Content blocks */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Version selector — above the contract content */}
          <button className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-[10px] text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
            <span>v1 09/01/2024, 09:42 (active)</span>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>

          {/* Contract summary */}
          <section
            id="contract-summary"
            className="bg-white rounded-[10px] border border-gray-200 p-6"
          style={sectionStyle}
          >
            {editingSummary ? (
              <ContractSummaryEdit
                constraints={constraints}
                onSave={handleSaveConstraints}
                onClose={() => setEditingSummary(false)}
              />
            ) : (
              <>
                <div className="flex items-start justify-between mb-5">
                  <h4 className="text-xl font-semibold text-gray-900">Mr David Buckowski contract summary</h4>
                  <Button
                    variant="tertiary"
                    size="sm"
                    iconOnly
                    onClick={() => setEditingSummary(true)}
                    className="flex-shrink-0"
                    aria-label="Edit contract summary"
                  >
                    <PencilSolidIcon className="w-4 h-4" />
                  </Button>
                </div>

                <dl className="space-y-4">
                  {SUMMARY_FIELDS.map((f) => (
                    <SummaryRow key={f.label} label={f.label} value={f.value} note={f.note} />
                  ))}
                </dl>

                <div className="mt-6 py-5 border-y border-gray-200">
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
                    Working hours &amp; Restrictions
                  </p>
                  <dl className="space-y-4">
                    <SummaryRow label="Preferred hours per week" value="40 hours" />
                    <SummaryRow
                      label="Working time directive opt-out"
                      value={constraints.wtdOptOut ? 'Yes' : 'No'}
                    />
                    <RestrictionReadRow constraints={constraints} />
                    {/* Secondary job applies to overseas workers only */}
                    {constraints.restriction === 'overseas-worker' && (
                      <ConstraintRow
                        label="Secondary job"
                        value={constraints.secondaryJob ? 'Yes' : 'No'}
                        active={constraints.secondaryJob}
                        thresholds={
                          constraints.secondaryJob
                            ? [{ label: 'Supplementary cap', value: `${constraints.supplementaryCap} hrs/week` }]
                            : [{ label: 'Minimum hours', value: `${constraints.minHours} hrs/week` }]
                        }
                      />
                    )}
                  </dl>
                </div>

                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mt-6 mb-4">
                  Finance
                </p>
                <dl className="space-y-4">
                  {FINANCE_FIELDS.map((f) => (
                    <SummaryRow key={f.label} label={f.label} value={f.value} />
                  ))}
                </dl>
              </>
            )}
          </section>

          {/* Availability */}
          <section
            id="availability"
            className="bg-white rounded-[10px] border border-gray-200 p-6"
          style={sectionStyle}
          >
            <div className="mb-5">
              <h4 className="text-xl font-semibold text-gray-900">Availability</h4>
              <p className="text-base text-gray-600 mt-0.5">
                Select days and times employee is expected to be available
              </p>
            </div>

            {/* Cadence */}
            <div className="mb-6 max-w-xs">
              <label className="block text-base font-medium text-gray-700 mb-2">Cadence</label>
              <div className="relative">
                <select
                  value={cadenceWeeks}
                  onChange={(e) => setCadenceWeeks(Number(e.target.value))}
                  className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-md text-base bg-white pr-9"
                >
                  {CADENCE_OPTIONS.map((o) => (
                    <option key={o.weeks} value={o.weeks}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <InfoBanner className="mb-5">
              <p>Click the days or select weeks you wish to edit</p>
              {/* Pointer for offices where the setting is still off, so it can be found from here. */}
              {!availabilityByCareType && (
                <p className="mt-1">
                  Do they work blocks of different care types, like homecare weeks then live-in weeks?{' '}
                  <Link
                    to="/office/roster-settings#availability-by-care-type"
                    className="font-semibold text-[rgb(154,38,214)] underline underline-offset-2 hover:opacity-80"
                  >
                    Turn on availability by care type in Roster Settings
                  </Link>
                </p>
              )}
            </InfoBanner>

            {Array.from({ length: cadenceWeeks }, (_, i) => (
              <WeekBlock
                key={i}
                title={`Week ${i + 1}`}
                current={i === Math.min(1, cadenceWeeks - 1)}
                weekIndex={i}
                availability={availability}
                onAddHours={addHoursForDay}
                onSetWeek={setWeekSelected}
                selectedDays={selectedDays}
                onToggleDay={toggleDay}
              />
            ))}

            {/* Appears once any day is selected; sticks to the bottom of the
                viewport so it's reachable from whichever week the selection
                was made in. */}
            {activeSelection.length > 0 && (
              <div className="sticky bottom-4 z-20 mb-4 flex items-center justify-between gap-4 rounded-[10px] border-2 border-[rgb(154,38,214)] bg-white px-4 py-3 shadow-md">
                <span className="text-base font-semibold text-gray-900">
                  {activeSelection.length} {activeSelection.length === 1 ? 'day' : 'days'} selected
                </span>
                <div className="flex items-center gap-3">
                  <Button variant="tertiary" onClick={() => setSelectedDays(new Set())}>
                    Clear selection
                  </Button>
                  <Button onClick={() => setEditAvailabilityOpen(true)}>Edit availability</Button>
                </div>
              </div>
            )}

            <AvailabilityModal
              open={editAvailabilityOpen && activeSelection.length > 0}
              onOpenChange={setEditAvailabilityOpen}
              selectedKeys={activeSelection}
              availability={availability}
              onConfirm={applyAvailabilityChange}
              showCareTypes={availabilityByCareType}
            />

          </section>

          {/* Holiday */}
          <section
            id="holiday"
            className="bg-white rounded-[10px] border border-gray-200 p-6"
          style={sectionStyle}
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h4 className="text-xl font-semibold text-gray-900">Holiday</h4>
              <dl className="flex flex-wrap gap-x-8 gap-y-2">
                {HOLIDAY_STATS.map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <dt className="text-base text-gray-600">{s.label}</dt>
                    <dd className="text-base font-semibold text-gray-900">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Renewal year controls */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-base font-medium text-gray-700">01/04/26 - 31/03/27</span>
              <button
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Adjustments table */}
            <div className="border border-gray-200 rounded-[10px] overflow-hidden">
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-600">
                    <th className="px-4 py-3 font-medium">Adjustment +/-</th>
                    <th className="px-4 py-3 font-medium">Reason</th>
                    <th className="px-4 py-3 font-medium">Date added</th>
                    <th className="px-4 py-3" />
                    <th className="px-4 py-3 w-12 text-right">
                      <button className="text-[rgb(154,38,214)] hover:opacity-80 cursor-pointer" aria-label="Add adjustment">
                        <Plus className="w-5 h-5" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-base italic text-gray-600">
                      No adjustments recorded.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex gap-8">
      <dt className="text-base text-gray-600 w-72 flex-shrink-0">{label}</dt>
      <dd className="text-base text-gray-900">
        {value}
        {note && <div className="text-sm text-gray-600">{note}</div>}
      </dd>
    </div>
  );
}

function ConstraintRow({
  label,
  value,
  active,
  thresholds,
  info,
}: {
  label: string;
  value: string;
  active?: boolean;
  thresholds?: Array<{ label: string; value: string }>;
  info?: string;
}) {
  return (
    <div className="flex gap-8">
      <dt className="text-base text-gray-600 w-72 flex-shrink-0">{label}</dt>
      <dd className="flex-1 min-w-0">
        {active ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            {value}
          </span>
        ) : (
          <span className="text-base text-gray-900">{value}</span>
        )}

        {thresholds && thresholds.length > 0 && (
          <ul className="mt-2.5 space-y-1.5 border-l-2 border-amber-200 pl-3 max-w-sm">
            {thresholds.map((t) => (
              <li key={t.label} className="flex items-center justify-between gap-4 text-sm">
                <span className="flex items-center gap-1 text-gray-600">
                  {t.label}
                  {info && <InfoIcon text={info} />}
                </span>
                <span className="font-semibold text-gray-900">{t.value}</span>
              </li>
            ))}
          </ul>
        )}
      </dd>
    </div>
  );
}

function RestrictionReadRow({ constraints }: { constraints: Constraints }) {
  const r = RESTRICTION_OPTIONS.find((o) => o.value === constraints.restriction);
  if (!r || r.value === 'none') {
    return <SummaryRow label="Employment restriction" value="None" />;
  }

  let thresholds: Array<{ label: string; value: string }> | undefined;
  let info: string | undefined;
  if (r.value === 'benefits') {
    thresholds = [{ label: 'Weekly limit', value: `${constraints.benefitsWeeklyLimit} hours` }];
    info = BENEFITS_INFO;
  } else if (r.value === 'student-hep') {
    thresholds = [{ label: 'Term-time limit', value: `${constraints.studentHepLimit} hrs/week` }];
  } else if (r.value === 'student-non-hep') {
    thresholds = [{ label: 'Term-time limit', value: `${constraints.studentNonHepLimit} hrs/week` }];
  }

  return <ConstraintRow label="Employment restriction" value={r.label} active thresholds={thresholds} info={info} />;
}

function InfoIcon({ text }: { text: string }) {
  return (
    <span title={text} className="inline-flex text-gray-400 hover:text-gray-600 cursor-help align-middle">
      <Info className="w-4 h-4" />
    </span>
  );
}

function ContractSummaryEdit({
  constraints,
  onSave,
  onClose,
}: {
  constraints: Constraints;
  onSave: (next: Constraints) => void;
  onClose: () => void;
}) {
  const [wtdOptOut, setWtdOptOut] = useState(constraints.wtdOptOut);
  const [restriction, setRestriction] = useState(constraints.restriction);
  const [secondaryJob, setSecondaryJob] = useState(constraints.secondaryJob);
  const [benefitsWeeklyLimit, setBenefitsWeeklyLimit] = useState(constraints.benefitsWeeklyLimit);
  const [studentHepLimit, setStudentHepLimit] = useState(constraints.studentHepLimit);
  const [studentNonHepLimit, setStudentNonHepLimit] = useState(constraints.studentNonHepLimit);
  const [minHours, setMinHours] = useState(constraints.minHours);
  const [supplementaryCap, setSupplementaryCap] = useState(constraints.supplementaryCap);

  const selectedRestriction = RESTRICTION_OPTIONS.find((o) => o.value === restriction);

  const handleSave = () =>
    onSave({
      wtdOptOut,
      restriction,
      benefitsWeeklyLimit,
      studentHepLimit,
      studentNonHepLimit,
      secondaryJob,
      minHours,
      supplementaryCap,
    });

  return (
    <div>
      <h4 className="text-xl font-semibold text-gray-900 mb-5">
        Edit active contract version for Mr David Buckowski
      </h4>

      {/* Active-version warning */}
      <div className="flex gap-3 items-start bg-amber-50 border border-amber-200 rounded-[10px] p-4 mb-6">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 leading-relaxed">
          Warning, editing an active version of this employee&rsquo;s contract could impact their
          holiday entitlement and pay. Please add a new version to manage changes in contract type,
          contracted hours per week or holiday entitlement.
        </p>
      </div>

      <div className="space-y-5 max-w-md">
        <EditField label="Contract start date" required>
          <DateInput value="07/11/2022" disabled />
        </EditField>

        <EditField label="Employee start date" required>
          <DateInput value="07/11/2022" />
        </EditField>

        <EditField label="Employee finish date">
          <DateInput value="" clearable />
        </EditField>

        <EditField label="Contract type" required>
          <SelectInput options={['Variable hours', 'Fixed hours', 'Zero hours']} />
        </EditField>
      </div>

      {/* Working hours & Restrictions */}
      <div className="mt-6 py-5 border-y border-gray-200 space-y-5">
        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Working hours &amp; Restrictions
        </p>

        <EditField label="Preferred hours per week">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={40}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-base"
              />
              <span className="text-base text-gray-600">Hours</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={0}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-base"
              />
              <span className="text-base text-gray-600">Mins</span>
            </div>
          </div>
        </EditField>

        <fieldset>
          <legend className="text-base font-medium text-gray-700 mb-2">
            Have they opted out of the working time directive?
          </legend>
          <RadioPair name="wtd-opt-out" value={wtdOptOut} onChange={setWtdOptOut} />
        </fieldset>

        {/* Employment restriction — above secondary job */}
        <EditField label="Employment restriction">
          <div className="max-w-md">
            <SelectInput
              options={RESTRICTION_OPTIONS.map((o) => o.label)}
              value={selectedRestriction?.label}
              onChange={(label) => {
                const next = RESTRICTION_OPTIONS.find((o) => o.label === label);
                if (next) setRestriction(next.value);
              }}
            />
          </div>

          {restriction === 'benefits' && (
            <div className="mt-3 border-l-2 border-amber-200 pl-4 max-w-md">
              <label className="flex items-center gap-1 text-base font-medium text-gray-700 mb-2">
                Weekly hours limit
                <InfoIcon text={BENEFITS_INFO} />
              </label>
              <HoursInput value={benefitsWeeklyLimit} onChange={setBenefitsWeeklyLimit} />
            </div>
          )}

          {restriction === 'student-hep' && (
            <div className="mt-3 border-l-2 border-amber-200 pl-4 max-w-md">
              <EditField label="Term-time limit">
                <HoursInput value={studentHepLimit} onChange={setStudentHepLimit} />
              </EditField>
            </div>
          )}

          {restriction === 'student-non-hep' && (
            <div className="mt-3 border-l-2 border-amber-200 pl-4 max-w-md">
              <EditField label="Term-time limit">
                <HoursInput value={studentNonHepLimit} onChange={setStudentNonHepLimit} />
              </EditField>
            </div>
          )}
        </EditField>

        {/* Secondary job — overseas workers only */}
        {restriction === 'overseas-worker' && (
          <fieldset>
            <legend className="text-base font-medium text-gray-700 mb-2">Secondary job</legend>
            <RadioPair name="secondary-job" value={secondaryJob} onChange={setSecondaryJob} />

            <div className="mt-4 border-l-2 border-amber-200 pl-4 max-w-md">
              {secondaryJob ? (
                <EditField label="Supplementary cap">
                  <HoursInput value={supplementaryCap} onChange={setSupplementaryCap} />
                </EditField>
              ) : (
                <EditField label="Minimum hours">
                  <HoursInput value={minHours} onChange={setMinHours} />
                </EditField>
              )}
            </div>
          </fieldset>
        )}
      </div>

      {/* Holiday scheme */}
      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mt-6 mb-4">
        Holiday scheme
      </p>
      <div className="max-w-md">
        <EditField label="Holiday scheme" required>
          <SelectInput options={['flexible (Default)', 'fixed', 'accrued']} />
          <p className="text-sm text-gray-600 mt-2">
            (Default) indicates a scheme that is linked to the selected contract type
          </p>
        </EditField>
      </div>

      {/* Finance */}
      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mt-6 mb-4">
        Finance
      </p>
      <div className="space-y-5 max-w-md">
        <EditField label="Select pay rate sheet" required>
          <SelectInput options={['EveryLife Care', 'North Tyneside', 'South Tyneside']} />
        </EditField>
        <EditField label="Default mode of transport" required>
          <SelectInput options={['Driving', 'Walking', 'Public transport', 'Cycling']} />
        </EditField>
        <EditField label="Payroll ID">
          <input
            type="text"
            maxLength={50}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
          />
        </EditField>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-8">
        <Button variant="tertiary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
}

function EditField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1 text-base font-medium text-gray-700 mb-2">
        {required && <span className="text-red-500">*</span>}
        {label}
      </label>
      {children}
    </div>
  );
}

function DateInput({ value, disabled, clearable }: { value: string; disabled?: boolean; clearable?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex items-center gap-2 border rounded-md px-3 py-2 flex-1 ${
          disabled ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'
        }`}
      >
        <input
          type="text"
          defaultValue={value}
          placeholder="Select"
          disabled={disabled}
          className="flex-1 min-w-0 outline-none bg-transparent text-base disabled:text-gray-600"
        />
        <Calendar className="w-4 h-4 text-gray-600 flex-shrink-0" />
      </div>
      {clearable && (
        <button type="button" className="text-sm font-medium text-[rgb(154,38,214)] hover:underline cursor-pointer">
          Clear
        </button>
      )}
    </div>
  );
}

function SelectInput({
  options,
  value,
  onChange,
}: {
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={onChange ? value : undefined}
        defaultValue={onChange ? undefined : value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-md text-base bg-white pr-9"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 text-gray-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

function HoursInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-base"
      />
      <span className="text-base text-gray-600">hrs/week</span>
    </div>
  );
}

function RadioPair({
  name,
  value,
  onChange,
}: {
  name: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex gap-6">
      <label className="flex items-center gap-2 text-base text-gray-900 cursor-pointer">
        <input
          type="radio"
          name={name}
          checked={!value}
          onChange={() => onChange(false)}
          className="accent-[rgb(154,38,214)]"
        />
        No
      </label>
      <label className="flex items-center gap-2 text-base text-gray-900 cursor-pointer">
        <input
          type="radio"
          name={name}
          checked={value}
          onChange={() => onChange(true)}
          className="accent-[rgb(154,38,214)]"
        />
        Yes
      </label>
    </div>
  );
}

function WeekBlock({
  title,
  current,
  weekIndex,
  availability,
  selectedDays,
  onToggleDay,
  onAddHours,
  onSetWeek,
}: {
  title: string;
  current?: boolean;
  weekIndex: number;
  availability: Record<string, DayAvail>;
  selectedDays: Set<string>;
  onToggleDay: (key: string) => void;
  onAddHours: (key: string) => void;
  onSetWeek: (weekIndex: number, selected: boolean) => void;
}) {
  const showCareTypes = useAvailabilityByCareType();
  const weekAllSelected = DAYS.every((d) => selectedDays.has(availKey(weekIndex, d.short)));
  // Distinct care types worked this week, in the order they first appear
  const weekCareTypes = [
    ...new Set(
      DAYS.flatMap((d) => {
        const a = availability[availKey(weekIndex, d.short)];
        return [...(a?.regular ?? []), ...(a?.optional ?? [])].map((r) => r.careType);
      }),
    ),
  ].map(getCareType);
  const regularMinutes = DAYS.reduce((sum, d) => sum + slotsMinutes(availability[availKey(weekIndex, d.short)]?.regular), 0);
  const optionalMinutes = DAYS.reduce((sum, d) => sum + slotsMinutes(availability[availKey(weekIndex, d.short)]?.optional), 0);
  return (
    <div
      className={`mb-6 ${
        current ? 'rounded-[10px] border border-gray-300 bg-[#F5F4F7] p-4' : ''
      }`}
    >
      <div
        className={`flex flex-wrap items-center justify-between gap-2 ${
          current ? 'mb-5 border-b border-gray-300 pb-3' : 'mb-3'
        }`}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* Current week gets a filled pill label, matching the live app */}
          <div
            className={`text-lg font-semibold ${
              current ? 'rounded-full bg-[#DCD9E4] px-4 py-1 text-gray-800' : 'text-gray-900'
            }`}
          >
            {title}
            {current && <span className="ml-2 text-base font-normal text-gray-800">(current week)</span>}
          </div>
          {/* Care types worked this week — makes a 2-weeks-one-type / 2-weeks-another pattern scannable */}
          {showCareTypes && weekCareTypes.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: c.colour }} />
              {c.label}
            </span>
          ))}
          <Button variant="tertiary" size="sm" onClick={() => onSetWeek(weekIndex, !weekAllSelected)}>
            {weekAllSelected ? 'Deselect week' : 'Select week'}
          </Button>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-base text-gray-600">
          <span><b className="font-semibold">Total available:</b> {formatDuration(regularMinutes + optionalMinutes)}</span>
          <span><b className="font-semibold">Optional hrs:</b> {optionalMinutes ? formatDuration(optionalMinutes) : 0}</span>
          <span><b className="font-semibold">Contracted hrs:</b> 40 hours</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {DAYS.map((d) => {
          const key = availKey(weekIndex, d.short);
          return (
            <DayCard
              key={d.short}
              day={d.short}
              avail={availability[key] ?? {}}
              weekLabel={title}
              selected={selectedDays.has(key)}
              onToggle={() => onToggleDay(key)}
              onAddHours={() => onAddHours(key)}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * One slot as a single tinted pill: care type (dot + name) over the time.
 * The tint is the care type's colour, kept light enough for dark text to hold
 * AA contrast, and the name + dot mean colour is never the only signal.
 * Optional overtime keeps its dashed outline (and a lighter tint) so it still
 * reads as different from regular hours.
 */
function SlotBlock({ slot, optional }: { slot: TimeRange; optional?: boolean }) {
  const showCareTypes = useAvailabilityByCareType();
  const care = getCareType(slot.careType);
  // Availability by care type is off for this office: a plain time pill, as
  // before. The slot's care type is kept, just not shown, so it comes back if
  // the setting is turned back on.
  if (!showCareTypes) {
    return (
      <div
        className={`w-full rounded-full px-3 text-base font-semibold text-gray-900 whitespace-nowrap ${
          optional ? 'border-2 border-dashed border-[#9b97b3] bg-white py-1' : 'bg-[#DCD9E4] py-1.5'
        }`}
      >
        {formatRange(slot)}
      </div>
    );
  }
  return (
    <div
      className={`w-full rounded-2xl px-2 text-gray-900 whitespace-nowrap flex flex-col items-center leading-tight ${
        optional ? 'border-2 border-dashed py-1' : 'py-1.5'
      }`}
      style={{
        backgroundColor: `${care.colour}${optional ? '14' : '2E'}`,
        borderColor: optional ? care.colour : undefined,
      }}
    >
      <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
        <span
          aria-hidden="true"
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: care.colour }}
        />
        {care.label}
      </span>
      <span className="text-base font-semibold">{formatRange(slot)}</span>
    </div>
  );
}

function DayCard({
  day,
  avail,
  weekLabel,
  selected,
  onToggle,
  onAddHours,
}: {
  day: string;
  avail: DayAvail;
  weekLabel: string;
  selected: boolean;
  onToggle: () => void;
  onAddHours: () => void;
}) {
  const regularSlots = avail.regular ?? [];
  const optionalSlots = avail.optional ?? [];
  const hasHours = regularSlots.length > 0 || optionalSlots.length > 0;
  return (
    <div
      onClick={onToggle}
      className={`group relative rounded-[10px] border-2 p-3 min-h-[180px] flex flex-col items-center text-center cursor-pointer transition-colors hover:border-[rgb(154,38,214)] ${
        selected
          ? 'border-[rgb(154,38,214)] bg-[rgba(154,38,214,0.05)]'
          : `bg-white ${hasHours ? 'border-[#9b97b3]' : 'border-[#cfcddb]'}`
      }`}
    >
      {/* Radio — revealed on hover/focus, always shown once selected */}
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        aria-label={`Select ${day}, ${weekLabel}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`absolute top-3 left-3 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white cursor-pointer outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50 ${
          selected
            ? 'border-[rgb(154,38,214)] opacity-100'
            : 'border-gray-400 opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
        }`}
      >
        {selected && <span className="h-3 w-3 rounded-full bg-[rgb(154,38,214)]" />}
      </button>

      <span className={`text-lg font-semibold mb-2 ${hasHours ? 'text-gray-900' : 'text-gray-500'}`}>
        {day}
      </span>
      {hasHours ? (
        <div className="w-full space-y-2">
          {regularSlots.length > 0 && (
            <div>
              <div className="text-base text-gray-900 mb-1">Regular hours</div>
              <div className="space-y-2">
                {regularSlots.map((r, i) => (
                  <SlotBlock key={i} slot={r} />
                ))}
              </div>
            </div>
          )}
          {optionalSlots.length > 0 && (
            <div>
              <div className="text-base text-gray-900 mb-1">Optional overtime</div>
              <div className="space-y-2">
                {optionalSlots.map((r, i) => (
                  <SlotBlock key={i} slot={r} optional />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <Button
            variant="tertiary"
            iconOnly
            aria-label={`Add hours for ${day}`}
            onClick={(e) => {
              e.stopPropagation();
              onAddHours();
            }}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
