import { useEffect, useState } from 'react';
import { Calendar, CalendarClock, CalendarDays, Clock, ArrowRight, Repeat2, Plus, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarSolidIcon } from '../../icons/CarePlanIcons';
import { Button } from '../../buttons/Button';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../ui/tooltip';
import { useWrapRowLimit } from '../../../hooks/useWrapRowLimit';
import { useCareManagement, useDetailParam } from './CareManagementContext';
import { useCareData } from './useCareData';
import { TASK_CATEGORIES, type CareTask, type CareVisit } from './types';
import { OutcomeBadge, TaskBadge, ActiveBadge, EmptyTab, CareManagementFooter, labelClass, CATEGORY_CONFIG, CarePlanDraftBanner } from './shared';

const DAYS_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** A "Title" / "Type" style field: bold label above, plain value below — the pairing used throughout the Visit Details/Visit Schedule panels. */
function SummaryField({ label, sublabel, children }: { label: string; sublabel?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-semibold text-gray-900">
        {label} {sublabel && <span className="font-normal text-gray-400">{sublabel}</span>}
      </div>
      <div className="text-sm text-gray-700 mt-1">{children}</div>
    </div>
  );
}

/** Titled bordered panel — "Visit Details"/"Visit Schedule"/"Scheduled Times"/"Care Groups" all use this same shell. */
function SummaryPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-900 mb-3">{title}</h4>
      <div className="border border-gray-200 rounded-lg p-6">{children}</div>
    </div>
  );
}

// isToday isn't part of the data model — it's derived live from the real
// calendar date each render, purely as a visual "this is today" cue on the
// schedule's day-of-week picker (matching the reference screenshot).
//
// Sized by `aspect-square` + `w-full` rather than a fixed w/h — each pill
// fills whatever width its grid cell (1/7th of the row) happens to be and
// derives its height from that, so the row always spans the full
// available width, stays perfectly circular, and scales smoothly as the
// column narrows (e.g. resizing the window) instead of wrapping or
// overflowing at a fixed size. The label's font-size is tied to the
// row's own width via a container-query `cqw` unit (needs `@container`
// on the row, set where this is used) rather than a fixed size, so
// "Mon"/"Tue" etc. shrink in step with the circle instead of overflowing
// it once the circles get small — verified down to an 800px viewport.
// Coefficient/ceiling chosen to match this app's original 40px-circle/
// 12px-label ratio (~0.3 of the diameter): at a ~316px row (7 circles +
// 6 gaps, diameter ~40px, the old fixed size), 4.2cqw ≈ 13px — so normal/
// wide screens now render at roughly that original size instead of
// plateauing at a noticeably smaller cap.
function DayPill({ label, active, isToday }: { label: string; active: boolean; isToday: boolean }) {
  return (
    <div className={`aspect-square w-full flex items-center justify-center rounded-full text-[clamp(7px,4.2cqw,13px)] border transition-colors ${
      isToday ? 'font-bold underline' : 'font-semibold'
    } ${
      active
        ? 'bg-[rgb(154,38,214)] border-[rgb(154,38,214)] text-white'
        : 'bg-white border-gray-200 text-gray-400'
    }`}>
      {label}
    </div>
  );
}

// A busy visit (see the "Busy visit" stress-test example) can have dozens
// of tasks, which used to render as one huge wall of badges and made the
// whole card absurdly tall in the Visits list. Caps the wrapped badge row
// at MAX_ROWS, appending a "+X more" chip once it overflows — hovering
// the chip shows the complete task list (not just the hidden remainder)
// so the full picture is available without opening the visit.
const VISIT_CARD_MAX_TASK_ROWS = 8;

