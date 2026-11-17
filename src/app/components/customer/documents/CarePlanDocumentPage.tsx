import { createContext, useContext as useReactContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, History, Printer, Trash2, Mic, ChevronDown, ChevronRight, Upload, Link2Off, Send } from 'lucide-react';
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
import { CarePlanDocumentView, CareBridgeContext, PublishedConfirmationBanner, resolveRecording, resolveRecordings, type Recording } from '../CareBridgePage';
import { DocumentTabs } from './DocumentTabs';
import { AssessmentHeroUpdateBanner, AssessmentHeroUpdateDraftBanner, UpdateNoChangesNotice, UpdateProblemsNotice, describeSources, getSourceProblem, type FileProblem, type UpdateSource } from './UpdateDocumentBanner';
import { DocumentUpdateProgress, UPDATE_COMPLETE_HOLD_MS, getUpdateSteps } from './UpdateProgress';
import { applyPlanUpdates, discardPlanUpdate, getPlanUpdate, getPublishedSources, getUpdateInfo, getUpdateSources, publishPlanUpdate, recordPublishedSources } from './carePlanUpdate';
import { AssessmentHeroLimitNotice, isAssessmentHeroLimitReached, LIMIT_REACHED_TITLE } from './AssessmentHeroLimitBanner';
import { useScrolled } from '../../../hooks/useScrolled';
import { useInfoBarBottom } from '../../../hooks/useInfoBarBottom';
import assessmentHeroIconUrl from '../../icons/assessment-hero.svg';

// What's currently feeding this draft: an app recording, a manually uploaded
// one (no transcript/meta of its own — just a filename, for the demo), or
// nothing at all after unlinking.
type LinkedSource = { type: 'recording'; id: string } | { type: 'upload'; fileName: string } | null;

interface CarePlanDocumentState {
  customer: CustomerProfile;
  navigate: ReturnType<typeof useNavigate>;
  dirty: boolean;
  setDirty: (dirty: boolean) => void;
  published: boolean;
  setPublished: (published: boolean) => void;
  /** A finished document (see COMPLETED_CARE_PLAN_CUSTOMERS), not a draft awaiting review. */
  isCompletedDocument: boolean;
  /** A finished document that has been updated from a recording or file and has changes awaiting review. */
  isUpdateDraft: boolean;
  /** What the update in progress was made from, and how many sections/fields it changed. */
  updateInfo: ReturnType<typeof getUpdateInfo>;
  /** Every recording and file the update in progress was made from. */
  updateSources: UpdateSource[];
  /** Update the finished document from the chosen recordings and files — drafts only what has new information. */
  startUpdate: (sources: UpdateSource[]) => void;
  /** The simulated run in progress (its sources and which step it's on), or null when idle. */
  updating: { sources: UpdateSource[]; step: number } | null;
  discardUpdate: () => void;
  publishUpdate: () => void;
  /** Set when the last source chosen had nothing new for the document. */
  noChangesFor: string | null;
  dismissNoChanges: () => void;
  /** Files in the last run that couldn't be read (password-protected, damaged, or a scan) — and whether the rest still drafted. */
  fileProblems: { problems: FileProblem[]; othersDrafted: boolean } | null;
  dismissFileProblems: () => void;
  /** The recordings/files published updates were drafted from — named on the persistent Assessment Hero banner. */
  publishedSources: UpdateSource[];
  /** Just published an update — drives the green confirmation. */
  justPublished: boolean;
  dismissJustPublished: () => void;
  linkedSource: LinkedSource;
  setLinkedSource: (source: LinkedSource) => void;
  linkedRecording: Recording | null;
  otherRecordings: Recording[];
  pendingReview: boolean;
  pendingCount: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Switches to a different existing recording — also un-publishes, see the note above it in the provider. */
  relinkRecording: (id: string) => void;
  handleUnlink: () => void;
}

/**
 * Customers whose Customer Care and Support Plan is a finished document rather than an Assessment Hero
 * draft: no draft/published banner, and (see asCompletedDocument / asCompletedSections in CareBridgePage)
 * no per-field pending review. Matches 'Complete' in their Assessments list. Vera's was drafted from her
 * completed paperwork; Arthur's is shown complete by default, ahead of the update-from-a-new-source flow.
 */
