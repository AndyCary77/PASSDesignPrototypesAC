export interface SubnavTab {
  id: string;
  label: string;
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
      {tabs.map(({ id, label }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`relative pb-2 px-1 text-sm transition-colors cursor-pointer whitespace-nowrap ${
              isActive ? 'text-gray-900 font-semibold' : 'text-gray-500 font-medium hover:text-gray-700'
            }`}
          >
            {label}
            {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgb(154,38,214)]" />}
          </button>
        );
      })}
    </nav>
  );
}
