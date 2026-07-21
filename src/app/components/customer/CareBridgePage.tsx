import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { FileText, Target, ListChecks, Sparkles, Send, Mic, ArrowRight, Info, Pencil, ThumbsUp, ThumbsDown, Copy, ChevronDown, Play, Pause, Download, X, Check } from 'lucide-react';
import { Button } from '../buttons/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useScrolled } from '../../hooks/useScrolled';
import { useCustomer } from '../../data/CustomerContext';
import type { CustomerProfile } from '../../data/customers';
import { OutcomeBadge, TaskBadge } from './caremanagement/shared';
import type { TaskCategory } from './caremanagement/types';
import { Waveform } from '../icons/Waveform';

// ─── Recording labels — used only to reserve a fixed width for the recording
// picker trigger (sized to the longest possible label) so it doesn't resize
// as the selection changes. The actual per-customer recordings are defined
// further down in RECORDINGS. ─────────────────────────────────────────────

const RECORDING_LABELS_FOR_SIZING = ['Initial Assessment', '2-Week Review', '6-Week Review', '6-Month Review'];
const LONGEST_RECORDING_LABEL = RECORDING_LABELS_FOR_SIZING.reduce((longest, l) => (l.length > longest.length ? l : longest), '');

// ─── Care & Support Plan structure — the real "multi-document" taxonomy ──────
// This is the customer's largest document, rendered with its own left-hand
// section nav (not accordions) to match how it renders in its own part of
// the real system. Sections not yet captured by any recording show as
// pending — this is the true full structure, not just what we've authored.

interface CarePlanNavItem {
  id: string;
  label: string;
  group: 'Hospital passport' | 'Care plan' | 'Assessments';
  /** How many distinct fields the real document has for this section — used for the "N/N fields" badge on captured sections. Sections rebuilt as real multi-field forms (see `formSections` on Recording) derive this from their actual field count instead; the number here is only the fallback for sections still represented as one prose paragraph. */
  fieldCount: number;
}

const CARE_PLAN_STRUCTURE: CarePlanNavItem[] = [
  { id: 'personal-details', label: 'Personal details', group: 'Hospital passport', fieldCount: 18 },
  { id: 'section-1', label: 'Section 1 - Profile and background', group: 'Hospital passport', fieldCount: 1 },
  { id: 'section-2', label: 'Section 2 - Personal care and daily routine', group: 'Care plan', fieldCount: 1 },
  { id: 'section-3', label: 'Section 3 - Activities, exercise and socialising', group: 'Care plan', fieldCount: 1 },
  { id: 'section-4', label: 'Section 4 - Nutrition and hydration', group: 'Care plan', fieldCount: 1 },
  { id: 'section-5', label: 'Section 5 - Mobility', group: 'Care plan', fieldCount: 1 },
  { id: 'section-6', label: 'Section 6 - Health and medication', group: 'Care plan', fieldCount: 6 },
  { id: 'section-7', label: 'Section 7 - Domestic support', group: 'Care plan', fieldCount: 1 },
  { id: 'section-8', label: 'Section 8 - Financial support', group: 'Care plan', fieldCount: 1 },
  { id: 'section-9', label: 'Section 9 - Live in care', group: 'Care plan', fieldCount: 1 },
  { id: 'section-10', label: 'Section 10 - Additional support', group: 'Care plan', fieldCount: 1 },
  { id: 'needs-assessment', label: 'Needs assessment', group: 'Assessments', fieldCount: 1 },
  { id: 'moving-positioning', label: 'Moving and positioning assessment', group: 'Assessments', fieldCount: 1 },
  { id: 'companionship', label: 'Companionship/home help/financial assessment', group: 'Assessments', fieldCount: 1 },
  { id: 'home-environment', label: 'Home environment assessment', group: 'Assessments', fieldCount: 1 },
  { id: 'rag-rating', label: 'RAG rating assessment', group: 'Assessments', fieldCount: 1 },
];

const CARE_PLAN_GROUPS: CarePlanNavItem['group'][] = ['Hospital passport', 'Care plan', 'Assessments'];

// ─── Demo data — Arthur Barrington's initial care assessment ─────────────────────

interface TranscriptLine {
  speaker: string;
  role: 'assessor' | 'customer' | 'family';
  time: string;
  text: string;
}

const TRANSCRIPT: TranscriptLine[] = [
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '10:02', text: "Morning Arthur, thanks for having me. I just want to have a chat about how you're managing day to day, and what support would help you most. David, good to have you here too." },
  { speaker: 'David (Son)', role: 'family', time: '10:02', text: "No problem. I've flown over from Florida for a fortnight so I wanted to be here for this. I'm his main point of contact — my number's 07980 077250." },
  { speaker: 'Arthur', role: 'customer', time: '10:03', text: "I've lived in this house forty years and I don't intend to leave it. I'm very house-proud. I don't want people coming in and taking over, if I'm honest." },
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '10:04', text: "That's completely understood — the aim is to help you stay independent at home, not take over. Can you tell me about your health?" },
  { speaker: 'David (Son)', role: 'family', time: '10:05', text: "Dad was diagnosed with vascular dementia a couple of years ago. His memory comes and goes and he gets a bit muddled in the afternoons. He's also got high blood pressure that he takes tablets for." },
  { speaker: 'Arthur', role: 'customer', time: '10:06', text: "I know I forget things. I don't always remember if I've eaten. And I've got this ointment — Hydromol — for my legs, twice a day. I can't always manage it myself." },
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '10:07', text: "We can have the carer apply that for you and keep an eye on your skin. What about meals — how are you doing with food and drink?" },
  { speaker: 'Arthur', role: 'customer', time: '10:08', text: "I manage a bit but I'd like someone to make me some lunch and maybe leave a snack plate out. I sometimes get a ready meal out and then forget and get another one." },
  { speaker: 'David (Son)', role: 'family', time: '10:09', text: "It'd help if they checked the fridge for out-of-date food too, and washed up any dishes. And he loves a chat — companionship matters more than the chores, really." },
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '10:11', text: "Noted. And getting around the house and outside?" },
  { speaker: 'Arthur', role: 'customer', time: '10:11', text: "Indoors I'm fine on my own. Outside I use my frame and I'm a bit wary on the front step. I do like to get out when the weather's nice." },
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '10:13', text: "Last thing — is there a DNACPR or RESPECT form in place?" },
  { speaker: 'David (Son)', role: 'family', time: '10:13', text: "Yes, there's a DNACPR. It's in the yellow envelope on the table in the living room." },
];

interface AssessmentSection {
  id: string;
  title: string;
  target?: string;
  text: string;
  /** Reference interview questions shown under a drafted section — what the recording was listened for. Care Plan sections only. */
  promptingQuestions?: string[];
}

/**
 * A single field in a genuinely multi-field section (e.g. Personal details) —
 * unlike the other Care Plan sections, these render as real form controls
 * (dropdown/text/radio/table) rather than one prose paragraph, matching how
 * the real document's more complex sections are actually structured.
 * `value`/`rows` absent means the recording didn't cover this field — shown
 * as "Not yet captured" rather than invented, since a real AI draft would
 * leave gaps for whatever wasn't actually said.
 */
interface FormField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'radio' | 'table';
  value?: string;
  options?: string[]; // select only
  columns?: string[]; // table only
  rows?: string[][]; // table only
  /** false = CareBridge drafted this from the recording and it hasn't been manually accepted yet. Undefined for fields with no captured content — nothing to review. Set true once a reviewer accepts it, or automatically the moment they edit it themselves. */
  reviewed?: boolean;
}

// IDs match CARE_PLAN_STRUCTURE below (the real document's section taxonomy),
// so these render in the left-nav multi-doc view rather than as accordions.
const ASSESSMENT_SECTIONS: AssessmentSection[] = [
  {
    id: 'section-1',
    title: 'Section 1 - Profile and background',
    text: 'Arthur has lived in his own home in Sutton Coldfield for over forty years and is strongly motivated to remain there. He is house-proud and values his independence, and can find it difficult to accept help that feels like others "taking over". Primary contact is his son David (lives in Florida, currently visiting) on 07980 077250.',
    promptingQuestions: [
      'Can you tell me about your family background?',
      'Who are the important people in your life?',
      'Is there anything about your home that matters to you?',
    ],
  },
  {
    id: 'section-6',
    title: 'Section 6 - Health and medication',
    text: 'Diagnosed with vascular dementia approximately two years ago; memory fluctuates and confusion increases in the afternoons. Also has hypertension managed with prescribed medication. Prescribed Hydromol ointment to be applied to both lower legs twice daily — Arthur cannot reliably self-administer and requires support. A DNACPR is in place (yellow envelope, living room table).',
    promptingQuestions: [
      'Can you tell me about your health?',
      'What medication are you taking, and can you manage it yourself?',
      'Is there a DNACPR or RESPECT form in place?',
    ],
  },
  {
    id: 'section-4',
    title: 'Section 4 - Nutrition and hydration',
    text: 'Requires support to prepare lunch and would like a snack plate left out. Due to memory difficulties Arthur may forget whether he has eaten, and has on occasion taken out more than one ready meal. Carer to prepare lunch, offer a snack plate, and look for evidence he has eaten, recording intake in the notes.',
    promptingQuestions: [
      'How are you doing with food and drink?',
      'Do you need any support preparing meals?',
    ],
  },
  {
    id: 'section-5',
    title: 'Section 5 - Mobility',
    text: 'Mobilises independently indoors. Uses a wheeled frame outdoors and is wary of the front step — supervision recommended when leaving the property. Enjoys getting outside in good weather.',
    promptingQuestions: [
      'How are you getting around the house and outside?',
      'Do you use any walking aids?',
    ],
  },
  {
    id: 'section-7',
    title: 'Section 7 - Domestic support',
    text: 'Would like light domestic help: washing up dishes, checking the fridge for out-of-date food and disposing of it, and occasional ironing. Support should be offered sensitively given Arthur is house-proud and independent.',
    promptingQuestions: [
      'Would you like any help with washing up or housework?',
      'Is there anything around the home you find harder to manage?',
    ],
  },
];

