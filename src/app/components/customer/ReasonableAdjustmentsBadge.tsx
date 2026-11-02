import { Link } from 'react-router';
import { Flag } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { badge as flagBadge } from './PeopleList';

/**
 * The "this customer has a Reasonable Adjustment Flag" badge: shows that a flag exists, never what's in it.
 * One definition for every place it appears, in the size each place already uses for its other badges:
 *  - 'header': the customer profile header (next to DNACPR / HIGH RISK)
 *  - 'card':   a card on the original Customers list (next to HIGH RISK)
 *  - 'flag':   the flags row on a card in the new Customers list
 *
 * Shortened to ADJUSTMENTS to keep it compact, with the full NHS term in the tooltip and for screen
 * readers. The NHS display rules say to use "Reasonable Adjustments" with no acronyms, and it hasn't been
 * confirmed that they allow a shortened badge, so this is a decision to settle internally.
 */
export const RA_BADGE_FULL_LABEL = 'Reasonable Adjustments flag recorded';

export type RaBadgeVariant = 'header' | 'card' | 'flag';

const CLASS: Record<RaBadgeVariant, string> = {
  header: 'bg-purple-100 text-purple-900 text-xs font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1',
  card: 'flex-shrink-0 bg-purple-100 text-purple-900 text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wide inline-flex items-center gap-1',
  flag: `${flagBadge} bg-purple-100 text-purple-900 border-purple-200`,
};

const ICON_SIZE: Record<RaBadgeVariant, number> = { header: 12, card: 12, flag: 16 };

export function ReasonableAdjustmentsBadge({ to, variant = 'header' }: { to?: string; variant?: RaBadgeVariant }) {
  const cls = CLASS[variant];
  const content = (
    <>
      <Flag size={ICON_SIZE[variant]} fill="currentColor" aria-hidden="true" />
      <span aria-hidden="true">ADJUSTMENTS</span>
    </>
  );
  // The shared Tooltip (white variant) shows straight away on hover or focus; the browser's own `title` tooltip waits about a second.
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {to ? (
          <Link to={to} className={`${cls} hover:bg-purple-200 transition-colors`} aria-label={`${RA_BADGE_FULL_LABEL}. Open the Reasonable Adjustments tab.`}>
            {content}
          </Link>
        ) : (
          <span className={cls}>
            {content}
            <span className="sr-only">{RA_BADGE_FULL_LABEL}</span>
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={6}
        className="bg-white text-gray-900 border border-gray-200 shadow-lg"
        arrowClassName="bg-white fill-white"
      >
        {RA_BADGE_FULL_LABEL}
      </TooltipContent>
    </Tooltip>
  );
}
