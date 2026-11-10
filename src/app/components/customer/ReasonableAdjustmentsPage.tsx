import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { AlertCircle, Flag, Plus, RefreshCw, Trash2, CheckCircle2, X, Accessibility, HeartPulse, Stethoscope, Download } from 'lucide-react';
import { useCustomer } from '../../data/CustomerContext';
import { canSeeRafDetail, useRafAccess, type NationalFlagState, type RafAccessLevel } from '../../data/RafAccessContext';
import {
  CURRENT_USER,
  MAX_FREE_TEXT,
  RAF_WRITE_ENABLED,
  activeItems,
  formatRafDate,
  formatRafDateTime,
  getNationalFlag,
  nextNationalChange,
  todayIso,
  type RafItem,
  type RafRecord,
  type RafSection,
} from '../../data/reasonableAdjustments';
import { Button } from '../buttons/Button';
import { RafItemDetails } from './RafItemDetails';
import { PaginationBar } from '../buttons/PaginationBar';
import { InfoBanner } from '../banners/InfoBanner';
import { Alert } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import {
  AddItemDialog,
  CreateFlagDialog,
  RemoveDialog,
  type NewRafItem,
  type RemoveScope,
  type RemoveTarget,
} from './ReasonableAdjustmentsDialogs';

// Fixed by the spec: these three terms, in this order, no acronyms.
const SECTIONS: { section: RafSection; title: string; icon: ReactNode; emptyText: string }[] = [
  {
    section: 'adjustment',
    title: 'Reasonable Adjustments',
    icon: <Accessibility className="w-5 h-5 text-purple-900" />,
    emptyText: 'No reasonable adjustments have been recorded.',
  },
  {
    section: 'impairment',
    title: 'Impairments',
    icon: <HeartPulse className="w-5 h-5 text-purple-900" />,
    emptyText: 'No impairments have been recorded.',
  },
  {
    section: 'condition',
    title: 'Underlying Conditions',
    icon: <Stethoscope className="w-5 h-5 text-purple-900" />,
    emptyText: 'No underlying conditions have been recorded.',
  },
];

const PAGE_SIZE = 5;

// Simulated round trip to the national flag. Create/add/remove/delete stay
// unavailable until it has answered (RAC002, RAU006, RAU015, RAD001).
const QUERY_DELAY_MS = 700;

// 'success': something the user did. 'info': something PASS did on its own, from the national flag.
type Outcome = { kind: 'success' | 'info'; text: string };

