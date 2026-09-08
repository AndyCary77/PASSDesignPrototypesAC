import { createContext, useContext as useReactContext, useState, useRef, useEffect, Fragment } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, History, Printer, Trash2, Mic, ChevronDown, ChevronRight, Upload, Link2Off, CheckCircle2, Send, Check, Loader2, Info } from 'lucide-react';
import { Button } from '../../buttons/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { useCustomer } from '../../../data/CustomerContext';
import type { CustomerProfile } from '../../../data/customers';
import { FormFieldsView, resolveRecording, resolveRecordings, type FormField, type Recording } from '../CareBridgePage';
import { DocumentTabs } from './DocumentTabs';
import { WIITM_FIELDS_BLANK, WIITM_FIELDS_DRAFT, WIITM_FIELDS_COMPLETE, WIITM_GROUPS } from './whatIsImportantToMeData';
import { useScrolled } from '../../../hooks/useScrolled';
import passgeniusPurpleUrl from '../../icons/passgenius-purple.svg';
import { triggerPassGeniusHover } from '../../icons/passgenius';

// Same "what's currently feeding this draft" shape as CarePlanDocumentPage,
// except this document starts with nothing linked at all — an incomplete,
// blank form — rather than defaulting to a recording.
type LinkedSource = { type: 'recording'; id: string } | { type: 'upload'; fileName: string } | null;

// Simulated import/transcription pipeline — kept short and compact (per
// feedback on a teammate's spike) rather than a tall multi-line step tracker
// with per-step descriptions; just enough to sell "this takes a moment".
// Each step gets its own dwell time rather than one uniform duration —
// identical timings for every step is what made it feel mechanical/staged
// rather than like a real variable-length process.
// Slowed to a ~15s total run (was ~4.7s) — closer to how long a real upload
// and transcription actually takes, same ratio between steps as before.
const PROCESSING_STEPS = [
  { label: 'Fetching audio', ms: 3300 },
  { label: 'Transcribing recording', ms: 6400 },
  { label: 'Filling in document', ms: 4600 },
];
// The connector between two circles snaps shut quickly the moment the step
// before it finishes, rather than crawling in lockstep with the next step's
// entire spin — decoupling "moving to the next step" from "how long that
// step takes" is what actually reads as a connected sequence rather than
// two unrelated things animating at the same rate by coincidence.
const CONNECTOR_FILL_MS = 350;
// Brief hold once the last step's spinner has finished ticking over, so the
// final checkmark + fully-filled bar are actually seen before the panel
// collapses into the CareBridge Draft view.
const PROCESSING_COMPLETE_PAUSE_MS = 700;

// A manually uploaded recording, once "transcribed", resolves to this real
// recording (with its own transcript) rather than a placeholder with just a
// filename — so "View recording"/"Check transcript" have something real to
// link to, the same as picking it from the list directly would.
const UPLOAD_MATCHED_RECORDING_ID = 'wiitm-followup';

interface WiitmDocumentState {
  customer: CustomerProfile;
  navigate: ReturnType<typeof useNavigate>;
  dirty: boolean;
  setDirty: (dirty: boolean) => void;
  published: boolean;
  setPublished: (published: boolean) => void;
  linkedSource: LinkedSource;
  linkedRecording: Recording | null;
  otherRecordings: Recording[];
  fields: FormField[];
  pendingReview: boolean;
  pendingCount: number;
  processingStep: number | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  passgeniusRef: React.RefObject<HTMLObjectElement | null>;
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUnlink: () => void;
  startProcessing: (source: LinkedSource) => void;
  updateGroupFields: (ids: string[], updated: FormField[]) => void;
}

const WiitmDocumentContext = createContext<WiitmDocumentState | null>(null);

function useWiitmDocument(): WiitmDocumentState {
  const ctx = useReactContext(WiitmDocumentContext);
  if (!ctx) throw new Error('useWiitmDocument must be used within WiitmDocumentProvider');
  return ctx;
}

