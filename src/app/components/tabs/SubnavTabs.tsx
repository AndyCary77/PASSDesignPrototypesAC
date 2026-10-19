export interface SubnavTab {
  id: string;
  label: string;
  /** Small count bubble after the label (e.g. unread/new items) — omitted or 0 shows nothing. */
  badge?: number;
}

interface SubnavTabsProps {
  tabs: SubnavTab[];
  activeTab: string;
  onChange: (id: string) => void;
  /** Override the default left-aligned gap-6 layout (e.g. to centre tabs) */
  className?: string;
}

export function SubnavTabs({ tabs, activeTab, onChange, className = 'flex gap-6' }: SubnavTabsProps) {
  return (
    <nav className={className}>
      {tabs.map(({ id, label, badge }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`relative inline-flex items-center gap-1.5 pb-2 px-1 text-body transition-colors cursor-pointer whitespace-nowrap ${
              isActive ? 'text-gray-900 font-semibold' : 'text-gray-500 font-medium hover:text-gray-700'
            }`}
          >
            {label}
            {!!badge && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-[rgb(154,38,214)] text-white text-[11px] font-semibold">
                {badge}
              </span>
            )}
            {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgb(154,38,214)]" />}
          </button>
        );
      })}
    </nav>
  );
}
