import { useRef, useState } from 'react';
import { ChevronRight, File as FileIcon, Info, Mic, RefreshCw, Send, Upload, X } from 'lucide-react';
import assessmentHeroIconUrl from '../../icons/assessment-hero.svg';
import { CUSTOMER_FILES, formatFileDate, formatFileSize } from '../../../data/customerFiles';
import { Button } from '../../buttons/Button';
import { SegmentedControl } from '../../buttons/SegmentedControl';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '../../ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '../../ui/dialog';
import { resolveRecording, resolveRecordings, type ItemUpdate } from '../CareBridgePage';
import { FILE_ICONS } from './FilesTab';
import { isAssessmentHeroLimitReached, LIMIT_REACHED_TITLE } from './AssessmentHeroLimitBanner';

// The minimal Assessment Hero banner for a finished document, offering one way to bring it up to date. A
// published document doesn't keep a live link to whatever it was originally drafted from, so — unlike
// AssessmentHeroReuseBanner's "View recording" / "Change recording(s)" — there is nothing to show or change
// here, just "Update document": pick a recording or a file to update it from.

export type UpdateSource =
  | { type: 'recording'; id: string; label: string }
  | { type: 'file'; id: string; name: string };

type SourceKind = 'recording' | 'file';

const ACCEPTED_UPLOADS = 'audio/*,.pdf,.doc,.docx,.txt';

/** The id a file picked from the user's own computer is given (it isn't one of the customer's saved files). */
export const UPLOADED_FILE_ID = 'uploaded-now';

export function AssessmentHeroUpdateBanner({ customerId, documentName, onSelect }: {
  customerId: string;
  /** Used in the dialog's wording ("update the Customer Care and Support Plan"). */
  documentName: string;
  /** Called with the chosen source when the user continues. */
  onSelect: (source: UpdateSource) => void;
}) {
  const limitReached = isAssessmentHeroLimitReached(customerId);

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
      <div className="flex items-center gap-2 min-w-0">
        <img src={assessmentHeroIconUrl} className="w-6 h-6 flex-shrink-0" alt="Assessment Hero" />
        <p className="text-body text-purple-900">Drafted by Assessment Hero — add a recording or file to update.</p>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        {limitReached ? (
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
        )}
      </div>
    </div>
  );
}

/**
 * The picker behind "Update document". Also used, with `fileOnly`, to fill a blank document from one of the
 * customer's files — then `trigger` is the button that opens it and `title`/`description` word the dialog for that.
 */
