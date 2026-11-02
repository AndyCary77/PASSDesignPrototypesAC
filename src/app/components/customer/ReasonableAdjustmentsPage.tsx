import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Flag, Plus, RefreshCw, Trash2, CheckCircle2, X, Accessibility, HeartPulse, Stethoscope, Download, Globe } from 'lucide-react';
import { useCustomer } from '../../data/CustomerContext';
import { useRafAccess, type NationalFlagState, type RafAccessLevel } from '../../data/RafAccessContext';
import {
  CURRENT_USER,
  MAX_FREE_TEXT,
  activeItems,
  categoryName,
  formatRafDate,
  formatRafDateTime,
  getNationalFlag,
  getRafRecord,
  nextNationalChange,
  todayIso,
  type RafItem,
  type RafRecord,
  type RafSection,
} from '../../data/reasonableAdjustments';
import { Button } from '../buttons/Button';
import { PaginationBar } from '../buttons/PaginationBar';
import { InfoBanner } from '../banners/InfoBanner';
import { Alert } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import { Tag } from '../ui/tag';
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
  const { level, nationalFlag, setNationalFlag, nationalChangeCount } = useRafAccess();
  const [record, setRecord] = useState<RafRecord | null>(() => getRafRecord(customer.id));
  const [retrievedAt, setRetrievedAt] = useState<Date | null>(null);
  const [querying, setQuerying] = useState(true);
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
  // What the NHS still holds after a flag is deleted from PASS only: exactly what PASS had, so
  // importing it again brings back the same flag, not the demo's starting one.
  const keptNational = useRef<RafRecord | null>(null);

  const person = { name: customer.fullName, dob: customer.dob, nhs: customer.nhs };
  const canWrite = level === '3';
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
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      // Without a verified NHS number PASS can't ask the NHS anything (R20), so there is nothing to retrieve.
      if (nationalFlagRef.current !== 'no-nhs-number') {
        setRetrievedAt(new Date());
        if (!recordRef.current && nationalFlagRef.current === 'found') importNational();
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

  const createFlag = () => {
    setRecord({ createdOn: todayIso(), createdBy: CURRENT_USER.name, lastUpdatedOn: todayIso(), items: [] });
    // Created in PASS first, then on the national flag, so the NHS now holds one too.
    setNationalFlag('found');
    setCreateOpen(false);
    setOutcome({
      kind: 'success',
      text: `Reasonable Adjustment Flag created for ${customer.fullName} in PASS and on the national flag. You can now add reasonable adjustments and impairments.`,
    });
  };

  const addItem = (section: Exclude<RafSection, 'condition'>, item: NewRafItem) => {
    if (!record) return;
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
  };

  const confirmRemove = (_reason: string, _comment: string, scope: RemoveScope) => {
    if (!record || !removeTarget) return;
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
  };

  const activeCount = record ? record.items.filter(i => !i.endedOn).length : 0;

  // No Reasonable Adjustment access level: this tab isn't available, so send the user to Details
  // (where the status line will live) rather than leave them on a page they can't use. Also covers
  // arriving here directly by URL.
  if (level === 'none') return <Navigate to={`/customers/${customer.id}/details`} replace />;

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

      <FlagSummary
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
        onDelete={() => setRemoveTarget({ kind: 'flag', itemCount: activeCount })}
        onGoToDetails={() => navigate(`/customers/${customer.id}/details`)}
      />

      {level === '1' && record && (
        <InfoBanner>Your access level shows reasonable adjustments only. Impairments and underlying conditions are not shown.</InfoBanner>
      )}

      {record && querying && (
        <div className="space-y-4" aria-busy="true" aria-label="Checking the national flag">
          {SECTIONS.filter(s => canSeeAll || s.section === 'adjustment').map(s => (
            <Skeleton key={s.section} className="h-32 w-full rounded-[10px]" />
          ))}
        </div>
      )}

      {record && !querying && (
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

      <CreateFlagDialog open={createOpen} onOpenChange={setCreateOpen} person={person} onCreate={createFlag} />
      <AddItemDialog
        section={addSection}
        onOpenChange={open => !open && setAddSection(null)}
        existing={record ? record.items.filter(i => !i.endedOn) : []}
        onAdd={item => addSection && addItem(addSection, item)}
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
  onDelete,
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
  onDelete: () => void;
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
          {!canWrite && level !== 'none' && !querying && (
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
          {canWrite && (
            <Button variant="secondary-danger" size="sm" icon={<Trash2 className="w-4 h-4" />} disabled={querying} onClick={onDelete}>
              Delete flag
            </Button>
          )}
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
          Changes made here are sent to the national flag. Changes made there are brought into PASS.
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
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-body font-semibold text-gray-900">{item.term}</p>
                  {item.categoryCode && <Tag label={categoryName(item.categoryCode)} />}
                </div>
                {item.freeText && <p className="text-body text-gray-800 leading-relaxed whitespace-pre-line">{item.freeText}</p>}
                <p className="flex items-start gap-1.5 text-sm text-gray-600">
                  {/* A globe marks items that came from the national flag. The text beside it already says who and where, so this is a scan aid, with a tooltip and screen-reader text so it isn't the only signal. */}
                  {item.source === 'national' && (
                    <>
                      <span title="From the national flag" className="mt-0.5 shrink-0">
                        <Globe className="size-4 text-gray-600" aria-hidden="true" />
                      </span>
                      <span className="sr-only">From the national flag. </span>
                    </>
                  )}
                  <span>Added: {formatRafDate(item.addedOn)} by {item.addedBy} at {item.organisation}</span>
                </p>
              </div>
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