// Personal details, as it really renders in the source system, is a form of
// ~18 distinct fields (dropdowns, text, radio, repeatable tables) rather than
// one paragraph. Only what Arthur's recording actually covered is filled in —
// the rest are honestly left "Not yet captured" gaps for the reviewer to see.
const LANGUAGE_OPTIONS = ['English', 'Welsh', 'Polish', 'Punjabi', 'Urdu', 'Cantonese', 'British Sign Language', 'Other'];
const PRONOUN_OPTIONS = ['He/Him', 'She/Her', 'They/Them', 'Prefer to self-describe', 'Prefer not to say'];
const GENDER_DESCRIPTION_OPTIONS = ['Man', 'Woman', 'Non-binary', 'Prefer to self-describe', 'Prefer not to say'];
const SEXUAL_ORIENTATION_OPTIONS = ['Heterosexual/Straight', 'Gay/Lesbian', 'Bisexual', 'Prefer to self-describe', 'Prefer not to say'];
const SMOKER_OPTIONS = ['Non-smoker', 'Smoker', 'Ex-smoker', 'Prefer not to say'];
const PETS_OPTIONS = ['None', 'Dog(s)', 'Cat(s)', 'Other pets'];

// Fields the recording actually covered are marked `reviewed: false` — drafted
// by CareBridge from the transcript, awaiting a supervisor's manual accept.
// Fields it didn't cover are left uncaptured, ready for the reviewer to fill
// in themselves (which counts as reviewed the moment they type it).
const ARTHUR_PERSONAL_DETAILS: FormField[] = [
  { id: 'language', label: 'What language would you prefer this assessment to be carried out in?', type: 'select', options: LANGUAGE_OPTIONS },
  { id: 'known-as', label: 'Known as', type: 'text', value: 'Arthur', reviewed: false },
  { id: 'pronouns', label: 'Preferred pronouns', type: 'select', options: PRONOUN_OPTIONS, value: 'He/Him', reviewed: false },
  { id: 'gender-description', label: 'Which of these most accurately describes you?', type: 'select', options: GENDER_DESCRIPTION_OPTIONS, value: 'Man', reviewed: false },
  { id: 'sexual-orientation', label: 'Sexual orientation', type: 'select', options: SEXUAL_ORIENTATION_OPTIONS },
  { id: 'allergies', label: 'Allergies', type: 'table', columns: ['Allergy', 'Symptoms experienced', 'Rescue medication'] },
  { id: 'dnar', label: 'Is there a DNAR/TEP (e.g. RESPECT form) in place?', type: 'radio', value: 'Yes', reviewed: false },
  { id: 'dnar-location', label: 'If yes, where can this be found?', type: 'text', value: 'Yellow envelope, living room table', reviewed: false },
  { id: 'smoker', label: 'Smoker status', type: 'select', options: SMOKER_OPTIONS },
  { id: 'pets', label: 'Pets', type: 'select', options: PETS_OPTIONS },
  { id: 'dietary', label: 'Dietary requirements', type: 'text' },
  {
    id: 'next-of-kin',
    label: 'Next of kin and other contacts',
    type: 'table',
    columns: ['Name', 'Relationship', 'Phone number', 'Decision maker'],
    rows: [['David Barrington', 'Son', '07980 077250', 'Yes']],
    reviewed: false,
  },
  { id: 'poa', label: 'Is there a PoA or alternative decision maker in place?', type: 'radio' },
  { id: 'professionals', label: 'Professionals involved', type: 'table', columns: ['Name', 'Profession', 'Contact number'] },
  { id: 'communication-needs', label: 'Communication needs', type: 'table', columns: ['Area where support may be needed', 'What support is needed'] },
  { id: 'capacity', label: 'Are there any mental capacity assessments or best interest decisions in place?', type: 'radio' },
  { id: 'understanding', label: 'Understanding/comprehension', type: 'table', columns: ['Area where support may be needed', 'What support is needed'] },
  { id: 'additional-details', label: 'Additional important details', type: 'text' },
];

interface OutcomeSuggestion {
  id: string;
  title: string;
  text: string;
}

const SUGGESTED_OUTCOMES: OutcomeSuggestion[] = [
  {
    id: 'o-dementia',
    title: 'Management of Dementia Related Behaviour',
    text: 'Arthur has memory difficulties and increased confusion in the afternoons. Communicate patiently, allow time to express himself, and provide reassurance. Support daily tasks he now finds harder while preserving his sense of independence.',
  },
  {
    id: 'o-nutrition',
    title: 'Maintain Adequate Dietary & Fluid Intake',
    text: 'Support Arthur to prepare and enjoy meals and drinks, encouraging regular intake. Look for evidence he has eaten and gently prevent duplicate ready meals being taken out.',
  },
  {
    id: 'o-daily-living',
    title: 'Support with Daily Living to Remain at Home',
    text: 'Carry out light housekeeping so Arthur can remain comfortably in his own home. Always ask before starting tasks and respect his house-proud, independent nature.',
  },
  {
    id: 'o-medication',
    title: 'Management of Medical Conditions and Medication',
    text: 'Support Arthur with prescribed medication, including applying Hydromol ointment to both lower legs twice daily. Monitor skin condition and blood pressure management, and report any concerns to the office.',
  },
];

interface TaskSuggestion {
  id: string;
  title: string;
  category: TaskCategory;
  text: string;
}

const SUGGESTED_TASKS: TaskSuggestion[] = [
  { id: 't-med', title: 'Hydromol Ointment', category: 'Medications', text: 'Apply Hydromol ointment to both lower legs twice a day. Check skin integrity and report redness or swelling to the office.' },
  { id: 't-lunch', title: 'Lunch', category: 'Nutrition', text: 'Prepare lunch with Arthur, checking whether a ready meal has already been taken out to avoid duplication.' },
  { id: 't-snack', title: 'Snack Plate', category: 'Nutrition', text: 'Offer to leave a snack plate out and ask what he would like.' },
  { id: 't-companion', title: 'Companionship', category: 'General', text: 'Sit and have a chat with Arthur — companionship is a priority for him alongside practical support.' },
  { id: 't-fridge', title: 'Fridge Dates', category: 'General', text: 'Check the fridge for out-of-date food and dispose of anything past its date.' },
  { id: 't-dishes', title: 'Dishes', category: 'General', text: 'Wash any dishes that have been left out.' },
];

interface ChatMessage {
  from: 'ai' | 'user';
  text: string;
}

const CHAT: ChatMessage[] = [
  { from: 'ai', text: "I've summarised the assessment visit into draft sections for the Care & Support Plan, plus suggested Outcomes and Tasks. Review and edit anything, or ask me to refine a section." },
  { from: 'ai', text: "This visit also covered consent, receipt of your documents, the Privacy Policy, Terms and Conditions, and the Customer Guide — I've drafted those too. See the secondary sections below the Care Plan." },
  { from: 'user', text: 'Can you expand the Mobility section — Arthur mentioned he uses a frame outdoors and is wary of the front step.' },
  { from: 'ai', text: 'Done. Mobility now notes he mobilises independently indoors, uses a wheeled frame outdoors, and needs supervision on the front step. See the updated card.' },
  { from: 'user', text: "Add David's number as the emergency contact in the profile section." },
  { from: 'ai', text: 'Added — David (son, in Florida) on 07980 077250 is listed as primary contact under Profile & background.' },
  { from: 'user', text: 'The medication outcome should mention the Hydromol ointment specifically.' },
  { from: 'ai', text: 'Updated the Medication outcome to reference applying Hydromol ointment to both lower legs twice daily.' },
];

// ─── Arthur — everything else covered in the same initial visit ─────────────
// In practice a care company doesn't book a separate visit for consent, T&Cs,
// etc — the supervisor covers all of it in the one recording. These are drawn
// from the same conversation as secondary documents, not separate recordings.

