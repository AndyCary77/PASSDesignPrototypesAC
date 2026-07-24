import { SubnavTabs } from '../../tabs/SubnavTabs';

interface DocumentTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: 'enquiry', label: 'Enquiry' },
  { id: 'assessments', label: 'Assessments' },
  { id: 'documents', label: 'Documents' },
  { id: 'files', label: 'Files' },
];

export function DocumentTabs({ activeTab, onTabChange }: DocumentTabsProps) {
  return (
    <SubnavTabs tabs={TABS} activeTab={activeTab} onChange={onTabChange} className="flex justify-center items-center gap-8" />
  );
}
