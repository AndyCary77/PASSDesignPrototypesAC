import { resolveRecording, revertFieldUpdate, revertSectionUpdate, type AssessmentSection, type FormField, type ItemUpdate, type TranscriptReference } from '../CareBridgePage';
import { CUSTOMER_FILES } from '../../../data/customerFiles';
import type { UpdateSource } from './UpdateDocumentBanner';
import {
  parseSourceDate, resolveCandidates, sortOldestFirst,
  type ConflictValue, type Removal, type SourceExtract, type SourceMeta, type SourceRef,
} from './sourceMerge';

// Simulates "Update document" on a finished Customer Care and Support Plan: given a recording or a file, work out
// which fields it has NEW, relevant information for, and change only those (they come back as pending review,
// like any Assessment Hero draft); every other field stays exactly as it was, accepted. A source with nothing
// relevant changes nothing — the user is told so rather than handed an empty draft.
//
// There is no real extraction here: what each source "finds" is authored below, for Arthur Barrington only, and is
// grounded in what the source actually contains (the recordings' transcripts; what each file in his Files tab is).

/** Rewrites a prose section. Most updates add a sentence to what's there; the personal-care one rewrites it. */
/** The passage in a FILE this came from — what Check source shows. (A recording's is read off its transcript.) */
interface FileExtract { location: string; text: string }

interface SectionEdit {
  sectionId: string;
  edit: (current: string) => string;
  /** The passage in the file this came from. Files only. */
  extract?: FileExtract;
  /**
   * Something this source shows is no longer right. If `text` is in the section when this runs (because an earlier
   * source put it there), it is taken out — visibly, with the reason — before `edit` is applied. `fromKey` is the
   * source that said it, as `file:<id>` or `recording:<id>`.
   */
  removes?: { text: string; fromKey: string; reason: string };
  /** Lines of the source recording's transcript this came from — powers Check transcript. Recordings only. */
  sourceLines?: TranscriptReference[];
}

/** Sets a field of a form section (Personal details). */
interface FieldEdit {
  sectionId: string;
  fieldId: string;
  value?: string;
  rows?: string[][];
  sourceLines?: TranscriptReference[];
  /** The passage in the file this came from. Files only. */
  extract?: FileExtract;
}

interface PlanUpdateDef {
  sections: SectionEdit[];
  fields: FieldEdit[];
}

const append = (sentence: string) => (current: string) => `${current.trimEnd()} ${sentence}`;

const PERSONAL_CARE_REWRITE = (_current: string) => `I can manage most of my washing at the sink, but I can't twist round to do my back, so whoever is helping me needs to do that bit. I need a hand getting in and out of the bath — it's getting up again that's the trouble — and I like a bath on a Sunday. In the shower I can stand at the rail and do most of it myself, but I'd like someone nearby in case I go dizzy, which has happened once or twice. I'd rather a man helped me with dressing.

Dressing is a struggle with my hands, especially when it's cold — shirt buttons are the worst, and I sometimes need help getting my arms into a jumper when my shoulder is stiff. I can brush my own teeth, but someone needs to open the toothpaste and put some on the brush. I use an electric razor but need someone to hold the mirror steady and switch it on. My legs, ankles and lower back get very dry, so I need cream put on after I've washed. I wear pads day and night since the operation and need help checking and changing them.

I've always looked after myself and I don't want to feel like people are taking over — I'd like to stay as involved as I can, even where I need a hand with the parts I can't manage.

I do get frustrated some days that I can't do what I used to, so please bear with me if I seem a bit short — it's not personal, I just miss being able to get on with things myself.

Good Practice Guidance for Staff
- Wash my back and put cream on my legs, ankles and lower back after washing; let me manage the rest myself.
- Help me in and out of the bath, and stay nearby in the shower in case I feel dizzy.
- Help with buttons, jumpers, the toothpaste and my electric razor.
- Check and change continence pads, day and night, discreetly.
- Male carer preferred for personal care.
- Explain what you're doing and let me help where I can, rather than just taking over.
- Be patient if I seem frustrated — it's the loss of independence, not the carer.`;

