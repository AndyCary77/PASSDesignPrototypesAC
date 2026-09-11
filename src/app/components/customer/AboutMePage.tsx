import { createContext, useContext as useReactContext, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Printer, Calendar, CheckCircle2, Send } from 'lucide-react';
import { Button } from '../buttons/Button';
import { useScrolled } from '../../hooks/useScrolled';
import { useCustomer } from '../../data/CustomerContext';
import type { CustomerProfile } from '../../data/customers';
import {
  FormFieldsView,
  isFieldCaptured,
  resolveRecording,
  RecordingsLink,
  ChangeRecordingsButton,
  type FormField,
  type Recording,
  type RecordingSelectionMode,
} from './CareBridgePage';
import passgeniusPurpleUrl from '../icons/passgenius-purple.svg';
import { triggerPassGeniusHover } from '../icons/passgenius';

const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';
const inputClass =
  'w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[rgb(154,38,214)] focus:ring-1 focus:ring-[rgb(154,38,214)]';

interface AboutMeField {
  id: string;
  label: string;
  value: string;
  rows: number;
}

interface AboutMeRecord {
  updatedDate: string;
  updatedBy: string;
  supportedBy: string;
  fields: AboutMeField[];
}

// Arthur no longer lives here as plain prose — see ARTHUR_ABOUT_ME_FIELDS
// below, drafted from his Personal Care / Moving and Handling recording.
// This record now only covers customers with no Assessment Hero draft
// behind their About Me.
const ABOUT_ME: Record<string, AboutMeRecord> = {
  'edith-caldwell': {
    updatedDate: '07/07/2026',
    updatedBy: 'Alison Reed',
    supportedBy: 'Alison Reed',
    fields: [
      { id: 'importantToMe', label: 'What is most important to me', rows: 3, value: 'Staying in my own bungalow and keeping my independence. I have managed on my own for years and I do not want to be a burden to my daughter.' },
      { id: 'importantPeople', label: 'People who are important to me', rows: 3, value: 'My daughter Susan, who visits most evenings, and my neighbour Margaret who keeps an eye on me.' },
      { id: 'communication', label: 'How I communicate and how to communicate with me', rows: 3, value: 'I communicate verbally. My hearing is fine but please speak clearly and give me time — I can be a little forgetful.' },
      { id: 'wellness', label: 'My wellness', rows: 4, value: 'I have had arthritis for years and recently fractured my hip in a fall, which has knocked my confidence. I get some pain and take tablets for it and for my blood pressure. I tire more easily than I used to.' },
      { id: 'doAndDont', label: 'Please do and please don\'t', rows: 3, value: 'Please don\'t rush me or do things for me that I can still manage myself. Please do encourage me to keep moving safely and to eat properly.' },
      { id: 'howToSupportMe', label: 'How and when to support me', rows: 4, value: 'Help me wash and dress in the mornings, prepare a proper breakfast and lunch, and prompt my tablets. A female carer is preferred for personal care. Please call Susan on 07712 660145 if you have any concerns.' },
      { id: 'alsoWorthKnowing', label: 'Also worth knowing about me', rows: 5, value: 'I was a school secretary for many years and I love crosswords and gardening, though I cannot get out in the garden much now. I take great pride in my home and like things kept just so.' },
    ],
  },
};

// Shown for a customer nothing has been recorded for yet (e.g. Vera) — the
// real form, blank, rather than a generic "nothing here" placeholder card.
// About Me is meant to be filled in during onboarding, so the form itself —
// ready to type straight into — is the better starting point than a message
// saying there's nothing to look at.
const EMPTY_ABOUT_ME: AboutMeRecord = {
  updatedDate: '',
  updatedBy: '',
  supportedBy: '',
  fields: [
    { id: 'importantToMe', label: 'What is most important to me', rows: 3, value: '' },
    { id: 'importantPeople', label: 'People who are important to me', rows: 3, value: '' },
    { id: 'communication', label: 'How I communicate and how to communicate with me', rows: 3, value: '' },
    { id: 'wellness', label: 'My wellness', rows: 4, value: '' },
    { id: 'doAndDont', label: "Please do and please don't", rows: 3, value: '' },
    { id: 'howToSupportMe', label: 'How and when to support me', rows: 4, value: '' },
    { id: 'alsoWorthKnowing', label: 'Also worth knowing about me', rows: 5, value: '' },
  ],
};

