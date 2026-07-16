import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { FileText, Target, ListChecks, Sparkles, Send, Mic, ArrowRight, Info, Pencil, ThumbsUp, ThumbsDown, Copy } from 'lucide-react';
import { Button } from '../buttons/Button';
import { useScrolled } from '../../hooks/useScrolled';
import { useCustomer } from '../../data/CustomerContext';
import { OutcomeBadge, TaskBadge } from './caremanagement/shared';
import type { TaskCategory } from './caremanagement/types';

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
  target: string;
  text: string;
}

const ASSESSMENT_SECTIONS: AssessmentSection[] = [
  {
    id: 'profile',
    title: 'Profile & background',
    target: 'Section 1',
    text: 'Arthur has lived in his own home in Sutton Coldfield for over forty years and is strongly motivated to remain there. He is house-proud and values his independence, and can find it difficult to accept help that feels like others "taking over". Primary contact is his son David (lives in Florida, currently visiting) on 07980 077250.',
  },
  {
    id: 'health',
    title: 'Health & medication',
    target: 'Section 6',
    text: 'Diagnosed with vascular dementia approximately two years ago; memory fluctuates and confusion increases in the afternoons. Also has hypertension managed with prescribed medication. Prescribed Hydromol ointment to be applied to both lower legs twice daily — Arthur cannot reliably self-administer and requires support. A DNACPR is in place (yellow envelope, living room table).',
  },
  {
    id: 'nutrition',
    title: 'Nutrition & hydration',
    target: 'Section 4',
    text: 'Requires support to prepare lunch and would like a snack plate left out. Due to memory difficulties Arthur may forget whether he has eaten, and has on occasion taken out more than one ready meal. Carer to prepare lunch, offer a snack plate, and look for evidence he has eaten, recording intake in the notes.',
  },
  {
    id: 'mobility',
    title: 'Mobility',
    target: 'Section 5',
    text: 'Mobilises independently indoors. Uses a wheeled frame outdoors and is wary of the front step — supervision recommended when leaving the property. Enjoys getting outside in good weather.',
  },
  {
    id: 'domestic',
    title: 'Domestic support',
    target: 'Section 7',
    text: 'Would like light domestic help: washing up dishes, checking the fridge for out-of-date food and disposing of it, and occasional ironing. Support should be offered sensitively given Arthur is house-proud and independent.',
  },
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
  { from: 'user', text: 'Can you expand the Mobility section — Arthur mentioned he uses a frame outdoors and is wary of the front step.' },
  { from: 'ai', text: 'Done. Mobility now notes he mobilises independently indoors, uses a wheeled frame outdoors, and needs supervision on the front step. See the updated card.' },
  { from: 'user', text: "Add David's number as the emergency contact in the profile section." },
  { from: 'ai', text: 'Added — David (son, in Florida) on 07980 077250 is listed as primary contact under Profile & background.' },
  { from: 'user', text: 'The medication outcome should mention the Hydromol ointment specifically.' },
  { from: 'ai', text: 'Updated the Medication outcome to reference applying Hydromol ointment to both lower legs twice daily.' },
];

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

