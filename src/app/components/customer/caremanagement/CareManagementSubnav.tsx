import { ArrowLeft, Plus, Printer } from 'lucide-react';
import { Button } from '../../buttons/Button';
import { SubnavTabs } from '../../tabs/SubnavTabs';
import { DeleteButton } from './shared';
import { useCareManagement } from './CareManagementContext';
import { useCareData } from './useCareData';
import { useScrolled } from '../../../hooks/useScrolled';

type Tab = 'outcomes' | 'tasks' | 'visits' | 'caregroups';

export function CareManagementSubnav() {
  const { activeTab, setActiveTab, backFn, addFn, deleteFn, dirty, setDirty, planPublished } = useCareManagement();
  const { pending } = useCareData();
  const scrolled = useScrolled();

  // Counts of CareBridge-drafted items still awaiting review, so the work is
  // findable from whichever tab you're on. SubnavTabs hides a zero badge.
  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'outcomes',   label: 'Outcomes',   badge: pending.outcomes },
    { id: 'tasks',      label: 'Tasks',      badge: pending.tasks },
    { id: 'visits',     label: 'Visits' },
    { id: 'caregroups', label: 'Care Groups' },
  ];

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-5xl w-full mx-auto">
        {/* Row 1 — Back/review date + actions. Kept separate from the tabs
            row below (same reasoning as CarePlanDocumentSubnav): actions of
            varying width — Add Outcome/Add Task included, via addFn below —
            would otherwise crowd the tabs and throw off how they centre. */}
        <div className={`flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3.5'}`}>
          <div className="flex items-center gap-3 min-w-[180px]">
            {backFn ? (
              <Button variant="tertiary" icon={<ArrowLeft className="w-4 h-4" />} onClick={backFn.fn}>
                Back to list
              </Button>
            ) : planPublished ? (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-500 whitespace-nowrap">Next review</span>
                <span
                  className="px-2.5 py-1 text-xs font-bold text-white whitespace-nowrap w-fit"
                  style={{ backgroundColor: '#d4183d', borderRadius: '6px' }}
                >
                  26-03-2026
                </span>
              </div>
            ) : (
              // Not published yet — whether or not anything's still pending
              // review, it isn't a real plan until Publish is clicked. Same
              // slot the saved-plan review date sits in, amber to match the
              // Draft badge used on the drafted cards.
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-500 whitespace-nowrap">Care plan</span>
                <span className="px-2.5 py-1 text-xs font-bold uppercase text-amber-800 whitespace-nowrap w-fit rounded-md border border-amber-300 bg-amber-100">
                  Draft
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {deleteFn ? (
              // Detail view: the only destructive action available, standing
              // alone rather than mixed in with Print/Save.
              <DeleteButton onDelete={deleteFn.fn} itemLabel={deleteFn.label} />
            ) : (
              <>
                <Button variant="tertiary" icon={<Printer className="w-4 h-4" />}>Print</Button>
                {/* "Update" once the plan's been published (a real plan to
                    modify), "Save Draft" while it's still a CareBridge draft
                    (e.g. Edith/Vera, pre-Publish) — same distinction as
                    CarePlanDocumentSubnav's Save/Save Draft. Disabled until
                    something's actually changed. */}
                <Button disabled={!dirty} onClick={() => setDirty(false)}>
                  {planPublished ? 'Update' : 'Save Draft'}
                </Button>
                {addFn && (
                  <Button icon={<Plus className="w-4 h-4" />} onClick={addFn.fn}>
                    {addFn.label}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Row 2 — tabs + Hide inactive. Equal 1fr flanks keep the tabs
            genuinely centred regardless of the checkbox's width, rather than
            just centred between two arbitrary side widths. */}
        <div className={`border-t border-gray-200 grid grid-cols-[1fr_auto_1fr] items-center gap-4 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3'}`}>
          <div />
          <SubnavTabs
            tabs={TABS}
            activeTab={activeTab}
            onChange={id => setActiveTab(id as Tab)}
            className="flex justify-center items-center gap-8"
          />
          <label className="flex items-center justify-end gap-2 text-body text-gray-600 cursor-pointer select-none whitespace-nowrap">
            <input type="checkbox" defaultChecked className="rounded border-gray-300 accent-[rgb(154,38,214)]" />
            Hide inactive
          </label>
        </div>
      </div>
    </div>
  );
}
