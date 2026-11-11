import { TaskTypeIcon, TickIcon } from './visitIcons'

// One task in a visit's list. `marker` is only shown once the visit has started: an empty circle
// straddling the card's left edge, or a green tick when the task has been recorded. Give `onOpen` to
// make the card tappable.
export default function TaskRow({ task, marker = false, done = false, onOpen }) {
  const body = (
    <>
      <span className="tk-title">{task.title}</span>
      <TaskTypeIcon type={task.type} />
    </>
  )
  return (
    <li className="tk-row">
      {marker && <span className={`tk-marker${done ? ' tk-marker--done' : ''}`} role="img" aria-label={done ? 'Recorded' : 'Not recorded'}>{done && <TickIcon size={16} />}</span>}
      {onOpen
        ? <button type="button" className="tk-card tk-card--tap" onClick={onOpen}>{body}</button>
        : <div className="tk-card">{body}</div>}
    </li>
  )
}