const EDITH_SECTIONS: AssessmentSection[] = [
  { id: 'profile', title: 'Profile & background', target: 'Section 1', text: 'Edith has lived independently in her Lichfield bungalow for thirty years and is determined to remain there. Recently discharged after a three-week hospital admission for a fractured hip following a fall at home. Used to managing alone and finding reduced independence frustrating. Daughter Susan is the main contact (07712 660145) and visits in the evenings after work.' },
  { id: 'personal-care', title: 'Personal care & daily routine', target: 'Section 2', text: 'Able to wash her upper body independently but needs assistance to wash her lower half and feet since the hip fracture, and finds dressing a struggle. Has expressed a preference for a female carer to support with personal care, with dignity maintained throughout.' },
  { id: 'nutrition', title: 'Nutrition & hydration', target: 'Section 4', text: 'Unable to stand long enough to prepare meals since the fall and has been under-eating (mainly biscuits). Poor fluid intake and forgets to drink. Requires a prepared breakfast and lunch, encouragement with food and fluids, and a drink left within reach. Daughter covers evening meals.' },
  { id: 'mobility', title: 'Mobility', target: 'Section 5', text: 'Uses a walking frame indoors and is unsteady. Assessed by physiotherapy as a high falls risk. Cannot safely manage the two steps to the back door unaided and needs support and supervision when moving around, particularly with transfers.' },
  { id: 'health', title: 'Health & medication', target: 'Section 6', text: 'Osteoarthritis affecting hands, knees and now the hip, with ongoing pain. Prescribed amlodipine for hypertension and co-codamol PRN for pain. Does not reliably remember to take medication and requires prompting and recording. Reports some recent short-term memory decline — to be monitored.' },
  { id: 'domestic', title: 'Domestic support', target: 'Section 7', text: 'Unable to carry items while using her frame. Requires help with laundry and changing bed linen. Support to be offered in a way that respects her independence and pride in her home.' },
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
  { from: 'user', text: 'Add that the physio assessed her as a high falls risk to the mobility section.' },
  { from: 'ai', text: 'Done — the Mobility section now notes she was assessed by physiotherapy as a high falls risk and cannot manage the back-door steps unaided.' },
  { from: 'user', text: "She'd prefer a female carer for personal care — make sure that's captured." },
  { from: 'ai', text: 'Captured — the Personal care section and the personal care outcome both now state that a female carer is preferred.' },
];

// ─── Dataset selection ──────────────────────────────────────────────────────────

interface CareBridgeData {
  recordingMeta: string;
  planTitle: string;
  edits: number;
  transcript: TranscriptLine[];
  sections: AssessmentSection[];
  outcomes: OutcomeSuggestion[];
  tasks: TaskSuggestion[];
  chat: ChatMessage[];
}

const CAREBRIDGE_DATA: Record<string, CareBridgeData> = {
  'arthur-barrington': {
    recordingMeta: '14 Oct 2025 · 10:02–10:41 · 39 min',
    planTitle: 'Customer Care & Support Plan',
    edits: 4,
    transcript: TRANSCRIPT,
    sections: ASSESSMENT_SECTIONS,
    outcomes: SUGGESTED_OUTCOMES,
    tasks: SUGGESTED_TASKS,
    chat: CHAT,
  },
  'edith-caldwell': {
    recordingMeta: '7 Jul 2026 · 14:00–14:38 · 38 min',
    planTitle: 'Customer Care & Support Plan',
    edits: 2,
    transcript: EDITH_TRANSCRIPT,
    sections: EDITH_SECTIONS,
    outcomes: EDITH_OUTCOMES,
    tasks: EDITH_TASKS,
    chat: EDITH_CHAT,
  },
};

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

function GroupHeader({ Icon, title, count, accent }: { Icon: React.ComponentType<{ className?: string }>; title: string; count: number; accent: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <span className="text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{count}</span>
    </div>
  );
}

// ─── Summary view ───────────────────────────────────────────────────────────

