import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { FileText, Target, ListChecks, Sparkles, Send, Mic, Upload, ArrowRight, Info, Pencil, ThumbsUp, ThumbsDown, Copy, ChevronDown, Play, Pause, Download, X, Check, Search } from 'lucide-react';
import { Button } from '../buttons/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { useScrolled } from '../../hooks/useScrolled';
import { useCustomer } from '../../data/CustomerContext';
import { veraise } from '../../data/vera-from-edith';
import type { CustomerProfile } from '../../data/customers';
import { OutcomeBadge, TaskBadge } from './caremanagement/shared';
import type { TaskCategory } from './caremanagement/types';
import { Waveform } from '../icons/Waveform';
import { SubnavTabs } from '../tabs/SubnavTabs';


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

/** Static instructional banner shown above a section's fields, same wording regardless of customer — not customer-drafted content, so it's never part of any FormField/AssessmentSection and is never "reviewed". */
const SECTION_INTROS: Partial<Record<string, string>> = {
  'section-6': 'Please read the Medical History section in the customer file in conjunction with this plan, for details of my medical diagnosis, how this affects me and any medical interventions that are currently in place.',
};

// ─── Demo data — Arthur Barrington's initial care assessment ─────────────────────
// Arthur is the demo persona for Assessment Hero (2026-09-07). His initial
// assessment used to be its own hand-written, fully-reviewed story
// (vascular dementia, Hydromol ointment) — reused elsewhere already, e.g.
// Care Management's own separate, static live plan for him — but with
// nothing left pending it couldn't show the AI-draft review workflow
// Assessment Hero exists to demo. This is Edith Caldwell's own assessment
// (see the note above EDITH_TRANSCRIPT) re-skinned to Arthur's name, family
// and gender instead: same hip-fracture/arthritis/falls-risk story, same
// pending-review state (nothing yet accepted), David (son) standing in for
// Edith's daughter Susan, "a man" not "a lady" for the personal-care
// preference. The secondary documents below (Consent to Care, Confirmation
// of Receipt, Privacy Policy, Terms and Conditions, Customer Guide) are
// untouched — they never referenced Edith's specific story and were already
// genuinely Arthur's own.

interface TranscriptLine {
  speaker: string;
  role: 'assessor' | 'customer' | 'family';
  time: string;
  text: string;
}

const TRANSCRIPT: TranscriptLine[] = [
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '10:00', text: "Before I get started properly, would you both mind saying your names for the recording? I'll start — I'm Sharon, from the care team." },
  { speaker: 'Arthur', role: 'customer', time: '10:00', text: "I'm Arthur." },
  { speaker: 'David (Son)', role: 'family', time: '10:00', text: "And I'm David, Arthur's son." },
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '10:01', text: "Hello Arthur, I'm Sharon from the care team — thanks for seeing me. David, good to meet you too. I'd like to understand how things have been since you came home." },
  { speaker: 'David (Son)', role: 'family', time: '10:02', text: "Dad was in hospital for three weeks after a fall at home — he fractured his hip. He's home now but nowhere near as steady, and I'm worried about him managing on his own. My number's 07980 077250." },
  { speaker: 'Arthur', role: 'customer', time: '10:03', text: "I've lived in this house forty years and I intend to stay. I've always done for myself, but since the fall I can't manage the way I used to, and that frustrates me." },
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '10:05', text: "That's exactly what we're here to help with. Can you tell me about your health?" },
  { speaker: 'Arthur', role: 'customer', time: '10:06', text: "I've arthritis in my hands and knees, and now the hip. I take a tablet for my blood pressure — amlodipine — and some co-codamol when the pain's bad, but I don't always remember them." },
  { speaker: 'David (Son)', role: 'family', time: '10:07', text: "That's a worry — he forgets his tablets, and sometimes forgets whether he's eaten. His memory comes and goes, especially in the afternoons." },
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '10:08', text: "We can prompt his medication and keep a record. How are you managing with washing and dressing, Arthur?" },
  { speaker: 'Arthur', role: 'customer', time: '10:09', text: "My top half I'm alright, but I can't manage my legs and feet since the hip, and dressing is a struggle. I'd rather a man helped me with that." },
  { speaker: 'Arthur', role: 'customer', time: '10:11', text: "And I can't stand long enough to cook now. I've been having biscuits and not much else, if I'm honest — and I don't drink enough, I forget." },
  { speaker: 'David (Son)', role: 'family', time: '10:12', text: "I'd like someone to make him a proper breakfast and lunch and leave a drink out. I do the evenings when I finish work." },
  { speaker: 'Arthur', role: 'customer', time: '10:13', text: "I use my frame indoors. There are two steps down to the back door and I daren't do them on my own now." },
  { speaker: 'David (Son)', role: 'family', time: '10:14', text: "The physio said he's a high falls risk. That's my biggest worry." },
  { speaker: 'Arthur', role: 'customer', time: '10:16', text: "The laundry and changing my bed too — I can't carry things with the frame. I'd be grateful if someone could see to that." },
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '10:17', text: "That's really helpful, thank you. What about hobbies, or things you enjoy doing day to day?" },
  { speaker: 'Arthur', role: 'customer', time: '10:18', text: "I like a game of cards, though my hands aren't as quick as they were with the arthritis. I listen to the radio a lot, and I look forward to David popping in of an evening." },
  { speaker: 'David (Son)', role: 'family', time: '10:19', text: "He used to play cards with his neighbour Reg every Thursday — he's missed it since the fall." },
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '10:20', text: "Would you like any support to get back to that once you're steadier on your feet?" },
  { speaker: 'Arthur', role: 'customer', time: '10:21', text: "I would, if someone wouldn't mind coming with me the first few times, just in case." },
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '10:23', text: "Thank you both, that's given me a really good picture. I'll write this up and the office will be in touch about start dates." },
  { speaker: 'David (Son)', role: 'family', time: '10:23', text: "Thanks Sharon, we appreciate it." },
  { speaker: 'Arthur', role: 'customer', time: '10:24', text: "Thank you for coming out." },
];

interface AssessmentSection {
  id: string;
  title: string;
  target?: string;
  text: string;
  /** Reference interview questions shown under a drafted section — what the recording was listened for. Care Plan sections only. */
  promptingQuestions?: string[];
  /** false = CareBridge drafted this section from the recording and it hasn't been manually accepted yet. Undefined where there's nothing to review (e.g. secondary-document sections not yet wired up to this workflow). */
  reviewed?: boolean;
  /** Where in the recording's transcript this section was drafted from — powers "Check transcript". */
  sourceLines?: TranscriptReference[];
}

/** A transcript line this field's content was drafted from, and optionally the exact substring of that line's text to highlight — lets "Check transcript" point at precisely the words that generated the value, not just the line. */
interface TranscriptReference {
  index: number;
  highlight?: string;
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
export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox-group' | 'table';
  value?: string;
  values?: string[]; // checkbox-group only — multiple boxes may be ticked at once
  options?: string[]; // select/checkbox-group only
  columns?: string[]; // table only
  rows?: string[][]; // table only
  /** Small standing note shown under the control (e.g. "If you have checked more than one box, explain why in the details") — unlike promptingQuestions, shown regardless of review state since it's guidance for filling the field in, not a source reference. */
  helpText?: string;
  /** Reference interview questions shown under the field, same idea as AssessmentSection.promptingQuestions but scoped to a single form field rather than a whole section. */
  promptingQuestions?: string[];
  /** false = CareBridge drafted this from the recording and it hasn't been manually accepted yet. Undefined for fields with no captured content — nothing to review. Set true once a reviewer accepts it, or automatically the moment they edit it themselves. */
  reviewed?: boolean;
  /** Who/when accepted this field (explicitly via "Accept", or implicitly by editing it) — set alongside `reviewed: true`, shown in the accepted-state banner as a lightweight audit trail. */
  reviewedBy?: string;
  reviewedAt?: string;
  /** Where in the recording's transcript this field was drafted from — lets a reviewer jump straight to the source via "Check transcript". Undefined for fields with nothing to trace (not drafted from this recording). */
  sourceLines?: TranscriptReference[];
}

// The logged-in reviewer accepting/editing a field — matches TopNav's own
// default `userName` prop, since there's no real auth/session to read from.
const CURRENT_USER = 'Alex Morgan';

/** "7 Aug 2026, 14:32" — stamped onto a field the moment it's accepted (explicitly, or implicitly by editing it). */
function formatAcceptedAt(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'short' });
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${day} ${month} ${year}, ${time}`;
}

// IDs match CARE_PLAN_STRUCTURE below (the real document's section taxonomy),
// so these render in the left-nav multi-doc view rather than as accordions.
const ASSESSMENT_SECTIONS: AssessmentSection[] = [
  {
    id: 'section-1',
    title: 'Section 1 - Profile and background',
    text: 'Arthur has lived in his own home in Sutton Coldfield for forty years and is determined to remain there. Recently discharged after a three-week hospital admission for a fractured hip following a fall at home. Used to managing alone and finding reduced independence frustrating. Son David is the main contact (07980 077250) and visits in the evenings after work.',
    promptingQuestions: [
      'Can you tell me about your family background?',
      'Who are the important people in your life?',
      'How have things been since you came home?',
    ],
    reviewed: false,
    sourceLines: [
      { index: 5, highlight: "I've lived in this house forty years and I intend to stay" },
      { index: 4, highlight: "My number's 07980 077250" },
    ],
  },
  {
    id: 'section-2',
    title: 'Section 2 - Personal care and daily routine',
    text: `My top half I can manage, but I can't manage my legs and feet since the hip, and dressing is a struggle — I'd rather a man helped me with that.

