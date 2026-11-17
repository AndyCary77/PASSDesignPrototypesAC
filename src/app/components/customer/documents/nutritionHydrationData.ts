import { resolveRecording, type FormField, type ItemUpdate } from '../CareBridgePage';
import type { UpdateSource } from './UpdateDocumentBanner';
import { getSourceMeta } from './carePlanUpdate';
import { resolveCandidates, sortOldestFirst, type ConflictValue, type SourceExtract, type SourceRef } from './sourceMerge';

// "Nutrition and Hydration Assessment" — Vera Bramwell's incomplete assessment, the scenario for filling a blank
// document from a recording OR a file. It starts with every field empty; picking a source drafts in only the answers
// that source actually contains, each awaiting review. Fields
// the file has nothing on stay blank — honest gaps, same as every other drafted document in this app — so the
// reviewer can see what is still outstanding.
//
// The content is consistent with Vera's story (a fall and fractured hip, arthritis, lives alone, son Paul) and
// with her real filenames in customerFiles.ts: the MUST screening form is the main source, the home-visit notes
// and the district nurse's handover each add a little.

const text = (id: string, label: string, extra: Partial<FormField> = {}): FormField => ({ id, label, type: 'text', ...extra });

export const NUTRITION_BLANK_FIELDS: FormField[] = [
  // Malnutrition screening (MUST)
  text('height', 'Height'),
  text('weight', 'Current weight'),
  text('bmi', 'BMI and BMI score'),
  text('weight-loss', 'Unplanned weight loss in the past 3-6 months'),
  text('acute-illness', 'Acute disease effect'),
  {
    id: 'must-risk', label: 'Overall risk of malnutrition (MUST)', type: 'select',
    options: ['Low risk', 'Medium risk', 'High risk'],
  },
  text('must-action', 'Care required based on the MUST score'),

  // Eating and drinking
  text('appetite', 'Appetite'),
  text('allergies', 'Food allergies, intolerances and special diets'),
  text('preferences', 'Food and drink likes and dislikes'),
  text('oral-health', 'Oral health, teeth and dentures'),
  text('swallowing', 'Swallowing and choking risk'),
  text('meal-prep', 'Support with shopping, preparing meals and eating'),
  text('fluids', 'Fluid intake'),
  text('aids', 'Aids and equipment for eating and drinking'),
  { id: 'meals-plan', label: 'Meals and drinks plan', type: 'table', columns: ['Time', 'Meal or drink', 'Support needed'] },

  // Risks, and what matters beyond the food
  { id: 'risks', label: 'Risks and control measures', type: 'table', columns: ['Risk', 'Control measures'] },
  text('cultural', 'Cultural, religious or personal needs around food'),
];

export interface NutritionGroup {
  heading?: string;
  subheading?: string;
  fieldIds: string[];
}

export const NUTRITION_GROUPS: NutritionGroup[] = [
  { subheading: 'Nutrition and hydration needs assessment for Vera', fieldIds: [] },
  {
    heading: 'Malnutrition screening (MUST)',
    fieldIds: ['height', 'weight', 'bmi', 'weight-loss', 'acute-illness', 'must-risk', 'must-action'],
  },
  {
    heading: 'Eating and drinking',
    fieldIds: ['appetite', 'allergies', 'preferences', 'oral-health', 'swallowing', 'meal-prep', 'fluids', 'aids', 'meals-plan'],
  },
  { heading: 'Risks and control measures', fieldIds: ['risks'] },
  { heading: 'Other needs', fieldIds: ['cultural'] },
];

/** What a source file contributes: new values for the fields it has an answer for, and nothing for the rest. */
export type FillPatch = Record<string, Pick<FormField, 'value' | 'rows' | 'sourceLines'>>;

/** Where in each file an answer came from — what Check source shows. Keyed `file:<id>` then by field id. */
const FILE_EXTRACTS: Record<string, Record<string, { location: string; text: string }>> = {
  'file:vb-2': {
    height: { location: 'Step 1', text: 'Height: 1.57 m.' },
    weight: { location: 'Step 1', text: 'Weight: 49.8 kg (16/11/2026).' },
    bmi: { location: 'Step 1', text: 'BMI 20.2 kg/m² — score 0.' },
    'weight-loss': { location: 'Step 2', text: 'Unplanned weight loss in the last 3–6 months: 4.1 kg (7.6%) — score 1.' },
    'acute-illness': { location: 'Step 3', text: 'Acute disease effect: no. Score 0.' },
    'must-risk': { location: 'Step 4', text: 'Overall risk of malnutrition: MEDIUM (total score 1).' },
    'must-action': { location: 'Step 5', text: 'Medium risk: observe — record 3-day intake; refer to GP if intake does not improve; rescreen in 1 month.' },
    appetite: { location: 'Notes', text: 'Small appetite, smallest in the evening. Eats more at lunchtime when someone sits with her.' },
    fluids: { location: 'Notes', text: 'Fluid intake approx. 800 ml/day (target about 1,500 ml). Forgets to drink unless prompted.' },
  },
  'file:vb-1': {
    allergies: { location: 'Section 3 — Food and drink', text: 'Allergies/intolerances: none known. Special diet: none.' },
    preferences: { location: 'Section 3 — Food and drink', text: 'Likes porridge, soup, fish fingers with mash, tinned peaches; tea with one sugar. Dislikes spicy food and cold sandwiches.' },
    'meal-prep': { location: 'Section 4 — Meals', text: 'Cannot cook safely (arthritis, hip) or carry a hot plate. Carers prepare breakfast and heat lunch. Paul brings her evening meal Wednesdays and Sundays.' },
    'meals-plan': { location: 'Section 4 — Meals', text: 'Breakfast 8:00 — porridge and tea. Lunch 12:30 — heated meal, food cut up. Evening 5:30 — light meal. Drink left within reach at every visit.' },
  },
  'file:vb-3': {
    risks: { location: 'Page 1 — Risks', text: 'Poor food and fluid intake could slow healing of the heel pressure area. Fortified food and drinks at every visit; tell the district nurse if she eats very little for 2 days.' },
  },
};

