import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '../../buttons/Button';
import { useCareManagement } from './CareManagementContext';
import { TASKS, OUTCOMES, VISITS } from './types';
import { OutcomeBadge, VisitBadge, ActiveBadge, StatusToggle, inputClass, labelClass, CATEGORY_CONFIG } from './shared';

function TaskCard({ task, onSelect }: { task: typeof TASKS[0]; onSelect: () => void }) {
  const outcomes = OUTCOMES.filter(o => task.outcomeIds.includes(o.id));
  const visits = VISITS.filter(v => task.visitIds.includes(v.id));
  const { bg, text, border, Icon } = CATEGORY_CONFIG[task.category];

  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className={`flex items-center justify-between px-5 py-3 border-b ${bg} ${border}`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 flex-shrink-0 ${text}`} />
          <span className={`text-base font-semibold ${text}`}>{task.title}</span>
        </div>
        <ActiveBadge status={task.status} />
      </div>

      <div className="px-5 py-4 grid grid-cols-[1fr_auto_1fr_1fr] gap-6 items-start">
        {/* Description */}
        <p className="text-sm text-gray-700 leading-relaxed">
          {task.description.length > 120 ? task.description.slice(0, 120) + '...' : task.description}
        </p>

        {/* Dates */}
        <div className="text-sm text-gray-600 space-y-1 min-w-[120px]">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            <span>{task.startDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            <span>Ongoing</span>
          </div>
        </div>

        {/* Outcomes */}
        <div>
          <div className="flex flex-wrap gap-1.5">
            {outcomes.map(o => <OutcomeBadge key={o.id} title={o.title} />)}
          </div>
        </div>

        {/* Visits */}
        <div>
          <div className="flex flex-wrap gap-1.5">
            {visits.map(v => <VisitBadge key={v.id} title={v.title} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskEditForm({ task }: { task: typeof TASKS[0] }) {
  const { Icon, bg, text, border } = CATEGORY_CONFIG[task.category];

  return (
    <div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 space-y-5">
          {/* Task type + Status */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Task type</label>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${bg} ${border}`}>
                <div className={`w-8 h-8 rounded flex items-center justify-center ${bg} ${border} border`}>
                  <Icon className={`w-4 h-4 ${text}`} />
                </div>
                <div className="relative flex-1">
                  <select defaultValue={task.category} className={`w-full bg-transparent text-sm font-medium ${text} focus:outline-none appearance-none cursor-pointer pr-6`}>
                    <option>General</option>
                    <option>Nutrition</option>
                    <option>Medications</option>
                    <option>Hydration</option>
                    <option>Outcome Tracking</option>
                    <option>Observations</option>
                  </select>
                  <div className={`pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-xs ${text}`}>▼</div>
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <StatusToggle value={task.status} />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className={labelClass}>Title</label>
            <input type="text" defaultValue={task.title} className={inputClass} />
          </div>

          {/* Task Schedule */}
          <div>
            <label className={labelClass}>Task Schedule</label>
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Begins on</label>
                  <div className="relative">
                    <input type="text" defaultValue={task.startDate} className={`${inputClass} pr-10`} />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer mt-5">
                  <input type="checkbox" className="rounded border-gray-300 accent-[rgb(154,38,214)]" />
                  End?
                </label>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm">+ Add cadence</Button>
                <Button variant="secondary" size="sm">+ Add schedule times</Button>
              </div>
            </div>
          </div>

          {/* Bodymap */}
          <div>
            <label className={labelClass}>Bodymap</label>
            <div className="border border-dashed border-gray-300 rounded-lg p-4 flex justify-center">
              <Button>+ Add bodymap</Button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea defaultValue={task.description} rows={4} className={`${inputClass} resize-none`} />
          </div>

          {/* Visits + Outcomes + Alerts — 3 column right side */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-5">
              {/* Visits */}
              <div>
                <label className={labelClass}>Visits</label>
                <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Displaying {VISITS.length} out of {VISITS.length} visits</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 accent-[rgb(154,38,214)] w-3 h-3" />
                      Hide inactive visits
                    </label>
                  </div>
                  {VISITS.map(v => (
                    <label key={v.id} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={task.visitIds.includes(v.id)}
                        className="rounded border-gray-300 accent-[rgb(154,38,214)] w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{v.title}</span>
                      <span className="text-xs text-gray-400">({v.startTime} – {v.endTime}, {v.cadence === 'Alternate week' ? 'Biweekly' : v.cadence})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Completion options */}
              <div>
                <label className={labelClass}>Completion options</label>
                <div className="space-y-2">
                  {['Allow Retry', 'Require Witness'].map(opt => (
                    <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" className="rounded border-gray-300 accent-[rgb(154,38,214)] w-4 h-4 cursor-pointer" />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {/* Outcomes aided */}
              <div>
                <label className={labelClass}>Outcomes aided</label>
                <div className="space-y-2">
                  {OUTCOMES.map(o => (
                    <label key={o.id} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={task.outcomeIds.includes(o.id)}
                        className="rounded border-gray-300 accent-[rgb(154,38,214)] w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{o.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Alerts */}
              <div>
                <label className={labelClass}>Alerts — raise alerts for this task</label>
                <div className="space-y-2">
                  {[
                    { label: 'Missed', hint: '' },
                    { label: 'Not done (no reason given)', hint: '' },
                    { label: 'Incomplete (with reason given)', hint: '' },
                  ].map(({ label }) => (
                    <label key={label} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" className="rounded border-gray-300 accent-[rgb(154,38,214)] w-4 h-4 cursor-pointer" />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TasksTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? TASKS.find(t => t.id === selectedId) : null;
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
    return <TaskEditForm task={selected} />;
  }

  return (
    <div className="space-y-4">
      {TASKS.map(task => (
        <TaskCard key={task.id} task={task} onSelect={() => setSelectedId(task.id)} />
      ))}
      <p className="text-xs text-center text-gray-400 pt-2">Version 7 was modified 4 months ago by Sharon Hunter</p>
    </div>
  );
}
