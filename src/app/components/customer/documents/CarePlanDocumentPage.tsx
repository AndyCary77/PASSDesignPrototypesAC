import { createContext, useContext as useReactContext, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, History, Printer, Trash2, Mic, ChevronDown, ChevronRight, Upload, Link2Off, CheckCircle2, Send } from 'lucide-react';
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
import { CarePlanDocumentView, CareBridgeContext, resolveRecording, resolveRecordings, type Recording } from '../CareBridgePage';
import { DocumentTabs } from './DocumentTabs';
import { useScrolled } from '../../../hooks/useScrolled';
import passgeniusPurpleUrl from '../../icons/passgenius-purple.svg';
import { triggerPassGeniusHover } from '../../icons/passgenius';

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
  linkedSource: LinkedSource;
  setLinkedSource: (source: LinkedSource) => void;
  linkedRecording: Recording | null;
  otherRecordings: Recording[];
  pendingReview: boolean;
  pendingCount: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  passgeniusRef: React.RefObject<HTMLObjectElement | null>;
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUnlink: () => void;
}

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
  const passgeniusRef = useRef<HTMLObjectElement>(null);
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

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setLinkedSource({ type: 'upload', fileName: file.name });
    e.target.value = '';
  };

  const handleUnlink = () => {
    const name = linkedSource?.type === 'recording' ? linkedRecording?.label : linkedSource?.fileName;
    if (window.confirm(`Unlink "${name}" from this draft? The fields already accepted stay as they are, but nothing will sync from a recording until you link a new one.`)) {
      setLinkedSource(null);
    }
  };

  return (
    <CarePlanDocumentContext.Provider
      value={{
        customer, navigate, dirty, setDirty, published, setPublished, linkedSource, setLinkedSource,
        linkedRecording, otherRecordings, pendingReview, pendingCount, fileInputRef, passgeniusRef, handleUpload, handleUnlink,
      }}
    >
      {children}
    </CarePlanDocumentContext.Provider>
  );
}

/** Pinned sub-nav — same sticky treatment as CareManagementSubnav: lives in AppShell's infoBar, so it scrolls with CustomerInfo instead of away with the page content. */
export function CarePlanDocumentSubnav() {
  const { customer, navigate, dirty, published, setDirty } = useCarePlanDocument();
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

/** Everything below the pinned sub-nav — the CareBridge Draft panel, title bar, History and the form itself. */
export function CarePlanDocumentContent() {
  const {
    customer, navigate, published, linkedSource, setLinkedSource, linkedRecording, otherRecordings,
    pendingReview, pendingCount, fileInputRef, passgeniusRef, handleUpload, handleUnlink, setDirty, setPublished,
  } = useCarePlanDocument();

  // Vera's Care and Support Plan is being treated as an already-completed
  // document (drafted from her completed assessment paperwork, not a
  // recording — see the project note on her Assessments list entry), so it
  // shows as a real, finished document rather than a CareBridge draft: no
  // draft/published banner above it at all, and (see asCompletedDocument /
  // asCompletedSections on her 'initial' recording) no per-field pending
  // highlighting, Check transcript, or Accept controls in the content below.
  const isCompletedDocument = customer.id === 'vera-bramwell';

  return (
    // Matches the Documents/Assessments list and CustomerDetailsPage's two-column width.
    <div className="flex flex-col gap-4 max-w-[1280px] mx-auto">
      {/* Hidden regardless of which menu item asked for it — one input, reused. */}
      <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleUpload} />

      {isCompletedDocument ? null : published ? (
        /* Publish is one-way — once the draft becomes a saved document, the
           review/relink workflow below no longer applies. */
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
      ) : (
        // Two-toned rather than one purple-tinted block: a white top half for the
        // icon/title/description, and a purple bottom half housing the action
        // links/Publish button — those are all purple-branded, and against a
        // purple-tinted top half (or an amber one, tried earlier) they clashed
        // with the surrounding text. Splitting the panel keeps the purple
        // confined to where it's actually branding something clickable. The
        // pending count gets its own amber badge up top, so the banner still
        // flags outstanding review work without fighting either half's colour.
        // Hovering anywhere on the panel plays the PASSgenius mark's own hover animation.
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
                  by <strong>{linkedRecording.recordedBy}</strong> — please review before accepting.
                </p>
              ) : linkedSource?.type === 'upload' ? (
                <p className="text-sm text-purple-800 mt-0.5">
                  Generated from the uploaded recording <strong>{linkedSource.fileName}</strong> — please review
                  before accepting.
                </p>
              ) : (
                <p className="text-sm text-purple-800 mt-0.5">
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
                        onSelect={() => setLinkedSource({ type: 'recording', id: r.id })}
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
      )}

      <div className="flex items-center px-5 py-4 rounded-lg border border-gray-200 bg-white">
        <h2 className="text-xl font-semibold text-gray-900">Customer Care and Support Plan</h2>
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
