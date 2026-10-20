import { useEffect, useRef, useState, type ComponentType, type KeyboardEvent, type ReactNode } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Info, TriangleAlert } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '../buttons/Button';
import { InfoBanner } from '../banners/InfoBanner';
import { EditSlideout } from '../layout/EditSlideout';
import { useOffice } from '../office/OfficeContext';
import { useFeatureFlag } from '../../data/FeatureFlagsContext';
import {
  eventTypeKey,
  useRosterSettings,
  useVisitTypes,
  visitTypeKey,
  type AdvancedSettingKey,
  type AdvancedSettings,
  type TableSettings,
  type TypeOverride,
  type TypeOverrides,
} from '../../data/RosterSettingsContext';
import { SegmentedToggle } from '../buttons/SegmentedToggle';
import {
  CARE_TYPES,
  AVAILABILITY_TYPE_COLOURS,
  uncoveredVisitTypeIds,
  type AvailabilityType,
} from '../employee/availabilityData';
import { PencilSolidIcon } from '../icons/PencilSolidIcon';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { SectionNav, type SectionNavItem } from '../layout/SectionNav';
import { useInfoBarBottom } from '../../hooks/useInfoBarBottom';
import { useActiveSection } from '../../hooks/useActiveSection';
import { useScrollToHash } from '../../hooks/useScrollToHash';

import {
  AdvancedSettingsIcon,
  CancellationReasonsIcon,
  ChargingIcon,
  CommunicationsIcon,
  ContractsIcon,
  ExpenseTypesIcon,
  HolidaysIcon,
  OfficeCalendarIcon,
  TimeThresholdsIcon,
  VisitTypesIcon,
} from './RosterSettingsIcons';

// ─── Data (mirrors the live Roster Settings screen) ──────────────────────────

const EVENT_TYPES = [
  { name: 'Training', description: 'Training and qualifications for employees', payEmployee: true, payMileage: true, payTravelTime: true, holidayPay: true, colour: '#BE409D', custom: false },
  { name: 'Staff meeting', description: 'General staff meetings', payEmployee: true, payMileage: true, payTravelTime: true, holidayPay: true, colour: '#778500', custom: false },
  { name: 'Supervision', description: 'Employee appraisals and 1-2-1s', payEmployee: true, payMileage: true, payTravelTime: true, holidayPay: true, colour: '#CD4B00', custom: false },
  { name: 'Admin Time', description: 'Admin Time for care staff', payEmployee: false, payMileage: false, payTravelTime: false, holidayPay: true, colour: null as string | null, custom: true },
];

const yesNo = (v: boolean) => (v ? 'Yes' : 'No');

/** Event types with any edits applied (read view and slide-out share this). */
function applyEventOverrides(o: TypeOverrides) {
  return EVENT_TYPES.map((e) => {
    const ov = o[eventTypeKey(e.name)] ?? {};
    return {
      ...e,
      payEmployee: ov.payEmployee ?? e.payEmployee,
      payMileage: ov.payMileage ?? e.payMileage,
      payTravelTime: ov.payTravelTime ?? e.payTravelTime,
      holidayPay: ov.includeInHolidayPay ?? e.holidayPay,
      enabled: ov.enabled ?? true,
    };
  });
}

const CONTRACT_TYPES = [
  {
    name: 'Salary',
    colour: '#3A72E9',
    description: 'Full-time salaried staff, paid based on contracted hours',
    details: [
      ['What mileage will be paid?', 'None'],
      ['Travel time', 'None'],
      ['Overtime', 'Yes'],
      ['Expense pay', 'Yes'],
      ['Holiday scheme', 'n/a'],
    ],
    enabled: 'Yes',
  },
  {
    name: 'Fixed hours',
    colour: '#9853D0',
    description: 'Guaranteed hours per week',
    details: [
      ['What mileage will be paid?', 'None'],
      ['Travel time', 'None'],
      ['Overtime', 'Yes'],
      ['Expense pay', 'Yes'],
      ['Holiday scheme', 'n/a'],
      ['Calculate holiday pay', 'No'],
    ],
    enabled: 'Yes',
  },
  {
    name: 'Variable hours',
    colour: '#009997',
    description: 'Variable hours per week',
    details: [
      ['What mileage will be paid?', 'None'],
      ['Travel time', 'None'],
      ['Overtime', 'Yes'],
      ['Expense pay', 'Yes'],
      ['Holiday scheme', 'n/a'],
      ['Calculate holiday pay', 'No'],
    ],
    enabled: 'Yes',
  },
];

const SAGE_ROWS = ['Visit / Event pay', 'Mileage', 'Travel time', 'Expenses', 'Holiday pay'];

type Field = { label: string; value: string; required?: boolean };
/** `editable`: this block has its own edit button (Communications), rather than one per section. */
type Block = { title: string; helper?: string[]; fields: Field[]; editable?: boolean };

const CONTRACTS_BLOCKS_TOP: Block[] = [
  {
    title: 'Travel time and mileage pay',
    fields: [
      { label: 'Travel time pay', required: true, value: 'Set the same rate of pay for travel time for all employees on the contract type' },
      { label: 'Mileage pay', required: true, value: 'Set the same rate of pay for mileage for all employees on the contract type' },
    ],
  },
  {
    title: 'Mileage and travel between visits crossing midnight',
    fields: [{ label: 'Pay mileage and travel between visits crossing midnight', required: true, value: 'No' }],
  },
];

const CONTRACTS_BLOCKS_BOTTOM: Block[] = [
  {
    title: 'Basis for paying non-salaried employees',
    helper: ['Select the basis for paying employees on variable and fixed hour contacts'],
    fields: [{ label: 'Pay method', required: true, value: 'Planned time' }],
  },
  {
    title: 'Pay rate calculation',
    helper: ['Select how the visit pay will be calculated according to the visit time'],
    fields: [{ label: 'Pay rate calculation', required: true, value: 'Change the rate according to the time period' }],
  },
  {
    title: 'Flat pay rate calculation',
    helper: ['Select how the visit pay will be calculated according to the visit time for flat rates'],
    fields: [{ label: 'Pay rate calculation', required: true, value: 'Only use the rate applicable at the start time of the visit' }],
  },
  {
    title: 'Basis for calculating and paying travel time',
    helper: [
      'Select the basis for calculating and paying travel time for your employees, this will also impact travel time warnings the daily schedule. Google maps calculates based on travel method and current traffic conditions',
    ],
    fields: [{ label: 'Basis for calculating and paying travel time', required: true, value: 'Google maps' }],
  },
  {
    title: 'Basis for how visits are included in a gross pay advice cycle',
    helper: ['Choose the start or end time to determine which gross pay advice cycle applies'],
    fields: [{ label: 'Basis', required: true, value: 'Start time' }],
  },
  {
    title: 'Gross Pay Advice number',
    helper: ['Set the Gross Advice number to count from for future Gross Pay Advice'],
    fields: [
      { label: 'Prefix characters (Max 6)', required: true, value: 'ELG' },
      { label: 'Number of digits (Max 24)', required: true, value: '5' },
      { label: 'Gross Pay Advice number', required: true, value: '123' },
      { label: 'Your next Gross Pay Advice number is', value: 'ELG00123' },
    ],
  },
  {
    title: 'Gross Pay Advice date and cycle',
    helper: ['Set the start date and cycle that Gross Pay Advice will be sent from'],
    fields: [
      { label: 'Gross Pay Advice cycle', required: true, value: 'Manual' },
      { label: 'Start from date', value: '-' },
    ],
  },
  {
    title: 'GPA Document Settings',
    helper: ['Customise what is displayed on the gross pay advice document.'],
    fields: [{ label: 'Layout', value: 'Default' }],
  },
];

const CHARGING_BLOCKS: Block[] = [
  {
    title: 'Basis for charging customers',
    helper: ['Select default charging method, this can be overridden per funder if required'],
    fields: [{ label: 'Charge method', required: true, value: 'Planned time' }],
  },
  {
    title: 'Charge rate calculation',
    helper: ['Select how the visit charge will be calculated according to the visit time'],
    fields: [{ label: 'Charge rate calculation', required: true, value: 'Only use the rate applicable at the start time of the visit' }],
  },
  {
    title: 'Basis for how visits are included in an invoice cycle',
    helper: ['Choose the visit start or end time to determine which invoice cycle the visit goes into'],
    fields: [{ label: 'Basis', required: true, value: 'Start time' }],
  },
  {
    title: 'Invoice number',
    helper: ['Set the invoice number to count from for future invoices'],
    fields: [
      { label: 'Prefix characters (Max 6)', required: true, value: 'ELI' },
      { label: 'Number of digits (Max 24)', required: true, value: '5' },
      { label: 'Invoice number', required: true, value: '234' },
      { label: 'Your next invoice number is', value: 'ELI00234' },
    ],
  },
  {
    title: 'Invoice date and cycle',
    helper: ['Set the start date and cycle that invoices will be sent from'],
    fields: [
      { label: 'Invoice cycle', required: true, value: 'Manual' },
      { label: 'Start from date', value: '-' },
    ],
  },
  {
    title: 'Credit note number',
    helper: ['Set the credit note number to count from for future credit notes'],
    fields: [
      { label: 'Prefix characters (Max 6)', required: true, value: 'ELC' },
      { label: 'Number of digits (Max 24)', required: true, value: '5' },
      { label: 'Credit note number', required: true, value: '345' },
      { label: 'Your next credit note number is', value: 'ELC00345' },
    ],
  },
  {
    title: 'Invoice payment terms',
    helper: ['This will be used to calculate the due date on the invoice'],
    fields: [{ label: 'Days', value: 'N/A' }],
  },
  {
    title: 'Invoice template footnote',
    helper: ['For information such as payment details.'],
    fields: [{ label: 'Footnote', value: '-' }],
  },
];

