import type { ComponentType } from 'react';

export interface SectionNavItem {
  id: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}

/**
 * Left-hand section menu that sticks beneath a pinned page header. Used by
 * Employee Contract and Roster Settings: both are long single pages made of
 * stacked sections, with this as the jump list. `top` is the sticky offset —
 * callers work it out from the info-bar plus their own pinned title row.
 */
export function SectionNav({
  items,
  activeId,
  onSelect,
  top,
  ariaLabel = 'Sections',
}: {
  items: SectionNavItem[];
  activeId: string;
  onSelect?: (id: string) => void;
  top: number;
  ariaLabel?: string;
}) {
  return (
    <nav aria-label={ariaLabel} className="w-60 flex-shrink-0 sticky" style={{ top }}>
      <ul className="space-y-1">
        {items.map(({ id, label, Icon }) => {
          const isActive = activeId === id;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={(e) => {
                  // Glide to the section rather than jumping. The section's own
                  // scroll-margin-top keeps it clear of the pinned header.
                  const target = document.getElementById(id);
                  if (target) {
                    e.preventDefault();
                    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
                  }
                  // Keep the address bar pointing at this section so the URL can be
                  // copied and shared (replaceState: no history entry per click).
                  window.history.replaceState(window.history.state, '', `#${id}`);
                  onSelect?.(id);
                }}
                aria-current={isActive ? 'true' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-colors ${
                  isActive ? 'bg-purple-100 text-[rgb(154,38,214)]' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
