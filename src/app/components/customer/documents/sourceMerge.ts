// What happens when more than one source (a recording or file) has something to say about the same field
// (AIOP-24513 / AIOP-25366). Pure logic and types only, so the review UI and the update engines can both use it.
//
// The rules, as agreed:
//  • The most recent source wins, judged by the date of the SOURCE ITSELF (the letter's date, the recording's
//    date) — never when a file was uploaded — and the disagreement is flagged, showing the other values.
//  • A legal document (LPA, DNACPR, signed consent) is never overridden by a newer non-legal source: it is kept,
//    the disagreement flagged, and both values shown.
//  • If a source's date can't be found, or isn't certain, nothing is picked: the existing value stays and every
//    value is listed, with the date marked "to check", for the reviewer to choose.
//  • Whichever is suggested, the reviewer can switch to any other value, and still accepts each field themselves.

export interface SourceRef {
  type: 'recording' | 'file';
  id: string;
  label: string;
}

export interface SourceMeta {
  /** Date of the source itself, YYYY-MM-DD. Missing when it couldn't be worked out. */
  date?: string;
  /** A date was found but isn't certain (a handwritten or smudged date, say) — treated like a missing one. */
  dateUncertain?: boolean;
  /** A legal document: a Lasting Power of Attorney, a DNACPR, a signed consent. */
  legal?: boolean;
}

/** One source's answer for a field. */
export interface ConflictValue extends SourceRef, SourceMeta {
  value?: string;
  rows?: string[][];
  /** The answer as one line of text, for listing. */
  text: string;
}

export interface FieldConflict {
  /** How the suggestion was reached: the newest source, a legal document kept, or no pick because dates are unknown. */
  resolution: 'newest' | 'legal' | 'undated';
  /** The value suggested. Undefined for 'undated' until the reviewer chooses one. */
  chosen?: ConflictValue;
  /** Every other value found, each with its source and date. */
  others: ConflictValue[];
  /** The reviewer picked `chosen` themselves, rather than Assessment Hero. */
  chosenByReviewer?: boolean;
}

/** The passage a drafted field or section came from — what "Check source" shows. */
export interface SourceExtract {
  source: SourceRef;
  /** Where in it: "Page 2 — Medication on discharge", or "Transcript, 10:14". */
  location?: string;
  text: string;
  date?: string;
  dateUncertain?: boolean;
}

/** Content taken out of a section because a newer source shows it is no longer right. */
export interface Removal {
  removed: string;
  /** The source that put it there, when it is part of the same run. */
  earlier?: SourceRef;
  earlierDate?: string;
  because: SourceRef;
  becauseDate?: string;
  reason: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-11-05' -> '5 Nov 2026'. */
export function formatSourceDate(iso: string | undefined): string {
  if (!iso) return 'date unknown';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** '5 Sep 2026' (how a recording states its date) -> '2026-09-05'. */
export function parseSourceDate(text: string): string | undefined {
  const m = /^(\d{1,2}) ([A-Za-z]{3}) (\d{4})/.exec(text.trim());
  if (!m) return undefined;
  const month = MONTHS.indexOf(m[2]);
  return month < 0 ? undefined : `${m[3]}-${String(month + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

/** A date is only trusted if it exists and isn't flagged uncertain. */
export const isDateKnown = (s: SourceMeta) => !!s.date && !s.dateUncertain;

/** Oldest first; sources with no trustworthy date go first, so a dated source gets the last word. */
export function sortOldestFirst<T extends SourceMeta>(items: T[]): T[] {
  return [...items].sort((a, b) => (isDateKnown(a) ? a.date! : '').localeCompare(isDateKnown(b) ? b.date! : ''));
}

const keyOf = (v: Pick<ConflictValue, 'value' | 'rows'>) => JSON.stringify([v.value ?? '', v.rows ?? null]);

/**
 * Decides what to suggest when several sources each have an answer for one field. With one distinct answer there
 * is nothing to decide (`conflict` is undefined). `candidates` must be oldest first, as `sortOldestFirst` leaves them.
 */
export function resolveCandidates(candidates: ConflictValue[]): { chosen?: ConflictValue; conflict?: FieldConflict } {
  const distinct = new Map<string, ConflictValue>();
  for (const c of candidates) distinct.set(keyOf(c), c); // later (newer) wins the slot for an identical answer
  if (distinct.size <= 1) return { chosen: candidates[candidates.length - 1] };

  const legal = candidates.filter(c => c.legal);
  const hasNonLegalDisagreement = legal.length > 0 && candidates.some(c => !c.legal && keyOf(c) !== keyOf(legal[legal.length - 1]));
  let resolution: FieldConflict['resolution'];
  let chosen: ConflictValue | undefined;

  if (hasNonLegalDisagreement) {
    resolution = 'legal';
    chosen = legal[legal.length - 1];
  } else if (candidates.some(c => !isDateKnown(c))) {
    resolution = 'undated';
  } else {
    resolution = 'newest';
    chosen = candidates[candidates.length - 1];
  }

  const others = [...distinct.values()].filter(c => !chosen || keyOf(c) !== keyOf(chosen)).reverse();
  return { chosen, conflict: { resolution, chosen, others } };
}

/** The reviewer picks a different value from the ones listed: it becomes the chosen one, the old choice joins the others. */
export function chooseConflictValue(conflict: FieldConflict, pick: ConflictValue): FieldConflict {
  const rest = [conflict.chosen, ...conflict.others].filter((v): v is ConflictValue => !!v && keyOf(v) !== keyOf(pick));
  return { ...conflict, chosen: pick, others: rest, chosenByReviewer: true };
}

/** An unresolved disagreement the reviewer still has to settle: nothing is suggested until they pick a value. */
export const needsChoice = (conflict: FieldConflict | undefined) => !!conflict && conflict.resolution === 'undated' && !conflict.chosen;
