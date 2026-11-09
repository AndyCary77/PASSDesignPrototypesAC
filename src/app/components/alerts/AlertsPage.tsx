import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Clock, FileText, Filter, Flag, ListChecks } from 'lucide-react';
import { canSeeRafDetail, useRafAccess } from '../../data/RafAccessContext';
import {
  ALERTS,
  ALERT_TYPE_LABEL,
  RA_RESOLVE_SUGGESTIONS,
  TODAY,
  type AlertRecord,
  type AlertType,
} from '../../data/alertsDummy';
import { Button } from '../buttons/Button';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

/**
 * The office-wide Alerts page, built against a screenshot of the live one: a filter panel, then "Alerts Report"
 * with one card per alert (Select / Resolve / Office note). The new alert type is "Reasonable adjustments",
 * raised when an NHS update adds or changes a Reasonable Adjustment. It says which customer and what changed,
 * links to the customer's Reasonable Adjustments tab, and is resolved with a note like every other alert.
 * Resolve and Office note are simulated; nothing is saved beyond this visit.
 */

type StatusFilter = 'unresolved' | 'resolved' | 'all';
type DateRange = 'today' | 'week' | 'all';
type Order = 'newest' | 'oldest';

const ALL = 'all';

const TYPE_OPTIONS: AlertType[] = ['booking', 'medication-form', 'checklist-item', 'reasonable-adjustments'];
const TASK_TYPES = Array.from(new Set(ALERTS.map(a => a.taskType).filter((t): t is string => !!t)));

const ICON: Record<AlertType, ReactNode> = {
  booking: <Clock className="w-5 h-5" aria-hidden="true" />,
  'medication-form': <FileText className="w-5 h-5" aria-hidden="true" />,
  'checklist-item': <ListChecks className="w-5 h-5" aria-hidden="true" />,
  'reasonable-adjustments': <Flag className="w-5 h-5" fill="currentColor" aria-hidden="true" />,
};

interface Resolution {
  note: string;
  at: string;
}

const stamp = (a: AlertRecord) => `${a.date} ${a.time}`;

function daysBefore(date: string, ref: string) {
  return Math.round((Date.parse(ref) - Date.parse(date)) / 86_400_000);
}

function searchText(a: AlertRecord) {
  return [a.title, ALERT_TYPE_LABEL[a.type], a.customerName ?? '', a.change?.summary ?? '', a.change?.by ?? '', ...a.lines.map(l => `${l.strong ?? ''}${l.text}`)]
    .join(' ')
    .toLowerCase();
}

