import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCustomer } from '../../../data/CustomerContext';
import { TabEmptyState } from '../TabEmptyState';

const PATIENT = {
  dob: '10/12/1972',
  address: 'Room 1, 12 Harts Lane, IG11 8LZ',
  gpName: 'Dr Mathsukia',
  allergies: 'No known allergies',
  medicationCount: 2,
  controlledDrugsCount: 0,
};

type DayStatus = 'GIVEN' | 'PARTIAL' | 'INCOMPLETE' | 'MISSED' | 'FUTURE' | 'MULTI' | 'SELF' | 'NONE';

interface TaskInstance {
  date: string;
  status: DayStatus;
  initials?: string;
}

interface Visit {
  label: string;
  timeWindow: string;
  instances: TaskInstance[];
}

interface Medication {
  name: string;
  supportRequired: string;
  startsEnds: string;
  route: string;
  form: string;
  dosage: string;
  notes: string;
  visits: Visit[];
}

const TODAY = new Date(2026, 5, 18);

const CARER_INITIALS = ['JD', 'SM', 'KL', 'RB', 'AT', 'PH', 'ML', 'CB', 'TW', 'NR'];

function generateInstances(
  month: number,
  year: number,
  overrides: Record<number, { status: DayStatus; initials?: string }> = {}
): TaskInstance[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = new Date(year, month - 1, day);
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (date > TODAY) return { date: dateStr, status: 'FUTURE' };
    if (overrides[day]) return { date: dateStr, ...overrides[day] };
    return { date: dateStr, status: 'GIVEN', initials: CARER_INITIALS[day % CARER_INITIALS.length] };
  });
}

const MEDICATIONS: Medication[] = [
  {
    name: 'Clozaril 100mg tablets',
    supportRequired: 'Prompt',
    startsEnds: '10/07/2021 to ongoing',
    route: 'Oral',
    form: 'Tablet',
    dosage: '100mg (1 Tablet)',
    notes: 'Directions: Take 100mg twice a day, 1 in the Morning & 2 in the evening.\nWarning: This medicine may make you sleepy. Do not drive or use tools or machinery. Do not drink alcohol.\nSide Effects: Drowsiness, dizziness, feeling unsteady, increased salivation, dry mouth, restlessness, headache.',
    visits: [
      {
        label: 'Morning Visit', timeWindow: '07:00 - 07:30',
        instances: generateInstances(6, 2026, {
          7:  { status: 'MISSED' },
          14: { status: 'PARTIAL', initials: '3' },
        }),
      },
      {
        label: 'Evening Visit', timeWindow: '17:55 - 18:25',
        instances: generateInstances(6, 2026, {
          11: { status: 'PARTIAL', initials: '2' },
        }),
      },
    ],
  },
  {
    name: 'Clozapine 25mg tablets',
    supportRequired: 'Prompt',
    startsEnds: '14/09/2024 to ongoing',
    route: 'Oral',
    form: 'Tablet',
    dosage: '2 x 25mg',
    notes: 'Direction: Take 2 at night.\nUsage: Clozapine is used to treat schizophrenia. It works by changing the activity of certain natural substances in the brain.\nSide-Effects: Blurred vision, dizziness, drowsiness, confusion, nausea, vomiting, constipation, or difficult urination.',
    visits: [
      {
        label: 'Night Visit', timeWindow: '21:00 - 21:30',
        instances: generateInstances(6, 2026),
      },
    ],
  },
];

const STATUS_STYLE: Record<DayStatus, { bg: string; border: string; text: string; outline?: string }> = {
  GIVEN:      { bg: '#22c55e', border: '#16a34a', text: '#fff' },
  PARTIAL:    { bg: '#facc15', border: '#eab308', text: '#78350f' },
  INCOMPLETE: { bg: '#ef4444', border: '#b91c1c', text: '#fff', outline: '#b91c1c' },
  MISSED:     { bg: '#f5b5be', border: '#f87171', text: '#7f1d1d' },
  FUTURE:     { bg: '#e5e7eb', border: '#d1d5db', text: '#9ca3af' },
  MULTI:      { bg: '#e5e7eb', border: '#9ca3af', text: '#6b7280' },
  SELF:       { bg: '#e5e7eb', border: '#9ca3af', text: '#6b7280' },
  NONE:       { bg: '#fff',    border: '#e5e7eb', text: '#6b7280' },
};

