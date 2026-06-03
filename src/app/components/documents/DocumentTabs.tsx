import React from 'react';
import { HelpCircle, FileText, Paperclip, ClipboardList } from 'lucide-react';

interface DocumentTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function DocumentTabs({ activeTab, onTabChange }: DocumentTabsProps) {
  const tabs = [
    { id: 'enquiry', label: 'Enquiry', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'assessments', label: 'Assessments', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
    { id: 'files', label: 'Files', icon: <Paperclip className="w-4 h-4" /> },
  ];

  return (
    <div className="flex items-center gap-8 border-b border-transparent">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex flex-col items-center gap-1 pb-2 px-2 min-w-[80px] transition-colors relative
              ${isActive ? 'text-gray-900 font-bold' : 'text-gray-400 hover:text-gray-600'}
            `}
          >
            <div className={`${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
              {tab.icon}
            </div>
            <span className="text-sm">{tab.label}</span>
            
            {/* Active Border */}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800" />
            )}
          </button>
        );
      })}
    </div>
  );
}