function getAboutMe(customerId: string): AboutMeRecord {
  return ABOUT_ME[customerId] ?? EMPTY_ABOUT_ME;
}

// ─── Arthur's About Me — an Assessment Hero draft ────────────────────────
// Drafted from the same recording as PersonalCareMovingHandlingDocumentPage
// (Claire Doyle, 5 Sep 2026 — see ARTHUR_PERSONAL_CARE_TRANSCRIPT in
// CareBridgePage.tsx) — demonstrates Assessment Hero drafting a second,
// quite different document from the one recording. That visit was about
// personal care and moving and handling specifically, not a life-story
// conversation, so only the fields it actually touched on are filled in;
// `importantPeople` and `communication` weren't covered at all and are left
// genuinely uncaptured rather than inventing content — same honest-gaps
// rule every other drafted field in this app follows.
const ARTHUR_ABOUT_ME_FIELDS: FormField[] = [
  {
    id: 'importantToMe',
    label: 'What is most important to me',
    type: 'textarea',
    value: "Arthur wants to manage as much of his own personal care as he can — he washes at the sink, showers standing at the rail, and brushes his own teeth — and only wants a hand with the specific bits he genuinely can't manage, like reaching his back or opening a stiff toothpaste tube.",
    reviewed: false,
    sourceLines: [
      { index: 4, highlight: 'The rest of the washing I can manage fine at the sink.' },
      { index: 10, highlight: "I can stand at the rail and do most of it myself" },
      { index: 14, highlight: 'I can brush them fine' },
    ],
  },
  {
    id: 'importantPeople',
    label: 'People who are important to me',
    type: 'textarea',
  },
  {
    id: 'communication',
    label: 'How I communicate and how to communicate with me',
    type: 'textarea',
  },
  {
    id: 'wellness',
    label: 'My wellness',
    type: 'textarea',
    value: "Arthur mentioned his hip has been playing up, and his shoulder has been bad for a few weeks — flagged separately for a professional to take a look at.",
    reviewed: false,
    sourceLines: [
      { index: 2, highlight: 'my hip was playing up' },
      { index: 22, highlight: "that's been bad for a few weeks now" },
    ],
  },
  {
    id: 'doAndDont',
    label: "Please do and please don't",
    type: 'textarea',
    value: "Please let Arthur do what he can for himself — washing at the sink, showering at the rail, brushing his own teeth — and only step in for the parts he's asked for help with, like his back, buttons when his fingers are stiff with the cold, or opening the toothpaste.",
    reviewed: false,
    sourceLines: [
      { index: 4, highlight: "I can't twist round to do it myself anymore" },
      { index: 12, highlight: "My fingers just won't do what I tell them some mornings, especially if it's cold." },
    ],
  },
  {
    id: 'howToSupportMe',
    label: 'How and when to support me',
    type: 'textarea',
    value: "Help washing his back, at the sink and in the shower; getting in and out of the bath on Sundays — especially getting back up; standing nearby while he showers in case he goes dizzy (has happened once or twice); a hand with shirt buttons and getting his arms into a jumper or jacket when his shoulder's stiff; opening his toothpaste tube; and checking and changing continence pads.",
    reviewed: false,
    sourceLines: [
      { index: 4 },
      { index: 8 },
      { index: 10, highlight: "someone just being nearby in case I go a bit dizzy, it's happened once or twice" },
      { index: 12 },
      { index: 14 },
      { index: 20 },
    ],
  },
  {
    id: 'alsoWorthKnowing',
    label: 'Also worth knowing about me',
    type: 'textarea',
    value: "Arthur likes a bath on Sundays. He can occasionally feel a little dizzy in the shower, so carers should stay nearby while he's washing. He also uses an electric razor and a hairdryer, but needs a hand holding the mirror steady and with the hairdryer's plug.",
    reviewed: false,
    sourceLines: [
      { index: 6, highlight: 'I like a bath on a Sunday' },
      { index: 10, highlight: "someone just being nearby in case I go a bit dizzy" },
      { index: 16, highlight: "I need someone to hold the mirror steady, and switch it on for me" },
    ],
  },
];

