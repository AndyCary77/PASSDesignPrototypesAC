import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useCustomer } from '../../../data/CustomerContext';

type Tab = 'outcomes' | 'tasks' | 'visits' | 'caregroups';

/**
 * The simulated "draft the care plan from the recordings" run. Outcomes are
 * revealed as soon as their own step finishes rather than everything landing
 * at the end — the plan visibly builds itself in the order it's described, so
 * the wait reads as work happening on the page you're already looking at.
 */
export const CARE_PLAN_DRAFT_STEPS = [
  { label: 'Reading the documents', ms: 1300 },
  { label: 'Drafting outcomes', ms: 2000 },
  { label: 'Drafting tasks', ms: 2000 },
];
// Brief hold with every step ticked, so the finished stepper is actually seen
// before it gives way to the success message.
const DRAFT_COMPLETE_PAUSE_MS = 700;

interface CareManagementContextType {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  backFn: { fn: () => void } | null;
  registerBack: (fn: () => void) => void;
  clearBack: () => void;
  /**
   * The active tab's "Add X" action, surfaced in the subnav's actions row
   * (alongside Print/Save) rather than inside the tab body — same
   * back-channel as backFn/registerBack, just for the opposite direction:
   * the tab owns the behaviour, the subnav owns where the button lives.
   * Only list views register one; detail views and tabs with nothing to add
   * (Visits, Care Groups) leave it null.
   */
  addFn: { label: string; fn: () => void } | null;
  registerAdd: (label: string, fn: () => void) => void;
  clearAdd: () => void;
  /**
   * The active detail view's "Delete X" action — same back-channel as
   * addFn/registerAdd, just for the opposite view. While a detail view is
   * open, it replaces the subnav's Print/Save entirely rather than sitting
   * alongside them, so a destructive action never reads as just another
   * routine one. Only detail views (Outcome/Task) register one; the list
   * views, Visits, and Care Groups leave it null.
   */
  deleteFn: { label: string; fn: () => void } | null;
  registerDelete: (label: string, fn: () => void) => void;
  clearDelete: () => void;
  /**
   * Ids of CareBridge-drafted outcomes/tasks a reviewer has accepted this
   * session. The underlying data ships with reviewed: false; useCareData
   * overlays this set on top so accepting is interactive without mutating the
   * mock data. Deliberately no bulk "accept all" — same reasoning as the
   * document draft flow, where accepting unread AI content is the risk the
   * review step exists to catch.
   */
  acceptedIds: Set<string>;
  accept: (id: string) => void;
  /** Ids of drafted outcomes/tasks a reviewer has discarded this session. useCareData drops these from the lists entirely, same immutable-mock-data approach as acceptedIds. */
  discardedIds: Set<string>;
  discard: (id: string) => void;
  /**
   * Ids of outcomes/tasks whose `draftSource` has been cleared via
   * CarePlanDraftBanner's "Change recording(s)" → Replace — same idea as
   * Medical History's Diagnosis losing its `recordingId`/`sourceLines` when
   * its source recording is deselected: the record itself stays (it's a
   * real outcome/task, not a form field), it just goes back to being an
   * uncited, plain pending item. Read/written by useCareData, which is the
   * one place that actually knows how a `draftSource` string maps back to a
   * recording.
   */
  clearedSourceIds: Set<string>;
  setClearedSourceIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  /**
   * Recordings merged into the plan's linked set via "Change recording(s)"
   * → Merge that don't (yet) back any individual outcome/task — same role
   * as Medical History's `extraLinkedRecordingIds`.
   */
  extraLinkedRecordingIds: string[];
  setExtraLinkedRecordingIds: React.Dispatch<React.SetStateAction<string[]>>;
  /**
   * Whether anything in the plan has changed since the last Save — field
   * edits in a detail view (bubbled up via a single onChange on the form's
   * container, same trick either way), accepting/discarding a draft, or
   * deleting a record. Drives the subnav Save button's disabled state; reset
   * to false only when Save is actually clicked, not on navigating between
   * items, since unsaved edits on a different record are still unsaved.
   */
  dirty: boolean;
  setDirty: (dirty: boolean) => void;
  /**
   * Progress through CARE_PLAN_DRAFT_STEPS: null while idle, otherwise the
   * index of the step currently running (STEPS.length = all done, held
   * briefly before the success message takes over). Deliberately React state
   * and nothing more — it survives switching between Outcomes and Tasks
   * (the provider stays mounted; only activeTab changes) and is gone on
   * reload, which is what a demo of a one-off generation wants.
   */
  draftStep: number | null;
  /** True once the run has finished — drives the success message. */
  draftComplete: boolean;
  startCarePlanDraft: () => void;
  /**
   * The completed documents (Assessments and/or Documents tab) this plan is
   * drafted from — either picked by the reviewer in CarePlanDraftSourcePicker
   * right before `startCarePlanDraft` (Edith/Vera), or pre-seeded for an
   * already-established customer with a settled plan (Arthur — see the
   * provider). `useCareData` prefers this over each record's own static
   * `draftSource` for the aggregate "Drafted from X" shown in the banners,
   * so what the banner says matches what was actually picked/seeded. Null
   * for a customer with no document-drafted origin at all.
   */
  draftSourceDocuments: string[] | null;
  setDraftSourceDocuments: (titles: string[]) => void;
  /** Whether the drafted outcomes/tasks have been revealed yet, mid-run. */
  draftedOutcomesVisible: boolean;
  draftedTasksVisible: boolean;
  /** The success message is dismissible; staying dismissed is also per-session. */
  draftNoticeDismissed: boolean;
  dismissDraftNotice: () => void;
  /**
   * Whether this customer's care plan has been formally published — i.e. it's
   * a real, live plan rather than a CareBridge draft still awaiting sign-off.
   * Seeded from `customer.hasCarePlan` (true for a customer who already had a
   * plan, e.g. Arthur; false for one whose plan only exists as a draft so
   * far, e.g. Edith/Vera) and flipped by `publishPlan`. Drives the subnav's
   * "Save Draft" vs "Update" label and whether the CareBridge draft banner's
   * Publish button is offered at all.
   */
  planPublished: boolean;
  /** Gated by the caller on nothing still pending — same rule as the Documents tab's own Publish button. */
  publishPlan: () => void;
  /** The "plan published" confirmation is dismissible, same pattern as the draft-complete notice. */
  planPublishedNoticeDismissed: boolean;
  dismissPlanPublishedNotice: () => void;
}