const BUBBLE = 40;
const COL = 52;
const LEFT_INFO = 320;
const LEFT_VISIT = 130;
const ROW_H = BUBBLE + 20;
const DAY_H = 54;

const REASON_CODES = [
  '1: Refused, will retry',
  '2: Refused, will not be retried',
  '3: Refused',
  '4: Nausea or Vomiting',
  '5: Hospitalised',
  '6: Social Leave',
  '7: Refused and Destroyed',
  '8: Dose not available',
  '9: Customer cancelled',
  '10: Customer not available',
  '11: Task already completed',
  '12: Not Required',
  '13: Other',
];

function Bubble({ status, initials }: { status: DayStatus; initials?: string }) {
  const s = STATUS_STYLE[status];
  return (
    <div
      style={{
        width: BUBBLE, height: BUBBLE,
        borderRadius: '50%',
        backgroundColor: s.bg,
        border: `2px solid ${s.border}`,
        boxShadow: status === 'INCOMPLETE' ? `0 0 0 2px ${s.outline}` : undefined,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: s.text, fontSize: 11, fontWeight: 700,
        flexShrink: 0, cursor: 'pointer', transition: 'transform 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {status === 'MULTI' ? (
        <span style={{ letterSpacing: 1, fontSize: 10 }}>•••</span>
      ) : status === 'SELF' ? (
        <span style={{ fontSize: 13 }}>✕</span>
      ) : (
        <span>{initials ?? ''}</span>
      )}
    </div>
  );
}

function LegendBubble({ status, label, children }: { status: DayStatus; label: string; children?: React.ReactNode }) {
  const s = STATUS_STYLE[status];
  return (
    <div className="flex items-center gap-2 text-xs text-gray-700">
      <div
        style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          backgroundColor: s.bg, border: `2px solid ${s.border}`,
          boxShadow: status === 'INCOMPLETE' ? `0 0 0 2px ${s.outline}` : undefined,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: s.text, fontSize: 10, fontWeight: 700,
        }}
      >
        {children}
      </div>
      {label && <span>{label}</span>}
    </div>
  );
}

