import { createContext, useContext, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { MOCK_OFFICE, type OfficeDetails } from './officeMockData';

// Office-level tabs, matching the real tenant's tab bar (see the DOM sample
// supplied when the Tags/Details tabs were built). Only "Tags" and
// "Details" have real content — the rest still just placeholder. (Roster
// Settings is now built too: see RosterSettingsPage.)
// Each tab has its own URL (/office/<slug>) so it can be linked to directly.
export const OFFICE_TABS = [
  { id: 'details', label: 'Details', slug: 'details' },
  { id: 'checklists', label: 'Checklists', slug: 'checklists' },
  { id: 'documents', label: 'Documents', slug: 'documents' },
  { id: 'files', label: 'Files', slug: 'files' },
  { id: 'groups', label: 'Care Groups', slug: 'care-groups' },
  { id: 'tags', label: 'Tags', slug: 'tags' },
  { id: 'roster', label: 'Roster Settings', slug: 'roster-settings' },
  { id: 'settings', label: 'Settings and Permissions', slug: 'settings-and-permissions' },
];

export const officeTabPath = (id: string) => `/office/${OFFICE_TABS.find(t => t.id === id)?.slug ?? 'tags'}`;

interface OfficeContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  office: OfficeDetails;
  updateOffice: <K extends keyof OfficeDetails>(key: K, value: OfficeDetails[K]) => void;
  justSaved: boolean;
  handleSave: () => void;
}

const OfficeContext = createContext<OfficeContextType | null>(null);

/**
 * Lets the pinned OfficeSubnav (tabs + Save button, mounted via AppShell's
 * infoBar) and the page content underneath (TagsManagementPage /
 * OfficeDetailsPage) share the same tab and edit state, rather than the
 * subnav owning tabs and the page owning the form independently — same
 * shape as CareManagementContext/CarePlanDocumentProvider elsewhere in the
 * app, since this is the same "pinned top CTA row drives page content"
 * pattern.
 */
export function OfficeProvider({ children }: { children: React.ReactNode }) {
  // The active tab lives in the URL (/office/:tab), so every tab is linkable
  // and the browser back button steps between them.
  const { tab: tabSlug } = useParams();
  const navigate = useNavigate();
  const activeTab = OFFICE_TABS.find(t => t.slug === tabSlug)?.id ?? 'tags';
  const setActiveTab = (id: string) => navigate(officeTabPath(id));
  const [office, setOffice] = useState<OfficeDetails>(MOCK_OFFICE);
  const [justSaved, setJustSaved] = useState(false);

  const updateOffice = <K extends keyof OfficeDetails>(key: K, value: OfficeDetails[K]) => {
    setOffice(prev => ({ ...prev, [key]: value }));
    setJustSaved(false);
  };

  const handleSave = () => {
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 2500);
  };

  return (
    <OfficeContext.Provider value={{ activeTab, setActiveTab, office, updateOffice, justSaved, handleSave }}>
      {children}
    </OfficeContext.Provider>
  );
}

export function useOffice(): OfficeContextType {
  const ctx = useContext(OfficeContext);
  if (!ctx) throw new Error('useOffice must be used within OfficeProvider');
  return ctx;
}
