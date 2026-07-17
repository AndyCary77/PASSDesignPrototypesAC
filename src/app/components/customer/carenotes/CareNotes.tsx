import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Clock, Calendar, User, Check, Plus, X, CalendarCheck } from 'lucide-react';
import { useCustomer } from '../../../data/CustomerContext';
import { TabEmptyState } from '../TabEmptyState';

interface Task {
  time: string;
  name: string;
  status?: 'completed' | 'refused' | 'cancelled';
  reason?: string;
  note?: string;
}

interface Visit {
  id: number;
  date: string;
  checkIn: string;
  checkOut: string;
  duration: string;
  scheduledStart: string;
  scheduledEnd: string;
  worker: string;
  workerRole: string;
  status: 'COMPLETED' | 'MISSED' | 'STARTED' | 'CANCELLED';
  visitType: string;
  notes: string;
  tasks: Task[];
}

const MORNING_TASKS: Task[] = [
  { time: '', name: 'Prompt with Personal Care' },
  { time: '', name: 'Maintain Environment' },
  { time: '', name: 'Clozaril 100mg tablets' },
  { time: '', name: 'Medication box' },
];

const EVENING_TASKS: Task[] = [
  { time: '', name: 'Maintain Environment' },
  { time: '', name: 'Medication box' },
  { time: '', name: 'Clozapine 25mg tablets' },
  { time: '', name: 'Clozaril 100mg tablets' },
];

