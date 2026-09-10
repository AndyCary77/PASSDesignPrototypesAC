import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Stethoscope, Calendar, Check, Search, ChevronRight } from 'lucide-react';
import { useCustomer } from '../../data/CustomerContext';
import { EmptyTab, DiscardButton } from './caremanagement/shared';
import { TranscriptCheckPopover, resolveRecording, type TranscriptLine } from './CareBridgePage';
import passgeniusPurpleUrl from '../icons/passgenius-purple.svg';
import { triggerPassGeniusHover } from '../icons/passgenius';

interface Diagnosis {
  id: string;
  name: string;
  notes: string;
  dateOfDiagnosis: string;
  /** false = Assessment Hero drafted/flagged this from a recording and it hasn't been accepted yet. Undefined for a plain, non-drafted entry (every customer except Arthur, for now). */
  reviewed?: boolean;
  /** Where in the linked recording's transcript this ties back to — omitted where there's genuinely nothing to point at, in which case the field still shows Accept, just no "Check transcript". */
  sourceLines?: { index: number; highlight?: string }[];
}

// Arthur's diagnoses are deliberately the explanation behind what he
// actually said in the Personal Care / Moving and Handling recording (see
// ARTHUR_PERSONAL_CARE_TRANSCRIPT in CareBridgePage.tsx and
// project_arthur_about_me_draft) — every note below ties to something in
// that transcript, rather than just avoiding contradicting it:
//   - Fractured Hip           → "my hip was playing up"
//   - Osteoarthritis          → stiff fingers in the cold, "my grip's gone"
//   - Benign Prostatic Hypertrophy (+ operation) → "I wear pads... since the operation"
//   - Ischemic Stroke         → "nearby in case I go a bit dizzy"
//   - Essential Hypertension  → also explains the dizziness; matches the
//     amlodipine already mentioned in his Care & Support Plan (CareBridgePage.tsx)
//   - Type 2 Diabetes         → "my legs get ever so dry... cracks... round the ankles"
// His shoulder (flagged by Claire as new, "bad for a few weeks", to be
// looked at separately) is deliberately NOT here yet — it hasn't actually
// been diagnosed, just raised for follow-up, so adding an entry for it
// would invent a diagnosis the recording never claims. Dementia/cognitive
// content is also deliberately absent — see project_arthur_about_me_draft's
// note on why that thread isn't being carried forward into new content.
//
// `reviewed`/`sourceLines` (2026-09-10): demonstrating Assessment Hero
// drafting this tab too, from the same recording as the About Me and
// Personal Care documents. Honestly mixed rather than uniformly confident —
// a conversation about personal care doesn't actually name diagnoses, so
// only the three fields with a real, specific line to point at get "Check
// transcript" (Fractured Hip, Benign Prostatic Hypertrophy, Type 2
// Diabetes); the other three are flagged pending too (Assessment Hero
// judged them relevant) but with nothing concrete to cite, same as any
// other field with reviewed:false and no sourceLines elsewhere in this app.
const MEDICAL_HISTORY: Record<string, Diagnosis[]> = {
  'arthur-barrington': [
    {
      id: 'hip-fracture',
      name: 'Fractured Hip',
      notes: "I fractured my hip in a fall at home and spent three weeks in hospital. It's healed now, but it still gives me some trouble now and again — I can have a rough night with it, and I use a wheeled frame to get around outside as a result.",
      dateOfDiagnosis: 'August 2025',
      reviewed: false,
      sourceLines: [{ index: 2, highlight: 'my hip was playing up' }],
    },
    {
      id: 'osteoarthritis',
      name: 'Osteoarthritis',
      notes: "I have osteoarthritis in my hands, knees and hip, which causes ongoing joint pain and stiffness. My grip isn't as strong as it used to be, and my fingers can seize up first thing or when it's cold, which makes fiddly things like buttons harder than they used to be.",
      dateOfDiagnosis: 'March 2016',
      reviewed: false,
    },
    {
      id: 'bph',
      name: 'Benign Prostatic Hypertrophy',
      notes: 'Benign prostatic hypertrophy is also called an enlarged prostate — a non-cancerous growth of the prostate gland that presses on the urethra and makes it harder to urinate. I had an operation for this in July 2026, which has left me needing to wear continence pads day and night since — carers help me check and change these.',
      dateOfDiagnosis: 'November 2015',
      reviewed: false,
      sourceLines: [{ index: 20, highlight: 'I wear pads, day and night now, since the operation' }],
    },
    {
      id: 'ischemic-stroke',
      name: 'Ischemic Stroke',
      notes: "An ischemic stroke happens when a blood clot or fatty plaque blocks an artery supplying blood to the brain. Mine doesn't affect my daily abilities, but I can still get the odd dizzy turn, so carers should stay nearby if I'm somewhere I could take a fall, like the shower.",
      dateOfDiagnosis: 'March 2012',
      reviewed: false,
    },
    {
      id: 'hypertension',
      name: 'Essential Hypertension',
      notes: 'Essential hypertension is high blood pressure with no single known cause. I can get headaches, or feel a bit dizzy or light-headed with it sometimes. I take Amlodipine 5mg daily to manage it.',
      dateOfDiagnosis: 'November 2010',
      reviewed: false,
    },
    {
      id: 'diabetes',
      name: 'Type 2 Diabetes',
      notes: "I've been diagnosed with type 2 diabetes — my body doesn't make enough insulin, or the insulin it makes doesn't work properly, so sugar builds up in my blood. I can get very dry skin because of it, especially on my legs, and cuts or sores can take longer to heal, so carers keep an eye on my skin. I take Metformin 500mg daily to manage this.",
      dateOfDiagnosis: 'June 2008',
      reviewed: false,
      sourceLines: [{ index: 18, highlight: "my legs get ever so dry, especially in winter, cracks a bit round the ankles" }],
    },
  ],
  // Edith's own story, matching EDITH_SECTIONS/EDITH_TRANSCRIPT in
  // CareBridgePage.tsx and her own About Me record: a recent hip fracture,
  // long-standing osteoarthritis, and hypertension managed with the same
  // amlodipine her Care & Support Plan already prescribes. Her "recent
  // short-term memory decline" is explicitly logged there as "to be
  // monitored", not an actual diagnosis yet — left out here for the same
  // reason Arthur's shoulder is, see the note above. Plain, non-drafted
  // entries (no `reviewed`) — the Assessment Hero demo is Arthur's only.
  'edith-caldwell': [
    {
      id: 'hip-fracture',
      name: 'Fractured Hip',
      notes: "I fractured my hip in a fall in my kitchen and spent three weeks in hospital. I'm home now, but it's knocked my confidence — I'm not as steady as I was, I use a walking frame indoors, and I need a hand with the two steps down to the back door.",
      dateOfDiagnosis: 'June 2026',
    },
    {
      id: 'osteoarthritis',
      name: 'Osteoarthritis',
      notes: "I've had osteoarthritis in my hands, knees and now my hip for years, which gives me ongoing joint pain and stiffness. My hands aren't as quick as they were, which slows me down with things like my knitting.",
      dateOfDiagnosis: 'February 2014',
    },
    {
      id: 'hypertension',
      name: 'Essential Hypertension',
      notes: 'Essential hypertension is high blood pressure with no single known cause. I take amlodipine daily to manage it, along with co-codamol as needed for pain from my arthritis.',
      dateOfDiagnosis: 'September 2011',
    },
  ],
};