I've always looked after myself and I don't want to feel like people are taking over — I'd like to stay as involved as I can, even where I need a hand with the parts I can't manage.

I do get frustrated some days that I can't do what I used to, so please bear with me if I seem a bit short — it's not personal, I just miss being able to get on with things myself.

Good Practice Guidance for Staff
- Support with washing and dressing the lower half and feet; let me manage my top half myself.
- Male carer preferred for personal care.
- Explain what you're doing and let me help where I can, rather than just taking over.
- Be patient if I seem frustrated — it's the loss of independence, not the carer.`,
    promptingQuestions: [
      'How are you managing with washing and dressing?',
      'Do you have a preference for a male or female carer?',
      'Is there a particular way we should approach you if you seem frustrated?',
    ],
    reviewed: false,
    sourceLines: [
      { index: 10, highlight: "My top half I'm alright, but I can't manage my legs and feet since the hip, and dressing is a struggle. I'd rather a man helped me with that" },
    ],
  },
  {
    id: 'section-3',
    title: 'Section 3 - Activities, exercise and socialising',
    text: "Enjoys a game of cards, though finds it slower going since his arthritis, and listens to the radio regularly. Values his son David's evening visits. Previously played cards with his neighbour Reg every Thursday but has not been able to go since the fall. Would welcome someone to accompany him back for the first few sessions while he regains his confidence.",
    promptingQuestions: [
      'What do you enjoy doing day to day?',
      'Do you see friends, family or neighbours regularly?',
      'Would you like any support to keep doing the things you enjoy?',
    ],
    reviewed: false,
    sourceLines: [
      { index: 17, highlight: "I like a game of cards, though my hands aren't as quick as they were with the arthritis" },
      { index: 20, highlight: "I would, if someone wouldn't mind coming with me the first few times" },
    ],
  },
  {
    id: 'section-4',
    title: 'Section 4 - Nutrition and hydration',
    text: 'Unable to stand long enough to prepare meals since the fall and has been under-eating (mainly biscuits). Poor fluid intake and forgets to drink. Requires a prepared breakfast and lunch, encouragement with food and fluids, and a drink left within reach. Son covers evening meals.',
    promptingQuestions: [
      'How are you managing with meals and drinks?',
      'Are you able to prepare food for yourself?',
    ],
    reviewed: false,
    sourceLines: [
      { index: 11, highlight: "I can't stand long enough to cook now. I've been having biscuits and not much else" },
      { index: 12, highlight: 'make him a proper breakfast and lunch and leave a drink out' },
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
    reviewed: false,
    sourceLines: [
      { index: 13, highlight: 'I use my frame indoors. There are two steps down to the back door' },
      { index: 14, highlight: "The physio said he's a high falls risk" },
    ],
  },
  {
    id: 'section-6',
    title: 'Section 6 - Health and medication',
    text: 'Osteoarthritis affecting hands, knees and now the hip, with ongoing pain. Prescribed amlodipine for hypertension and co-codamol PRN for pain. Does not reliably remember to take medication and requires prompting and recording. Consistent with his existing memory difficulties, most noticeable in the afternoons — to be monitored.',
    promptingQuestions: [
      'Can you tell me about your health?',
      'What medication are you taking, and do you remember to take it?',
    ],
    reviewed: false,
    sourceLines: [
      { index: 7, highlight: "I take a tablet for my blood pressure — amlodipine — and some co-codamol when the pain's bad" },
      { index: 8, highlight: "he forgets his tablets, and sometimes forgets whether he's eaten" },
    ],
  },
  {
    id: 'section-7',
    title: 'Section 7 - Domestic support',
    text: 'Unable to carry items while using his frame. Requires help with laundry and changing bed linen. Support to be offered in a way that respects his independence and pride in his home.',
    promptingQuestions: [
      'Is there any help you need around the home, like laundry?',
      'Are you able to carry things safely with your frame?',
    ],
    reviewed: false,
    sourceLines: [
      { index: 15, highlight: "The laundry and changing my bed too — I can't carry things with the frame" },
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

// Fields the recording actually covered are marked `reviewed: false` — an
// AI draft awaiting a reviewer's Accept, matching the pending-review demo
// state this assessment exists to show off. Fields it didn't cover (e.g.
// DNACPR was never raised at this visit) are left uncaptured, ready for the
// reviewer to fill in themselves.
const ARTHUR_PERSONAL_DETAILS: FormField[] = [
  { id: 'language', label: 'What language would you prefer this assessment to be carried out in?', type: 'select', options: LANGUAGE_OPTIONS },
  { id: 'known-as', label: 'Known as', type: 'text', value: 'Arthur', reviewed: false, sourceLines: [{ index: 1, highlight: 'Arthur' }] },
  { id: 'pronouns', label: 'Preferred pronouns', type: 'select', options: PRONOUN_OPTIONS, value: 'He/Him', reviewed: false, sourceLines: [{ index: 4, highlight: 'Dad' }] },
  { id: 'gender-description', label: 'Which of these most accurately describes you?', type: 'select', options: GENDER_DESCRIPTION_OPTIONS, value: 'Man', reviewed: false, sourceLines: [{ index: 4, highlight: 'Dad' }] },
  { id: 'sexual-orientation', label: 'Sexual orientation', type: 'select', options: SEXUAL_ORIENTATION_OPTIONS },
  { id: 'allergies', label: 'Allergies', type: 'table', columns: ['Allergy', 'Symptoms experienced', 'Rescue medication'] },
  { id: 'dnar', label: 'Is there a DNAR/TEP (e.g. RESPECT form) in place?', type: 'radio' },
  { id: 'dnar-location', label: 'If yes, where can this be found?', type: 'text' },
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
    sourceLines: [
      { index: 2, highlight: "I'm David, Arthur's son" },
      { index: 4, highlight: "My number's 07980 077250" },
    ],
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
  { id: 'o-falls', title: 'Maintain Safe Mobility & Reduce Falls Risk', text: 'Arthur is a high falls risk following a hip fracture. Support safe transfers and movement around the house, supervise use of the walking frame, and do not attempt the back-door steps unaided. Keep the environment clear of hazards.' },
  { id: 'o-personal', title: 'Support with Personal Care & Dignity', text: 'Assist Arthur to wash his lower body and feet and to dress, promoting as much independence as possible while preserving dignity. Provide a male carer in line with his preference.' },
  { id: 'o-nutrition', title: 'Maintain Adequate Dietary & Fluid Intake', text: 'Prepare a nourishing breakfast and lunch, encourage food and regular fluids, and leave a drink within reach. Monitor appetite and intake and report concerns.' },
  { id: 'o-medication', title: 'Management of Medical Conditions and Medication', text: "Prompt and record Arthur's amlodipine and PRN co-codamol, monitor pain and blood pressure, and watch for changes in memory or wellbeing, reporting to the office." },
];

interface TaskSuggestion {
  id: string;
  title: string;
  category: TaskCategory;
  text: string;
}

const SUGGESTED_TASKS: TaskSuggestion[] = [
  { id: 't-personal', title: 'Personal Care Support', category: 'General', text: 'Assist Arthur to wash his lower half and feet and to dress. Male carer preferred. Promote independence and dignity.' },
  { id: 't-meals', title: 'Prepare Breakfast & Lunch', category: 'Nutrition', text: 'Prepare a nourishing breakfast and lunch and encourage Arthur to eat. Note intake in the care record.' },
  { id: 't-fluids', title: 'Encourage Fluids', category: 'Hydration', text: 'Offer and encourage regular drinks, and leave a drink within reach before leaving.' },
  { id: 't-med', title: 'Medication Prompt', category: 'Medications', text: 'Prompt amlodipine and offer PRN co-codamol for pain as prescribed. Record what is taken and report refusals or concerns.' },
  { id: 't-mobility', title: 'Mobility & Falls Check', category: 'General', text: 'Supervise transfers and movement with the walking frame. Do not attempt the back-door steps unaided. Check for trip hazards.' },
  { id: 't-laundry', title: 'Laundry & Bed Change', category: 'General', text: 'Help with laundry and changing bed linen, which Arthur cannot manage with his frame.' },
];

interface ChatMessage {
  from: 'ai' | 'user';
  text: string;
}

const CHAT: ChatMessage[] = [
  { from: 'ai', text: "I've summarised the assessment visit into draft sections for the Care & Support Plan, plus suggested Outcomes and Tasks. Review and edit anything, or ask me to refine a section." },
  { from: 'ai', text: "This visit also covered consent, receipt of your documents, the Privacy Policy, Terms and Conditions, and the Customer Guide — I've drafted those too. See the secondary sections below the Care Plan." },
  { from: 'user', text: 'Add that the physio assessed him as a high falls risk to the mobility section.' },
  { from: 'ai', text: 'Done — the Mobility section now notes he was assessed by physiotherapy as a high falls risk and cannot manage the back-door steps unaided.' },
  { from: 'user', text: "He'd prefer a male carer for personal care — make sure that's captured." },
  { from: 'ai', text: 'Captured — the Personal care section and the personal care outcome both now state that a male carer is preferred.' },
  { from: 'user', text: "Add David's number as the emergency contact in the profile section." },
  { from: 'ai', text: 'Added — David (son) on 07980 077250 is listed as primary contact under Profile & background.' },
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
  { speaker: 'Sharon (Assessor)', role: 'assessor', time: '09:29', text: "Just for the recording, could you both confirm your names for me quickly?" },
  { speaker: 'Arthur', role: 'customer', time: '09:29', text: "Arthur." },
  { speaker: 'David (Son)', role: 'family', time: '09:29', text: "David, his son." },
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
// Same shape as Arthur's own initial assessment above (all Care Plan
// sections, the Personal details form, and every secondary document), both
// genuinely partial — a single visit, nothing yet accepted — since Arthur's
// is this same story re-skinned to his own name/family/gender (see the
// comment above TRANSCRIPT): hip fracture, arthritis, falls risk,
// male-carer preference for Arthur, female-carer preference here, daughter
// Susan visiting evenings.

const EDITH_TRANSCRIPT: TranscriptLine[] = [
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '13:59', text: "Before I get started properly, would you both mind saying your names for the recording? I'll start — I'm Alison, from the care team." },
  { speaker: 'Edith', role: 'customer', time: '13:59', text: "I'm Edith." },
  { speaker: 'Susan (Daughter)', role: 'family', time: '13:59', text: "And I'm Susan, Edith's daughter." },
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
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '14:16', text: "That's really helpful, thank you. What about hobbies, or things you enjoy doing day to day?" },
  { speaker: 'Edith', role: 'customer', time: '14:17', text: "I like my knitting, though my hands aren't as quick as they were with the arthritis. I listen to the radio a lot, and I look forward to Susan popping in of an evening." },
  { speaker: 'Susan (Daughter)', role: 'family', time: '14:18', text: "She used to go to a knitting group at the church hall on Tuesdays — she's missed it since the fall." },
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '14:19', text: "Would you like any support to get back to that once you're steadier on your feet?" },
  { speaker: 'Edith', role: 'customer', time: '14:20', text: "I would, if someone wouldn't mind coming with me the first few times, just in case." },
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '14:23', text: "Thank you both, that's given me a really good picture. I'll write this up and the office will be in touch about start dates." },
  { speaker: 'Susan (Daughter)', role: 'family', time: '14:23', text: "Thanks Alison, we appreciate it." },
  { speaker: 'Edith', role: 'customer', time: '14:24', text: "Thank you for coming out." },
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
    reviewed: false,
    sourceLines: [
      { index: 5, highlight: "I've been in this bungalow thirty years and I intend to stay" },
      { index: 4, highlight: "My number's 07712 660145" },
    ],
  },
  {
    id: 'section-2',
    title: 'Section 2 - Personal care and daily routine',
    text: `My top half I can manage, but I can't manage my legs and feet since the hip, and dressing is a struggle — I'd rather a lady helped me with that.

I've always looked after myself and I don't want to feel like people are taking over — I'd like to stay as involved as I can, even where I need a hand with the parts I can't manage.

I do get frustrated some days that I can't do what I used to, so please bear with me if I seem a bit short — it's not personal, I just miss being able to get on with things myself.

Good Practice Guidance for Staff
- Support with washing and dressing the lower half and feet; let me manage my top half myself.
- Female carer preferred for personal care.
- Explain what you're doing and let me help where I can, rather than just taking over.
- Be patient if I seem frustrated — it's the loss of independence, not the carer.`,
    promptingQuestions: [
      'How are you managing with washing and dressing?',
      'Do you have a preference for a male or female carer?',
      'Is there a particular way we should approach you if you seem frustrated?',
    ],
    reviewed: false,
    sourceLines: [
      { index: 10, highlight: "My top half I'm alright, but I can't manage my legs and feet since the hip, and dressing is a struggle. I'd rather a lady helped me with that" },
    ],
  },
  {
    id: 'section-3',
    title: 'Section 3 - Activities, exercise and socialising',
    text: "Enjoys knitting, though finds it slower going since her arthritis, and listens to the radio regularly. Values her daughter Susan's evening visits. Previously attended a knitting group at the church hall on Tuesdays but has not been able to go since the fall. Would welcome someone to accompany her back to the group for the first few sessions while she regains her confidence.",
    promptingQuestions: [
      'What do you enjoy doing day to day?',
      'Do you see friends, family or neighbours regularly?',
      'Would you like any support to keep doing the things you enjoy?',
    ],
    reviewed: false,
    sourceLines: [
      { index: 17, highlight: "I like my knitting, though my hands aren't as quick as they were with the arthritis" },
      { index: 20, highlight: "I would, if someone wouldn't mind coming with me the first few times" },
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
    reviewed: false,
    sourceLines: [
      { index: 11, highlight: "I can't stand long enough to cook now. I've been having biscuits and not much else" },
      { index: 12, highlight: 'make her a proper breakfast and lunch and leave a drink out' },
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
    reviewed: false,
    sourceLines: [
      { index: 13, highlight: 'I use my frame indoors. There are two steps down to the back door' },
      { index: 14, highlight: "The physio said she's a high falls risk" },
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
    reviewed: false,
    sourceLines: [
      { index: 7, highlight: "I take a tablet for my blood pressure — amlodipine — and some co-codamol when the pain's bad" },
      { index: 8, highlight: "she forgets her tablets, and sometimes forgets whether she's eaten" },
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
    reviewed: false,
    sourceLines: [
      { index: 15, highlight: "The laundry and changing my bed too — I can't carry things with the frame" },
    ],
  },
];

// Personal details, populated only where the recording actually covered it —
// same honest-gaps approach as Arthur's. No DNACPR discussion took place at
// this visit, so that field is left "Not yet captured" rather than invented.
const EDITH_PERSONAL_DETAILS: FormField[] = [
  { id: 'language', label: 'What language would you prefer this assessment to be carried out in?', type: 'select', options: LANGUAGE_OPTIONS },
  { id: 'known-as', label: 'Known as', type: 'text', value: 'Edith', reviewed: false, sourceLines: [{ index: 1, highlight: 'Edith' }] },
  { id: 'pronouns', label: 'Preferred pronouns', type: 'select', options: PRONOUN_OPTIONS, value: 'She/Her', reviewed: false, sourceLines: [{ index: 4, highlight: 'Mum' }] },
  { id: 'gender-description', label: 'Which of these most accurately describes you?', type: 'select', options: GENDER_DESCRIPTION_OPTIONS, value: 'Woman', reviewed: false, sourceLines: [{ index: 4, highlight: 'Mum' }] },
  { id: 'sexual-orientation', label: 'Sexual orientation', type: 'select', options: SEXUAL_ORIENTATION_OPTIONS },
  { id: 'allergies', label: 'Allergies', type: 'table', columns: ['Allergy', 'Symptoms experienced', 'Rescue medication'] },
  { id: 'dnar', label: 'Is there a DNAR/TEP (e.g. RESPECT form) in place?', type: 'radio' },
  { id: 'dnar-location', label: 'If yes, where can this be found?', type: 'text' },
  { id: 'smoker', label: 'Smoker status', type: 'select', options: SMOKER_OPTIONS },
  { id: 'pets', label: 'Pets', type: 'select', options: PETS_OPTIONS },
  { id: 'dietary', label: 'Dietary requirements', type: 'text' },
  {
    id: 'next-of-kin',
    label: 'Next of kin and other contacts',
    type: 'table',
    columns: ['Name', 'Relationship', 'Phone number', 'Decision maker'],
    rows: [['Susan Caldwell', 'Daughter', '07712 660145', 'Yes']],
    reviewed: false,
    sourceLines: [
      { index: 2, highlight: "I'm Susan, Edith's daughter" },
      { index: 4, highlight: "My number's 07712 660145" },
    ],
  },
  { id: 'poa', label: 'Is there a PoA or alternative decision maker in place?', type: 'radio' },
  { id: 'professionals', label: 'Professionals involved', type: 'table', columns: ['Name', 'Profession', 'Contact number'] },
  { id: 'communication-needs', label: 'Communication needs', type: 'table', columns: ['Area where support may be needed', 'What support is needed'] },
  { id: 'capacity', label: 'Are there any mental capacity assessments or best interest decisions in place?', type: 'radio' },
  { id: 'understanding', label: 'Understanding/comprehension', type: 'table', columns: ['Area where support may be needed', 'What support is needed'] },
  { id: 'additional-details', label: 'Additional important details', type: 'text' },
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
  { from: 'ai', text: "This visit also covered consent, receipt of your documents, the Privacy Policy, Terms and Conditions, and the Customer Guide — I've drafted those too. See the secondary sections below the Care Plan." },
  { from: 'user', text: 'Add that the physio assessed her as a high falls risk to the mobility section.' },
  { from: 'ai', text: 'Done — the Mobility section now notes she was assessed by physiotherapy as a high falls risk and cannot manage the back-door steps unaided.' },
  { from: 'user', text: "She'd prefer a female carer for personal care — make sure that's captured." },
  { from: 'ai', text: 'Captured — the Personal care section and the personal care outcome both now state that a female carer is preferred.' },
  { from: 'user', text: "Add Susan's number as the emergency contact in the profile section." },
  { from: 'ai', text: 'Added — Susan (daughter) on 07712 660145 is listed as primary contact under Profile & background.' },
];

// Edith is a brand-new enquiry — a care company doesn't book a separate visit
// for consent, receipt, T&Cs etc, so her one recording covers all of it, same
// as Arthur's initial visit — these are secondary documents from that same
// conversation, not separate recordings.

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

const EDITH_RECEIPT_TRANSCRIPT: TranscriptLine[] = [
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '14:46', text: "I've also given you copies of the Privacy Policy and our Terms and Conditions today, along with the Customer Guide for the area." },
  { speaker: 'Edith', role: 'customer', time: '14:47', text: "Yes, Susan's got those in a folder for me." },
  { speaker: 'Susan (Daughter)', role: 'family', time: '14:47', text: "I've got them all together, I'll keep them safe with the paperwork." },
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '14:48', text: "Great — I'll confirm receipt of those documents now." },
];

const EDITH_RECEIPT_SECTIONS: AssessmentSection[] = [
  { id: 'documents-received', title: 'Documents received', target: 'Documents', text: "Edith, via her daughter Susan, confirmed receipt of the Privacy Policy, Terms and Conditions of Business, and the Customer Guide, all provided at this visit." },
  { id: 'understanding', title: 'Understanding confirmed', target: 'Understanding', text: "Susan confirmed she had read through the documents on Edith's behalf and had no questions at this stage." },
];

const EDITH_PRIVACY_TRANSCRIPT: TranscriptLine[] = [
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '14:51', text: "I've talked you through how we handle your information in line with our Privacy Policy — that alright?" },
  { speaker: 'Edith', role: 'customer', time: '14:52', text: "Yes fine, nothing I'm worried about." },
  { speaker: 'Susan (Daughter)', role: 'family', time: '14:52', text: "I had a read through it too, all seems standard." },
];