const CONSENT_TRANSCRIPT_ARTHUR: TranscriptLine[] = [
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '10:44', text: "Just a couple of quick things before I go, Arthur — I need to run through consent for care with you and David." },
  { speaker: 'Arthur', role: 'customer', time: '10:45', text: "Go on then." },
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '10:45', text: "Are you happy for us to share information about your care with your GP, and with David where it's relevant?" },
  { speaker: 'Arthur', role: 'customer', time: '10:46', text: "Yes, David can know everything, no problem." },
  { speaker: 'David (Son)', role: 'family', time: '10:46', text: "And I'm happy to be contacted directly if there's ever a decision needed and Dad's not able to make it himself." },
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '10:47', text: "Perfect, I'll record that consent now." },
];

const CONSENT_SECTIONS_ARTHUR: AssessmentSection[] = [
  { id: 'consent-scope', title: 'Consent to care & support', target: 'Consent record', text: "Arthur has given verbal consent for care and support to be provided, and for relevant information to be shared with his GP and with his son David, his primary contact." },
  { id: 'decision-making', title: 'Decision-making & capacity', target: 'Capacity check', text: "No concerns regarding capacity to consent were identified at this visit. Arthur was able to understand and respond to the consent discussion appropriately." },
  { id: 'info-sharing', title: 'Information sharing', target: 'Info sharing', text: "Arthur has agreed that David may be contacted directly regarding care decisions, including where Arthur is unable to respond himself." },
];

const RECEIPT_TRANSCRIPT_ARTHUR: TranscriptLine[] = [
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '10:52', text: "I've also given you copies of the Privacy Policy and our Terms and Conditions today, along with the Customer Guide for the area." },
  { speaker: 'Arthur', role: 'customer', time: '10:53', text: "Yes, David's got those in a folder for me." },
  { speaker: 'David (Son)', role: 'family', time: '10:53', text: "I've got them all together, I'll keep them safe with the paperwork." },
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '10:54', text: "Great — I'll confirm receipt of those documents now." },
];

const RECEIPT_SECTIONS_ARTHUR: AssessmentSection[] = [
  { id: 'documents-received', title: 'Documents received', target: 'Documents', text: "Arthur, via his son David, confirmed receipt of the Privacy Policy, Terms and Conditions of Business, and the Customer Guide, all provided at this visit." },
  { id: 'understanding', title: 'Understanding confirmed', target: 'Understanding', text: "David confirmed he had read through the documents on Arthur's behalf and had no questions at this stage." },
];

const PRIVACY_TRANSCRIPT_ARTHUR: TranscriptLine[] = [
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '10:57', text: "I've talked you through how we handle your information in line with our Privacy Policy — that alright?" },
  { speaker: 'Arthur', role: 'customer', time: '10:58', text: "Yes fine, nothing I'm worried about." },
  { speaker: 'David (Son)', role: 'family', time: '10:58', text: "I had a read through it too, all seems standard." },
];

const PRIVACY_SECTIONS_ARTHUR: AssessmentSection[] = [
  { id: 'privacy-explained', title: 'Privacy explained', target: 'Explanation', text: "The Privacy Policy was explained verbally, covering how Arthur's personal and care information is collected, stored and shared." },
  { id: 'data-use', title: 'How data is used', target: 'Data use', text: "Arthur and David confirmed understanding of how his data is used and raised no concerns." },
];

const TERMS_TRANSCRIPT_ARTHUR: TranscriptLine[] = [
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '11:01', text: "Last one — Terms and Conditions of Business, covers things like fees, notice periods and cancellations." },
  { speaker: 'David (Son)', role: 'family', time: '11:02', text: "Yes, I read through the fee schedule, that's clear." },
  { speaker: 'Arthur', role: 'customer', time: '11:03', text: "As long as David's happy, I am." },
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '11:04', text: "I'll confirm that's agreed then." },
];

const TERMS_SECTIONS_ARTHUR: AssessmentSection[] = [
  { id: 'terms-explained', title: 'Terms explained', target: 'Terms', text: "Terms and Conditions of Business were explained, including fees, notice periods and cancellation terms." },
  { id: 'fees', title: 'Fees & charges', target: 'Fees', text: "David confirmed he had reviewed the fee schedule and had no questions." },
];

const GUIDE_TRANSCRIPT_ARTHUR: TranscriptLine[] = [
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '11:06', text: "And finally, here's your Customer Guide — has our office number, out-of-hours contact, all that." },
  { speaker: 'David (Son)', role: 'family', time: '11:07', text: "Great, I'll keep this handy." },
  { speaker: 'Arthur', role: 'customer', time: '11:07', text: "Good, in case I need to moan about something!" },
];

const GUIDE_SECTIONS_ARTHUR: AssessmentSection[] = [
  { id: 'guide-provided', title: 'Guide provided', target: 'Guide', text: "Arthur and David were given the Customer Guide, covering local office contact details and what to expect from visits." },
  { id: 'key-contacts', title: 'Key contacts', target: 'Contacts', text: "Key contact numbers for the office and the out-of-hours line were confirmed and left with David." },
];

// ─── Arthur — 6-week review: a separate, later recording ────────────────────
// Its focus is the formal Confirmation of Instructions sign-off, but the
// conversation also refines the Care & Support Plan (a new task) — this is
// the "cumulative and refined over time" case the Care Plan tab reflects.

const INSTRUCTIONS_TRANSCRIPT_ARTHUR: TranscriptLine[] = [
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '09:30', text: "Morning Arthur, morning David — it's been six weeks now, so this visit is to make sure the care plan still reflects what you both want before we confirm it formally." },
  { speaker: 'Arthur', role: 'customer', time: '09:31', text: "Things have settled in nicely I think, the carers know what they're doing now." },
  { speaker: 'David (Son)', role: 'family', time: '09:32', text: "I agree, though could we add that they check his blood pressure readings weekly now — his GP asked for that last month." },
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '09:33', text: "Of course, I'll add that in as an agreed task. Anything else you'd like changed?" },
  { speaker: 'Arthur', role: 'customer', time: '09:34', text: "No, I'm happy with how it's going." },
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '09:50', text: "Good — I'll take that as your confirmation that the plan reflects what you want, with that one addition." },
];

const INSTRUCTIONS_SECTIONS_ARTHUR: AssessmentSection[] = [
  { id: 'plan-accuracy', title: 'Care plan accuracy', target: 'Plan review', text: "Arthur and David confirmed the current care plan accurately reflects the support being provided and remains appropriate six weeks on." },
  { id: 'agreed-changes', title: 'Agreed visits & tasks', target: 'Agreed changes', text: "One addition agreed: carers to check and record Arthur's blood pressure weekly, following a request from his GP." },
  { id: 'consent-to-plan', title: 'Consent to plan', target: 'Consent', text: "Arthur gave his consent that the care plan, with the blood pressure monitoring addition, reflects what he wants and can be formally confirmed." },
];

const BP_MONITORING_TASK: TaskSuggestion = {
  id: 't-bp',
  title: 'Blood Pressure Monitoring',
  category: 'Observations',
  text: "Check and record Arthur's blood pressure weekly, following a request from his GP.",
};

// ─── New enquiry — Mrs Edith Caldwell's assessment ──────────────────────────────

const EDITH_TRANSCRIPT: TranscriptLine[] = [
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '14:00', text: "Hello Edith, I'm Alison from the care team — thanks for seeing me. Susan, good to meet you too. I'd like to understand how things have been since you came home." },
  { speaker: 'Susan (Daughter)', role: 'family', time: '14:01', text: "Mum was in hospital for three weeks after a fall in the kitchen — she fractured her hip. She's home now but nowhere near as steady, and I'm worried about her managing on her own. My number's 07712 660145." },
  { speaker: 'Edith', role: 'customer', time: '14:02', text: "I've been in this bungalow thirty years and I intend to stay. I've always done for myself, but since the fall I can't manage the way I used to, and that frustrates me." },
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '14:04', text: "That's exactly what we're here to help with. Can you tell me about your health?" },
  { speaker: 'Edith', role: 'customer', time: '14:05', text: "I've arthritis in my hands and knees, and now the hip. I take a tablet for my blood pressure — amlodipine — and some co-codamol when the pain's bad, but I don't always remember them." },
  { speaker: 'Susan (Daughter)', role: 'family', time: '14:06', text: "That's a worry — she forgets her tablets, and sometimes forgets whether she's eaten. Her memory's slipped this last year." },
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '14:07', text: "We can prompt her medication and keep a record. How are you managing with washing and dressing, Edith?" },
  { speaker: 'Edith', role: 'customer', time: '14:08', text: "My top half I'm alright, but I can't manage my legs and feet since the hip, and dressing is a struggle. I'd rather a lady helped me with that." },
  { speaker: 'Edith', role: 'customer', time: '14:10', text: "And I can't stand long enough to cook now. I've been having biscuits and not much else, if I'm honest — and I don't drink enough, I forget." },
  { speaker: 'Susan (Daughter)', role: 'family', time: '14:11', text: "I'd like someone to make her a proper breakfast and lunch and leave a drink out. I do the evenings when I finish work." },
  { speaker: 'Edith', role: 'customer', time: '14:12', text: "I use my frame indoors. There are two steps down to the back door and I daren't do them on my own now." },
  { speaker: 'Susan (Daughter)', role: 'family', time: '14:13', text: "The physio said she's a high falls risk. That's my biggest worry." },
  { speaker: 'Edith', role: 'customer', time: '14:15', text: "The laundry and changing my bed too — I can't carry things with the frame. I'd be grateful if someone could see to that." },
];