/**
 * Holds all state for the "What Is Important To Me" click-through so the
 * pinned sub-nav (in the AppShell's sticky infoBar, alongside CustomerInfo —
 * same mechanism as CareManagementSubnav) and the scrolling content below
 * can both read/act on it as siblings, rather than one owning state the
 * other can't reach.
 */
export function WiitmDocumentProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const customer = useCustomer();
  const [dirty, setDirty] = useState(false);
  const passgeniusRef = useRef<HTMLObjectElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // A deep link from elsewhere (e.g. the recording/transcript page's "Linked
  // to" click-through) can land straight on this draft already linked to the
  // recording that generated it, rather than the usual blank starting state.
  const [searchParams] = useSearchParams();
  const linkedRecordingId = searchParams.get('recording');
  // Vera's WIITM shows as an already-completed document — filled in, but
  // never linked to a recording, so there's no CareBridge draft/review
  // framing to bypass (see isCompletedDocument in WiitmDocumentContent).
  const isCompletedDocument = customer.id === 'vera-bramwell';
  const [linkedSource, setLinkedSource] = useState<LinkedSource>(linkedRecordingId ? { type: 'recording', id: linkedRecordingId } : null);
  const [fields, setFields] = useState<FormField[]>(
    isCompletedDocument ? WIITM_FIELDS_COMPLETE : linkedRecordingId ? WIITM_FIELDS_DRAFT : WIITM_FIELDS_BLANK,
  );
  const linkedRecording = (linkedSource?.type === 'recording' ? resolveRecording(customer.id, linkedSource.id) : null) ?? null;
  const otherRecordings = resolveRecordings(customer.id).filter(r => linkedSource?.type !== 'recording' || r.id !== linkedSource.id);

  // No CareBridgeContext here — this document isn't part of the Care Plan's
  // per-recording formSections, so pending review is just this page's own
  // field state, checked the same way isFieldCaptured does (text/textarea only).
  const pendingFields = fields.filter(f => !!f.value && f.reviewed === false);
  const pendingReview = pendingFields.length > 0;
  // Drives the live "X fields to review" count next to the "CareBridge Draft"
  // title — recomputed from `fields` on every render, so it ticks down as
  // fields get accepted.
  const pendingCount = pendingFields.length;
  const [published, setPublished] = useState(false);

  // Null = idle. 0..PROCESSING_STEPS.length-1 = that step's spinner is
  // active. PROCESSING_STEPS.length itself = every step has finished (all
  // circles ticked, bar fully filled) — held briefly before finalizing.
  const [processingStep, setProcessingStep] = useState<number | null>(null);
  const pendingSourceRef = useRef<LinkedSource>(null);

  const startProcessing = (source: LinkedSource) => {
    pendingSourceRef.current = source;
    setProcessingStep(0);
  };

  useEffect(() => {
    if (processingStep === null) return;
    const isComplete = processingStep === PROCESSING_STEPS.length;
    const delay = isComplete ? PROCESSING_COMPLETE_PAUSE_MS : PROCESSING_STEPS[processingStep].ms;
    const timer = setTimeout(() => {
      if (isComplete) {
        setLinkedSource(pendingSourceRef.current);
        setFields(WIITM_FIELDS_DRAFT);
        setProcessingStep(null);
      } else {
        setProcessingStep(s => (s ?? 0) + 1);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [processingStep]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) startProcessing({ type: 'recording', id: UPLOAD_MATCHED_RECORDING_ID });
    e.target.value = '';
  };

  const handleUnlink = () => {
    const name = linkedSource?.type === 'recording' ? linkedRecording?.label : linkedSource?.fileName;
    if (window.confirm(`Unlink "${name}" from this draft? The fields already accepted stay as they are, but nothing will sync from a recording until you link a new one.`)) {
      setLinkedSource(null);
      setFields(WIITM_FIELDS_BLANK);
    }
  };

  const updateGroupFields = (ids: string[], updated: FormField[]) => {
    setFields(prev => prev.map(f => (ids.includes(f.id) ? updated.find(u => u.id === f.id) ?? f : f)));
  };

  return (
    <WiitmDocumentContext.Provider
      value={{
        customer, navigate, dirty, setDirty, published, setPublished, linkedSource, linkedRecording,
        otherRecordings, fields, pendingReview, pendingCount, processingStep, fileInputRef, passgeniusRef, handleUpload,
        handleUnlink, startProcessing, updateGroupFields,
      }}
    >
      {children}
    </WiitmDocumentContext.Provider>
  );
}

/** Pinned sub-nav — same sticky treatment as CareManagementSubnav: lives in AppShell's infoBar, so it scrolls with CustomerInfo instead of away with the page content. */
export function WiitmDocumentSubnav() {
  const { customer, navigate, dirty, published, setDirty } = useWiitmDocument();
  const scrolled = useScrolled();

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      {/* Two levels, matching AppShell's <main> (max-w-[1600px] mx-auto px-6)
          plus the content's own nested max-w-[1280px] mx-auto — otherwise
          this pinned bar doesn't line up with the content scrolling beneath it. */}
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="max-w-[1280px] mx-auto">
          {/* Row 1 — Back + actions. Kept separate from the tabs row below:
              combined into one row, Back/actions of varying width on each
              page threw off how much space was left for the tabs, so they
              centred differently here than on the plain Documents list —
              and left less room on narrower screens. */}
          <div className={`flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3.5'}`}>
            <Button
              variant="tertiary"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate(`/customers/${customer.id}/documents?tab=assessments`)}
            >
              Back
            </Button>

            <div className="flex items-center gap-3">
              <Button variant="tertiary" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>Print</Button>
              <Button variant="tertiary-danger" icon={<Trash2 className="w-4 h-4" />}>Delete</Button>
              {/* "Save Draft" while still a draft — a genuine use case (accepting
                  some fields but not all, then coming back later) even though
                  Publish is the terminal action. Not gated on `dirty` here: that
                  flag only catches native onChange bubbling from text edits, not
                  clicking Accept, so it can't reliably tell whether
                  there's anything worth saving — always enabled instead. */}
              <Button
                disabled={published && !dirty}
                onClick={() => setDirty(false)}
              >
                {published ? 'Save' : 'Save Draft'}
              </Button>
            </div>
          </div>

          {/* Row 2 — tabs, alone in the full-width row so they centre exactly
              the same way as on the plain Documents/Assessments list. */}
          <div className={`border-t border-gray-200 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3'}`}>
            <DocumentTabs activeTab="assessments" onTabChange={tab => navigate(`/customers/${customer.id}/documents?tab=${tab}`)} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Everything below the pinned sub-nav — the CareBridge Draft/processing panel, title bar, History and the form itself. */
export function WiitmDocumentContent() {
  const {
    customer, navigate, published, linkedSource, linkedRecording, otherRecordings, fields, pendingReview, pendingCount,
    processingStep, fileInputRef, passgeniusRef, handleUpload, handleUnlink, startProcessing, updateGroupFields,
    setDirty, setPublished,
  } = useWiitmDocument();

  // See the same guard in CarePlanDocumentPage — Vera's WIITM reads as an
  // already-completed document, so no CareBridge banner above it at all.
  const isCompletedDocument = customer.id === 'vera-bramwell';

  return (
    <div className="flex flex-col gap-4 max-w-[1280px] mx-auto">
      <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleUpload} />

      {isCompletedDocument ? null : published ? (
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
      ) : processingStep !== null ? (
        // The banner expands into this while the simulated import runs, then
        // collapses back into the normal CareBridge Draft panel once done.
        // Horizontal stepper: each gap between two circles is its own line
        // segment, sitting empty until the circle before it is done, then
        // growing out of that circle over the next step's dwell time —
        // rather than one shared bar whose fill fraction is computed from
        // the overall progress (harder to read as "coming from" a circle).
        <>
          {/* Sits above the CareBridge panel only while processing is
              actually running — the run is ~15s now, long enough that
              someone might otherwise wait it out or worry that navigating
              away cancels it. */}
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 mb-2">
            <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              You can leave this page while the upload is being processed — you won't lose anything.
            </p>
          </div>
          <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 shadow">
          <div className="flex items-center gap-2.5 mb-4">
            <object type="image/svg+xml" data={passgeniusPurpleUrl} className="w-6 h-6 flex-shrink-0" aria-label="PASSgenius" tabIndex={-1} />
            <p className="text-sm font-semibold text-purple-900">Generating this draft from the recording…</p>
          </div>
          <div className="flex items-start px-1">
            {PROCESSING_STEPS.map((step, i) => {
              const state = i < processingStep ? 'done' : i === processingStep ? 'active' : 'pending';
              return (
                <Fragment key={step.label}>
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0 w-24">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-semibold ${
                        state === 'done' ? 'bg-[rgb(33,166,33)] text-white' : state === 'active' ? 'bg-[rgb(154,38,214)] text-white' : 'bg-purple-100 text-purple-400'
                      }`}
                    >
                      {/* Keyed by state so the tick actually plays a pop-in transition rather than silently swapping icons. */}
                      <span key={state} className="flex items-center justify-center animate-in zoom-in-50 duration-300">
                        {state === 'done' ? <Check className="w-3 h-3" /> : state === 'active' ? <Loader2 className="w-3 h-3 animate-spin" /> : i + 1}
                      </span>
                    </span>
                    <span className={`text-xs text-center ${state === 'pending' ? 'text-purple-400' : 'text-purple-900 font-medium'}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < PROCESSING_STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 bg-purple-100 rounded-full overflow-hidden mt-2.5 mx-1">
                      {/* Fills quickly the instant this step is done, independent of
                          how long the next step's own spinner then runs for. */}
                      <div
                        className="h-full bg-[rgb(154,38,214)] transition-all ease-out"
                        style={{ width: i < processingStep ? '100%' : '0%', transitionDuration: `${CONNECTOR_FILL_MS}ms` }}
                      />
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
          </div>
        </>
      ) : linkedSource ? (
        // Two-toned rather than one purple-tinted block: a white top half for the
        // icon/title/description, and a purple bottom half housing the action
        // links/Publish button — those are all purple-branded, and against a
        // purple-tinted top half (or an amber one, tried earlier) they clashed
        // with the surrounding text. Splitting the panel keeps the purple
        // confined to where it's actually branding something clickable. The
        // pending count gets its own amber badge up top, so the banner still
        // flags outstanding review work without fighting either half's colour.
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

              {linkedRecording ? (
                <p className="text-sm text-purple-800 mt-0.5">
                  Generated from <strong>{linkedRecording.label}</strong>, recorded{' '}
                  <strong>
                    {linkedRecording.recordingMeta.split(' · ')[0]} at{' '}
                    {linkedRecording.recordingMeta.split(' · ')[1].split('–')[0]}
                  </strong>{' '}
                  by <strong>{linkedRecording.recordedBy}</strong> — review the fields below and accept them to
                  confirm they're correct before they're saved to the customer file.
                </p>
              ) : (
                <p className="text-sm text-purple-800 mt-0.5">
                  Generated from the uploaded recording <strong>{linkedSource.fileName}</strong> — review the fields
                  below and accept them to confirm they're correct before they're saved to the customer file.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-purple-50 border-t border-purple-200 px-4 py-3">
            <div className="flex items-center gap-4">
              {linkedRecording && (
                <button
                  type="button"
                  onClick={() => navigate(`/customers/${customer.id}/documents/recording/${linkedRecording.id}`)}
                  className="flex items-center gap-1 text-sm font-medium text-[rgb(154,38,214)] hover:underline cursor-pointer"
                >
                  View recording
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-sm font-medium text-[rgb(154,38,214)] hover:underline cursor-pointer"
                  >
                    Replace recording
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72">
                  <DropdownMenuLabel>Choose a recording</DropdownMenuLabel>
                  {otherRecordings.length > 0 ? (
                    otherRecordings.map(r => (
                      <DropdownMenuItem
                        key={r.id}
                        onSelect={() => startProcessing({ type: 'recording', id: r.id })}
                        className="flex items-center justify-between gap-3 py-2"
                      >
                        <span className="flex items-center gap-2 text-gray-900">
                          <Mic className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {r.label}
                        </span>
                        <span className="text-sm text-gray-500 whitespace-nowrap flex-shrink-0">
                          {r.recordingMeta.split(' · ')[0]}
                        </span>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled className="text-gray-400">No other recordings for this customer</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {/* Deferred a tick — Radix closes the menu and restores focus
                      right after onSelect, which can race with (and cancel) the
                      native file dialog if triggered in the same tick. */}
                  <DropdownMenuItem onSelect={() => setTimeout(() => fileInputRef.current?.click(), 0)} className="flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-gray-400" />
                    Upload a recording
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleUnlink} className="flex items-center gap-2 text-red-600 focus:text-red-600">
                    <Link2Off className="w-3.5 h-3.5" />
                    Unlink recording
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
      ) : (
        // Nothing linked yet — no draft, no fields to publish. A slim single-line
        // banner rather than the full panel: just the pitch and a way to start.
        <div
          className="flex items-center justify-between gap-3 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2.5 shadow"
          onMouseEnter={() => triggerPassGeniusHover(passgeniusRef.current, true)}
          onMouseLeave={() => triggerPassGeniusHover(passgeniusRef.current, false)}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <object ref={passgeniusRef} type="image/svg+xml" data={passgeniusPurpleUrl} className="w-6 h-6 flex-shrink-0" aria-label="PASSgenius" tabIndex={-1} />
            <p className="text-sm font-medium text-purple-900 truncate">Assessment Hero - AI-powered document drafts from audio recordings</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 text-sm font-medium text-[rgb(154,38,214)] hover:underline cursor-pointer flex-shrink-0"
              >
                Add a recording
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Choose a recording</DropdownMenuLabel>
              {otherRecordings.length > 0 ? (
                otherRecordings.map(r => (
                  <DropdownMenuItem
                    key={r.id}
                    onSelect={() => startProcessing({ type: 'recording', id: r.id })}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <span className="flex items-center gap-2 text-gray-900">
                      <Mic className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {r.label}
                    </span>
                    <span className="text-sm text-gray-500 whitespace-nowrap flex-shrink-0">
                      {r.recordingMeta.split(' · ')[0]}
                    </span>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled className="text-gray-400">No other recordings for this customer</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {/* Deferred a tick — Radix closes the menu and restores focus
                  right after onSelect, which can race with (and cancel) the
                  native file dialog if triggered in the same tick. */}
              <DropdownMenuItem onSelect={() => setTimeout(() => fileInputRef.current?.click(), 0)} className="flex items-center gap-2">
                <Upload className="w-3.5 h-3.5 text-gray-400" />
                Upload a recording
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="flex items-center px-5 py-4 rounded-lg border border-gray-200 bg-white">
        <h2 className="text-xl font-semibold text-gray-900">What Is Important To Me</h2>
      </div>

      <div>
        <Button variant="tertiary" icon={<History className="w-4 h-4" />}>History</Button>
      </div>

      {/* Single continuous section — no left-hand nav like the Care Plan's
          16 sections, since the real example only has this one. */}
      <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm p-6" onChange={() => setDirty(true)}>
        {WIITM_GROUPS.map((group, i) => {
          const groupFields = fields.filter(f => group.fieldIds.includes(f.id));
          return (
            <div key={i} className={i > 0 ? 'mt-6' : undefined}>
              {group.heading && <h2 className="text-lg font-semibold text-gray-900 mb-3">{group.heading}</h2>}
              {group.subheading && <h3 className="text-sm font-semibold text-gray-700 mb-2">{group.subheading}</h3>}
              {groupFields.length > 0 && (
                <FormFieldsView
                  fields={groupFields}
                  onChange={updated => updateGroupFields(group.fieldIds, updated)}
                  transcript={linkedRecording?.transcript ?? []}
                  audioUrl={linkedRecording?.audioUrl}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