function VisitCardTasks({ tasks }: { tasks: CareTask[] }) {
  const { containerRef, itemRefs, visibleCount, hasOverflow } = useWrapRowLimit(tasks.length, VISIT_CARD_MAX_TASK_ROWS);
  const shown = tasks.slice(0, visibleCount);
  const hiddenCount = tasks.length - visibleCount;

  return (
    <div ref={containerRef as React.RefObject<HTMLDivElement>} className="relative">
      <div className="flex flex-wrap gap-1.5 content-start">
        {shown.map(t => <TaskBadge key={t.id} title={t.title} category={t.category} />)}
        {hasOverflow && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 px-2 py-0.5 text-sm font-semibold text-gray-600 cursor-default hover:bg-gray-200"
              >
                +{hiddenCount} more
              </span>
            </TooltipTrigger>
            {/* Overrides the shared Tooltip's default dark fill — scoped
                to this instance only (not the shared ui/tooltip default,
                which other tooltips like DraftSourcesNote still rely
                on). */}
            <TooltipContent
              side="top"
              className="max-w-xs bg-white text-gray-900 border border-gray-200 shadow-lg"
              arrowClassName="bg-white fill-white"
            >
              <ul className="space-y-0.5 max-h-60 overflow-y-auto">
                {tasks.map(t => <li key={t.id}>{t.title}</li>)}
              </ul>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {/* Hidden measuring copy — every task badge at natural size, so
          useWrapRowLimit can measure real row-wrapping without the
          visible card ever actually rendering all of them. */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 invisible flex flex-wrap gap-1.5 content-start pointer-events-none">
        {tasks.map((t, i) => (
          <span key={t.id} ref={el => { itemRefs.current[i] = el; }}>
            <TaskBadge title={t.title} category={t.category} />
          </span>
        ))}
      </div>
    </div>
  );
}

function VisitCard({ visit, onSelect }: { visit: CareVisit; onSelect: () => void }) {
  const { OUTCOMES, TASKS } = useCareData();
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
        <VisitCardTasks tasks={tasks} />
      </div>
    </div>
  );
}

/**
 * One card in the Task ordering list — drag-and-drop AND the ↑/↓ buttons
 * both call the same `moveTask(from, to)`, so either mechanism keeps the
 * same single `orderedTaskIds` state in sync. Split out into its own
 * component (rather than calling useSortable inline inside the parent's
 * `.map()`) because the number of cards changes whenever a task gets
 * checked/unchecked in the selector above — hooks can't have a variable
 * call count within one component instance, so each card needs to be its
 * own instance regardless of list length.
 *
 * Uses dnd-kit rather than react-dnd's HTML5Backend (used for the rest
 * of this app's DnD) — HTML5Backend drives native browser drag-and-drop,
 * which renders its own drag-ghost snapshot of the source element. That
 * ghost doesn't know about this card's number badge overlapping outside
 * the card's own box (`-translate-x-1/2`), so it clipped/shadowed it
 * during a drag; combined with an earlier hand-rolled FLIP animation
 * that mutated this same element's `transform` mid-drag, it actually
 * broke native drag tracking outright. dnd-kit is pointer-event driven
 * (no native drag, no ghost image at all) and has smooth sortable
 * reordering built in, so neither problem exists here any more.
 */
function TaskOrderCard({
  tid, idx, isFirst, isLast, moveTask,
}: {
  tid: string; idx: number; isFirst: boolean; isLast: boolean;
  moveTask: (from: number, to: number) => void;
}) {
  const { TASKS } = useCareData();
  const task = TASKS.find(t => t.id === tid);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tid });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  if (!task) return null;
  const { bg, text, border } = CATEGORY_CONFIG[task.category];

  return (
    // No `overflow-hidden` on the card itself (moved rounding onto the
    // header/description directly instead) so the number badge below can
    // actually overlap the left edge rather than getting clipped by this
    // card's own corner.
    <div ref={setNodeRef} style={style} className="border border-gray-200 rounded-lg">
      {/* `relative` lives on the header row specifically (not the whole
          card) so the badge centres on just this row, not the
          row+description block below. */}
      <div className={`relative flex items-center gap-2 pl-6 pr-4 py-2 rounded-t-lg ${bg} ${border} border-b`}>
        {/* Only the handle itself is the drag trigger (attributes+
            listeners), not the whole row — so dragging never conflicts
            with clicking the title, badge, or the buttons. */}
        <GripVertical
          {...attributes}
          {...listeners}
          className="w-4 h-4 text-gray-400 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
        />
        <span className={`text-sm font-semibold ${text}`}>{task.title}</span>
        <ActiveBadge status="active" />
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => !isFirst && moveTask(idx, idx - 1)}
            disabled={isFirst}
            className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded bg-white text-gray-500 hover:bg-gray-50 text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            ↑
          </button>
          <button
            onClick={() => !isLast && moveTask(idx, idx + 1)}
            disabled={isLast}
            className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded bg-white text-gray-500 hover:bg-gray-50 text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            ↓
          </button>
          <button className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded bg-white text-gray-500 hover:bg-gray-50 text-sm cursor-pointer">⋮</button>
        </div>
        {/* Position number — bold, white-filled, bordered in the task's
            own category hue, overlapping the row's left edge by half its
            own width (`-translate-x-1/2`, which is relative to the
            badge's own size) so it reads as a strong external marker
            rather than another small inline label. */}
        <div
          className={`absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border-2 ${border} flex items-center justify-center text-sm font-bold ${text} shadow-sm`}
        >
          {idx + 1}
        </div>
      </div>
      <p className="px-4 py-2 text-sm text-gray-600 rounded-b-lg">{task.description}</p>
    </div>
  );
}

