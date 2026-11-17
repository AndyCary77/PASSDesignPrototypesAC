import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertTriangle, ChevronDown, ChevronRight, File as FileIcon, Info, Mic, RefreshCw, Send, X } from 'lucide-react';
import assessmentHeroIconUrl from '../../icons/assessment-hero.svg';
import { CUSTOMER_FILES, formatFileDate, formatFileSize, getFileReadability, isSupportedSource, type FileReadability } from '../../../data/customerFiles';
import { Button } from '../../buttons/Button';
import { SegmentedControl } from '../../buttons/SegmentedControl';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '../../ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '../../ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import { resolveRecording, resolveRecordings } from '../CareBridgePage';
import { FILE_ICONS } from './FilesTab';
import { isAssessmentHeroLimitReached, LIMIT_REACHED_TITLE } from './AssessmentHeroLimitBanner';

// The minimal Assessment Hero banner for a finished document, offering one way to bring it up to date: "Update
// document" — pick a recording or a file to update it from. Once a document has been published from a draft that
// came from a recording or file (AIOP-24513), the banner also names that source, with a link to open it, so the
// "drafted with Assessment Hero" indicator on a published record says what it was drafted from.

export type UpdateSource =
  | { type: 'recording'; id: string; label: string }
  | { type: 'file'; id: string; name: string };

type SourceKind = 'recording' | 'file';

export const sourceName = (s: UpdateSource) => (s.type === 'file' ? s.name : s.label);

/** Where "View file" / "View recording" goes: the recording's page, or the customer's Files tab. */
export const sourceHref = (customerId: string, s: UpdateSource) =>
  s.type === 'recording'
    ? `/customers/${customerId}/documents/recording/${s.id}`
    : `/customers/${customerId}/documents?tab=files`;

/** What a run was made from, in a few words: the one source's name, or "3 sources". */
export const describeSources = (sources: UpdateSource[]) => (sources.length === 1 ? sourceName(sources[0]) : `${sources.length} sources`);

const LINK_CLASS = 'flex items-center gap-1 text-body font-medium text-[rgb(154,38,214)] hover:underline cursor-pointer';

/**
 * "View file" / "View recording" for one source, or a "View sources (N)" dropdown for several — the same link the
 * draft panel and the persistent indicator both end up needing. Renders nothing when there are no sources.
 */
