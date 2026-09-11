import { veraise, veraText } from '../../../data/vera-from-edith';

export type TaskCategory = 'General' | 'Nutrition' | 'Medications' | 'Hydration' | 'Outcome Tracking' | 'Observations';

export interface MedicationDetails {
  supportRequired?: string;
  dosage?: string;
  form?: string;
  route?: string;
  controlCategory?: string;
  location?: string;
  prn?: boolean;
}

/**
 * Review state for records CareBridge drafted from a recording. Deliberately
 * mirrors AssessmentSection.reviewed / FormField.reviewed in CareBridgePage:
 *   undefined — human-authored record, nothing to review (all of Arthur's)
 *   false     — drafted by CareBridge, still pending a reviewer's acceptance
 *   true      — a reviewer has accepted it
 */
interface DraftReviewState {
  reviewed?: boolean;
  /** Which recording it was drafted from, e.g. "Initial Assessment, 7 Jul 2026". Shown on the pending card so a reviewer knows what they're being asked to trust. */
  draftSource?: string;
}

export interface CareTask extends DraftReviewState {
  id: string;
  title: string;
  category: TaskCategory;
  description: string;
  startDate: string;
  outcomeIds: string[];
  visitIds: string[];
  status: 'active' | 'inactive';
  medicationDetails?: MedicationDetails;
}

export interface Outcome extends DraftReviewState {
  id: string;
  title: string;
  type: 'template' | 'custom';
  whatICanDo: string;
  aims: string;
  taskIds: string[];
  visitIds: string[];
  status: 'active' | 'inactive';
}

export interface CareVisit {
  id: string;
  title: string;
  visitType: string;
  numEmployees: number;
  startDate: string;
  startTime: string;
  endTime: string;
  duration: string;
  cadence: string;
  weeks: { activeDays: number[] }[];
  outcomeIds: string[];
  taskIds: string[];
  status: 'active' | 'inactive';
}

export const TASK_CATEGORIES: TaskCategory[] = [
  'General', 'Medications', 'Nutrition', 'Hydration', 'Outcome Tracking', 'Observations',
];

// Arthur's outcomes/tasks are deliberately plain here (no reviewed/
// draftSource at all) — 2026-09-11's change of direction moved Care
// Management's "drafted with Assessment Hero" story from citing a
// recording per item to citing his completed assessment documents at the
// plan level instead (see draftSourceDocuments in
// CareManagementContext.tsx, seeded for him specifically, and
// CarePlanDraftBanner's document-sourced branch in shared.tsx) — a plan's
// worth of outcomes/tasks doesn't need every individual record to carry
// its own citation for that framing to work, the same way Vera's
// document-drafted plan below never needed per-item draftSource either.
export const TASKS: CareTask[] = [
  {
    id: 't10', title: 'Hydromol Ointment', category: 'Medications',
    description: 'Apply to both lower legs twice a day. This ointment is used as a moisturiser. Common side effects may include temporary skin irritation — stop use and report to the office if redness or swelling occurs.',
    startDate: '20/03/2026', outcomeIds: ['o5'], visitIds: ['v1', 'v2'], status: 'active',
    medicationDetails: {
      form: 'Ointment',
      route: 'Cutaneous',
      dosage: 'Apply a small amount to both lower legs',
      controlCategory: 'N/A',
      location: 'Bathroom',
      supportRequired: 'Administer',
      prn: false,
    },
  },
  {
    id: 't6', title: 'Lunch', category: 'Nutrition',
    description: 'Please make me some lunch. I will let you know what I would like to eat.',
    startDate: '11/03/2026', outcomeIds: ['o2'], visitIds: ['v2'], status: 'active',
  },
  {
    id: 't9', title: 'Snack Plate', category: 'Nutrition',
    description: 'Please ask me if I would like a snack plate left out for me and what I would like.',
    startDate: '11/03/2026', outcomeIds: ['o1'], visitIds: ['v2'], status: 'active',
  },
  {
    id: 't1', title: 'Companionship', category: 'General',
    description: 'I would like my carer to sit and have a chat with me if I do not want to go for a walk or shopping',
    startDate: '21/11/2025', outcomeIds: ['o3', 'o4'], visitIds: ['v1', 'v2'], status: 'active',
  },
  {
    id: 't2', title: 'Dishes', category: 'General',
    description: "I'd like my carer to wash any dishes that are there.",
    startDate: '11/03/2026', outcomeIds: ['o1', 'o4'], visitIds: ['v2'], status: 'active',
  },
  {
    id: 't3', title: 'Evidence I have eaten', category: 'General',
    description: 'Please look for evidence I have eaten and document in the notes.',
    startDate: '11/03/2026', outcomeIds: ['o2', 'o3', 'o4'], visitIds: ['v1'], status: 'active',
  },
  {
    id: 't4', title: 'Fridge Dates', category: 'General',
    description: 'Please check my fridge for food that is out of date. Please dispose of the out of date food',
    startDate: '25/11/2025', outcomeIds: ['o3', 'o4'], visitIds: ['v1', 'v2'], status: 'active',
  },
  {
    id: 't5', title: 'Ironing', category: 'General',
    description: 'Please see if there is any ironing that needs to be done. I will say no but please insist',
    startDate: '21/11/2025', outcomeIds: ['o4'], visitIds: ['v1'], status: 'active',
  },
  {
    id: 't7', title: 'Lunchtime', category: 'General',
    description: 'Please plan with me what I am going to have my my lunch. Remind me if I have already got a ready meal out of the freezer that I do not need to get another one out',
    startDate: '11/03/2026', outcomeIds: ['o2', 'o3', 'o4'], visitIds: ['v1'], status: 'active',
  },
  {
    id: 't8', title: 'Please ask me if I have taken my medication', category: 'General',
    description: 'Please ask me if I have taken my medication and document my response. Bluebird care are not responsible for my medication. Family will check the care notes',
    startDate: '25/11/2025', outcomeIds: ['o3', 'o4'], visitIds: ['v1'], status: 'active',
  },
];