function getMedicalHistory(customerId: string): Diagnosis[] {
  return MEDICAL_HISTORY[customerId] ?? [];
}

function DiagnosisCard({
  d,
  transcript,
  audioUrl,
  onPublish,
  onReject,
}: {
  d: Diagnosis;
  transcript: TranscriptLine[];
  audioUrl?: string;
  onPublish: () => void;
  onReject: () => void;
}) {
  const pending = d.reviewed === false;
  return (
    <div className="bg-white rounded-[10px] border border-red-200 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 py-3 bg-red-50 border-b border-red-200">
        <div className="flex items-center gap-2 min-w-0">
          <Stethoscope className="w-4 h-4 text-red-800 flex-shrink-0" />
          <h3 className="text-base font-semibold text-red-800">{d.name}</h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-2.5 py-1 text-sm font-medium text-red-800 flex-shrink-0">
          <Calendar className="w-3.5 h-3.5" />
          Diagnosed {d.dateOfDiagnosis}
        </span>
      </div>
      <div className="px-5 py-4">
        {pending && (
          <div className="flex items-center justify-end gap-3 mb-2">
            {!!d.sourceLines?.length && (
              <TranscriptCheckPopover fieldLabel={d.name} transcript={transcript} references={d.sourceLines} audioUrl={audioUrl}>
                <button type="button" className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                  <Search className="w-3.5 h-3.5" /> Check transcript
                </button>
              </TranscriptCheckPopover>
            )}
            {/* Unlike a personal-care preference, a suggested diagnosis can
                just be wrong or not actually relevant — worth a real way to
                remove it entirely, not just leave it unaccepted. Reuses the
                same Discard confirm dialog Care Management already uses for
                a drafted Outcome/Task, rather than inventing new copy for
                the identical "AI suggested this, take it out for good"
                action. */}
            <DiscardButton onDiscard={onReject} itemLabel="diagnosis" />
            {/* "Publish" rather than "Accept" — each diagnosis is its own
                independent record (added, and removable, one at a time via
                Discard above), not a field in one larger document that
                gets signed off as a whole. Confirming this one commits it
                to the customer's medical history immediately; it isn't
                held back by whatever's still pending on the others. */}
            <button type="button" onClick={onPublish} className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors cursor-pointer">
              <Check className="w-3.5 h-3.5" /> Publish
            </button>
          </div>
        )}
        <p className={`text-sm text-gray-700 leading-relaxed whitespace-pre-line ${pending ? 'border-2 border-amber-300 bg-amber-50/40 rounded-lg p-3' : ''}`}>
          {d.notes}
        </p>
        {d.reviewed === true && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[rgb(232,247,232)] border border-[rgb(178,224,178)] px-2.5 py-1">
            <Check className="w-3 h-3 text-[rgb(33,166,33)] flex-shrink-0" />
            <span className="text-sm text-[rgb(16,100,16)]">Published</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function MedicalHistoryPage() {
  const customer = useCustomer();
  const navigate = useNavigate();
  const isDraft = customer.id === 'arthur-barrington';
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>(() => getMedicalHistory(customer.id));
  const passgeniusRef = useRef<HTMLObjectElement>(null);
  const linkedRecording = isDraft ? resolveRecording(customer.id, 'personal-care') ?? null : null;

  const pendingCount = diagnoses.filter(d => d.reviewed === false).length;

  // Publishes just this one diagnosis — there's no document-level Publish
  // gating everything else, see the note on the per-card button below.
  const publishDiagnosis = (id: string) => {
    setDiagnoses(prev => prev.map(d => (d.id === id ? { ...d, reviewed: true } : d)));
  };

  // Removes the suggestion outright rather than just marking it reviewed —
  // rejecting a diagnosis means "this doesn't belong on the record", not
  // "correct but not yet confirmed".
  const rejectDiagnosis = (id: string) => {
    setDiagnoses(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* No document-level Publish here (see publishDiagnosis) — this banner
          is purely informational now: where the drafted entries came from,
          and how many are still outstanding. It stays up even once nothing's
          pending, since "generated from this recording" is worth being able
          to trace back to at any point, not just while there's review work
          left to do. */}
      {isDraft && (
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
              {linkedRecording && (
                <p className="text-sm text-purple-800 mt-0.5">
                  Generated from <strong>{linkedRecording.label}</strong>, recorded{' '}
                  <strong>
                    {linkedRecording.recordingMeta.split(' · ')[0]} at{' '}
                    {linkedRecording.recordingMeta.split(' · ')[1].split('–')[0]}
                  </strong>{' '}
                  by <strong>{linkedRecording.recordedBy}</strong> — a conversation about personal care doesn't
                  name diagnoses outright, so review each flagged entry below; some point straight to what was
                  said, others are a judgement call worth double-checking.
                </p>
              )}
            </div>
          </div>

          {linkedRecording && (
            <div className="bg-purple-50 border-t border-purple-200 px-4 py-3">
              <button
                type="button"
                onClick={() => navigate(`/customers/${customer.id}/documents/recording/${linkedRecording.id}`)}
                className="flex items-center gap-1 text-sm font-medium text-[rgb(154,38,214)] hover:underline cursor-pointer"
              >
                View recording
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {diagnoses.length === 0 ? (
        <EmptyTab label="medical history" />
      ) : (
        <div className="space-y-4">
          {/* Header row is its own red-tinted band, separated by a border
              from the (plain white) notes below it — same header/body split
              as a Care Management task card, rather than one undifferentiated
              block. Reuses the exact red tokens CATEGORY_CONFIG already uses
              for "Medications" elsewhere in Care Management (bg-red-50 /
              border-red-200 / text-red-800), rather than a fresh red, so a
              diagnosis and a medication read as the same kind of clinical
              fact wherever they show up — not a one-off treatment invented
              just for this list.
              The diagnosis date lives here too, as its own white chip
              opposite the name — it used to be plain grey text floating at
              the top of the notes paragraph, easy to mistake for part of
              the note and the least noticeable thing on the card despite
              being one of the first things worth scanning for. As a
              labelled, iconed peer of the title it's now legible at a
              glance without reading the prose. */}
          {diagnoses.map(d => (
            <DiagnosisCard
              key={d.id}
              d={d}
              transcript={linkedRecording?.transcript ?? []}
              audioUrl={linkedRecording?.audioUrl}
              onPublish={() => publishDiagnosis(d.id)}
              onReject={() => rejectDiagnosis(d.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