// Keyed `recording:<id>` / `file:<id of the file in customerFiles.ts>`.
const ARTHUR_UPDATES: Record<string, PlanUpdateDef> = {
  // 6-Week Review: confirmed the plan as it was, with one addition — weekly blood pressure checks (David, line 5).
  'recording:review6': {
    sections: [{
      sectionId: 'section-6',
      edit: append('Following a request from his GP, carers are to check and record his blood pressure weekly.'),
      sourceLines: [
        { index: 5, highlight: 'check his blood pressure readings weekly now' },
        { index: 6, highlight: "I'll add that in as an agreed task" },
      ],
    }],
    fields: [],
  },

  // Personal Care / Moving and Handling (Claire Doyle, 5 Sep 2026): a much fuller picture of personal care than the
  // initial assessment had, plus a family detail for his background, and a shoulder problem and continence needs
  // that belong under health.
  'recording:personal-care': {
    sections: [
      {
        // Profile and background: while explaining who used to help with his Sunday bath, Arthur mentions his
        // daughter has moved away to Leeds with her family (lines 6 and 8).
        sectionId: 'section-1',
        edit: append('His daughter used to help with his weekly bath when she visited, but has moved to Leeds with her family and is no longer close by; they are settling in well.'),
        sourceLines: [
          { index: 6, highlight: "she's moved up to Leeds now with the grandkids" },
          { index: 8, highlight: "they're settling in" },
        ],
      },
      {
        sectionId: 'section-2',
        edit: PERSONAL_CARE_REWRITE,
        sourceLines: [
          { index: 4, highlight: "I can't twist round to do it myself anymore" },
          { index: 8, highlight: 'I need help getting in and out of it' },
          { index: 10, highlight: 'someone just being nearby in case I go a bit dizzy' },
          { index: 14, highlight: "it's opening the toothpaste tube that does me in" },
          { index: 18, highlight: "I need someone to put the cream on there after I've washed" },
          { index: 20, highlight: 'I wear pads, day and night now' },
        ],
      },
      {
        sectionId: 'section-6',
        edit: append('Reports shoulder pain over the past few weeks, flagged to the team to be looked at. Wears continence pads day and night since his operation and needs help checking and changing them.'),
        sourceLines: [
          { index: 22, highlight: "my shoulder, I mentioned it for the jumper, that's been bad for a few weeks now" },
          { index: 20, highlight: 'I wear pads, day and night now' },
        ],
      },
    ],
    fields: [],
  },

  // Hospital Discharge Summary - Hip Fracture (5 Nov 2026). Newer than his GP medication list, so where the two
  // disagree it wins: it says co-codamol was stopped, which takes that out of what the GP list put in. Its smoking
  // status is "ex-smoker" where the falls assessment (newer still) says non-smoker, and its note on where the
  // RESPECT form is kept disagrees with the DNACPR itself — which is a legal document, so the DNACPR's answer stays.
  'file:ab-1': {
    sections: [
      { sectionId: 'section-1', edit: append('The discharge summary confirms a hip hemiarthroplasty was carried out after the fall, and that he was discharged home with a package of care.'),
        extract: { location: 'Page 1 — Procedure', text: 'Right hip hemiarthroplasty following a fall at home. Discharged home with a package of care.' } },
      { sectionId: 'section-5', edit: append('Hospital discharge summary (hip fracture): to mobilise with the walking frame, weight bearing as tolerated, with physiotherapy follow-up.'),
        extract: { location: 'Page 2 — Mobility and therapy', text: 'Mobilise with frame, weight bearing as tolerated. Physiotherapy follow-up arranged.' } },
      { sectionId: 'section-6',
        edit: append('Orthopaedic follow-up is due six weeks after discharge, and the district nurse is checking the wound. Co-codamol was stopped on discharge; pain relief is now paracetamol only.'),
        removes: { text: 'co-codamol PRN, ', fromKey: 'file:ab-5', reason: 'co-codamol was stopped on discharge and pain relief is now paracetamol only' },
        extract: { location: 'Page 3 — Medication on discharge', text: 'Co-codamol: STOPPED. Continue paracetamol 500mg PRN. Orthopaedic review at 6 weeks; district nurse to check wound.' } },
    ],
    fields: [
      { sectionId: 'personal-details', fieldId: 'smoker', value: 'Ex-smoker', extract: { location: 'Page 1 — Social history', text: 'Smoking: ex-smoker, stopped 2012.' } },
      { sectionId: 'personal-details', fieldId: 'dnar-location', value: 'Copy of the RESPECT form is on the fridge door',
        extract: { location: 'Page 4 — Advance care planning', text: 'RESPECT form: copy on fridge door, original with the GP.' } },
    ],
  },
  // Moving and Handling Risk Assessment. Its date is handwritten and can't be read with confidence, so where it
  // disagrees with another source (the OT report, on pets) Assessment Hero won't guess which is more recent.
  'file:ab-2': {
    sections: [{ sectionId: 'section-5', edit: append('Moving and handling risk assessment: one carer to supervise all transfers (bed, chair and toilet); no hoist or stand-aid needed; the walking frame is to be within reach at all times.'),
      extract: { location: 'Page 1 — Transfers', text: 'One carer to supervise all transfers (bed, chair, toilet). No hoist or stand-aid required. Frame within reach at all times.' } }],
    fields: [{ sectionId: 'personal-details', fieldId: 'pets', value: 'None', extract: { location: 'Page 3 — Home environment', text: 'Pets: none.' } }],
  },
  // Falls Risk Assessment (Initial), 12 Nov 2026 — newer than the discharge summary, so its "non-smoker" is the one suggested.
  'file:ab-3': {
    sections: [{ sectionId: 'section-5', edit: append('The initial falls risk assessment confirms a high risk: carers to check the frame, his footwear and the walkway are clear at every visit.'),
      extract: { location: 'Page 1 — Overall risk', text: 'Overall falls risk: HIGH. Check frame, footwear and walkway at every visit.' } }],
    fields: [{ sectionId: 'personal-details', fieldId: 'smoker', value: 'Non-smoker', extract: { location: 'Page 2 — Risk factors', text: 'Smoker: No.' } }],
  },
  // Occupational Therapy Report - Bed and Stair Rails (10 Nov 2026)
  'file:ab-4': {
    sections: [{ sectionId: 'section-5', edit: append('Occupational therapy report: a bed rail and a second stair rail have been fitted — carers to check they are secure before supporting transfers.'),
      extract: { location: 'Page 1 — Equipment fitted', text: 'Bed rail and second stair rail fitted. Carers to check security before supporting transfers.' } }],
    fields: [{ sectionId: 'personal-details', fieldId: 'pets', value: 'Cat(s)', extract: { location: 'Page 2 — Home visit findings', text: 'Cat in the home — ensure it is not underfoot on the stairs.' } }],
  },
  // GP Medication List - October 2026 (20 Oct 2026)
  'file:ab-5': {
    sections: [{ sectionId: 'section-6', edit: append('Current GP medication list (October 2026): amlodipine once daily, paracetamol 500mg PRN, co-codamol PRN, and E45 cream for dry skin.'),
      extract: { location: 'Page 1 — Repeat prescriptions', text: 'Amlodipine 5mg OD. Paracetamol 500mg PRN. Co-codamol 30/500 PRN. E45 cream.' } }],
    fields: [],
  },
  // DNACPR Form (Original Copy) — a legal document (20 Sep 2026); fills two Personal details fields that were never captured.
  'file:ab-10': {
    sections: [],
    fields: [
      { sectionId: 'personal-details', fieldId: 'dnar', value: 'Yes', extract: { location: 'Page 1 — Section A', text: 'DNACPR decision in place: CPR is not to be attempted.' } },
      { sectionId: 'personal-details', fieldId: 'dnar-location', value: 'Original form kept in the folder on the kitchen worktop',
        extract: { location: 'Page 2 — Where the form is kept', text: 'Original kept in the folder on the kitchen worktop.' } },
    ],
  },
  // Lasting Power of Attorney - Health and Welfare — a legal document (14 Aug 2026); changes who is recorded as a decision maker.
  'file:ab-11': {
    sections: [],
    fields: [{
      sectionId: 'personal-details',
      fieldId: 'next-of-kin',
      rows: [['David Barrington', 'Son', '07980 077250', 'Yes — Lasting Power of Attorney (Health and Welfare)']],
      extract: { location: 'Page 1 — Attorney', text: 'Attorney: David Barrington (son). Health and welfare decisions, effective if the donor lacks capacity.' },
    }],
  },
  // Everything else in his Files tab (service agreement, funding letter, key safe notes and photo) and the Initial
  // Assessment itself has nothing new for the plan, so has no entry: getPlanUpdate returns null.
};

