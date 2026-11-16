import { createContext, useContext as useReactContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, History, Printer, Send, Trash2 } from 'lucide-react';
import { Button } from '../../buttons/Button';
import { useCustomer } from '../../../data/CustomerContext';
import type { CustomerProfile } from '../../../data/customers';
import {
  FormFieldsView, isFieldCaptured, PublishedConfirmationBanner, resolveRecording, type FormField,
} from '../CareBridgePage';
import { DocumentTabs } from './DocumentTabs';
import { AssessmentHeroLimitNotice, isAssessmentHeroLimitReached, LIMIT_REACHED_TITLE } from './AssessmentHeroLimitBanner';
import { UpdateDocumentDialog, UpdateNoChangesNotice, type UpdateSource } from './UpdateDocumentBanner';
import { DocumentUpdateProgress, UPDATE_COMPLETE_HOLD_MS } from './UpdateProgress';
import {
  NUTRITION_BLANK_FIELDS, NUTRITION_GROUPS, applyNutritionFill, getFillSteps, getNutritionFill,
} from './nutritionHydrationData';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '../../ui/alert-dialog';
import { useScrolled } from '../../../hooks/useScrolled';
import { useInfoBarBottom } from '../../../hooks/useInfoBarBottom';
import assessmentHeroIconUrl from '../../icons/assessment-hero.svg';

// Vera's "Nutrition and Hydration Assessment": an INCOMPLETE assessment — a blank form — that Assessment Hero can
// fill from a file. Same single-page shape as the Personal Care / Moving and Handling document, but it starts
// empty rather than as a recording's draft. The flow: blank → "Fill from a file" (pick one of her files) → a few
// seconds of "thinking time" → a draft with only the answers that file contained, each awaiting review → Publish.
// Everything is simulated and held in this provider's own state (see nutritionHydrationData.ts for what each
// file contributes).

const DOCUMENT_NAME = 'Nutrition and Hydration Assessment';

interface NutritionDocumentState {
  customer: CustomerProfile;
  navigate: ReturnType<typeof useNavigate>;
  dirty: boolean;
  setDirty: (dirty: boolean) => void;
  fields: FormField[];
  setFields: (fields: FormField[]) => void;
  /** What the draft was filled from; null while the document is blank. */
  filledSource: UpdateSource | null;
  filledCount: number;
  filling: { source: UpdateSource; step: number } | null;
  startFill: (source: UpdateSource) => void;
  discardDraft: () => void;
  noChangesFor: string | null;
  dismissNoChanges: () => void;
  published: boolean;
  publish: () => void;
  pendingCount: number;
}

const NutritionDocumentContext = createContext<NutritionDocumentState | null>(null);

function useNutritionDocument(): NutritionDocumentState {
  const ctx = useReactContext(NutritionDocumentContext);
  if (!ctx) throw new Error('useNutritionDocument must be used within NutritionDocumentProvider');
  return ctx;
}

export function NutritionDocumentProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const customer = useCustomer();
  const [dirty, setDirty] = useState(false);
  const [fields, setFields] = useState<FormField[]>(NUTRITION_BLANK_FIELDS);
  const [filledSource, setFilledSource] = useState<UpdateSource | null>(null);
  const [filledCount, setFilledCount] = useState(0);
  const [filling, setFilling] = useState<{ source: UpdateSource; step: number } | null>(null);
  const [noChangesFor, setNoChangesFor] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  const startFill = (source: UpdateSource) => {
    setNoChangesFor(null);
    setFilling({ source, step: 0 });
  };

  // Works out what the file answers and drafts it in (or reports there was nothing). Runs once the stepper is done.
  const finishFill = (source: UpdateSource) => {
    const sourceLabel = source.type === 'file' ? source.name : source.label;
    const patch = getNutritionFill(source);
    const result = patch && applyNutritionFill(NUTRITION_BLANK_FIELDS, patch);
    if (!result || result.filled === 0) {
      setNoChangesFor(sourceLabel);
      return;
    }
    setFields(result.fields);
    setFilledSource(source);
    setFilledCount(result.filled);
  };

  // The "thinking time" — same stepper as updating a finished document, kept here so leaving the page cancels it.
  useEffect(() => {
    if (!filling) return;
    const steps = getFillSteps(filling.source.type);
    const isFinalHold = filling.step === steps.length;
    const timer = window.setTimeout(() => {
      if (isFinalHold) {
        finishFill(filling.source);
        setFilling(null);
      } else {
        setFilling(f => (f ? { ...f, step: f.step + 1 } : f));
      }
    }, isFinalHold ? UPDATE_COMPLETE_HOLD_MS : steps[filling.step].ms);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filling]);

  const discardDraft = () => {
    setFields(NUTRITION_BLANK_FIELDS);
    setFilledSource(null);
    setFilledCount(0);
    setDirty(false);
  };

  const pendingCount = fields.filter(f => isFieldCaptured(f) && f.reviewed === false).length;

  return (
    <NutritionDocumentContext.Provider
      value={{
        customer, navigate, dirty, setDirty, fields, setFields, filledSource, filledCount, filling, startFill,
        discardDraft, noChangesFor, dismissNoChanges: () => setNoChangesFor(null),
        published, publish: () => setPublished(true), pendingCount,
      }}
    >
      {children}
    </NutritionDocumentContext.Provider>
  );
}