const COMPLETED_CARE_PLAN_CUSTOMERS = ['arthur-barrington', 'vera-bramwell'];

/**
 * Of those, the customers whose finished plan shows the minimal AssessmentHeroUpdateBanner above it: "Drafted
 * by Assessment Hero", with one "Update document" link to bring the plan up to date from a recording or file.
 * Once an update has been published into it, the banner also names what it was drafted from, with a link to open it.
 * Vera's plan was drafted from paperwork rather than a recording, so she has no recordings to pick and no authored
 * updates yet: the banner is there, but any source she chooses reports nothing new (see finishUpdate).
 */
const UPDATE_BANNER_CUSTOMERS = ['arthur-barrington', 'vera-bramwell'];

const CarePlanDocumentContext = createContext<CarePlanDocumentState | null>(null);

function useCarePlanDocument(): CarePlanDocumentState {
  const ctx = useReactContext(CarePlanDocumentContext);
  if (!ctx) throw new Error('useCarePlanDocument must be used within CarePlanDocumentProvider');
  return ctx;
}

/**
 * Holds all state for the Care Plan click-through so the pinned sub-nav
 * (in the AppShell's sticky infoBar, alongside CustomerInfo — same
 * mechanism as CareManagementSubnav) and the scrolling content below can
 * both read/act on it as siblings, rather than one owning state the other
 * can't reach.
 */