export function AlertsPage() {
  const { level } = useRafAccess();
  const [status, setStatus] = useState<StatusFilter>('unresolved');
  const [type, setType] = useState<string>(ALL);
  const [taskType, setTaskType] = useState<string>(ALL);
  const [terms, setTerms] = useState('');
  const [order, setOrder] = useState<Order>('newest');
  const [range, setRange] = useState<DateRange>('today');
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Alert ids being resolved in the dialog; null = closed.
  const [resolving, setResolving] = useState<string[] | null>(null);

  // An internal admin still hears that something changed, but not what.
  const canSeeDetail = canSeeRafDetail(level);

  const visible = useMemo(() => {
    const words = terms.toLowerCase().split(/\s+/).filter(Boolean);
    return ALERTS.filter(a => {
      const resolved = a.id in resolutions;
      if (status === 'unresolved' && resolved) return false;
      if (status === 'resolved' && !resolved) return false;
      if (type !== ALL && a.type !== type) return false;
      if (taskType !== ALL && a.taskType !== taskType) return false;
      const age = daysBefore(a.date, TODAY);
      if (range === 'today' && age > 0) return false;
      if (range === 'week' && age > 7) return false;
      const text = searchText(a);
      return words.every(w => text.includes(w));
    }).sort((x, y) => (order === 'newest' ? stamp(y).localeCompare(stamp(x)) : stamp(x).localeCompare(stamp(y))));
  }, [status, type, taskType, terms, range, order, resolutions]);

  const selectedVisible = visible.filter(a => selected.has(a.id) && !(a.id in resolutions));
  const selectable = visible.filter(a => !(a.id in resolutions));
  const allSelected = selectable.length > 0 && selectable.every(a => selected.has(a.id));

  const toggle = (id: string, on: boolean) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const resolve = (ids: string[], note: string) => {
    const at = new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
    setResolutions(prev => ({ ...prev, ...Object.fromEntries(ids.map(id => [id, { note, at }])) }));
    setSelected(prev => new Set([...prev].filter(id => !ids.includes(id))));
    setResolving(null);
  };

  const resolvingAlerts = ALERTS.filter(a => resolving?.includes(a.id));

  return (
    <div className="space-y-4">
      <section aria-label="Filter alerts" className="space-y-1.5">
        <h2 className="text-body text-gray-700">Filter Alerts</h2>
        <div className="bg-white rounded-[10px] border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-6 gap-x-4 gap-y-3">
          <FilterSelect label="Status" className="md:col-span-2" value={status} onChange={v => setStatus(v as StatusFilter)} options={[['unresolved', 'Unresolved'], ['resolved', 'Resolved'], ['all', 'All']]} />
          <FilterSelect
            label="Alert Type"
            className="md:col-span-2"
            value={type}
            onChange={setType}
            options={[[ALL, 'All'], ...TYPE_OPTIONS.map(t => [t, ALERT_TYPE_LABEL[t]] as [string, string])]}
          />
          <FilterSelect label="Task Type" className="md:col-span-2" value={taskType} onChange={setTaskType} options={[[ALL, 'All'], ...TASK_TYPES.map(t => [t, t] as [string, string])]} />

          <div className="md:col-span-4 space-y-1.5">
            <Label htmlFor="alert-terms" className="text-body font-normal text-gray-700">Filter terms</Label>
            <div className="flex h-10 rounded-md border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-[rgb(154,38,214)]/50">
              <span className="flex items-center px-3 border-r border-gray-300 text-gray-700"><Filter className="w-4 h-4" aria-hidden="true" /></span>
              <input
                id="alert-terms"
                value={terms}
                onChange={e => setTerms(e.target.value)}
                placeholder="Enter filter terms"
                className="flex-1 min-w-0 px-3 text-body bg-transparent outline-none"
              />
            </div>
          </div>
          <FilterSelect label="Order By" className="md:col-span-2" value={order} onChange={v => setOrder(v as Order)} options={[['newest', 'Most recent first'], ['oldest', 'Oldest first']]} />
          <FilterSelect label="Date Range" className="md:col-span-2" value={range} onChange={v => setRange(v as DateRange)} options={[['today', 'Today'], ['week', 'Last 7 days'], ['all', 'All time']]} />
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <h1 className="text-3xl font-semibold text-gray-900">
          Alerts Report ({visible.length} {visible.length === 1 ? 'alert' : 'alerts'})
        </h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-body text-gray-900">
            Select All
            <Checkbox
              checked={allSelected}
              disabled={selectable.length === 0}
              onCheckedChange={on => setSelected(on ? new Set(selectable.map(a => a.id)) : new Set())}
              aria-label="Select all alerts"
            />
          </label>
          <Button variant="secondary" disabled={selectedVisible.length === 0} onClick={() => setResolving(selectedVisible.map(a => a.id))}>
            Resolve Selected
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="bg-white rounded-[10px] border border-gray-200 px-5 py-6 text-body text-gray-700">No alerts match these filters.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map(a => (
            <AlertCard
              key={a.id}
              alert={a}
              canSeeDetail={canSeeDetail}
              resolution={resolutions[a.id]}
              selected={selected.has(a.id)}
              onSelect={on => toggle(a.id, on)}
              onResolve={() => setResolving([a.id])}
            />
          ))}
        </ul>
      )}

      <ResolveDialog alerts={resolvingAlerts} onOpenChange={open => !open && setResolving(null)} onResolve={note => resolving && resolve(resolving, note)} />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-body font-normal text-gray-700">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([v, text]) => (
            <SelectItem key={v} value={v}>{text}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function AlertCard({
  alert,
  canSeeDetail,
  resolution,
  selected,
  onSelect,
  onResolve,
}: {
  alert: AlertRecord;
  canSeeDetail: boolean;
  resolution?: Resolution;
  selected: boolean;
  onSelect: (on: boolean) => void;
  onResolve: () => void;
}) {
  const resolved = !!resolution;
  const isRa = alert.type === 'reasonable-adjustments';
  // Same red as every other alert; resolved ones go quiet.
  const tone = resolved ? 'text-gray-700' : 'text-red-700';

  return (
    <li className="relative bg-white rounded-[10px] border border-gray-200 overflow-hidden pl-1.5">
      <span className={`absolute inset-y-0 left-0 w-1.5 ${resolved ? 'bg-gray-300' : 'bg-red-600'}`} aria-hidden="true" />
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 py-3">
        <div className="min-w-0 space-y-1">
          <h2 className={`flex items-center gap-2 text-lg font-medium ${tone}`}>
            {ICON[alert.type]}
            {alert.title}
          </h2>

          {isRa ? (
            <ul className="list-disc pl-12 space-y-0.5 text-body text-gray-900">
              <li>
                <span className="font-semibold">Reasonable Adjustments</span> for{' '}
                {canSeeDetail ? (
                  <Link to={`/customers/${alert.customerId}/reasonableadjustments`} className="font-semibold text-purple-900 underline-offset-2 hover:underline">
                    {alert.customerName}
                  </Link>
                ) : (
                  alert.customerName
                )}
              </li>
              {canSeeDetail && alert.change ? (
                <>
                  <li>{alert.change.summary}</li>
                  <li>by {alert.change.by}</li>
                </>
              ) : (
                <li>A reasonable adjustment was added or changed. Admin users can't see the details.</li>
              )}
            </ul>
          ) : (
            <ul className="list-disc pl-12 space-y-0.5 text-body text-gray-900">
              {alert.lines.map((l, i) => (
                <li key={i}>
                  {l.strong && <span className="font-semibold">{l.strong}</span>}
                  {l.text}
                </li>
              ))}
            </ul>
          )}

          {isRa && canSeeDetail && (
            <p className="pl-12 pt-1">
              <Link to={`/customers/${alert.customerId}/reasonableadjustments`} className="text-body font-medium text-purple-900 underline underline-offset-2">
                View Reasonable Adjustments
              </Link>
            </p>
          )}

          {resolution && (
            <p className="pl-12 pt-1 text-body text-gray-700">
              <span className="font-semibold">Resolved</span> {resolution.at}: {resolution.note}
            </p>
          )}
          <p className="pl-12 pt-1 text-sm text-gray-700">
            {alert.date}
            <span className="ml-4">{alert.time}</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          {!resolved && (
            <label className="flex items-center gap-2 text-body text-gray-900">
              Select
              <Checkbox checked={selected} onCheckedChange={on => onSelect(on === true)} aria-label={`Select alert: ${alert.title}`} />
            </label>
          )}
          {!resolved && (
            <Button variant="tertiary" size="sm" onClick={onResolve}>Resolve</Button>
          )}
          <Button variant="tertiary" size="sm">Office note</Button>
        </div>
      </div>
    </li>
  );
}