// IDs match CARE_PLAN_STRUCTURE below (the real document's section taxonomy),
// so these render in the left-nav multi-doc view rather than as accordions.
const EDITH_SECTIONS: AssessmentSection[] = [
  {
    id: 'section-1',
    title: 'Section 1 - Profile and background',
    text: 'Edith has lived independently in her Lichfield bungalow for thirty years and is determined to remain there. Recently discharged after a three-week hospital admission for a fractured hip following a fall at home. Used to managing alone and finding reduced independence frustrating. Daughter Susan is the main contact (07712 660145) and visits in the evenings after work.',
    promptingQuestions: [
      'Can you tell me about your family background?',
      'Who are the important people in your life?',
      'How have things been since you came home?',
    ],
  },
  {
    id: 'section-2',
    title: 'Section 2 - Personal care and daily routine',
    text: 'Able to wash her upper body independently but needs assistance to wash her lower half and feet since the hip fracture, and finds dressing a struggle. Has expressed a preference for a female carer to support with personal care, with dignity maintained throughout.',
    promptingQuestions: [
      'How are you managing with washing and dressing?',
      'Do you have a preference for a male or female carer?',
    ],
  },
  {
    id: 'section-4',
    title: 'Section 4 - Nutrition and hydration',
    text: 'Unable to stand long enough to prepare meals since the fall and has been under-eating (mainly biscuits). Poor fluid intake and forgets to drink. Requires a prepared breakfast and lunch, encouragement with food and fluids, and a drink left within reach. Daughter covers evening meals.',
    promptingQuestions: [
      'How are you managing with meals and drinks?',
      'Are you able to prepare food for yourself?',
    ],
  },
  {
    id: 'section-5',
    title: 'Section 5 - Mobility',
    text: 'Uses a walking frame indoors and is unsteady. Assessed by physiotherapy as a high falls risk. Cannot safely manage the two steps to the back door unaided and needs support and supervision when moving around, particularly with transfers.',
    promptingQuestions: [
      'How do you get around indoors and outdoors?',
      'Have you had any falls recently?',
    ],
  },
  {
    id: 'section-6',
    title: 'Section 6 - Health and medication',
    text: 'Osteoarthritis affecting hands, knees and now the hip, with ongoing pain. Prescribed amlodipine for hypertension and co-codamol PRN for pain. Does not reliably remember to take medication and requires prompting and recording. Reports some recent short-term memory decline — to be monitored.',
    promptingQuestions: [
      'Can you tell me about your health?',
      'What medication are you taking, and do you remember to take it?',
    ],
  },
  {
    id: 'section-7',
    title: 'Section 7 - Domestic support',
    text: 'Unable to carry items while using her frame. Requires help with laundry and changing bed linen. Support to be offered in a way that respects her independence and pride in her home.',
    promptingQuestions: [
      'Is there any help you need around the home, like laundry?',
      'Are you able to carry things safely with your frame?',
    ],
  },
];

const EDITH_OUTCOMES: OutcomeSuggestion[] = [
  { id: 'o-falls', title: 'Maintain Safe Mobility & Reduce Falls Risk', text: 'Edith is a high falls risk following a hip fracture. Support safe transfers and movement around the bungalow, supervise use of the walking frame, and do not attempt the back-door steps unaided. Keep the environment clear of hazards.' },
  { id: 'o-personal', title: 'Support with Personal Care & Dignity', text: 'Assist Edith to wash her lower body and feet and to dress, promoting as much independence as possible while preserving dignity. Provide a female carer in line with her preference.' },
  { id: 'o-nutrition', title: 'Maintain Adequate Dietary & Fluid Intake', text: 'Prepare a nourishing breakfast and lunch, encourage food and regular fluids, and leave a drink within reach. Monitor appetite and intake and report concerns.' },
  { id: 'o-medication', title: 'Management of Medical Conditions and Medication', text: "Prompt and record Edith's amlodipine and PRN co-codamol, monitor pain and blood pressure, and watch for changes in memory or wellbeing, reporting to the office." },
];

const EDITH_TASKS: TaskSuggestion[] = [
  { id: 't-personal', title: 'Personal Care Support', category: 'General', text: 'Assist Edith to wash her lower half and feet and to dress. Female carer preferred. Promote independence and dignity.' },
  { id: 't-meals', title: 'Prepare Breakfast & Lunch', category: 'Nutrition', text: 'Prepare a nourishing breakfast and lunch and encourage Edith to eat. Note intake in the care record.' },
  { id: 't-fluids', title: 'Encourage Fluids', category: 'Hydration', text: 'Offer and encourage regular drinks, and leave a drink within reach before leaving.' },
  { id: 't-med', title: 'Medication Prompt', category: 'Medications', text: 'Prompt amlodipine and offer PRN co-codamol for pain as prescribed. Record what is taken and report refusals or concerns.' },
  { id: 't-mobility', title: 'Mobility & Falls Check', category: 'General', text: 'Supervise transfers and movement with the walking frame. Do not attempt the back-door steps unaided. Check for trip hazards.' },
  { id: 't-laundry', title: 'Laundry & Bed Change', category: 'General', text: 'Help with laundry and changing bed linen, which Edith cannot manage with her frame.' },
];

const EDITH_CHAT: ChatMessage[] = [
  { from: 'ai', text: "I've summarised the assessment visit into draft sections for the Care & Support Plan, plus suggested Outcomes and Tasks. Review and edit anything, or ask me to refine a section." },
  { from: 'ai', text: "This visit also covered consent to care — I've drafted that too. See the secondary section below the Care Plan." },
  { from: 'user', text: 'Add that the physio assessed her as a high falls risk to the mobility section.' },
  { from: 'ai', text: 'Done — the Mobility section now notes she was assessed by physiotherapy as a high falls risk and cannot manage the back-door steps unaided.' },
  { from: 'user', text: "She'd prefer a female carer for personal care — make sure that's captured." },
  { from: 'ai', text: 'Captured — the Personal care section and the personal care outcome both now state that a female carer is preferred.' },
];

// Edith is a brand-new enquiry — her one visit so far covered the initial
// assessment and, incidentally, consent to care.

const EDITH_CONSENT_TRANSCRIPT: TranscriptLine[] = [
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '14:39', text: "Just before I go Edith, I need to run through consent for care — is it alright if we share information with your GP and with Susan where needed?" },
  { speaker: 'Edith', role: 'customer', time: '14:40', text: "Yes, Susan can know everything, she does anyway!" },
  { speaker: 'Susan (Daughter)', role: 'family', time: '14:40', text: "Happy to be contacted directly too if there's ever a decision needed." },
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '14:41', text: "Lovely, I'll get that recorded now." },
];

const EDITH_CONSENT_SECTIONS: AssessmentSection[] = [
  { id: 'consent-scope', title: 'Consent to care & support', target: 'Consent record', text: "Edith has given verbal consent for care and support to be provided, and for information to be shared with her GP and her daughter Susan, her primary contact." },
  { id: 'decision-making', title: 'Decision-making & capacity', target: 'Capacity check', text: "No concerns regarding capacity to consent were identified. Edith engaged clearly with the consent discussion." },
  { id: 'info-sharing', title: 'Information sharing', target: 'Info sharing', text: "Edith agreed Susan may be contacted directly regarding care decisions, including where Edith is unable to respond herself." },
];

// ─── Recordings ──────────────────────────────────────────────────────────────
// The picker at the top of the page only ever lists genuine recording-worthy
// visits (a company's own assessment/review cadence) — never the one-off
// admin documents (Consent, Receipt, Privacy, T&Cs, Customer Guide), since a
// care company wouldn't book a separate visit for those. Each recording has
// one focus document (what the supervisor selected as the basis for that
// visit) plus, optionally, other documents whose fields got incidentally
// captured in the same conversation ("secondary" — reviewed alongside the
// focus, not promoted to their own tab, so fields can be checked for
// consistency across documents from the same visit).

interface SecondaryDocument {
  id: string;
  name: string;
  sections: AssessmentSection[];
}