export function CarePlanDocumentProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const customer = useCustomer();
  // Any edit inside the care plan form (which manages its own field state via
  // CareBridgeContext) bubbles a native change event up to the content
  // wrapper — cheaper than threading a dirty flag through every field component.
  const [dirty, setDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Starts linked to the assessment recording, where there is one — a
  // customer CareBridge never recorded (e.g. Vera Bramwell) starts unlinked
  // instead, so the panel offers "Link a recording" rather than claiming a
  // draft that doesn't exist.
  const hasRecordings = resolveRecordings(customer.id).length > 0;
  const [linkedSource, setLinkedSource] = useState<LinkedSource>(hasRecordings ? { type: 'recording', id: 'initial' } : null);
  const linkedRecording = (linkedSource?.type === 'recording' ? resolveRecording(customer.id, linkedSource.id) : null) ?? null;
  const otherRecordings = resolveRecordings(customer.id).filter(r => linkedSource?.type !== 'recording' || r.id !== linkedSource.id);

  // Publish is gated on review, same as the real CareBridge subnav's CTA —
  // a draft with un-reviewed AI-drafted fields can't be published yet.
  const { hasPendingReview, countPendingFields } = useReactContext(CareBridgeContext);
  const pendingReview = !!linkedRecording && hasPendingReview(linkedRecording);
  // Drives the live "X fields to review" count next to the "CareBridge Draft"
  // title — recomputed from the same per-recording review state on every
  // render, so it ticks down as fields get accepted.
  const pendingCount = linkedRecording ? countPendingFields(linkedRecording) : 0;
  const [published, setPublished] = useState(false);

  // Update document (finished documents only). The draft needs no state of its own: it IS the set of items on the
  // finished document that carry an update marker, which live in CareBridgeContext with everything else, so it
  // survives leaving and coming back. Each changed item carries what it was before (see ItemUpdate), which is what Discard
  // restores and what the review UI shows as "Previously".
  const { getFormSections, setFormSections, getProseSections, setProseSections } = useReactContext(CareBridgeContext);
  const isCompletedDocument = COMPLETED_CARE_PLAN_CUSTOMERS.includes(customer.id);
  const baseRecording = resolveRecording(customer.id, 'initial');
  // In draft from the moment an update lands until it is published or discarded — NOT just while fields are still
  // pending: once the last one is accepted the draft is ready to publish, and needs to stay put until it is.
  const updateInfo = isCompletedDocument && baseRecording ? getUpdateInfo(getFormSections(baseRecording), getProseSections(baseRecording)) : null;
  const updateSources = isCompletedDocument && baseRecording ? getUpdateSources(getFormSections(baseRecording), getProseSections(baseRecording)) : [];
  const isUpdateDraft = updateInfo !== null;
  const [noChangesFor, setNoChangesFor] = useState<string | null>(null);
  const [justPublished, setJustPublished] = useState(false);
  const [publishedSources, setPublishedSources] = useState<UpdateSource[]>(() => getPublishedSources(customer.id));

  // The update runs for a few seconds first — "thinking time", the same stepper as drafting a care plan — and is
  // only applied when it finishes. Kept in this provider, so leaving the page cancels it.
  const [updating, setUpdating] = useState<{ sources: UpdateSource[]; step: number } | null>(null);
  const [fileProblems, setFileProblems] = useState<{ problems: FileProblem[]; othersDrafted: boolean } | null>(null);

  const startUpdate = (sources: UpdateSource[]) => {
    setNoChangesFor(null);
    setFileProblems(null);
    setJustPublished(false);
    setUpdating({ sources, step: 0 });
  };

  // Works out what the source changes and applies it (or reports nothing new). Runs once the stepper has finished.
  const finishUpdate = (sources: UpdateSource[]) => {
    // A file that can't be read is named and nothing is drafted from it; the other sources still go ahead.
    const problems = sources.flatMap(s => getSourceProblem(customer.id, s) ?? []);
    const readable = sources.filter(s => !getSourceProblem(customer.id, s));
    const runs = readable.flatMap(source => {
      const def = getPlanUpdate(customer.id, source);
      return def ? [{ def, source }] : [];
    });
    const result = baseRecording && runs.length > 0 ? applyPlanUpdates(runs, getFormSections(baseRecording), getProseSections(baseRecording)) : null;
    const drafted = !!result && result.changed > 0;
    if (problems.length > 0) setFileProblems({ problems, othersDrafted: drafted });
    if (!drafted) {
      // Nothing relevant in what could be read: leave the document alone and say so, rather than hand over an empty draft.
      if (readable.length > 0) setNoChangesFor(describeSources(readable));
      return;
    }
    if (!baseRecording || !result) return;
    setFormSections(baseRecording.id, result.forms);
    setProseSections(baseRecording.id, result.prose);
  };

  useEffect(() => {
    if (!updating) return;
    const steps = getUpdateSteps(updating.sources);
    const isFinalHold = updating.step === steps.length;
    const timer = window.setTimeout(() => {
      if (isFinalHold) {
        finishUpdate(updating.sources);
        setUpdating(null);
      } else {
        setUpdating(u => (u ? { ...u, step: u.step + 1 } : u));
      }
    }, isFinalHold ? UPDATE_COMPLETE_HOLD_MS : steps[updating.step].ms);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updating]);

  const discardUpdate = () => {
    if (!baseRecording) return;
    const result = discardPlanUpdate(getFormSections(baseRecording), getProseSections(baseRecording));
    setFormSections(baseRecording.id, result.forms);
    setProseSections(baseRecording.id, result.prose);
  };

  const publishUpdate = () => {
    if (!baseRecording) return;
    // Read the sources off the draft before publishing clears its markers: the published plan keeps naming them.
    setPublishedSources(recordPublishedSources(customer.id, getUpdateSources(getFormSections(baseRecording), getProseSections(baseRecording))));
    const result = publishPlanUpdate(getFormSections(baseRecording), getProseSections(baseRecording));
    setFormSections(baseRecording.id, result.forms);
    setProseSections(baseRecording.id, result.prose);
    setJustPublished(true);
  };

  // Every relink-family action below also un-publishes — same reasoning as
  // ChangeRecordingsButton's Replace on the other Assessment Hero pages:
  // choosing a different source (or removing it) means this document needs
  // review again, so a published document doesn't stay marked Published
  // while quietly pointing at content nobody's actually looked at yet. This
  // is what makes the post-publish reuse banner below (see
  // CarePlanDocumentContent) an actual "update" rather than a dead click —
  // it reopens this exact same dropdown.
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLinkedSource({ type: 'upload', fileName: file.name });
      setPublished(false);
    }
    e.target.value = '';
  };

  const relinkRecording = (id: string) => {
    setLinkedSource({ type: 'recording', id });
    setPublished(false);
  };

  const handleUnlink = () => {
    const name = linkedSource?.type === 'recording' ? linkedRecording?.label : linkedSource?.fileName;
    if (window.confirm(`Unlink "${name}" from this draft? The fields already accepted stay as they are, but nothing will sync from a recording until you link a new one.`)) {
      setLinkedSource(null);
      setPublished(false);
    }
  };

  return (
    <CarePlanDocumentContext.Provider
      value={{
        customer, navigate, dirty, setDirty, published, setPublished,
        isCompletedDocument, isUpdateDraft, updateInfo, updateSources, startUpdate, updating, discardUpdate, publishUpdate,
        noChangesFor, dismissNoChanges: () => setNoChangesFor(null),
        fileProblems, dismissFileProblems: () => setFileProblems(null),
        publishedSources, justPublished, dismissJustPublished: () => setJustPublished(false),
        linkedSource, setLinkedSource,
        linkedRecording, otherRecordings, pendingReview, pendingCount, fileInputRef,
        handleUpload, relinkRecording, handleUnlink,
      }}
    >
      {children}
    </CarePlanDocumentContext.Provider>
  );
}

