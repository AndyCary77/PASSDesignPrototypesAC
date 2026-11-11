// A one-week date picker: S M T W T F S, a dot under each day that has something on, the selected
// day in a purple circle, and a drag handle beneath (the real app expands this to a month; here
// the handle is inert). Pair with week-strip.css.
//
//   weekStart   Date  — the Sunday the strip starts on
//   selected    Date  — the highlighted day
//   today       Date  — days before it are drawn grey
//   markedDates string[] — 'YYYY-MM-DD' keys that get a dot
//   onSelect    (date: Date) => void

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export const dateKey = d => {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function WeekStrip({ weekStart, selected, today, markedDates = [], onSelect }) {
  const marked = new Set(markedDates)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
  return (
    <div className="week-strip">
      <div className="week-strip-days" role="group" aria-label="Week">
        {days.map((d, i) => {
          const key = dateKey(d)
          const isSelected = key === dateKey(selected)
          const isPast = key < dateKey(today)
          return (
            <button
              key={key}
              type="button"
              className={`week-day${isSelected ? ' week-day--selected' : ''}${isPast ? ' week-day--past' : ''}`}
              aria-pressed={isSelected}
              aria-label={d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              onClick={() => onSelect?.(d)}
            >
              <span className="week-day-letter" aria-hidden="true">{LETTERS[i]}</span>
              <span className="week-day-num">{d.getDate()}</span>
              <span className={`week-day-dot${marked.has(key) ? ' week-day-dot--on' : ''}`} aria-hidden="true" />
            </button>
          )
        })}
      </div>
      <div className="week-strip-handle" aria-hidden="true" />
    </div>
  )
}