export function ReasonableAdjustmentsPage() {
  const customer = useCustomer();
  const navigate = useNavigate();
  const { level, nationalFlag, setNationalFlag, nationalChangeCount, nhsRequest, getFlagRecord, setFlagRecord, saveOutcome, setSaveOutcome } = useRafAccess();
  // Starts from what PASS already holds for this customer, so changes made here (and a flag imported or deleted) are still
  // there when the tab is reopened.
  const [record, setRecord] = useState<RafRecord | null>(() => getFlagRecord(customer.id));
  const [retrievedAt, setRetrievedAt] = useState<Date | null>(null);
  const [querying, setQuerying] = useState(true);
  // The live request to the NHS got no answer. Nothing is shown from before: it can't be confirmed as current.
  const [queryFailed, setQueryFailed] = useState(false);
  const [pages, setPages] = useState<Record<RafSection, number>>({ adjustment: 1, impairment: 1, condition: 1 });
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [addSection, setAddSection] = useState<Exclude<RafSection, 'condition'> | null>(null);
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget | null>(null);
  const timer = useRef<number | undefined>(undefined);

  // The simulated check finishes on a timer, so it reads these through refs to see current values.
  const recordRef = useRef(record);
  recordRef.current = record;
  const nationalFlagRef = useRef<NationalFlagState>(nationalFlag);
  nationalFlagRef.current = nationalFlag;
  const nhsRequestRef = useRef(nhsRequest);
  nhsRequestRef.current = nhsRequest;
  // What the NHS still holds after a flag is deleted from PASS only: exactly what PASS had, so
  // importing it again brings back the same flag, not the demo's starting one.
  const keptNational = useRef<RafRecord | null>(null);

  const person = { name: customer.fullName, dob: customer.dob, nhs: customer.nhs };
  // Parked for phase 1 (read-only): see RAF_WRITE_ENABLED.
  const canWrite = RAF_WRITE_ENABLED && level === '3';
  const canSeeAll = level === '2' || level === '3';

  const touch = (r: RafRecord, items: RafItem[]): RafRecord => ({ ...r, items, lastUpdatedOn: todayIso() });

  // PASS has no flag but the NHS does: bring it in, and say where it came from. Automatic by
  // default (R23), so no one has to accept it. Items keep who added them, and where.
  const importNational = () => {
    setRecord(keptNational.current ?? getNationalFlag());
    keptNational.current = null;
    setOutcome({
      kind: 'info',
      text: `PASS found a Reasonable Adjustment Flag for ${customer.fullName} on the national flag and has imported it. Each item shows who added it.`,
    });
  };

  // National flag content isn't kept between sessions, so every visit to the tab queries it
  // again, and says when it last did (RAR004). It's also the moment a national flag is pulled in.
  const query = (onDone?: () => void) => {
    setQuerying(true);
    setQueryFailed(false);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      // Every visit asks the NHS live, even when PASS already holds a flag. If it doesn't answer, nothing below
      // happens: no "last retrieved" time, no import, no changes brought in.
      if (nhsRequestRef.current === 'error') {
        setQueryFailed(true);
        setQuerying(false);
        return;
      }
      // Without a verified NHS number PASS can't ask the NHS anything (R20), so there is nothing to retrieve.
      if (nationalFlagRef.current !== 'no-nhs-number') {
        setRetrievedAt(new Date());
        if (!recordRef.current && nationalFlagRef.current === 'found') importNational();
      }
      // A flag PASS only holds because it imported it mirrors the national flag. If the NHS no longer holds one (or
      // PASS can't ask for one at all), it goes too. A flag recorded in PASS itself (the demo's Arthur and Edith) stays.
      if (nationalFlagRef.current !== 'found' && recordRef.current?.source === 'national') {
        setRecord(null);
        keptNational.current = null;
      }
      onDone?.();
      setQuerying(false);
    }, QUERY_DELAY_MS);
  };

  useEffect(() => {
    query();
    return () => window.clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The review controls take effect straight away: changing what the NHS holds, or whether it answers, re-asks it, as
  // if the tab had just been opened. Without this they only bit on the next Refresh or visit, and after the first
  // import (write is parked, so a flag can't be deleted to start again) they bit not at all.
  const lastControls = useRef({ nationalFlag, nhsRequest });
  useEffect(() => {
    const last = lastControls.current;
    if (last.nationalFlag === nationalFlag && last.nhsRequest === nhsRequest) return;
    lastControls.current = { nationalFlag, nhsRequest };
    setOutcome(null);
    query();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nationalFlag, nhsRequest]);

  // Tell the rest of the app what PASS now holds (the badge, the lists, the visit panel). Not while checking: an
  // import finishes in the same step as the check, so waiting avoids the badge flickering off first.
  useEffect(() => {
    if (!querying) setFlagRecord(customer.id, record);
  }, [record, querying, customer.id, setFlagRecord]);

  // Another organisation changed the national flag (the NHS notification service would tell PASS).
  // PASS fetches the full record and ingests it automatically, without asking.
  const lastChangeCount = useRef(nationalChangeCount);
  useEffect(() => {
    if (nationalChangeCount === lastChangeCount.current) return;
    lastChangeCount.current = nationalChangeCount;
    if (nationalFlagRef.current === 'no-nhs-number') return;
    setOutcome(null);

    if (!recordRef.current) {
      // They've created a flag for this customer; the check below finds it and imports it.
      setNationalFlag('found');
      nationalFlagRef.current = 'found';
      query();
      return;
    }
    const change = nextNationalChange(recordRef.current);
    query(() => {
      if (!change) {
        setOutcome({ kind: 'info', text: 'The national flag has no further changes to bring into PASS.' });
        return;
      }
      setRecord(prev => (prev ? touch(prev, [...prev.items, change]) : prev));
      setOutcome({
        kind: 'info',
        text: `Another organisation changed the national flag, and PASS has updated automatically. \u201C${change.term}\u201D was added by ${change.addedBy} at ${change.organisation}.`,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nationalChangeCount]);

  const refresh = () => {
    setOutcome(null);
    query();
  };

  // Stands in for the national flag service rejecting a change. Saved nowhere when it does, so the message says
  // what was not done, and the dialog stays open with what was entered. One-shot: the retry then goes through.
  // 'conflict' only bites an adjustment being added; every other save goes through unless set to 'error'.
  const rejection = (action: 'create' | 'add-adjustment' | 'add' | 'remove' | 'delete'): string | null => {
    if (saveOutcome === 'ok') return null;
    if (saveOutcome === 'conflict' && action !== 'add-adjustment') return null;
    setSaveOutcome('ok');
    switch (action) {
      case 'create':
        return 'The flag was not created. PASS could not save it to the national flag, so nothing has been saved. Check the connection and try again.';
      case 'add-adjustment':
        if (saveOutcome === 'conflict') {
          return 'The flag was not updated. The national flag rejected this adjustment because it conflicts with an entry already there. Close this window and select Refresh to bring in the latest national flag, resolve the conflict, then submit again.';
        }
        return 'The flag was not updated. PASS could not send this to the national flag, so nothing has been saved. Try again.';
      case 'add':
        return 'The flag was not updated. PASS could not send this to the national flag, so nothing has been saved. Try again.';
      case 'delete':
        return 'Nothing was changed. PASS could not delete the flag from the national flag, so it has not been deleted. Try again.';
      default:
        return 'Nothing was changed. PASS could not remove this from the national flag, so it has not been removed. Try again.';
    }
  };

  const createFlag = (): string | null => {
    const rejected = rejection('create');
    if (rejected) return rejected;
    setRecord({ createdOn: todayIso(), createdBy: CURRENT_USER.name, lastUpdatedOn: todayIso(), items: [] });
    // Created in PASS first, then on the national flag, so the NHS now holds one too.
    setNationalFlag('found');
    setCreateOpen(false);
    setOutcome({
      kind: 'success',
      text: `Reasonable Adjustment Flag created for ${customer.fullName} in PASS and on the national flag. You can now add reasonable adjustments and impairments.`,
    });
    return null;
  };

  const addItem = (section: Exclude<RafSection, 'condition'>, item: NewRafItem): string | null => {
    if (!record) return null;
    const rejected = rejection(section === 'adjustment' ? 'add-adjustment' : 'add');
    if (rejected) return rejected;
    const existing = record.items.find(i => i.section === section && !i.endedOn && i.code === item.code);
    // Adding text to something already recorded appends to it (RAU005) rather than duplicating it.
    const items = existing
      ? record.items.map(i =>
          i.id === existing.id
            ? { ...i, freeText: [i.freeText, item.freeText].filter(Boolean).join('\n\n').slice(0, MAX_FREE_TEXT) }
            : i,
        )
      : [
          ...record.items,
          {
            id: `new-${Date.now()}`,
            section,
            ...item,
            addedOn: todayIso(),
            addedBy: CURRENT_USER.name,
            organisation: CURRENT_USER.organisation,
          },
        ];
    setRecord(touch(record, items));
    setAddSection(null);
    // Saved in PASS first, then sent to the national flag (R22).
    setOutcome({
      kind: 'success',
      text: existing
        ? `Details added to \u201C${item.term}\u201D in PASS and sent to the national flag.`
        : `\u201C${item.term}\u201D added to PASS and sent to the national flag.`,
    });
    return null;
  };

  const confirmRemove = (_reason: string, _comment: string, scope: RemoveScope): string | null => {
    if (!record || !removeTarget) return null;
    // A PASS-only removal never touches the national flag, so there is nothing there to reject.
    const rejected = scope === 'both' ? rejection(removeTarget.kind === 'flag' ? 'delete' : 'remove') : null;
    if (rejected) return rejected;
    const where = scope === 'both' ? 'PASS and the national flag' : 'PASS';
    const stays = scope === 'pass' ? ' It remains on the national flag.' : '';
    if (removeTarget.kind === 'flag') {
      setRecord(null);
      // Gone from the NHS too only if the user chose that; otherwise it's still there to be found.
      if (scope === 'both') setNationalFlag('none');
      keptNational.current = scope === 'pass' ? record : null;
      setOutcome({ kind: 'success', text: `The Reasonable Adjustment Flag for ${customer.fullName} has been deleted from ${where}.${stays}` });
    } else {
      const { item } = removeTarget;
      setRecord(touch(record, record.items.map(i => (i.id === item.id ? { ...i, endedOn: todayIso() } : i))));
      setOutcome({ kind: 'success', text: `\u201C${item.term}\u201D removed from ${where}.${stays}` });
    }
    setRemoveTarget(null);
    return null;
  };

  const activeCount = record ? record.items.filter(i => !i.endedOn).length : 0;

  // Internal admin: this tab isn't available, so send the user to Details
  // (where the status line will live) rather than leave them on a page they can't use. Also covers
  // arriving here directly by URL.
  if (!canSeeRafDetail(level)) return <Navigate to={`/customers/${customer.id}/details`} replace />;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {outcome?.kind === 'success' && (
        <Alert className="border-[rgb(178,224,178)] bg-[rgb(232,247,232)] text-[rgb(16,100,16)] items-center">
          <CheckCircle2 aria-hidden="true" />
          <div className="flex items-center justify-between gap-3">
            <p className="text-body font-medium">{outcome.text}</p>
            <Button variant="tertiary" size="sm" iconOnly aria-label="Dismiss message" onClick={() => setOutcome(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Alert>
      )}
      {outcome?.kind === 'info' && (
        <InfoBanner size="md" onDismiss={() => setOutcome(null)}>{outcome.text}</InfoBanner>
      )}

      {queryFailed && !querying && <NhsRequestError onRetry={refresh} />}

      {!queryFailed && <FlagSummary
        record={record}
        customerName={customer.fullName}
        itemCount={activeCount}
        querying={querying}
        retrievedAt={retrievedAt}
        level={level}
        canWrite={canWrite}
        nationalFlag={nationalFlag}
        onRefresh={refresh}
        onCreate={() => setCreateOpen(true)}
        onGoToDetails={() => navigate(`/customers/${customer.id}/details`)}
      />}

      {level === '1' && record && !queryFailed && (
        <InfoBanner>Your access level shows reasonable adjustments only. Impairments and underlying conditions are not shown.</InfoBanner>
      )}

      {record && querying && !queryFailed && (
        <div className="space-y-4" aria-busy="true" aria-label="Checking the national flag">
          {SECTIONS.filter(s => canSeeAll || s.section === 'adjustment').map(s => (
            <Skeleton key={s.section} className="h-32 w-full rounded-[10px]" />
          ))}
        </div>
      )}

      {record && !querying && !queryFailed && (
        <div className="space-y-4">
          {SECTIONS.filter(s => canSeeAll || s.section === 'adjustment').map(s => {
            const items = activeItems(record, s.section);
            return (
              <SectionCard
                key={s.section}
                title={s.title}
                icon={s.icon}
                items={items}
                emptyText={s.emptyText}
                page={pages[s.section]}
                onPage={p => setPages(prev => ({ ...prev, [s.section]: p }))}
                // Underlying conditions only arrive from the national flag; recording them from PASS is out of scope.
                onAdd={canWrite && s.section !== 'condition' ? () => setAddSection(s.section as Exclude<RafSection, 'condition'>) : undefined}
                addLabel={s.section === 'adjustment' ? 'Add adjustment' : 'Add impairment'}
                onRemove={canWrite && s.section !== 'condition' ? item => setRemoveTarget({ kind: 'item', item }) : undefined}
              />
            );
          })}
        </div>
      )}

      {/* Deleting the whole flag is only offered here, at the bottom of the full record, after its contents (AC). */}
      {record && !querying && !queryFailed && canWrite && (
        <section className="bg-white rounded-[10px] border border-gray-200 px-5 py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-gray-900">Delete the flag</h3>
            <p className="text-body text-gray-700">
              This deletes the whole Reasonable Adjustment Flag, including everything listed above. A reason and a comment are required.
            </p>
          </div>
          <Button variant="secondary-danger" icon={<Trash2 className="w-4 h-4" />} onClick={() => setRemoveTarget({ kind: 'flag', itemCount: activeCount })}>
            Delete flag
          </Button>
        </section>
      )}

      <CreateFlagDialog open={createOpen} onOpenChange={setCreateOpen} person={person} onCreate={createFlag} />
      <AddItemDialog
        section={addSection}
        onOpenChange={open => !open && setAddSection(null)}
        existing={record ? record.items.filter(i => !i.endedOn) : []}
        onAdd={item => (addSection ? addItem(addSection, item) : null)}
      />
      <RemoveDialog
        target={removeTarget}
        onOpenChange={open => !open && setRemoveTarget(null)}
        person={person}
        onConfirm={confirmRemove}
      />
    </div>
  );
}

/**
 * The live request to the NHS got no answer. Shown in place of the flag and its sections: whatever PASS held
 * from before can't be confirmed as current, so none of it is shown, and the message doesn't say it was empty.
 * (The mobile app differs on purpose: it keeps showing the last sync while offline.) Wording is placeholder.
 */
function NhsRequestError({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert className="border-red-300 bg-red-50 text-red-900 items-start px-5 py-4">
      <AlertCircle aria-hidden="true" />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="space-y-1">
          <p className="text-lg font-semibold">Reasonable adjustments couldn't be retrieved from the national flag</p>
          <p className="text-body">
            PASS asks the NHS for the latest each time this tab opens, and it didn't answer. Nothing is shown because it can't be confirmed as
            up to date. Try again in a moment. If it keeps happening, contact support.
          </p>
        </div>
        <Button variant="secondary" icon={<RefreshCw className="w-4 h-4" />} onClick={onRetry}>
          Try again
        </Button>
      </div>
    </Alert>
  );
}

/**
 * The flag-exists / no-flag status. Wording for the no-flag state is fixed by
 * the spec ("No current recorded need for adjustments to care"), and the look
 * is meant to be comparable to other national alerts (NCRS, CP-IS, FGM-IS).
 */
function FlagSummary({
  record,
  customerName,
  itemCount,
  querying,
  retrievedAt,
  level,
  canWrite,
  nationalFlag,
  onRefresh,
  onCreate,
  onGoToDetails,
}: {
  record: RafRecord | null;
  customerName: string;
  itemCount: number;
  querying: boolean;
  retrievedAt: Date | null;
  level: RafAccessLevel;
  canWrite: boolean;
  nationalFlag: NationalFlagState;
  onRefresh: () => void;
  onCreate: () => void;
  onGoToDetails: () => void;
}) {
  const retrieved = (
    <p className="text-body text-gray-700" aria-live="polite">
      {querying || !retrievedAt ? 'Checking the national flag…' : `Last retrieved from the national flag: ${formatRafDateTime(retrievedAt)}`}
    </p>
  );

  const refreshButton = (
    <Button variant="secondary" size="sm" icon={<RefreshCw className={`w-4 h-4 ${querying ? 'animate-spin' : ''}`} />} disabled={querying} onClick={onRefresh}>
      Refresh
    </Button>
  );

  if (!record) {
    const card = 'bg-white rounded-[10px] border border-gray-200 px-5 py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3';

    // No verified NHS number: PASS can't check the national flag, or create one (R20).
    if (nationalFlag === 'no-nhs-number') {
      return (
        <div className={card}>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-gray-900">The national flag can't be checked yet</p>
            <p className="text-body text-gray-700">
              {customerName} has no verified NHS number. PASS needs one to look for, or create, a Reasonable Adjustment Flag.
            </p>
          </div>
          <Button variant="secondary" onClick={onGoToDetails}>Go to Details</Button>
        </div>
      );
    }

    // The NHS holds a flag PASS doesn't, e.g. after deleting it from PASS only. Never offer Create: there is one flag per person.
    if (nationalFlag === 'found' && !querying) {
      return (
        <div className={card}>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-gray-900">A national flag exists that isn't in PASS</p>
            <p className="text-body text-gray-700">
              PASS holds no flag for {customerName}, but the national flag has one. A new flag can't be created while it exists.
            </p>
            {retrievedAt && retrieved}
          </div>
          <Button icon={<Download className="w-4 h-4" />} onClick={onRefresh}>Import from the national flag</Button>
        </div>
      );
    }

    return (
      <div className={card}>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-gray-900">
            {querying ? 'Checking the national flag\u2026' : 'No current recorded need for adjustments to care'}
          </p>
          {!querying && retrievedAt && retrieved}
          {RAF_WRITE_ENABLED && !canWrite && canSeeRafDetail(level) && !querying && (
            <p className="text-body text-gray-700">Your access level doesn't allow creating a flag for {customerName}.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {refreshButton}
          {canWrite && (
            <Button icon={<Plus className="w-4 h-4" />} disabled={querying} onClick={onCreate}>
              Create flag
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-[10px] border border-amber-300 bg-white overflow-hidden">
      {/* Header band: what this is, and what you can do with it. Same band-plus-white-body pattern as the section cards below. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-3 bg-amber-50 border-b border-amber-300">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center flex-shrink-0">
            <Flag className="w-5 h-5 text-amber-800" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Reasonable Adjustment Flag recorded</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {refreshButton}
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        <p className="text-body font-medium text-gray-900">
          {itemCount === 0 ? 'Nothing has been added to this flag yet.' : `${customerName} has adjustments to how their care is delivered.`}
        </p>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-body">
          <dt className="text-gray-600">Created on:</dt>
          <dd className="text-gray-900">
            {formatRafDate(record.createdOn)} by {record.createdBy}
            {record.createdByOrganisation && ` at ${record.createdByOrganisation}`}
          </dd>
          <dt className="text-gray-600">Last updated on:</dt>
          <dd className="text-gray-900">{formatRafDate(record.lastUpdatedOn)}</dd>
          <dt className="text-gray-600">Last retrieved from the national flag:</dt>
          <dd className="text-gray-900" aria-live="polite">
            {querying || !retrievedAt ? 'Checking the national flag\u2026' : formatRafDateTime(retrievedAt)}
          </dd>
        </dl>
        <p className="border-t border-gray-200 pt-3 text-body text-gray-700">
          {RAF_WRITE_ENABLED
            ? 'Changes made here are sent to the national flag. Changes made there are brought into PASS.'
            : 'This is a view only. Changes made on the national flag are brought into PASS.'}
        </p>
      </div>
    </section>
  );
}

function SectionCard({
  title,
  icon,
  items,
  emptyText,
  page,
  onPage,
  onAdd,
  addLabel,
  onRemove,
}: {
  title: string;
  icon: ReactNode;
  items: RafItem[];
  emptyText: string;
  page: number;
  onPage: (page: number) => void;
  onAdd?: () => void;
  addLabel: string;
  onRemove?: (item: RafItem) => void;
}) {
  // Removing the last item on a later page would otherwise leave an empty page showing.
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const from = (current - 1) * PAGE_SIZE;
  const visible = items.slice(from, from + PAGE_SIZE);

  return (
    <section className="bg-white rounded-[10px] border border-purple-200 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 py-3 bg-purple-50 border-b border-purple-200">
        <div className="flex items-center gap-3 min-w-0">
          {/* Soft circle, same treatment as the flag icon on the status panel above, in the section's purple. */}
          <span className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center flex-shrink-0">
            {icon}
          </span>
          <h3 className="text-base font-semibold text-purple-900">{title}</h3>
        </div>
        {onAdd && (
          <Button variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={onAdd}>
            {addLabel}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="px-5 py-6 text-body text-gray-700">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {visible.map(item => (
            <li key={item.id} className="flex items-start justify-between gap-4 px-5 py-4">
              <RafItemDetails item={item} />
              {onRemove && (
                <Button variant="tertiary-danger" size="sm" onClick={() => onRemove(item)} aria-label={`Remove ${item.term}`}>
                  Remove
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {items.length > PAGE_SIZE && (
        <PaginationBar
          page={current}
          pageCount={pageCount}
          from={from + 1}
          to={from + visible.length}
          total={items.length}
          onPage={onPage}
        />
      )}
    </section>
  );
}
