import { Button } from './Button';

// How many page numbers show at once either side of the current one.
const PAGE_WINDOW = 2;

// A window of page numbers around the current page, so a long list doesn't produce a long row of buttons.
function pageNumbers(current: number, total: number) {
  const start = Math.max(1, Math.min(current - PAGE_WINDOW, total - PAGE_WINDOW * 2));
  const end = Math.min(total, start + PAGE_WINDOW * 2);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * The docked footer under a table: "Showing 1–20 of 72" on the left and First / 1 2 3 / Last
 * centred (a three-column grid, so it stays centred whatever the width of the left text).
 * Extracted from the Enquiries table; the tag screens use it too.
 */
export function PaginationBar({ page, pageCount, from, to, total, onPage }: {
  page: number;
  pageCount: number;
  /** 1-based index of the first and last row shown. */
  from: number;
  to: number;
  total: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 p-3 border-t border-gray-200">
      <span aria-live="polite" className="text-body text-gray-600">
        Showing {from}–{to} of {total}
      </span>
      <nav aria-label="Pagination" className="flex items-center gap-1.5">
        <Button variant="tertiary" size="sm" disabled={page === 1} onClick={() => onPage(1)}>First</Button>
        {pageNumbers(page, pageCount).map(n => (
          <Button
            key={n}
            variant={n === page ? 'primary' : 'tertiary'}
            size="sm"
            iconOnly
            aria-label={`Page ${n}`}
            aria-current={n === page ? 'page' : undefined}
            onClick={() => onPage(n)}
          >
            {n}
          </Button>
        ))}
        <Button variant="tertiary" size="sm" disabled={page === pageCount} onClick={() => onPage(pageCount)}>Last</Button>
      </nav>
      {/* Empty third column keeps the pagination centred. */}
      <span aria-hidden="true" />
    </div>
  );
}
