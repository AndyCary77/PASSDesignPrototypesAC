import { useEffect, useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '../../buttons/Button';
import { StarSolidIcon } from '../../icons/CarePlanIcons';
import { useCareManagement, useDetailParam } from './CareManagementContext';
import { useCareData } from './useCareData';
import { TASK_CATEGORIES, type Outcome } from './types';
import { TaskBadge, VisitBadge, ActiveBadge, StatusToggle, EmptyTab, CareManagementFooter, inputClass, labelClass, CATEGORY_CONFIG, DraftActionBar, CarePlanDraftBanner, CarePlanDraftFlow } from './shared';

/**
 * Tinted to sit on the card header's amber (#feefdc) rather than the default
 * grey tertiary, with a solid border so they read clearly. `!` because Button
 * concatenates classes without tailwind-merge, so a plain bg-/text- here
 * would lose to the variant's own depending on stylesheet order.
 */
const REORDER_CONTROL = 'bg-[#fcdfb0]! text-amber-900! border-2! border-amber-700! hover:bg-[#fbcf8c]!';

/**
 * One outcome in the list. Reordering only exists in "Edit order" mode
 * (`editing`): drag (grip handle) or the ↑/↓ buttons — never drag-only — and
 * both end up in the same `onMove`. Outside that mode the card is just a
 * card, so none of these controls are rendered. In the mode, clicking the
 * card doesn't open it (easy to do by accident mid-reorder); the header's
 * controls also stop the click reaching it regardless. Uses dnd-kit rather than the HTML5Backend
 * react-dnd provider above it, for the reasons given on VisitsTab's
 * TaskOrderCard.
 */
function OutcomeCard({
  outcome, onSelect, editing, isFirst, isLast, onMove,
}: {
  outcome: Outcome; onSelect: () => void; editing: boolean;
  isFirst: boolean; isLast: boolean; onMove: (direction: -1 | 1) => void;
}) {
  const { TASKS, VISITS } = useCareData();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: outcome.id, disabled: !editing });
  const dragStyle = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, position: 'relative' as const, zIndex: isDragging ? 10 : undefined };
  const { accept, discard, planPublished } = useCareManagement();
  const tasks = TASKS.filter(t => outcome.taskIds.includes(t.id));
  const visits = VISITS.filter(v => outcome.visitIds.includes(v.id));
  const pending = outcome.reviewed === false;
  const preview = outcome.whatICanDo.length > 220
    ? outcome.whatICanDo.slice(0, 220) + '...'
    : outcome.whatICanDo;

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      onClick={editing ? undefined : onSelect}
      className={`bg-white rounded-lg border overflow-hidden hover:shadow-md group ${editing ? '' : 'cursor-pointer '}${
        isDragging ? 'shadow-lg ' : 'transition-shadow '}${
        pending ? 'border-amber-300 hover:border-amber-400' : (outcome.reviewed && !planPublished ? 'border-green-600 hover:border-green-700' : 'border-gray-200 hover:border-purple-300')
      }`}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b" style={{ backgroundColor: '#feefdc', borderColor: '#fcd9a8' }}>
          <div className="flex items-center gap-2 min-w-0">
          {editing && (
            <Button
              variant="tertiary"
              size="sm"
              iconOnly
              aria-label={`Drag to reorder ${outcome.title}`}
              {...attributes}
              {...listeners}
              onClick={e => e.stopPropagation()}
              className={`${REORDER_CONTROL} cursor-grab active:cursor-grabbing touch-none`}
            >
              <GripVertical className="w-4 h-4" />
            </Button>
          )}
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#fcdfb0' }}>
            <StarSolidIcon className="w-5 h-5 text-amber-700" />
          </div>
          <span className="text-base font-semibold text-amber-800">{outcome.title}</span>
          {!editing && <ArrowRight className="w-4 h-4 text-amber-800 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <ActiveBadge status={outcome.status} reviewed={outcome.reviewed} />
          {editing && (
            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
              <Button variant="tertiary" size="sm" iconOnly disabled={isFirst} className={REORDER_CONTROL} aria-label={`Move ${outcome.title} up`} onClick={() => onMove(-1)}>
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button variant="tertiary" size="sm" iconOnly disabled={isLast} className={REORDER_CONTROL} aria-label={`Move ${outcome.title} down`} onClick={() => onMove(1)}>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        <div>
          <p className="text-body font-semibold text-gray-900 mb-1">What I can do</p>
          <p className="text-body text-gray-700 leading-relaxed">{preview}</p>
        </div>

        {outcome.aims && (
          <div>
            <p className="text-body font-semibold text-gray-900 mb-1">Aims</p>
            <p className="text-body text-gray-700">{outcome.aims}</p>
          </div>
        )}
        {!outcome.aims && (
          <p className="text-body font-semibold text-gray-900">Aims</p>
        )}

        <div>
          <p className="text-body font-semibold text-gray-900 mb-2">Tasks</p>
          {tasks.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tasks.map(t => <TaskBadge key={t.id} title={t.title} category={t.category} />)}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">None</p>
          )}
        </div>

        <div>
          <p className="text-body font-semibold text-gray-900 mb-2">Visits</p>
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
  const { TASKS, pending, draftSources } = useCareData();
  const { accept, discard, setDirty, setOutcomeTitle } = useCareManagement();
  const isDraft = outcome.reviewed === false;
  const [linkedTaskIds, setLinkedTaskIds] = useState<string[]>(outcome.taskIds);
  const toggleTask = (id: string) =>
    setLinkedTaskIds(prev => (prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]));
  // Free text, written straight through to the shared overlay so the list and
  // the task/visit badges follow as you type. A blank title is never written
  // (the old value stays live) and shows the required-field error instead.
  const [title, setTitle] = useState(outcome.title);
  const titleMissing = title.trim() === '';
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (outcome.id !== NEW_OUTCOME_ID && value.trim() !== '') setOutcomeTitle(outcome.id, value.trim());
  };

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
            <label htmlFor="outcome-title" className={labelClass}>Title <span className="text-red-500">*</span></label>
            <input
              id="outcome-title"
              type="text"
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              aria-invalid={titleMissing}
              aria-describedby={titleMissing ? 'outcome-title-error' : undefined}
              className={`${inputClass} ${titleMissing ? 'border-red-600 focus:border-red-600 focus:ring-red-600' : ''}`}
              placeholder="Enter a title..."
            />
            {titleMissing && (
              <p id="outcome-title-error" className="text-sm text-red-700 mt-1.5">A title is required.</p>
            )}
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
            <p className="text-body text-gray-500 mb-3">Select the tasks that form this outcome (greyed out tasks are not part of this outcome):</p>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-3 divide-x divide-gray-200">
                {TASK_CATEGORIES.map(cat => {
                  const catTasks = TASKS.filter(t => t.category === cat);
                  const { Icon } = CATEGORY_CONFIG[cat];
                  return (
                    <div key={cat} className="p-4">
                      <p className="text-body font-semibold text-gray-900 mb-3">{cat}</p>
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
                              <span className="text-body text-gray-700 group-hover:text-gray-900">{task.title}</span>
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
  const { registerBack, clearBack, registerAdd, clearAdd, registerDelete, clearDelete, discard, draftStep, setOutcomeOrder, registerReorder, clearReorder } = useCareManagement();
  const [editingOrder, setEditingOrder] = useState(false);
  const drafting = draftStep !== null;

  // Both the grip handle (drag) and the ↑/↓ buttons funnel into one reorder.
  // A small pointer-distance threshold means a plain click on the handle never
  // starts a drag; the keyboard sensor gives Space + arrow keys on the handle.
  const dragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const moveOutcome = (from: number, to: number) => {
    if (to < 0 || to >= OUTCOMES.length) return;
    setOutcomeOrder(arrayMove(OUTCOMES.map(o => o.id), from, to));
  };
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = OUTCOMES.map(o => o.id);
    moveOutcome(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
  };

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

  // "Edit order" toggle in the subnav's actions row — list view only, and only
  // worth offering with something to reorder. Re-registers whenever the mode
  // flips so the subnav's label stays in step.
  useEffect(() => {
    if (!selectedId && OUTCOMES.length > 1) {
      registerReorder(editingOrder, () => setEditingOrder(v => !v));
    } else {
      clearReorder();
    }
    return clearReorder;
  }, [selectedId, editingOrder, OUTCOMES.length]);

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
          {editingOrder && (
            <p className="text-sm text-gray-700">Drag an outcome by its handle, or use the arrow buttons, to put them in the order you want. Select Done when you're finished.</p>
          )}
          <DndContext sensors={dragSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={OUTCOMES.map(o => o.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {OUTCOMES.map((outcome, idx) => (
                  <OutcomeCard
                    key={outcome.id}
                    outcome={outcome}
                    onSelect={() => setSelectedId(outcome.id)}
                    editing={editingOrder}
                    isFirst={idx === 0}
                    isLast={idx === OUTCOMES.length - 1}
                    onMove={direction => moveOutcome(idx, idx + direction)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <CareManagementFooter />
        </>
      )}
    </div>
  );
}
