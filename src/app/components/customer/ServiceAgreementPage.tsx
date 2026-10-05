import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { PencilSolidIcon } from '../icons/PencilSolidIcon';
import { Button } from '../buttons/Button';
import { Tag } from '../ui/tag';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { VisitEditSlideout } from './VisitEditSlideout';
import { useCustomer } from '../../data/CustomerContext';

// ─── Day circle ──────────────────────────────────────────────────────────────

function DayCircle({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium border ${
        active
          ? 'bg-[rgb(154,38,214)] border-[rgb(154,38,214)] text-white'
          : 'bg-white border-gray-300 text-gray-400'
      }`}
    >
      {label}
    </div>
  );
}

// ─── Week pill badge ──────────────────────────────────────────────────────────

function WeekBadge({ label, sub }: { label: string; sub?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
      {label}
      {sub && <span className="font-normal text-gray-500">{sub}</span>}
    </span>
  );
}

// ─── Field row (label left / value right) ────────────────────────────────────

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start py-2.5 border-b border-gray-100 last:border-b-0">
      <span className="w-[180px] flex-shrink-0 text-base text-gray-900">{label}</span>
      <div className="flex-1 text-base font-medium text-gray-900">{children}</div>
    </div>
  );
}

// ─── Visit-level care requirement section ────────────────────────────────────

interface CareReqItem {
  label: string;
  value?: string;
  variant?: 'preferred' | 'excluded';
}

function VisitCareSection({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: CareReqItem[];
}) {
  return (
    <div className="py-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-1">
          <p className="text-base font-medium text-gray-900">{title}</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer" aria-label={`About ${title}`}>
                <Info className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] text-xs leading-snug">
              {description}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.length > 0 ? (
          items.map((item, i) => (
            <Tag key={i} label={item.label} value={item.value} variant={item.variant} />
          ))
        ) : (
          <span className="text-sm text-gray-400 italic">None specified</span>
        )}
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface VisitCareRequirements {
  mandatory: CareReqItem[];
  preferred: CareReqItem[];
  preferredEmployees: CareReqItem[];
  excluded: CareReqItem[];
  visitEnvironment: CareReqItem[];
}

interface VisitData {
  title: string;
  startDate: string;
  endDate: string;
  careType: string;
  startTime: string;
  earliestStart?: string;
  endTime: string;
  latestEnd?: string;
  duration: string;
  careworkers: number;
  funder: string;
  chargeRateSheet: string;
  depositStatus: string;
  payRateSheet: string;
  cadenceType: string;
  weeks: Array<{ currentWeek?: boolean; activeDays: number[] }>;
  careRequirements: VisitCareRequirements;
  leewayMins?: number;
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function parseTimeToMinutes(t: string) {
  const [hh, mm] = t.split(':').map((s) => parseInt(s, 10) || 0);
  return hh * 60 + mm;
}

function formatMinutesToTime(totalMins: number) {
  const m = ((totalMins % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh = Math.floor(m / 60)
    .toString()
    .padStart(2, '0');
  const mm = (m % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

// ─── Visit card ───────────────────────────────────────────────────────────────

function VisitCard({ visitNumber, data, onEdit }: { visitNumber: number; data: VisitData; onEdit: () => void }) {
  return (
    <div>
      {/* Visit header row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-900">Visit {visitNumber}</span>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Visit status</label>
          <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
            <button className="px-3 py-1.5 text-sm bg-white text-gray-600 hover:bg-gray-50 cursor-pointer">
              Inactive
            </button>
            <button className="px-3 py-1.5 text-sm bg-[rgb(154,38,214)] text-white cursor-pointer">
              Active
            </button>
          </div>
        </div>
      </div>

      {/* Two-panel card */}
      <div className="bg-white rounded-lg border border-gray-200 flex divide-x divide-gray-200">

        {/* LEFT — visit details */}
        <div className="flex-1 px-6 pt-4 pb-2 relative min-w-0">
          <Button
            variant="tertiary"
            size="sm"
            iconOnly
            onClick={onEdit}
            className="absolute top-4 right-4 flex-shrink-0"
            aria-label="Edit visit"
          >
            <PencilSolidIcon className="w-4 h-4" />
          </Button>

          <FieldRow label="Visit title">{data.title}</FieldRow>
          <FieldRow label="Start date">{data.startDate}</FieldRow>
          <FieldRow label="End date">{data.endDate}</FieldRow>
          <FieldRow label="Care type">{data.careType}</FieldRow>
          <FieldRow label="Start time">
            <div>{data.startTime}</div>
                    {typeof data.leewayMins !== 'undefined' ? (
                      (() => {
                        const leeway = data.leewayMins ?? 0;
                        const startM = parseTimeToMinutes(data.startTime);
                        const earliest = startM - leeway;
                        const latest = startM + leeway;
                        const earliestStr = formatMinutesToTime(earliest);
                        const latestStr = formatMinutesToTime(latest);
                        const earliestDay = earliest < 0 ? ' (prev day)' : '';
                        const latestDay = latest >= 24 * 60 ? ' (next day)' : '';
                        return (
                          <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="About leeway">
                                  <Info className="w-3.5 h-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[220px] text-xs leading-snug">
                                This leeway is used by our automated scheduling features
                              </TooltipContent>
                            </Tooltip>
                            <span>Leeway: {leeway} mins</span>
                            <span className="text-sm text-gray-400">(Range: {earliestStr}{earliestDay} — {latestStr}{latestDay})</span>
                          </div>
                        );
                      })()
                    ) : data.earliestStart ? (
                      <div className="text-sm text-gray-500 mt-0.5">Earliest: {data.earliestStart}</div>
                    ) : null}
          </FieldRow>
          {typeof data.leewayMins !== 'undefined' && (
            <FieldRow label="Visit start time leeway">{data.leewayMins} mins</FieldRow>
          )}
          <FieldRow label="End time">
            <div>{data.endTime}</div>
            {/* Latest end intentionally omitted from the summary view */}
          </FieldRow>
          <FieldRow label="Duration">{data.duration}</FieldRow>
          <FieldRow label="Careworkers">{data.careworkers}</FieldRow>

          {/* Cadence */}
          <FieldRow label="Cadence">
            <div className="space-y-3">
              <span>{data.cadenceType}</span>
              {data.weeks.map((week, wi) => (
                <div key={wi} className="space-y-2">
                  <WeekBadge
                    label={`Week ${wi + 1}`}
                    sub={week.currentWeek ? '(Current week)' : undefined}
                  />
                  <div className="flex gap-1.5">
                    {DAYS.map((day, di) => (
                      <DayCircle
                        key={`w${wi}-d${di}`}
                        label={day}
                        active={week.activeDays.includes(di)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </FieldRow>

          <FieldRow label="Funder">{data.funder}</FieldRow>
          <FieldRow label="Charge rate sheet">{data.chargeRateSheet}</FieldRow>
          <FieldRow label="Deposit status">{data.depositStatus}</FieldRow>
          <FieldRow label="Pay rate sheet">{data.payRateSheet}</FieldRow>
        </div>

        {/* RIGHT — care requirements (per-visit overrides) */}
        <div className="w-[340px] flex-shrink-0 px-6 pt-4 pb-2">
          <div className="flex items-start justify-between gap-3 mb-0.5">
            <p className="text-base font-semibold text-gray-900">Care requirements</p>
            <Button
              variant="tertiary"
              size="sm"
              iconOnly
              className="flex-shrink-0"
              aria-label="Edit care requirements"
            >
              <PencilSolidIcon className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-500 mb-1 leading-snug">
            Inherited from customer defaults — <br></br>
            adjust per visit as needed.
          </p>

          <VisitCareSection
            title="Mandatory"
            description="Only careworkers meeting these requirements can be scheduled."
            items={data.careRequirements.mandatory}
          />
          <VisitCareSection
            title="Preferred"
            description="Matching careworkers are prioritised but others can still be assigned."
            items={data.careRequirements.preferred}
          />
          <VisitCareSection
            title="Preferred employees"
            description="These careworkers will be prioritised for this visit."
            items={data.careRequirements.preferredEmployees}
          />
          <VisitCareSection
            title="Excluded careworkers"
            description="These careworkers cannot be scheduled for this visit."
            items={data.careRequirements.excluded}
          />
          <VisitCareSection
            title="Environment"
            description="Environmental details used to match careworkers with compatible restrictions."
            items={data.careRequirements.visitEnvironment}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// Shared customer-level defaults (same as CareRequirementsPage)
const defaultCareRequirements: VisitCareRequirements = {
  mandatory: [{ label: 'Area', value: 'Sutton Coldfield' }],
  preferred: [
    { label: 'Medical Conditions', value: 'Glaucoma' },
    { label: 'Medical Conditions', value: 'Hypertension' },
    { label: 'Medical Conditions', value: 'Stroke' },
  ],
  preferredEmployees: [{ label: 'Claire Restall', variant: 'preferred' }],
  excluded: [{ label: 'John Smith', variant: 'excluded' }],
  visitEnvironment: [
    { label: 'Other pets' },
    { label: 'Smoker' },
    { label: 'Stairs' },
  ],
};

const VISIT_1_DATA: VisitData = {
  title: 'Friday visit',
  startDate: '21/11/2025',
  endDate: 'Ongoing',
  careType: 'Companionship',
  startTime: '11:00',
  earliestStart: '10:30',
  endTime: '12:00',
  latestEnd: '12:30',
  duration: '1 hour',
  careworkers: 1,
  funder: 'Mr Arthur Barrington',
  chargeRateSheet: 'North Northumberland',
  depositStatus: '-',
  payRateSheet: '-',
  cadenceType: 'BiWeekly',
  weeks: [
    { currentWeek: true, activeDays: [4] },
    { activeDays: [4] },
  ],
  careRequirements: defaultCareRequirements,
  leewayMins: 15,
};

const VISIT_2_DATA: VisitData = {
  title: 'Lunch visit',
  startDate: '11/03/2026',
  endDate: 'Ongoing',
  careType: 'Personal care',
  startTime: '13:00',
  endTime: '13:30',
  duration: '30 minutes',
  careworkers: 1,
  funder: 'Mr Arthur Barrington',
  chargeRateSheet: 'North Northumberland',
  depositStatus: '-',
  payRateSheet: '-',
  cadenceType: 'BiWeekly',
  weeks: [
    { currentWeek: true, activeDays: [0, 2] },
    { activeDays: [0, 2] },
  ],
  careRequirements: defaultCareRequirements,
  leewayMins: 15,
};

// New enquiry customer — visits created to plan the rota, but care requirements,
// funder and rates aren't set up yet (that happens as the plan is built).
const emptyCareRequirements: VisitCareRequirements = {
  mandatory: [],
  preferred: [],
  preferredEmployees: [],
  excluded: [],
  visitEnvironment: [],
};

const EDITH_VISIT_1_DATA: VisitData = {
  title: 'Morning call',
  startDate: '13/07/2026',
  endDate: 'Ongoing',
  careType: 'Personal care',
  startTime: '08:00',
  endTime: '08:45',
  duration: '45 minutes',
  careworkers: 1,
  funder: 'To be confirmed',
  chargeRateSheet: '-',
  depositStatus: '-',
  payRateSheet: '-',
  cadenceType: 'Weekly',
  weeks: [{ currentWeek: true, activeDays: [0, 1, 2, 3, 4, 5, 6] }],
  careRequirements: emptyCareRequirements,
  leewayMins: 15,
};

const EDITH_VISIT_2_DATA: VisitData = {
  title: 'Lunch call',
  startDate: '13/07/2026',
  endDate: 'Ongoing',
  careType: 'Meal preparation',
  startTime: '12:30',
  endTime: '13:00',
  duration: '30 minutes',
  careworkers: 1,
  funder: 'To be confirmed',
  chargeRateSheet: '-',
  depositStatus: '-',
  payRateSheet: '-',
  cadenceType: 'Weekly',
  weeks: [{ currentWeek: true, activeDays: [0, 1, 2, 3, 4, 5, 6] }],
  careRequirements: emptyCareRequirements,
  leewayMins: 15,
};

// Vera's enquiry produced the same two visits as Edith's, a month later —
// kept in step with VERA_VISITS in caremanagement/types.ts, which is where
// the Care Management tab reads them from.
const VERA_VISIT_DATA: VisitData[] = [EDITH_VISIT_1_DATA, EDITH_VISIT_2_DATA].map(visit => ({
  ...visit,
  startDate: '10/08/2026',
}));

const SERVICE_AGREEMENT_DATA: Record<string, VisitData[]> = {
  'arthur-barrington': [VISIT_1_DATA, VISIT_2_DATA],
  'edith-caldwell': [EDITH_VISIT_1_DATA, EDITH_VISIT_2_DATA],
  'vera-bramwell': VERA_VISIT_DATA,
};

export function ServiceAgreementPage() {
  const customer = useCustomer();
  const [visits, setVisits] = useState<VisitData[]>(() => SERVICE_AGREEMENT_DATA[customer.id] ?? []);
  const [editingVisit, setEditingVisit] = useState<{ number: number; data: VisitData } | null>(null);

  useEffect(() => {
    setVisits(SERVICE_AGREEMENT_DATA[customer.id] ?? []);
  }, [customer.id]);

  return (
    <div>
      {editingVisit && (
        <VisitEditSlideout
          visitNumber={editingVisit.number}
          data={editingVisit.data}
          onClose={() => setEditingVisit(null)}
          onSave={(update) => {
            const idx = editingVisit.number - 1;
            const copy = [...visits];
            copy[idx] = { ...copy[idx], ...update };
            setVisits(copy);
            SERVICE_AGREEMENT_DATA[customer.id] = copy;
          }}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm text-gray-600">Displaying {visits.length}/{visits.length} visits</span>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input type="checkbox" className="rounded border-gray-300" defaultChecked />
          <span>Hide inactive</span>
        </label>
      </div>

      <div className="space-y-6">
        {visits.map((visit, i) => (
          <VisitCard
            key={i}
            visitNumber={i + 1}
            data={visit}
            onEdit={() => setEditingVisit({ number: i + 1, data: visit })}
          />
        ))}

        {/* Weekly Schedule */}
        <div className="bg-white rounded-lg border border-gray-200 relative">
          <Button
            variant="tertiary"
            size="sm"
            iconOnly
            className="absolute top-4 right-4 flex-shrink-0"
            aria-label="Edit weekly schedule"
          >
            <PencilSolidIcon className="w-4 h-4" />
          </Button>
          <div className="px-6 pt-4 pb-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Weekly schedule</h3>
            <FieldRow label="Send">Yes</FieldRow>
            <FieldRow label="Recipients">The customer</FieldRow>
            <FieldRow label="Delivery method">Email</FieldRow>
          </div>
        </div>
      </div>
    </div>
  );
}