interface Recording {
  id: string;
  label: string; // "Initial Assessment", "6-Week Review" — the visit/cadence type
  recordingMeta: string;
  transcript: TranscriptLine[];
  focusDocumentName: string;
  isCarePlanFocus: boolean;
  focusSections: AssessmentSection[];
  focusOutcomes?: OutcomeSuggestion[];
  focusTasks?: TaskSuggestion[];
  /** Tasks this recording adds to the cumulative Care Plan even though the plan wasn't its focus (e.g. a 6-week review refining an existing plan). */
  carePlanTaskAdditions?: TaskSuggestion[];
  /** Care Plan sections rebuilt as real multi-field forms rather than one prose paragraph, keyed by CARE_PLAN_STRUCTURE id. Only populated for the sections we've recreated field-by-field so far. */
  formSections?: Record<string, FormField[]>;
  secondary: SecondaryDocument[];
  chat: ChatMessage[];
  edits: { focus: number };
}

const RECORDINGS: Record<string, Recording[]> = {
  'arthur-barrington': [
    {
      id: 'initial',
      label: 'Initial Assessment',
      recordingMeta: '14 Oct 2025 · 10:02–11:10 · 68 min',
      transcript: [...TRANSCRIPT, ...CONSENT_TRANSCRIPT_ARTHUR, ...RECEIPT_TRANSCRIPT_ARTHUR, ...PRIVACY_TRANSCRIPT_ARTHUR, ...TERMS_TRANSCRIPT_ARTHUR, ...GUIDE_TRANSCRIPT_ARTHUR],
      focusDocumentName: 'Customer Care and Support Plan',
      isCarePlanFocus: true,
      focusSections: ASSESSMENT_SECTIONS,
      focusOutcomes: SUGGESTED_OUTCOMES,
      focusTasks: SUGGESTED_TASKS,
      formSections: { 'personal-details': ARTHUR_PERSONAL_DETAILS },
      secondary: [
        { id: 'consent-care', name: 'Consent to Care', sections: CONSENT_SECTIONS_ARTHUR },
        { id: 'confirm-receipt', name: 'Confirmation of Receipt', sections: RECEIPT_SECTIONS_ARTHUR },
        { id: 'privacy', name: 'Privacy Policy', sections: PRIVACY_SECTIONS_ARTHUR },
        { id: 'terms', name: 'Terms and Conditions of Business', sections: TERMS_SECTIONS_ARTHUR },
        { id: 'customer-guide', name: 'Customer Guide – Windsor & Maidenhead', sections: GUIDE_SECTIONS_ARTHUR },
      ],
      chat: CHAT,
      edits: { focus: 4 },
    },
    {
      id: 'review6',
      label: '6-Week Review',
      recordingMeta: '25 Nov 2025 · 09:30–09:52 · 22 min',
      transcript: INSTRUCTIONS_TRANSCRIPT_ARTHUR,
      focusDocumentName: 'Confirmation of Instructions',
      isCarePlanFocus: false,
      focusSections: INSTRUCTIONS_SECTIONS_ARTHUR,
      carePlanTaskAdditions: [BP_MONITORING_TASK],
      secondary: [],
      chat: [{ from: 'ai', text: 'Confirmation of Instructions drafted — plan confirmed accurate, and a new blood pressure monitoring task added to the care plan. Consent to the plan captured.' }],
      edits: { focus: 1 },
    },
  ],
  'edith-caldwell': [
    {
      id: 'initial',
      label: 'Initial Assessment',
      recordingMeta: '7 Jul 2026 · 14:00–14:45 · 45 min',
      transcript: [...EDITH_TRANSCRIPT, ...EDITH_CONSENT_TRANSCRIPT],
      focusDocumentName: 'Customer Care and Support Plan',
      isCarePlanFocus: true,
      focusSections: EDITH_SECTIONS,
      focusOutcomes: EDITH_OUTCOMES,
      focusTasks: EDITH_TASKS,
      secondary: [
        { id: 'consent-care', name: 'Consent to Care', sections: EDITH_CONSENT_SECTIONS },
      ],
      chat: EDITH_CHAT,
      edits: { focus: 2 },
    },
  ],
};

function resolveRecordings(customerId: string): Recording[] {
  return RECORDINGS[customerId] ?? RECORDINGS['arthur-barrington'];
}

function resolveRecording(customerId: string, recordingId: string): Recording {
  const recordings = resolveRecordings(customerId);
  return recordings.find(r => r.id === recordingId) ?? recordings[0];
}

interface CarePlanItem<T> {
  item: T;
  source: string; // "Initial Assessment, 14 Oct 2025"
}