const EDITH_PRIVACY_SECTIONS: AssessmentSection[] = [
  { id: 'privacy-explained', title: 'Privacy explained', target: 'Explanation', text: "The Privacy Policy was explained verbally, covering how Edith's personal and care information is collected, stored and shared." },
  { id: 'data-use', title: 'How data is used', target: 'Data use', text: "Edith and Susan confirmed understanding of how her data is used and raised no concerns." },
];

const EDITH_TERMS_TRANSCRIPT: TranscriptLine[] = [
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '14:55', text: "Last one — Terms and Conditions of Business, covers things like fees, notice periods and cancellations." },
  { speaker: 'Susan (Daughter)', role: 'family', time: '14:56', text: "Yes, I read through the fee schedule, that's clear." },
  { speaker: 'Edith', role: 'customer', time: '14:56', text: "As long as Susan's happy, I am." },
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '14:57', text: "I'll confirm that's agreed then." },
];

const EDITH_TERMS_SECTIONS: AssessmentSection[] = [
  { id: 'terms-explained', title: 'Terms explained', target: 'Terms', text: "Terms and Conditions of Business were explained, including fees, notice periods and cancellation terms." },
  { id: 'fees', title: 'Fees & charges', target: 'Fees', text: "Susan confirmed she had reviewed the fee schedule and had no questions." },
];