/** Pinned sub-nav — same sticky treatment as CareManagementSubnav: lives in AppShell's infoBar, so it scrolls with CustomerInfo instead of away with the page content. */
export function CarePlanDocumentSubnav() {
  const { customer, navigate, dirty, published, isCompletedDocument, isUpdateDraft, setDirty } = useCarePlanDocument();
  const scrolled = useScrolled();
  // A completed document is saved like a published one, not as a draft — until it has an update awaiting review.
  const saved = (published || isCompletedDocument) && !isUpdateDraft;

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
                disabled={saved && !dirty}
                onClick={() => setDirty(false)}
              >
                {saved ? 'Save' : 'Save Draft'}
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

/**
 * The "Replace recording"/"Link a recording" dropdown — pulled out so it can
 * render identically in both the pre-publish Assessment Hero Draft banner
 * and the post-publish stripped-back reuse banner (see CarePlanDocumentContent)
 * rather than duplicating this markup for the second case. Picking anything
 * here (a different recording, an upload, or Unlink) also un-publishes —
 * see the note on relinkRecording/handleUpload/handleUnlink in the provider.
 */
function RelinkDropdown() {
  const { customer, linkedSource, otherRecordings, fileInputRef, relinkRecording, handleUnlink } = useCarePlanDocument();
  // Same as WIITM's RelinkDropdown: picking or uploading a recording would
  // re-draft the plan, which the customer's drafting limit blocks.
  if (isAssessmentHeroLimitReached(customer.id)) {
    return (
      <button
        type="button"
        disabled
        title={LIMIT_REACHED_TITLE}
        className="flex items-center gap-1 text-sm font-medium text-gray-500 cursor-not-allowed"
      >
        {linkedSource ? 'Replace recording' : 'Link a recording'}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-body font-medium text-[rgb(154,38,214)] hover:underline cursor-pointer"
        >
          {linkedSource ? 'Replace recording' : 'Link a recording'}
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Choose a different recording</DropdownMenuLabel>
        {otherRecordings.length > 0 ? (
          otherRecordings.map(r => (
            <DropdownMenuItem
              key={r.id}
              onSelect={() => relinkRecording(r.id)}
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
        {linkedSource && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleUnlink} className="flex items-center gap-2 text-red-600 focus:text-red-600">
              <Link2Off className="w-3.5 h-3.5" />
              Unlink recording
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Everything below the pinned sub-nav — the CareBridge Draft panel, title bar, History and the form itself. */
export function CarePlanDocumentContent() {
  const {
    customer, navigate, published, isCompletedDocument, isUpdateDraft, updateInfo, updateSources, startUpdate, updating, discardUpdate,
    publishUpdate, noChangesFor, dismissNoChanges, fileProblems, dismissFileProblems, publishedSources, justPublished, dismissJustPublished, linkedSource, linkedRecording,
    pendingReview, pendingCount, fileInputRef, handleUpload, setDirty, setPublished,
  } = useCarePlanDocument();

  // For a completed document (see COMPLETED_CARE_PLAN_CUSTOMERS) there is no draft/published banner above the
  // form at all, and — see asCompletedDocument / asCompletedSections on the customer's 'initial' recording —
  // no per-field pending highlighting, Check transcript, or Accept controls in the content below.
  const scrolled = useScrolled();
  const infoBarBottom = useInfoBarBottom();

  return (
    // Matches the Documents/Assessments list and CustomerDetailsPage's two-column width.
    <div className="flex flex-col gap-4 max-w-[1280px] mx-auto">
      {/* Hidden regardless of which menu item asked for it — one input, reused. */}
      <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleUpload} />

      {/* Sits above whatever Assessment Hero state the document is in —
          the limit is about the customer, not this document. */}
      <AssessmentHeroLimitNotice />

      {isCompletedDocument ? (
        isUpdateDraft && updateInfo ? (
          <div className="flex flex-col gap-3">
            {fileProblems && <UpdateProblemsNotice problems={fileProblems.problems} othersDrafted={fileProblems.othersDrafted} onDismiss={dismissFileProblems} />}
            <AssessmentHeroUpdateDraftBanner
              customerId={customer.id}
              sources={updateSources}
              changed={updateInfo.changed}
              pendingCount={pendingCount}
              onDiscard={discardUpdate}
              onPublish={publishUpdate}
            />
          </div>
        ) : UPDATE_BANNER_CUSTOMERS.includes(customer.id) && (
          <div className="flex flex-col gap-3">
            {justPublished && <PublishedConfirmationBanner onDismissed={dismissJustPublished} />}
            {fileProblems && <UpdateProblemsNotice problems={fileProblems.problems} othersDrafted={fileProblems.othersDrafted} onDismiss={dismissFileProblems} />}
            {noChangesFor && <UpdateNoChangesNotice sourceLabel={noChangesFor} onDismiss={dismissNoChanges} />}
            {updating ? (
              <DocumentUpdateProgress
                documentName="Customer Care and Support Plan"
                sourceLabel={describeSources(updating.sources)}
                steps={getUpdateSteps(updating.sources)}
                step={updating.step}
              />
            ) : (
              <AssessmentHeroUpdateBanner
                customerId={customer.id}
                documentName="Customer Care and Support Plan"
                onSelect={startUpdate}
                sources={publishedSources}
              />
            )}
          </div>
        )
      ) : published ? (
        <div className="flex flex-col gap-3">
          <PublishedConfirmationBanner />
          {/* Stripped-back reuse banner — same RelinkDropdown as the draft
              banner below, so Assessment Hero isn't a one-shot, pre-publish-
              only tool: picking a different/new recording here re-opens
              this document as a draft again (see relinkRecording). */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <img src={assessmentHeroIconUrl} className="w-6 h-6 flex-shrink-0" alt="Assessment Hero" />
              <p className="text-body text-purple-900">Drafted by Assessment Hero — add a recording to update.</p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              {linkedRecording && (
                <button
                  type="button"
                  onClick={() => navigate(`/customers/${customer.id}/documents/recording/${linkedRecording.id}`)}
                  className="flex items-center gap-1 text-body font-medium text-[rgb(154,38,214)] hover:underline cursor-pointer"
                >
                  View recording
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
              <RelinkDropdown />
            </div>
          </div>
        </div>
      ) : (
        // Two-toned rather than one purple-tinted block: a white top half for the
        // icon/title/description, and a purple bottom half housing the action
        // links/Publish button — those are all purple-branded, and against a
        // purple-tinted top half (or an amber one, tried earlier) they clashed
        // with the surrounding text. Splitting the panel keeps the purple
        // confined to where it's actually branding something clickable. The
        // pending count gets its own amber badge up top, so the banner still
        // flags outstanding review work without fighting either half's colour.
        <div className="rounded-lg border border-purple-200 shadow overflow-hidden">
          <div className="flex items-start gap-3 bg-white px-4 py-3">
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 pt-1">
              <img src={assessmentHeroIconUrl} className="w-8 h-8" alt="Assessment Hero" />
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
                <p className="text-body text-purple-800 mt-0.5">
                  Generated from <strong>{linkedRecording.label}</strong>, recorded{' '}
                  <strong>
                    {linkedRecording.recordingMeta.split(' · ')[0]} at{' '}
                    {linkedRecording.recordingMeta.split(' · ')[1].split('–')[0]}
                  </strong>{' '}
                  by <strong>{linkedRecording.recordedBy}</strong> — please review before accepting.
                </p>
              ) : linkedSource?.type === 'upload' ? (
                <p className="text-body text-purple-800 mt-0.5">
                  Generated from the uploaded recording <strong>{linkedSource.fileName}</strong> — please review
                  before accepting.
                </p>
              ) : (
                <p className="text-body text-purple-800 mt-0.5">
                  No recording is linked to this draft — the fields below reflect whatever was last accepted. Link an
                  existing recording or upload one to bring in new content.
                </p>
              )}
            </div>
          </div>

          {/* flex-wrap + a separate group for the links vs. the button means
              the button drops to its own line rather than overlapping the
              links when the panel's too narrow for both on one row. */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-purple-50 border-t border-purple-200 px-4 py-3">
            <div className="flex items-center gap-4">
              {linkedRecording && (
                <button
                  type="button"
                  onClick={() => navigate(`/customers/${customer.id}/documents/recording/${linkedRecording.id}`)}
                  className="flex items-center gap-1 text-body font-medium text-[rgb(154,38,214)] hover:underline cursor-pointer"
                >
                  View recording
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}

              <RelinkDropdown />
            </div>

            {/* Discard draft — same unwired stub as CareBridgeSubnav's own
                "Discard draft"; left of Publish, plain tertiary so it
                doesn't compete with Publish's primary styling. */}
            <div className="flex items-center gap-3">
              <Button variant="tertiary">Discard draft</Button>
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
        </div>
      )}

      {/* Sticky beneath the pinned sub-nav (CarePlanDocumentSubnav, in AppShell's
          infoBar) rather than scrolling away with the rest of the content —
          `top` tracks that sub-nav's *actual, currently-rendered* height via
          useInfoBarBottom() every frame, rather than a hardcoded pixel value
          per scrolled state: an earlier version keyed this off the same
          `scrolled` boolean with its own CSS transition, but that's a second,
          independently-animating copy of the sub-nav's own shrink transition
          — the two drift out of sync for the ~300ms the transition plays
          during a real scroll gesture, briefly exposing scrolled-past
          content in the gap between them. Measuring the real element every
          frame can't drift, by construction.
          Wrapped in its own sticky, page-coloured shell rather than putting
          `sticky` directly on the purple box: the flex column's gap-4 above
          this element is transparent, so once stuck, whatever's scrolling
          up from underneath would otherwise show through that gap for a
          frame before disappearing behind the sub-nav. `-mt-4` reaches up
          to cancel that gap and `pt-4` puts the same space back *inside*
          this sticky, bg-gray-50 box instead — same visual position, but
          now opaque, so nothing shows through as content scrolls past. */}
      <div className="sticky z-30 bg-gray-50 -mt-4 pt-4" style={{ top: infoBarBottom }}>
        <div
          className={`flex items-center justify-center px-5 rounded-lg border border-gray-200 transition-all duration-300 ${
            scrolled ? 'py-2' : 'py-4'
          }`}
          style={{ backgroundColor: '#6d1b98' }}
        >
          <h2 className="text-xl font-semibold text-white">Customer Care and Support Plan</h2>
        </div>
      </div>

      <div>
        <Button variant="tertiary" icon={<History className="w-4 h-4" />}>History</Button>
      </div>

      <div onChange={() => setDirty(true)}>
        <CarePlanDocumentView />
      </div>
    </div>
  );
}