export const OUTCOMES: Outcome[] = [
  {
    id: 'o1',
    title: 'Continence & Dignity Support & Assistance',
    type: 'template',
    whatICanDo: 'Please assist with trips to the bathroom / commode, allow alone time if required and requested, ensuring that dignity and privacy are respected always. Freshen up if required. Apply creams if prescribed to maintain good skin integrity & reduce risk of breakdown. Change pads as requested. Catheter Care- Stoma - please observe catheters, tubes, bags, leg straps, supra pubic, convene. Follow out correct care. If you have any concerns e.g. infection/damage/skin damage, please report to the office immediately or correct if possible following policies procedures and training.',
    aims: '',
    taskIds: ['t2', 't9'],
    visitIds: ['v2'],
    status: 'active',
  },
  {
    id: 'o2',
    title: 'Maintain Adequate Dietary & Fluid Intake',
    type: 'template',
    whatICanDo: 'This individual is unable to independently prepare and serve food and drinks for themselves, please provide them with assistance to maintain a high standard of nutritional health and sufficient fluid intake to promote health by reducing the risk of infections & illnesses and maintain good skin integrity. Please encourage food and fluid intake, to enable them to feel they have and enjoy a nutritious varied diet at timely intervals.',
    aims: '',
    taskIds: ['t3', 't6', 't7'],
    visitIds: ['v1', 'v2'],
    status: 'active',
  },
  {
    id: 'o3',
    title: 'Management of Dementia Related Behavior',
    type: 'template',
    whatICanDo: 'This individual has memory difficulties and confusion at times, please be understanding while communicating, allow them time to express their requirements. Ensure you provide reassurance if they become confused or frustrated, speak clearly and always be patient and assist and support with daily living tasks they now find more difficult. Rather than trying to achieve complete independence, preserve and encourage a more functional state. Look past their diagnosis and gain an understanding of the person behind the condition.',
    aims: '',
    taskIds: ['t1', 't3', 't4', 't7', 't8'],
    visitIds: ['v1', 'v2'],
    status: 'active',
  },
  {
    id: 'o4',
    title: 'Support with Daily Living to Remain at Home',
    type: 'template',
    whatICanDo: 'Please carry out housekeeping and similar tasks, so this individual can remain living in an environment they are comfortable and used to. Ensure you ask if they require anything else before you leave. e.g. watering plants, winding a clock.',
    aims: '',
    taskIds: ['t1', 't2', 't3', 't4', 't5', 't7', 't8'],
    visitIds: ['v1', 'v2'],
    status: 'active',
  },
  {
    id: 'o5',
    title: 'Management of Medical Conditions and Medication',
    type: 'template',
    whatICanDo: 'Please support this individual with their prescribed medication as directed. Ensure medications are administered at the correct time, in the correct dose, and via the correct route. Document all medication administration in the care notes. Report any refusals, side effects, or concerns to the office immediately.',
    aims: 'Ensure safe and consistent medication administration to support ongoing health management and reduce risk of deterioration.',
    taskIds: ['t10'],
    visitIds: ['v1', 'v2'],
    status: 'active',
  },
];

