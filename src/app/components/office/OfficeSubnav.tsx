import { Check } from 'lucide-react';
import { Button } from '../buttons/Button';
import { SubnavTabs } from '../tabs/SubnavTabs';
import { useScrolled } from '../../hooks/useScrolled';
import { useOffice, OFFICE_TABS } from './OfficeContext';
import { useFeatureFlag } from '../../data/FeatureFlagsContext';

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
  // Assessment Hero's tab is for managers (and offices that have it): it isn't offered otherwise.
  const canViewHero = useFeatureFlag('canViewOfficeAssessmentHero');
  const tabs = canViewHero ? OFFICE_TABS : OFFICE_TABS.filter(t => t.id !== 'hero');

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      {/* Three columns with equal outer tracks, so the tabs sit in the true centre of the page
          whatever the right-hand slot holds (nothing, "Saved" or the Save button). Wide enough
          for all the tabs plus the Save button's room either side. */}
      <div className={`max-w-7xl w-full mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3.5'}`}>
        {/* Left — empty, balances the Save button's slot on the right. */}
        <div />


        {/* Centre — tabs */}
        <SubnavTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Right — Details has a page-level Save. Settings and Permissions saves
            card by card through each card's own slide-out, so it only echoes
            the "Saved" confirmation here. */}
        <div className="flex items-center gap-3 justify-end">
          {(activeTab === 'details' || activeTab === 'settings') && justSaved && (
            <span className="flex items-center gap-1.5 text-body text-green-700 whitespace-nowrap">
              <Check className="w-4 h-4" /> Saved
            </span>
          )}
          {activeTab === 'details' && <Button onClick={handleSave}>Save</Button>}
        </div>
      </div>
    </div>
  );
}
