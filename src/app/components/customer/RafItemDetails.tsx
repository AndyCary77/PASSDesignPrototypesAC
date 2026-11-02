import { Globe } from 'lucide-react';
import { Tag } from '../ui/tag';
import { categoryName, formatRafDate, type RafItem } from '../../data/reasonableAdjustments';

/**
 * One adjustment, impairment or condition as it is shown wherever a flag's content appears: the display text
 * exactly as recorded, its category, any free text, and the "Added: dd-Mmm-yyyy by name at organisation" line
 * (marked with a globe when it came from the national flag). Shared so every surface shows items the same way.
 */
export function RafItemDetails({ item }: { item: RafItem }) {
  return (
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
  );
}