const VISITS: Visit[] = [
  {
    id: 1, date: '18 June 2026', checkIn: '09:56', checkOut: '10:10', duration: '14 minutes',
    scheduledStart: '09:50', scheduledEnd: '10:20', worker: 'Amirah Marsden', workerRole: 'Support employee',
    status: 'CANCELLED', visitType: 'Morning Visit',
    notes: 'SU was not available at his flat. He called me and informed me that there was no need for the visit today. I contacted the office and informed Sanny, who was on call. I then logged in and logged out manually as instructed.',
    tasks: MORNING_TASKS.map(t => ({ ...t, time: '10:09', status: 'cancelled' as const, reason: 'Customer cancelled' })),
  },
  {
    id: 2, date: '17 June 2026', checkIn: '18:09', checkOut: '18:11', duration: '2 minutes',
    scheduledStart: '18:00', scheduledEnd: '18:30', worker: 'Amirah Marsden', workerRole: 'Support employee',
    status: 'COMPLETED', visitType: 'Evening Visit',
    notes: '"Arthur Barrington has taken his medicine. He won\'t let me stay at home for more than five minutes. Even after I explained that I have work at the office, he insists that I leave."',
    tasks: EVENING_TASKS.map((t, i) =>
      i === EVENING_TASKS.length - 1
        ? { ...t, time: '18:10', status: 'refused' as const, reason: 'Refused', note: 'Resident declined medication' }
        : { ...t, time: '18:10', status: 'completed' as const }
    ),
  },
  {
    id: 3, date: '17 June 2026', checkIn: '09:18', checkOut: '09:22', duration: '4 minutes',
    scheduledStart: '09:00', scheduledEnd: '09:30', worker: 'Amirah Marsden', workerRole: 'Support employee',
    status: 'COMPLETED', visitType: 'Morning Visit',
    notes: "Arthur Barrington took the medicine. He doesn't let me stay for long. After making a phone call from the office, he tells me to leave.",
    tasks: MORNING_TASKS.map(t => ({ ...t, time: '09:21' })),
  },
  {
    id: 4, date: '16 June 2026', checkIn: '17:37', checkOut: '17:51', duration: '15 minutes',
    scheduledStart: '18:00', scheduledEnd: '18:30', worker: 'Amirah Marsden', workerRole: 'Support employee',
    status: 'COMPLETED', visitType: 'Evening Visit',
    notes: 'Arthur Barrington has taken medicine. When he takes the medicine, he acts very rushed and does not let anyone look at the medicine properly. He also does not allow people to stay in his room for long and often makes them stand in front of the gate for a long time.',
    tasks: EVENING_TASKS.map(t => ({ ...t, time: '17:48' })),
  },
  {
    id: 5, date: '16 June 2026', checkIn: '07:28', checkOut: '07:37', duration: '9 minutes',
    scheduledStart: '07:20', scheduledEnd: '07:50', worker: 'Amirah Marsden', workerRole: 'Support employee',
    status: 'COMPLETED', visitType: 'Morning Visit',
    notes: 'Arthur Barrington made me stand at the door for a long time, even though I arrived on time. He has taken medicine. He also does not let me stay at his house for very long. I have to leave within 5 minutes.',
    tasks: MORNING_TASKS.map(t => ({ ...t, time: '07:35' })),
  },
  {
    id: 6, date: '15 June 2026', checkIn: '17:48', checkOut: '17:55', duration: '7 minutes',
    scheduledStart: '17:40', scheduledEnd: '18:10', worker: 'Amirah Marsden', workerRole: 'Support employee',
    status: 'COMPLETED', visitType: 'Evening Visit',
    notes: '"Arthur Barrington has taken medicine."',
    tasks: EVENING_TASKS.map(t => ({ ...t, time: '17:52' })),
  },
  {
    id: 7, date: '15 June 2026', checkIn: '10:10', checkOut: '10:12', duration: '3 minutes',
    scheduledStart: '09:45', scheduledEnd: '10:15', worker: 'Amirah Marsden', workerRole: 'Support employee',
    status: 'COMPLETED', visitType: 'Morning Visit',
    notes: 'His personal care is fine. He maintains the environment properly. He has taken his medicine. Right after taking the medicine, he asked me to leave. He keeps me standing outside his door for a long time.',
    tasks: MORNING_TASKS.map(t => ({ ...t, time: '10:11' })),
  },
  {
    id: 8, date: '14 June 2026', checkIn: '18:07', checkOut: '18:10', duration: '3 minutes',
    scheduledStart: '18:00', scheduledEnd: '18:30', worker: 'Amirah Marsden', workerRole: 'Support employee',
    status: 'COMPLETED', visitType: 'Evening Visit',
    notes: 'They took the medicine. They don\'t let me stay for 30 minutes. I have to leave right after giving the medicine.',
    tasks: EVENING_TASKS.map(t => ({ ...t, time: '18:09' })),
  },
  {
    id: 9, date: '14 June 2026', checkIn: '10:05', checkOut: '10:13', duration: '8 minutes',
    scheduledStart: '09:45', scheduledEnd: '10:15', worker: 'Amirah Marsden', workerRole: 'Support employee',
    status: 'COMPLETED', visitType: 'Morning Visit',
    notes: 'Arthur Barrington has taken the medicine. Everything is okay with him. He does not let anyone go into the room.',
    tasks: MORNING_TASKS.map(t => ({ ...t, time: '10:10' })),
  },
  {
    id: 10, date: '13 June 2026', checkIn: '18:06', checkOut: '18:12', duration: '6 minutes',
    scheduledStart: '18:05', scheduledEnd: '18:35', worker: 'Amirah Marsden', workerRole: 'Support employee',
    status: 'COMPLETED', visitType: 'Evening Visit',
    notes: 'Arthur Barrington has taken medicine.',
    tasks: EVENING_TASKS.map(t => ({ ...t, time: '18:09' })),
  },
  {
    id: 11, date: '13 June 2026', checkIn: '09:40', checkOut: '09:47', duration: '7 minutes',
    scheduledStart: '09:40', scheduledEnd: '10:10', worker: 'Amirah Marsden', workerRole: 'Support employee',
    status: 'COMPLETED', visitType: 'Morning Visit',
    notes: 'Jalani Abu has taken medicine. All tasks done.',
    tasks: MORNING_TASKS.map(t => ({ ...t, time: '09:45' })),
  },
  {
    id: 12, date: '12 June 2026', checkIn: '17:16', checkOut: '17:29', duration: '13 minutes',
    scheduledStart: '17:50', scheduledEnd: '18:20', worker: 'Amirah Marsden', workerRole: 'Support employee',
    status: 'COMPLETED', visitType: 'Evening Visit',
    notes: 'He has been given medicine. All tasks done.',
    tasks: EVENING_TASKS.map(t => ({ ...t, time: '17:25' })),
  },
  {
    id: 13, date: '12 June 2026', checkIn: '07:29', checkOut: '07:50', duration: '20 minutes',
    scheduledStart: '07:35', scheduledEnd: '08:05', worker: 'Amirah Marsden', workerRole: 'Support employee',
    status: 'COMPLETED', visitType: 'Morning Visit',
    notes: 'She won\'t take the medicine before 9:30. I tried to explain a lot, but she didn\'t listen.',
    tasks: MORNING_TASKS.map(t => ({ ...t, time: '07:45' })),
  },
];

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  COMPLETED: { bg: '#16a34a', text: '#ffffff', label: 'Completed' },
  PARTIAL:   { bg: '#d97706', text: '#ffffff', label: 'Partially Completed' },
  CANCELLED: { bg: '#e5e7eb', text: '#374151', label: 'Cancelled' },
  MISSED:    { bg: '#fee2e2', text: '#991b1b', label: 'Missed' },
  STARTED:   { bg: '#fef9c3', text: '#854d0e', label: 'In Progress' },
};


