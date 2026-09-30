import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { StarSolidIcon } from '../../icons/CarePlanIcons';
import { useCareManagement, useDetailParam } from './CareManagementContext';
import { useCareData } from './useCareData';
import { TASK_CATEGORIES, type Outcome } from './types';
import { TaskBadge, VisitBadge, ActiveBadge, StatusToggle, EmptyTab, CareManagementFooter, inputClass, labelClass, CATEGORY_CONFIG, DraftActionBar, CarePlanDraftBanner, CarePlanDraftFlow } from './shared';

function OutcomeCard({ outcome, onSelect }: { outcome: Outcome; onSelect: () => void }) {
  const { TASKS, VISITS } = useCareData();
  const { accept, discard, planPublished } = useCareManagement();
  const tasks = TASKS.filter(t => outcome.taskIds.includes(t.id));
  const visits = VISITS.filter(v => outcome.visitIds.includes(v.id));
  const pending = outcome.reviewed === false;
  const preview = outcome.whatICanDo.length > 220
    ? outcome.whatICanDo.slice(0, 220) + '...'
    : outcome.whatICanDo;

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-lg border overflow-hidden cursor-pointer hover:shadow-md transition-all group ${
        pending ? 'border-amber-300 hover:border-amber-400' : (outcome.reviewed && !planPublished ? 'border-green-600 hover:border-green-700' : 'border-gray-200 hover:border-purple-300')
      }`}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b" style={{ backgroundColor: '#feefdc', borderColor: '#fcd9a8' }}>
          <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#fcdfb0' }}>
            <StarSolidIcon className="w-5 h-5 text-amber-700" />
          </div>
          <span className="text-base font-semibold text-amber-800">{outcome.title}</span>
          <ArrowRight className="w-4 h-4 text-amber-800 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 flex-shrink-0" />
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <ActiveBadge status={outcome.status} reviewed={outcome.reviewed} />
        </div>
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
            <>
              <p className="text-sm text-gray-400 italic">None</p>
              {/* Visits originate in the Rostering service agreement, so an
                  outcome can be drafted with nothing able to deliver it yet. */}
              <p className="text-xs text-amber-700 mt-1">
                No visit can deliver this yet — add one to the service agreement in Rostering.
              </p>
            </>
          )}
        </div>

      </div>

      {pending && (
        <DraftActionBar
          source={outcome.draftSource}
          itemLabel="outcome"
          onAccept={() => accept(outcome.id)}
          onDiscard={() => discard(outcome.id)}
          edge="bottom"
        />
      )}
    </div>
  );
}

function OutcomeEditForm({ outcome, onDiscarded }: { outcome: Outcome; onDiscarded: () => void }) {
  const { TASKS, OUTCOMES, pending, draftSources } = useCareData();
  const { accept, discard, setDirty } = useCareManagement();
  const OUTCOME_TITLES = OUTCOMES.map(o => o.title);
  const isDraft = outcome.reviewed === false;
  const [linkedTaskIds, setLinkedTaskIds] = useState<string[]>(outcome.taskIds);
  const toggleTask = (id: string) =>
    setLinkedTaskIds(prev => (prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]));

  return (
    <div className="space-y-4">
      <CarePlanDraftBanner
        pendingOutcomes={pending.outcomes}
        pendingTasks={pending.tasks}
        sources={draftSources}
        activeTab="outcomes"
      />

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isDraft && (
          <DraftActionBar
            source={outcome.draftSource}
            itemLabel="outcome"
            onAccept={() => accept(outcome.id)}
            onDiscard={() => { discard(outcome.id); onDiscarded(); }}
            edge="top"
          />
        )}
        {/* A single bubbled onChange here catches every field below — text
            inputs, selects, and the task checkboxes — rather than wiring
            setDirty into each one individually. */}
        <div className="px-6 py-5 space-y-5" onChange={() => setDirty(true)}>
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
              <StatusToggle value={outcome.status} reviewed={outcome.reviewed} />
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
                          const checked = linkedTaskIds.includes(task.id);
                          return (
                            <label key={task.id} className={`flex items-center gap-2.5 cursor-pointer group ${!checked ? 'opacity-40' : ''}`}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleTask(task.id)}
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

// Sentinel id for a not-yet-saved outcome — never present in OUTCOMES, so
// it can't collide with a real one. OutcomeEditForm just renders a blank
// template for it; nothing is added to the underlying data until a real
// save flow exists, same as every other field on this form today.
const NEW_OUTCOME_ID = 'new-outcome';

function blankOutcome(): Outcome {
  return { id: NEW_OUTCOME_ID, title: '', type: 'custom', whatICanDo: '', aims: '', taskIds: [], visitIds: [], status: 'active' };
}

export function OutcomesTab() {
  const { OUTCOMES, pending, draftSources } = useCareData();
  const [selectedId, setSelectedId] = useDetailParam();
  const selected = selectedId === NEW_OUTCOME_ID ? blankOutcome() : selectedId ? OUTCOMES.find(o => o.id === selectedId) : null;
  const { registerBack, clearBack, registerAdd, clearAdd, registerDelete, clearDelete, discard, draftStep } = useCareManagement();
  const drafting = draftStep !== null;

  // "Add Outcome" lives in the subnav's actions row, not here — only the
  // list view offers it, same scoping as the back button being detail-only.
  // "Delete Outcome" is the mirror image: detail-only, replacing Print/Save
  // rather than sitting alongside them. Deleting reuses the same discard
  // mechanism the draft flow uses — it already drops any id from OUTCOMES
  // regardless of review state, which is exactly "remove this outcome".
  useEffect(() => {
    if (selectedId) {
      registerBack(() => setSelectedId(null));
      clearAdd();
      registerDelete('Outcome', () => { discard(selectedId); setSelectedId(null); });
    } else {
      clearBack();
      registerAdd('Add Outcome', () => setSelectedId(NEW_OUTCOME_ID));
      clearDelete();
    }
    return () => { clearBack(); clearAdd(); clearDelete(); };
  }, [selectedId]);

  if (selected) {
    return <OutcomeEditForm outcome={selected} onDiscarded={() => setSelectedId(null)} />;
  }

  return (
    <div className="space-y-4">
      {/* Offer / progress / success for drafting the plan from a recording.
          Renders nothing unless this customer actually has a draft available. */}
      <CarePlanDraftFlow />

      {OUTCOMES.length === 0 ? (
        // Suppressed mid-run: "No outcomes yet" directly under a stepper that
        // is in the middle of drafting them reads as a contradiction.
        drafting ? null : <EmptyTab label="outcomes" />
      ) : (
        <>
          <CarePlanDraftBanner
            pendingOutcomes={pending.outcomes}
            pendingTasks={pending.tasks}
            sources={draftSources}
            activeTab="outcomes"
          />
          {OUTCOMES.map(outcome => (
            <OutcomeCard key={outcome.id} outcome={outcome} onSelect={() => setSelectedId(outcome.id)} />
          ))}
          <CareManagementFooter />
        </>
      )}
    </div>
  );
}