/** Merges the cumulative Suggested Outcomes & Tasks across every recording for a customer — from whichever recording(s) had the care plan as their focus, plus any tasks a later, differently-focused recording (e.g. a review) added to refine it. */
function buildCarePlan(recordings: Recording[]): {
  outcomes: CarePlanItem<OutcomeSuggestion>[];
  tasks: CarePlanItem<TaskSuggestion>[];
} {
  const outcomes: CarePlanItem<OutcomeSuggestion>[] = [];
  const tasks: CarePlanItem<TaskSuggestion>[] = [];

  for (const rec of recordings) {
    const source = `${rec.label}, ${rec.recordingMeta.split(' · ')[0]}`;
    if (rec.isCarePlanFocus) {
      rec.focusOutcomes?.forEach(item => outcomes.push({ item, source }));
      rec.focusTasks?.forEach(item => tasks.push({ item, source }));
    }
    rec.carePlanTaskAdditions?.forEach(item => tasks.push({ item, source }));
  }

  return { outcomes, tasks };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function EditableBlock({ text }: { text: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(resize, []);

  return (
    <textarea
      ref={ref}
      defaultValue={text}
      rows={1}
      onInput={resize}
      className="block w-full resize-none overflow-hidden bg-transparent text-base text-gray-700 leading-relaxed rounded-md px-2 py-1.5 -mx-2 hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[rgb(154,38,214)] transition-colors"
    />
  );
}

function AccordionSection({
  Icon,
  title,
  count,
  accent,
  edits,
  defaultOpen = true,
  children,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
  accent: string;
  edits?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 bg-white border border-gray-200 rounded-[10px] shadow-sm px-4 py-3 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <span className="text-sm font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">{count}</span>
        <div className="ml-auto flex items-center gap-2.5">
          {edits !== undefined && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-full px-2.5 py-1">
              <Pencil className="w-3 h-3" /> {edits} edits
            </span>
          )}
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
        </div>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function SectionCard({ section, badge }: { section: AssessmentSection; badge: string }) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <h4 className="text-base font-semibold text-gray-900">{section.title}</h4>
        <span className="text-sm font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded px-2 py-0.5 whitespace-nowrap">
          {badge}
        </span>
      </div>
      <EditableBlock text={section.text} />
    </div>
  );
}

function isFieldCaptured(field: FormField): boolean {
  return field.type === 'table' ? (field.rows?.length ?? 0) > 0 : !!field.value;
}

/** Captured/total field counts for a Care Plan section, whichever shape it's authored in — a real multi-field form or a single prose paragraph. `formSections` is passed in live (rather than read off `recording` directly) so counts reflect fields the reviewer has since filled in or accepted, not just the original AI draft. Returns null if the section hasn't been touched at all. */
function sectionCompletion(
  formSections: Record<string, FormField[]>,
  recording: Recording,
  itemId: string,
): { captured: number; total: number } | null {
  const form = formSections[itemId];
  if (form) {
    return { captured: form.filter(isFieldCaptured).length, total: form.length };
  }
  const prose = recording.focusSections.find(s => s.id === itemId);
  if (prose) {
    const total = CARE_PLAN_STRUCTURE.find(i => i.id === itemId)?.fieldCount ?? 1;
    return { captured: total, total };
  }
  return null;
}

/** Border/background treatment shared by every field control, reflecting its state: awaiting review (amber), captured and reviewed (plain), or still empty (dashed). */
function fieldBoxClass(captured: boolean, pending: boolean): string {
  if (pending) return 'border-2 border-amber-300 bg-amber-50/40';
  if (captured) return 'border border-gray-200 bg-white';
  return 'border border-dashed border-gray-300 bg-gray-50';
}

function EditableFormField({ field, onChange }: { field: FormField; onChange: (patch: Partial<FormField>) => void }) {
  const captured = isFieldCaptured(field);
  const pending = captured && field.reviewed === false;
  const inputClass = `w-full ${fieldBoxClass(captured, pending)} rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 placeholder:italic focus:outline-none focus:ring-1 focus:ring-[rgb(154,38,214)] focus:border-[rgb(154,38,214)] transition-colors`;

  const labelEl = field.type === 'text' || field.type === 'select'
    ? <label htmlFor={field.id} className="text-sm font-medium text-gray-700">{field.label}</label>
    : <span className="text-sm font-medium text-gray-700">{field.label}</span>;

  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        {labelEl}
        {pending && (
          <button
            type="button"
            onClick={() => onChange({ reviewed: true })}
            className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors cursor-pointer flex-shrink-0"
          >
            <Check className="w-3.5 h-3.5" /> Accept
          </button>
        )}
      </div>

      {field.type === 'text' && (
        <input
          id={field.id}
          type="text"
          value={field.value ?? ''}
          onChange={e => onChange({ value: e.target.value, reviewed: true })}
          placeholder="Not yet captured"
          className={inputClass}
        />
      )}

      {field.type === 'select' && (
        <div className="relative">
          <select
            id={field.id}
            value={field.value ?? ''}
            onChange={e => onChange({ value: e.target.value, reviewed: true })}
            className={`${inputClass} appearance-none pr-8 ${!field.value ? 'text-gray-500' : ''}`}
          >
            <option value="" disabled>Not yet captured</option>
            {field.options!.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      )}

      {field.type === 'radio' && (
        <fieldset className={`${fieldBoxClass(captured, pending)} rounded-lg px-3 py-2 flex items-center gap-5`}>
          <legend className="sr-only">{field.label}</legend>
          {['Yes', 'No'].map(opt => (
            <label key={opt} className="inline-flex items-center gap-1.5 text-sm text-gray-900 cursor-pointer">
              <input
                type="radio"
                name={field.id}
                checked={field.value === opt}
                onChange={() => onChange({ value: opt, reviewed: true })}
                className="w-4 h-4 accent-[rgb(154,38,214)] cursor-pointer"
              />
              {opt}
            </label>
          ))}
        </fieldset>
      )}

      {field.type === 'table' && (
        <EditableTableField field={field} pending={pending} captured={captured} onChange={onChange} />
      )}
    </div>
  );
}

function EditableTableField({
  field,
  pending,
  captured,
  onChange,
}: {
  field: FormField;
  pending: boolean;
  captured: boolean;
  onChange: (patch: Partial<FormField>) => void;
}) {
  const rows = field.rows ?? [];

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const next = rows.map((row, i) => (i === rowIndex ? row.map((cell, j) => (j === colIndex ? value : cell)) : row));
    onChange({ rows: next, reviewed: true });
  };

  const addRow = () => {
    onChange({ rows: [...rows, field.columns!.map(() => '')], reviewed: true });
  };

  const removeRow = (rowIndex: number) => {
    onChange({ rows: rows.filter((_, i) => i !== rowIndex) });
  };

  return (
    <div className={`${fieldBoxClass(captured, pending)} rounded-lg overflow-hidden`}>
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {field.columns!.map(col => (
                  <th key={col} className="text-left font-semibold text-gray-600 px-3 py-2 whitespace-nowrap">{col}</th>
                ))}
                <th className="w-9" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  {row.map((cell, j) => (
                    <td key={j} className="px-2 py-1.5">
                      <input
                        type="text"
                        name={`${field.id}-${i}-${j}`}
                        value={cell}
                        onChange={e => updateCell(i, j, e.target.value)}
                        aria-label={`${field.columns![j]}, row ${i + 1}`}
                        className="w-full rounded px-2 py-1 text-sm text-gray-900 bg-transparent focus:outline-none focus:ring-1 focus:ring-[rgb(154,38,214)] focus:bg-white transition-colors"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-right">
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="p-1 rounded text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors cursor-pointer"
                      aria-label="Remove row"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length === 0 && <div className="px-3 py-2 text-sm text-gray-500 italic">No entries yet</div>}
      <button
        type="button"
        onClick={addRow}
        className="w-full text-left px-3 py-2 text-sm font-medium text-[rgb(154,38,214)] hover:bg-purple-50 border-t border-gray-200 transition-colors cursor-pointer"
      >
        + Add row
      </button>
    </div>
  );
}

/**
 * Renders a genuinely multi-field section (e.g. Personal details) as real,
 * editable form controls. Fields CareBridge drafted from the recording start
 * flagged for manual review (amber) until accepted individually, in bulk, or
 * implicitly by editing them — fields the reviewer types in themselves need
 * no separate accept step, since typing them in is itself the review.
 */
function FormFieldsView({ fields, onChange }: { fields: FormField[]; onChange: (fields: FormField[]) => void }) {
  const updateField = (id: string, patch: Partial<FormField>) => {
    onChange(fields.map(f => (f.id === id ? { ...f, ...patch } : f)));
  };

  const pendingFields = fields.filter(f => isFieldCaptured(f) && f.reviewed === false);

  const acceptAll = () => {
    onChange(fields.map(f => (isFieldCaptured(f) && f.reviewed === false ? { ...f, reviewed: true } : f)));
  };

  return (
    <div>
      {pendingFields.length > 0 && (
        <div className="flex items-center justify-between gap-3 mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{pendingFields.length} {pendingFields.length === 1 ? 'field' : 'fields'}</span> drafted by CareBridge from this recording — review and accept.
          </p>
          <Button variant="secondary" size="sm" icon={<Check className="w-3.5 h-3.5" />} onClick={acceptAll}>
            Accept all
          </Button>
        </div>
      )}
      {fields.map(field => (
        <EditableFormField key={field.id} field={field} onChange={patch => updateField(field.id, patch)} />
      ))}
    </div>
  );
}

/**
 * The Care & Support Plan's real "multi-document" view — a left-hand section
 * nav grouped Hospital passport / Care plan / Assessments, matching how it
 * renders in its own part of the real system, instead of stacked accordions.
 * Sections without a recording behind them yet show as pending, since this
 * is the true full structure, not just what's been captured so far.
 */
function CarePlanMultiDocView({ recording }: { recording: Recording }) {
  // Local, live copy of the recording's form sections — lets edits and accepts
  // made while reviewing (see FormFieldsView) immediately update the capture
  // counts and badges below, not just the field itself.
  const [formSections, setFormSections] = useState<Record<string, FormField[]>>(recording.formSections ?? {});

  const firstWithContent = CARE_PLAN_STRUCTURE.find(item => sectionCompletion(formSections, recording, item.id)) ?? CARE_PLAN_STRUCTURE[0];
  const [selectedId, setSelectedId] = useState(firstWithContent.id);

  // Jump back to the first captured section, and reload the live form data, whenever the recording changes.
  useEffect(() => {
    setFormSections(recording.formSections ?? {});
    setSelectedId((CARE_PLAN_STRUCTURE.find(item => sectionCompletion(recording.formSections ?? {}, recording, item.id)) ?? CARE_PLAN_STRUCTURE[0]).id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording.id]);

  const selectedItem = CARE_PLAN_STRUCTURE.find(item => item.id === selectedId) ?? CARE_PLAN_STRUCTURE[0];
  const selectedFormFields = formSections[selectedId];
  const selectedContent = recording.focusSections.find(s => s.id === selectedId);
  const capturedCount = CARE_PLAN_STRUCTURE.filter(item => sectionCompletion(formSections, recording, item.id)).length;

  return (
    <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden flex">
      {/* Left nav */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200 overflow-y-auto">
        <div className="h-11 flex items-center px-4 border-b border-gray-200 bg-gray-50">
          <span className="text-sm font-semibold text-gray-500">{capturedCount} of {CARE_PLAN_STRUCTURE.length} sections captured</span>
        </div>
        {CARE_PLAN_GROUPS.map(group => (
          <div key={group}>
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm font-bold text-gray-600">{group}</div>
            {CARE_PLAN_STRUCTURE.filter(item => item.group === group).map(item => {
              const isActive = item.id === selectedId;
              const completion = sectionCompletion(formSections, recording, item.id);
              const hasContent = !!completion;
              const isPartial = !!completion && completion.captured < completion.total;
              const needsReview = !!formSections[item.id]?.some(f => isFieldCaptured(f) && f.reviewed === false);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm border-b border-gray-100 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[rgb(154,38,214)] text-white font-medium'
                      : hasContent
                        ? 'text-[rgb(109,27,152)] hover:bg-purple-50'
                        : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      isActive ? 'bg-white' : needsReview ? 'bg-amber-500' : hasContent ? 'bg-[rgb(154,38,214)]' : 'bg-gray-300'
                    }`}
                  />
                  <span className="flex-1 min-w-0">{item.label}</span>
                  {completion && (
                    <span
                      className={`flex-shrink-0 text-sm font-semibold rounded-full px-2 py-0.5 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : isPartial
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-purple-100 text-[rgb(109,27,152)]'
                      }`}
                    >
                      {completion.captured}/{completion.total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Selected section content */}
      <div className="flex-1 min-w-0">
        <div className="h-11 flex items-center justify-center px-5 border-b border-gray-200 bg-gray-50">
          <span className="text-sm font-semibold text-gray-900">{selectedItem.label}</span>
        </div>
        <div className="p-5">
          {selectedFormFields ? (
            <FormFieldsView
              fields={selectedFormFields}
              onChange={updated => setFormSections(prev => ({ ...prev, [selectedId]: updated }))}
            />
          ) : selectedContent ? (
            <>
              <EditableBlock text={selectedContent.text} />
              {selectedContent.promptingQuestions && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-500 mb-1.5">Prompting questions</p>
                  <ul className="space-y-1">
                    {selectedContent.promptingQuestions.map((q, i) => (
                      <li key={i} className="text-sm text-gray-400">{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg border border-dashed border-gray-300 py-16 text-center">
              <p className="text-sm text-gray-500">Not yet captured</p>
              <p className="text-sm text-gray-400 mt-1">This section hasn't been covered in a recording yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── This Recording — focus document + secondary documents from the same visit ──

function RecordingSummaryView({ recording, hasCarePlan }: { recording: Recording; hasCarePlan: boolean }) {
  const bannerText = !recording.isCarePlanFocus
    ? `Draft generated from the ${recording.label} recording. Review and edit inline, then confirm to save it to the customer file.`
    : hasCarePlan
      ? `This recording informed the current care plan (${recording.recordingMeta.split(' · ')[0]}). Review a reassessment below and suggest updates to the existing plan.`
      : 'Draft generated from the assessment visit recording. Nothing has been saved to the care plan yet — review, edit inline, then pre-fill the assessment and care plan.';

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-2.5 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
        <Info className="w-4 h-4 text-[rgb(154,38,214)] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-purple-900">{bannerText}</p>
      </div>

      {/* Focus document — the basis this recording was made for, prominent */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center text-sm font-bold uppercase tracking-wide text-[rgb(109,27,152)] bg-purple-100 rounded-full px-2.5 py-1">
            Focus of this visit
          </span>
          <span className="text-sm text-gray-500">Recorded {recording.recordingMeta.split(' · ')[0]}</span>
        </div>

        {recording.isCarePlanFocus ? (
          <CarePlanMultiDocView recording={recording} />
        ) : (
          <AccordionSection Icon={FileText} title={recording.focusDocumentName} count={recording.focusSections.length} accent="bg-slate-100 text-slate-600" edits={recording.edits.focus}>
            <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm divide-y divide-gray-200 overflow-hidden">
              {recording.focusSections.map(section => (
                <SectionCard key={section.id} section={section} badge={`${recording.focusDocumentName}${section.target ? ` · ${section.target}` : ''}`} />
              ))}
            </div>
          </AccordionSection>
        )}
      </div>

      {/* Secondary documents — de-emphasised, collapsed by default; lets the reviewer
          check fields (contact details, medication names) match across documents
          from the same visit without them being confused with the focus. */}
      {recording.secondary.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">Also captured in this conversation</h3>
          <div className="space-y-3">
            {recording.secondary.map(doc => (
              <AccordionSection key={doc.id} Icon={FileText} title={doc.name} count={doc.sections.length} accent="bg-gray-100 text-gray-500" defaultOpen={false}>
                <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm divide-y divide-gray-200 overflow-hidden">
                  {doc.sections.map(section => (
                    <SectionCard key={section.id} section={section} badge={`${doc.name}${section.target ? ` · ${section.target}` : ''}`} />
                  ))}
                </div>
              </AccordionSection>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Care Plan Draft — cumulative, refined across every contributing recording ──

function CarePlanView({ carePlan, hasCarePlan }: { carePlan: ReturnType<typeof buildCarePlan>; hasCarePlan: boolean }) {
  const bannerText = hasCarePlan
    ? 'These are the current Suggested Outcomes and Tasks — built up and refined from every contributing recording. Review and suggest updates to the existing plan.'
    : 'Draft Suggested Outcomes and Tasks built from the assessment recording so far. Nothing has been saved to the care plan yet — review, edit inline, then pre-fill the assessment and care plan.';

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-2.5 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
        <Info className="w-4 h-4 text-[rgb(154,38,214)] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-purple-900">{bannerText}</p>
      </div>

      <AccordionSection Icon={Target} title="Suggested Outcomes" count={carePlan.outcomes.length} accent="bg-amber-100 text-amber-700">
        <div className="space-y-3">
          {carePlan.outcomes.map(({ item, source }) => (
            <div key={item.id} className="bg-white rounded-[10px] border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <OutcomeBadge title={item.title} />
                <span className="text-sm text-gray-400 whitespace-nowrap">{source}</span>
              </div>
              <EditableBlock text={item.text} />
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection Icon={ListChecks} title="Suggested Tasks" count={carePlan.tasks.length} accent="bg-purple-100 text-[rgb(109,27,152)]">
        <div className="space-y-3">
          {carePlan.tasks.map(({ item, source }) => (
            <div key={item.id} className="bg-white rounded-[10px] border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <TaskBadge title={item.title} category={item.category} />
                <span className="text-sm text-gray-400 whitespace-nowrap">{source}</span>
              </div>
              <EditableBlock text={item.text} />
            </div>
          ))}
        </div>
      </AccordionSection>
    </div>
  );
}

// ─── Transcript view ──────────────────────────────────────────────────────────

const roleStyle: Record<TranscriptLine['role'], string> = {
  assessor: 'text-[rgb(154,38,214)]',
  customer: 'text-gray-900',
  family: 'text-sky-700',
};

const roleAvatarColor: Record<TranscriptLine['role'], string> = {
  assessor: 'bg-purple-100 text-[rgb(109,27,152)]',
  customer: '', // overridden with the customer's own initials/colour, see speakerAvatarColor
  family: 'bg-sky-100 text-sky-700',
};

/** Speaker avatars reuse the customer's existing initials/colour (CustomerProfile) for their own lines, and a short derived initial for the assessor/family lines the transcript doesn't have full records for. */
function speakerInitials(line: TranscriptLine, customer: CustomerProfile): string {
  if (line.role === 'customer') return customer.initials;
  return line.speaker.replace(/\s*\([^)]*\)/, '').trim().slice(0, 2).toUpperCase();
}

function speakerAvatarColor(line: TranscriptLine, customer: CustomerProfile): string {
  return line.role === 'customer' ? customer.initialsColor : roleAvatarColor[line.role];
}

function formatClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Recording duration in seconds, parsed from the trailing "· 39 min" segment of recordingMeta. */
function durationSeconds(recordingMeta: string): number {
  const last = recordingMeta.split(' · ').pop() ?? '';
  return (parseInt(last, 10) || 0) * 60;
}

function RecordingPlayer({ recordingMeta }: { recordingMeta: string }) {
  const total = durationSeconds(recordingMeta);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Reset playback state when the selected recording changes.
  useEffect(() => {
    setPlaying(false);
    setElapsed(0);
  }, [recordingMeta]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= total) {
          setPlaying(false);
          return total;
        }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [playing, total]);

  const pct = total ? Math.min(100, (elapsed / total) * 100) : 0;

  const seekToClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el || !total) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setElapsed(Math.round(ratio * total));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    seekToClientX(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    seekToClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => {
            if (elapsed >= total) setElapsed(0);
            setPlaying(p => !p);
          }}
          className="w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer"
          aria-label={playing ? 'Pause recording' : 'Play recording'}
        >
          {playing ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5 ml-0.5" fill="currentColor" />}
        </button>

        <div
          ref={trackRef}
          className="relative flex-1 min-w-0 h-16 cursor-pointer touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="absolute inset-0 text-gray-300">
            <Waveform className="w-full h-full" />
          </div>
          <div
            className={`absolute inset-0 text-[rgb(154,38,214)] ${isDragging ? '' : 'transition-[clip-path] duration-300'}`}
            style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
          >
            <Waveform className="w-full h-full" />
          </div>
          {pct > 0 && (
            <div
              className={`absolute top-0 bottom-0 w-0.5 bg-[rgb(154,38,214)] pointer-events-none ${isDragging ? '' : 'transition-[left] duration-300'}`}
              style={{ left: `${pct}%` }}
            >
              <span
                className={`absolute -top-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[rgb(154,38,214)] shadow-sm border-2 border-white transition-transform ${isDragging ? 'scale-125' : ''}`}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pl-[60px]">
        <span className="text-sm font-semibold text-gray-900 tabular-nums">{formatClock(elapsed)}</span>
        <span className="text-sm text-gray-400 tabular-nums">{formatClock(total)}</span>
      </div>

      <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-start gap-1.5 text-sm text-gray-500">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>Recording available for 60 days — the transcript remains available after that.</span>
        </div>
        <button type="button" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer flex-shrink-0">
          <Download className="w-3.5 h-3.5" /> Download recording
        </button>
      </div>
    </div>
  );
}

function TranscriptView({ recording, customer }: { recording: Recording; customer: CustomerProfile }) {
  return (
    <div className="space-y-4">
      <RecordingPlayer recordingMeta={recording.recordingMeta} />

      <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50 rounded-t-[10px]">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-900">{recording.label} recording</span>
          </div>
          <span className="text-sm text-gray-500">{recording.recordingMeta}</span>
        </div>
        <div className="divide-y divide-gray-100">
          {recording.transcript.map((line, i) => (
            <div key={i} className="px-5 py-3.5 flex gap-3">
              <span className="text-sm text-gray-400 tabular-nums pt-2.5 w-10 flex-shrink-0">{line.time}</span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${speakerAvatarColor(line, customer)}`}>
                {speakerInitials(line, customer)}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold mb-0.5 ${roleStyle[line.role]}`}>{line.speaker}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{line.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Chat panel ───────────────────────────────────────────────────────────────

function ChatPanel({ chat, onClose }: { chat: ChatMessage[]; onClose: () => void }) {
  const scrolled = useScrolled();
  return (
    <div
      className={`bg-white rounded-[10px] border border-gray-200 shadow-sm flex flex-col min-h-[420px] sticky transition-all duration-300 ${
        scrolled ? 'top-[236px] h-[calc(100vh-324px)]' : 'top-[252px] h-[calc(100vh-340px)]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[rgb(154,38,214)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">CareBridge Assistant</p>
          <p className="text-sm text-gray-500 leading-tight">Refine any section or ask for detail</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer flex-shrink-0"
          aria-label="Hide CareBridge Assistant"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {chat.map((m, i) =>
          m.from === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="relative max-w-[85%] text-sm leading-relaxed rounded-2xl rounded-br-none bg-[rgb(154,38,214)] text-white px-3.5 py-2.5">
                {m.text}
                {/* Tail flick — triangle out the side, flat bottom on the base */}
                <span
                  className="absolute bottom-0 left-full w-2 h-2 bg-[rgb(154,38,214)]"
                  style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }}
                />
              </div>
            </div>
          ) : (
            <div key={i} className="text-sm text-gray-800 leading-relaxed">
              <p>{m.text}</p>
              <div className="flex items-center gap-0.5 mt-1.5 text-gray-400">
                <button className="p-1 rounded hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer" aria-label="Good response">
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button className="p-1 rounded hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer" aria-label="Bad response">
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
                <button className="p-1 rounded hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer" aria-label="Copy">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 pl-4 pr-1.5 py-1.5 focus-within:border-[rgb(154,38,214)] focus-within:ring-1 focus-within:ring-[rgb(154,38,214)]">
          <input
            type="text"
            placeholder="Ask CareBridge to refine a section…"
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          <button className="w-8 h-8 rounded-full bg-[rgb(154,38,214)] text-white flex items-center justify-center hover:bg-[rgb(130,28,190)] transition-colors cursor-pointer flex-shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-400 text-center mt-2">AI can make mistakes. Always check important information.</p>
      </div>
    </div>
  );
}

// ─── Recording picker ───────────────────────────────────────────────────────

function RecordingPicker({ recordings, recordingId, onChange }: { recordings: Recording[]; recordingId: string; onChange: (id: string) => void }) {
  const selected = recordings.find(r => r.id === recordingId) ?? recordings[0];

  return (
    <DropdownMenu>
      <div className="relative inline-flex">
        {/* Invisible sizer — reserves width for the longest possible recording label so the trigger doesn't resize as the selection changes. */}
        <span aria-hidden="true" className="invisible flex items-center gap-2 h-9 pl-3 pr-2.5 text-sm font-medium whitespace-nowrap">
          <Mic className="w-4 h-4 flex-shrink-0" />
          {LONGEST_RECORDING_LABEL}
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        </span>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="absolute inset-0 h-9 inline-flex items-center gap-2 rounded-lg border border-[rgb(154,38,214)] bg-white pl-3 pr-2.5 text-sm font-medium text-gray-700 hover:border-[rgb(130,28,190)] transition-colors cursor-pointer"
          >
            <Mic className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate flex-1 min-w-0">{selected?.label}</span>
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
        </DropdownMenuTrigger>
      </div>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Recordings for this customer</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recordings.map(r => (
          <DropdownMenuItem
            key={r.id}
            onSelect={() => onChange(r.id)}
            className="flex items-center justify-between gap-3 py-2"
          >
            <span className="text-gray-900">{r.label}</span>
            <span className="text-sm text-gray-400 whitespace-nowrap flex-shrink-0">
              {r.recordingMeta.split(' · ')[0]}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'recording' | 'careplan';
type View = 'summary' | 'transcript';

const TABS: { id: Tab; label: string }[] = [
  { id: 'recording', label: 'Recordings' },
  { id: 'careplan', label: 'Draft Care Plan' },
];

const CareBridgeContext = createContext<{
  tab: Tab;
  setTab: (t: Tab) => void;
  view: View;
  setView: (v: View) => void;
  recordingId: string;
  setRecordingId: (id: string) => void;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
}>({
  tab: 'recording',
  setTab: () => {},
  view: 'summary',
  setView: () => {},
  recordingId: 'initial',
  setRecordingId: () => {},
  chatOpen: false,
  setChatOpen: () => {},
});

export function CareBridgeProvider({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState<Tab>('recording');
  const [view, setView] = useState<View>('summary');
  const [recordingId, setRecordingId] = useState('initial');
  // Descoped from the default view for now — see the floating launcher in
  // CareBridgePage. Hidden by default; the reviewer opts back in per visit.
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <CareBridgeContext.Provider value={{ tab, setTab, view, setView, recordingId, setRecordingId, chatOpen, setChatOpen }}>
      {children}
    </CareBridgeContext.Provider>
  );
}

export function CareBridgeSubnav() {
  const { tab, setTab, view, setView, recordingId, setRecordingId } = useContext(CareBridgeContext);
  const scrolled = useScrolled();
  const customer = useCustomer();
  const recordings = resolveRecordings(customer.id);

  // Guard against a recording picked for a previously-viewed customer that
  // doesn't exist for this one (e.g. following a link between customers).
  useEffect(() => {
    if (!recordings.find(r => r.id === recordingId)) {
      setRecordingId(recordings[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.id]);

  const currentRecording = recordings.find(r => r.id === recordingId) ?? recordings[0];
  const carePlanCtaLabel = customer.hasCarePlan ? 'Suggest updates to care plan' : 'Pre-fill assessment & care plan';
  const ctaLabel = tab === 'careplan'
    ? carePlanCtaLabel
    : currentRecording.isCarePlanFocus
      ? carePlanCtaLabel
      : 'Save to customer file';

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      {/* Primary tabs — This Recording vs the cumulative Care Plan Draft */}
      <div className={`max-w-[1600px] w-full mx-auto px-6 flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3.5'}`}>
        <nav className="flex gap-6">
          {TABS.map(({ id, label }) => {
            const isActive = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`relative pb-2 px-1 text-sm transition-colors cursor-pointer whitespace-nowrap ${
                  isActive ? 'text-gray-900 font-semibold' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
                {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgb(154,38,214)]" />}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="tertiary">Discard draft</Button>
          <Button icon={<ArrowRight className="w-4 h-4" />}>{ctaLabel}</Button>
        </div>
      </div>

      {/* Secondary controls — only meaningful within This Recording */}
      {tab === 'recording' && (
        <div className={`max-w-[1600px] w-full mx-auto px-6 flex items-center gap-3 border-t border-gray-200 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3'}`}>
          <RecordingPicker recordings={recordings} recordingId={currentRecording.id} onChange={setRecordingId} />

          <div className="h-9 inline-flex items-center rounded-lg border border-[rgb(154,38,214)] bg-white p-1">
            {(['summary', 'transcript'] as View[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`h-7 inline-flex items-center px-3.5 text-sm font-medium rounded-[6px] transition-colors cursor-pointer ${
                  view === v ? 'bg-[rgb(154,38,214)] text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {v === 'summary' ? 'Summary' : 'Original transcript'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CareBridgePage() {
  const { tab, view, recordingId, chatOpen, setChatOpen } = useContext(CareBridgeContext);
  const customer = useCustomer();
  const recordings = resolveRecordings(customer.id);
  const recording = resolveRecording(customer.id, recordingId);

  let mainContent: React.ReactNode;
  let chat: ChatMessage[] | null;

  if (tab === 'careplan') {
    // No single recording backs the cumulative draft — use the most recent
    // care-plan-focused recording's chat thread as the assistant's context.
    mainContent = <CarePlanView carePlan={buildCarePlan(recordings)} hasCarePlan={customer.hasCarePlan} />;
    chat = ([...recordings].reverse().find(r => r.isCarePlanFocus) ?? recordings[0]).chat;
  } else {
    mainContent = view === 'summary'
      ? <RecordingSummaryView recording={recording} hasCarePlan={customer.hasCarePlan} />
      : <TranscriptView recording={recording} customer={customer} />;
    // The assistant refines the summarised draft — no utility against the raw transcript, so it's unavailable there.
    chat = view === 'summary' ? recording.chat : null;
  }

  const showPanel = chatOpen && chat !== null;

  return (
    <>
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">{mainContent}</div>
        {showPanel && (
          <div className="w-[360px] flex-shrink-0">
            <ChatPanel chat={chat!} onClose={() => setChatOpen(false)} />
          </div>
        )}
      </div>

      {/* Docked to the whole screen, not the content column — descoped from the
          default view (see feedback), kept available one click away. */}
      {!showPanel && chat !== null && (
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[rgb(154,38,214)] text-white shadow-lg hover:bg-[rgb(130,28,190)] transition-colors cursor-pointer flex items-center justify-center"
          aria-label="Open CareBridge Assistant"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}
    </>
  );
}