function MedInfoDetails({ med }: { med: Medication }) {
  const [open, setOpen] = useState(false);

  const fields: [string, string][] = [
    ['Support required', med.supportRequired],
    ['Route',           med.route],
    ['Starts & Ends',   med.startsEnds],
    ['Form',            med.form],
    ['Dosage',          med.dosage],
  ];

  return (
    <div className="flex flex-col h-full">

      {/* Fields in 2-column grid */}
      <div className="grid grid-cols-2 gap-x-5 gap-y-1 p-3 pb-2 flex-1 bg-gray-50">
        {fields.map(([label, val]) => (
          <div key={label} className="flex flex-col">
            <span className="text-gray-400 uppercase tracking-wide font-medium" style={{ fontSize: 11 }}>{label}</span>
            <span className="font-medium text-gray-800" style={{ fontSize: 14 }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Notes section */}
      <div className="border-t border-gray-100 px-3 py-2 bg-gray-50">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-[#5c1c85] transition-colors"
          style={{ fontSize: 12 }}
        >
          <span className="uppercase tracking-wide font-semibold">Notes</span>
          <span style={{ fontSize: 10 }}>{open ? '▲' : '▼'}</span>
        </button>
        {open && (
          <p className="mt-1.5 text-gray-600 leading-relaxed whitespace-pre-line" style={{ fontSize: 13 }}>
            {med.notes}
          </p>
        )}
      </div>

    </div>
  );
}

function MARLegend() {
  return (
    <div className="fixed bottom-0 z-50 bg-white border border-gray-200 shadow-[0_-2px_6px_rgba(0,0,0,0.04)] px-4 py-3 flex flex-col gap-2 rounded-tl-xl rounded-tr-xl" style={{ left: 40, right: 40 }}>
      <div className="flex flex-wrap gap-x-6 gap-y-1.5">
        <LegendBubble status="GIVEN" label="Task completed (employee initials/reason code)">XX</LegendBubble>
        <LegendBubble status="PARTIAL" label="Task partially completed (reason code)">!</LegendBubble>
        <LegendBubble status="INCOMPLETE" label="Task incomplete (employee initials)">XX</LegendBubble>
        <LegendBubble status="MISSED" label="Task missed" />
        <LegendBubble status="FUTURE" label="Task to be completed in the future" />
        <LegendBubble status="MULTI" label="Multiple task records (see care notes)">
          <span style={{ letterSpacing: 1, fontSize: 8 }}>•••</span>
        </LegendBubble>
        <div className="flex items-center gap-2 text-xs text-gray-700">
          <LegendBubble status="SELF" label=""><span style={{ fontSize: 11 }}>✕</span></LegendBubble>
          <span>Self-administered — schedule shows prescribed time only.</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-700">
          <div style={{ width: 22, height: 14, backgroundColor: '#fef9c3', border: '1px solid #fde68a', borderRadius: 2 }} />
          <span>Current date</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-700">
          <div style={{ width: 3, height: 18, backgroundColor: '#6366f1', borderRadius: 2 }} />
          <span>Care Plan change on day</span>
        </div>
      </div>
      <div className="text-xs text-gray-500 border-t border-gray-100 pt-1.5 leading-relaxed">
        <span className="font-semibold text-gray-700">Reason Code: </span>
        {REASON_CODES.join('    ')}
      </div>
    </div>
  );
}

export function MARChart() {
  const customer = useCustomer();
  const [hideSelfAdminister, setHideSelfAdminister] = useState(false);

  if (customer.id !== 'arthur-barrington') {
    return <TabEmptyState label="medication records" />;
  }

  const month = 6;
  const year = 2026;
  const monthLabel = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, month, 0).getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month - 1, i + 1);
    return {
      day: i + 1,
      abbr: d.toLocaleString('default', { weekday: 'short' }).slice(0, 3),
      isToday: d.toDateString() === TODAY.toDateString(),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    };
  });

  return (
    <>
      <div className="flex flex-col rounded-md overflow-hidden border border-gray-200 shadow-sm bg-white">

        {/* Patient Info + Month Picker */}
        <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center gap-6">

          {/* Column 1: patient details */}
          <div className="flex flex-col gap-1 min-w-0">
            {[
              ['DOB', PATIENT.dob],
              ['Address', PATIENT.address],
              ['GP Name', PATIENT.gpName],
              ['Allergies', PATIENT.allergies],
            ].map(([label, val]) => (
              <div key={label} className="flex items-baseline gap-2 text-sm">
                <span className="text-xs text-gray-400 uppercase tracking-wide w-16 shrink-0">{label}</span>
                <span className="text-gray-900 font-medium text-sm">{val}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="self-stretch w-px bg-gray-200 shrink-0" />

          {/* Column 2: medication counts */}
          <div className="flex flex-col gap-1 min-w-0">
            {[
              ['Medications', PATIENT.medicationCount],
              ['Controlled Drugs', PATIENT.controlledDrugsCount],
            ].map(([label, val]) => (
              <div key={String(label)} className="flex items-baseline gap-2 text-sm">
                <span className="text-xs text-gray-400 uppercase tracking-wide shrink-0">{label}</span>
                <span className="text-gray-900 font-bold">{val}</span>
              </div>
            ))}
          </div>

          {/* Month picker + hide self-administer — pushed to the right */}
          <div className="ml-auto flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-[#5c1c85] rounded-md px-1 py-1">
              <button className="text-white/70 hover:text-white p-1 rounded transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-white font-semibold text-sm px-2 tracking-wide whitespace-nowrap">{monthLabel}</span>
              <button className="text-white/70 hover:text-white p-1 rounded transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideSelfAdminister}
                onChange={e => setHideSelfAdminister(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-[#5c1c85] accent-[#5c1c85] cursor-pointer"
              />
              <span className="text-xs text-gray-500 whitespace-nowrap">Hide self-administer medications</span>
            </label>
          </div>

        </div>

        {/* Single shared horizontal scroll */}
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '100%', width: 'fit-content' }}>
            {MEDICATIONS.map((med, medIdx) => (
              <div
                key={medIdx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderBottom: medIdx < MEDICATIONS.length - 1 ? '4px solid #e5e7eb' : undefined,
                }}
              >
                {/* ── Drug name header row ── */}
                <div style={{ display: 'flex', borderBottom: '1px solid #f9a8d4' }}>
                  {/* Sticky name badge */}
                  <div
                    style={{
                      position: 'sticky', left: 0, zIndex: 20,
                      width: LEFT_INFO + LEFT_VISIT, minWidth: LEFT_INFO + LEFT_VISIT,
                      backgroundColor: '#fce7f3',
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px',
                      flexShrink: 0,
                    }}
                  >
                    <div className="w-6 h-6 rounded bg-[#db2777] flex items-center justify-center shrink-0">
                      <span className="text-white font-bold" style={{ fontSize: 10 }}>Rx</span>
                    </div>
                    <span className="font-semibold text-gray-800" style={{ fontSize: 14 }}>{med.name}</span>
                  </div>
                  {/* Continuation stripe across day columns */}
                  <div style={{ flex: 1, backgroundColor: '#fce7f3' }} />
                </div>

                {/* ── Fields + visit rows ── */}
                <div style={{ display: 'flex', flexDirection: 'row' }}>

                  {/* Sticky left panel: info fields + visit labels */}
                  <div
                    style={{
                      position: 'sticky', left: 0, zIndex: 20,
                      display: 'flex', flexShrink: 0,
                      borderRight: '1px solid #e5e7eb',
                    }}
                  >
                    {/* Info panel */}
                    <div
                      style={{
                        width: LEFT_INFO, minWidth: LEFT_INFO,
                        borderRight: '1px solid #e9d5ff',
                        backgroundColor: '#faf5ff',
                        display: 'flex', flexDirection: 'column',
                      }}
                    >
                      <MedInfoDetails med={med} />
                    </div>

                    {/* Visit labels column */}
                    <div
                      style={{
                        width: LEFT_VISIT, minWidth: LEFT_VISIT,
                        backgroundColor: '#f9fafb',
                        display: 'flex', flexDirection: 'column',
                      }}
                    >
                      {/* Spacer aligned with day header */}
                      <div
                        style={{
                          height: DAY_H, flexShrink: 0,
                          borderBottom: '1px solid #e5e7eb',
                          display: 'flex', alignItems: 'flex-end',
                          padding: '0 8px 8px',
                        }}
                      >
                        <span style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visit</span>
                      </div>
                      {med.visits.map((visit, vi) => (
                        <div
                          key={vi}
                          style={{
                            height: ROW_H, flexShrink: 0,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'flex-start', justifyContent: 'center',
                            padding: '0 8px',
                            borderBottom: vi < med.visits.length - 1 ? '1px solid #f3f4f6' : undefined,
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
                            {visit.label}
                          </span>
                          <span style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                            {visit.timeWindow}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Day columns: header + visit rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Day header */}
                    <div style={{ display: 'flex', height: DAY_H, borderBottom: '1px solid #e5e7eb' }}>
                      {days.map(d => (
                        <div
                          key={d.day}
                          style={{
                            flex: 1, minWidth: COL,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'flex-end',
                            paddingBottom: 6,
                            borderRight: '1px solid #f3f4f6',
                            backgroundColor: d.isToday ? '#fef9c3' : d.isWeekend ? '#f9fafb' : '#f3f4f6',
                          }}
                        >
                          <span style={{ fontSize: 10, fontWeight: 600, color: d.isToday ? '#92400e' : '#9ca3af' }}>{d.abbr}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: d.isToday ? '#92400e' : '#374151' }}>{d.day}</span>
                          {d.isToday && (
                            <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#d97706', marginTop: 1 }} />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Visit bubble rows */}
                    {med.visits.map((visit, vi) => (
                      <div
                        key={vi}
                        style={{
                          display: 'flex', height: ROW_H,
                          borderBottom: vi < med.visits.length - 1 ? '1px solid #f3f4f6' : undefined,
                        }}
                      >
                        {visit.instances.map((inst, di) => {
                          const d = days[di];
                          return (
                            <div
                              key={inst.date}
                              style={{
                                flex: 1, minWidth: COL,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRight: '1px solid #f3f4f6',
                                backgroundColor: d?.isToday ? '#fefce8' : d?.isWeekend ? '#fafafa' : '#ffffff',
                              }}
                            >
                              <Bubble status={inst.status} initials={inst.initials} />
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <MARLegend />
    </>
  );
}