function VisitEditForm({ visit }: { visit: CareVisit }) {
  const { TASKS } = useCareData();
  // 'Alternate week' visits repeat every 2 weeks; everything else here is
  // weekly — matches the "Every {n} week(s)" wording from the real
  // implementation rather than the old internal 'BiWeekly' label.
  const everyWeeks = visit.cadence === 'Alternate week' ? 2 : 1;
  const todayIndex = (new Date().getDay() + 6) % 7; // JS getDay() is Sun=0; DAYS_ABBR is Mon-first.
  // Defaults to on, matching this app's existing tab-level "Hide inactive"
  // checkbox convention (checked by default) elsewhere in Care Management.
  const [hideInactiveTasks, setHideInactiveTasks] = useState(true);
  // Single source of truth for the checkbox's checked state, the
  // selector row's colour tint, AND the Task ordering list below —
  // previously the checkbox used `defaultChecked` (uncontrolled) while
  // the tint and the ordering list both read `visit.taskIds` directly, so
  // clicking a checkbox changed its own tick but nothing else, silently
  // desyncing all three the moment anyone actually used it. An ordered
  // array (not a Set) so the existing order is preserved and a newly
  // checked task simply appends to the end, matching what "adding it to
  // the plan" should do.
  const [orderedTaskIds, setOrderedTaskIds] = useState<string[]>(visit.taskIds);
  const toggleTask = (taskId: string) => {
    setOrderedTaskIds(prev => (prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]));
  };
  // Shared by the Task ordering list's drag-and-drop and its ↑/↓ buttons —
  // both are just different triggers for the same reorder.
  const moveTask = (from: number, to: number) => {
    setOrderedTaskIds(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };
  // Requires an actual pointer move (not just a click) before a drag
  // starts, so clicking the grip handle doesn't fight with clicking
  // anything else in the row.
  const taskDragSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const handleTaskDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = orderedTaskIds.indexOf(String(active.id));
    const to = orderedTaskIds.indexOf(String(over.id));
    if (from !== -1 && to !== -1) moveTask(from, to);
  };

  return (
    <div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 space-y-5">

          {/* Read-only visit summary — left panels take 2/3 of the width,
              right 1/3, so the columns line up with the 3-column Tasks
              grid below (and a single-week cadence's day pills fit on the
              same row as "Every"). */}
          <div className="grid grid-cols-[2fr_1fr] gap-x-8 gap-y-5">
            <div className="space-y-5">
              <SummaryPanel title="Visit Details">
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <SummaryField label="Title">{visit.title}</SummaryField>
                  <SummaryField label="Type">{visit.visitType}</SummaryField>
                  <SummaryField label="No. Employees">{visit.numEmployees}</SummaryField>
                  <SummaryField label="Preferred Employees" sublabel="(In order of preference)">—</SummaryField>
                </div>
              </SummaryPanel>

              <SummaryPanel title="Visit Schedule">
                {/* One grid for the whole panel (not just the Begins on/
                    Finishes on row) so the day-pill column always starts
                    at the same x as "Finishes on" above it, whether it's
                    a single row (weekly) or several stacked rows
                    (biweekly+) — a plain flex row here previously let the
                    pills drift depending on how wide the "Every" label
                    happened to be. */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  <SummaryField label="Begins on">{visit.startDate}</SummaryField>
                  <SummaryField label="Finishes on">Ongoing</SummaryField>
                  <SummaryField label="Every">{everyWeeks} week{everyWeeks > 1 ? 's' : ''}</SummaryField>
                  <div className="space-y-3">
                    {visit.weeks.map((week, wi) => (
                      <div key={wi}>
                        {visit.weeks.length > 1 && (
                          <div className="text-xs text-gray-400 mb-1.5">Week {wi + 1}</div>
                        )}
                        <div className="@container grid grid-cols-7 gap-1.5 w-full">
                          {DAYS_ABBR.map((day, di) => (
                            <DayPill key={day} label={day.slice(0, 3)} active={week.activeDays.includes(di)} isToday={di === todayIndex} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </SummaryPanel>
            </div>

            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Status</h4>
                <ActiveBadge status={visit.status} />
              </div>

              <SummaryPanel title="Scheduled Times">
                <p className="text-sm text-gray-500">
                  at {visit.startTime} for {visit.duration} until {visit.endTime}
                </p>
              </SummaryPanel>

              <SummaryPanel title="Care Groups">
                <input
                  type="text"
                  disabled
                  placeholder="Start typing to select a care group"
                  className="w-full text-sm text-gray-400 placeholder:text-gray-400 outline-none bg-transparent cursor-default"
                />
              </SummaryPanel>
            </div>
          </div>

          {/* Task selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Tasks</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideInactiveTasks}
                    onChange={e => setHideInactiveTasks(e.target.checked)}
                    className="rounded border-gray-300 accent-[rgb(154,38,214)] w-4 h-4 cursor-pointer"
                  />
                  Hide inactive tasks
                </label>
                {/* Matches the real system's "New task" control above the
                    category columns — unwired here, same as History/
                    Discard draft elsewhere in this prototype. */}
                <Button variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                  New task
                </Button>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-3 divide-x divide-gray-200">
                {TASK_CATEGORIES.map(cat => {
                  // Inactive tasks sort to the bottom of their own column
                  // rather than being interleaved at their alphabetical/
                  // insertion position — Array.sort is stable, so within
                  // "active" and within "inactive" the original order is
                  // otherwise preserved.
                  const catTasks = TASKS
                    .filter(t => t.category === cat)
                    .filter(t => !hideInactiveTasks || t.status !== 'inactive')
                    .sort((a, b) => (a.status === 'inactive' ? 1 : 0) - (b.status === 'inactive' ? 1 : 0));
                  const { Icon, bg, text, border, bgFaded, borderFaded } = CATEGORY_CONFIG[cat];
                  return (
                    <div key={cat} className="p-4">
                      <p className="text-sm font-semibold text-gray-900 mb-3">{cat}</p>
                      <div className="space-y-2">
                        {catTasks.length === 0 && <p className="text-xs text-gray-300 italic">None</p>}
                        {catTasks.map(task => {
                          const checked = orderedTaskIds.includes(task.id);
                          const isInactive = task.status === 'inactive';
                          return (
                            <label
                              key={task.id}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-md border cursor-pointer group transition-colors ${
                                checked ? `${bg} ${border}` : `${bgFaded} ${borderFaded}`
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleTask(task.id)}
                                className="rounded border-gray-300 accent-[rgb(154,38,214)] w-4 h-4 cursor-pointer flex-shrink-0"
                              />
                              <Icon className={`w-4 h-4 flex-shrink-0 ${checked ? text : 'text-gray-400'}`} />
                              <span className={`text-sm flex-1 ${checked ? text : 'text-gray-700'} group-hover:text-gray-900`}>
                                {task.title}
                              </span>
                              {/* Distinct from the plain "not assigned to
                                  this visit" dimming above — without this,
                                  an active-but-unchecked task and a
                                  genuinely inactive one were visually
                                  identical, and the "Hide inactive tasks"
                                  toggle only ever touched the latter. */}
                              {isInactive && (
                                <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-200 text-gray-500">
                                  Inactive
                                </span>
                              )}
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
            <p className="text-xs text-[rgb(154,38,214)] mb-3">Drag a card, or use the position buttons, to reorder the tasks</p>
            <DndContext sensors={taskDragSensors} collisionDetection={closestCenter} onDragEnd={handleTaskDragEnd}>
              <SortableContext items={orderedTaskIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {orderedTaskIds.map((tid, idx) => (
                    <TaskOrderCard
                      key={tid}
                      tid={tid}
                      idx={idx}
                      isFirst={idx === 0}
                      isLast={idx === orderedTaskIds.length - 1}
                      moveTask={moveTask}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VisitsTab() {
  const { VISITS, pending, draftSource } = useCareData();
  const [selectedId, setSelectedId] = useDetailParam();
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

  if (VISITS.length === 0) {
    return <EmptyTab label="visits" />;
  }

  return (
    <div className="space-y-4">
      {/* Visits themselves are never drafted — they come from the service
          agreement — but the banner still shows here so the outstanding review
          count is visible from every tab of the care plan. */}
      <CarePlanDraftBanner
        pendingOutcomes={pending.outcomes}
        pendingTasks={pending.tasks}
        source={draftSource}
        activeTab="visits"
      />
      {VISITS.map(visit => (
        <VisitCard key={visit.id} visit={visit} onSelect={() => setSelectedId(visit.id)} />
      ))}
      <CareManagementFooter />
    </div>
  );
}
