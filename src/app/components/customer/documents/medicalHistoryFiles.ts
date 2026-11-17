import { CUSTOMER_FILES } from '../../../data/customerFiles';
import { getSourceProblem, type FileProblem, type UpdateSource } from './UpdateDocumentBanner';
import { getSourceMeta } from './carePlanUpdate';
import { sortOldestFirst, type SourceExtract, type SourceRef } from './sourceMerge';

// "Draft Medical History from a file" (AIOP-24513). Like the rest of the prototype, nothing is really read: what each
// file "contains" is authored below, for Arthur Barrington only, and grounded in what each file in his Files tab is.
// A finding either becomes a new drafted entry, or — if the Medical History already has that condition — is recognised
// as already recorded and not added again, so the same thing is never drafted twice.

export interface MedicalFinding {
  /** Matches an existing entry's id when the condition is already on the record. */
  id: string;
  name: string;
  notes: string;
  dateOfDiagnosis: string;
  extract: { location: string; text: string };
}

const FINDINGS: Record<string, MedicalFinding[]> = {
  // Hospital Discharge Summary - Hip Fracture (5 Nov 2026): the fracture is already on his record; the operation is new.
  'file:ab-1': [
    {
      id: 'hip-fracture', name: 'Fractured Hip', dateOfDiagnosis: 'August 2025',
      notes: 'Fractured hip following a fall at home.',
      extract: { location: 'Page 1 — Diagnosis', text: 'Fractured neck of femur following a fall at home.' },
    },
    {
      id: 'hip-hemiarthroplasty', name: 'Hip hemiarthroplasty', dateOfDiagnosis: 'November 2026',
      notes: 'I had a right hip hemiarthroplasty (a partial hip replacement) after the fall, and was discharged home with a package of care. I have physiotherapy follow-up and an orthopaedic review six weeks after discharge, and the district nurse is checking the wound.',
      extract: { location: 'Page 1 — Procedure', text: 'Right hip hemiarthroplasty carried out. Discharged home with a package of care. Orthopaedic review at 6 weeks.' },
    },
  ],
  // GP Medication List - October 2026 (20 Oct 2026): his blood pressure tablet is already tied to a recorded condition.
  'file:ab-5': [
    {
      id: 'hypertension', name: 'Essential Hypertension', dateOfDiagnosis: 'November 2010',
      notes: 'High blood pressure, managed with amlodipine.',
      extract: { location: 'Page 1 — Repeat prescriptions', text: 'Amlodipine 5mg once daily — hypertension.' },
    },
  ],
  // The falls assessment, OT report, moving and handling assessment, DNACPR and LPA name no diagnosis that isn't
  // already covered, so have no entry: they find nothing for Medical History.
};

export interface DraftedEntry extends MedicalFinding {
  sources: SourceRef[];
  extracts: SourceExtract[];
}

export interface MedicalHistoryDraft {
  added: DraftedEntry[];
  /** Conditions a source mentioned that are already on the record, so were not added again. */
  alreadyRecorded: { name: string; source: SourceRef }[];
  problems: FileProblem[];
}

const toRef = (s: UpdateSource): SourceRef => ({ type: s.type, id: s.id, label: s.type === 'file' ? s.name : s.label });

/**
 * What these sources would add to the Medical History: new entries, each citing where in which file it came from; the
 * conditions already on the record are listed rather than repeated; files that can't be read are named.
 */
export function draftMedicalHistory(customerId: string, sources: UpdateSource[], existingIds: string[]): MedicalHistoryDraft {
  const problems = sources.flatMap(s => getSourceProblem(customerId, s) ?? []);
  const readable = sources.filter(s => !getSourceProblem(customerId, s));
  const ordered = sortOldestFirst(readable.map(source => ({ source, ...getSourceMeta(customerId, source) })));

  const added = new Map<string, DraftedEntry>();
  const alreadyRecorded: MedicalHistoryDraft['alreadyRecorded'] = [];
  for (const { source, date, dateUncertain } of ordered) {
    if (customerId !== 'arthur-barrington' || source.type !== 'file') continue; // authored for Arthur's files only
    for (const f of FINDINGS[`file:${source.id}`] ?? []) {
      const ref = toRef(source);
      const extract: SourceExtract = { source: ref, date, dateUncertain, ...f.extract };
      if (existingIds.includes(f.id)) {
        if (!alreadyRecorded.some(a => a.name === f.name)) alreadyRecorded.push({ name: f.name, source: ref });
      } else if (added.has(f.id)) {
        const e = added.get(f.id)!;
        added.set(f.id, { ...e, sources: [...e.sources, ref], extracts: [...e.extracts, extract] });
      } else {
        added.set(f.id, { ...f, sources: [ref], extracts: [extract] });
      }
    }
  }
  return { added: [...added.values()], alreadyRecorded, problems };
}

/** A file the Medical History can draft from, by its id — used by ?demo= links. */
export const fileSourceFor = (customerId: string, fileId: string): UpdateSource | undefined => {
  const f = CUSTOMER_FILES[customerId]?.find(x => x.id === fileId);
  return f ? { type: 'file', id: f.id, name: `${f.name}.${f.extension}` } : undefined;
};
