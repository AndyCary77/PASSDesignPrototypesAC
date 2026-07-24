import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '../../buttons/Button';
import { SubnavTabs } from '../../tabs/SubnavTabs';
import { useCareManagement } from './CareManagementContext';
import { useScrolled } from '../../../hooks/useScrolled';
import { useCustomer } from '../../../data/CustomerContext';

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
  const customer = useCustomer();

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className={`max-w-5xl w-full mx-auto flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3.5'}`}>
        {/* Left — back button in detail view, review date in list view */}
        <div className="flex items-center gap-3 min-w-[180px]">
          {backFn ? (
            <Button variant="tertiary" icon={<ArrowLeft className="w-4 h-4" />} onClick={backFn.fn}>
              Back to list
            </Button>
          ) : customer.hasCarePlan ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-500 whitespace-nowrap">Next review</span>
              <span
                className="px-2.5 py-1 text-xs font-bold text-white whitespace-nowrap w-fit"
                style={{ backgroundColor: '#d4183d', borderRadius: '6px' }}
              >
                26-03-2026
              </span>
            </div>
          ) : null}
        </div>

        {/* Centre — tabs */}
        <SubnavTabs tabs={TABS} activeTab={activeTab} onChange={id => setActiveTab(id as Tab)} />

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
