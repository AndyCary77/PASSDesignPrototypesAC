import { useRef, useState } from 'react'
import useDragScroll from '../../assets/useDragScroll'
import { buildFlagChips } from '../../assets/CustomerFlags'
import AdjustmentsSheet from '../../assets/AdjustmentsSheet'
import VisitHeader from './VisitHeader'
import TaskRow from './TaskRow'
import { TASKS, TASK_DETAILS } from './visitData'
import { adjustmentsHref, hasAdjustmentsFlag } from './bookingsData'
import { useElapsed } from './useElapsed'
import { CloseIcon, EditNoteIcon, PlayIcon } from './visitIcons'

// The visit before and after tagging in — one screen, because it's the same task list either side of the
// tag-in: before, a "Tag in and start visit" button; after, the timer, tag-in time, a marker on each task and
// "Add notes" / "Cancel visit". Once a task is recorded the visit is locked, so Cancel goes (as the in-app note says).
//
//   visit  undefined = not started; { status, startedAt, tagInTime, tasksDone } otherwise
export default function VisitScreen({ booking, customer, visit, onBack, onTagIn, onCancel, onOpenTask }) {
  const started = visit?.status === 'inProgress'
  const complete = visit?.status === 'complete'
  const [collapsed, setCollapsed] = useState(false)
  // Mid-visit the Adjustments chip opens a sheet over the visit rather than leaving it; the sheet links on to the full screen.
  const [adjOpen, setAdjOpen] = useState(false)
  const scrollRef = useRef(null)
  useDragScroll(scrollRef)
  const elapsed = useElapsed(started ? visit.startedAt : null)

  const done = new Set(visit?.tasksDone ?? [])
  const locked = done.size > 0
  const chips = buildFlagChips({
    legalChips: customer.legalChips,
    hasAdjustments: hasAdjustmentsFlag(customer),
    onAdjustments: () => setAdjOpen(true),
  })

  return (
    <div className="vs">
      <VisitHeader
        title={started ? `${booking.title} - Lead` : booking.title}
        subtitle={started ? `Visit in progress (${elapsed})` : undefined}
        onBack={onBack}
        onToggle={started ? () => setCollapsed(c => !c) : undefined}
        collapsed={collapsed}
        customer={customer}
        booking={booking}
        tagTime={visit?.tagInTime}
        chips={chips}
      />
      <div className="vs-tabs">Task ({done.size}/{TASKS.length})</div>
      <div className="vs-scroll" ref={scrollRef}>
        <ul className="vs-tasks">
          {TASKS.map(t => (
            <TaskRow
              key={t.id}
              task={t}
              marker={started || complete}
              done={done.has(t.id)}
              onOpen={started && TASK_DETAILS[t.id] ? () => onOpenTask(t.id) : undefined}
            />
          ))}
        </ul>
      </div>
      {!visit && (
        <div className="vs-actions vs-actions--centre">
          <button type="button" className="m-btn m-btn--go" onClick={onTagIn}><PlayIcon />Tag in and start visit</button>
        </div>
      )}
      {started && (
        <div className="vs-actions">
          <button type="button" className="m-btn m-btn--soft"><EditNoteIcon />Add notes</button>
          {!locked && <button type="button" className="m-btn m-btn--danger" onClick={onCancel}><CloseIcon size={20} />Cancel visit</button>}
        </div>
      )}
      {adjOpen && (
        <AdjustmentsSheet
          recordId={customer.recordId}
          fullHref={adjustmentsHref(booking.id, 'visit')}
          onClose={() => setAdjOpen(false)}
        />
      )}
    </div>
  )
}