const ARTHUR_ABOUT_ME_META = { updatedDate: '05/09/2026', updatedBy: 'Claire Doyle', supportedBy: 'Claire Doyle' };

// ─── Shared state for both the subnav and the page content ──────────────
// Only Arthur has a linked recording (see `isDraft`/`linkedRecording`
// below) — every other customer's fields/pendingReview/etc. sit unused,
// same shape either way so both consumers can read one context regardless
// of which customer is loaded.

interface AboutMeState {
  customer: CustomerProfile;
  navigate: ReturnType<typeof useNavigate>;
  record: AboutMeRecord;
  isDraft: boolean;
  linkedRecordings: Recording[];
  linkedRecordingIds: string[];
  handleChangeRecordings: (ids: string[], mode: RecordingSelectionMode) => void;
  fields: FormField[];
  setFields: (fields: FormField[]) => void;
  dirty: boolean;
  setDirty: (dirty: boolean) => void;
  published: boolean;
  setPublished: (published: boolean) => void;
  pendingReview: boolean;
  pendingCount: number;
  passgeniusRef: React.RefObject<HTMLObjectElement | null>;
}

const AboutMeContext = createContext<AboutMeState | null>(null);

function useAboutMe(): AboutMeState {
  const ctx = useReactContext(AboutMeContext);
  if (!ctx) throw new Error('useAboutMe must be used within AboutMeProvider');
  return ctx;
}

export function AboutMeProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const customer = useCustomer();
  const isDraft = customer.id === 'arthur-barrington';
  const record = isDraft
    ? { ...ARTHUR_ABOUT_ME_META, fields: [] as AboutMeField[] } // fields unused in draft mode — see ARTHUR_ABOUT_ME_FIELDS
    : getAboutMe(customer.id);
  const [fields, setFields] = useState<FormField[]>(ARTHUR_ABOUT_ME_FIELDS);
  const [dirty, setDirty] = useState(false);
  const [published, setPublished] = useState(false);
  const passgeniusRef = useRef<HTMLObjectElement>(null);
  // 'personal-care' is the one recording every existing field's sourceLines
  // actually came from — kept as an explicit, changeable set (rather than a
  // single fixed id) so "Change recording(s)" below has something to act on.
  const [linkedRecordingIds, setLinkedRecordingIds] = useState<string[]>(isDraft ? ['personal-care'] : []);
  const linkedRecordings: Recording[] = isDraft
    ? linkedRecordingIds.map(id => resolveRecording(customer.id, id)).filter((r): r is Recording => !!r)
    : [];

  // Merge just extends the linked set — every field keeps whatever citation
  // it already had. Replace only makes sense to touch existing citations if
  // 'personal-care' (the recording every current sourceLines reference)
  // itself is dropped — in which case every field's citation is cleared
  // (honest gap, not the field's drafted value — we don't have alternate
  // content to regenerate from) rather than left pointing at a transcript
  // this document no longer draws on.
  const handleChangeRecordings = (ids: string[], mode: RecordingSelectionMode) => {
    if (mode === 'replace') {
      if (!ids.includes('personal-care')) {
        setFields(prev => prev.map(f => ({ ...f, sourceLines: undefined })));
      }
      setLinkedRecordingIds(ids);
    } else {
      setLinkedRecordingIds(prev => Array.from(new Set([...prev, ...ids])));
    }
  };

  // isFieldCaptured (not a plain `!!f.value` check) for consistency with
  // every other Assessment Hero draft page, even though every field here
  // happens to be a plain textarea.
  const pendingFields = fields.filter(f => isFieldCaptured(f) && f.reviewed === false);
  const pendingReview = pendingFields.length > 0;
  const pendingCount = pendingFields.length;

  return (
    <AboutMeContext.Provider
      value={{ customer, navigate, record, isDraft, linkedRecordings, linkedRecordingIds, handleChangeRecordings, fields, setFields, dirty, setDirty, published, setPublished, pendingReview, pendingCount, passgeniusRef }}
    >
      {children}
    </AboutMeContext.Provider>
  );
}

