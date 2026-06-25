import { useState } from 'react';
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

const NAV_ITEMS = [
  { id: 'contract-summary', label: 'Contract summary', Icon: FileText },
  { id: 'availability', label: 'Availability', Icon: CalendarDays },
  { id: 'holiday', label: 'Holiday', Icon: Palmtree },
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

type Day = { day: string; hours?: string };

const WEEK: Day[] = [
  { day: 'Mon', hours: '08:00 – 11:00' },
  { day: 'Tue', hours: '07:00 – 17:30' },
  { day: 'Wed', hours: '07:00 – 17:30' },
  { day: 'Thu', hours: '07:00 – 17:30' },
  { day: 'Fri', hours: '07:00 – 17:30' },
  { day: 'Sat', hours: '07:00 – 10:00' },
  { day: 'Sun' },
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
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Employee Contract</h3>
        <div className="flex items-center gap-4">
          <button className="border border-[rgb(154,38,214)] text-[rgb(154,38,214)] hover:bg-purple-50 px-5 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer">
            Add version
          </button>
          <button
            disabled
            className="bg-gray-200 text-gray-600 px-6 py-2 rounded-full text-sm font-semibold cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex gap-8 items-start">
        {/* Left nav */}
        <div className="w-60 flex-shrink-0 sticky top-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ id, label, Icon }) => {
              const isActive = activeNav === id;
              return (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={() => setActiveNav(id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-purple-50 text-[rgb(154,38,214)]'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

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
            className="bg-white rounded-[10px] border border-gray-200 p-6 scroll-mt-4"
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
                  <button
                    onClick={() => setEditingSummary(true)}
                    className="flex-shrink-0 p-2 text-gray-600 hover:text-gray-900 rounded-full border border-gray-200 transition-colors cursor-pointer"
                    style={{ backgroundColor: 'rgb(220, 217, 228)' }}
                    aria-label="Edit contract summary"
                  >
                    <PencilSolidIcon className="w-4 h-4" />
                  </button>
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
            className="bg-white rounded-[10px] border border-gray-200 p-6 scroll-mt-4"
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
                <select className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-md text-base bg-white pr-9">
                  <option>Bi-Weekly</option>
                  <option>Weekly</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <WeekBlock title="Week 1" />
            <WeekBlock title="Week 2" current />

            <div className="mt-2">
              <button className="border border-[rgb(154,38,214)] text-[rgb(154,38,214)] hover:bg-purple-50 px-5 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer">
                Multiselect
              </button>
            </div>
          </section>

          {/* Holiday */}
          <section
            id="holiday"
            className="bg-white rounded-[10px] border border-gray-200 p-6 scroll-mt-4"
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
        <button
          onClick={onClose}
          className="text-gray-700 px-6 py-2 rounded-full text-sm font-semibold cursor-pointer"
          style={{ backgroundColor: 'rgb(237, 236, 241)' }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="bg-[rgb(154,38,214)] hover:bg-[rgb(134,28,194)] text-white px-8 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer"
        >
          Save
        </button>
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

function WeekBlock({ title, current }: { title: string; current?: boolean }) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="text-lg font-semibold text-gray-900">
          {title}
          {current && <span className="ml-2 text-base font-normal text-[rgb(154,38,214)]">(current week)</span>}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-base text-gray-600">
          <span><b className="font-semibold">Total available:</b> 48 hours</span>
          <span><b className="font-semibold">Optional hrs:</b> 0</span>
          <span><b className="font-semibold">Contracted hrs:</b> 40 hours</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {WEEK.map((d) => (
          <DayCard key={d.day} day={d.day} hours={d.hours} />
        ))}
      </div>
    </div>
  );
}

function DayCard({ day, hours }: { day: string; hours?: string }) {
  return (
    <div
      className={`rounded-[10px] border p-3 min-h-[110px] flex flex-col ${
        hours ? 'border-gray-200 bg-white' : 'border-dashed border-gray-300 bg-gray-50'
      }`}
    >
      <span className="inline-block self-start px-2.5 py-0.5 rounded-full text-sm font-semibold bg-purple-50 text-[rgb(154,38,214)] mb-2">
        {day}
      </span>
      {hours ? (
        <div className="flex-1">
          <div className="text-sm text-gray-600">Regular hours</div>
          <div className="text-base font-medium text-gray-900">{hours}</div>
        </div>
      ) : (
        <button className="flex-1 flex items-center justify-center text-gray-600 hover:text-[rgb(154,38,214)] cursor-pointer">
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