/** Pinned sub-nav — same sticky treatment as the other document click-throughs. */
export function NutritionDocumentSubnav() {
  const { customer, navigate, dirty, published, setDirty } = useNutritionDocument();
  const scrolled = useScrolled();

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="max-w-[1280px] mx-auto">
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
              <Button disabled={published && !dirty} onClick={() => setDirty(false)}>
                {published ? 'Save' : 'Save Draft'}
              </Button>
            </div>
          </div>

          <div className={`border-t border-gray-200 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3'}`}>
            <DocumentTabs activeTab="assessments" onTabChange={tab => navigate(`/customers/${customer.id}/documents?tab=${tab}`)} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Minimal prompt above a blank document: Assessment Hero offering to fill it from a recording or a file. */
function FillBanner() {
  const { customer, startFill } = useNutritionDocument();
  const limitReached = isAssessmentHeroLimitReached(customer.id);

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
      <div className="flex items-center gap-2 min-w-0">
        <img src={assessmentHeroIconUrl} className="w-6 h-6 flex-shrink-0" alt="Assessment Hero" />
        <p className="text-body text-purple-900">Assessment Hero &ndash; AI-powered document drafts from audio recordings or files</p>
      </div>
      {limitReached ? (
        <button
          type="button"
          disabled
          title={LIMIT_REACHED_TITLE}
          className="flex items-center gap-1 text-body font-medium text-gray-500 cursor-not-allowed"
        >
          Select a recording or file
        </button>
      ) : (
        <UpdateDocumentDialog
          customerId={customer.id}
          documentName={DOCUMENT_NAME}
          onSelect={startFill}
          title="Select a recording or file"
          description={`Choose a recording or a file to fill in the ${DOCUMENT_NAME} from.`}
          trigger={
            <button
              type="button"
              className="flex items-center gap-1 text-body font-medium text-[rgb(154,38,214)] hover:underline cursor-pointer flex-shrink-0"
            >
              Select a recording or file
            </button>
          }
        />
      )}
    </div>
  );
}