export const VISITS: CareVisit[] = [
  {
    id: 'v1',
    title: 'Friday visit',
    visitType: 'Care visit',
    numEmployees: 1,
    startDate: '21/11/2025',
    startTime: '11:00',
    endTime: '12:00',
    duration: '1 hour',
    cadence: 'Alternate week',
    weeks: [{ activeDays: [4] }, { activeDays: [4] }],
    outcomeIds: ['o2', 'o3', 'o4'],
    taskIds: ['t1', 't3', 't4', 't5', 't7', 't8', 't10'],
    status: 'active',
  },
  {
    id: 'v2',
    title: 'Lunch visit',
    visitType: 'Care visit',
    numEmployees: 1,
    startDate: '11/03/2026',
    startTime: '13:00',
    endTime: '13:30',
    duration: '30 minutes',
    cadence: 'Alternate week',
    weeks: [{ activeDays: [0, 2] }, { activeDays: [0, 2] }],
    outcomeIds: ['o1', 'o2', 'o3', 'o4'],
    taskIds: ['t1', 't2', 't4', 't6', 't9', 't10'],
    status: 'active',
  },
];

// ─── New enquiry customer — visits were created at enquiry stage to plan the
//     rota (they live in the Rostering service agreement and are read-only
//     here); the outcomes and tasks below are CareBridge's draft of the care
//     plan, generated from her assessment recording and linked onto those
//     existing visits. Nothing has been accepted yet — every outcome and task
//     carries reviewed: false. ───────────────────────────────────────────────
export const EDITH_VISITS: CareVisit[] = [
  {
    id: 'ev1',
    title: 'Morning call',
    visitType: 'Care visit',
    numEmployees: 1,
    startDate: '13/07/2026',
    startTime: '08:00',
    endTime: '08:45',
    duration: '45 minutes',
    cadence: 'Weekly',
    weeks: [{ activeDays: [0, 1, 2, 3, 4, 5, 6] }],
    outcomeIds: ['eo1', 'eo2', 'eo3', 'eo4'],
    // Order is the running order within the visit: steady her on arrival,
    // personal care, breakfast, morning meds, then a drink left within reach.
    taskIds: ['et7', 'et1', 'et2', 'et5', 'et4', 'et6'],
    status: 'active',
  },
  {
    id: 'ev2',
    title: 'Lunch call',
    visitType: 'Care visit',
    numEmployees: 1,
    startDate: '13/07/2026',
    startTime: '12:30',
    endTime: '13:00',
    duration: '30 minutes',
    cadence: 'Weekly',
    weeks: [{ activeDays: [0, 1, 2, 3, 4, 5, 6] }],
    outcomeIds: ['eo1', 'eo3', 'eo4', 'eo5'],
    taskIds: ['et7', 'et3', 'et9', 'et4', 'et6', 'et8'],
    status: 'active',
  },
];

// Every outcome/task below is drafted from this one recording. Kept as a const
// so the attribution shown on each pending card can't drift between them.
const EDITH_DRAFT_SOURCE = 'Initial Assessment, 7 Jul 2026';

