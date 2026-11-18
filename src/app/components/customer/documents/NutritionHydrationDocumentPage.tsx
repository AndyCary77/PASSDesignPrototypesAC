import { createContext, useContext as useReactContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, History, Printer, Send, Trash2 } from 'lucide-react';
import { Button } from '../../buttons/Button';
import { useCustomer } from '../../../data/CustomerContext';
import type { CustomerProfile } from '../../../data/customers';
import {
  FormFieldsView, countPendingReview, PublishedConfirmationBanner, resolveRecording, type FormField,
} from '../CareBridgePage';
import { DocumentTabs } from './DocumentTabs';
import { AssessmentHeroLimitNotice, isAssessmentHeroLimitReached, LIMIT_REACHED_TITLE } from './AssessmentHeroLimitBanner';
import { AssessmentHeroSourceIndicator, UpdateDocumentDialog, UpdateNoChangesNotice, UpdateProblemsNotice, describeSources, getSourceProblem, type FileProblem, type PickerSeed, type UpdateSource } from './UpdateDocumentBanner';
import { DocumentUpdateProgress, UPDATE_COMPLETE_HOLD_MS } from './UpdateProgress';
import { needsChoice } from './sourceMerge';
import { NUTRITION_DEMOS, PERSONAL_CARE_DEMOS, demoSource, type Demo } from './demoLinks';
import { CUSTOMER_FILES } from '../../../data/customerFiles';
import {
  NUTRITION_BLANK_FIELDS, NUTRITION_GROUPS, applyNutritionFill, getFillSteps, getNutritionFill,
  type FillPatch, type NutritionGroup,
} from './nutritionHydrationData';
import {
  PERSONAL_CARE_BLANK_FIELDS, VERA_PERSONAL_CARE_FILL, personalCareGroupsFor,
} from './personalCareMovingHandlingData';
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

// The same blank-then-fill flow serves any assessment that starts empty: what differs is the document's name, its
// fields and layout, and what each recording or file answers. Vera's "Personal Care / Moving and Handling" assessment
// (the AIOP-25788 scenario — a draft that adds whole items, not just answers) is the second user of it.
export interface FillConfig {
  documentName: string;
  blankFields: FormField[];
  groups: NutritionGroup[];
  getFill: (source: UpdateSource) => FillPatch | null;
  /** Where in each file an answer came from — only needed when files can contribute. */
  fileExtracts?: Record<string, Record<string, { location: string; text: string }>>;
  demos: Record<string, Demo>;
  /** The summary banner above the form already says where the draft came from, so skip the chip on every field. */
  hideFieldSourceTag?: boolean;
}

const NUTRITION_CONFIG: FillConfig = {
  documentName: 'Nutrition and Hydration Assessment',
  blankFields: NUTRITION_BLANK_FIELDS,
  groups: NUTRITION_GROUPS,
  getFill: getNutritionFill,
  demos: NUTRITION_DEMOS,
};

const PERSONAL_CARE_CONFIG: FillConfig = {
  documentName: 'Personal Care / Moving and Handling',
  blankFields: PERSONAL_CARE_BLANK_FIELDS,
  groups: personalCareGroupsFor('Vera'),
  // Only her recording has anything on this; none of her files covers personal care or moving and handling.
  getFill: source => (source.type === 'recording' ? VERA_PERSONAL_CARE_FILL[source.id] ?? null : null),
  fileExtracts: {},
  demos: PERSONAL_CARE_DEMOS,
  hideFieldSourceTag: true,
};