const EDITH_GUIDE_TRANSCRIPT: TranscriptLine[] = [
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '15:00', text: "And finally, here's your Customer Guide — has our office number, out-of-hours contact, all that." },
  { speaker: 'Susan (Daughter)', role: 'family', time: '15:01', text: "Great, I'll keep this handy." },
  { speaker: 'Edith', role: 'customer', time: '15:01', text: "Good, in case I need to complain about something!" },
];

const EDITH_GUIDE_SECTIONS: AssessmentSection[] = [
  { id: 'guide-provided', title: 'Guide provided', target: 'Guide', text: "Edith and Susan were given the Customer Guide, covering local office contact details and what to expect from visits." },
  { id: 'key-contacts', title: 'Key contacts', target: 'Contacts', text: "Key contact numbers for the office and the out-of-hours line were confirmed and left with Susan." },
];

// A separate follow-up visit specifically to capture "What Is Important To
// Me" — the Documents tab's WIITM page links to this recording (either
// picked directly, or as what a "simulated upload" resolves to) so its
// drafted fields have a real transcript to source "Check transcript" from.
const EDITH_WIITM_TRANSCRIPT: TranscriptLine[] = [
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '10:15', text: "Let's talk about your living arrangements and what's important to you day to day. Who's at home with you?" },
  { speaker: 'Edith', role: 'customer', time: '10:15', text: 'I live with my husband and my son.' },
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '10:16', text: 'And are there other family or relationships that matter to you?' },
  { speaker: 'Edith', role: 'customer', time: '10:16', text: 'I live with my husband and my son, but I have a daughter who lives elsewhere.' },
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '10:18', text: 'Could you talk me through a typical day — your routines and habits?' },
  { speaker: 'Edith', role: 'customer', time: '10:19', text: 'I wake up at about 10:00 a.m. and then I have some breakfast and then I go for a walk, and then I have a little lunch, and then I watch some telly, then I have some dinner, and then I go to sleep.' },
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '10:21', text: 'Are there any places or events that are especially important to you?' },
  { speaker: 'Edith', role: 'customer', time: '10:21', text: 'I always celebrate my birthday and for my birthday, I always go to the Air Museum.' },
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '10:23', text: 'Do you have any religious or cultural preferences we should know about?' },
  { speaker: 'Edith', role: 'customer', time: '10:23', text: "I always was Christian, but in later years I've become a little bit more agnostic. I don't really know anything." },
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '10:25', text: 'What about social activities or hobbies — things you like to do?' },
  { speaker: 'Edith', role: 'customer', time: '10:25', text: 'I do bowls and I like to play tennis.' },
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '10:27', text: 'Do you have any pets, or do you get visits from any?' },
  { speaker: 'Edith', role: 'customer', time: '10:27', text: "No, I don't like pets. I have allergies." },
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '10:29', text: 'Is there any support you need for your safety, or for the safety of those around you?' },
  { speaker: 'Edith', role: 'customer', time: '10:29', text: "No support really. I have a walking stick, but I don't need any support." },
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '10:31', text: 'Are there any concerns or difficulties that affect you day to day?' },
  { speaker: 'Edith', role: 'customer', time: '10:32', text: "It's just general ageing really. I just can't move as well as I used to." },
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '10:34', text: 'Is there anything else important about you that we should know?' },
  { speaker: 'Edith', role: 'customer', time: '10:34', text: 'Not really. Just a simple woman.' },
  { speaker: 'Alison (Assessor)', role: 'assessor', time: '10:36', text: 'Last thing — any allergies not already covered by your medication or nutrition assessments?' },
  { speaker: 'Edith', role: 'customer', time: '10:36', text: 'I have allergies (in the context of not liking pets).' },
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

export interface Recording {
  id: string;
  label: string; // "Initial Assessment", "6-Week Review" — the visit/cadence type
  recordingMeta: string;
  /** Who captured this on the app — the logged-in staff member, not derived from the transcript. */
  recordedBy: string;
  transcript: TranscriptLine[];
  focusDocumentName: string;
  isCarePlanFocus: boolean;
  /** Relative path (under /customers/:id/) to the standalone document page this recording's draft lives on, when one exists — e.g. 'documents/wiitm'. Falls back to the main CareBridge tab when unset. */
  focusDocumentPath?: string;
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
  /** Flags this recording as not yet opened, for the "New" badge on the Documents › CareBridge list. */
  isNew?: boolean;
}

// ─── Vera Bramwell — 4-week review: a separate, later recording ─────────────
// Unlike her WIITM follow-up (excluded as a source — see the note on
// RECORDINGS['vera-bramwell'] below), this one genuinely refines the plan:
// her GP started ramipril at the initial assessment, and by the 4-week
// review wants a dizziness-on-standing check added, given her existing
// falls risk. Same "review adds one task" shape as Arthur's 6-week review.
const VERA_REVIEW_TRANSCRIPT: TranscriptLine[] = [
  { speaker: 'Bernadette (Assessor)', role: 'assessor', time: '09:15', text: "Just for the recording, could you both confirm your names for me quickly?" },
  { speaker: 'Vera', role: 'customer', time: '09:15', text: "Vera." },
  { speaker: 'Paul (Son)', role: 'family', time: '09:15', text: "Paul, her son." },
  { speaker: 'Bernadette (Assessor)', role: 'assessor', time: '09:16', text: "Morning Vera, morning Paul — it's been four weeks now, so this visit is to check the care plan still reflects what you both want before we confirm it." },
  { speaker: 'Vera', role: 'customer', time: '09:17', text: "The carers have settled in well, I think. I'm managing." },
  { speaker: 'Paul (Son)', role: 'family', time: '09:18', text: "Could we add one thing — her GP wants the carers to check she isn't dizzy getting up now she's on the ramipril. It can drop your blood pressure when you stand." },
  { speaker: 'Bernadette (Assessor)', role: 'assessor', time: '09:19', text: "Of course — given her falls risk that's a sensible addition. I'll add it as an agreed task. Anything else you'd like changed?" },
  { speaker: 'Vera', role: 'customer', time: '09:20', text: "No, I'm happy with how it's going." },
  { speaker: 'Bernadette (Assessor)', role: 'assessor', time: '09:36', text: "Good — I'll take that as your confirmation the plan reflects what you want, with that one addition." },
];

const VERA_REVIEW_SECTIONS: AssessmentSection[] = [
  { id: 'plan-accuracy', title: 'Care plan accuracy', target: 'Plan review', text: "Vera and her son Paul confirmed the current care plan accurately reflects the support being provided and remains appropriate four weeks on." },
  { id: 'agreed-changes', title: 'Agreed visits & tasks', target: 'Agreed changes', text: "One addition agreed: carers to check for dizziness on standing, following her GP starting ramipril for blood pressure and given her existing falls risk." },
  { id: 'consent-to-plan', title: 'Consent to plan', target: 'Consent', text: "Vera gave her consent that the care plan, with the postural dizziness check addition, reflects what she wants and can be formally confirmed." },
];