function SummaryView({ data, hasCarePlan }: { data: CareBridgeData; hasCarePlan: boolean }) {
  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="flex items-start gap-2.5 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
        <Info className="w-4 h-4 text-[rgb(154,38,214)] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-purple-900">
          {hasCarePlan
            ? `This recording informed the current care plan (${data.recordingMeta.split(' · ')[0]}). Review a reassessment below and suggest updates to the existing plan.`
            : 'Draft generated from the assessment visit recording. Nothing has been saved to the care plan yet — review, edit inline, then pre-fill the assessment and care plan.'}
        </p>
      </div>

      {/* Assessment Document — one continuous panel, subsections split by a simple border */}
      <div>
        <GroupHeader Icon={FileText} title="Assessment Document" count={data.sections.length} accent="bg-slate-100 text-slate-600" />
        <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
          {/* Panel header — document + edit/recording indicators */}
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-200 bg-gray-50">
            <span className="text-sm font-semibold text-gray-900">{data.planTitle}</span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-full px-2.5 py-1">
                <Pencil className="w-3 h-3" /> {data.edits} edits
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-full px-2.5 py-1">
                <Mic className="w-3 h-3" /> 1 recording
              </span>
            </div>
          </div>
          {/* Subsections */}
          <div className="divide-y divide-gray-200">
            {data.sections.map(section => (
              <div key={section.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <h4 className="text-base font-semibold text-gray-900">{section.title}</h4>
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded px-2 py-0.5 whitespace-nowrap">
                    Care &amp; Support Plan · {section.target}
                  </span>
                </div>
                <EditableBlock text={section.text} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Suggested Outcomes */}
      <div>
        <GroupHeader Icon={Target} title="Suggested Outcomes" count={data.outcomes.length} accent="bg-amber-100 text-amber-700" />
        <div className="space-y-3">
          {data.outcomes.map(o => (
            <div key={o.id} className="bg-white rounded-[10px] border border-gray-200 shadow-sm p-4">
              <div className="mb-2">
                <OutcomeBadge title={o.title} />
              </div>
              <EditableBlock text={o.text} />
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Tasks */}
      <div>
        <GroupHeader Icon={ListChecks} title="Suggested Tasks" count={data.tasks.length} accent="bg-purple-100 text-[rgb(109,27,152)]" />
        <div className="space-y-3">
          {data.tasks.map(t => (
            <div key={t.id} className="bg-white rounded-[10px] border border-gray-200 shadow-sm p-4">
              <div className="mb-2">
                <TaskBadge title={t.title} category={t.category} />
              </div>
              <EditableBlock text={t.text} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Transcript view ──────────────────────────────────────────────────────────

const roleStyle: Record<TranscriptLine['role'], string> = {
  assessor: 'text-[rgb(154,38,214)]',
  customer: 'text-gray-900',
  family: 'text-sky-700',
};

function TranscriptView({ data }: { data: CareBridgeData }) {
  return (
    <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50 rounded-t-[10px]">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-900">Assessment visit recording</span>
        </div>
        <span className="text-xs text-gray-500">{data.recordingMeta}</span>
      </div>
      <div className="divide-y divide-gray-100">
        {data.transcript.map((line, i) => (
          <div key={i} className="px-5 py-3.5 flex gap-4">
            <span className="text-xs text-gray-400 tabular-nums pt-0.5 w-10 flex-shrink-0">{line.time}</span>
            <div className="min-w-0">
              <p className={`text-sm font-semibold mb-0.5 ${roleStyle[line.role]}`}>{line.speaker}</p>
              <p className="text-sm text-gray-700 leading-relaxed">{line.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chat panel ───────────────────────────────────────────────────────────────

function ChatPanel({ chat }: { chat: ChatMessage[] }) {
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
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-tight">CareBridge Assistant</p>
          <p className="text-xs text-gray-500 leading-tight">Refine any section or ask for detail</p>
        </div>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

type View = 'summary' | 'transcript';

const CareBridgeContext = createContext<{ view: View; setView: (v: View) => void }>({
  view: 'summary',
  setView: () => {},
});

export function CareBridgeProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<View>('summary');
  return <CareBridgeContext.Provider value={{ view, setView }}>{children}</CareBridgeContext.Provider>;
}

export function CareBridgeSubnav() {
  const { view, setView } = useContext(CareBridgeContext);
  const scrolled = useScrolled();
  const customer = useCustomer();

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className={`max-w-[1600px] w-full mx-auto px-6 flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3'}`}>
        {/* View toggle */}
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          {(['summary', 'transcript'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-[6px] transition-colors cursor-pointer ${
                view === v ? 'bg-[rgb(154,38,214)] text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {v === 'summary' ? 'Summary' : 'Original transcript'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="tertiary">Discard draft</Button>
          <Button icon={<ArrowRight className="w-4 h-4" />}>
            {customer.hasCarePlan ? 'Suggest updates to care plan' : 'Pre-fill assessment & care plan'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CareBridgePage() {
  const { view } = useContext(CareBridgeContext);
  const customer = useCustomer();
  const data = CAREBRIDGE_DATA[customer.id] ?? CAREBRIDGE_DATA['arthur-barrington'];

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        {view === 'summary'
          ? <SummaryView data={data} hasCarePlan={customer.hasCarePlan} />
          : <TranscriptView data={data} />}
      </div>
      <div className="w-[360px] flex-shrink-0">
        <ChatPanel chat={data.chat} />
      </div>
    </div>
  );
}