/** What this source would change in the plan, or null if it has nothing new for it. */
export function getPlanUpdate(customerId: string, source: UpdateSource): PlanUpdateDef | null {
  if (customerId !== 'arthur-barrington') return null;
  if (source.type === 'recording') return ARTHUR_UPDATES[`recording:${source.id}`] ?? null;
  return ARTHUR_UPDATES[`file:${source.id}`] ?? null;
}

type Forms = Record<string, FormField[]>;
type Prose = Record<string, AssessmentSection>;

const toItemSource = (s: UpdateSource) => ({ type: s.type, id: s.id, label: s.type === 'file' ? s.name : s.label });
const toRef = (s: UpdateSource): SourceRef => toItemSource(s);
const keyOfSource = (s: Pick<SourceRef, 'type' | 'id'>) => `${s.type}:${s.id}`;

/** The date of a source itself, whether it's certain, and whether it's a legal document — what the merge rules turn on. */
export function getSourceMeta(customerId: string, source: UpdateSource): SourceMeta {
  if (source.type === 'recording') {
    const r = resolveRecording(customerId, source.id);
    return { date: r ? parseSourceDate(r.recordingMeta) : undefined };
  }
  const f = CUSTOMER_FILES[customerId]?.find(x => x.id === source.id);
  return { date: f?.documentDate, dateUncertain: f?.dateUncertain, legal: f?.legal };
}

