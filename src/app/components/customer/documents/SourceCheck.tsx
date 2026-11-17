import { useNavigate } from 'react-router';
import { AlertTriangle, File as FileIcon, FileX, Mic, Scale, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { FILE_UNAVAILABLE, useDeletedFileIds } from '../../../data/fileStore';
import {
  formatSourceDate, isDateKnown,
  type ConflictValue, type FieldConflict, type Removal, type SourceExtract, type SourceRef,
} from './sourceMerge';

// The review-side pieces for drafts built from files, and from more than one source (AIOP-24513, AIOP-25366):
//  • Check source — the passage a field or section came from, with where in the file, and a way to open it.
//  • The disagreement panel — when sources differ on a field: what was suggested and why, every other value with
//    its source and date, and a way to switch to one of them.
//  • The removal note — when a newer source shows something an earlier one said is no longer right.

const LINK = 'inline-flex items-center gap-1 text-body font-medium text-[rgb(154,38,214)] hover:underline cursor-pointer';

const hrefFor = (customerId: string, s: SourceRef) =>
  s.type === 'recording' ? `/customers/${customerId}/documents/recording/${s.id}` : `/customers/${customerId}/documents?tab=files`;

/** "5 Nov 2026", or "date to check" when the source's date is missing or uncertain. */
function DateLabel({ date, uncertain }: { date?: string; uncertain?: boolean }) {
  return isDateKnown({ date, dateUncertain: uncertain })
    ? <>{formatSourceDate(date)}</>
    : <span className="font-semibold text-amber-800">date to check</span>;
}

/** "Check source" — what each source said about this field or section, with where to find it. */
export function SourceExtractPopover({ customerId, fieldLabel, extracts, children }: {
  customerId: string;
  fieldLabel: string;
  extracts: SourceExtract[];
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const deleted = useDeletedFileIds(customerId);
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side="bottom" align="end" sideOffset={8} className="w-[26rem] max-w-[calc(100vw-2rem)] max-h-[380px] flex flex-col p-0">
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <p className="text-body font-semibold text-gray-900">Check source</p>
          <p className="text-body text-gray-600">Where "{fieldLabel}" was drafted from.</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
          {extracts.map((x, i) => {
            // A deleted file keeps the passage it was drafted from (so the reviewer can still check it), but can't be opened.
            const gone = x.source.type === 'file' && deleted.has(x.source.id);
            const Icon = gone ? FileX : x.source.type === 'file' ? FileIcon : Mic;
            return (
              <div key={i}>
                <p className="flex items-center gap-1.5 text-body font-semibold text-gray-900 min-w-0">
                  <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">{gone ? FILE_UNAVAILABLE : x.source.label}</span>
                </p>
                <p className="text-body text-gray-600 mt-0.5">
                  {x.location && <>{x.location} · </>}<DateLabel date={x.date} uncertain={x.dateUncertain} />
                </p>
                <blockquote className="mt-1.5 rounded-lg ring-1 ring-amber-300 bg-white px-3 py-2 text-body text-gray-800 leading-relaxed">
                  &ldquo;{x.text}&rdquo;
                </blockquote>
                {gone ? (
                  <p className="mt-1.5 text-body font-medium text-gray-700">{FILE_UNAVAILABLE}</p>
                ) : (
                  <button type="button" onClick={() => navigate(hrefFor(customerId, x.source))} className={`${LINK} mt-1.5`}>
                    {x.source.type === 'file' ? 'Open file' : 'Open recording'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** The "Check source" button itself, styled like its "Check transcript" sibling. */
export const checkSourceButtonClass = 'inline-flex items-center gap-1 text-body font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer';
export const CheckSourceLabel = () => <><Search className="w-3.5 h-3.5" /> Check source</>;

function ValueLine({ v, customerId }: { v: ConflictValue; customerId: string }) {
  const deleted = useDeletedFileIds(customerId);
  const gone = v.type === 'file' && deleted.has(v.id);
  return (
    <span className="min-w-0 flex flex-col break-words">
      <strong className="line-clamp-3">{v.text}</strong>
      <span className="text-gray-700">{gone ? FILE_UNAVAILABLE : v.label} · <DateLabel date={v.date} uncertain={v.dateUncertain} />{v.legal ? ' · legal document' : ''}</span>
    </span>
  );
}

/** Shown under a field whose sources disagree. */
export function ConflictPanel({ customerId, conflict, onChoose }: { customerId: string; conflict: FieldConflict; onChoose: (v: ConflictValue) => void }) {
  const { resolution, chosen, others, chosenByReviewer } = conflict;
  const headline = chosenByReviewer && chosen
    ? 'You chose a value. The sources disagreed:'
    : resolution === 'legal'
      ? 'Keeping the legal document’s answer — a newer source disagrees:'
      : resolution === 'undated'
        ? 'Assessment Hero can’t tell which source is more recent, so it hasn’t suggested a value. Choose one:'
        : 'Sources disagree — suggesting the most recent:';

  return (
    <div role="group" aria-label="Sources disagree" className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-body font-semibold text-amber-900">
        {resolution === 'legal' ? <Scale className="w-4 h-4" aria-hidden="true" /> : <AlertTriangle className="w-4 h-4" aria-hidden="true" />}
        {headline}
      </p>
      <ul className="mt-1.5 flex flex-col gap-1.5">
        {chosen && (
          <li className="flex items-start gap-2 text-body text-gray-900">
            <span className="mt-0.5 inline-flex items-center rounded-full bg-amber-200 px-2 text-sm font-semibold text-amber-900 flex-shrink-0">
              {chosenByReviewer ? 'Chosen' : 'Suggested'}
            </span>
            <ValueLine v={chosen} customerId={customerId} />
          </li>
        )}
        {others.map((v, i) => (
          <li key={i} className="flex items-start justify-between gap-3 text-body text-gray-900">
            <span className="flex items-start gap-2 min-w-0">
              <span className="mt-0.5 inline-flex items-center rounded-full bg-white border border-amber-300 px-2 text-sm font-semibold text-amber-900 flex-shrink-0">Also found</span>
              <ValueLine v={v} customerId={customerId} />
            </span>
            <button type="button" onClick={() => onChoose(v)} className={`${LINK} flex-shrink-0`}>Use this value</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Shown under a section when a newer source took something out of it. */
export function RemovalNote({ removal }: { removal: Removal }) {
  return (
    <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-body text-gray-900">
      <p className="flex items-center gap-1.5 font-semibold text-amber-900">
        <AlertTriangle className="w-4 h-4" aria-hidden="true" /> Something was taken out
      </p>
      <p className="mt-1 break-words">
        Removed: <strong>&ldquo;{removal.removed}&rdquo;</strong>
        {removal.earlier && <> — it came from {removal.earlier.label} ({formatSourceDate(removal.earlierDate)}).</>}
      </p>
      <p className="mt-0.5 break-words">
        {removal.because.label} ({formatSourceDate(removal.becauseDate)}) says {removal.reason}. Use Discard to put it back.
      </p>
    </div>
  );
}
