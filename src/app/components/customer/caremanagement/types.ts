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

export interface CareTask {
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

export interface Outcome {
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

// ─── New enquiry customer — visits created at enquiry stage to plan the rota,
//     but no outcomes or tasks yet (the care plan hasn't been built). ─────────────
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
    outcomeIds: [],
    taskIds: [],
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
    outcomeIds: [],
    taskIds: [],
    status: 'active',
  },
];

// Care-plan data keyed by customer id. Unknown customers get an empty plan.
export interface CarePlanData {
  tasks: CareTask[];
  outcomes: Outcome[];
  visits: CareVisit[];
}

export const CARE_DATA: Record<string, CarePlanData> = {
  'arthur-barrington': { tasks: TASKS, outcomes: OUTCOMES, visits: VISITS },
  'edith-caldwell': { tasks: [], outcomes: [], visits: EDITH_VISITS },
};
