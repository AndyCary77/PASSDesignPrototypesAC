import { useId, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, ChevronDown, ChevronUp, Flag } from 'lucide-react';
import { useCustomer } from '../../data/CustomerContext';
import { canSeeRafDetail, useRafAccess } from '../../data/RafAccessContext';
import { activeItems, formatRafDate } from '../../data/reasonableAdjustments';
import { Button } from '../buttons/Button';
import { RafItemDetails } from './RafItemDetails';

/**
 * Where the care plan is created (Care Management: Outcomes, Tasks, Visits, and the Assessment Hero draft flow),
 * this says the customer has a Reasonable Adjustment Flag, so whoever is writing the plan takes it into account.
 *
 *  - Someone who can see detail gets a collapsed note with the adjustments one click away (adjustments only, as on
 *    the visit panel's Customer Details tab; impairments and conditions stay on the tab), plus a link to the tab.
 *  - An internal admin only learns that a flag is recorded. No adjustments, no link, as everywhere else detail is hidden.
 *  - Nothing shows when there is no flag. Read-only: it reads PASS's own copy, it doesn't call the national flag.
 *
 * Which of these places should show detail rather than just the flag is still an open question from the call on the open questions;
 * this is the "adjustments only" answer, so it can be reviewed.
 */
export function ReasonableAdjustmentsCarePlanNote() {
  const customer = useCustomer();
  const { level, getFlagRecord } = useRafAccess();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const record = getFlagRecord(customer.id);
  if (!record) return null;

  const first = customer.fullName.replace(/^(Mr|Mrs|Ms|Miss|Dr)\s+/i, '').split(' ')[0];
  const showDetail = canSeeRafDetail(level);
  const adjustments = activeItems(record, 'adjustment');

  return (
    <section aria-label="Reasonable Adjustments" className="mb-4 bg-white rounded-[10px] border border-purple-200 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3 bg-purple-50">
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center flex-shrink-0">
            <Flag className="w-4 h-4 text-purple-900" fill="currentColor" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-semibold text-purple-900">{first} has a Reasonable Adjustment Flag</p>
            <p className="text-body text-purple-800">
              {showDetail
                ? 'Take these adjustments into account when writing or reviewing the care plan.'
                : 'A Reasonable Adjustment Flag is recorded. Admin users can’t see the details.'}
            </p>
          </div>
        </div>
        {showDetail && (
          <Button
            variant="secondary"
            size="sm"
            aria-expanded={open}
            aria-controls={panelId}
            icon={open ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
            onClick={() => setOpen(o => !o)}
          >
            {open ? 'Hide adjustments' : `Show adjustments (${adjustments.length})`}
          </Button>
        )}
      </div>

      {showDetail && open && (
        <div id={panelId} className="border-t border-purple-200">
          {adjustments.length === 0 ? (
            <p className="px-5 py-4 text-body text-gray-700">No reasonable adjustments have been recorded.</p>
          ) : (
            // Capped and scrollable so a long list (Arthur has 8) doesn't push the care plan itself off the screen.
            <ul
              className="divide-y divide-gray-200 max-h-[22rem] overflow-y-auto"
              tabIndex={0}
              aria-label={`${adjustments.length} reasonable adjustments`}
            >
              {adjustments.map(item => (
                <li key={item.id} className="px-5 py-4">
                  <RafItemDetails item={item} />
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Last updated on: {formatRafDate(record.lastUpdatedOn)}. Shown from PASS’s record; the Reasonable Adjustments tab checks the national flag.
            </p>
            <Link
              to={`/customers/${customer.id}/reasonableadjustments`}
              className="text-body text-[rgb(154,38,214)] hover:underline flex items-center gap-1"
            >
              Open Reasonable Adjustments <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
