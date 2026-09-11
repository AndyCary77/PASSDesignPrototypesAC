import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight, Eye, Check, CheckCircle2, Info, Loader2, Send, Sparkles, X, Trash2 } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../ui/tooltip';
import { Button } from '../../buttons/Button';
import { Checkbox } from '../../ui/checkbox';
import { useCareManagement, CARE_PLAN_DRAFT_STEPS } from './CareManagementContext';
import { useCareData, recordingForSource } from './useCareData';
import { RecordingsLink, ChangeRecordingsButton, AssessmentHeroReuseBanner, type Recording } from '../CareBridgePage';
import { useCustomer } from '../../../data/CustomerContext';
import { getCompletedDocuments } from '../../../data/mock-documents';
import { StarSolidIcon, CalendarSolidIcon, TickSolidIcon, PlusSolidIcon, NutritionSolidIcon, HydrateSolidIcon } from '../../icons/CarePlanIcons';
import assessmentHeroIconUrl from '../../icons/assessment-hero.svg';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '../../ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../../ui/dialog';
import type { TaskCategory } from './types';

export const inputClass = 'w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[rgb(154,38,214)] focus:ring-1 focus:ring-[rgb(154,38,214)]';
export const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export const CATEGORY_CONFIG: Record<TaskCategory, {
  bg: string; text: string; border: string; headerBg: string; circleBg: string; Icon: React.ComponentType<{ className?: string }>;
}> = {
  General:           { bg: 'bg-yellow-50',  text: 'text-yellow-800',  border: 'border-yellow-200', headerBg: 'bg-yellow-50',  circleBg: 'bg-yellow-200',  Icon: TickSolidIcon },
  Nutrition:         { bg: 'bg-[#edf7e9]',  text: 'text-[#2D5F1E]',   border: 'border-[#cce6c3]',  headerBg: 'bg-[#edf7e9]',  circleBg: 'bg-[#d5eccc]',  Icon: NutritionSolidIcon },
  Medications:       { bg: 'bg-red-50',     text: 'text-red-800',     border: 'border-red-200',    headerBg: 'bg-red-50',     circleBg: 'bg-red-200',     Icon: PlusSolidIcon },
  Hydration:         { bg: 'bg-cyan-50',    text: 'text-cyan-800',    border: 'border-cyan-200',   headerBg: 'bg-cyan-50',    circleBg: 'bg-cyan-200',    Icon: HydrateSolidIcon },
  'Outcome Tracking':{ bg: 'bg-orange-50',  text: 'text-orange-800',  border: 'border-orange-200', headerBg: 'bg-orange-50',  circleBg: 'bg-orange-200',  Icon: StarSolidIcon },
  Observations:      { bg: 'bg-purple-50',  text: 'text-purple-800',  border: 'border-purple-200', headerBg: 'bg-purple-50',  circleBg: 'bg-purple-200',  Icon: Eye },
};

export function EmptyTab({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-lg border border-dashed border-gray-300 py-16 text-center">
      <p className="text-sm text-gray-500">No {label} yet</p>
      <p className="text-xs text-gray-400 mt-1">Nothing has been added for this customer.</p>
    </div>
  );
}

/** Accept control for a single drafted record. There is no bulk equivalent by design. */
export function AcceptButton({ onAccept }: { onAccept: () => void }) {
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onAccept(); }}
      className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors cursor-pointer"
    >
      <Check className="w-3.5 h-3.5" /> Accept
    </button>
  );
}

/**
 * Discard control for a single drafted record, sitting next to Accept.
 * Discarding is permanent (there's no "undo" affordance anywhere else in the
 * plan for it to reappear from) so it goes behind a confirm step rather than
 * firing straight off the click.
 */
