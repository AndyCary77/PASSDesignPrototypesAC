import { useState } from 'react'
import VisitHeader from './VisitHeader'
import { DETAIL_ICONS, AlarmIcon, CloseIcon, InfoIcon, PersonFigureIcon, TickIcon, BodyMapThumb } from './visitIcons'
import { TASK_DETAILS } from './visitData'
import { useElapsed } from './useElapsed'

// A task inside a started visit (built for the medication task from the design). "Yes" records it; "No" just goes back.
export default function TaskDetail({ taskId, booking, customer, visit, onBack, onRecord }) {
  const detail = TASK_DETAILS[taskId]
  const split = detail.lastCompleted.lastIndexOf(' at ')
  const lastDate = detail.lastCompleted.slice(0, split)
  const lastTime = detail.lastCompleted.slice(split + 1)
  const [collapsed, setCollapsed] = useState(true)
  const [tab, setTab] = useState('details')
  const [noteOpen, setNoteOpen] = useState(true)
  const elapsed = useElapsed(visit?.startedAt ?? null)

  return (
    <div className="vs td">
      <VisitHeader
        title={detail.heading}
        subtitle={`Visit in progress (${elapsed})`}
        onBack={onBack}
        onToggle={() => setCollapsed(c => !c)}
        collapsed={collapsed}
        customer={customer}
        booking={booking}
        tagTime={visit?.tagInTime}
      />
      <div className="td-scroll">
        <div className="td-due"><AlarmIcon size={20} />{detail.dueIn}</div>
        {noteOpen && (
          <div className="td-note">
            <span>Please note: After recording the first Task of this Visit, this Visit is locked. You will not be able to back out of the Visit until it is completed.</span>
            <button type="button" className="td-note-x" aria-label="Dismiss" onClick={() => setNoteOpen(false)}><CloseIcon size={20} /></button>
          </div>
        )}
        <div className="td-task">
          <span className="td-circle" aria-hidden="true" />
          <div className="td-task-text">
            <div className="td-task-name">{detail.name}<br /><span className="td-with">with</span> <strong>{customer.name}</strong></div>
            <div className="td-meta">Due {booking.start} | Complete by {booking.end}</div>
            <div className="td-meta">
              Last completed: {lastDate}{' '}
              {/* "at 13:00" and the icon share a no-wrap span: if the line has to break, it breaks before the time and the icon never sits alone. */}
              <span className="td-nowrap">{lastTime}<InfoIcon size={14} /></span>
            </div>
          </div>
          <img className="td-avatar" src={customer.photo} alt="" />
        </div>
        <div className="td-tabs" role="tablist">
          {['details', 'records'].map(t => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={`td-tab${tab === t ? ' td-tab--on' : ''}`} onClick={() => setTab(t)}>{t.toUpperCase()}</button>
          ))}
        </div>
        {tab === 'details'
          ? (
            <ul className="td-lines">
              {detail.lines.map((l, i) => (
                <li key={i} className="td-line">
                  <span className="td-line-icon">{DETAIL_ICONS[l.icon]}</span>
                  <span className="td-line-text">
                    <span>{l.primary}</span>
                    {l.secondary?.map(s => <span key={s} className="td-line-sub">{s}</span>)}
                  </span>
                </li>
              ))}
              <li className="td-line">
                <span className="td-line-icon"><PersonFigureIcon /></span>
                <BodyMapThumb />
              </li>
            </ul>
          )
          : <p className="td-empty">No records for this task yet.</p>}
      </div>
      <div className="td-footer">
        <div className="td-ask">Was this completed?</div>
        <div className="td-yesno">
          <button type="button" className="td-choice" onClick={onBack}><CloseIcon size={20} />NO</button>
          <button type="button" className="td-choice" onClick={onRecord}><TickIcon size={20} />YES</button>
        </div>
      </div>
    </div>
  )
}