const VERA_REVIEW_TASK_SUGGESTION: TaskSuggestion = {
  id: 't-dizzy',
  title: 'Postural Dizziness Check',
  category: 'Observations',
  text: "Check Vera isn't dizzy or unsteady when she stands up, since starting ramipril for her blood pressure — report any dizziness to the office given her falls risk.",
};

// Strip the CareBridge/AI-drafted framing from a recording's Care Plan
// content — used for Vera's Initial Assessment, whose "Customer Care and
// Support Plan" is being treated as an already-completed document (drafted
// from her completed assessment paperwork, not this recording) rather than
// a pending AI draft (see the note on her Assessments list entry).
//
// A captured form field just needs `reviewed: true` — the pending row (Check
// transcript/Accept) is gated on `reviewed === false` specifically, so
// flipping it to true drops that row with nothing else to change. A prose
// section is gated differently (`reviewed !== undefined` shows the row
// regardless of true/false, with a static "Accepted" label instead of
// "Accept"), so it needs `reviewed` cleared to undefined instead to lose the
// row entirely. Fields/sections with nothing captured are left exactly as
// they were — this isn't inventing content, just dropping the "AI drafted
// this" framing from what's already there.
function asCompletedDocument(fields: FormField[]): FormField[] {
  return fields.map(f => (f.reviewed === false ? { ...f, reviewed: true } : f));
}
function asCompletedSections(sections: AssessmentSection[]): AssessmentSection[] {
  return sections.map(s => (s.reviewed !== undefined ? { ...s, reviewed: undefined } : s));
}

const RECORDINGS: Record<string, Recording[]> = {
  'arthur-barrington': [
    {
      id: 'initial',
      label: 'Initial Assessment',
      recordingMeta: '14 Oct 2025 · 10:00–11:10 · 70 min',
      recordedBy: 'Sharon Whitfield',
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
      edits: { focus: 3 },
      isNew: true,
    },
    {
      id: 'review6',
      label: '6-Week Review',
      recordingMeta: '25 Nov 2025 · 09:29–09:52 · 23 min',
      recordedBy: 'Sharon Whitfield',
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
      recordingMeta: '7 Jul 2026 · 13:59–15:01 · 62 min',
      recordedBy: 'Alison Mercer',
      transcript: [...EDITH_TRANSCRIPT, ...EDITH_CONSENT_TRANSCRIPT, ...EDITH_RECEIPT_TRANSCRIPT, ...EDITH_PRIVACY_TRANSCRIPT, ...EDITH_TERMS_TRANSCRIPT, ...EDITH_GUIDE_TRANSCRIPT],
      focusDocumentName: 'Customer Care and Support Plan',
      isCarePlanFocus: true,
      focusSections: EDITH_SECTIONS,
      focusOutcomes: EDITH_OUTCOMES,
      focusTasks: EDITH_TASKS,
      formSections: { 'personal-details': EDITH_PERSONAL_DETAILS },
      secondary: [
        { id: 'consent-care', name: 'Consent to Care', sections: EDITH_CONSENT_SECTIONS },
        { id: 'confirm-receipt', name: 'Confirmation of Receipt', sections: EDITH_RECEIPT_SECTIONS },
        { id: 'privacy', name: 'Privacy Policy', sections: EDITH_PRIVACY_SECTIONS },
        { id: 'terms', name: 'Terms and Conditions of Business', sections: EDITH_TERMS_SECTIONS },
        { id: 'customer-guide', name: 'Customer Guide – Lichfield & Tamworth', sections: EDITH_GUIDE_SECTIONS },
      ],
      chat: EDITH_CHAT,
      edits: { focus: 3 },
      isNew: true,
    },
    {
      id: 'wiitm-followup',
      label: 'What Is Important To Me — Follow-up',
      recordingMeta: '21 Jul 2026 · 10:15–10:45 · 30 min',
      recordedBy: 'Alison Mercer',
      transcript: EDITH_WIITM_TRANSCRIPT,
      focusDocumentName: 'What Is Important To Me',
      isCarePlanFocus: false,
      focusDocumentPath: 'documents/wiitm',
      focusSections: [],
      secondary: [],
      chat: [],
      edits: { focus: 0 },
      isNew: true,
    },
  ],
  // Edith's two recordings re-skinned for Vera (see data/vera-from-edith.ts),
  // plus a third that's genuinely hers: a 4-week review (below), same pattern
  // as Arthur's 6-week review — a later, separate recording that refines the
  // plan with one new task rather than redrafting the whole thing. The
  // difference that matters is downstream, not here: nothing has been
  // drafted into her care plan from either recording yet, so Care Management
  // offers to draft it (see CARE_PLAN_DRAFTS in caremanagement/types.ts),
  // and the drafted task/outcome records that come from this review are
  // attributed to it via their own `draftSource`, distinct from the initial
  // assessment's — so a plan can genuinely be drafted from more than one
  // recording, not just Edith's single one re-skinned.
  'vera-bramwell': [
    {
      id: 'initial',
      label: 'Initial Assessment',
      recordingMeta: '4 Aug 2026 · 13:59–15:01 · 62 min',
      recordedBy: 'Bernadette Shaw',
      transcript: veraise([...EDITH_TRANSCRIPT, ...EDITH_CONSENT_TRANSCRIPT, ...EDITH_RECEIPT_TRANSCRIPT, ...EDITH_PRIVACY_TRANSCRIPT, ...EDITH_TERMS_TRANSCRIPT, ...EDITH_GUIDE_TRANSCRIPT]),
      focusDocumentName: 'Customer Care and Support Plan',
      isCarePlanFocus: true,
      // Completed (see asCompletedSections/asCompletedDocument) — her Care
      // and Support Plan reads as an already-finished document rather than a
      // pending CareBridge draft, per the note on her Assessments list entry.
      focusSections: asCompletedSections(veraise(EDITH_SECTIONS)),
      focusOutcomes: veraise(EDITH_OUTCOMES),
      focusTasks: veraise(EDITH_TASKS),
      formSections: { 'personal-details': asCompletedDocument(veraise(EDITH_PERSONAL_DETAILS)) },
      secondary: [
        { id: 'consent-care', name: 'Consent to Care', sections: veraise(EDITH_CONSENT_SECTIONS) },
        { id: 'confirm-receipt', name: 'Confirmation of Receipt', sections: veraise(EDITH_RECEIPT_SECTIONS) },
        { id: 'privacy', name: 'Privacy Policy', sections: veraise(EDITH_PRIVACY_SECTIONS) },
        { id: 'terms', name: 'Terms and Conditions of Business', sections: veraise(EDITH_TERMS_SECTIONS) },
        { id: 'customer-guide', name: 'Customer Guide – Tamworth & Lichfield', sections: veraise(EDITH_GUIDE_SECTIONS) },
      ],
      chat: EDITH_CHAT,
      edits: { focus: 2 },
      isNew: true,
    },
    {
      id: 'wiitm-followup',
      label: 'What Is Important To Me — Follow-up',
      recordingMeta: '11 Aug 2026 · 10:15–10:45 · 30 min',
      recordedBy: 'Bernadette Shaw',
      transcript: veraise(EDITH_WIITM_TRANSCRIPT),
      focusDocumentName: 'What Is Important To Me',
      isCarePlanFocus: false,
      focusDocumentPath: 'documents/wiitm',
      focusSections: [],
      secondary: [],
      chat: [],
      edits: { focus: 0 },
      isNew: true,
    },
    {
      id: 'review4',
      label: '4-Week Review',
      recordingMeta: '1 Sep 2026 · 09:15–09:38 · 23 min',
      recordedBy: 'Bernadette Shaw',
      transcript: VERA_REVIEW_TRANSCRIPT,
      focusDocumentName: 'Confirmation of Instructions',
      isCarePlanFocus: false,
      focusSections: VERA_REVIEW_SECTIONS,
      carePlanTaskAdditions: [VERA_REVIEW_TASK_SUGGESTION],
      secondary: [],
      chat: [{ from: 'ai', text: 'Confirmation of Instructions drafted — plan confirmed accurate, and a new postural dizziness check task added to the care plan. Consent to the plan captured.' }],
      edits: { focus: 1 },
      isNew: true,
    },
  ],
};

export function resolveRecordings(customerId: string): Recording[] {
  return RECORDINGS[customerId] ?? RECORDINGS['arthur-barrington'];
}

/** Undefined when the customer has no recordings at all — callers show their own empty state rather than a draft. */
export function resolveRecording(customerId: string, recordingId: string): Recording | undefined {
  const recordings = resolveRecordings(customerId);
  return recordings.find(r => r.id === recordingId) ?? recordings[0];
}

// Reserves a fixed width for the document picker trigger (sized to the
// longest actual document name across every customer) so it doesn't resize
// as the selection changes, and so real names like "Customer Care and
// Support Plan" never get clipped.
const LONGEST_FOCUS_DOCUMENT_NAME = Object.values(RECORDINGS)
  .flat()
  .map(r => r.focusDocumentName)
  .reduce((longest, name) => (name.length > longest.length ? name : longest), '');

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