/** Resolving always asks for a note, e.g. "Care plan updated"; for Reasonable Adjustments alerts the likely ones are offered. */
function ResolveDialog({
  alerts,
  onOpenChange,
  onResolve,
}: {
  alerts: AlertRecord[];
  onOpenChange: (open: boolean) => void;
  onResolve: (note: string) => void;
}) {
  return (
    <Dialog open={alerts.length > 0} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {alerts.length > 0 && <ResolveForm alerts={alerts} onCancel={() => onOpenChange(false)} onResolve={onResolve} />}
      </DialogContent>
    </Dialog>
  );
}

function ResolveForm({ alerts, onCancel, onResolve }: { alerts: AlertRecord[]; onCancel: () => void; onResolve: (note: string) => void }) {
  const [note, setNote] = useState('');
  const onlyRa = alerts.every(a => a.type === 'reasonable-adjustments');
  const many = alerts.length > 1;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-semibold text-gray-900">{many ? `Resolve ${alerts.length} alerts` : 'Resolve alert'}</DialogTitle>
        <DialogDescription className="text-body text-gray-700">
          {many
            ? 'The same note is added to each alert.'
            : alerts[0].type === 'reasonable-adjustments' && alerts[0].customerName
              ? `Reasonable adjustment updated for ${alerts[0].customerName}.`
              : alerts[0].title}{' '}
          Say what was done, so the next person knows it has been dealt with.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="resolve-note" className="text-body font-medium text-gray-900">Note</Label>
        {onlyRa && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Suggested notes">
            {RA_RESOLVE_SUGGESTIONS.map(s => (
              <Button key={s} variant="secondary" size="sm" onClick={() => setNote(s)}>{s}</Button>
            ))}
          </div>
        )}
        <Textarea id="resolve-note" value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="e.g. Care plan updated" />
      </div>

      <DialogFooter>
        <Button variant="tertiary" onClick={onCancel}>Cancel</Button>
        <Button disabled={!note.trim()} onClick={() => onResolve(note.trim())}>Resolve</Button>
      </DialogFooter>
    </>
  );
}