/** The panel above a filled-in draft: what it was made from, what is left for the reviewer, Discard and Publish. */
function FilledDraftBanner() {
  const { filledSource, filledCount, pendingCount, discardDraft, publish } = useNutritionDocument();
  const filledFrom = filledSource ? (filledSource.type === 'file' ? filledSource.name : filledSource.label) : '';
  const total = NUTRITION_BLANK_FIELDS.length;
  const left = total - filledCount;

  return (
    <div className="rounded-lg border border-purple-200 shadow overflow-hidden">
      <div className="flex items-start gap-3 bg-white px-4 py-3">
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 pt-1">
          <img src={assessmentHeroIconUrl} className="w-8 h-8" alt="Assessment Hero" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold text-purple-900 flex flex-wrap items-center gap-2">
            Assessment Hero Draft
            {pendingCount > 0 && (
              <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-sm font-semibold text-amber-800">
                {pendingCount} {pendingCount === 1 ? 'field' : 'fields'} to review
              </span>
            )}
          </p>
          <p className="text-body text-purple-800 mt-0.5">
            Filled in from <strong className="break-words">{filledFrom}</strong> &mdash; it found answers for {filledCount} of
            the {total} fields, so {left} {left === 1 ? 'is' : 'are'} still blank. Please review before accepting.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-3 bg-purple-50 border-t border-purple-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="tertiary">Discard draft</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard this draft?</AlertDialogTitle>
                <AlertDialogDescription>
                  The assessment goes back to blank. Anything Assessment Hero filled in from {filledFrom}, and anything
                  you have accepted or changed, is discarded.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">Keep draft</AlertDialogCancel>
                <AlertDialogAction onClick={discardDraft} className="rounded-full bg-red-600 text-white hover:bg-red-700">
                  Discard draft
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            icon={<Send className="w-4 h-4" />}
            disabled={pendingCount > 0}
            title={pendingCount > 0 ? 'Accept the outstanding drafted fields before publishing' : undefined}
            onClick={publish}
          >
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Everything below the pinned sub-nav — the Assessment Hero panel, title bar, History and the form itself. */
export function NutritionDocumentContent() {
  const {
    customer, fields, setFields, setDirty, filledSource, filling, noChangesFor, dismissNoChanges, published,
  } = useNutritionDocument();
  // Filled from a recording, each field's Check transcript points into that recording; a file has no transcript.
  const citedRecording = filledSource?.type === 'recording' ? resolveRecording(customer.id, filledSource.id) : undefined;
  const scrolled = useScrolled();
  const infoBarBottom = useInfoBarBottom();

  return (
    <div className="flex flex-col gap-4 max-w-[1280px] mx-auto">
      <AssessmentHeroLimitNotice />

      {published ? (
        <PublishedConfirmationBanner />
      ) : filling ? (
        <DocumentUpdateProgress
          action="Filling in"
          documentName={DOCUMENT_NAME}
          sourceLabel={filling.source.type === 'file' ? filling.source.name : filling.source.label}
          steps={getFillSteps(filling.source.type)}
          step={filling.step}
        />
      ) : filledSource ? (
        <FilledDraftBanner />
      ) : (
        <div className="flex flex-col gap-3">
          {noChangesFor && (
            <UpdateNoChangesNotice
              sourceLabel={noChangesFor}
              onDismiss={dismissNoChanges}
            />
          )}
          <FillBanner />
        </div>
      )}

      {/* Sticky beneath the pinned sub-nav, in an opaque bg-gray-50 shell that swallows the gap-4 above it —
          `top` tracks the sub-nav's actual height every frame (useInfoBarBottom). */}
      <div className="sticky z-30 bg-gray-50 -mt-4 pt-4" style={{ top: infoBarBottom }}>
        <div
          className={`flex items-center justify-center px-5 rounded-lg border border-gray-200 transition-all duration-300 ${
            scrolled ? 'py-2' : 'py-4'
          }`}
          style={{ backgroundColor: '#6d1b98' }}
        >
          <h2 className="text-xl font-semibold text-white">{DOCUMENT_NAME}</h2>
        </div>
      </div>

      <div>
        <Button variant="tertiary" icon={<History className="w-4 h-4" />}>History</Button>
      </div>

      <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm p-6" onChange={() => setDirty(true)}>
        {NUTRITION_GROUPS.map((group, i) => {
          const groupFields = fields.filter(f => group.fieldIds.includes(f.id));
          return (
            <div key={i} className={i > 0 ? 'mt-6' : undefined}>
              {group.heading && <h2 className="text-lg font-semibold text-gray-900 mb-3">{group.heading}</h2>}
              {group.subheading && <h3 className="text-sm font-semibold text-gray-700 mb-2">{group.subheading}</h3>}
              {groupFields.length > 0 && (
                <FormFieldsView
                  fields={groupFields}
                  onChange={updated => setFields(fields.map(f => updated.find(u => u.id === f.id) ?? f))}
                  transcript={citedRecording?.transcript ?? []}
                  audioUrl={citedRecording?.audioUrl}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
