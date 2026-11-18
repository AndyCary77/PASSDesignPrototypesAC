import { resolveRecording } from '../CareBridgePage';
import type { PickerSeed, UpdateSource } from './UpdateDocumentBanner';

// Deep links into the AIOP-24513 prototype. Most of its states take several steps to reach (pick files, wait for the
// run, accept fields…), so a link can carry `?demo=<name>` and the page puts itself in that state on load — which
// is what the Jira acceptance criteria point engineers at. `&section=<id>` opens the plan on a particular section.
//
//   Arthur's plan   /customers/arthur-barrington/documents/care-plan?demo=<name>
//   Vera's form     /customers/vera-bramwell/documents/nutrition?demo=<name>
//   Vera's personal care  /customers/vera-bramwell/documents/personal-care?demo=<name>
//
// Each state is built the way the real flow would build it (same engine, same review UI), just without the clicks.
// A link applies once, on load, to the page's fresh state — open it in a new tab rather than after other changes.

export interface Demo {
  /** Open the source picker already showing this. */
  picker?: PickerSeed;
  /** Run an update/fill from these sources on load: `file:<id>` or `recording:<id>`. */
  sources?: string[];
  /** 'published': accept everything and publish. 'deleted': as published, then delete `deleteFile` from the Files tab. */
  end?: 'published' | 'deleted';
  deleteFile?: string;
}

export const CARE_PLAN_DEMOS: Record<string, Demo> = {
  // Source picker: Recording / File tabs with counts, folders, an unsupported file greyed out, no upload button.
  picker: { picker: { open: true, kind: 'file', recordingIds: ['review6'], fileIds: ['ab-1', 'ab-4'], scrollToUnsupported: true } },
  // A draft from one file: amber fields, Check source, per-field Accept / Discard, Discard draft, Publish.
  draft: { sources: ['file:ab-1'] },
  // Sources that disagree: newest wins (Smoker), undated (Pets), legal document kept (DNAR location). Section 6 has the removal.
  conflicts: { sources: ['file:ab-1', 'file:ab-2', 'file:ab-3', 'file:ab-4', 'file:ab-5', 'file:ab-10'] },
  // Files that can't be read — scanned, password-protected, damaged — alongside one that can.
  failures: { sources: ['file:ab-1', 'file:ab-8', 'file:ab-9', 'file:ab-6'] },
  // After publishing: the persistent banner names the file it was drafted from.
  published: { sources: ['file:ab-10'], end: 'published' },
  // The same, after that file has been deleted from the Files tab: "File no longer available".
  deleted: { sources: ['file:ab-10'], end: 'deleted', deleteFile: 'ab-10' },
};

export const NUTRITION_DEMOS: Record<string, Demo> = {
  picker: { picker: { open: true, kind: 'file', recordingIds: ['initial'], fileIds: ['vb-1', 'vb-2'], scrollToUnsupported: true } },
  // Her Initial Assessment recording and three files: four fields where the newer file's answer wins over the recording's.
  conflicts: { sources: ['recording:initial', 'file:vb-1', 'file:vb-2', 'file:vb-3'] },
  failures: { sources: ['file:vb-2', 'file:vb-6', 'file:vb-7'] },
};

export const PERSONAL_CARE_DEMOS: Record<string, Demo> = {
  // Her Personal Care / Moving and Handling visit already drafted in: the new items (products, risks, equipment) are on the form.
  draft: { sources: ['recording:personal-care-visit'] },
  // The source picker open with the recording ticked, ready to run.
  picker: { picker: { open: true, kind: 'recording', recordingIds: ['personal-care-visit'], fileIds: [] } },
};

export const MEDICAL_HISTORY_DEMOS: Record<string, Demo> = {
  // Medical History drafted from two files: one new entry (Hip hemiarthroplasty); two conditions already on the record are not repeated.
  files: { sources: ['file:ab-1', 'file:ab-5'] },
  // The same, with a scanned file and a password-protected one chosen too.
  failures: { sources: ['file:ab-1', 'file:ab-5', 'file:ab-8', 'file:ab-9'] },
};

/** `file:ab-1` / `recording:review6` -> the source the pages work with, or undefined if it doesn't exist for this customer. */
export function demoSource(customerId: string, key: string, filesById: (id: string) => { name: string; extension: string } | undefined): UpdateSource | undefined {
  const [type, id] = key.split(':');
  if (type === 'recording') {
    const r = resolveRecording(customerId, id);
    return r ? { type: 'recording', id, label: r.label } : undefined;
  }
  const f = filesById(id);
  return f ? { type: 'file', id, name: `${f.name}.${f.extension}` } : undefined;
}