const FILL_FROM_FILE: Record<string, FillPatch> = {
  // Nutrition and Hydration Screening (MUST).docx — the main source: the screening scores and her intake.
  'file:vb-2': {
    height: { value: '1.57 m' },
    weight: { value: '49.8 kg, weighed at the home visit on 16 November 2026.' },
    bmi: { value: '20.2 kg/m². BMI score 0.' },
    'weight-loss': { value: 'Vera has lost 4.1 kg in the last 3 months, from 53.9 kg to 49.8 kg (about 7.6%). Weight loss score 1.' },
    'acute-illness': { value: 'Vera is not acutely ill, and there has been no period of little or no food and drink. Score 0.' },
    'must-risk': { value: 'Medium risk' },
    'must-action': { value: 'Total MUST score 1: medium risk. Record what Vera eats and drinks for 3 days. If her intake does not improve, refer to her GP. Screen again in a month.' },
    appetite: { value: 'Vera has a small appetite, which is smallest in the evening. She eats more at lunchtime when someone sits with her.' },
    fluids: { value: 'Vera drinks about 800 ml a day, against a target of around 1,500 ml. She forgets to drink unless she is prompted.' },
  },
  // Initial Assessment Notes - Home Visit.docx — how she eats day to day.
  'file:vb-1': {
    allergies: { value: 'Vera has no known food allergies or intolerances and is not on a special diet.' },
    preferences: { value: 'Vera likes porridge, soup, fish fingers with mash and tinned peaches, and tea with one sugar. She does not like spicy food or cold sandwiches.' },
    'meal-prep': { value: 'Vera can no longer cook safely because of her arthritis and her hip, and cannot carry a hot plate. Carers prepare her breakfast and heat a lunchtime meal. Her son Paul brings her evening meal on Wednesdays and Sundays.' },
    'meals-plan': {
      rows: [
        ['8:00 am', 'Breakfast', 'Carer prepares porridge and a cup of tea, and sits with Vera while she eats'],
        ['12:30 pm', 'Lunch', 'Carer heats a prepared meal and cuts the food up for her'],
        ['5:30 pm', 'Evening meal', 'Carer prepares a light meal, except on Wednesdays and Sundays when Paul visits'],
        ['Throughout the day', 'Drinks', 'Carer leaves a drink within reach at the end of every visit'],
      ],
    },
  },
  // District Nurse Handover - Pressure Care.pdf — one risk that eating and drinking feed into.
  'file:vb-3': {
    risks: {
      rows: [[
        "Poor food and fluid intake could slow the healing of the pressure area on Vera's heel",
        'Offer fortified food and snacks and encourage drinks at every visit. Tell the district nurse if Vera eats very little for 2 days.',
      ]],
    },
  },
  // Everything else in her Files tab (GP letter, capacity assessment, consent form, referral, contacts) has nothing
  // on nutrition and hydration, so has no entry: getNutritionFill returns null.
};

// Her Initial Assessment recording (4 Aug) is the one place she and Paul talk about meals and drinks. sourceLines index
// into that recording's transcript, so Check transcript points at the exact words.
const FILL_FROM_RECORDING: Record<string, FillPatch> = {
  initial: {
    appetite: {
      value: 'Vera has been eating mostly biscuits and not much else. She sometimes forgets whether she has eaten.',
      sourceLines: [
        { index: 8, highlight: "sometimes forgets whether she's eaten" },
        { index: 11, highlight: "I've been having biscuits and not much else" },
      ],
    },
    'meal-prep': {
      value: "Vera cannot stand long enough to cook since her fall. Her son Paul would like a carer to make her a proper breakfast and lunch. Paul does her evening meals when he finishes work.",
      sourceLines: [
        { index: 11, highlight: "I can't stand long enough to cook now" },
        { index: 12, highlight: 'make her a proper breakfast and lunch and leave a drink out. I do the evenings when I finish work.' },
      ],
    },
    fluids: {
      value: 'Vera does not drink enough because she forgets. A carer should leave a drink within her reach.',
      sourceLines: [
        { index: 11, highlight: "I don't drink enough, I forget" },
        { index: 12, highlight: 'leave a drink out' },
      ],
    },
    'meals-plan': {
      rows: [
        ['Morning', 'Breakfast', 'Carer makes a proper breakfast'],
        ['Lunchtime', 'Lunch', 'Carer makes a proper lunch'],
        ['Evening', 'Evening meal', 'Paul (son) prepares it when he finishes work'],
        ['Each visit', 'Drinks', 'Carer leaves a drink out within reach'],
      ],
      sourceLines: [{ index: 12, highlight: 'make her a proper breakfast and lunch and leave a drink out. I do the evenings when I finish work.' }],
    },
  },
  // The WiitM follow-up and the 4-week review have nothing on food and drink, so have no entry.
};