// NB: CareBridgePage.tsx also exports EDITH_OUTCOMES/EDITH_TASKS, but those are
// the lightweight OutcomeSuggestion/TaskSuggestion shapes shown on the
// CareBridge tab. These are the real care-plan records.
//
// Content is drawn only from her Initial Assessment transcript — her WIITM
// follow-up recording contradicts it (walking stick vs. frame, lives with
// husband vs. alone) and is not treated as a source for care needs.
// `type: 'custom'` throughout: these were drafted from a conversation, not
// picked from the template library like Arthur's.
export const EDITH_OUTCOMES: Outcome[] = [
  {
    id: 'eo1',
    title: 'Maintain Safe Mobility & Reduce Falls Risk',
    type: 'custom',
    whatICanDo: 'Edith mobilises indoors with a walking frame and was rated a high falls risk by her physiotherapist following a fractured hip. Please supervise her transfers and movement around the bungalow, and keep walkways clear of trip hazards. There are two steps down to the back door — Edith will not attempt these alone and should not be encouraged to.',
    aims: 'Edith stays steady and confident moving around her own home, with no further falls.',
    taskIds: ['et7'],
    visitIds: ['ev1', 'ev2'],
    status: 'active',
    reviewed: false,
    draftSource: EDITH_DRAFT_SOURCE,
  },
  {
    id: 'eo2',
    title: 'Support with Personal Care & Dignity',
    type: 'custom',
    whatICanDo: 'Edith washes her upper body independently and wants to keep doing so. She needs assistance to wash her legs and feet and to dress, both of which have been a struggle since the hip fracture. Edith has asked for a female carer for personal care — please respect this preference.',
    aims: 'Edith is clean, comfortable and dressed each morning, keeping as much independence and privacy as she can.',
    taskIds: ['et1'],
    visitIds: ['ev1'],
    status: 'active',
    reviewed: false,
    draftSource: EDITH_DRAFT_SOURCE,
  },
  {
    id: 'eo3',
    title: 'Maintain Adequate Dietary & Fluid Intake',
    type: 'custom',
    whatICanDo: 'Edith cannot stand long enough to cook and has been living largely on biscuits. She also forgets to drink. Please prepare a nourishing breakfast and lunch, encourage her to eat while you are there, and leave a drink within reach before you leave. Record what she has eaten and drunk in the care notes.',
    aims: 'Edith eats two proper meals a day and drinks regularly, with her appetite and weight stable.',
    taskIds: ['et2', 'et3', 'et4', 'et9'],
    visitIds: ['ev1', 'ev2'],
    status: 'active',
    reviewed: false,
    draftSource: EDITH_DRAFT_SOURCE,
  },
  {
    id: 'eo4',
    title: 'Management of Medical Conditions and Medication',
    type: 'custom',
    whatICanDo: "Edith takes amlodipine for her blood pressure and co-codamol as required for arthritis and hip pain, but does not always remember them. Please prompt her medication and record what is taken. Her daughter reports Edith's memory has declined over the past year — note and report any change in memory, confusion or general wellbeing to the office.",
    aims: 'Edith takes her prescribed medication consistently, her pain is well managed, and any change in her memory is picked up early.',
    taskIds: ['et5', 'et6', 'et9'],
    visitIds: ['ev1', 'ev2'],
    status: 'active',
    reviewed: false,
    draftSource: EDITH_DRAFT_SOURCE,
  },
  {
    id: 'eo5',
    title: 'Support with Daily Living to Remain at Home',
    type: 'custom',
    whatICanDo: 'Edith has lived in her bungalow for thirty years and is determined to stay there. She cannot carry things while using her frame, so she needs help with laundry and changing her bed. Always ask before starting a task — Edith has always done for herself and finds needing help frustrating.',
    aims: 'Edith carries on living independently in her own home, with the practical tasks she can no longer manage taken care of.',
    taskIds: ['et8'],
    visitIds: ['ev2'],
    status: 'active',
    reviewed: false,
    draftSource: EDITH_DRAFT_SOURCE,
  },
  {
    id: 'eo6',
    title: 'Return to Social Activities in the Community',
    type: 'custom',
    // Deliberately has no visit: nothing in her service agreement can deliver
    // this yet, so the outcome card shows "None" under Visits. The gap is the
    // point — visits originate in Rostering, so a new one has to be added
    // there before this outcome can actually be delivered.
    whatICanDo: 'Edith has missed the Tuesday knitting group at the church hall since her fall. She would like to go back once she feels steadier and has asked for someone to come with her the first few times. Arthritis in her hands slows her knitting but she still enjoys it.',
    aims: 'Edith is back at her knitting group each week — accompanied at first, then under her own steam.',
    taskIds: ['et10'],
    visitIds: [],
    status: 'active',
    reviewed: false,
    draftSource: EDITH_DRAFT_SOURCE,
  },
];

