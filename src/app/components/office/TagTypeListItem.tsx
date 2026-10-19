import { Tag as TagIcon, UserRound, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { TagType } from './tagsMockData';
import { TagSummaryPill } from './TagSummaryPill';

interface TagTypeListItemProps {
  tagType: TagType;
  /** Rendered under the tag pill row — e.g. a Banner scoped to this one tag type. */
  footer?: ReactNode;
  /** If provided, the whole row links through to the tag type's detail page. */
  to?: string;
}

export function TagTypeListItem({ tagType, footer, to }: TagTypeListItemProps) {
  const appliesToLabel = tagType.appliesTo.join(' & ');

  const row = (
    <div className="flex items-start gap-4">
      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
        <TagIcon className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-base font-semibold text-gray-900">{tagType.name}</h4>
          {tagType.limitOnePerTag && (
            <span title="Limit one tag per person"><UserRound className="w-3.5 h-3.5 text-gray-400" /></span>
          )}
        </div>
        <p className="text-body text-gray-500 mb-3">
          {appliesToLabel} — {tagType.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {tagType.tags.map(tag => <TagSummaryPill key={tag.id} tag={tag} />)}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 self-center" />
    </div>
  );

  return (
    <li className="relative hover:bg-gray-50 hover:shadow-md hover:z-10 transition-all">
      {to ? <Link to={to} className="block p-5">{row}</Link> : <div className="p-5">{row}</div>}
      {footer && <div className="px-5 pb-5">{footer}</div>}
    </li>
  );
}