export function ViewSourcesLink({ customerId, sources, onViewSource }: {
  customerId: string;
  sources: UpdateSource[];
  /** Opens a source; defaults to navigating to the recording or the Files tab. */
  onViewSource?: (source: UpdateSource) => void;
}) {
  const navigate = useNavigate();
  const open = onViewSource ?? ((s: UpdateSource) => navigate(sourceHref(customerId, s)));

  if (sources.length === 1) {
    return (
      <button type="button" onClick={() => open(sources[0])} className={LINK_CLASS}>
        {sources[0].type === 'file' ? 'View file' : 'View recording'}
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    );
  }
  if (sources.length > 1) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={LINK_CLASS}>
            View sources ({sources.length})
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-64">
          {sources.map(s => {
            const Icon = s.type === 'file' ? FileIcon : Mic;
            return (
              <DropdownMenuItem key={`${s.type}:${s.id}:${sourceName(s)}`} onSelect={() => open(s)} className="flex items-center gap-2 text-body">
                <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{sourceName(s)}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  return null;
}

/**
 * The small "Drafted by Assessment Hero" indicator that stays on a published document. Names what it was drafted
 * from and links to it. `children` is any action on the right (the update link); without it the line stops at the source.
 */
export function AssessmentHeroSourceIndicator({ customerId, sources = [], onViewSource, children }: {
  customerId: string;
  sources?: UpdateSource[];
  onViewSource?: (source: UpdateSource) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
      <div className="flex items-center gap-2 min-w-0">
        <img src={assessmentHeroIconUrl} className="w-6 h-6 flex-shrink-0" alt="Assessment Hero" />
        <p className="text-body text-purple-900 break-words">
          Drafted by Assessment Hero
          {sources.length > 0 && <> from <strong>{describeSources(sources)}</strong></>}
          {children ? ' — add a recording or file to update.' : '.'}
        </p>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <ViewSourcesLink customerId={customerId} sources={sources} onViewSource={onViewSource} />
        {children}
      </div>
    </div>
  );
}

export function AssessmentHeroUpdateBanner({ customerId, documentName, onSelect, sources }: {
  customerId: string;
  /** Used in the dialog's wording ("update the Customer Care and Support Plan"). */
  documentName: string;
  /** Called with the chosen sources (one or more) when the user continues. */
  onSelect: (sources: UpdateSource[]) => void;
  /** What the published document was drafted from, once something has been published into it. */
  sources?: UpdateSource[];
}) {
  const limitReached = isAssessmentHeroLimitReached(customerId);

  return (
    <AssessmentHeroSourceIndicator customerId={customerId} sources={sources}>
      {(
        limitReached ? (
          // Updating re-drafts the document, which the customer's drafting limit blocks — the link stays where
          // you'd look for it but can't be used; the limit notice on the page says why.
          <button
            type="button"
            disabled
            title={LIMIT_REACHED_TITLE}
            className="flex items-center gap-1 text-body font-medium text-gray-500 cursor-not-allowed"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Update document
          </button>
        ) : (
          <UpdateDocumentDialog customerId={customerId} documentName={documentName} onSelect={onSelect} />
        )
      )}
    </AssessmentHeroSourceIndicator>
  );
}

/**
 * The source picker behind "Update document" (AIOP-24513). Two tabs — Recording and File — so it's clear which is
 * which; each takes any number of ticks, and what's ticked on one tab is kept when you switch to the other, with a
 * count on the tab label. The sources are combined into one draft. Files that aren't PDF or Word are listed but
 * can't be ticked. There is deliberately no upload here: a file has to be in the Files tab first.
 * Also used, with `fileOnly`, to fill a blank document from files — then `trigger` is the button that opens it and
 * `title`/`description` word the dialog for that.
 */
export function UpdateDocumentDialog({ customerId, documentName, onSelect, fileOnly = false, trigger, title = 'Update document', description }: {
  customerId: string;
  documentName: string;
  onSelect: (sources: UpdateSource[]) => void;
  /** Offer files only — no Recording/File toggle. */
  fileOnly?: boolean;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
}) {
  const recordings = resolveRecordings(customerId);
  const files = CUSTOMER_FILES[customerId] ?? [];

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<SourceKind>(fileOnly ? 'file' : 'recording');
  // Kept per tab, so switching tabs doesn't lose what's ticked on the other one.
  const [recordingIds, setRecordingIds] = useState<string[]>([]);
  const [fileIds, setFileIds] = useState<string[]>([]);

  const reset = () => { setKind(fileOnly ? 'file' : 'recording'); setRecordingIds([]); setFileIds([]); };

  const toggle = (ids: string[], set: (ids: string[]) => void, id: string) =>
    set(ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);

  const total = recordingIds.length + fileIds.length;

  const handleContinue = () => {
    const sources: UpdateSource[] = [
      ...recordings.filter(r => recordingIds.includes(r.id)).map((r): UpdateSource => ({ type: 'recording', id: r.id, label: r.label })),
      ...files.filter(f => fileIds.includes(f.id)).map((f): UpdateSource => ({ type: 'file', id: f.id, name: `${f.name}.${f.extension}` })),
    ];
    if (sources.length > 0) onSelect(sources);
    setOpen(false);
  };

  const rowClass = (checked: boolean, disabled = false) =>
    `flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
      disabled ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
        : checked ? 'border-[rgb(154,38,214)] bg-purple-50 cursor-pointer'
        : 'border-gray-200 hover:bg-gray-50 cursor-pointer'
    }`;
  const checkboxClass = 'h-4 w-4 accent-[rgb(154,38,214)] flex-shrink-0';
  const withCount = (label: string, n: number) => (n > 0 ? `${label} (${n})` : label);

  return (
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (o) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="flex items-center gap-1 text-body font-medium text-[rgb(154,38,214)] hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Update document
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description ?? `Choose one or more recordings and files to update the ${documentName} from.`}
          </DialogDescription>
        </DialogHeader>

        {!fileOnly && (
          <SegmentedControl<SourceKind>
            ariaLabel="Update from"
            fullWidth
            value={kind}
            onChange={setKind}
            options={[
              { value: 'recording', label: withCount('Recording', recordingIds.length) },
              { value: 'file', label: withCount('File', fileIds.length) },
            ]}
          />
        )}

        <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto -mx-1 px-1">
          {kind === 'recording' ? (
            recordings.length > 0 ? recordings.map(r => (
              <label key={r.id} className={rowClass(recordingIds.includes(r.id))}>
                <input
                  type="checkbox"
                  checked={recordingIds.includes(r.id)}
                  onChange={() => toggle(recordingIds, setRecordingIds, r.id)}
                  className={checkboxClass}
                />
                <Mic className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium text-gray-900 truncate">{r.label}</p>
                  <p className="text-body text-gray-600">{r.recordingMeta.split(' · ')[0]} · {r.recordedBy}</p>
                </div>
              </label>
            )) : (
              <p className="text-body text-gray-600 py-3">There are no recordings for this customer yet.</p>
            )
          ) : (
            <>
              {files.map(f => {
                const Icon = FILE_ICONS[f.extension] ?? FileIcon;
                const supported = isSupportedSource(f);
                const checked = fileIds.includes(f.id);
                return (
                  <label key={f.id} className={rowClass(checked, !supported)}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!supported}
                      aria-describedby={supported ? undefined : `unsupported-${f.id}`}
                      onChange={() => toggle(fileIds, setFileIds, f.id)}
                      className={checkboxClass}
                    />
                    <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className={`text-body font-medium truncate ${supported ? 'text-gray-900' : 'text-gray-700'}`}>{f.name}.{f.extension}</p>
                      <p className="text-body text-gray-600">{f.folder} · {formatFileSize(f.sizeBytes)} · Uploaded {formatFileDate(f.uploaded)}</p>
                      {!supported && (
                        <p id={`unsupported-${f.id}`} className="text-body font-medium text-gray-700">Only PDF and Word files can be used</p>
                      )}
                    </div>
                  </label>
                );
              })}
              {files.length === 0 && (
                <p className="text-body text-gray-600 py-3">No files have been uploaded for this customer yet.</p>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="tertiary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={total === 0} onClick={handleContinue}>
            {total > 1 ? `Continue with ${total} sources` : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── While an update is awaiting review ──────────────────────────────────────────────────────────────

/**
 * The Assessment Hero Draft panel for a finished document that's been updated and is waiting for review — the
 * same two-toned panel the first draft of a document gets, but describing an update: what it was made from and
 * how little of the document it touched. Publish stays disabled until every changed field has been accepted.
 */
export function AssessmentHeroUpdateDraftBanner({ customerId, sources, changed, pendingCount, onDiscard, onPublish }: {
  customerId: string;
  /** Everything this draft was updated from. */
  sources: UpdateSource[];
  /** How many sections/fields the update changed. */
  changed: number;
  /** How many of those still need accepting. */
  pendingCount: number;
  onDiscard: () => void;
  onPublish: () => void;
}) {
  const only = sources.length === 1 ? sources[0] : undefined;
  const recording = only?.type === 'recording' ? resolveRecording(customerId, only.id) : undefined;
  const sourceLabel = describeSources(sources);
  const [recordedOn, recordedAt] = recording ? [recording.recordingMeta.split(' · ')[0], recording.recordingMeta.split(' · ')[1].split('–')[0]] : [];
  const changedWords = `${changed} ${changed === 1 ? 'field' : 'fields'}`;

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
            {recording ? (
              <>Updated from <strong>{sourceLabel}</strong>, recorded <strong>{recordedOn} at {recordedAt}</strong> by <strong>{recording.recordedBy}</strong></>
            ) : only ? (
              <>Updated from the file <strong>{sourceLabel}</strong></>
            ) : (
              <>Updated from <strong>{sourceLabel}</strong></>
            )}
            {' '}— only {changedWords} with new information {changed === 1 ? 'has' : 'have'} changed; everything else is as it was. Please review before accepting.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-purple-50 border-t border-purple-200 px-4 py-3">
        <ViewSourcesLink customerId={customerId} sources={sources} />

        <div className="flex items-center gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="tertiary">Discard draft</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard this draft?</AlertDialogTitle>
                <AlertDialogDescription>
                  The document goes back to how it was before it was updated from {sourceLabel}. Any changes
                  you have accepted in this draft are discarded too.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">Keep draft</AlertDialogCancel>
                <AlertDialogAction onClick={onDiscard} className="rounded-full bg-red-600 text-white hover:bg-red-700">
                  Discard draft
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            icon={<Send className="w-4 h-4" />}
            disabled={pendingCount > 0}
            title={pendingCount > 0 ? 'Accept the outstanding drafted fields before publishing' : undefined}
            onClick={onPublish}
          >
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Shown when the chosen recording or file has nothing new for the document: nothing is drafted, and the user is told. */
export function UpdateNoChangesNotice({ sourceLabel, onDismiss }: { sourceLabel: string; onDismiss: () => void }) {
  return (
    <div role="status" className="flex items-start gap-2.5 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
      <Info className="w-4 h-4 text-[rgb(154,38,214)] flex-shrink-0 mt-1" aria-hidden="true" />
      <p className="flex-1 text-body text-purple-900">
        No new information found in <strong>{sourceLabel}</strong> &mdash; the document hasn&rsquo;t changed.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="p-0.5 rounded text-purple-900 hover:bg-purple-100 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/** Why Assessment Hero couldn't draft from a file — worded for the person who has to decide what to do about it. */
const PROBLEM_TEXT: Record<FileReadability, string> = {
  'password-protected': 'is password-protected, so it could not be opened.',
  corrupt: 'looks damaged, so it could not be opened.',
  'no-text': 'has no readable text — it looks like a scan.',
};

export interface FileProblem { name: string; reason: FileReadability }

/** The problem with a selected file, if it can't be read — or undefined for a recording or a readable file. */
export function getSourceProblem(customerId: string, source: UpdateSource): FileProblem | undefined {
  if (source.type !== 'file') return undefined;
  const reason = getFileReadability(customerId, source.id);
  return reason ? { name: source.name, reason } : undefined;
}

/**
 * Shown when one or more chosen files couldn't be read: each is named with the reason, and nothing is drafted from
 * it. Any other source chosen in the same run is still drafted — `othersDrafted` says so.
 */
export function UpdateProblemsNotice({ problems, othersDrafted, onDismiss }: { problems: FileProblem[]; othersDrafted: boolean; onDismiss: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
      <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-1" aria-hidden="true" />
      <div className="flex-1 min-w-0 text-body text-gray-900">
        {problems.map(p => (
          <p key={p.name} className="break-words">
            <strong>{p.name}</strong> {PROBLEM_TEXT[p.reason]} Nothing was drafted from it.
          </p>
        ))}
        {othersDrafted && <p className="mt-1">Everything else you chose was drafted as normal.</p>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="p-0.5 rounded text-gray-900 hover:bg-amber-100 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
