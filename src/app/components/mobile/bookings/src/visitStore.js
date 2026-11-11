import { useSyncExternalStore } from 'react'

// Where each booking's visit has got to. A module-level store (not React state) because Reasonable
// adjustments is a separate page: following the Adjustments chip and coming back reloads this app, and
// the visit — tag-in time, ticked tasks, the running timer — has to survive that. sessionStorage keeps it
// for the tab; nothing outlives the tab.
//
//   visits[bookingId] = { status: 'inProgress' | 'complete', startedAt: ms, tagInTime: 'HH:MM', tasksDone: string[] }
//   No entry = not started.
const KEY = 'pass-proto-bookings-visits'
const listeners = new Set()

function load() {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* storage blocked: start empty */ }
  return { visits: {} }
}
// useSyncExternalStore needs getSnapshot to return the SAME reference until something changes.
let state = load()

function commit(next) {
  state = next
  try { sessionStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
  listeners.forEach(l => l())
}
const subscribe = l => { listeners.add(l); return () => listeners.delete(l) }
const getSnapshot = () => state

const clock = d => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
const withVisit = (id, visit) => {
  const visits = { ...state.visits }
  if (visit) visits[id] = visit; else delete visits[id]
  commit({ visits })
}

export const useVisits = () => useSyncExternalStore(subscribe, getSnapshot).visits

export function startVisit(id, startedAt = Date.now()) {
  withVisit(id, { status: 'inProgress', startedAt, tagInTime: clock(new Date(startedAt)), tasksDone: [] })
}
export const cancelVisit = id => withVisit(id, null)
export function completeTask(id, taskId) {
  const v = state.visits[id]
  if (!v || v.tasksDone.includes(taskId)) return
  withVisit(id, { ...v, tasksDone: [...v.tasksDone, taskId] })
}
/** The demo switch: jump a visit straight to a state. */
export function setVisitStatus(id, status, allTaskIds = []) {
  if (status === 'upcoming') return cancelVisit(id)
  if (status === 'inProgress') return startVisit(id, Date.now() - 4000)
  const v = state.visits[id]
  withVisit(id, { status: 'complete', startedAt: v?.startedAt ?? Date.now() - 3600_000, tagInTime: v?.tagInTime ?? '16:00', tasksDone: allTaskIds })
}
