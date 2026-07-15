import { useEffect, useState } from 'react';
import { Calendar, CalendarClock, ArrowRight, Repeat2 } from 'lucide-react';
import { BodymapDemo } from './BodymapDemo';
import { Button } from '../../buttons/Button';
import { useCareManagement } from './CareManagementContext';
import { TASKS, OUTCOMES, VISITS } from './types';
import { OutcomeBadge, VisitBadge, ActiveBadge, StatusToggle, inputClass, labelClass, CATEGORY_CONFIG } from './shared';

function TaskCard({ task, onSelect }: { task: typeof TASKS[0]; onSelect: () => void }) {
  const outcomes = OUTCOMES.filter(o => task.outcomeIds.includes(o.id));
  const visits = VISITS.filter(v => task.visitIds.includes(v.id));
  const { bg, text, border, circleBg, Icon } = CATEGORY_CONFIG[task.category];

  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:border-purple-300 hover:shadow-md transition-all group"
    >
      <div className={`flex items-center justify-between px-5 py-3 border-b ${bg} ${border}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${circleBg}`}>
            <Icon className={`w-5 h-5 ${text}`} />
          </div>
          <span className={`text-base font-semibold ${text}`}>{task.title}</span>
          <ArrowRight className={`w-4 h-4 ${text} opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200`} />
        </div>
        <ActiveBadge status={task.status} />
      </div>

      <div className="px-5 py-4 grid grid-cols-[1fr_auto_1fr_1fr] gap-6 items-start">
        {/* Description */}
        <div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {task.description.length > 120 ? task.description.slice(0, 120) + '...' : task.description}
          </p>
          {task.medicationDetails && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {Object.entries(task.medicationDetails).map(([, val]) => val && (
                <span key={val} className="text-xs font-medium px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">{val}</span>
              ))}
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="text-sm text-gray-600 space-y-1 min-w-[120px]">
          <div className="flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5 text-[#2D5F1E] flex-shrink-0" />
            <span>{task.startDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Repeat2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
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
  const med = task.medicationDetails;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-2 divide-x divide-gray-200">

        {/* ── LEFT COLUMN ── */}
        <div className="px-6 py-5 space-y-5">

          {/* Task type */}
          <div>
            <label className={labelClass}>Task Type</label>
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

          {/* Name */}
          <div>
            <label className={labelClass}>{med ? 'Medication Name' : 'Title'} <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type="text" defaultValue={task.title} className={`${inputClass} pr-10`} />
              {med && (
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded bg-red-500 text-white text-xs font-bold cursor-pointer">✕</button>
              )}
            </div>
          </div>

          {/* Task Schedule */}
          <div>
            <label className={labelClass}>Task Schedule</label>
            <div className="space-y-2">
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
              <div className="flex flex-col gap-1 pt-1">
                <button type="button" className="text-sm text-[rgb(154,38,214)] hover:underline text-left cursor-pointer w-fit">+ Add cadence</button>
                <button type="button" className="text-sm text-[rgb(154,38,214)] hover:underline text-left cursor-pointer w-fit">+ Add schedule times</button>
              </div>
            </div>
          </div>

          {/* Bodymap */}
          <div>
            <label className={labelClass}>Bodymap</label>
            {med ? (
              <BodymapDemo />
            ) : (
              <div className="border border-dashed border-gray-300 rounded-lg p-4 flex justify-center">
                <Button>+ Add bodymap</Button>
              </div>
            )}
          </div>

          {/* Medication* fields */}
          {med && (
            <div>
              <label className={labelClass}>Medication <span className="text-red-500">*</span></label>
              <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
                <div className="grid grid-cols-2 divide-x divide-gray-100">
                  <div className="px-4 py-3">
                    <p className="text-xs text-gray-500 mb-1.5">Form</p>
                    <input type="text" defaultValue={med.form} className={inputClass} />
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs text-gray-500 mb-1.5">Route</p>
                    <input type="text" defaultValue={med.route} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-gray-100">
                  <div className="px-4 py-3">
                    <p className="text-xs text-gray-500 mb-1.5">Dosage <span className="text-red-500">*</span></p>
                    <input type="text" defaultValue={med.dosage} className={inputClass} />
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs text-gray-500 mb-1.5">Control Category</p>
                    <div className="relative">
                      <select defaultValue={med.controlCategory} className={`${inputClass} appearance-none pr-8 cursor-pointer`}>
                        <option>N/A</option>
                        <option>CD Schedule 2</option>
                        <option>CD Schedule 3</option>
                        <option>CD Schedule 4</option>
                        <option>CD Schedule 5</option>
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▼</div>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1.5">Location</p>
                  <input type="text" defaultValue={med.location} className={inputClass} />
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-2">Support required <span className="text-red-500">*</span></p>
                      <div className="flex flex-wrap gap-4">
                        {['Self-administer', 'Prompt', 'Assist', 'Administer'].map(opt => (
                          <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name={`supportRequired-${task.id}`}
                              defaultChecked={med.supportRequired === opt}
                              className="accent-[rgb(154,38,214)] cursor-pointer"
                            />
                            <span className="text-sm text-gray-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <p className="text-xs text-gray-500 mb-2">Schedule</p>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" defaultChecked={med.prn} className="rounded border-gray-300 accent-[rgb(154,38,214)] w-4 h-4 cursor-pointer" />
                        <span className="text-sm text-gray-700">PRN</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea defaultValue={task.description} rows={4} className={`${inputClass} resize-none`} />
          </div>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="px-6 py-5 space-y-5">

          {/* Status */}
          <div>
            <label className={labelClass}>Status</label>
            <StatusToggle value={task.status} />
          </div>

          {/* Completion options */}
          <div>
            <label className={labelClass}>Completion options</label>
            <div className="border border-gray-200 rounded-lg p-3 space-y-2">
              {['Allow Retry', 'Require Witness'].map(opt => (
                <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 accent-[rgb(154,38,214)] w-4 h-4 cursor-pointer" />
                  <span className="text-sm text-gray-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>

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

          {/* Outcomes aided */}
          <div>
            <label className={labelClass}>Outcomes aided</label>
            <div className="border border-gray-200 rounded-lg p-3 space-y-2">
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
            <label className={labelClass}>Alerts</label>
            <div className="border border-gray-200 rounded-lg p-3 space-y-2">
              <p className="text-xs text-gray-500 mb-2">Raise alerts for this task</p>
              {['Missed', 'Not done (no reason given)', 'Incomplete (with reason given)'].map(label => (
                <label key={label} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked={label === 'Missed'} className="rounded border-gray-300 accent-[rgb(154,38,214)] w-4 h-4 cursor-pointer" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
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
