import { useState } from 'react';
import { FileText, Copy, FileSignature } from 'lucide-react';
import { EmployeeContractScreen } from './EmployeeContractScreen';

const SUB_TABS = [
  { id: 'documents', label: 'Documents', Icon: FileText },
  { id: 'files', label: 'Files', Icon: Copy },
  { id: 'contract', label: 'Contract', Icon: FileSignature },
];

export function EmployeeRecordsPage() {
  const [activeTab, setActiveTab] = useState('contract');

  return (
    <div>
      {/* Secondary nav */}
      <div className="border-b border-gray-200 mb-6">
        <ul className="flex justify-center gap-2">
          {SUB_TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <li key={id}>
                <button
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'text-[rgb(154,38,214)] border-[rgb(154,38,214)]'
                      : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Tab content (sits on the grey page background) */}
      {activeTab === 'contract' ? (
        <EmployeeContractScreen />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-sm italic text-gray-400">
          {activeTab === 'documents' ? 'Documents' : 'Files'} not shown in this prototype.
        </div>
      )}
    </div>
  );
}