const THRESHOLD_BLOCKS: Block[] = [
  {
    title: 'Travel waiting time threshold',
    helper: [
      'Time period greater than this value will trigger a warning within the schedule',
      '(Time between visits - estimated travel time = waiting time)',
    ],
    fields: [{ label: 'Minutes', required: true, value: '20' }],
  },
  {
    title: 'Maximum waiting time threshold',
    helper: [
      'Use this setting if you need to cap the amount of waiting time between each visit that will be treated as working time on the National Minimum Wage report.',
    ],
    // Value wasn't in the captured DOM (it was cut off mid-section).
    fields: [{ label: 'Minutes', value: '-' }],
  },
];

const EXPENSE_TYPES = [
  { name: 'Extra mileage', description: 'Additional mileage other than travel between visits', enabled: 'Yes' },
  { name: 'Parking', description: '-', enabled: 'Yes' },
  { name: 'Shopping', description: 'Shopping on behalf of customer', enabled: 'Yes' },
  { name: 'Other', description: 'Any other expense', enabled: 'Yes' },
];

const EXPENSE_BLOCKS: Block[] = [
  {
    title: 'Extra mileage rates',
    helper: ['What is the rate of pay for employees and charge rate for customers?'],
    fields: [
      { label: 'Employee pay per mile (£)', required: true, value: '5' },
      { label: 'Customer charge per mile (£)', required: true, value: '10' },
    ],
  },
];

const CANCELLATION_REASONS = [
  { name: 'Sick leave', description: '-', policy: 'None', enabled: 'Yes' },
  { name: 'Schedule conflicts', description: '-', policy: 'None', enabled: 'Yes' },
  { name: 'Customer cancelled', description: 'Initiates cancellation policy if applicable', policy: 'Policy on rate sheet', enabled: 'Yes' },
  { name: 'Other', description: 'Any other cancellation reason', policy: 'None', enabled: 'Yes' },
];

const HOLIDAY_RENEWAL_BLOCKS: Block[] = [
  {
    title: 'Holiday renewal date',
    helper: ['The renewal date for the holiday year'],
    fields: [{ label: 'Renewal date', required: true, value: '05/03' }],
  },
];

const HOLIDAY_SCHEMES = [
  {
    name: 'Everylife',
    details: [
      ['How will entitlement be calculated', 'Ignore contracted hours'],
      ['Holiday entitlement', '25 days'],
      ['Accrue ProRata', 'No'],
      ['Hours per day', '8'],
    ],
    enabled: 'Yes',
  },
];

const PUBLIC_HOLIDAY_CALC_BLOCKS: Block[] = [
  {
    title: 'How will public holidays be calculated?',
    helper: ['If public holidays are calculated by amount the rates need to be added to the charge or pay rate sheets in the finance section.'],
    fields: [{ label: 'How will public holidays be calculated?', required: true, value: 'By multiplier' }],
  },
];

const ABSENCE_TYPES = [
  { name: 'Holiday', description: 'Paid holiday' },
  { name: 'Appointment', description: 'Non work related appointments' },
  { name: 'Sick day', description: 'Unable to work because of illness' },
  { name: 'Training', description: 'Work related training' },
  { name: 'Maternity leave', description: 'Leave to a mother before and after the birth of her child' },
  { name: 'Covid leave', description: 'Sickness due to Covid' },
  { name: 'Compassionate leave', description: 'For emergencies or personal reasons' },
  { name: 'Unpaid leave', description: 'Leave that is not paid' },
];

const HOLIDAY_APP_BLOCKS: Block[] = [
  {
    title: 'Holiday entitlement in the app',
    helper: ['Let employees see their own holiday entitlement and remaining balance in the PASS app.'],
    fields: [{ label: 'Show holiday entitlement in app', value: 'No' }],
  },
];

const OFFICE_CYCLE_BLOCKS: Block[] = [
  {
    title: 'Office cycle',
    fields: [
      { label: 'Cycle start date', value: 'Not set' },
      { label: 'Default weekly cycle', value: 'Not set' },
    ],
  },
];

const COMMUNICATIONS_BLOCKS: Block[] = [
  {
    title: 'Invoicing',
    editable: true,
    helper: ['Define the from address and email subject and body for sending out invoices'],
    fields: [
      { label: 'From email address', required: true, value: 'no-reply@passgenius.com' },
      { label: 'Email subject and body', required: true, value: 'Configured' },
    ],
  },
  {
    title: 'Credit notes',
    editable: true,
    helper: ['Define the from address and email subject and body for sending out credit notes'],
    fields: [
      { label: 'From email address', required: true, value: 'no-reply@passgenius.com' },
      { label: 'Email subject and body', required: true, value: 'Configured' },
    ],
  },
  {
    title: 'Gross pay advice',
    editable: true,
    helper: ['Define the from address and email subject and body for sending out gross pay advice'],
    fields: [
      { label: 'From email address', required: true, value: 'no-reply@passgenius.com' },
      { label: 'Email subject and body', required: true, value: 'Configured' },
      { label: 'Password protected PDF', value: 'No' },
    ],
  },
  {
    title: 'Schedule to employees and customers',
    editable: true,
    helper: ['Define the from address and email subject and body for sending out schedules to employees and customers'],
    fields: [
      { label: 'From email address', required: true, value: 'no-reply@passgenius.com' },
      { label: 'Email subject and body for employees', required: true, value: 'Configured' },
      { label: 'Password protected PDF for employees', value: 'No' },
      { label: 'Email subject and body for customers', required: true, value: 'Configured' },
      { label: 'Password protected PDF for customers', value: 'No' },
    ],
  },
];

/** Advanced on/off settings, in the order they read on the page and in the edit slide-out. */
const ADVANCED_TOGGLES: { key: AdvancedSettingKey; title: string; helper: string; fieldLabel: string }[] = [
  {
    key: 'clashWithHoliday',
    title: 'Allow visits to clash with holiday bookings',
    helper: 'This will allow visits to be assigned and published to an employee where they also have a holiday booking.',
    fieldLabel: 'Allow visits to clash with holiday bookings',
  },
  {
    key: 'publishClashes',
    title: 'Allow clashing bookings to be published',
    helper: 'This will allow users to publish clashing bookings to employees',
    fieldLabel: 'Allow clashes',
  },
  {
    key: 'autoVerifyTimesheets',
    title: 'Automatically verify Timesheets',
    helper:
      "Only ‘completed’ visits will be selected for auto-verifying. Where all visits within a run have a completed status the run itself will be selected for auto-verify.",
    fieldLabel: 'Auto verification',
  },
  {
    key: 'editSentInvoices',
    title: 'Edit sent invoices',
    helper: 'Allow the ability to edit an invoice once it has been sent or marked as sent',
    fieldLabel: 'Edit sent invoices',
  },
];

const AVAILABILITY_TYPES_HELPER =
  'Group your visit types into availability types, for example Day care, Nights and Live-in. Each slot of an employee’s availability is set as one of these types, so Schedule Hero only suggests them for visits that type covers, and the capacity tool reports hours per type.';

const AVAILABILITY_TYPES_RULES = [
  'Each visit type sits in one availability type, so Schedule Hero always knows which one it needs.',
  'Availability types can be switched off but not deleted.',
  'Exactly one availability type is the default. Availability that hasn’t been given a type is treated as the default.',
];

const ORDERING_LABEL = { 'first-name': 'First name', 'last-name': 'Last name' } as const;
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

function advancedBlocks(advanced: AdvancedSettings, table: TableSettings): Block[] {
  return [
    {
      title: 'Table settings',
      fields: [
        { label: 'Rows per page', value: String(table.rowsPerPage) },
        { label: 'Table ordering', value: table.ordering ? ORDERING_LABEL[table.ordering] : '-' },
      ],
    },
    ...ADVANCED_TOGGLES.map((t) => ({
      title: t.title,
      helper: [t.helper],
      fields: [{ label: t.fieldLabel, value: advanced[t.key] ? 'Enabled' : 'Disabled' }],
    })),
  ];
}

