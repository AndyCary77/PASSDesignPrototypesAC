// Tasks for a visit and the one task whose detail screen is built. Taken from the design screenshots
// (a "Tea Visit" with eight tasks); every booking in the prototype uses the same list.

export const TASKS = [
  { id: 't1', title: 'Paracetamol 500mg tablets (PRN)', type: 'medication' },
  { id: 't2', title: 'Fluids', type: 'fluids' },
  { id: 't3', title: 'Tea', type: 'meal' },
  { id: 't4', title: 'Pet Care', type: 'task' },
  { id: 't5', title: 'Life Line', type: 'task' },
  { id: 't6', title: 'Daily Cleaning Duties', type: 'observation' },
  { id: 't7', title: 'E45 cream', type: 'medication' },
  { id: 't8', title: 'Outcome Review - Maintain Adequate Dietary & Fluid Intake', type: 'outcome' },
]

// Only the first task has a detail screen (from the design); the rest are listed but not tappable.
export const TASK_DETAILS = {
  t1: {
    heading: 'Medication Task PRN',
    name: 'Paracetamol 500mg tablets',
    dueIn: 'Due in 12 mins',
    lastCompleted: '6 November 2026 at 13:00',
    lines: [
      { icon: 'tablet', primary: 'Tablet', secondary: ['Oral', 'Bathroom cabinet'] },
      { icon: 'dose', primary: '500mg', secondary: ['PRN'] },
      { icon: 'prompt', primary: 'Prompt' },
      { icon: 'info', primary: 'Please give me a glass of water and make sure I swallow the tablet ok as sometimes it gets stuck.' },
    ],
  },
}

/** "2h", "30m", "1h 30m" — the visit header's short form (the list uses "1hr"). */
export function formatShortDuration(start, end) {
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  const mins = toMin(end) - toMin(start)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return [h ? `${h}h` : '', m ? `${m}m` : ''].filter(Boolean).join(' ')
}

export const formatElapsed = ms => {
  const s = Math.max(0, Math.floor(ms / 1000))
  const pad = n => String(n).padStart(2, '0')
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
}
