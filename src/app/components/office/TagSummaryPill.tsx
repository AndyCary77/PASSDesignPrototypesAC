import type { TagSummary } from './tagsMockData';

/** Matches prod's `tag-summary-pill` — a coloured chip with a name + optional usage count. */
export function TagSummaryPill({ tag }: { tag: TagSummary }) {
  if (!tag.colour) {
    return (
      <span className="inline-flex max-w-full items-center gap-1.5 px-3 py-1 rounded-2xl text-sm text-left border border-gray-400 bg-gray-50 text-gray-700">
        <span className="min-w-0 break-words font-medium">{tag.name}</span>
        {/* `font-normal` first so the class list doesn't start with a bare "text-*"
            token — Tailwind's base-typography reset in globals.css treats that as
            "no Tailwind text class present" and force-resets sibling spans to 16px. */}
        {tag.count !== undefined && <span className="font-normal text-gray-500">{tag.count}</span>}
      </span>
    );
  }
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 px-3 py-1 rounded-2xl text-sm text-left border"
      style={{ backgroundColor: tag.colour.bg, color: tag.colour.text, borderColor: tag.colour.border }}
    >
      <span className="min-w-0 break-words font-medium">{tag.name}</span>
      {tag.count !== undefined && <span className="font-normal opacity-80">{tag.count}</span>}
    </span>
  );
}