// ─── Building blocks ─────────────────────────────────────────────────────────

function Swatch({ colour }: { colour: string | null }) {
  if (!colour) return <span className="text-gray-500" aria-label="No colour">–</span>;
  return (
    <span
      aria-hidden="true"
      className="inline-block h-5 w-5 rounded-full border border-black/10"
      style={{ backgroundColor: colour }}
    />
  );
}

function SettingsSection({
  id,
  title,
  Icon,
  children,
  scrollMarginTop,
  editable = true,
  onEdit,
}: {
  id: string;
  title: string;
  Icon: ComponentType<{ className?: string }>;
  children?: ReactNode;
  scrollMarginTop: number;
  /** false when each block inside has its own edit button instead (Communications). */
  editable?: boolean;
  /** Opens this section's edit slide-out. Not built yet for most sections. */
  onEdit?: () => void;
}) {
  const canEdit = useFeatureFlag('canEditRosterSettings');
  return (
    <section
      id={id}
      data-testid={`setting-${id}`}
      // Sections with a section-level edit button reserve a right-hand gutter
      // for it, so it can float there without ever covering table columns.
      className={`relative bg-white rounded-[10px] border border-gray-200 p-6 ${editable ? 'pr-20' : ''}`}
      style={{ scrollMarginTop }}
    >
      {/* Each section edits in a slide-out — not built yet. The button stays
          pinned just under the page header while this panel is on screen, so
          it's always within reach however far down a long panel you've
          scrolled. (Sticks inside an absolutely-positioned full-height rail;
          the scroll offset is the same one used for jump links.) */}
      {editable && (
        <div className="absolute top-6 bottom-6 right-6 w-8">
          <div className="sticky z-10" style={{ top: scrollMarginTop }}>
            <span title={canEdit ? undefined : "You don't have permission to change Roster settings"}>
              <Button variant="tertiary" size="sm" iconOnly aria-label={`Edit ${title}`} disabled={!canEdit} onClick={onEdit}>
                <PencilSolidIcon className="w-4 h-4" />
              </Button>
            </span>
          </div>
        </div>
      )}
      <div className="flex items-center gap-3 mb-6">
        <Icon className="w-8 h-8 text-gray-800 shrink-0" />
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function TableIntro({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="text-body text-gray-700 mt-0.5">{description}</p>
    </div>
  );
}

const TH = 'px-4 py-3 text-left text-body font-semibold text-gray-900 bg-gray-50 border-b border-gray-200';
const TD = 'px-4 py-4 text-body text-gray-800 align-top border-b border-gray-200';

function DataTable({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto rounded-[10px] border border-gray-200 ${className}`}>
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

function BlockEditButton({ title, onClick }: { title: string; onClick?: () => void }) {
  const canEdit = useFeatureFlag('canEditRosterSettings');
  return (
    <span className="shrink-0" title={canEdit ? undefined : "You don't have permission to change Roster settings"}>
      <Button variant="tertiary" size="sm" iconOnly aria-label={`Edit ${title}`} disabled={!canEdit} onClick={onClick}>
        <PencilSolidIcon className="w-4 h-4" />
      </Button>
    </span>
  );
}

function SettingBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="divide-y divide-gray-200">
      {blocks.map((b) => (
        <div key={b.title} className="py-5 first:pt-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">{b.title}</h3>
              {b.helper?.map((h) => (
                <p key={h} className="text-body text-gray-700 mt-0.5">{h}</p>
              ))}
            </div>
            {b.editable && <BlockEditButton title={b.title} />}
          </div>
          {/* Label on the left, value in a column beside it (wraps on narrow screens). */}
          <dl className="mt-4 space-y-4">
            {b.fields.map((f) => (
              <div key={f.label} className="grid gap-x-8 gap-y-1 sm:grid-cols-[minmax(0,26rem)_1fr]">
                <dt className="text-body font-semibold text-gray-700">
                  {f.required && <span className="text-red-600 mr-1" aria-hidden="true">*</span>}
                  {f.label}
                </dt>
                <dd className="text-body text-gray-900">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

/**
 * Edit slide-out for Advanced settings — the shared EditSlideout shell (same
 * as the visit edit slide-out), with the settings as plain headed groups.
 * Mounted only while open, so the draft always starts from what's saved.
 */
function AdvancedSettingsSlideout({ onClose }: { onClose: () => void }) {
  const { advanced, table, saveAdvanced } = useRosterSettings();
  const [draft, setDraft] = useState<AdvancedSettings>(advanced);
  const [tableDraft, setTableDraft] = useState<TableSettings>(table);
  const dirty =
    ADVANCED_TOGGLES.some((t) => draft[t.key] !== advanced[t.key]) ||
    tableDraft.rowsPerPage !== table.rowsPerPage ||
    tableDraft.ordering !== table.ordering;

  return (
    <EditSlideout
      title="Edit advanced settings"
      size="large"
      onClose={onClose}
      saveDisabled={!dirty}
      onSave={(close) => {
        saveAdvanced(draft, tableDraft);
        close();
      }}
    >
      <div className="space-y-10">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Table settings</h3>
          <p className="text-body text-gray-800 mt-2">Applied to tables on the timesheet and finance views.</p>

          <div className="mt-6">
            <label htmlFor="rows-per-page" className="block text-body text-gray-700 mb-2">
              <span className="text-red-600 mr-1" aria-hidden="true">*</span>Rows per page
            </label>
            <div className="relative w-36">
              <select
                id="rows-per-page"
                value={tableDraft.rowsPerPage}
                onChange={(e) => setTableDraft((t) => ({ ...t, rowsPerPage: Number(e.target.value) }))}
                className="w-full appearance-none px-3 py-3 border border-gray-300 rounded-md text-body bg-white pr-9"
              >
                {ROWS_PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <fieldset className="mt-6">
            <legend className="text-body text-gray-700 mb-2">Table ordering</legend>
            <div className="flex items-center gap-6">
              {(['first-name', 'last-name'] as const).map((o) => (
                <label key={o} className="flex items-center gap-2.5 text-body text-gray-800 cursor-pointer">
                  <input
                    type="radio"
                    name="table-ordering"
                    checked={tableDraft.ordering === o}
                    onChange={() => setTableDraft((t) => ({ ...t, ordering: o }))}
                    className="h-6 w-6 accent-[rgb(154,38,214)] cursor-pointer"
                  />
                  {ORDERING_LABEL[o]}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {ADVANCED_TOGGLES.map((t) => (
          <div key={t.key}>
            <h3 className="text-lg font-semibold text-gray-900">{t.title}</h3>
            <p className="text-body text-gray-800 mt-2">{t.helper}</p>
            <label className="mt-5 flex items-center gap-2.5 text-body text-gray-800 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={draft[t.key]}
                onChange={(e) => setDraft((d) => ({ ...d, [t.key]: e.target.checked }))}
                className="h-6 w-6 accent-[rgb(154,38,214)] cursor-pointer"
              />
              Enable
            </label>
          </div>
        ))}
      </div>
    </EditSlideout>
  );
}

// Small pieces of the edit slide-out, at module level so they keep their identity
// (and keyboard focus) between renders.
const ColourButton = ({ colour, label }: { colour: string | null; label: string }) => (
  <button
    type="button"
    aria-label={label}
    className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2 py-1.5 cursor-pointer hover:bg-gray-50"
  >
    <Swatch colour={colour} />
    <ChevronDown className="w-4 h-4 text-gray-600" aria-hidden="true" />
  </button>
);

/** The colour button from the visit types table, but live: opens a palette and reports the pick. */
function ColourPicker({ colour, label, onChange }: { colour: string; label: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2 py-2 cursor-pointer hover:bg-gray-50"
        >
          <Swatch colour={colour} />
          <ChevronDown className="w-4 h-4 text-gray-600" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <div role="radiogroup" aria-label={label} className="grid grid-cols-4 gap-2">
          {AVAILABILITY_TYPE_COLOURS.map((c) => {
            const selected = c.value.toLowerCase() === colour.toLowerCase();
            return (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={c.name}
                title={c.name}
                onClick={() => { onChange(c.value); setOpen(false); }}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 cursor-pointer ${selected ? 'border-gray-900' : 'border-transparent hover:border-gray-400'}`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: c.value }}>
                  {selected && <Check className="h-4 w-4 text-white" aria-hidden="true" />}
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const HolidayCheckbox = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <input
    type="checkbox"
    aria-label={label}
    checked={checked}
    onChange={(e) => onChange(e.target.checked)}
    className="h-5 w-5 accent-[rgb(154,38,214)] cursor-pointer"
  />
);

const EditRowButton = ({ label, disabled }: { label: string; disabled: boolean }) => (
  <Button variant="tertiary" size="sm" iconOnly aria-label={label} disabled={disabled}>
    <PencilSolidIcon className="w-4 h-4" />
  </Button>
);

const TableHeader = ({ title, description, count, total, show, onShow, id }: {
  title: string; description: string; count: number; total: number; show: boolean; onShow: (v: boolean) => void; id: string;
}) => (
  <div className="mb-3">
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    <div className="mt-0.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <p className="text-body text-gray-800">{description}</p>
      <div className="flex items-center gap-4 text-body text-gray-700">
        <label htmlFor={id} className="flex items-center gap-2 cursor-pointer">
          <input
            id={id}
            type="checkbox"
            checked={show}
            onChange={(e) => onShow(e.target.checked)}
            className="h-5 w-5 accent-[rgb(154,38,214)] cursor-pointer"
          />
          Show disabled
        </label>
        <span>Displaying {count} of {total} types</span>
      </div>
    </div>
  </div>
);


// ─── Availability types ──────────────────────────────────────────────────────

const Dot = ({ colour }: { colour: string }) => (
  <span aria-hidden="true" className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: colour }} />
);