interface NutritionDocumentState {
  config: FillConfig;
  customer: CustomerProfile;
  navigate: ReturnType<typeof useNavigate>;
  dirty: boolean;
  setDirty: (dirty: boolean) => void;
  fields: FormField[];
  setFields: (fields: FormField[]) => void;
  /** What the draft was filled from; empty while the document is blank. */
  filledSources: UpdateSource[];
  filledCount: number;
  /** New items the draft added to repeating groups (products, risks, equipment…). */
  itemsAdded: number;
  filling: { sources: UpdateSource[]; step: number } | null;
  startFill: (sources: UpdateSource[]) => void;
  /** A ?demo= link asked for the source picker to open already showing something. */
  pickerSeed?: PickerSeed;
  /** Files in the last run that couldn't be read — and whether the rest still filled something in. */
  fileProblems: { problems: FileProblem[]; othersDrafted: boolean } | null;
  dismissFileProblems: () => void;
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

function FillDocumentProvider({ config, children }: { config: FillConfig; children: React.ReactNode }) {
  const navigate = useNavigate();
  const customer = useCustomer();
  const [dirty, setDirty] = useState(false);
  const [fields, setFields] = useState<FormField[]>(config.blankFields);
  const [filledSources, setFilledSources] = useState<UpdateSource[]>([]);
  const [filledCount, setFilledCount] = useState(0);
  const [itemsAdded, setItemsAdded] = useState(0);
  const [filling, setFilling] = useState<{ sources: UpdateSource[]; step: number } | null>(null);
  const [fileProblems, setFileProblems] = useState<{ problems: FileProblem[]; othersDrafted: boolean } | null>(null);
  const [noChangesFor, setNoChangesFor] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  const startFill = (sources: UpdateSource[]) => {
    setNoChangesFor(null);
    setFileProblems(null);
    setFilling({ sources, step: 0 });
  };

  // Works out what the file answers and drafts it in (or reports there was nothing). Runs once the stepper is done.
  const finishFill = (sources: UpdateSource[]) => {
    // A file that can't be read is named and nothing is drafted from it; the other sources still go ahead.
    const problems = sources.flatMap(s => getSourceProblem(customer.id, s) ?? []);
    const readable = sources.filter(s => !getSourceProblem(customer.id, s));
    const found = readable.flatMap(s => {
      const patch = config.getFill(s);
      return patch ? [{ source: s, patch }] : [];
    });
    const result = found.length > 0 ? applyNutritionFill(config.blankFields, found, customer.id, config.fileExtracts) : null;
    const drafted = !!result && result.filled > 0;
    if (problems.length > 0) setFileProblems({ problems, othersDrafted: drafted });
    if (!result || !drafted) {
      if (readable.length > 0) setNoChangesFor(describeSources(readable));
      return;
    }
    setFields(result.fields);
    // Only the sources that actually had something are named as where the draft came from.
    setFilledSources(found.map(f => f.source));
    setFilledCount(result.filled);
    setItemsAdded(result.items);
  };

  // ?demo=<name> (see demoLinks.ts): put the form in a named state on load, so a link can land on it without the clicks.
  const [searchParams] = useSearchParams();
  const demo = config.demos[searchParams.get('demo') ?? ''];
  const demoRan = useRef(false);
  useEffect(() => {
    if (!demo?.sources || demoRan.current) return;
    demoRan.current = true;
    finishFill(demo.sources.flatMap(k => demoSource(customer.id, k, id => CUSTOMER_FILES[customer.id]?.find(f => f.id === id)) ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The "thinking time" — same stepper as updating a finished document, kept here so leaving the page cancels it.
  useEffect(() => {
    if (!filling) return;
    const steps = getFillSteps(filling.sources);
    const isFinalHold = filling.step === steps.length;
    const timer = window.setTimeout(() => {
      if (isFinalHold) {
        finishFill(filling.sources);
        setFilling(null);
      } else {
        setFilling(f => (f ? { ...f, step: f.step + 1 } : f));
      }
    }, isFinalHold ? UPDATE_COMPLETE_HOLD_MS : steps[filling.step].ms);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filling]);

  const discardDraft = () => {
    setFields(config.blankFields);
    setFilledSources([]);
    setFilledCount(0);
    setItemsAdded(0);
    setDirty(false);
  };

  const pendingCount = countPendingReview(fields);

  return (
    <NutritionDocumentContext.Provider
      value={{
        config, customer, navigate, dirty, setDirty, fields, setFields, filledSources, filledCount, itemsAdded, filling, startFill, pickerSeed: demo?.picker,
        fileProblems, dismissFileProblems: () => setFileProblems(null),
        discardDraft, noChangesFor, dismissNoChanges: () => setNoChangesFor(null),
        published, publish: () => setPublished(true), pendingCount,
      }}
    >
      {children}
    </NutritionDocumentContext.Provider>
  );
}

export function NutritionDocumentProvider({ children }: { children: React.ReactNode }) {
  return <FillDocumentProvider config={NUTRITION_CONFIG}>{children}</FillDocumentProvider>;
}

/** Vera's blank Personal Care / Moving and Handling assessment, filled from a recording. */
export function PersonalCareFillProvider({ children }: { children: React.ReactNode }) {
  return <FillDocumentProvider config={PERSONAL_CARE_CONFIG}>{children}</FillDocumentProvider>;
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
  const { customer, startFill, pickerSeed, config } = useNutritionDocument();
  const DOCUMENT_NAME = config.documentName;
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
          seed={pickerSeed}
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
  const { config, filledSources, filledCount, itemsAdded, pendingCount, discardDraft, publish } = useNutritionDocument();
  const filledFrom = filledSources.length > 0 ? describeSources(filledSources) : '';
  const total = config.blankFields.length;
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
            the {total} fields, so {left} {left === 1 ? 'is' : 'are'} still blank.
            {itemsAdded > 0 && <> It also <strong>added {itemsAdded} {itemsAdded === 1 ? 'item' : 'items'}</strong> to the lists below, which were empty.</>}
            {' '}Please review before accepting.
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
    config, customer, fields, setFields, setDirty, filledSources, filling, noChangesFor, dismissNoChanges, fileProblems, dismissFileProblems, published,
  } = useNutritionDocument();
  // Filled from a recording, each field's Check transcript points into that recording; a file has no transcript.
  const onlySource = filledSources.length === 1 ? filledSources[0] : undefined;
  const citedRecording = onlySource?.type === 'recording' ? resolveRecording(customer.id, onlySource.id) : undefined;
  const DOCUMENT_NAME = config.documentName;
  const scrolled = useScrolled();
  const infoBarBottom = useInfoBarBottom();

  return (
    <div className="flex flex-col gap-4 max-w-[1280px] mx-auto">
      <AssessmentHeroLimitNotice />

      {published ? (
        <div className="flex flex-col gap-3">
          <PublishedConfirmationBanner />
          {/* The small "drafted with Assessment Hero" indicator stays on the published form and names its source. */}
          {filledSources.length > 0 && <AssessmentHeroSourceIndicator customerId={customer.id} sources={filledSources} />}
        </div>
      ) : filling ? (
        <DocumentUpdateProgress
          action="Filling in"
          documentName={DOCUMENT_NAME}
          sourceLabel={describeSources(filling.sources)}
          steps={getFillSteps(filling.sources)}
          step={filling.step}
        />
      ) : filledSources.length > 0 ? (
        <div className="flex flex-col gap-3">
          {fileProblems && <UpdateProblemsNotice problems={fileProblems.problems} othersDrafted={fileProblems.othersDrafted} onDismiss={dismissFileProblems} />}
          <FilledDraftBanner />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {fileProblems && <UpdateProblemsNotice problems={fileProblems.problems} othersDrafted={fileProblems.othersDrafted} onDismiss={dismissFileProblems} />}
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
        {config.groups.map((group, i) => {
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
                  hideSourceTag={config.hideFieldSourceTag}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
