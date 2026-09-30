import { useEffect, useState } from 'react';
import { Calendar, CalendarClock, CalendarDays, Clock, ArrowRight, Repeat2, Plus } from 'lucide-react';
import { CalendarSolidIcon } from '../../icons/CarePlanIcons';
import { Button } from '../../buttons/Button';
import { useCareManagement } from './CareManagementContext';
import { useCareData } from './useCareData';
import { TASK_CATEGORIES, type CareVisit } from './types';
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
        <div className="flex flex-wrap gap-1.5 content-start">
          {tasks.map(t => <TaskBadge key={t.id} title={t.title} category={t.category} />)}
        </div>
      </div>
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
                {visit.status === 'active' ? (
                  <span className="inline-block text-sm font-medium px-4 py-2 rounded-md" style={{ backgroundColor: '#D4EBC3', color: '#2D5F1E' }}>
                    Active
                  </span>
                ) : (
                  <span className="inline-block text-sm font-medium px-4 py-2 rounded-md bg-gray-100 text-gray-500">
                    Inactive
                  </span>
                )}
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
            <p className="text-xs text-[rgb(154,38,214)] mb-3">Reorder the tasks using the position buttons</p>
            <div className="space-y-2">
              {orderedTaskIds.map((tid, idx) => {
                const task = TASKS.find(t => t.id === tid);
                if (!task) return null;
                const { bg, text, border } = CATEGORY_CONFIG[task.category];
                return (
                  // No `overflow-hidden` on the card itself (moved rounding
                  // onto the header/description directly instead) so the
                  // number badge below can actually overlap the left edge
                  // rather than getting clipped by this card's own corner.
                  <div key={tid} className="border border-gray-200 rounded-lg">
                    {/* `relative` lives on the header row specifically
                        (not the whole card) so the badge centres on just
                        this row, not the row+description block below. */}
                    <div className={`relative flex items-center gap-3 pl-6 pr-4 py-2 rounded-t-lg ${bg} ${border} border-b`}>
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
                      {/* Position number — bold, white-filled, bordered in
                          the task's own category hue, overlapping the
                          row's left edge by half its own width
                          (`-translate-x-1/2`, which is relative to the
                          badge's own size) so it reads as a strong
                          external marker rather than another small inline
                          label. */}
                      <div
                        className={`absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border-2 ${border} flex items-center justify-center text-sm font-bold ${text} shadow-sm`}
                      >
                        {idx + 1}
                      </div>
                    </div>
                    <p className="px-4 py-2 text-sm text-gray-600 rounded-b-lg">{task.description}</p>
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
  const { VISITS, pending, draftSource } = useCareData();
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
