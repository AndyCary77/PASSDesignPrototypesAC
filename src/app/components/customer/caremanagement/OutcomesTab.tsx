import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { StarSolidIcon } from '../../icons/CarePlanIcons';
import { Button } from '../../buttons/Button';
import { useCareManagement } from './CareManagementContext';
import { useCareData } from './useCareData';
import { TASK_CATEGORIES, type Outcome } from './types';
import { TaskBadge, VisitBadge, ActiveBadge, StatusToggle, EmptyTab, inputClass, labelClass, CATEGORY_CONFIG } from './shared';

function OutcomeCard({ outcome, onSelect }: { outcome: Outcome; onSelect: () => void }) {
  const { TASKS, VISITS } = useCareData();
  const tasks = TASKS.filter(t => outcome.taskIds.includes(t.id));
  const visits = VISITS.filter(v => outcome.visitIds.includes(v.id));
  const preview = outcome.whatICanDo.length > 220
    ? outcome.whatICanDo.slice(0, 220) + '...'
    : outcome.whatICanDo;

  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:border-purple-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ backgroundColor: '#feefdc', borderColor: '#fcd9a8' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#fcdfb0' }}>
            <StarSolidIcon className="w-5 h-5 text-amber-700" />
          </div>
          <span className="text-base font-semibold text-amber-800">{outcome.title}</span>
          <ArrowRight className="w-4 h-4 text-amber-800 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
        </div>
        <ActiveBadge status={outcome.status} />
      </div>

      <div className="px-5 py-4 space-y-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-1">What I can do</p>
          <p className="text-sm text-gray-700 leading-relaxed">{preview}</p>
        </div>

        {outcome.aims && (
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Aims</p>
            <p className="text-sm text-gray-700">{outcome.aims}</p>
          </div>
        )}
        {!outcome.aims && (
          <p className="text-sm font-semibold text-gray-900">Aims</p>
        )}

        <div>
          <p className="text-sm font-semibold text-gray-900 mb-2">Tasks</p>
          {tasks.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tasks.map(t => <TaskBadge key={t.id} title={t.title} category={t.category} />)}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">None</p>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-900 mb-2">Visits</p>
          {visits.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {visits.map(v => <VisitBadge key={v.id} title={v.title} />)}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">None</p>
          )}
        </div>

      </div>
    </div>
  );
}

function OutcomeEditForm({ outcome }: { outcome: Outcome }) {
  const { TASKS, OUTCOMES } = useCareData();
  const OUTCOME_TITLES = OUTCOMES.map(o => o.title);

  return (
    <div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 space-y-5">
          {/* Outcome type + Status row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Outcome type</label>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${outcome.type === 'template' ? 'text-amber-800' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                  style={outcome.type === 'template' ? { backgroundColor: '#feefdc' } : undefined}
                >
                  Template
                </button>
                <button
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${outcome.type === 'custom' ? 'text-amber-800' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                  style={outcome.type === 'custom' ? { backgroundColor: '#feefdc' } : undefined}
                >
                  Custom
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <StatusToggle value={outcome.status} />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className={labelClass}>Title <span className="text-red-500">*</span></label>
            <div className="relative">
              <select defaultValue={outcome.title} className={`${inputClass} appearance-none pr-8 cursor-pointer`}>
                {OUTCOME_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▼</div>
            </div>
          </div>

          {/* What I can do + Aims */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>What I can do</label>
              <textarea
                defaultValue={outcome.whatICanDo}
                rows={6}
                className={`${inputClass} resize-none`}
              />
            </div>
            <div>
              <label className={labelClass}>Aims</label>
              <textarea
                defaultValue={outcome.aims}
                rows={6}
                className={`${inputClass} resize-none`}
                placeholder="Enter aims..."
              />
            </div>
          </div>

          {/* Task selector */}
          <div>
            <p className="text-sm text-gray-500 mb-3">Select the tasks that form this outcome (greyed out tasks are not part of this outcome):</p>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-3 divide-x divide-gray-200">
                {TASK_CATEGORIES.map(cat => {
                  const catTasks = TASKS.filter(t => t.category === cat);
                  const { Icon } = CATEGORY_CONFIG[cat];
                  return (
                    <div key={cat} className="p-4">
                      <p className="text-sm font-semibold text-gray-900 mb-3">{cat}</p>
                      <div className="space-y-2">
                        {catTasks.length === 0 && (
                          <p className="text-xs text-gray-300 italic">None</p>
                        )}
                        {catTasks.map(task => {
                          const checked = outcome.taskIds.includes(task.id);
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
        </div>
      </div>
    </div>
  );
}

export function OutcomesTab() {
  const { OUTCOMES } = useCareData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? OUTCOMES.find(o => o.id === selectedId) : null;
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
    return <OutcomeEditForm outcome={selected} />;
  }

  if (OUTCOMES.length === 0) {
    return <EmptyTab label="outcomes" />;
  }

  return (
    <div className="space-y-4">
      {OUTCOMES.map(outcome => (
        <OutcomeCard key={outcome.id} outcome={outcome} onSelect={() => setSelectedId(outcome.id)} />
      ))}
      <p className="text-xs text-center text-gray-400 pt-2">Version 7 was modified 4 months ago by Sharon Hunter</p>
    </div>
  );
}