/**
 * Applies a run of one or more sources: each affected section/field gets its new content, goes back to pending
 * review, and remembers what it was. Sources are applied oldest first, by the date of the source itself, so a newer
 * one gets the last word. A section several sources touch has their edits applied in turn (and a newer source can
 * take out something an older one put there, visibly). A field several sources set is resolved by the rules in
 * sourceMerge.ts: the newest wins and the disagreement is flagged, a legal document is kept, and where a date
 * can't be trusted nothing is picked. Anything that doesn't change is left alone, and `changed` counts only
 * what actually did.
 */
export function applyPlanUpdates(
  runs: { def: PlanUpdateDef; source: UpdateSource }[],
  forms: Forms,
  prose: Prose,
  ctx: { customerId: string },
): { forms: Forms; prose: Prose; changed: number } {
  const runId = `upd-${Date.now()}`;
  const ordered = sortOldestFirst(runs.map(r => ({ ...r, ref: toRef(r.source), ...getSourceMeta(ctx.customerId, r.source) })));

  /** The passage a source's edit came from: a file's authored extract, or the transcript line a recording's came from. */
  const extractFor = (run: (typeof ordered)[number], e: { extract?: FileExtract; sourceLines?: TranscriptReference[] }): SourceExtract | undefined => {
    const base = { source: run.ref, date: run.date, dateUncertain: run.dateUncertain };
    if (run.source.type === 'file') return e.extract ? { ...base, ...e.extract } : undefined;
    const first = e.sourceLines?.[0];
    const line = first ? resolveRecording(ctx.customerId, run.source.id)?.transcript[first.index] : undefined;
    return line ? { ...base, location: `Transcript, ${line.time}`, text: first?.highlight ?? line.text } : undefined;
  };

  /** The marker for an item changed by `contributors` — keeping any sources/extracts already behind an unpublished earlier update. */
  const markerFor = (
    earlier: ItemUpdate | undefined,
    contributors: (typeof ordered),
    lastRecording: UpdateSource | undefined,
    extracts: SourceExtract[],
    extra: Partial<ItemUpdate> = {},
  ) => {
    const uniq = <T,>(items: T[], key: (t: T) => string) => items.filter((t, i) => items.findIndex(o => key(o) === key(t)) === i);
    const sources = uniq([...(earlier?.sources ?? []), ...contributors.map(c => c.ref)], s => `${keyOfSource(s)}:${s.label}`);
    const last = contributors[contributors.length - 1];
    return {
      id: runId,
      sourceLabel: sources.map(s => s.label).join(', '),
      sourceKind: last.source.type,
      sourceId: last.source.id,
      recordingId: lastRecording?.id,
      sources,
      extracts: uniq([...(earlier?.extracts ?? []), ...extracts], x => `${keyOfSource(x.source)}:${x.text}`),
      ...extra,
    };
  };

  let changed = 0;
  const nextProse: Prose = { ...prose };
  for (const sectionId of new Set(ordered.flatMap(r => r.def.sections.map(e => e.sectionId)))) {
    const current = nextProse[sectionId];
    if (!current) continue;
    let text = current.text;
    const contributors: typeof ordered = [];
    const extracts: SourceExtract[] = [];
    let removal: Removal | undefined = current.update?.removal;
    let cited: { source: UpdateSource; lines?: TranscriptReference[] } | undefined;
    for (const run of ordered) {
      for (const e of run.def.sections.filter(x => x.sectionId === sectionId)) {
        let working = text;
        let removedHere: Removal | undefined;
        if (e.removes && working.includes(e.removes.text)) {
          const earlier = ordered.find(o => keyOfSource(o.ref) === e.removes!.fromKey);
          working = working.replace(e.removes.text, '');
          removedHere = {
            removed: e.removes.text.replace(/[,\s]+$/, ''),
            earlier: earlier?.ref, earlierDate: earlier?.date,
            because: run.ref, becauseDate: run.date,
            reason: e.removes.reason,
          };
        }
        const next = e.edit(working);
        if (next === text) continue;
        text = next;
        if (removedHere) removal = removedHere;
        contributors.push(run);
        const x = extractFor(run, e);
        if (x) extracts.push(x);
        if (run.source.type === 'recording') cited = { source: run.source, lines: e.sourceLines };
      }
    }
    if (contributors.length === 0) continue;
    nextProse[sectionId] = {
      ...current,
      text,
      reviewed: false,
      sourceLines: cited?.lines,
      update: {
        ...markerFor(current.update, contributors, cited?.source, extracts, { removal }),
        // A second update before the first is published keeps the ORIGINAL as the thing to discard back to.
        previous: current.update?.previous ?? { text: current.text, reviewed: current.reviewed, sourceLines: current.sourceLines },
      },
    };
    changed++;
  }

  const nextForms: Forms = { ...forms };
  for (const [sectionId, fields] of Object.entries(forms)) {
    nextForms[sectionId] = fields.map(f => {
      const contributors: typeof ordered = [];
      const candidates: ConflictValue[] = [];
      const extracts: SourceExtract[] = [];
      let cited: { source: UpdateSource; lines?: TranscriptReference[] } | undefined;
      for (const run of ordered) {
        for (const e of run.def.fields.filter(x => x.sectionId === sectionId && x.fieldId === f.id)) {
          contributors.push(run);
          candidates.push({
            ...run.ref, date: run.date, dateUncertain: run.dateUncertain, legal: run.legal,
            value: e.value, rows: e.rows,
            text: e.rows ? (e.rows.map(r => r.join(' · ')).join('; ') || 'No entries') : (e.value ?? ''),
          });
          const x = extractFor(run, e);
          if (x) extracts.push(x);
          if (run.source.type === 'recording') cited = { source: run.source, lines: e.sourceLines };
        }
      }
      if (contributors.length === 0) return f;
      changed++;
      const { chosen, conflict } = resolveCandidates(candidates);
      // With no pick (undated sources that disagree) the existing value stays until the reviewer chooses.
      const keep = conflict?.resolution === 'undated';
      return {
        ...f,
        value: keep ? f.value : chosen?.value ?? f.value,
        rows: keep ? f.rows : chosen?.rows ?? f.rows,
        reviewed: false,
        reviewedBy: undefined,
        reviewedAt: undefined,
        sourceLines: cited?.lines,
        update: {
          ...markerFor(f.update, contributors, cited?.source, extracts, { conflict }),
          previous: f.update?.previous ?? { value: f.value, rows: f.rows, reviewed: f.reviewed, reviewedBy: f.reviewedBy, reviewedAt: f.reviewedAt, sourceLines: f.sourceLines },
        },
      };
    });
  }

  return { forms: nextForms, prose: nextProse, changed };
}

