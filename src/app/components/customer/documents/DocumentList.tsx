import React from 'react';
import { Link } from 'react-router';
import { Check, Minus, ChevronRight, AlertCircle, CalendarX, PenLine, FileText } from 'lucide-react';
import { Document } from '../../../data/mock-documents';

interface DocumentListProps {
  documents: Document[];
}

// "Incomplete" just means not started/finished yet, not a problem — a soft
// tint of the requested #e97b35 orange (light tint for the pill bg, a
// darkened shade of the same hue for readable text) rather than red, so it
// doesn't read as alarming.
const STATUS_CONFIG: Record<Document['status'], { Icon: typeof Check; circleBg: string; label: string; pill: string }> = {
  success: { Icon: Check, circleBg: 'bg-[rgb(33,166,33)]', label: 'Complete', pill: 'bg-[rgb(212,240,212)] text-[rgb(21,125,21)]' },
  danger: { Icon: Minus, circleBg: 'bg-[#e97b35]', label: 'Incomplete', pill: 'bg-[#fdf2eb] text-[#975022]' },
  warning: { Icon: CalendarX, circleBg: 'bg-amber-500', label: 'Review required', pill: 'bg-amber-100 text-amber-700' },
  draft: { Icon: PenLine, circleBg: 'bg-[rgb(154,38,214)]', label: 'Draft', pill: 'bg-purple-100 text-[rgb(109,27,152)]' },
};

export function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-lg font-medium">No documents found</p>
        <p className="text-body">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {documents.map((doc) => {
        // Grid, not flex — each row is its own independent grid (it has to be,
        // since the whole row is one clickable Link), so an `auto` title track
        // sizes to THAT row's own title and the badge column starts at a
        // different x per row — "staggered". A fixed width for the title
        // column instead means every row shares the exact same track sizes,
        // so the badge column lines up at one constant x down the whole list
        // — close to the titles rather than off at the far right, but still
        // a true column.
        const rowClassName =
          'group grid grid-cols-[22rem_auto_1fr_auto_20px] items-center gap-6 px-4 h-24 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-[#5c1c85] border-b !border-b-gray-200 last:border-b-0';

        const { Icon, circleBg, label, pill } = STATUS_CONFIG[doc.status];

        const content = (
          <>
            {/* Title + subtitle */}
            <div className="flex items-start gap-2.5 min-w-0">
              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col min-w-0">
                <span className="text-gray-900 font-bold text-base leading-snug truncate">
                  {doc.title}
                </span>
                {doc.subtitle && (
                  <span className="text-gray-500 text-sm italic mt-0.5 truncate">
                    {doc.subtitle}
                  </span>
                )}
              </div>
            </div>

            {/* Status column — sits right after the title now, not off in the middle of the row. */}
            <span className={`inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full text-xs font-semibold uppercase whitespace-nowrap w-fit ${pill}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${circleBg}`}>
                <Icon className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </span>
              {label}
            </span>

            {/* Flexible spacer — absorbs the leftover space so date(s) + chevron stay pinned right. */}
            <div />

            {/* Date(s) */}
            <div className="text-right hidden sm:block">
              {doc.reviewDate && (
                <div className="text-gray-500 text-sm">Review Date {doc.reviewDate}</div>
              )}
              <div className="text-gray-500 text-sm">Created Date {doc.createdDate}</div>
            </div>

            {/* Chevron */}
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#5c1c85] transition-colors" />
          </>
        );

        return doc.to ? (
          <Link key={doc.id} to={doc.to} className={rowClassName}>
            {content}
          </Link>
        ) : (
          <div key={doc.id} className={rowClassName}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