function VisitRow({ visit, defaultOpen }: { visit: Visit; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  // A refused task downgrades an otherwise-completed visit to "partially completed".
  const hasRefused = visit.tasks.some((t) => t.status === 'refused');
  const statusKey = hasRefused && visit.status === 'COMPLETED' ? 'PARTIAL' : visit.status;
  const status = STATUS_STYLE[statusKey] ?? STATUS_STYLE.COMPLETED;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header row — always visible, clickable */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left flex items-stretch hover:bg-gray-50 transition-colors"
      >
        {/* Date / time */}
        <div className="flex flex-col justify-center gap-0.5 px-4 py-3 w-[170px] min-w-0 border-r border-gray-200">
          <div className="flex items-center gap-1.5 text-gray-800 font-semibold text-sm">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {visit.date}
          </div>
          <div className="flex items-start gap-1.5 text-xs">
            <Clock className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-gray-500 whitespace-nowrap">{visit.checkIn} – {visit.checkOut}</span>
              <span className="text-gray-400">{visit.duration}</span>
            </div>
          </div>
        </div>

        {/* Worker */}
        <div className="flex flex-col justify-center gap-0.5 px-4 py-3 w-[220px] min-w-0 border-r border-gray-200">
          <div className="flex items-center gap-1.5 text-gray-800 text-sm font-medium">
            <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {visit.worker}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-center px-4 py-3 w-[130px] min-w-0 border-r border-gray-200">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: status.bg, color: status.text }}
          >
            {status.label}
          </span>
        </div>

        {/* Visit type + notes preview */}
        <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <CalendarCheck className="w-3.5 h-3.5 shrink-0" style={{ color: status.text }} />
            <span className="text-sm font-medium text-gray-800">{visit.visitType}</span>
          </div>
          {!open && (
            <span className="text-xs text-gray-400 truncate">{visit.notes}</span>
          )}
        </div>

        {/* Expand toggle */}
        <div className="flex items-center px-4 py-3 text-gray-400 shrink-0">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-gray-200 bg-gray-50 py-4 flex flex-wrap">
          {/* Scheduled info — matches the Date/time column width above */}
          <div className="w-[170px] min-w-0 px-4 flex flex-col gap-1">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Scheduled</span>
            <div className="text-xs text-gray-600 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-gray-400" />{visit.date}
            </div>
            <div className="text-xs text-gray-600 flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-400" />{visit.scheduledStart} – {visit.scheduledEnd}
            </div>
          </div>

          {/* Notes — text starts aligned with the carer icon above */}
          <div className="flex flex-col gap-1 flex-1 min-w-0 px-4">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Notes</span>
            <p className="text-sm text-gray-700 leading-relaxed">{visit.notes}</p>
          </div>

          {/* Tasks */}
          <div className="flex flex-col gap-1 flex-1 min-w-0 px-4">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Tasks</span>
            <div className="flex flex-col gap-2">
              {visit.tasks.map((task, i) => {
                const taskStatus = task.status ?? 'completed';
                const pillClass =
                  taskStatus === 'refused' ? 'bg-amber-600 text-white'
                  : taskStatus === 'cancelled' ? 'bg-gray-200 text-gray-700'
                  : 'bg-green-600 text-white';
                const TaskIcon = taskStatus === 'refused' ? Plus : taskStatus === 'cancelled' ? X : Check;
                return (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="text-gray-500 shrink-0 w-12 pt-1">{task.time}</span>
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <span
                        className={`self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-semibold ${pillClass}`}
                      >
                        <TaskIcon className="w-4 h-4 shrink-0" />
                        <span>{task.name}</span>
                      </span>
                      {(task.reason || task.note) && (
                        <div className="flex flex-wrap gap-x-10 gap-y-1">
                          {task.reason && (
                            <div>
                              <div className="text-xs text-gray-400">Reason</div>
                              <div className="text-sm font-semibold text-gray-700">{task.reason}</div>
                            </div>
                          )}
                          {task.note && (
                            <div>
                              <div className="text-xs text-gray-400">Notes</div>
                              <div className="text-sm font-semibold text-gray-700">{task.note}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CareNotes() {
  const customer = useCustomer();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showMissed, setShowMissed] = useState(false);
  const [unreviewedOnly, setUnreviewedOnly] = useState(false);

  if (customer.id !== 'arthur-barrington') {
    return <TabEmptyState label="care notes" />;
  }

  const filtered = VISITS.filter(v => {
    if (showMissed && v.status !== 'MISSED') return false;
    return true;
  });

  // Group by date
  const byDate = filtered.reduce<Record<string, Visit[]>>((acc, v) => {
    if (!acc[v.date]) acc[v.date] = [];
    acc[v.date].push(v);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-0 rounded-md overflow-hidden border border-gray-200 shadow-sm bg-white">

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap items-center gap-4">

        {/* Date range picker */}
        <div className="flex items-center gap-1 bg-[#5c1c85] rounded-md px-1 py-1 shrink-0">
          <button className="text-white/70 hover:text-white p-1 rounded transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white font-semibold text-sm px-2 tracking-wide whitespace-nowrap">
            Fri 12 Jun 2026 – Thu 18 Jun 2026
          </span>
          <button className="text-white/70 hover:text-white p-1 rounded transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium">Filter:</label>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#5c1c85]"
          >
            <option value="">All</option>
            <option value="ACTIVITY">Activity</option>
            <option value="OBSERVATION">Observation</option>
          </select>
        </div>

        {/* Show toggles */}
        <div className="flex items-center gap-4 ml-2">
          <label className="text-xs text-gray-500 font-medium">Show:</label>
          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showMissed}
              onChange={e => setShowMissed(e.target.checked)}
              className="rounded border-gray-300 accent-[#5c1c85]"
            />
            Missed
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={unreviewedOnly}
              onChange={e => setUnreviewedOnly(e.target.checked)}
              className="rounded border-gray-300 accent-[#5c1c85]"
            />
            Unreviewed only
          </label>
        </div>

        {/* Result count */}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} visits</span>
      </div>

      {/* Visit list */}
      <div className="px-4 py-4 flex flex-col gap-5">
        {Object.entries(byDate).map(([date, visits]) => (
          <div key={date} className="flex flex-col gap-2">
            {/* Date group header */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">{date}</span>
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">{visits.length} {visits.length === 1 ? 'visit' : 'visits'}</span>
            </div>
            {/* Visits for this date */}
            <div className="flex flex-col gap-2">
              {visits.map((v, i) => (
                <VisitRow key={v.id} visit={v} defaultOpen={v.id === 1 || v.id === 2} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