/** Discard draft: every changed item goes back to exactly what it was before the update, accepted or not. */
export function discardPlanUpdate(forms: Forms, prose: Prose): { forms: Forms; prose: Prose } {
  const nextProse: Prose = {};
  for (const [id, section] of Object.entries(prose)) nextProse[id] = revertSectionUpdate(section);
  const nextForms: Forms = {};
  for (const [id, fields] of Object.entries(forms)) nextForms[id] = fields.map(revertFieldUpdate);
  return { forms: nextForms, prose: nextProse };
}

/** Publish: the changes are now part of the finished document — no more draft markers, no review controls. */
export function publishPlanUpdate(forms: Forms, prose: Prose): { forms: Forms; prose: Prose } {
  const nextProse: Prose = {};
  for (const [id, s] of Object.entries(prose)) {
    nextProse[id] = s.update ? { ...s, reviewed: undefined, sourceLines: undefined, update: undefined } : s;
  }
  const nextForms: Forms = {};
  for (const [id, fields] of Object.entries(forms)) {
    nextForms[id] = fields.map(f => f.update
      ? { ...f, reviewed: true, reviewedBy: undefined, reviewedAt: undefined, sourceLines: undefined, update: undefined }
      : f);
  }
  return { forms: nextForms, prose: nextProse };
}