export function AboutMeSubnav() {
  const scrolled = useScrolled();
  const { record, isDraft, dirty, setDirty, published } = useAboutMe();
  return (
    <div className="bg-gray-50 border-b border-gray-200">
      {/* Same max-w-5xl w-full mx-auto (no extra px) as CareManagementSubnav —
          not a coincidence of matching numbers: this bar sits outside <main>
          (no px-6 of its own), so centring at the same width as <main>'s own
          content column beneath it lines the two up exactly, at any viewport
          width, without needing to replicate main's padding here too. */}
      <div className={`max-w-5xl w-full mx-auto flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3.5'}`}>
        <span className="text-xs text-gray-500">
          {record.updatedDate ? <>Last updated: {record.updatedDate} &nbsp;·&nbsp; {record.updatedBy}</> : 'Not yet completed'}
        </span>
        <div className="flex items-center gap-3">
          <Button variant="tertiary" icon={<Printer className="w-4 h-4" />}>Print</Button>
          {/* "Save Draft" while it's still a draft, same wording switch as
              the other Assessment Hero document pages — plain "Save" for
              every customer without one. */}
          <Button disabled={isDraft && published && !dirty} onClick={() => setDirty(false)}>
            {isDraft ? (published ? 'Save' : 'Save Draft') : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** The purple "Assessment Hero Draft" banner — same shell as every other drafted document (see PersonalCareMovingHandlingDocumentPage). Only ever shown for Arthur. */
function AssessmentHeroDraftBanner() {
  const {
    customer,
    navigate,
    linkedRecordings,
    linkedRecordingIds,
    handleChangeRecordings,
    published,
    setPublished,
    pendingReview,
    pendingCount,
    passgeniusRef,
  } = useAboutMe();

  if (published) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-[rgb(178,224,178)] bg-[rgb(232,247,232)] px-4 py-3">
        <div className="w-7 h-7 rounded-lg bg-[rgb(212,240,212)] flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-4 h-4 text-[rgb(33,166,33)]" />
        </div>
        <div>
          <p className="text-lg font-semibold text-[rgb(12,77,12)]">Published</p>
          <p className="text-sm text-[rgb(16,100,16)] mt-0.5">
            This document has been published from the Assessment Hero draft — it's now a saved document and is no
            longer tracked as a draft.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-purple-200 shadow overflow-hidden"
      onMouseEnter={() => triggerPassGeniusHover(passgeniusRef.current, true)}
      onMouseLeave={() => triggerPassGeniusHover(passgeniusRef.current, false)}
    >
      <div className="flex items-start gap-3 bg-white px-4 py-3">
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 pt-1">
          <object ref={passgeniusRef} type="image/svg+xml" data={passgeniusPurpleUrl} className="w-8 h-8" aria-label="PASSgenius" tabIndex={-1} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold text-purple-900 flex items-center gap-2">
            Assessment Hero Draft
            {pendingCount > 0 && (
              <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                {pendingCount} {pendingCount === 1 ? 'field' : 'fields'} to review
              </span>
            )}
          </p>

          {linkedRecordings.length === 1 && (
            <p className="text-sm text-purple-800 mt-0.5">
              Generated from <strong>{linkedRecordings[0].label}</strong>, recorded{' '}
              <strong>
                {linkedRecordings[0].recordingMeta.split(' · ')[0]} at{' '}
                {linkedRecordings[0].recordingMeta.split(' · ')[1].split('–')[0]}
              </strong>{' '}
              by <strong>{linkedRecordings[0].recordedBy}</strong> — please review before accepting.
            </p>
          )}
          {linkedRecordings.length > 1 && (
            <p className="text-sm text-purple-800 mt-0.5">
              Generated from <strong>{linkedRecordings.length} recordings</strong> — not every entry is a direct
              quote, so please review before accepting.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 bg-purple-50 border-t border-purple-200 px-4 py-3">
        <div className="flex items-center gap-4">
          {/* RecordingsLink degrades to today's plain "View recording" link
              for the single-source case this page usually has — it's
              shared with Medical History (which does draw on two) so that
              once About Me cites a second recording too, via "Change
              recording(s)" below, it picks up the same "N recordings"
              picker for free rather than needing its own copy built later. */}
          <RecordingsLink customerId={customer.id} recordings={linkedRecordings} navigate={navigate} />
          {linkedRecordings.length === 0 && <span />}
          <ChangeRecordingsButton
            customerId={customer.id}
            linkedRecordingIds={linkedRecordingIds}
            onConfirm={handleChangeRecordings}
          />
        </div>

        <Button
          icon={<Send className="w-4 h-4" />}
          disabled={pendingReview}
          title={pendingReview ? 'Accept the outstanding drafted fields before publishing' : undefined}
          onClick={() => setPublished(true)}
        >
          Publish
        </Button>
      </div>
    </div>
  );
}

export function AboutMePage() {
  const { customer, record, isDraft, fields, setFields, setDirty } = useAboutMe();
  // Every field's sourceLines (where still present — see
  // handleChangeRecordings) indexes into 'personal-care' specifically,
  // regardless of what else is currently linked, so the transcript passed
  // to FormFieldsView stays fixed to that one recording rather than
  // whichever's first in linkedRecordings.
  const citedRecording = isDraft ? resolveRecording(customer.id, 'personal-care') : undefined;

  return (
    // Same max-w-5xl mx-auto as CareManagementPage's own content wrapper —
    // centred and the same width as the subnav bar above it, rather than the
    // card sitting left-aligned at its own arbitrary width.
    <div className="max-w-5xl mx-auto space-y-4">
      {isDraft && <AssessmentHeroDraftBanner />}

      {/* Form card — rendered blank (see EMPTY_ABOUT_ME) rather than swapped
          out for a placeholder when nothing's been recorded yet, so the form
          itself is what a reviewer sees before any detail exists. */}
      <div className="bg-white rounded-[10px] border border-gray-200 p-6 space-y-5" onChange={() => setDirty(true)}>
        <h2 className="text-base font-semibold text-gray-900">About me</h2>

        {isDraft ? (
          <FormFieldsView
            fields={fields}
            onChange={updated => setFields(fields.map(f => updated.find(u => u.id === f.id) ?? f))}
            transcript={citedRecording?.transcript ?? []}
            audioUrl={citedRecording?.audioUrl}
          />
        ) : (
          record.fields.map(field => (
            <div key={field.id}>
              <label htmlFor={field.id} className={labelClass}>{field.label}</label>
              <textarea
                id={field.id}
                defaultValue={field.value}
                placeholder="Not yet recorded"
                rows={field.rows}
                className={`${inputClass} resize-none`}
              />
            </div>
          ))
        )}

        {/* Date + Supported by */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Date</label>
            <div className="relative">
              <input
                type="text"
                defaultValue={record.updatedDate ? `${record.updatedDate} 00:00` : ''}
                placeholder="Not yet recorded"
                className={`${inputClass} pr-10`}
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Supported by</label>
            <input type="text" defaultValue={record.supportedBy} placeholder="Not yet recorded" className={inputClass} />
          </div>
        </div>
      </div>
    </div>
  );
}