/** What this recording or file would fill in, or null if it has nothing on nutrition and hydration. */
export function getNutritionFill(source: UpdateSource): FillPatch | null {
  if (source.type === 'recording') return FILL_FROM_RECORDING[source.id] ?? null;
  return FILL_FROM_FILE[`file:${source.id}`] ?? null;
}

const toRef = (s: UpdateSource): SourceRef => ({ type: s.type, id: s.id, label: s.type === 'file' ? s.name : s.label });
const keyOf = (r: Pick<SourceRef, 'type' | 'id'>) => `${r.type}:${r.id}`;

/**
 * Applies a fill from one or more sources: each field any of them has an answer for is drafted in and goes to pending
 * review, remembering what it was (blank) so it can be discarded on its own. Where sources give different answers
 * for a field the rules in sourceMerge.ts decide — the newest source by its own date wins and the disagreement is
 * flagged, a legal document is kept, and where a date can't be trusted nothing is picked until the reviewer chooses.
 * Returns how many fields got an answer.
 */
export function applyNutritionFill(
  fields: FormField[],
  found: { source: UpdateSource; patch: FillPatch }[],
  customerId: string,
): { fields: FormField[]; filled: number } {
  const runId = `fill-${Date.now()}`;
  const ordered = sortOldestFirst(found.map(f => ({ ...f, ref: toRef(f.source), ...getSourceMeta(customerId, f.source) })));

  let filled = 0;
  const next = fields.map(f => {
    const candidates: ConflictValue[] = [];
    const extracts: SourceExtract[] = [];
    for (const run of ordered) {
      const answer = run.patch[f.id];
      if (!answer) continue;
      candidates.push({
        ...run.ref, date: run.date, dateUncertain: run.dateUncertain, legal: run.legal,
        value: answer.value, rows: answer.rows,
        text: answer.rows ? answer.rows.map(r => r.join(' · ')).join('; ') : (answer.value ?? ''),
      });
      const base = { source: run.ref, date: run.date, dateUncertain: run.dateUncertain };
      if (run.source.type === 'file') {
        const x = FILE_EXTRACTS[keyOf(run.ref)]?.[f.id];
        if (x) extracts.push({ ...base, ...x });
      } else {
        const first = answer.sourceLines?.[0];
        const line = first ? resolveRecording(customerId, run.source.id)?.transcript[first.index] : undefined;
        if (line) extracts.push({ ...base, location: `Transcript, ${line.time}`, text: first?.highlight ?? line.text });
      }
    }
    if (candidates.length === 0) return f;
    filled++;

    const { chosen, conflict } = resolveCandidates(candidates);
    const keep = conflict?.resolution === 'undated';
    const chosenRun = chosen && ordered.find(o => keyOf(o.ref) === keyOf(chosen));
    const sources = candidates.map(({ type, id, label }) => ({ type, id, label })).filter((s, i, all) => all.findIndex(o => keyOf(o) === keyOf(s)) === i);
    const update: ItemUpdate = {
      id: runId,
      sourceLabel: sources.map(s => s.label).join(', '),
      sourceKind: candidates[candidates.length - 1].type,
      sourceId: candidates[candidates.length - 1].id,
      recordingId: chosenRun?.source.type === 'recording' ? chosenRun.source.id : undefined,
      sources, extracts, conflict, fill: true,
      previous: { value: f.value, rows: f.rows, reviewed: f.reviewed },
    };
    return {
      ...f,
      value: keep ? f.value : chosen?.value ?? f.value,
      rows: keep ? f.rows : chosen?.rows ?? f.rows,
      reviewed: false,
      sourceLines: chosenRun?.source.type === 'recording' ? chosenRun.patch[f.id].sourceLines : undefined,
      update,
    };
  });
  return { fields: next, filled };
}

/** The same steps as the update's "thinking time", worded for filling in a blank document. */
export function getFillSteps(sources: { type: 'recording' | 'file' }[]): { label: string; ms: number }[] {
  return [
    { label: sources.length > 1 ? 'Reading the sources' : `Reading the ${sources[0]?.type ?? 'source'}`, ms: 1300 },
    { label: 'Finding the answers', ms: 2000 },
    { label: 'Filling in the document', ms: 1500 },
  ];
}
