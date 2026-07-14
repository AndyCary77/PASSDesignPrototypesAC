interface DocumentTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function DocumentTabs({ activeTab, onTabChange }: DocumentTabsProps) {
  const tabs = [
    { id: 'enquiry', label: 'Enquiry' },
    { id: 'assessments', label: 'Assessments' },
    { id: 'documents', label: 'Documents' },
    { id: 'files', label: 'Files' },
  ];

  return (
    <div className="flex justify-center items-center gap-8">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`pb-2 px-2 transition-colors relative text-sm ${
              isActive ? 'text-gray-900 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800" />
            )}
          </button>
        );
      })}
    </div>
  );
}