export function UpdateDocumentDialog({ customerId, documentName, onSelect, fileOnly = false, trigger, title = 'Update document', description }: {
  customerId: string;
  documentName: string;
  onSelect: (source: UpdateSource) => void;
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
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  // A file chosen from the user's own computer, offered alongside the customer's existing files.
  const [uploaded, setUploaded] = useState<File | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const reset = () => { setKind(fileOnly ? 'file' : 'recording'); setRecordingId(null); setFileId(null); setUploaded(null); };

  const UPLOADED_ID = UPLOADED_FILE_ID;
  const canContinue = kind === 'recording' ? recordingId !== null : fileId !== null;

  const handleContinue = () => {
    if (kind === 'recording') {
      const r = recordings.find(x => x.id === recordingId);
      if (r) onSelect({ type: 'recording', id: r.id, label: r.label });
    } else if (fileId === UPLOADED_ID && uploaded) {
      onSelect({ type: 'file', id: UPLOADED_ID, name: uploaded.name });
    } else {
      const f = files.find(x => x.id === fileId);
      if (f) onSelect({ type: 'file', id: f.id, name: `${f.name}.${f.extension}` });
    }
    setOpen(false);
  };

  const rowClass = (checked: boolean) =>
    `flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
      checked ? 'border-[rgb(154,38,214)] bg-purple-50' : 'border-gray-200 hover:bg-gray-50'
    }`;

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
            {description ?? `Choose a recording or a file to update the ${documentName} from.`}
          </DialogDescription>
        </DialogHeader>

        {!fileOnly && (
          <SegmentedControl<SourceKind>
            ariaLabel="Update from"
            fullWidth
            value={kind}
            onChange={setKind}
            options={[{ value: 'recording', label: 'Recording' }, { value: 'file', label: 'File' }]}
          />
        )}

        <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto -mx-1 px-1">
          {kind === 'recording' ? (
            recordings.length > 0 ? recordings.map(r => (
              <label key={r.id} className={rowClass(recordingId === r.id)}>
                <input
                  type="radio"
                  name="update-source-recording"
                  checked={recordingId === r.id}
                  onChange={() => setRecordingId(r.id)}
                  className="h-4 w-4 accent-[rgb(154,38,214)] flex-shrink-0"
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
              {uploaded && (
                <label className={rowClass(fileId === UPLOADED_ID)}>
                  <input
                    type="radio"
                    name="update-source-file"
                    checked={fileId === UPLOADED_ID}
                    onChange={() => setFileId(UPLOADED_ID)}
                    className="h-4 w-4 accent-[rgb(154,38,214)] flex-shrink-0"
                  />
                  <Upload className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium text-gray-900 truncate">{uploaded.name}</p>
                    <p className="text-body text-gray-600">Uploaded just now</p>
                  </div>
                </label>
              )}
              {files.map(f => {
                const Icon = FILE_ICONS[f.extension] ?? FileIcon;
                return (
                  <label key={f.id} className={rowClass(fileId === f.id)}>
                    <input
                      type="radio"
                      name="update-source-file"
                      checked={fileId === f.id}
                      onChange={() => setFileId(f.id)}
                      className="h-4 w-4 accent-[rgb(154,38,214)] flex-shrink-0"
                    />
                    <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-medium text-gray-900 truncate">{f.name}.{f.extension}</p>
                      <p className="text-body text-gray-600">{formatFileSize(f.sizeBytes)} · Uploaded {formatFileDate(f.uploaded)}</p>
                    </div>
                  </label>
                );
              })}
              {files.length === 0 && !uploaded && (
                <p className="text-body text-gray-600 py-3">No files have been uploaded for this customer yet.</p>
              )}
            </>
          )}
        </div>

        {kind === 'file' && (
          <div>
            {/* Hidden regardless of how it's triggered — one input, reused. */}
            <input
              ref={uploadRef}
              type="file"
              accept={ACCEPTED_UPLOADS}
              className="hidden"
              onChange={e => {
                const picked = e.target.files?.[0];
                if (picked) { setUploaded(picked); setFileId(UPLOADED_ID); }
                e.target.value = '';
              }}
            />
            <Button variant="secondary" icon={<Upload className="w-4 h-4" />} onClick={() => uploadRef.current?.click()}>
              Upload a file
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="tertiary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!canContinue} onClick={handleContinue}>Continue</Button>
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
export function AssessmentHeroUpdateDraftBanner({ customerId, update, changed, pendingCount, onViewSource, onDiscard, onPublish }: {
  customerId: string;
  update: ItemUpdate;
  /** How many sections/fields the update changed. */
  changed: number;
  /** How many of those still need accepting. */
  pendingCount: number;
  onViewSource: () => void;
  onDiscard: () => void;
  onPublish: () => void;
}) {
  const recording = update.recordingId ? resolveRecording(customerId, update.recordingId) : undefined;
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
              <>Updated from <strong>{update.sourceLabel}</strong>, recorded <strong>{recordedOn} at {recordedAt}</strong> by <strong>{recording.recordedBy}</strong></>
            ) : (
              <>Updated from the file <strong>{update.sourceLabel}</strong></>
            )}
            {' '}— only {changedWords} with new information {changed === 1 ? 'has' : 'have'} changed; everything else is as it was. Please review before accepting.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-purple-50 border-t border-purple-200 px-4 py-3">
        <button
          type="button"
          onClick={onViewSource}
          className="flex items-center gap-1 text-body font-medium text-[rgb(154,38,214)] hover:underline cursor-pointer"
        >
          {recording ? 'View recording' : 'View file'}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="tertiary">Discard draft</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard this draft?</AlertDialogTitle>
                <AlertDialogDescription>
                  The document goes back to how it was before it was updated from {update.sourceLabel}. Any changes
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
