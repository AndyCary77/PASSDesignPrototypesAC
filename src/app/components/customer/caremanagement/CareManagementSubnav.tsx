import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '../../buttons/Button';
import { useCareManagement } from './CareManagementContext';
import { useScrolled } from '../../../hooks/useScrolled';

type Tab = 'outcomes' | 'tasks' | 'visits' | 'caregroups';

const TABS: { id: Tab; label: string }[] = [
  { id: 'outcomes',   label: 'Outcomes' },
  { id: 'tasks',      label: 'Tasks' },
  { id: 'visits',     label: 'Visits' },
  { id: 'caregroups', label: 'Care Groups' },
];

export function CareManagementSubnav() {
  const { activeTab, setActiveTab, backFn } = useCareManagement();
  const scrolled = useScrolled();

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className={`max-w-[1600px] w-full mx-auto px-4 flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3.5'}`}>
        {/* Left — back button in detail view, review date in list view */}
        <div className="flex items-center gap-3 min-w-[180px]">
          {backFn ? (
            <Button variant="tertiary" icon={<ArrowLeft className="w-4 h-4" />} onClick={backFn.fn}>
              Back to list
            </Button>
          ) : (
            <>
              <span className="text-xs text-gray-500 whitespace-nowrap">Next review:</span>
              <span
                className="px-2.5 py-1 text-xs font-bold text-white whitespace-nowrap"
                style={{ backgroundColor: '#d4183d', borderRadius: '6px' }}
              >
                26-03-2026
              </span>
            </>
          )}
        </div>

        {/* Centre — tabs */}
        <nav className="flex gap-6">
          {TABS.map(({ id, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative pb-2 px-1 text-sm transition-colors cursor-pointer whitespace-nowrap ${
                  isActive ? 'text-gray-900 font-semibold' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgb(154,38,214)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right — actions */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none whitespace-nowrap">
            <input type="checkbox" defaultChecked className="rounded border-gray-300 accent-[rgb(154,38,214)]" />
            Hide inactive
          </label>
          <Button variant="tertiary" icon={<Printer className="w-4 h-4" />}>Print</Button>
          <Button>Save</Button>
        </div>
      </div>
    </div>
  );
}