function EditableBlock({ text, pending, onChange }: { text: string; pending?: boolean; onChange?: () => void }) {
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
      onInput={() => {
        resize();
        onChange?.();
      }}
      className={`block w-full resize-none overflow-hidden text-sm text-gray-900 leading-relaxed rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[rgb(154,38,214)] focus:border-[rgb(154,38,214)] transition-colors ${
        pending ? 'border-2 border-amber-300 bg-amber-50/40' : 'border border-gray-200 bg-white'
      }`}
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
  if (field.type === 'table') return (field.rows?.length ?? 0) > 0;
  if (field.type === 'checkbox-group') return (field.values?.length ?? 0) > 0;
  return !!field.value;
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

/** Controlled, auto-resizing multi-line textarea for `textarea` form fields — unlike EditableBlock (uncontrolled, used for whole-section prose), this needs a `value`/`onChange` pair so it can participate in the same review/accept flow as the other form controls. */
function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(resize, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className={`resize-none overflow-hidden ${className}`}
    />
  );
}

function EditableFormField({
  field,
  onChange,
  transcript,
}: {
  field: FormField;
  onChange: (patch: Partial<FormField>) => void;
  transcript: TranscriptLine[];
}) {
  const captured = isFieldCaptured(field);
  const pending = captured && field.reviewed === false;
  const inputClass = `w-full ${fieldBoxClass(captured, pending)} rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 placeholder:italic focus:outline-none focus:ring-1 focus:ring-[rgb(154,38,214)] focus:border-[rgb(154,38,214)] transition-colors`;

  const labelEl = field.type === 'text' || field.type === 'select'
    ? <label htmlFor={field.id} className="text-sm font-medium text-gray-700">{field.label}</label>
    : <span className="text-sm font-medium text-gray-700">{field.label}</span>;

  // Stamps who/when on top of whatever patch the caller wanted — used for
  // both the explicit "Accept" button and every direct edit (typing,
  // selecting, checking a box, ...), all of which auto-accept.
  const markReviewed = (patch: Partial<FormField> = {}) =>
    onChange({ ...patch, reviewed: true, reviewedBy: CURRENT_USER, reviewedAt: formatAcceptedAt(new Date()) });

  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        {labelEl}
        {/* Once accepted there's nothing left to action — Check transcript
            and Accept both drop away in favour of the confirmation banner below. */}
        {pending && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {!!field.sourceLines?.length && (
              <TranscriptCheckPopover fieldLabel={field.label} transcript={transcript} references={field.sourceLines}>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" /> Check transcript
                </button>
              </TranscriptCheckPopover>
            )}
            <button
              type="button"
              onClick={() => markReviewed()}
              className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Accept
            </button>
          </div>
        )}
      </div>

      {field.type === 'text' && (
        <input
          id={field.id}
          type="text"
          value={field.value ?? ''}
          onChange={e => markReviewed({ value: e.target.value })}
          placeholder="Not yet captured"
          className={inputClass}
        />
      )}

      {field.type === 'textarea' && (
        <AutoResizeTextarea
          value={field.value ?? ''}
          onChange={value => markReviewed({ value })}
          placeholder="Not yet captured"
          className={inputClass}
        />
      )}

      {field.type === 'checkbox-group' && (
        <fieldset className={`${fieldBoxClass(captured, pending)} rounded-lg px-3 py-2.5 space-y-2`}>
          <legend className="sr-only">{field.label}</legend>
          {field.options!.map(opt => {
            const checked = field.values?.includes(opt) ?? false;
            return (
              <label key={opt} className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = checked ? (field.values ?? []).filter(v => v !== opt) : [...(field.values ?? []), opt];
                    markReviewed({ values: next });
                  }}
                  className="w-4 h-4 rounded accent-[rgb(154,38,214)] cursor-pointer"
                />
                {opt}
              </label>
            );
          })}
        </fieldset>
      )}

      {field.type === 'select' && (
        <div className="relative">
          <select
            id={field.id}
            value={field.value ?? ''}
            onChange={e => markReviewed({ value: e.target.value })}
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
                onChange={() => markReviewed({ value: opt })}
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

      {/* Small green-tinted confirmation, replacing the old plain "Accepted"
          text label — shows who accepted it and when, a lightweight audit trail. */}
      {captured && field.reviewed === true && field.reviewedAt && (
        <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-[rgb(232,247,232)] border border-[rgb(178,224,178)] px-2.5 py-1">
          <Check className="w-3 h-3 text-[rgb(33,166,33)] flex-shrink-0" />
          <span className="text-xs text-[rgb(16,100,16)]">Accepted by {field.reviewedBy} on {field.reviewedAt}</span>
        </div>
      )}

      {field.helpText && <p className="text-sm text-gray-500 mt-1.5">{field.helpText}</p>}

      {field.promptingQuestions && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-500 mb-1.5">Prompting questions</p>
          <ul className="space-y-1">
            {field.promptingQuestions.map((q, i) => (
              <li key={i} className="text-sm text-gray-500">{q}</li>
            ))}
          </ul>
        </div>
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
    onChange({ rows: next, reviewed: true, reviewedBy: CURRENT_USER, reviewedAt: formatAcceptedAt(new Date()) });
  };

  const addRow = () => {
    onChange({ rows: [...rows, field.columns!.map(() => '')], reviewed: true, reviewedBy: CURRENT_USER, reviewedAt: formatAcceptedAt(new Date()) });
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
 * Lets a reviewer trace a drafted field back to where it came from in the
 * original recording — the transcript scrolls straight to the relevant
 * line(s) and highlights them, while staying freely scrollable so the
 * reviewer can check the surrounding context either side.
 */
/** Renders a transcript line's text with its drafted substring (if any) marked, rather than tinting the whole line. */
function HighlightedTranscriptText({ text, highlight }: { text: string; highlight?: string }) {
  const start = highlight ? text.indexOf(highlight) : -1;
  if (start === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, start)}
      <mark className="bg-amber-200 text-gray-900 rounded-sm px-0.5">{text.slice(start, start + highlight!.length)}</mark>
      {text.slice(start + highlight!.length)}
    </>
  );
}

/**
 * Anchored to the "Check transcript" link itself (a popover, not a centered
 * modal) so it reads as a callout from that specific link rather than a
 * disconnected overlay — the arrow ties it visually back to its trigger.
 */
function TranscriptCheckPopover({
  fieldLabel,
  transcript,
  references,
  children,
}: {
  fieldLabel: string;
  transcript: TranscriptLine[];
  references: TranscriptReference[];
  children: React.ReactNode;
}) {
  const customer = useCustomer();
  const [open, setOpen] = useState(false);
  const firstIndex = Math.min(...references.map(r => r.index));
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      highlightRef.current?.scrollIntoView({ block: 'center' });
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="w-[26rem] max-w-[calc(100vw-2rem)] h-[360px] flex flex-col p-0"
      >
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <p className="text-sm font-semibold text-gray-900">Check transcript</p>
          <p className="text-sm text-gray-500">Where "{fieldLabel}" was drafted from.</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {transcript.map((line, i) => {
            const ref = references.find(r => r.index === i);
            return (
              <div
                key={i}
                ref={i === firstIndex ? highlightRef : undefined}
                className={`flex gap-3 rounded-lg px-3 py-2.5 mb-1 transition-colors ${ref ? 'ring-1 ring-amber-300' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${speakerAvatarColor(line, customer)}`}>
                  {speakerInitials(line, customer)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-sm font-semibold ${roleStyle[line.role]}`}>{line.speaker}</span>
                    <span className="text-sm text-gray-500 tabular-nums">{line.time}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <HighlightedTranscriptText text={line.text} highlight={ref?.highlight} />
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Renders a genuinely multi-field section (e.g. Personal details) as real,
 * editable form controls. Fields CareBridge drafted from the recording start
 * flagged for manual review (amber) until accepted individually, or
 * implicitly by editing them — fields the reviewer types in themselves need
 * no separate accept step, since typing them in is itself the review.
 * No bulk "accept all": each drafted field is reviewed on its own, since
 * accepting everything unread is exactly the risk this review step exists
 * to catch.
 */
export function FormFieldsView({
  fields,
  onChange,
  transcript,
}: {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
  transcript: TranscriptLine[];
}) {
  const updateField = (id: string, patch: Partial<FormField>) => {
    onChange(fields.map(f => (f.id === id ? { ...f, ...patch } : f)));
  };

  return (
    <div>
      {fields.map(field => (
        <EditableFormField key={field.id} field={field} onChange={patch => updateField(field.id, patch)} transcript={transcript} />
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
  // Draft review state lives in CareBridgeContext (per recording), not locally
  // here, so the "Save updates" CTA in the subnav can also see whether
  // there's anything still outstanding and disable itself.
  const { getFormSections, setFormSections, getProseSections, setProseSections } = useContext(CareBridgeContext);
  const formSections = getFormSections(recording);
  const proseSections = getProseSections(recording);

  const firstWithContent = CARE_PLAN_STRUCTURE.find(item => sectionCompletion(formSections, recording, item.id)) ?? CARE_PLAN_STRUCTURE[0];
  const [selectedId, setSelectedId] = useState(firstWithContent.id);

  // Jump back to the first captured section whenever the recording changes.
  useEffect(() => {
    setSelectedId((CARE_PLAN_STRUCTURE.find(item => sectionCompletion(getFormSections(recording), recording, item.id)) ?? CARE_PLAN_STRUCTURE[0]).id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording.id]);

  const selectedItem = CARE_PLAN_STRUCTURE.find(item => item.id === selectedId) ?? CARE_PLAN_STRUCTURE[0];
  const selectedFormFields = formSections[selectedId];
  const selectedContent = proseSections[selectedId];
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
              const needsReview = !!formSections[item.id]?.some(f => isFieldCaptured(f) && f.reviewed === false)
                || proseSections[item.id]?.reviewed === false;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm border-b border-gray-100 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[rgb(154,38,214)] text-white font-medium'
                      : hasContent
                        ? 'text-[rgb(109,27,152)] font-medium hover:bg-purple-50'
                        : 'text-gray-700 hover:bg-gray-50'
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
                          : needsReview
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
          {SECTION_INTROS[selectedId] && (
            <p className="text-lg font-semibold text-gray-900 mb-5 leading-snug">{SECTION_INTROS[selectedId]}</p>
          )}
          {selectedFormFields ? (
            <FormFieldsView
              fields={selectedFormFields}
              onChange={updated => setFormSections(recording.id, { ...formSections, [selectedId]: updated })}
              transcript={recording.transcript}
            />
          ) : selectedContent ? (
            <>
              {selectedContent.reviewed !== undefined && (
                <div className="flex items-center justify-end gap-3 mb-2">
                  {!!selectedContent.sourceLines?.length && (
                    <TranscriptCheckPopover fieldLabel={selectedItem.label} transcript={recording.transcript} references={selectedContent.sourceLines}>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" /> Check transcript
                      </button>
                    </TranscriptCheckPopover>
                  )}
                  {selectedContent.reviewed === false ? (
                    <button
                      type="button"
                      onClick={() => setProseSections(recording.id, { ...proseSections, [selectedId]: { ...proseSections[selectedId], reviewed: true } })}
                      className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                  ) : (
                    // Accepted into this draft, not into the real, live assessment document it
                    // feeds — a static label rather than a button, nothing left to action here.
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-500">
                      <Check className="w-3.5 h-3.5" /> Accepted
                    </span>
                  )}
                </div>
              )}
              <EditableBlock
                key={`${recording.id}-${selectedId}`}
                text={selectedContent.text}
                pending={selectedContent.reviewed === false}
                onChange={() => setProseSections(recording.id, { ...proseSections, [selectedId]: { ...proseSections[selectedId], reviewed: true } })}
              />
              {selectedContent.promptingQuestions && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-500 mb-1.5">Prompting questions</p>
                  <ul className="space-y-1">
                    {selectedContent.promptingQuestions.map((q, i) => (
                      <li key={i} className="text-sm text-gray-500">{q}</li>
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

/**
 * Standalone Care & Support Plan view for the Documents tab click-through —
 * reuses the exact same multi-doc view CareBridge shows for a Care Plan-focus
 * recording, rather than building a second copy of this content. Needs
 * `CustomerProvider` + `CareBridgeProvider` mounted above it (see routes.tsx).
 */
export function CarePlanDocumentView() {
  const customer = useCustomer();
  const recording = resolveRecording(customer.id, 'initial');
  // Nothing recorded for this customer, so there's no drafted plan to render
  // here — the CareBridge tab is where the empty state (and the manual route
  // out of it) lives.
  if (!recording) return <NoCareBridgeContent context="careplan" />;
  return <CarePlanMultiDocView recording={recording} />;
}

// ─── This Recording — focus document + secondary documents from the same visit ──

function RecordingSummaryView({ recording }: { recording: Recording }) {
  // Section/doc ids (e.g. "section-1", "consent-scope") repeat across
  // customers, and this view isn't remounted on a customer switch (the route
  // only changes the :customerId param) — namespace keys by customer so React
  // doesn't reuse a previous customer's uncontrolled EditableBlock textarea.
  const customer = useCustomer();

  return (
    <div className="space-y-8">
      {/* Focus document — the basis this recording was made for, prominent */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-[rgb(109,27,152)] bg-purple-100 rounded-full px-2.5 py-1 cursor-default">
                Draft content
                <Info className="w-3.5 h-3.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-sm normal-case font-normal tracking-normal">
              Generated by AI from the audio recording. All content must be reviewed before saving.
            </TooltipContent>
          </Tooltip>
          <span className="text-sm text-gray-500">Recorded {recording.recordingMeta.split(' · ')[0]}</span>
        </div>

        {recording.isCarePlanFocus ? (
          <CarePlanMultiDocView recording={recording} />
        ) : (
          <AccordionSection Icon={FileText} title={recording.focusDocumentName} count={recording.focusSections.length} accent="bg-slate-100 text-slate-600" edits={recording.edits.focus}>
            <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm divide-y divide-gray-200 overflow-hidden">
              {recording.focusSections.map(section => (
                <SectionCard key={`${customer.id}-${section.id}`} section={section} badge={`${recording.focusDocumentName}${section.target ? ` · ${section.target}` : ''}`} />
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
              <AccordionSection key={`${customer.id}-${doc.id}`} Icon={FileText} title={doc.name} count={doc.sections.length} accent="bg-gray-100 text-gray-500" defaultOpen={false}>
                <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm divide-y divide-gray-200 overflow-hidden">
                  {doc.sections.map(section => (
                    <SectionCard key={`${customer.id}-${doc.id}-${section.id}`} section={section} badge={`${doc.name}${section.target ? ` · ${section.target}` : ''}`} />
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
  // Outcome/task ids (e.g. "o-nutrition", "t-med") repeat across customers,
  // and this view isn't remounted on a customer switch — namespace keys by
  // customer so React doesn't reuse a previous customer's EditableBlock.
  const customer = useCustomer();
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
            <div key={`${customer.id}-${item.id}`} className="bg-white rounded-[10px] border border-gray-200 shadow-sm p-4">
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
            <div key={`${customer.id}-${item.id}`} className="bg-white rounded-[10px] border border-gray-200 shadow-sm p-4">
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

// ─── Empty state — a customer CareBridge has never recorded ───────────────────

/**
 * What CareBridge shows for a customer with no recordings at all (e.g. Vera
 * Bramwell, assessed on paper before CareBridge was in use). The Draft Care
 * Plan tab is deliberately more than a blank page: the banner names both ways
 * forward — record the assessment and let CareBridge draft the plan, or skip
 * CareBridge entirely and write the plan up by hand in Care Management — so
 * an empty CareBridge never reads as a dead end.
 */
function NoCareBridgeContent({ context }: { context: 'careplan' | 'recording' }) {
  const customer = useCustomer();
  const navigate = useNavigate();
  const firstName = customer.fullName.split(' ').slice(1, -1).join(' ') || customer.fullName;

  return (
    // Capped and centred rather than run full-bleed like the drafted views —
    // there's no form here to fill the width, and the message reads badly as
    // a single line stretched across a wide screen.
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Same two-toned treatment as the CareBridge Draft panel on a document:
          white above for the message, tinted below for the actions. */}
      <div className="rounded-[10px] border border-purple-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-start gap-3 px-4 py-3">
          <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-[rgb(154,38,214)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold text-purple-900">
              {context === 'careplan' ? 'No Assessment Hero draft care plan' : 'No recordings yet'}
            </p>
            <p className="text-sm text-purple-800 mt-0.5">
              {context === 'careplan' ? (
                <>
                  Nothing has been recorded for {firstName}, so Assessment Hero has no assessment to draft a care plan
                  from. Record one and the outcomes and tasks are drafted for you to review — or draft the care plan
                  manually and write it up yourself in Care Management.
                </>
              ) : (
                <>
                  No assessment or review has been recorded for {firstName} through Assessment Hero. Record one, or upload
                  an existing audio file, and Assessment Hero drafts the paperwork from it.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-purple-50 border-t border-purple-200 px-4 py-3">
          <Button icon={<Mic className="w-4 h-4" />}>Record an assessment</Button>
          {context === 'careplan' ? (
            <Button
              variant="secondary"
              icon={<Pencil className="w-4 h-4" />}
              onClick={() => navigate(`/customers/${customer.id}/caremanagement`)}
            >
              Draft care plan manually
            </Button>
          ) : (
            <Button variant="secondary" icon={<Upload className="w-4 h-4" />}>Upload a recording</Button>
          )}
        </div>
      </div>

      {/* The plan's two halves still shown, empty — so the tab reads as "this
          plan has nothing in it yet" rather than as a page that failed to load. */}
      {context === 'careplan' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <EmptyDraftPanel Icon={Target} title="Suggested Outcomes" accent="bg-amber-100 text-amber-700" />
          <EmptyDraftPanel Icon={ListChecks} title="Suggested Tasks" accent="bg-purple-100 text-[rgb(109,27,152)]" />
        </div>
      )}
    </div>
  );
}

function EmptyDraftPanel({ Icon, title, accent }: { Icon: React.ComponentType<{ className?: string }>; title: string; accent: string }) {
  return (
    <div className="rounded-[10px] border border-dashed border-gray-300 bg-white px-5 py-8 text-center">
      <div className={`w-9 h-9 rounded-lg ${accent} flex items-center justify-center mx-auto mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-base font-semibold text-gray-900">{title}</p>
      <p className="text-sm text-gray-500 mt-1">
        None suggested yet — Assessment Hero fills these in from a recorded assessment.
      </p>
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

/**
 * Standalone "this recording" view for the Documents tab's CareBridge list —
 * just the recording + its transcript (no draft-content toggle; reviewing
 * the AI-drafted document itself stays on the main CareBridge tab).
 */
export function RecordingDocumentView({ recordingId }: { recordingId: string }) {
  const customer = useCustomer();
  const recording = resolveRecording(customer.id, recordingId);
  if (!recording) return <NoCareBridgeContent context="recording" />;
  return <TranscriptView recording={recording} customer={customer} />;
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
          <p className="text-sm font-semibold text-gray-900 leading-tight">Assessment Hero Assistant</p>
          <p className="text-sm text-gray-500 leading-tight">Refine any section or ask for detail</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer flex-shrink-0"
          aria-label="Hide Assessment Hero Assistant"
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
            placeholder="Ask Assessment Hero to refine a section…"
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
        {/* Invisible sizer — reserves width for the longest possible document name so the trigger doesn't resize as the selection changes or clip a long name. */}
        <span aria-hidden="true" className="invisible flex items-center gap-2 h-9 pl-3 pr-2.5 text-sm font-medium whitespace-nowrap">
          <Mic className="w-4 h-4 flex-shrink-0" />
          {LONGEST_FOCUS_DOCUMENT_NAME}
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        </span>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="absolute inset-0 h-9 inline-flex items-center gap-2 rounded-lg border border-[rgb(154,38,214)] bg-white pl-3 pr-2.5 text-sm font-medium text-gray-700 hover:border-[rgb(130,28,190)] transition-colors cursor-pointer"
          >
            <Mic className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="whitespace-nowrap">{selected?.focusDocumentName}</span>
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
        </DropdownMenuTrigger>
      </div>
      <DropdownMenuContent align="start" className="w-96">
        <DropdownMenuLabel>Recordings for this customer</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recordings.map(r => (
          <DropdownMenuItem
            key={r.id}
            onSelect={() => onChange(r.id)}
            className="flex items-center justify-between gap-3 py-2"
          >
            <span className="text-gray-900 whitespace-nowrap">{r.focusDocumentName}</span>
            <span className="text-sm text-gray-500 whitespace-nowrap flex-shrink-0">
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

export const CareBridgeContext = createContext<{
  tab: Tab;
  setTab: (t: Tab) => void;
  view: View;
  setView: (v: View) => void;
  recordingId: string;
  setRecordingId: (id: string) => void;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  getFormSections: (recording: Recording) => Record<string, FormField[]>;
  setFormSections: (recordingId: string, fields: Record<string, FormField[]>) => void;
  getProseSections: (recording: Recording) => Record<string, AssessmentSection>;
  setProseSections: (recordingId: string, sections: Record<string, AssessmentSection>) => void;
  hasPendingReview: (recording: Recording) => boolean;
  /** How many drafted-but-unreviewed fields/sections remain across the whole recording — for the live "X fields to review" count next to a "CareBridge Draft" title. */
  countPendingFields: (recording: Recording) => number;
}>({
  tab: 'recording',
  setTab: () => {},
  view: 'summary',
  setView: () => {},
  recordingId: 'initial',
  setRecordingId: () => {},
  chatOpen: false,
  setChatOpen: () => {},
  getFormSections: () => ({}),
  setFormSections: () => {},
  getProseSections: () => ({}),
  setProseSections: () => {},
  hasPendingReview: () => false,
  countPendingFields: () => 0,
});

export function CareBridgeProvider({ children }: { children: React.ReactNode }) {
  const customer = useCustomer();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>('recording');
  // A deep link from elsewhere (e.g. the Documents tab's CareBridge list) can
  // land straight on a specific recording/view via ?recording=&view=.
  const [view, setView] = useState<View>((searchParams.get('view') as View) || 'summary');
  const [recordingId, setRecordingId] = useState(searchParams.get('recording') || 'initial');
  // Descoped from the default view for now — see the floating launcher in
  // CareBridgePage. Hidden by default; the reviewer opts back in per visit.
  const [chatOpen, setChatOpen] = useState(false);

  // Recording ids (e.g. "initial") aren't unique across customers, and this
  // provider stays mounted across a customer switch (the route only changes
  // the :customerId param) — reset back to the default recording so a
  // selection from the previous customer doesn't linger. Guarded to skip the
  // initial mount (via the ref) so a ?recording= deep link isn't immediately
  // stomped back to 'initial' right after it's read above.
  const mountedCustomerId = useRef(customer.id);
  useEffect(() => {
    if (mountedCustomerId.current === customer.id) return;
    mountedCustomerId.current = customer.id;
    setRecordingId('initial');
  }, [customer.id]);

  // Draft review state, per recording — lifted up here (rather than local to
  // CarePlanMultiDocView) so the "Save updates" CTA in the subnav can also
  // see whether there's anything still outstanding and disable itself.
  // Keyed by customer id + recording id together, since recording ids repeat
  // across customers (every customer's first visit is "initial") and this
  // provider isn't remounted when switching between customers.
  const [formSectionsByRecording, setFormSectionsByRecording] = useState<Record<string, Record<string, FormField[]>>>({});
  const [proseSectionsByRecording, setProseSectionsByRecording] = useState<Record<string, Record<string, AssessmentSection>>>({});

  const key = (recordingId: string) => `${customer.id}:${recordingId}`;

  const getFormSections = (recording: Recording) => formSectionsByRecording[key(recording.id)] ?? recording.formSections ?? {};
  const setFormSections = (recordingId: string, fields: Record<string, FormField[]>) => {
    setFormSectionsByRecording(prev => ({ ...prev, [key(recordingId)]: fields }));
  };
  const getProseSections = (recording: Recording) =>
    proseSectionsByRecording[key(recording.id)] ?? Object.fromEntries(recording.focusSections.map(s => [s.id, s]));
  const setProseSections = (recordingId: string, sections: Record<string, AssessmentSection>) => {
    setProseSectionsByRecording(prev => ({ ...prev, [key(recordingId)]: sections }));
  };
  const hasPendingReview = (recording: Recording) => {
    const forms = getFormSections(recording);
    const prose = getProseSections(recording);
    const formsPending = Object.values(forms).some(fields => fields.some(f => isFieldCaptured(f) && f.reviewed === false));
    const prosePending = Object.values(prose).some(s => s.reviewed === false);
    return formsPending || prosePending;
  };
  const countPendingFields = (recording: Recording) => {
    const forms = getFormSections(recording);
    const prose = getProseSections(recording);
    const formsPending = Object.values(forms).reduce((n, fields) => n + fields.filter(f => isFieldCaptured(f) && f.reviewed === false).length, 0);
    const prosePending = Object.values(prose).filter(s => s.reviewed === false).length;
    return formsPending + prosePending;
  };

  return (
    <CareBridgeContext.Provider
      value={{
        tab, setTab, view, setView, recordingId, setRecordingId, chatOpen, setChatOpen,
        getFormSections, setFormSections, getProseSections, setProseSections, hasPendingReview, countPendingFields,
      }}
    >
      {children}
    </CareBridgeContext.Provider>
  );
}

export function CareBridgeSubnav() {
  const { tab, setTab, view, setView, recordingId, setRecordingId, hasPendingReview } = useContext(CareBridgeContext);
  const scrolled = useScrolled();
  const customer = useCustomer();
  const recordings = resolveRecordings(customer.id);

  // Guard against a recording picked for a previously-viewed customer that
  // doesn't exist for this one (e.g. following a link between customers).
  useEffect(() => {
    if (recordings.length === 0) return;
    if (!recordings.find(r => r.id === recordingId)) {
      setRecordingId(recordings[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.id]);

  // Undefined for a customer CareBridge has never recorded (e.g. Vera
  // Bramwell) — there's no draft to save or discard, so the actions and the
  // recording controls below drop away and the page shows its empty state.
  const currentRecording = recordings.find(r => r.id === recordingId) ?? recordings[0];
  const carePlanCtaLabel = customer.hasCarePlan ? 'Save updates' : 'Pre-fill assessment & care plan';
  const ctaLabel = tab === 'careplan'
    ? carePlanCtaLabel
    : currentRecording?.isCarePlanFocus
      ? carePlanCtaLabel
      : 'Save to customer file';
  // Only the Recordings tab currently tracks per-field/per-section review
  // state — nothing to block on yet for the cumulative Draft Care Plan tab.
  const ctaDisabled = tab === 'recording' && !!currentRecording && hasPendingReview(currentRecording);

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      {/* Primary tabs — This Recording vs the cumulative Care Plan Draft */}
      <div className={`max-w-[1600px] w-full mx-auto px-6 flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3.5'}`}>
        <SubnavTabs tabs={TABS} activeTab={tab} onChange={id => setTab(id as Tab)} />

        {currentRecording && (
          <div className="flex items-center gap-3">
            <Button variant="tertiary">Discard draft</Button>
            <Button
              icon={<ArrowRight className="w-4 h-4" />}
              disabled={ctaDisabled}
              title={ctaDisabled ? 'Accept the outstanding drafted fields before saving' : undefined}
            >
              {ctaLabel}
            </Button>
          </div>
        )}
      </div>

      {/* Secondary controls — only meaningful within This Recording */}
      {tab === 'recording' && currentRecording && (
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
                {v === 'summary' ? 'Draft document' : 'Original transcript'}
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

  if (recordings.length === 0 || !recording) {
    // Nothing recorded for this customer — both tabs show the empty state,
    // and there's no draft for the assistant to talk about, so no chat.
    mainContent = <NoCareBridgeContent context={tab === 'careplan' ? 'careplan' : 'recording'} />;
    chat = null;
  } else if (tab === 'careplan') {
    // No single recording backs the cumulative draft — use the most recent
    // care-plan-focused recording's chat thread as the assistant's context.
    mainContent = <CarePlanView carePlan={buildCarePlan(recordings)} hasCarePlan={customer.hasCarePlan} />;
    chat = ([...recordings].reverse().find(r => r.isCarePlanFocus) ?? recordings[0]).chat;
  } else {
    mainContent = view === 'summary'
      ? <RecordingSummaryView recording={recording} />
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
          aria-label="Open Assessment Hero Assistant"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}
    </>
  );
}