const VisitTypeChip = ({ label, colour }: { label: string; colour: string }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-900">
    <Dot colour={colour} />
    {label}
  </span>
);

const DefaultPill = () => (
  <span className="inline-flex rounded-full border border-gray-400 bg-gray-100 px-2.5 py-0.5 text-sm font-semibold text-gray-900">
    Default
  </span>
);

/** Visit types in no enabled availability type — Schedule Hero can't suggest carers for them. */
function UncoveredWarning({ labels, className = '' }: { labels: string[]; className?: string }) {
  if (!labels.length) return null;
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-md border border-amber-600 bg-amber-50 px-4 py-3 text-body text-gray-900 ${className}`.trim()}
    >
      <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
      <p className="text-body text-gray-900">
        <strong>{labels.join(', ')}</strong> {labels.length === 1 ? 'isn’t' : 'aren’t'} in any availability type.
        Schedule Hero can’t suggest carers for {labels.length === 1 ? 'this visit type' : 'these visit types'} until
        {labels.length === 1 ? ' it’s' : ' they’re'} added to one.
      </p>
    </div>
  );
}

/** An info icon that opens a small popover (click / Enter / touch), for detail that doesn't need to be on screen all the time. */
function InfoPopover({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-700 cursor-pointer hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-[rgb(154,38,214)]"
        >
          <Info className="h-5 w-5" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className={`${wide ? 'w-96' : 'w-64'} p-3 text-body font-normal text-gray-900`}>
        {children}
      </PopoverContent>
    </Popover>
  );
}

/** Explains the default availability type (it's always on, and untyped availability falls back to it). */
function DefaultTypeInfo() {
  return (
    <InfoPopover label="About the default availability type">
      This is the default availability type, so it’s always on. Availability with no type set is treated as this one.
    </InfoPopover>
  );
}

type BoardVisitType = { id: string; label: string; colour: string };

/**
 * The visit-types-into-availability-types board: one row per availability
 * type, visit types as chips inside them. Moving is never drag-only — a chip is
 * a button: select it (Enter/Space/click), then ↑ / ↓ or a row's "Move here"
 * button. Moves are announced in a live region and focus stays on the chip.
 */
function AvailabilityTypesBoard({
  types,
  visitTypes,
  nameError,
  onPatch,
  onAssign,
}: {
  types: AvailabilityType[];
  visitTypes: BoardVisitType[];
  nameError: (t: AvailabilityType) => string | null;
  onPatch: (id: string, patch: Partial<AvailabilityType>) => void;
  onAssign: (visitId: string, typeId: string | null) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  // Mouse drag and drop: an extra on top of the keyboard / "Move here" ways of moving a chip.
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const pendingFocus = useRef<string | null>(null);

  useEffect(() => {
    if (pendingFocus.current) {
      chipRefs.current[pendingFocus.current]?.focus();
      pendingFocus.current = null;
    }
  });

  const typeOf = (visitId: string) => types.find((t) => (t.visitTypeIds as string[]).includes(visitId)) ?? null;
  const unassigned = visitTypes.filter((v) => !typeOf(v.id));
  // Top to bottom, including the "Not in an availability type" row when it's showing.
  const columns: { id: string | null; type: AvailabilityType | null }[] = [
    ...(unassigned.length ? [{ id: null, type: null }] : []),
    ...types.map((t) => ({ id: t.id, type: t })),
  ];
  const selected = visitTypes.find((v) => v.id === selectedId) ?? null;

  const moveTo = (visit: BoardVisitType, targetId: string | null) => {
    const target = types.find((t) => t.id === targetId);
    onAssign(visit.id, targetId);
    pendingFocus.current = visit.id;
    setSelectedId(null);
    const position = columns.findIndex((c) => c.id === targetId) + 1;
    setAnnouncement(`${visit.label} moved to ${target?.name.trim() || 'Not in an availability type'}, row ${position} of ${columns.length}`);
  };

  const onChipKey = (e: KeyboardEvent, visit: BoardVisitType) => {
    if (e.key === 'Escape' && selectedId) {
      setSelectedId(null);
      setAnnouncement(`${visit.label} deselected`);
      return;
    }
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const current = typeOf(visit.id)?.id ?? null;
    const at = columns.findIndex((c) => c.id === current);
    const step = e.key === 'ArrowDown' ? 1 : -1;
    // Next row that can take it: switched-off types can't be moved into.
    for (let i = at + step; i >= 0 && i < columns.length; i += step) {
      const col = columns[i];
      if (col.type && !col.type.enabled) continue;
      moveTo(visit, col.id);
      return;
    }
    setAnnouncement(`${visit.label} is already in the ${step > 0 ? 'bottom' : 'top'} row`);
  };

  const chip = (v: BoardVisitType) => {
    const isSelected = v.id === selectedId;
    return (
      <div
        key={v.id}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', v.id);
          setDraggingId(v.id);
          setSelectedId(null);
        }}
        onDragEnd={() => { setDraggingId(null); setOverId(null); }}
        className={draggingId === v.id ? 'opacity-40' : ''}
      >
      <button
        ref={(el) => { chipRefs.current[v.id] = el; }}
        type="button"
        aria-pressed={isSelected}
        onClick={() => {
          setSelectedId(isSelected ? null : v.id);
          setAnnouncement(isSelected ? `${v.label} deselected` : `${v.label} selected. Press up or down arrow, or choose Move here in a row, to move it.`);
        }}
        onKeyDown={(e) => onChipKey(e, v)}
        className={`flex w-full items-center gap-2.5 rounded-lg border-2 bg-white px-3 py-2 text-left text-body font-medium text-gray-900 cursor-grab active:cursor-grabbing outline-none focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50 ${
          isSelected ? 'border-[rgb(154,38,214)] shadow-md' : 'border-gray-300 hover:border-gray-500'
        }`}
      >
        <Dot colour={v.colour} />
        <span className="flex-1">{v.label}</span>
        <span aria-hidden="true" className="text-gray-500">⇅</span>
      </button>
      </div>
    );
  };

  const moveHere = (targetId: string | null) =>
    selected && typeOf(selected.id)?.id !== targetId ? (
      <button
        type="button"
        onClick={() => moveTo(selected, targetId)}
        className="w-full rounded-lg border-2 border-dashed border-[rgb(154,38,214)] bg-white px-3 py-2 text-body font-semibold text-[rgb(154,38,214)] cursor-pointer hover:bg-[rgba(154,38,214,0.05)]"
      >
        Move {selected.label} here
      </button>
    ) : null;

  return (
    <div>
      <p className="text-body text-gray-700">
        Drag a visit type into a row. Or select it, then press <kbd className="rounded border border-gray-300 bg-white px-1.5">↑</kbd>{' '}
        <kbd className="rounded border border-gray-300 bg-white px-1.5">↓</kbd> or choose “Move here” in a row.
      </p>
      <div className="sr-only" role="status" aria-live="polite">{announcement}</div>
      <div className="mt-3 space-y-4">
        {columns.map((col) => {
          if (!col.type) {
            return (
              <section key="unassigned" aria-label="Not in an availability type" className="flex flex-col overflow-hidden rounded-[10px] border-2 border-dashed border-amber-600 bg-amber-50 md:flex-row">
                <div className="px-4 py-3 text-body font-semibold text-gray-900 md:w-72 md:shrink-0">Not in an availability type</div>
                <div className="grid flex-1 gap-2 px-4 py-3 sm:grid-cols-2 xl:grid-cols-3">{unassigned.map(chip)}</div>
              </section>
            );
          }
          const t = col.type;
          const err = nameError(t);
          const id = `availability-type-name-${t.id}`;
          return (
            // A full-colour bar down the left edge, and the same colour as a light tint across the row.
            <section
              key={t.id}
              aria-label={t.name.trim() || 'Unnamed availability type'}
              className="flex flex-col overflow-hidden rounded-[10px] border border-l-8 border-gray-300 md:flex-row"
              style={{ borderLeftColor: t.colour, backgroundColor: `${t.colour}14` }}
            >
              <div className="flex flex-col gap-3 px-4 py-3 md:w-72 md:shrink-0">
                <div>
                  <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-gray-900">Availability type</label>
                  <div className="flex items-center gap-2">
                    <ColourPicker colour={t.colour} label={`${t.name.trim() || 'Availability type'} colour`} onChange={(c) => onPatch(t.id, { colour: c })} />
                    <input
                      id={id}
                      type="text"
                      value={t.name}
                      placeholder="Name"
                      aria-invalid={!!err}
                      aria-describedby={err ? `${id}-error` : undefined}
                      onChange={(e) => onPatch(t.id, { name: e.target.value })}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-body font-semibold text-gray-900"
                    />
                  </div>
                  {err && <p id={`${id}-error`} className="mt-1.5 text-body font-medium text-red-700">{err}</p>}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span id={`${id}-enabled`} className="flex items-center gap-1.5 text-body font-semibold text-gray-900">
                    Enabled
                    {t.isDefault && <DefaultTypeInfo />}
                  </span>
                  <SegmentedToggle
                    offFirst
                    value={t.enabled}
                    onChange={(v) => onPatch(t.id, { enabled: v })}
                    onLabel="Yes"
                    offLabel="No"
                    variant="track"
                    disabled={t.isDefault}
                    ariaLabel={`${t.name.trim() || 'Unnamed availability type'} enabled`}
                  />
                </div>
              </div>
              <div
                className={`flex-1 px-4 py-3 md:border-l md:border-black/10 ${t.enabled ? '' : 'opacity-70'} ${overId === t.id ? 'outline-dashed outline-2 -outline-offset-4 outline-[rgb(154,38,214)]' : ''}`}
                style={{ minHeight: '6.5rem' }}
                // Switched-off types aren't drop targets, matching the keyboard behaviour.
                onDragOver={(e) => {
                  if (!draggingId || !t.enabled) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (overId !== t.id) setOverId(t.id);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOverId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const visit = visitTypes.find((v) => v.id === (draggingId ?? e.dataTransfer.getData('text/plain')));
                  setDraggingId(null);
                  setOverId(null);
                  if (visit && typeOf(visit.id)?.id !== t.id && t.enabled) moveTo(visit, t.id);
                }}
              >
                {!t.enabled && <p className="mb-2 text-body font-medium text-gray-800">Switched off. Visit types can’t be moved in.</p>}
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {t.enabled && moveHere(t.id)}
                  {visitTypes.filter((v) => typeOf(v.id)?.id === t.id).map(chip)}
                </div>
                {!visitTypes.some((v) => typeOf(v.id)?.id === t.id) && (
                  <p className="text-body text-gray-700">No visit types yet</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Edit slide-out for "Visit and event types": the two tables in edit mode,
 * with the Availability by care type setting as its own panel between them
 * (it's about how those care types are used, so it's edited here rather than
 * with a button of its own). Mounted only while open, so the draft always
 * starts from what's saved.
 */
function VisitEventTypesSlideout({
  isDomiciliary,
  onClose,
  onSaved,
  focusAvailability = false,
}: {
  isDomiciliary: boolean;
  onClose: () => void;
  /** Opened from a "turn on availability by care type" link: bring that panel into view and focus its checkbox. */
  focusAvailability?: boolean;
  /** Called after a save, once the slide-out has started closing. */
  onSaved: () => void;
}) {
  const { advanced, table, typeOverrides, availabilityTypes, saveTypeOverrides, saveAvailabilityTypes, saveAdvanced } = useRosterSettings();
  const [draft, setDraft] = useState<TypeOverrides>(typeOverrides);
  const [typesDraft, setTypesDraft] = useState<AvailabilityType[]>(availabilityTypes);
  const [typesView, setTypesView] = useState<'board' | 'table'>('board');
  const [careTypeAvailability, setCareTypeAvailability] = useState(advanced.availabilityByCareType);
  const [showDisabledVisit, setShowDisabledVisit] = useState(false);
  const [showDisabledEvent, setShowDisabledEvent] = useState(false);
  const availabilityPanelRef = useRef<HTMLDivElement>(null);
  const availabilityCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!focusAvailability) return;
    // After the slide-in has settled
    const t = window.setTimeout(() => {
      availabilityPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      availabilityCheckboxRef.current?.focus({ preventScroll: true });
    }, 400);
    return () => window.clearTimeout(t);
  }, [focusAvailability]);

  const set = (key: string, patch: TypeOverride) => setDraft((d) => ({ ...d, [key]: { ...d[key], ...patch } }));

  const dirty =
    JSON.stringify(draft) !== JSON.stringify(typeOverrides) ||
    JSON.stringify(typesDraft) !== JSON.stringify(availabilityTypes) ||
    careTypeAvailability !== advanced.availabilityByCareType;

  // Draft-applied rows
  const visitRows = CARE_TYPES.map((c) => {
    const o = draft[visitTypeKey(c.id)] ?? {};
    return { ...c, includeInHolidayPay: o.includeInHolidayPay ?? c.includeInHolidayPay, enabled: o.enabled ?? true };
  });
  const eventRows = applyEventOverrides(draft);
  const shownVisit = visitRows.filter((r) => showDisabledVisit || r.enabled);
  const enabledVisitRows = visitRows.filter((r) => r.enabled);

  // Availability types draft
  const patchType = (id: string, patch: Partial<AvailabilityType>) =>
    setTypesDraft((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  // A visit type belongs to one availability type: assigning it moves it out of any other.
  const assignVisitType = (visitId: string, typeId: string | null) =>
    setTypesDraft((ts) =>
      ts.map((t) => {
        const without = (t.visitTypeIds as string[]).filter((id) => id !== visitId);
        return { ...t, visitTypeIds: (t.id === typeId ? [...without, visitId] : without) as AvailabilityType['visitTypeIds'] };
      }),
    );
  const addType = () =>
    setTypesDraft((ts) => [
      ...ts,
      {
        id: `custom-${Date.now()}`,
        name: '',
        colour: (AVAILABILITY_TYPE_COLOURS.find((c) => !ts.some((t) => t.colour === c.value)) ?? AVAILABILITY_TYPE_COLOURS[0]).value,
        visitTypeIds: [],
        isDefault: false,
        enabled: true,
      },
    ]);
  const nameError = (t: AvailabilityType) => {
    const name = t.name.trim();
    if (!name) return 'Enter a name';
    const clash = typesDraft.some((o) => o.id !== t.id && o.name.trim().toLowerCase() === name.toLowerCase());
    return clash ? 'Another availability type already has this name' : null;
  };
  // Only matters while the feature is on: the grid isn't shown (or saved from) otherwise.
  const namesInvalid = careTypeAvailability && typesDraft.some((t) => nameError(t));
  const uncovered = uncoveredVisitTypeIds(typesDraft, enabledVisitRows.map((v) => v.id))
    .map((id) => enabledVisitRows.find((v) => v.id === id)!.label);
  const defaultType = typesDraft.find((t) => t.isDefault);
  const shownEvent = eventRows.filter((r) => showDisabledEvent || r.enabled);

  // Types that are in use (or the default) can't be switched off — as in the live app.
  const LOCKED_VISIT_TYPES = new Set(['personal-care', 'complex-care']);

  return (
    <EditSlideout
      title="Edit visit and event types"
      size="large"
      width="wide"
      onClose={onClose}
      saveDisabled={!dirty || namesInvalid}
      onSave={(close) => {
        saveTypeOverrides(draft);
        saveAvailabilityTypes(typesDraft.map((t) => ({ ...t, name: t.name.trim() })));
        saveAdvanced({ ...advanced, availabilityByCareType: careTypeAvailability }, table);
        close();
        onSaved();
      }}
    >
      <div className="space-y-10">
        <div>
          <TableHeader
            id="show-disabled-visit"
            title="Visit types"
            description="Visit care types are assigned to visits to describe the care and set appropriate charge rates and pay rates"
            count={shownVisit.length}
            total={visitRows.length}
            show={showDisabledVisit}
            onShow={setShowDisabledVisit}
          />
          <DataTable className="bg-white">
            <thead>
              <tr>
                <th className={TH}>Care Type</th>
                <th className={TH}>Description</th>
                <th className={TH}>Include in holiday pay</th>
                <th className={TH}>Colour</th>
                <th className={TH}>Enabled</th>
                <th className={TH}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {shownVisit.map((c) => (
                <tr key={c.id}>
                  <td className={TD}>{c.label}</td>
                  <td className={`${TD} max-w-[320px]`}>{c.description}</td>
                  <td className={TD}>
                    <HolidayCheckbox
                      label={`${c.label} include in holiday pay`}
                      checked={c.includeInHolidayPay}
                      onChange={(v) => set(visitTypeKey(c.id), { includeInHolidayPay: v })}
                    />
                  </td>
                  <td className={TD}><ColourButton colour={c.colour} label={`Visit type ${c.label} colour`} /></td>
                  <td className={TD}>
                    <SegmentedToggle
                      offFirst
                      value={c.enabled}
                      onChange={(v) => set(visitTypeKey(c.id), { enabled: v })}
                      onLabel="Yes"
                      offLabel="No"
                      variant="track"
                      disabled={LOCKED_VISIT_TYPES.has(c.id)}
                      ariaLabel={`${c.label} enabled`}
                    />
                  </td>
                  <td className={TD}><EditRowButton label={`Edit ${c.label}`} disabled /></td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          <div className="mt-3">
            <Button variant="secondary" size="sm">Add care type</Button>
          </div>
        </div>

        {isDomiciliary && (
          <div ref={availabilityPanelRef} className="rounded-[10px] border border-gray-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-gray-900">Availability types</h3>
            <InfoBanner className="mt-3">{AVAILABILITY_TYPES_HELPER}</InfoBanner>
            <label className="mt-4 flex items-center gap-2.5 text-body text-gray-800 cursor-pointer w-fit">
              <input
                ref={availabilityCheckboxRef}
                type="checkbox"
                checked={careTypeAvailability}
                onChange={(e) => setCareTypeAvailability(e.target.checked)}
                className="h-6 w-6 accent-[rgb(154,38,214)] cursor-pointer"
              />
              Enable
            </label>
            {/* What saving will do, shown only once the checkbox has changed. */}
            <div aria-live="polite">
              {careTypeAvailability && !advanced.availabilityByCareType && (
                <p className="mt-3 text-body text-gray-800">
                  Existing availability will be treated as <strong>{defaultType?.name ?? 'the default type'}</strong> when
                  you save. You can review it on each employee's contract afterwards.
                </p>
              )}
              {!careTypeAvailability && advanced.availabilityByCareType && (
                <p className="mt-3 text-body text-gray-800">
                  Availability types will be hidden on contracts and ignored by the optimiser. They're kept, and come
                  back if you turn this on again.
                </p>
              )}
            </div>

            {/* The set-up only exists while the feature is on. */}
            {careTypeAvailability && (
              <>
                <UncoveredWarning labels={uncovered} className="mt-5" />

                <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                  <p className="flex items-center gap-1.5 text-body font-semibold text-gray-900">
                    Choose the one availability type each visit type belongs to.
                    <InfoPopover label="Availability type rules" wide>
                      <ul className="list-disc space-y-1.5 pl-5">
                        {AVAILABILITY_TYPES_RULES.map((r) => <li key={r}>{r}</li>)}
                      </ul>
                    </InfoPopover>
                  </p>
                  <SegmentedToggle
                    neutral
                    variant="track"
                    value={typesView === 'board'}
                    onChange={(isBoard) => setTypesView(isBoard ? 'board' : 'table')}
                    onLabel="Board"
                    offLabel="Table"
                    ariaLabel="View"
                  />
                </div>
                {typesView === 'board' ? (
                  <div className="mt-3">
                    <AvailabilityTypesBoard
                      types={typesDraft}
                      visitTypes={enabledVisitRows}
                      nameError={nameError}
                      onPatch={patchType}
                      onAssign={assignVisitType}
                    />
                  </div>
                ) : (
                <DataTable className="mt-3 bg-white">
                  <thead>
                    <tr>
                      <th className={`${TH} min-w-[11rem]`}>Visit type</th>
                      {typesDraft.map((t) => {
                        const err = nameError(t);
                        const id = `availability-type-name-${t.id}`;
                        return (
                          <th key={t.id} className={`${TH} min-w-[15rem] align-top ${t.enabled ? '' : 'text-gray-700'}`}>
                            <div className="flex items-center gap-2">
                              <ColourPicker
                                colour={t.colour}
                                label={`${t.name.trim() || 'Availability type'} colour`}
                                onChange={(c) => patchType(t.id, { colour: c })}
                              />
                              <label htmlFor={id} className="sr-only">Availability type name</label>
                              <input
                                id={id}
                                type="text"
                                value={t.name}
                                aria-invalid={!!err}
                                aria-describedby={err ? `${id}-error` : undefined}
                                onChange={(e) => patchType(t.id, { name: e.target.value })}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-body font-normal text-gray-900"
                              />
                            </div>
                            {err && <p id={`${id}-error`} className="mt-1 text-body font-normal text-red-700">{err}</p>}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {enabledVisitRows.map((v) => {
                      const current = typesDraft.find((t) => (t.visitTypeIds as string[]).includes(v.id));
                      return (
                        <tr key={v.id}>
                          <th scope="row" className={`${TD} !py-2 !align-middle text-left font-normal`}>
                            <span className="flex items-center gap-2.5"><Dot colour={v.colour} />{v.label}</span>
                          </th>
                          {typesDraft.map((t) => (
                            <td key={t.id} className={`${TD} !py-2 !align-middle`}>
                              <input
                                type="radio"
                                name={`assign-${v.id}`}
                                aria-label={`${v.label}: ${t.name.trim() || 'Unnamed availability type'}`}
                                checked={current?.id === t.id}
                                disabled={!t.enabled && current?.id !== t.id}
                                onChange={() => assignVisitType(v.id, t.id)}
                                className="h-6 w-6 cursor-pointer accent-[rgb(154,38,214)] disabled:cursor-not-allowed"
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-50">
                      <th scope="row" className={`${TD} !py-2 !align-middle text-left font-semibold text-gray-900`}>Enabled</th>
                      {typesDraft.map((t) => (
                        <td key={t.id} className={`${TD} !py-2 !align-middle`}>
                          <span className="flex items-center gap-1.5">
                            <SegmentedToggle
                              offFirst
                              value={t.enabled}
                              onChange={(v) => patchType(t.id, { enabled: v })}
                              onLabel="Yes"
                              offLabel="No"
                              variant="track"
                              disabled={t.isDefault}
                              ariaLabel={`${t.name.trim() || 'Unnamed availability type'} enabled`}
                            />
                            {t.isDefault && <DefaultTypeInfo />}
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </DataTable>
                )}
                <div className="mt-4">
                  <Button variant="secondary" size="sm" onClick={addType}>Add availability type</Button>
                </div>
              </>
            )}
          </div>
        )}

        <div>
          <TableHeader
            id="show-disabled-event"
            title="Non-contact event types"
            description="Non-contact events for employees where no customer is visited"
            count={shownEvent.length}
            total={eventRows.length}
            show={showDisabledEvent}
            onShow={setShowDisabledEvent}
          />
          <DataTable className="bg-white">
            <thead>
              <tr>
                <th className={TH}>Event Type</th>
                <th className={TH}>Description</th>
                <th className={TH}>Pay employee</th>
                <th className={TH}>Pay mileage</th>
                <th className={TH}>Pay travel time</th>
                <th className={TH}>Include in holiday pay</th>
                <th className={TH}>Colour</th>
                <th className={TH}>Enabled</th>
                <th className={TH}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {shownEvent.map((e) => {
                const key = eventTypeKey(e.name);
                const toggle = (field: 'payEmployee' | 'payMileage' | 'payTravelTime' | 'enabled', label: string, value: boolean) => (
                  <SegmentedToggle
                    offFirst
                    value={value}
                    onChange={(v) => set(key, { [field]: v })}
                    onLabel="Yes"
                    offLabel="No"
                    variant="track"
                    ariaLabel={`${e.name} ${label}`}
                  />
                );
                return (
                  <tr key={e.name}>
                    <td className={TD}>{e.name}</td>
                    <td className={`${TD} max-w-[260px]`}>{e.description}</td>
                    <td className={TD}>{toggle('payEmployee', 'pay employee', e.payEmployee)}</td>
                    <td className={TD}>{toggle('payMileage', 'pay mileage', e.payMileage)}</td>
                    <td className={TD}>{toggle('payTravelTime', 'pay travel time', e.payTravelTime)}</td>
                    <td className={TD}>
                      <HolidayCheckbox
                        label={`${e.name} include in holiday pay`}
                        checked={e.holidayPay}
                        onChange={(v) => set(key, { includeInHolidayPay: v })}
                      />
                    </td>
                    <td className={TD}><ColourButton colour={e.colour} label={`Event type ${e.name} colour`} /></td>
                    <td className={TD}>{toggle('enabled', 'enabled', e.enabled)}</td>
                    <td className={TD}><EditRowButton label={`Edit ${e.name}`} disabled={!e.custom} /></td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
          <div className="mt-3">
            <Button variant="secondary" size="sm">Add non-contact event type</Button>
          </div>
        </div>
      </div>
    </EditSlideout>
  );
}


function PublicHolidays() {
  const [year, setYear] = useState(2026);
  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900">Public holidays and multipliers</h3>
      <p className="text-body text-gray-700 mt-0.5">These dates will be used for charging and paying specific rates for public holidays.</p>
      <div className="flex items-center justify-center gap-4 my-4">
        <Button variant="tertiary" size="sm" iconOnly aria-label="Previous year" onClick={() => setYear((y) => y - 1)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-base font-semibold text-gray-900 tabular-nums">{year}</span>
        <Button variant="tertiary" size="sm" iconOnly aria-label="Next year" onClick={() => setYear((y) => y + 1)}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
      <DataTable>
        <thead>
          <tr>
            <th className={TH}>Holiday date</th>
            <th className={TH}>Name</th>
            <th className={TH}>Charge multiplier</th>
            <th className={TH}>Pay multiplier</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={4} className={`${TD} text-center italic text-gray-600`}>
              No public holidays added for {year}.
            </td>
          </tr>
        </tbody>
      </DataTable>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const NAV: SectionNavItem[] = [
  { id: 'visit-event-types', label: 'Visit and event types', Icon: VisitTypesIcon },
  { id: 'contracts-and-pay', label: 'Contracts and pay', Icon: ContractsIcon },
  { id: 'charging-and-invoicing', label: 'Charging and invoicing', Icon: ChargingIcon },
  { id: 'time-thresholds', label: 'Time thresholds', Icon: TimeThresholdsIcon },
  { id: 'expense-types', label: 'Expense types', Icon: ExpenseTypesIcon },
  { id: 'cancellation-reasons', label: 'Cancellation reasons', Icon: CancellationReasonsIcon },
  { id: 'holidays-and-absences', label: 'Holidays and absences', Icon: HolidaysIcon },
  { id: 'office-calendar', label: 'Office calendar', Icon: OfficeCalendarIcon },
  { id: 'communications', label: 'Communications', Icon: CommunicationsIcon },
  { id: 'advanced-settings', label: 'Advanced settings', Icon: AdvancedSettingsIcon },
];

export function RosterSettingsPage() {
  // Title row + left menu pin beneath AppShell's info-bar, same as Employee Contract.
  const infoBarBottom = useInfoBarBottom();
  const titleRef = useRef<HTMLDivElement>(null);
  const [titleHeight, setTitleHeight] = useState(0);
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTitleHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const stickyOffset = infoBarBottom + titleHeight;
  const scrollMarginTop = stickyOffset + 16;
  useScrollToHash(titleHeight > 0 && infoBarBottom > 0);

  const navigate = useNavigate();
  const { advanced, table, typeOverrides, availabilityTypes } = useRosterSettings();
  const visitTypes = useVisitTypes().filter((v) => v.enabled);
  const defaultAvailabilityType = availabilityTypes.find((t) => t.isDefault);
  const uncoveredLabels = uncoveredVisitTypeIds(availabilityTypes, visitTypes.map((v) => v.id))
    .map((id) => visitTypes.find((v) => v.id === id)!.label);
  const eventTypes = applyEventOverrides(typeOverrides).filter((e) => e.enabled);
  const { office } = useOffice();
  const isDomiciliary = office.type === 'DOMICILIARY';
  const canEdit = useFeatureFlag('canEditRosterSettings');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  // `?edit=availability-types` opens the Visit and event types editor straight
  // onto that setting (the contract's "turn on availability types" link).
  const [searchParams, setSearchParams] = useSearchParams();
  const [openedForCareType] = useState(() => ['availability-types', 'availability-by-care-type'].includes(searchParams.get('edit') ?? ''));
  const [visitEventOpen, setVisitEventOpen] = useState(openedForCareType);
  const closeVisitEvent = () => {
    setVisitEventOpen(false);
    // Drop the param so a reload doesn't reopen the editor.
    if (searchParams.has('edit')) {
      const next = new URLSearchParams(searchParams);
      next.delete('edit');
      setSearchParams(next, { replace: true });
    }
  };

  const [activeId, setActiveId] = useActiveSection(
    NAV.map((n) => n.id),
    stickyOffset + 24,
    { syncHash: true },
  );

  return (
    <div>
      <div
        ref={titleRef}
        className="sticky z-30 bg-gray-50 pt-4 pb-4 mb-6 border-b border-gray-200"
        style={{ top: infoBarBottom }}
      >
        <h1 className="text-lg font-semibold text-gray-900">Roster Settings</h1>
      </div>

      <div className="flex gap-8 items-start">
        <SectionNav
          items={NAV}
          activeId={activeId}
          onSelect={setActiveId}
          top={stickyOffset + 24}
          ariaLabel="Roster settings sections"
        />

        <div className="flex-1 min-w-0 max-w-[1200px] space-y-6">
          {!canEdit && (
            <InfoBanner>You don't have permission to change Roster settings, so you can view them but not edit them.</InfoBanner>
          )}
          <SettingsSection
            id="visit-event-types"
            title="Visit and event types"
            Icon={VisitTypesIcon}
            scrollMarginTop={scrollMarginTop}
            onEdit={() => setVisitEventOpen(true)}
          >
            <TableIntro
              title="Visit types"
              description="Visit care types are assigned to visits to describe the care and set appropriate charge rates and pay rates"
            />
            <DataTable>
              <thead>
                <tr>
                  <th className={TH}>Care Type</th>
                  <th className={TH}>Description</th>
                  <th className={TH}>Include in holiday pay</th>
                  <th className={TH}>Colour</th>
                </tr>
              </thead>
              <tbody>
                {visitTypes.map((c) => (
                  <tr key={c.id}>
                    <td className={TD}>{c.label}</td>
                    <td className={`${TD} max-w-[400px]`}>{c.description}</td>
                    <td className={TD}>{c.includeInHolidayPay ? 'Yes' : 'No'}</td>
                    <td className={TD}><Swatch colour={c.colour} /></td>
                  </tr>
                ))}
              </tbody>
            </DataTable>

            {/* Its own panel, separate from the table: a setting about how these
                visit types are grouped for availability, not another visit type. Domiciliary only. */}
            {isDomiciliary && (
              <div
                id="availability-types"
                className="mt-6 rounded-[10px] border border-gray-200 bg-gray-50 p-5"
                style={{ scrollMarginTop }}
              >
                <h3 className="text-base font-semibold text-gray-900">Availability types</h3>
                <InfoBanner className="mt-3">{AVAILABILITY_TYPES_HELPER}</InfoBanner>
                <dl className="mt-4">
                  <div className="grid gap-x-8 gap-y-1 sm:grid-cols-[minmax(0,26rem)_1fr]">
                    <dt className="text-body font-semibold text-gray-700">Availability types</dt>
                    <dd className="text-body text-gray-900">{advanced.availabilityByCareType ? 'Enabled' : 'Disabled'}</dd>
                  </div>
                </dl>

                {advanced.availabilityByCareType && (
                  <>
                    <UncoveredWarning labels={uncoveredLabels} className="mt-4" />

                    <DataTable className="mt-4 bg-white">
                      <thead>
                        <tr>
                          <th className={TH}>Availability type</th>
                          <th className={TH}>Visit types</th>
                          <th className={TH}>Enabled</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availabilityTypes.map((t) => (
                          <tr key={t.id}>
                            <td className={TD}>
                              <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                <span className="flex items-center gap-3 font-semibold text-gray-900">
                                  <Swatch colour={t.colour} />
                                  {t.name}
                                </span>
                                {t.isDefault && <DefaultPill />}
                              </span>
                            </td>
                            <td className={TD}>
                              {t.visitTypeIds.length ? (
                                <span className="flex flex-wrap gap-2">
                                  {t.visitTypeIds.map((id) => {
                                    const v = visitTypes.find((x) => x.id === id) ?? CARE_TYPES.find((x) => x.id === id);
                                    return v ? <VisitTypeChip key={id} label={v.label} colour={v.colour} /> : null;
                                  })}
                                </span>
                              ) : (
                                <span className="text-gray-700">No visit types yet</span>
                              )}
                            </td>
                            <td className={TD}>{yesNo(t.enabled)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </DataTable>
                  </>
                )}

                {/* While it's on, the panel carries what needs doing next — in place,
                    rather than in a dialog stacked on the slide-out. */}
                {advanced.availabilityByCareType && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-semibold text-gray-900">Review existing availability</h4>
                    <p className="text-body text-gray-700 mt-1">
                      Employees' existing availability is treated as <strong>{defaultAvailabilityType?.name ?? 'the default type'}</strong>.
                      Review it on each employee's contract and set a different availability type wherever they work
                      something else, such as Live-in. Until you do, the optimiser will only match{' '}
                      {defaultAvailabilityType?.name ?? 'default'} visits to that availability.
                    </p>
                    <div className="mt-3">
                      <Button variant="secondary" size="sm" onClick={() => navigate('/employees/records')}>
                        Review availability
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8">
              <TableIntro
                title="Non-contact event types"
                description="Non-contact events for employees where no customer is visited"
              />
              <DataTable>
                <thead>
                  <tr>
                    <th className={TH}>Event type</th>
                    <th className={TH}>Description</th>
                    <th className={TH}>Pay employee</th>
                    <th className={TH}>Pay mileage</th>
                    <th className={TH}>Pay travel time</th>
                    <th className={TH}>Include in holiday pay</th>
                    <th className={TH}>Colour</th>
                  </tr>
                </thead>
                <tbody>
                  {eventTypes.map((e) => (
                    <tr key={e.name}>
                      <td className={TD}>{e.name}</td>
                      <td className={`${TD} max-w-[400px]`}>{e.description}</td>
                      <td className={TD}>{yesNo(e.payEmployee)}</td>
                      <td className={TD}>{yesNo(e.payMileage)}</td>
                      <td className={TD}>{yesNo(e.payTravelTime)}</td>
                      <td className={TD}>{yesNo(e.holidayPay)}</td>
                      <td className={TD}><Swatch colour={e.colour} /></td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </div>
          </SettingsSection>

          <SettingsSection id="contracts-and-pay" title="Contracts and pay" Icon={ContractsIcon} scrollMarginTop={scrollMarginTop}>
            <SettingBlocks blocks={CONTRACTS_BLOCKS_TOP} />

            <div className="py-5 border-t border-gray-200">
              <TableIntro
                title="Contract types"
                description="Contract types are used to identify availability periods within the schedule and to define pay rates for payroll"
              />
              <DataTable>
                <thead>
                  <tr>
                    <th className={TH}>Contract name &amp; color</th>
                    <th className={TH}>Description</th>
                    <th className={TH}>Enabled</th>
                  </tr>
                </thead>
                <tbody>
                  {CONTRACT_TYPES.map((c) => (
                    <tr key={c.name}>
                      <td className={TD}>
                        <span className="flex items-center gap-3">
                          <Swatch colour={c.colour} />
                          {c.name}
                        </span>
                      </td>
                      <td className={TD}>
                        <p>{c.description}</p>
                        <dl className="mt-3 space-y-1">
                          {c.details.map(([label, value]) => (
                            <div key={label} className="flex gap-1.5 text-body">
                              <dt className="text-gray-700">{label}:</dt>
                              <dd className="font-medium text-gray-900">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </td>
                      <td className={TD}>{c.enabled}</td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </div>

            <div className="border-t border-gray-200 pt-5">
              <SettingBlocks blocks={CONTRACTS_BLOCKS_BOTTOM} />
            </div>

            <div className="border-t border-gray-200 pt-5">
              <TableIntro
                title="Sage 50 Payroll"
                description="Only populate these settings if you intend to use the Sage 50 Payroll export report to upload data from PASS to Sage. This section lets you configure the payment reference codes for each pay component managed within PASS so that payroll data can be uploaded directly into your Sage system without manual file preparation."
              />
              <DataTable>
                <thead>
                  <tr>
                    <th className={TH}>Pay component</th>
                    <th className={TH}>Payment reference code</th>
                    <th className={TH}>Sage description</th>
                  </tr>
                </thead>
                <tbody>
                  {SAGE_ROWS.map((r) => (
                    <tr key={r}>
                      <td className={TD}>{r}</td>
                      <td className={TD}>-</td>
                      <td className={TD}>-</td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </div>
          </SettingsSection>

          <SettingsSection id="charging-and-invoicing" title="Charging and invoicing" Icon={ChargingIcon} scrollMarginTop={scrollMarginTop}>
            <SettingBlocks blocks={CHARGING_BLOCKS} />
          </SettingsSection>

          <SettingsSection id="time-thresholds" title="Time thresholds" Icon={TimeThresholdsIcon} scrollMarginTop={scrollMarginTop}>
            <SettingBlocks blocks={THRESHOLD_BLOCKS} />
          </SettingsSection>

          <SettingsSection id="expense-types" title="Expense types" Icon={ExpenseTypesIcon} scrollMarginTop={scrollMarginTop}>
            <TableIntro title="Expense types" description="These expense types will be available to select from within the Roster" />
            <DataTable>
              <thead>
                <tr>
                  <th className={TH}>Expense Type</th>
                  <th className={TH}>Description</th>
                  <th className={TH}>Enabled</th>
                </tr>
              </thead>
              <tbody>
                {EXPENSE_TYPES.map((e) => (
                  <tr key={e.name}>
                    <td className={TD}>{e.name}</td>
                    <td className={TD}>{e.description}</td>
                    <td className={TD}>{e.enabled}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <div className="mt-5 pt-5 border-t border-gray-200">
              <SettingBlocks blocks={EXPENSE_BLOCKS} />
            </div>
          </SettingsSection>

          <SettingsSection id="cancellation-reasons" title="Cancellation reasons" Icon={CancellationReasonsIcon} scrollMarginTop={scrollMarginTop}>
            <TableIntro title="Cancellation reasons" description="These appear when cancelling a visit in schedule or timesheets" />
            <DataTable>
              <thead>
                <tr>
                  <th className={TH}>Name</th>
                  <th className={TH}>Description</th>
                  <th className={TH}>Cancellation policy</th>
                  <th className={TH}>Enabled</th>
                </tr>
              </thead>
              <tbody>
                {CANCELLATION_REASONS.map((r) => (
                  <tr key={r.name}>
                    <td className={TD}>{r.name}</td>
                    <td className={TD}>{r.description}</td>
                    <td className={TD}>{r.policy}</td>
                    <td className={TD}>{r.enabled}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </SettingsSection>

          <SettingsSection id="holidays-and-absences" title="Holidays and absences settings" Icon={HolidaysIcon} scrollMarginTop={scrollMarginTop}>
            <SettingBlocks blocks={HOLIDAY_RENEWAL_BLOCKS} />

            <div className="py-5 border-t border-gray-200">
              <TableIntro title="Holiday schemes" description="Holiday schemes are used to identify an employees annual holiday entitlement" />
              <DataTable>
                <thead>
                  <tr>
                    <th className={TH}>Scheme name</th>
                    <th className={TH}>Description</th>
                    <th className={TH}>Enabled</th>
                  </tr>
                </thead>
                <tbody>
                  {HOLIDAY_SCHEMES.map((h) => (
                    <tr key={h.name}>
                      <td className={TD}>{h.name}</td>
                      <td className={TD}>
                        <dl className="space-y-1">
                          {h.details.map(([label, value]) => (
                            <div key={label} className="flex gap-1.5">
                              <dt className="text-gray-700">{label}:</dt>
                              <dd className="font-medium text-gray-900">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </td>
                      <td className={TD}>{h.enabled}</td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </div>

            <div className="border-t border-gray-200 pt-5">
              <SettingBlocks blocks={PUBLIC_HOLIDAY_CALC_BLOCKS} />
            </div>

            <div className="border-t border-gray-200 py-5">
              <PublicHolidays />
            </div>

            <div className="border-t border-gray-200 py-5">
              <TableIntro title="Absence types" description="Set up absence types and choose whether to pay for them or not" />
              <DataTable>
                <thead>
                  <tr>
                    <th className={TH}>Absence Type</th>
                    <th className={TH}>Description</th>
                    <th className={TH}>Enabled</th>
                  </tr>
                </thead>
                <tbody>
                  {ABSENCE_TYPES.map((a) => (
                    <tr key={a.name}>
                      <td className={TD}>{a.name}</td>
                      <td className={TD}>{a.description}</td>
                      <td className={TD}>Yes</td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </div>

            <div className="border-t border-gray-200 pt-5">
              <SettingBlocks blocks={HOLIDAY_APP_BLOCKS} />
            </div>
          </SettingsSection>

          <SettingsSection id="office-calendar" title="Office calendar" Icon={OfficeCalendarIcon} scrollMarginTop={scrollMarginTop}>
            <SettingBlocks blocks={OFFICE_CYCLE_BLOCKS} />
          </SettingsSection>

          <SettingsSection id="communications" title="Communications" Icon={CommunicationsIcon} scrollMarginTop={scrollMarginTop} editable={false}>
            <SettingBlocks blocks={COMMUNICATIONS_BLOCKS} />
          </SettingsSection>

          <SettingsSection
            id="advanced-settings"
            title="Advanced settings"
            Icon={AdvancedSettingsIcon}
            scrollMarginTop={scrollMarginTop}
            onEdit={() => setAdvancedOpen(true)}
          >
            <SettingBlocks blocks={advancedBlocks(advanced, table)} />
          </SettingsSection>
        </div>
      </div>

      {advancedOpen && canEdit && <AdvancedSettingsSlideout onClose={() => setAdvancedOpen(false)} />}
      {visitEventOpen && canEdit && (
        <VisitEventTypesSlideout
          isDomiciliary={isDomiciliary}
          onClose={closeVisitEvent}
          focusAvailability={openedForCareType}
          onSaved={() => window.setTimeout(() => document.getElementById('availability-types')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 350)}
        />
      )}
    </div>
  );
}