export const EDITH_TASKS: CareTask[] = [
  {
    id: 'et5', title: 'Amlodipine', category: 'Medications',
    description: 'Prompt me to take my amlodipine for my blood pressure. I do not always remember it. Please record what I have taken and report any refusals to the office.',
    startDate: '13/07/2026', outcomeIds: ['eo4'], visitIds: ['ev1'], status: 'active',
    medicationDetails: {
      form: 'Tablet',
      route: 'Oral',
      dosage: '5mg once daily',
      controlCategory: 'N/A',
      location: 'Kitchen cupboard',
      supportRequired: 'Prompt',
      prn: false,
    },
    reviewed: false, draftSource: EDITH_DRAFT_SOURCE,
  },
  {
    id: 'et6', title: 'Co-codamol', category: 'Medications',
    description: 'Offer me co-codamol if I am in pain from my hip or my arthritis. Please ask how my pain is at each visit, record anything I take, and let the office know if I am needing it more often.',
    startDate: '13/07/2026', outcomeIds: ['eo4'], visitIds: ['ev1', 'ev2'], status: 'active',
    medicationDetails: {
      form: 'Tablet',
      route: 'Oral',
      dosage: '30/500mg, up to twice daily',
      controlCategory: 'N/A',
      location: 'Kitchen cupboard',
      supportRequired: 'Prompt',
      prn: true,
    },
    reviewed: false, draftSource: EDITH_DRAFT_SOURCE,
  },
  {
    id: 'et1', title: 'Personal Care Support', category: 'General',
    description: 'Assist me to wash my legs and feet and to dress. I can manage my top half myself and would like to keep doing that. I would prefer a female carer for this.',
    startDate: '13/07/2026', outcomeIds: ['eo2'], visitIds: ['ev1'], status: 'active',
    reviewed: false, draftSource: EDITH_DRAFT_SOURCE,
  },
  {
    id: 'et2', title: 'Prepare Breakfast', category: 'Nutrition',
    description: 'Please make me a proper breakfast and encourage me to eat it. Note what I have eaten in the care record.',
    startDate: '13/07/2026', outcomeIds: ['eo3'], visitIds: ['ev1'], status: 'active',
    reviewed: false, draftSource: EDITH_DRAFT_SOURCE,
  },
  {
    id: 'et3', title: 'Prepare Lunch', category: 'Nutrition',
    description: 'Please make me some lunch and encourage me to eat it. I have been having biscuits and not much else, so do check what I have had.',
    startDate: '13/07/2026', outcomeIds: ['eo3'], visitIds: ['ev2'], status: 'active',
    reviewed: false, draftSource: EDITH_DRAFT_SOURCE,
  },
  {
    id: 'et4', title: 'Encourage Fluids', category: 'Hydration',
    description: 'Please offer me a drink and encourage me to finish it. I forget to drink, so leave a fresh drink within my reach before you go.',
    startDate: '13/07/2026', outcomeIds: ['eo3'], visitIds: ['ev1', 'ev2'], status: 'active',
    reviewed: false, draftSource: EDITH_DRAFT_SOURCE,
  },
  {
    id: 'et7', title: 'Mobility & Falls Check', category: 'General',
    description: 'Please supervise me moving around with my frame and check my walkways are clear. Do not let me try the two steps down to the back door on my own.',
    startDate: '13/07/2026', outcomeIds: ['eo1'], visitIds: ['ev1', 'ev2'], status: 'active',
    reviewed: false, draftSource: EDITH_DRAFT_SOURCE,
  },
  {
    id: 'et9', title: 'Check I Have Eaten', category: 'Observations',
    description: 'Please check for evidence I have eaten and ask me what I have had. I sometimes forget whether I have eaten. Record what you find in the care notes.',
    startDate: '13/07/2026', outcomeIds: ['eo3', 'eo4'], visitIds: ['ev2'], status: 'active',
    reviewed: false, draftSource: EDITH_DRAFT_SOURCE,
  },
  {
    id: 'et8', title: 'Laundry & Bed Change', category: 'General',
    description: 'Please see to my laundry and change my bed. I cannot carry things while I am using my frame.',
    startDate: '13/07/2026', outcomeIds: ['eo5'], visitIds: ['ev2'], status: 'active',
    reviewed: false, draftSource: EDITH_DRAFT_SOURCE,
  },
  {
    id: 'et10', title: 'Accompany to Knitting Group', category: 'General',
    // No visitIds — see the note on eo6.
    description: 'I would like to get back to the Tuesday knitting group at the church hall. Please come with me the first few times, until I feel steadier on my own.',
    startDate: '13/07/2026', outcomeIds: ['eo6'], visitIds: [], status: 'active',
    reviewed: false, draftSource: EDITH_DRAFT_SOURCE,
  },
];

// ─── Vera Bramwell ────────────────────────────────────────────────────────────
// Edith's plan re-skinned (see data/vera-from-edith.ts for the substitutions
// and why it's done this way). Her ids are Edith's with the leading "e"
// swapped for a "v" so the two customers' records can never be confused for
// one another in accepted/discarded state, which is keyed by id alone.
const VERA_DRAFT_SOURCE = veraText(EDITH_DRAFT_SOURCE);
const veraId = (id: string) => `v${id.slice(1)}`;