const CareManagementContext = createContext<CareManagementContextType>({
  activeTab: 'outcomes',
  setActiveTab: () => {},
  backFn: null,
  registerBack: () => {},
  clearBack: () => {},
  addFn: null,
  registerAdd: () => {},
  clearAdd: () => {},
  deleteFn: null,
  registerDelete: () => {},
  clearDelete: () => {},
  acceptedIds: new Set(),
  accept: () => {},
  discardedIds: new Set(),
  discard: () => {},
  clearedSourceIds: new Set(),
  setClearedSourceIds: () => {},
  extraLinkedRecordingIds: [],
  setExtraLinkedRecordingIds: () => {},
  dirty: false,
  setDirty: () => {},
  draftStep: null,
  draftComplete: false,
  startCarePlanDraft: () => {},
  draftSourceDocuments: null,
  setDraftSourceDocuments: () => {},
  draftedOutcomesVisible: false,
  draftedTasksVisible: false,
  draftNoticeDismissed: false,
  dismissDraftNotice: () => {},
  planPublished: false,
  publishPlan: () => {},
  planPublishedNoticeDismissed: true,
  dismissPlanPublishedNotice: () => {},
});

export function CareManagementProvider({ children }: { children: React.ReactNode }) {
  const customer = useCustomer();
  const [activeTab, setActiveTab] = useState<Tab>('outcomes');
  const [backFn, setBackFn] = useState<{ fn: () => void } | null>(null);
  const [addFn, setAddFn] = useState<{ label: string; fn: () => void } | null>(null);
  const [deleteFn, setDeleteFn] = useState<{ label: string; fn: () => void } | null>(null);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [discardedIds, setDiscardedIds] = useState<Set<string>>(new Set());
  const [clearedSourceIds, setClearedSourceIds] = useState<Set<string>>(new Set());
  const [extraLinkedRecordingIds, setExtraLinkedRecordingIds] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [draftStep, setDraftStep] = useState<number | null>(null);
  const [draftComplete, setDraftComplete] = useState(false);
  const [draftNoticeDismissed, setDraftNoticeDismissed] = useState(false);
  // Seeded for Arthur specifically (2026-09-11 change of direction): Care
  // Management's "drafted with Assessment Hero" story now points at his
  // completed assessment documents rather than a recording — these are
  // refined and complete, and are what actually drives the care-planning
  // decisions, unlike a raw recording transcript. Two, not one — realistically
  // a care plan this developed draws on more than a single document (here,
  // his actual Care and Support Plan alongside the Personal Care / Moving
  // and Handling assessment — both real rows in his Assessments list, see
  // mock-documents.ts). Everyone else still starts null here (Edith/Vera
  // only get this set once a reviewer actually runs "Draft care plan" and
  // picks sources in CarePlanDraftSourcePicker); Arthur's is just pre-set,
  // matching that he's an established customer with a settled,
  // already-drafted plan rather than someone still mid-onboarding.
  const [draftSourceDocuments, setDraftSourceDocuments] = useState<string[] | null>(
    customer.id === 'arthur-barrington'
      ? ['Customer Care and Support Plan', 'Personal Care / Moving and Handling']
      : null,
  );
  // Seeded from the customer's existing status — Arthur already has a live
  // plan, Edith/Vera's only exists as a CareBridge draft until Publish is
  // clicked. Read once on mount, same as every other piece of session state
  // here (see the customer-navigation caveat on acceptedIds/discardedIds).
  const [planPublished, setPlanPublished] = useState(customer.hasCarePlan);
  const [planPublishedNoticeDismissed, setPlanPublishedNoticeDismissed] = useState(true);

  const startCarePlanDraft = useCallback(() => {
    setDraftComplete(false);
    setDraftNoticeDismissed(false);
    setDraftStep(0);
  }, []);
  const dismissDraftNotice = useCallback(() => setDraftNoticeDismissed(true), []);

  useEffect(() => {
    if (draftStep === null) return;
    const isFinalHold = draftStep === CARE_PLAN_DRAFT_STEPS.length;
    const delay = isFinalHold ? DRAFT_COMPLETE_PAUSE_MS : CARE_PLAN_DRAFT_STEPS[draftStep].ms;
    const timer = window.setTimeout(() => {
      if (isFinalHold) {
        setDraftStep(null);
        setDraftComplete(true);
        // Deliberately doesn't dirty the plan — the drafted records just
        // arrived as pending review, same starting state as Edith's plan
        // (which ships with 16 pending records and Save still disabled).
        // Nothing here is a decision yet, so there's nothing to Save until
        // the reviewer actually accepts, discards, or edits something.
      } else {
        setDraftStep(step => (step ?? 0) + 1);
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [draftStep]);

  // Step 1 ("Drafting outcomes") having finished means the run has moved on to
  // index 2, so that's the point the outcomes appear; likewise the tasks once
  // the last step is done.
  const draftedOutcomesVisible = draftComplete || (draftStep !== null && draftStep >= 2);
  const draftedTasksVisible = draftComplete || (draftStep !== null && draftStep >= 3);

  const registerBack = useCallback((fn: () => void) => setBackFn({ fn }), []);
  const clearBack = useCallback(() => setBackFn(null), []);
  const registerAdd = useCallback((label: string, fn: () => void) => setAddFn({ label, fn }), []);
  const clearAdd = useCallback(() => setAddFn(null), []);
  const registerDelete = useCallback((label: string, fn: () => void) => setDeleteFn({ label, fn }), []);
  const clearDelete = useCallback(() => setDeleteFn(null), []);
  const accept = useCallback((id: string) => {
    setAcceptedIds(prev => new Set(prev).add(id));
    setDirty(true);
  }, []);
  const discard = useCallback((id: string) => {
    setDiscardedIds(prev => new Set(prev).add(id));
    setDirty(true);
  }, []);
  // Callers gate this on nothing still pending, same as Documents' own
  // Publish — not enforced here too since the banner already hides the
  // button in that state (see CarePlanDraftBanner).
  const publishPlan = useCallback(() => {
    setPlanPublished(true);
    setPlanPublishedNoticeDismissed(false);
  }, []);
  const dismissPlanPublishedNotice = useCallback(() => setPlanPublishedNoticeDismissed(true), []);

  const value = useMemo(
    () => ({
      activeTab, setActiveTab, backFn, registerBack, clearBack, addFn, registerAdd, clearAdd,
      deleteFn, registerDelete, clearDelete, acceptedIds, accept, discardedIds, discard, dirty, setDirty,
      clearedSourceIds, setClearedSourceIds, extraLinkedRecordingIds, setExtraLinkedRecordingIds,
      draftStep, draftComplete, startCarePlanDraft, draftSourceDocuments, setDraftSourceDocuments,
      draftedOutcomesVisible, draftedTasksVisible,
      draftNoticeDismissed, dismissDraftNotice,
      planPublished, publishPlan, planPublishedNoticeDismissed, dismissPlanPublishedNotice,
    }),
    [
      activeTab, backFn, registerBack, clearBack, addFn, registerAdd, clearAdd,
      deleteFn, registerDelete, clearDelete, acceptedIds, accept, discardedIds, discard, dirty,
      clearedSourceIds, extraLinkedRecordingIds,
      draftStep, draftComplete, startCarePlanDraft, draftSourceDocuments, draftedOutcomesVisible, draftedTasksVisible,
      draftNoticeDismissed, dismissDraftNotice,
      planPublished, publishPlan, planPublishedNoticeDismissed, dismissPlanPublishedNotice,
    ],
  );

  return <CareManagementContext.Provider value={value}>{children}</CareManagementContext.Provider>;
}

export function useCareManagement() {
  return useContext(CareManagementContext);
}