export function DiscardButton({ onDiscard, itemLabel }: { onDiscard: () => void; itemLabel: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          onClick={e => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-red-700 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" /> Discard
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent onClick={e => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard this {itemLabel}?</AlertDialogTitle>
          <AlertDialogDescription>
            Assessment Hero suggested this from a recording. Discarding it removes the suggestion for
            good — it won't be added to the care plan, and there's no way to bring it back once
            it's gone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">Keep as draft</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDiscard}
            className="rounded-full bg-red-600 text-white hover:bg-red-700"
          >
            Discard
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Detail-view delete action. Lives in the subnav's actions row in place of
 * Print/Save while an Outcome or Task is open — a destructive action reads
 * clearer alone than mixed in with routine ones. Applies to any outcome or
 * task, drafted or already live, so the copy stays generic rather than
 * referencing CareBridge the way DiscardButton's does. Confirms first, same
 * reasoning as Discard: nothing else in the plan can bring it back.
 */
export function DeleteButton({ onDelete, itemLabel }: { onDelete: () => void; itemLabel: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 rounded-full h-9 px-5 text-sm border-0 bg-red-50 text-red-700 hover:bg-red-100"
        >
          <Trash2 className="w-4 h-4" />
          Delete {itemLabel}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this {itemLabel.toLowerCase()}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes it from the care plan for good — there's no way to bring it back once
            it's gone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className="rounded-full bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Accept/Discard strip for a single drafted record. Docks to whichever edge
 * of its white container borders the rest of the pending content — the
 * bottom of a list card, or the top of the detail/edit panel — so the same
 * "this is still a draft" treatment reads the same in both places instead of
 * the detail view inventing its own separate banner style.
 */
export function DraftActionBar({
  source, itemLabel, onAccept, onDiscard, edge = 'bottom',
}: {
  source?: string;
  itemLabel: string;
  onAccept: () => void;
  onDiscard: () => void;
  edge?: 'top' | 'bottom';
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-5 py-3 bg-amber-50 ${
        edge === 'bottom' ? 'border-t border-amber-200' : 'border-b border-amber-200'
      }`}
    >
      <span className="text-xs text-amber-800">
        {source ? `Drafted by Assessment Hero from ${source}` : 'Drafted by Assessment Hero'}
      </span>
      <div className="flex items-center gap-4">
        <AcceptButton onAccept={onAccept} />
        <DiscardButton onDiscard={onDiscard} itemLabel={itemLabel} />
      </div>
    </div>
  );
}

/**
 * Names where a draft came from, inline within a sentence — a plain bolded
 * name when there's just one recording, or a single "N recordings" badge when
 * there's more, hovering (or focusing) anywhere on the badge itself reveals
 * each one. Keeps the sentence short regardless of how many recordings
 * actually contributed, rather than spelling every one of them out inline
 * (which stops being readable past two or three) or silently only naming
 * the first.
 */
function DraftSourcesNote({ sources, kind = 'recording' }: { sources: string[]; kind?: 'recording' | 'document' }) {
  if (sources.length === 0) return null;
  if (sources.length === 1) return <strong>{sources[0]}</strong>;
  const kindLabel = kind === 'document' ? 'documents' : 'recordings';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          aria-label={`Show the ${sources.length} ${kindLabel} this was drafted from`}
          // CareBridge's own purple rather than colour-matched to whichever
          // banner it sits in (also purple for the offer/running state, but
          // deliberately purple even against the green success banner — a
          // consistent CareBridge-branded tint rather than blending into
          // either). Text stays the same size as the sentence around it —
          // only the weight and the tint mark it as its own element.
          // `leading-none` shrinks the pill's own line-height down to its
          // font size, so the padding+border added back on top lands the
          // whole box back at ~20px — the same as the text-sm line-height
          // around it — and `align-middle` then centres it against the
          // sentence's baseline correctly instead of floating above it (a
          // taller box centred via vertical-align sits higher than the text).
          // The whole badge is the tooltip trigger — not just the icon — so
          // hovering the count itself is enough.
          className="inline-flex items-center gap-1 align-middle leading-none rounded-full border border-purple-200 bg-purple-100 px-2 py-0.5 text-sm font-semibold text-purple-900 cursor-default outline-none hover:bg-purple-200 focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50"
        >
          {sources.length} {kindLabel}
          <Info className="w-3.5 h-3.5 text-[rgb(154,38,214)]" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <ul className="space-y-0.5">
          {sources.map(source => <li key={source}>{source}</li>)}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * CareBridge draft banner, shown above the list on each care-plan tab while
 * the plan is still a CareBridge draft rather than a real, published one.
 * Same role as the "CareBridge Draft" banner on a document: says where the
 * content came from and how much is left to review, without implying it's
 * already part of the live plan — and, once nothing's left to review, offers
 * the Publish step that actually makes it one.
 */
export function CarePlanDraftBanner({
  pendingOutcomes, pendingTasks, sources, activeTab,
}: {
  pendingOutcomes: number;
  pendingTasks: number;
  sources?: string[];
  activeTab: 'outcomes' | 'tasks' | 'visits';
}) {
  const customer = useCustomer();
  const navigate = useNavigate();
  const {
    planPublished, publishPlan, planPublishedNoticeDismissed, dismissPlanPublishedNotice, draftSourceDocuments,
  } = useCareManagement();
  // Only for handleChangeRecordings — every other value here duplicates what
  // the caller already computed and passed down as props (pendingOutcomes,
  // pendingTasks, sources), so it'd be redundant to also destructure them
  // from here.
  const { handleChangeRecordings } = useCareData();
  // Whether `sources` names completed documents (picked in
  // CarePlanDraftSourcePicker) rather than recordings — changes the bottom
  // bar's link wording and where it points, since a document-drafted plan
  // has nothing recorded to view.
  const draftedFromDocuments = !!draftSourceDocuments;
  // Resolved back to real Recording objects (see recordingForSource) so the
  // bottom bar can use the same RecordingsLink/ChangeRecordingsButton every
  // other Assessment Hero draft banner does, rather than a single link that
  // only ever goes to the whole CareBridge tab regardless of how many
  // recordings actually contributed. Empty for a document-drafted plan —
  // there's no Recording to resolve a document name against.
  const linkedRecordings: Recording[] = draftedFromDocuments
    ? []
    : (sources ?? []).map(s => recordingForSource(customer.id, s)).filter((r): r is Recording => !!r);
  const total = pendingOutcomes + pendingTasks;
  const hasDraftOrigin = !!sources && sources.length > 0;

  if (planPublished) {
    // The "just published" confirmation is a one-time toast — dismissible,
    // then gone for good (see planPublishedNoticeDismissed). The reuse
    // banner underneath is a separate, standing affordance: unlike that
    // toast, it doesn't go away, since "this plan can still be refreshed
    // from a recording" stays true long after the moment of publishing has
    // passed. Replace still only clears a citation (see
    // handleChangeRecordings) — it deliberately doesn't revert planPublished
    // to a draft: unlike a single Documents-tab form, this is the
    // customer's one live care plan, and silently knocking it back to
    // "Draft" (with everything that status otherwise implies elsewhere in
    // Care Management) is a bigger call than "consistent reuse banner"
    // was asked for.
    return (
      <div className="flex flex-col gap-3">
        {!planPublishedNoticeDismissed && (
          <div className="flex items-start gap-3 rounded-lg border border-[rgb(178,224,178)] bg-[rgb(232,247,232)] px-4 py-3">
            <div className="w-7 h-7 rounded-lg bg-[rgb(212,240,212)] flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-[rgb(33,166,33)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-[rgb(12,77,12)]">Care plan published</p>
              <p className="text-sm text-[rgb(16,100,16)] mt-0.5">
                This is now a real care plan, not an Assessment Hero draft — it's included in reports and reviews the same as
                any other.
              </p>
            </div>
            <button
              type="button"
              onClick={dismissPlanPublishedNotice}
              aria-label="Dismiss"
              className="text-[rgb(16,100,16)] hover:text-[rgb(12,77,12)] transition-colors cursor-pointer flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {!draftedFromDocuments && (
          <AssessmentHeroReuseBanner
            customerId={customer.id}
            linkedRecordings={linkedRecordings}
            linkedRecordingIds={linkedRecordings.map(r => r.id)}
            onConfirm={handleChangeRecordings}
            navigate={navigate}
          />
        )}
      </div>
    );
  }

  // Not published — nothing to show unless this plan actually came from
  // CareBridge (a hand-built plan with no draft history has no "make this
  // real" step to offer here).
  if (!hasDraftOrigin) return null;

  const onThisTab = activeTab === 'outcomes' ? pendingOutcomes : activeTab === 'tasks' ? pendingTasks : 0;
  const thisTabLabel = activeTab === 'outcomes' ? 'outcome' : 'task';

  return (
    // Same two-toned "CareBridge Draft" treatment as the Documents tab's own
    // banner (CarePlanDocumentPage/WhatIsImportantToMeDocumentPage) — white
    // top half for the icon/title/description, purple-50 bottom half for
    // secondary detail — rather than a single purple-tinted block, so this
    // reads as the same pattern wherever a CareBridge draft shows up, not a
    // one-off style specific to Care Management.
    <div className="rounded-lg border border-purple-200 shadow overflow-hidden">
      <div className="flex items-start gap-3 bg-white px-4 py-3">
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 pt-1">
          <img src={assessmentHeroIconUrl} className="w-8 h-8" alt="Assessment Hero" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold text-purple-900 flex items-center gap-2 flex-wrap">
            Assessment Hero draft care plan
            {total > 0 && (
              <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                {total} to review
              </span>
            )}
          </p>
          <p className="text-sm text-purple-800 mt-0.5">
            Drafted from <DraftSourcesNote sources={sources!} kind={draftedFromDocuments ? 'document' : 'recording'} /> —{' '}
            {total > 0
              ? 'nothing here is part of the live care plan until you accept it.'
              : "everything's been reviewed — publish to make this the customer's real care plan."}
          </p>
        </div>
      </div>

      {/* Bottom bar mirrors the Documents banner's own — secondary counts and
          a link through to where the recording(s) actually live on the left,
          Publish on the right (disabled, same as the Documents tab's own
          Publish, until nothing's left to review). */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-purple-50 border-t border-purple-200 px-4 py-3">
        <div className="flex items-center gap-4">
          <p className="text-sm text-purple-800">
            {pendingOutcomes} outcome{pendingOutcomes === 1 ? '' : 's'} · {pendingTasks} task{pendingTasks === 1 ? '' : 's'}
            {activeTab === 'visits'
              ? ' — visits come from the service agreement in Rostering, so none are drafted here.'
              : onThisTab === 0
                ? ' — none left on this tab.'
                : ` — ${onThisTab} ${thisTabLabel}${onThisTab === 1 ? '' : 's'} on this tab.`}
          </p>
          {draftedFromDocuments ? (
            // No individual document page to link a specific one to (unlike
            // a recording) — same single link to the tab as before.
            <button
              type="button"
              onClick={() => navigate(`/customers/${customer.id}/documents?tab=assessments`)}
              className="flex items-center gap-1 text-sm font-medium text-[rgb(154,38,214)] hover:underline cursor-pointer flex-shrink-0"
            >
              {`View document${sources!.length > 1 ? 's' : ''}`}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <RecordingsLink customerId={customer.id} recordings={linkedRecordings} navigate={navigate} />
              <ChangeRecordingsButton
                customerId={customer.id}
                linkedRecordingIds={linkedRecordings.map(r => r.id)}
                onConfirm={handleChangeRecordings}
              />
            </>
          )}
        </div>
        <Button
          icon={<Send className="w-4 h-4" />}
          disabled={total > 0}
          title={total > 0 ? 'Accept the outstanding drafted fields before publishing' : undefined}
          onClick={publishPlan}
        >
          Publish
        </Button>
      </div>
    </div>
  );
}


/**
 * The three states of drafting a care plan from a customer's CareBridge
 * recordings, shown above whichever list the reviewer is on:
 *
 *   offer     — nothing drafted yet, so a plain "Draft care plan" CTA
 *   running   — a stepper, with the outcomes and then the tasks appearing
 *               beneath it as their step finishes
 *   drafted   — a success message, dismissible, sitting above the usual
 *               CarePlanDraftBanner (which carries the live "X to review"
 *               counts, so the two say different things)
 *
 * The state lives in CareManagementContext, so it holds while the reviewer
 * moves between Outcomes and Tasks and is gone on a reload.
 *
 * The stepper is deliberately the same shape as the one in
 * WhatIsImportantToMeDocumentPage — same "CareBridge is working on this"
 * moment, so it should read the same — but it drives content appearing on the
 * page as it goes rather than just filling a wait, which is why it isn't
 * simply shared with it.
 */
export function CarePlanDraftFlow() {
  const customer = useCustomer();
  const { availableDraft } = useCareData();
  const {
    draftStep, draftComplete, startCarePlanDraft, draftSourceDocuments, setDraftSourceDocuments,
    draftNoticeDismissed, dismissDraftNotice,
  } = useCareManagement();
  const firstName = customer.fullName.split(' ').slice(1, -1).join(' ') || customer.fullName;
  const sourceKind = draftSourceDocuments ? 'document' : 'recording';
  // Confirming a selection in the picker sets the sources this run will be
  // attributed to, then starts the same stepper as before.
  const [pickerOpen, setPickerOpen] = useState(false);
  const confirmSources = (titles: string[]) => {
    setDraftSourceDocuments(titles);
    startCarePlanDraft();
  };

  if (!availableDraft) return null;

  if (draftStep !== null) {
    return (
      <>
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 mb-2">
          <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            You can leave this page while the draft runs — the process will continue in the background.
          </p>
        </div>
        <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4">
            <Sparkles className="w-4 h-4 text-[rgb(154,38,214)] flex-shrink-0" />
            <p className="text-sm font-semibold text-purple-900">
              Drafting the care plan from <DraftSourcesNote sources={availableDraft.sources} kind={sourceKind} />…
            </p>
          </div>
          <div className="flex items-start px-1">
          {CARE_PLAN_DRAFT_STEPS.map((step, i) => {
            const state = i < draftStep ? 'done' : i === draftStep ? 'active' : 'pending';
            return (
              <Fragment key={step.label}>
                <div className="flex flex-col items-center gap-1.5 flex-shrink-0 w-28">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${
                      state === 'done' ? 'bg-[rgb(33,166,33)] text-white' : state === 'active' ? 'bg-[rgb(154,38,214)] text-white' : 'bg-purple-100 text-purple-400'
                    }`}
                  >
                    {/* Keyed by state so the tick plays a pop-in rather than silently swapping icons. */}
                    <span key={state} className="flex items-center justify-center animate-in zoom-in-50 duration-300">
                      {state === 'done' ? <Check className="w-3 h-3" /> : state === 'active' ? <Loader2 className="w-3 h-3 animate-spin" /> : i + 1}
                    </span>
                  </span>
                  <span className={`text-sm text-center ${state === 'pending' ? 'text-purple-400' : 'text-purple-900 font-medium'}`}>
                    {step.label}
                  </span>
                </div>
                {i < CARE_PLAN_DRAFT_STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 bg-purple-100 rounded-full overflow-hidden mt-2.5 mx-1">
                    <div
                      className="h-full bg-[rgb(154,38,214)] transition-all ease-out duration-300"
                      style={{ width: i < draftStep ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </div>
    </>
    );
  }

  if (draftComplete) {
    if (draftNoticeDismissed) return null;
    return (
      <div className="flex items-start gap-3 rounded-lg border border-[rgb(178,224,178)] bg-[rgb(232,247,232)] px-4 py-3">
        <div className="w-7 h-7 rounded-lg bg-[rgb(212,240,212)] flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-4 h-4 text-[rgb(33,166,33)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-[rgb(12,77,12)]">Care plan drafted</p>
          <p className="text-sm text-[rgb(16,100,16)] mt-0.5">
            {availableDraft.outcomes} outcomes and {availableDraft.tasks} tasks drafted from{' '}
            <DraftSourcesNote sources={availableDraft.sources} kind={sourceKind} />, each linked to the visits they belong to. Review
            and accept them one by one — nothing is part of the live plan until you do.
          </p>
        </div>
        <button
          type="button"
          onClick={dismissDraftNotice}
          aria-label="Dismiss"
          className="text-[rgb(16,100,16)] hover:text-[rgb(12,77,12)] transition-colors cursor-pointer flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-purple-200 shadow-sm overflow-hidden">
        <div className="flex items-start gap-3 bg-white px-4 py-3">
          <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-[rgb(154,38,214)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-purple-900">Draft this care plan with Assessment Hero</p>
            <p className="text-sm text-purple-800 mt-0.5">
              Select completed assessments and documents to draft outcomes and tasks for this care plan. You can review and edit the drafts before accepting them.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-purple-50 border-t border-purple-200 px-4 py-3">
          <Button icon={<Sparkles className="w-4 h-4" />} onClick={() => setPickerOpen(true)}>Draft care plan</Button>
        </div>
      </div>
      <CarePlanDraftSourcePicker open={pickerOpen} onOpenChange={setPickerOpen} onConfirm={confirmSources} />
    </>
  );
}

/**
 * Lets the reviewer choose which of the customer's completed documents
 * CareBridge should draft this run from — Assessments (the standard onboarding
 * pack) is the default source, but Documents (ad hoc reviews/audits) can also
 * contribute if one of those is what's actually relevant. Only documents
 * marked complete are offered; a document still outstanding has nothing
 * settled yet to draft from.
 */
function CarePlanDraftSourcePicker({
  open, onOpenChange, onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (titles: string[]) => void;
}) {
  const customer = useCustomer();
  const { assessments, documents } = getCompletedDocuments(customer.id);
  const [tab, setTab] = useState<'assessments' | 'documents'>('assessments');
  // Previously this was seeded with every completed assessment pre-checked.
  // Change: start with nothing selected so the reviewer explicitly chooses
  // which completed assessments/documents to draft from.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) =>
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const activeList = tab === 'assessments' ? assessments : documents;
  const selectedTitles = [...assessments, ...documents].filter(d => selectedIds.has(d.id)).map(d => d.title);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Draft care plan from completed documents</DialogTitle>
          <DialogDescription>
            Choose which completed documents Assessment Hero should draft the outcomes and tasks from.
          </DialogDescription>
        </DialogHeader>

        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {(['assessments', 'documents'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium capitalize transition-colors cursor-pointer ${
                tab === t ? 'bg-[rgb(154,38,214)] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t} ({t === 'assessments' ? assessments.length : documents.length})
            </button>
          ))}
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {activeList.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No completed {tab} yet — nothing here is finished enough to draft from.
            </p>
          ) : (
            activeList.map(doc => (
              <label
                key={doc.id}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
              >
                <Checkbox checked={selectedIds.has(doc.id)} onCheckedChange={() => toggle(doc.id)} />
                <span className="text-sm text-gray-900">{doc.title}</span>
              </label>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="tertiary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            icon={<Sparkles className="w-4 h-4" />}
            disabled={selectedTitles.length === 0}
            onClick={() => { onConfirm(selectedTitles); onOpenChange(false); }}
          >
            Draft care plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// items-start (not items-center) on all three of these — a title long
// enough to wrap to two lines used to leave the icon floating dead centre
// between them rather than sitting with the first line, which read as
// misaligned rather than deliberate. `mt-0.5` nudges the now-bigger icon
// down slightly so it lines up with the text's cap-height instead of the
// flex container's own top edge.
export function TaskBadge({ title, category }: { title: string; category: TaskCategory }) {
  const c = CATEGORY_CONFIG[category];
  const { Icon } = c;
  return (
    <span className={`inline-flex items-start gap-1.5 px-3 py-1 rounded-md text-sm font-medium border ${c.bg} ${c.text} ${c.border}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      {title}
    </span>
  );
}

export function VisitBadge({ title }: { title: string }) {
  return (
    <span className="inline-flex items-start gap-1.5 px-3 py-1 rounded-md text-sm font-medium border bg-sky-50 text-sky-800 border-sky-200">
      <CalendarSolidIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-sky-600" />
      {title}
    </span>
  );
}

export function OutcomeBadge({ title }: { title: string }) {
  return (
    <span className="inline-flex items-start gap-1.5 px-3 py-1 rounded-md text-sm font-medium border text-amber-800" style={{ backgroundColor: '#feefdc', borderColor: '#fcd9a8' }}>
      <StarSolidIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
      {title}
    </span>
  );
}

/**
 * `reviewed === false` means CareBridge drafted this and nobody has accepted
 * it yet — showing "Active" in that state is misleading, since it isn't part
 * of the live plan. Draft takes over the badge entirely rather than sitting
 * alongside it; it becomes a normal Active/Inactive badge the moment it's
 * accepted (reviewed flips to true, see useCareData).
 */
export function ActiveBadge({ status, reviewed }: { status: 'active' | 'inactive'; reviewed?: boolean }) {
  const { planPublished } = useCareManagement();
  if (reviewed === false) {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded uppercase border border-amber-300 bg-amber-100 text-amber-800">
        Draft
      </span>
    );
  }
  // If the overall care plan is still a CareBridge draft (not published),
  // show an "Accepted" badge for items that have been accepted rather
  // than the normal "Active" text — makes acceptance clearer while the
  // plan as a whole is still pending review.
  if (!planPublished && status === 'active') {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded uppercase border"
        style={{ backgroundColor: '#D4EBC3', color: '#1B5E20', borderColor: '#2E7D32' }}
      >
        <TickSolidIcon className="w-3.5 h-3.5 text-[rgb(27,94,32)]" />
        Accepted
      </span>
    );
  }
  return status === 'active' ? (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded uppercase border"
      style={{ backgroundColor: '#D4EBC3', color: '#2D5F1E', borderColor: '#AFDB98' }}
    >
      Active
    </span>
  ) : (
    <span className="text-xs font-semibold px-2 py-0.5 rounded uppercase border border-gray-300 bg-gray-100 text-gray-500">
      Inactive
    </span>
  );
}

/** Same Draft-overrides-everything rule as ActiveBadge, for the detail-view status control. */
export function StatusToggle({ value, reviewed }: { value: 'active' | 'inactive'; reviewed?: boolean }) {
  if (reviewed === false) {
    return (
      <div className="flex rounded-lg border border-gray-200 overflow-hidden w-full">
        <button className="flex-1 py-2.5 text-sm font-semibold uppercase bg-amber-100 text-amber-800 cursor-default">
          Draft
        </button>
        <button className="flex-1 py-2.5 text-sm font-semibold uppercase bg-white text-gray-300 cursor-default">
          Active
        </button>
        <button className="flex-1 py-2.5 text-sm font-semibold uppercase bg-white text-gray-300 cursor-default">
          Inactive
        </button>
      </div>
    );
  }
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden w-full">
      <button
        className={`flex-1 py-2.5 text-sm font-semibold uppercase transition-colors ${value === 'active' ? '' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
        style={value === 'active' ? { backgroundColor: '#D4EBC3', color: '#2D5F1E' } : undefined}
      >
        Active
      </button>
      <button
        className={`flex-1 py-2.5 text-sm font-semibold uppercase transition-colors ${value === 'inactive' ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
      >
        Inactive
      </button>
    </div>
  );
}