// Her visits are live, not drafted: they came out of the enquiry and are set
// up in Rostering (see SERVICE_AGREEMENT_DATA), same as Edith's.
export const VERA_VISITS: CareVisit[] = EDITH_VISITS.map(visit => {
  const mapped: CareVisit = {
    ...veraise(visit),
    id: veraId(visit.id),
    outcomeIds: visit.outcomeIds.map(veraId),
    taskIds: visit.taskIds.map(veraId),
  };
  // 'vv1' is the morning call — where the 4-week review's dizziness-on-
  // standing check ('vt11', defined further down) actually happens.
  return mapped.id === 'vv1' ? { ...mapped, taskIds: [...mapped.taskIds, 'vt11'] } : mapped;
});

// A second, later recording — a 4-week review, genuinely hers rather than
// re-skinned from Edith (see the note on RECORDINGS['vera-bramwell'] in
// CareBridgePage.tsx) — refines outcome vo1 (falls risk) with one new task,
// same as Arthur's 6-week review adds a task via `carePlanTaskAdditions`.
// Its own `draftSource`, distinct from the initial assessment's, is what
// gives "Draft care plan" two real recordings to draft from rather than one.
const VERA_REVIEW_SOURCE = '4-Week Review, 1 Sep 2026';
const VERA_REVIEW_TASK: CareTask = {
  id: 'vt11',
  title: 'Postural Dizziness Check',
  category: 'Observations',
  description: "Check I'm not dizzy or unsteady when I stand up, since starting ramipril for my blood pressure — let the office know if I am, given my falls risk.",
  startDate: '01/09/2026',
  outcomeIds: ['vo1'],
  visitIds: ['vv1'],
  status: 'active',
  reviewed: false,
  draftSource: VERA_REVIEW_SOURCE,
};

const VERA_OUTCOMES: Outcome[] = EDITH_OUTCOMES.map(outcome => {
  const mapped: Outcome = {
    ...veraise(outcome),
    id: veraId(outcome.id),
    taskIds: outcome.taskIds.map(veraId),
    visitIds: outcome.visitIds.map(veraId),
    draftSource: VERA_DRAFT_SOURCE,
  };
  // vo1 is "Maintain Safe Mobility & Reduce Falls Risk" — the outcome the
  // review's dizziness check actually belongs under.
  return mapped.id === 'vo1' ? { ...mapped, taskIds: [...mapped.taskIds, VERA_REVIEW_TASK.id] } : mapped;
});

const VERA_TASKS: CareTask[] = [
  ...EDITH_TASKS.map(task => ({
    ...veraise(task),
    id: veraId(task.id),
    outcomeIds: task.outcomeIds.map(veraId),
    visitIds: task.visitIds.map(veraId),
    draftSource: VERA_DRAFT_SOURCE,
  })),
  VERA_REVIEW_TASK,
];

// Care-plan data keyed by customer id. Unknown customers get an empty plan.
export interface CarePlanData {
  tasks: CareTask[];
  outcomes: Outcome[];
  visits: CareVisit[];
}

export const CARE_DATA: Record<string, CarePlanData> = {
  'arthur-barrington': { tasks: TASKS, outcomes: OUTCOMES, visits: VISITS },
  'edith-caldwell': { tasks: EDITH_TASKS, outcomes: EDITH_OUTCOMES, visits: EDITH_VISITS },
  // Nothing drafted into her plan yet — her outcomes and tasks only appear
  // once someone drafts them from her recordings (see CARE_PLAN_DRAFTS and
  // the "Draft care plan" flow in CareManagementContext). Her visits are
  // already there: they came from the enquiry, not from CareBridge.
  'vera-bramwell': { tasks: [], outcomes: [], visits: VERA_VISITS },
};

/**
 * What CareBridge would draft into a customer's plan from their recordings —
 * held separately from CARE_DATA so it can be materialised on demand rather
 * than shipping as part of the plan. Drives the "Draft care plan" flow on the
 * Care Management tab: the records land as `reviewed: false` drafts, same as
 * Edith's arrived, so they still go through the same per-record accept step.
 *
 * No flat "source" here — which recording(s) contributed is read back off
 * each record's own `draftSource` (useCareData dedupes them), since a plan
 * drafted from several recordings can have outcomes/tasks attributed to
 * different ones.
 */
export const CARE_PLAN_DRAFTS: Record<string, { outcomes: Outcome[]; tasks: CareTask[] }> = {
  'vera-bramwell': { outcomes: VERA_OUTCOMES, tasks: VERA_TASKS },
};
