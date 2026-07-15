import { useEffect, useState } from 'react';
import { Calendar, CalendarClock, CalendarDays, Clock, ArrowRight, Repeat2 } from 'lucide-react';
import { CalendarSolidIcon } from '../../icons/CarePlanIcons';
import { Button } from '../../buttons/Button';
import { useCareManagement } from './CareManagementContext';
import { VISITS, TASKS, OUTCOMES, TASK_CATEGORIES } from './types';
import { OutcomeBadge, TaskBadge, ActiveBadge, labelClass, CATEGORY_CONFIG } from './shared';

const DAYS_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start py-2.5 border-b border-gray-200 last:border-b-0">
      <span className="w-44 flex-shrink-0 text-sm text-gray-500">{label}</span>
      <div className="flex-1 text-sm font-medium text-gray-900">{children}</div>
    </div>
  );
}

function DayPill({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={`w-10 h-10 flex items-center justify-center rounded-full text-xs font-semibold border transition-colors ${
      active
        ? 'bg-[rgb(154,38,214)] border-[rgb(154,38,214)] text-white'
        : 'bg-white border-gray-200 text-gray-400'
    }`}>
      {label}
    </div>
  );
}

function VisitCard({ visit, onSelect }: { visit: typeof VISITS[0]; onSelect: () => void }) {
  const outcomes = OUTCOMES.filter(o => visit.outcomeIds.includes(o.id));
  const tasks = TASKS.filter(t => visit.taskIds.includes(t.id));
  const cadenceLabel = visit.cadence === 'Alternate week' ? 'BiWeekly' : visit.cadence;
  const weeksLabel = visit.weeks.map((w, i) =>
    `Week ${i + 1}: ${w.activeDays.map(d => DAYS_ABBR[d]).join(' ')}`
  ).join('  ');

  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:border-purple-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-center justify-between px-5 py-3 bg-sky-50 border-b border-sky-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sky-200 flex items-center justify-center flex-shrink-0">
            <CalendarSolidIcon className="w-5 h-5 text-sky-600" />
          </div>
          <span className="text-base font-semibold text-sky-700">{visit.title}</span>
          <ArrowRight className="w-4 h-4 text-sky-700 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
        </div>
        <ActiveBadge status={visit.status} />
      </div>

      <div className="px-5 py-4 grid grid-cols-[200px_1fr_1fr] gap-6">
        {/* Left: schedule details */}
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5 text-[#2D5F1E] flex-shrink-0" />
            <span>{visit.startDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Repeat2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>Ongoing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span className="font-medium text-gray-700">{visit.visitType}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span>{cadenceLabel} — {weeksLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>{visit.startTime} · {visit.duration}</span>
          </div>
        </div>

        {/* Middle: outcomes */}
        <div className="flex flex-wrap gap-1.5 content-start">
          {outcomes.map(o => <OutcomeBadge key={o.id} title={o.title} />)}
        </div>

        {/* Right: tasks */}
        <div className="flex flex-wrap gap-1.5 content-start">
          {tasks.map(t => <TaskBadge key={t.id} title={t.title} category={t.category} />)}
        </div>
      </div>
    </div>
  );
}

function VisitEditForm({ visit }: { visit: typeof VISITS[0] }) {
  const cadenceLabel = visit.cadence === 'Alternate week' ? 'BiWeekly' : visit.cadence;

  return (
    <div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 space-y-5">

          {/* Read-only visit summary */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">{visit.title}</h3>
              <ActiveBadge status={visit.status} />
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <div>
                <FieldRow label="Visit type">{visit.visitType}</FieldRow>
                <FieldRow label="Careworkers required">{visit.numEmployees}</FieldRow>
                <FieldRow label="Time">
                  {visit.startTime} – {visit.endTime} ({visit.duration})
                </FieldRow>
              </div>
              <div>
                <FieldRow label="Start date">
                  <div className="flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5 text-[#2D5F1E] flex-shrink-0" />
                    <span>{visit.startDate}</span>
                  </div>
                </FieldRow>
                <FieldRow label="End date">
                  <div className="flex items-center gap-1.5">
                    <Repeat2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>Ongoing</span>
                  </div>
                </FieldRow>
                <FieldRow label="Cadence">
                  <div className="space-y-2">
                    <div>{cadenceLabel}</div>
                    {visit.weeks.map((week, wi) => (
                      <div key={wi} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-14 shrink-0">Week {wi + 1}</span>
                        <div className="flex gap-1.5">
                          {DAYS_ABBR.map((day, di) => (
                            <DayPill key={day} label={day.slice(0, 3)} active={week.activeDays.includes(di)} />
                          ))}
                        </div>
                      </div>
                  ))}
                </div>
              </FieldRow>
              </div>
            </div>
          </div>

          {/* Task selector */}
          <div>
            <label className={labelClass}>Tasks</label>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-3 divide-x divide-gray-200">
                {TASK_CATEGORIES.map(cat => {
                  const catTasks = TASKS.filter(t => t.category === cat);
                  const { Icon } = CATEGORY_CONFIG[cat];
                  return (
                    <div key={cat} className="p-4">
                      <p className="text-sm font-semibold text-gray-900 mb-3">{cat}</p>
                      <div className="space-y-2">
                        {catTasks.length === 0 && <p className="text-xs text-gray-300 italic">None</p>}
                        {catTasks.map(task => {
                          const checked = visit.taskIds.includes(task.id);
                          return (
                            <label key={task.id} className={`flex items-center gap-2.5 cursor-pointer group ${!checked ? 'opacity-40' : ''}`}>
                              <input
                                type="checkbox"
                                defaultChecked={checked}
                                className="rounded border-gray-300 accent-[rgb(154,38,214)] w-4 h-4 cursor-pointer"
                              />
                              <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-700 group-hover:text-gray-900">{task.title}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Task ordering */}
          <div>
            <label className={labelClass}>Task ordering</label>
            <p className="text-xs text-[rgb(154,38,214)] mb-3">Reorder the tasks using the position buttons</p>
            <div className="space-y-2">
              {visit.taskIds.map((tid, idx) => {
                const task = TASKS.find(t => t.id === tid);
                if (!task) return null;
                const { bg, text, border } = CATEGORY_CONFIG[task.category];
                return (
                  <div key={tid} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className={`flex items-center gap-3 px-4 py-2 ${bg} ${border} border-b`}>
                      <span className="text-xs text-gray-400 w-5">{idx + 1}.</span>
                      <span className={`text-sm font-semibold ${text}`}>{task.title}</span>
                      <ActiveBadge status="active" />
                      <div className="ml-auto flex gap-1">
                        {['↑', '↓'].map(arrow => (
                          <button key={arrow} className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded bg-white text-gray-500 hover:bg-gray-50 text-sm cursor-pointer">
                            {arrow}
                          </button>
                        ))}
                        <button className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded bg-white text-gray-500 hover:bg-gray-50 text-sm cursor-pointer">⋮</button>
                      </div>
                    </div>
                    <p className="px-4 py-2 text-sm text-gray-600">{task.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VisitsTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? VISITS.find(v => v.id === selectedId) : null;
  const { registerBack, clearBack } = useCareManagement();

  useEffect(() => {
    if (selectedId) {
      registerBack(() => setSelectedId(null));
    } else {
      clearBack();
    }
    return () => clearBack();
  }, [selectedId]);

  if (selected) {
    return <VisitEditForm visit={selected} />;
  }

  return (
    <div className="space-y-4">
      {VISITS.map(visit => (
        <VisitCard key={visit.id} visit={visit} onSelect={() => setSelectedId(visit.id)} />
      ))}
      <p className="text-xs text-center text-gray-400 pt-2">Version 7 was modified 4 months ago by Sharon Hunter</p>
    </div>
  );
}
