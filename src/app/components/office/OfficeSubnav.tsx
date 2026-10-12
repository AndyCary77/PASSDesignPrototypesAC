import { Check } from 'lucide-react';
import { Button } from '../buttons/Button';
import { SubnavTabs } from '../tabs/SubnavTabs';
import { useScrolled } from '../../hooks/useScrolled';
import { useOffice, OFFICE_TABS } from './OfficeContext';

/**
 * Pinned sub-nav — same sticky treatment as CareManagementSubnav/
 * CarePlanDocumentSubnav: lives in AppShell's infoBar, so it scrolls with
 * the top bar instead of away with the page content. Save sits here as a
 * pinned top CTA, rather than at the bottom of the Details form, matching
 * how every other editable page in the app (Care Management, Care Plan
 * document, etc.) surfaces its primary save action.
 */
export function OfficeSubnav() {
  const { activeTab, setActiveTab, justSaved, handleSave } = useOffice();
  const scrolled = useScrolled();

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className={`max-w-6xl w-full mx-auto flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3.5'}`}>
        {/* Left — empty spacer, kept so the tabs stay centred against the
            Save button's slot on the right rather than drifting off-centre. */}
        <div className="min-w-[120px]" />


        {/* Centre — tabs */}
        <SubnavTabs tabs={OFFICE_TABS} activeTab={activeTab} onChange={setActiveTab} />

        {/* Right — Details has a page-level Save. Settings and Permissions saves
            card by card through each card's own slide-out, so it only echoes
            the "Saved" confirmation here. */}
        <div className="flex items-center gap-3 min-w-[120px] justify-end">
          {(activeTab === 'details' || activeTab === 'settings') && justSaved && (
            <span className="flex items-center gap-1.5 text-sm text-green-700 whitespace-nowrap">
              <Check className="w-4 h-4" /> Saved
            </span>
          )}
          {activeTab === 'details' && <Button onClick={handleSave}>Save</Button>}
        </div>
      </div>
    </div>
  );
}
