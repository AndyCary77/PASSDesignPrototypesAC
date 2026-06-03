import { Edit, Pencil } from 'lucide-react';
import { Tag } from '../ui/tag';

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
      <span className="w-[180px] flex-shrink-0 text-sm text-gray-500">{label}</span>
      <div className="flex-1 text-sm text-gray-900">{children}</div>
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
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5 leading-snug">{description}</p>
        </div>
        <button
          className="flex-shrink-0 p-1.5 text-gray-500 hover:text-gray-900 rounded-full border border-gray-200 transition-colors"
          style={{ backgroundColor: 'rgb(220, 217, 228)' }}
          aria-label={`Edit ${title}`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {items.length > 0 ? (
          items.map((item, i) => (
            <Tag key={i} label={item.label} value={item.value} variant={item.variant} />
          ))
        ) : (
          <span className="text-xs text-gray-400 italic">None specified</span>
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
}

interface VisitData {
  title: string;
  startDate: string;
  endDate: string;
  careType: string;
  startTime: string;
  endTime: string;
  duration: string;
  careworkers: number;
  funder: string;
  chargeRateSheet: string;
  depositStatus: string;
  payRateSheet: string;
  cadenceType: string;
  weeks: Array<{ currentWeek?: boolean; activeDays: number[] }>;
  careRequirements: VisitCareRequirements;
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// ─── Visit card ───────────────────────────────────────────────────────────────

function VisitCard({ visitNumber, data }: { visitNumber: number; data: VisitData }) {
  return (
    <div>
      {/* Visit header row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-900">Visit {visitNumber}</span>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Visit status</label>
          <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
            <button className="px-3 py-1.5 text-sm bg-white text-gray-600 hover:bg-gray-50">
              Inactive
            </button>
            <button className="px-3 py-1.5 text-sm bg-[rgb(154,38,214)] text-white">
              Active
            </button>
          </div>
        </div>
      </div>

      {/* Two-panel card */}
      <div className="bg-white rounded-lg border border-gray-200 flex divide-x divide-gray-200">

        {/* LEFT — visit details */}
        <div className="flex-1 px-6 pt-4 pb-2 relative min-w-0">
          <button
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            aria-label="Edit visit"
          >
            <Edit className="w-4 h-4" />
          </button>

          <FieldRow label="Visit title">{data.title}</FieldRow>
          <FieldRow label="Start date">{data.startDate}</FieldRow>
          <FieldRow label="End date">{data.endDate}</FieldRow>
          <FieldRow label="Care type">{data.careType}</FieldRow>
          <FieldRow label="Start time">{data.startTime}</FieldRow>
          <FieldRow label="End time">{data.endTime}</FieldRow>
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
          <p className="text-sm font-semibold text-gray-900 mb-0.5">Care requirements</p>
          <p className="text-xs text-gray-400 mb-1 leading-snug">
            Inherited from customer defaults — adjust per visit as needed.
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
};

export function ServiceAgreementPage() {
  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm text-gray-600">Displaying 2/2 visits</span>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input type="checkbox" className="rounded border-gray-300" defaultChecked />
          <span>Hide inactive</span>
        </label>
      </div>

      <div className="space-y-6">
        <VisitCard
          visitNumber={1}
          data={{
            title: 'Friday visit',
            startDate: '21/11/2025',
            endDate: 'Ongoing',
            careType: 'Companionship',
            startTime: '11:00',
            endTime: '12:00',
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
          }}
        />

        <VisitCard
          visitNumber={2}
          data={{
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
          }}
        />

        {/* Weekly Schedule */}
        <div className="bg-white rounded-lg border border-gray-200 relative">
          <button
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            aria-label="Edit weekly schedule"
          >
            <Edit className="w-4 h-4" />
          </button>
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
