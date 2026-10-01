import { useSyncExternalStore } from 'react'

// Recordings made with CareBridge, per customer. Exists because the old
// "Uploading… / Sent to PASS" flow was a blocking modal — which the app
// can't actually keep a user trapped in if their connection is poor. The
// replacement: finishing a recording writes it here as 'queued' and
// navigates straight back to Documents, where a Recordings list shows what's
// uploaded and what's still pending. The list *is* the confirmation.
//
// Lives in localStorage, not component state, for the same reason as
// platform.js: carebridge and customer-documents are separate standalone
// pages joined by a real `window.location.href` navigation, so React state
// doesn't survive the trip between them.

const STORAGE_KEY = 'pass-proto-recordings'

// Seed recordings so the demo always shows the requested scenarios: a more
// recent visit that failed to upload (sits above, so Retry is the first
// thing seen), an earlier visit that uploaded fine, and the one just
// finished landing as queued alongside both.
const DEFAULT_RECORDINGS = {
  arthur: [
    { id: 'seed-2', title: "Arthur's Review of Wellbeing – Mon 21 Sep 2026", status: 'failed' },
    { id: 'seed-1', title: "Arthur's Initial assessment – Mon 25 Aug 2026", status: 'uploaded' },
  ],
}

// A stable empty array — returned for any customer with no recordings, so
// getRecordings() doesn't hand back a fresh [] every call. useSyncExternalStore
// compares snapshots by reference; a new array each render looks like a
// perpetual change and throws "Maximum update depth exceeded".
const EMPTY = []

// In-memory cache, loaded from localStorage once and kept as the single
// source of truth for object identity thereafter. Every mutation goes
// through addRecording() below, so this tab's cache and localStorage never
// drift apart.
let cache = null

function load() {
  if (cache) return cache
  let stored = null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) stored = JSON.parse(raw)
  } catch {}
  cache = stored || DEFAULT_RECORDINGS
  if (!stored) persist()
  return cache
}

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cache)) } catch {}
}

export function getRecordings(customerId) {
  return load()[customerId] ?? EMPTY
}

const listeners = new Set()
const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn) }

/**
 * Adds a newly-finished recording as 'queued', newest first. Synchronous
 * (localStorage.setItem doesn't yield), so it's safe to call immediately
 * before a `window.location.href` navigation — the write is guaranteed to
 * land before the page unloads.
 */
export function addRecording(customerId, { title }) {
  const all = load()
  const existing = all[customerId] ?? []
  const entry = { id: `rec-${Date.now()}`, title, status: 'queued' }
  cache = { ...all, [customerId]: [entry, ...existing] }
  persist()
  listeners.forEach(fn => fn())
  return entry
}

export function useRecordings(customerId) {
  return useSyncExternalStore(subscribe, () => getRecordings(customerId))
}

/**
 * Flips a single recording from 'failed' to 'uploaded' — the demo's Retry
 * action. Only transition this data layer needs to support; a real retry
 * could of course fail again, but that's not the scenario being demoed.
 */
export function markUploaded(customerId, id) {
  const all = load()
  const existing = all[customerId] ?? []
  cache = { ...all, [customerId]: existing.map(r => (r.id === id ? { ...r, status: 'uploaded' } : r)) }
  persist()
  listeners.forEach(fn => fn())
}

/**
 * Resets a customer back to the seeded demo state (just the one "uploaded"
 * recording) — for clearing out whatever's piled up in localStorage after
 * rehearsing a demo, without wiping the baseline "already uploaded" example
 * a presenter would otherwise have to re-record from scratch.
 */
export function resetRecordings(customerId) {
  const all = load()
  const seed = DEFAULT_RECORDINGS[customerId]
  cache = { ...all, [customerId]: seed ? [...seed] : [] }
  persist()
  listeners.forEach(fn => fn())
}

/**
 * Whether a customer's recordings are still exactly the seeded demo state —
 * lets the UI hide the reset control until there's actually anything to
 * reset, rather than showing it permanently.
 */
export function isDefaultRecordings(customerId, recordings) {
  const seed = DEFAULT_RECORDINGS[customerId] ?? []
  return JSON.stringify(recordings) === JSON.stringify(seed)
}