const sourceKey = (s: UpdateSource) => `${s.type}:${s.id}:${s.type === 'file' ? s.name : s.label}`;

/** Every distinct recording/file the draft in progress was made from (several if one run used many, or it was updated twice before publishing). */
export function getUpdateSources(forms: Forms, prose: Prose): UpdateSource[] {
  const seen = new Map<string, UpdateSource>();
  for (const { update } of [...Object.values(prose), ...Object.values(forms).flat()]) {
    if (!update) continue;
    const behind = update.sources ?? [{ type: update.sourceKind, id: update.sourceId ?? update.recordingId ?? '', label: update.sourceLabel }];
    for (const b of behind) {
      const s: UpdateSource = b.type === 'recording' ? { type: 'recording', id: b.id, label: b.label } : { type: 'file', id: b.id, name: b.label };
      seen.set(sourceKey(s), s);
    }
  }
  return [...seen.values()];
}

// What each customer's published plan has been drafted from — kept here, not in the page's state, so it survives
// leaving the page and coming back (the plan's content itself lives in CareBridgeContext and does too).
const publishedSources = new Map<string, UpdateSource[]>();

export function getPublishedSources(customerId: string): UpdateSource[] {
  return publishedSources.get(customerId) ?? [];
}

/** Adds the sources behind a just-published update to the plan's "drafted from" list, without duplicates. */
export function recordPublishedSources(customerId: string, sources: UpdateSource[]): UpdateSource[] {
  const merged = new Map<string, UpdateSource>();
  for (const s of [...getPublishedSources(customerId), ...sources]) merged.set(sourceKey(s), s);
  const next = [...merged.values()];
  publishedSources.set(customerId, next);
  return next;
}

/** The source behind a draft that's in progress, and how many sections/fields it changed, read off the items themselves. */
export function getUpdateInfo(forms: Forms, prose: Prose): { update: ItemUpdate; changed: number } | null {
  const items = [...Object.values(prose), ...Object.values(forms).flat()].filter(i => i.update);
  if (items.length === 0) return null;
  return { update: items[items.length - 1].update!, changed: items.length };
}
