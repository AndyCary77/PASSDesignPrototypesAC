import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { FolderPlus, Plus } from 'lucide-react';
import assessmentHeroIconUrl from '../../icons/assessment-hero.svg';
import { CUSTOMER_DOCUMENTS, ASSESSMENT_TEMPLATES } from '../../../data/mock-documents';
import { useCustomer } from '../../../data/CustomerContext';
import { Button } from '../../buttons/Button';
import { TabEmptyState } from '../TabEmptyState';
import { DocumentTabs } from './DocumentTabs';
import { DocumentFilters } from './DocumentFilters';
import { DocumentList } from './DocumentList';
import { CareBridgeRecordingsTab } from './CareBridgeRecordingsTab';

export function DocumentsPage() {
  const customer = useCustomer();
  // Lets a click-through page (e.g. the Care Plan document) send the user
  // back to whichever tab it lives in, via ?tab=assessments — read once on
  // mount, same as any other "initial tab" deep link.
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'documents');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'danger' | 'warning' | 'draft'>('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const parseDate = (dateStr: string): Date => {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  const isDateInRange = (dateStr: string, range: string): boolean => {
    if (range === 'all') return true;
    const docDate = parseDate(dateStr);
    const now = new Date();
    const cutoff = new Date();
    switch (range) {
      case '7days': cutoff.setDate(now.getDate() - 7); break;
      case '30days': cutoff.setDate(now.getDate() - 30); break;
      case '3months': cutoff.setMonth(now.getMonth() - 3); break;
      case '6months': cutoff.setMonth(now.getMonth() - 6); break;
      case '1year': cutoff.setFullYear(now.getFullYear() - 1); break;
      default: return true;
    }
    return docDate >= cutoff;
  };

  // "Documents" is the customer's own record store — completed reviews,
  // follow-up meeting notes and audits get filed here, per customer.
  // "Assessments" is the standard onboarding/compliance template pack, same for everyone.
  const isDocumentsTab = activeTab === 'documents';
  const allDocuments = (isDocumentsTab ? CUSTOMER_DOCUMENTS : ASSESSMENT_TEMPLATES)[customer.id] ?? [];

  const filteredDocuments = useMemo(() => {
    return allDocuments.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.subtitle && doc.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      const matchesDate = isDateInRange(doc.createdDate, dateFilter);
      const matchesCategory = !isDocumentsTab || categoryFilter === 'all' || doc.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesDate && matchesCategory;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDocuments, searchQuery, statusFilter, dateFilter, categoryFilter, isDocumentsTab]);

  if (activeTab === 'carebridge') {
    return (
      <div className="max-w-[1280px] mx-auto flex flex-col gap-4">
        <DocumentTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Same purple tint as the "CareBridge Draft" panel on the Care Plan click-through. */}
        <div className="flex items-start gap-3 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 shadow">
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 pt-1">
            <img src={assessmentHeroIconUrl} className="w-8 h-8" alt="Assessment Hero" />
          </div>
          <div>
            <p className="text-lg font-semibold text-purple-900">Assessment Hero — a new home for assessment and customer recordings</p>
            <p className="text-sm text-purple-800 mt-0.5">
              Every recording and transcript captured on the app for the customer lives here, giving a record of
              what was actually said — so it can be checked against the text Assessment Hero drafted into the forms.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <CareBridgeRecordingsTab />
        </div>
      </div>
    );
  }

  if (activeTab !== 'assessments' && activeTab !== 'documents') {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-4">
          <DocumentTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">
          {activeTab === 'enquiry' ? 'Enquiry' : 'Files'} — coming soon
        </div>
      </div>
    );
  }

  return (
    // Matches the two-column width in CustomerDetailsPage so Documents/Assessments
    // don't sprawl wider than the rest of the customer section.
    <div className="max-w-[1280px] mx-auto">
      {/* Sub-tabs — on the gray background */}
      <div className="mb-4">
        <DocumentTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Filters toolbar */}
        <div className="px-6 py-3 border-b border-gray-200 bg-white flex items-center gap-4">
          <DocumentFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            documentCount={filteredDocuments.length}
            allDocuments={allDocuments}
            showCategoryFilter={isDocumentsTab}
          />
          {/* New folder / Add — only meaningful for the customer's own record
              store; the Assessments pack is a fixed, system-provided set. */}
          {isDocumentsTab && (
            <div className="flex items-center gap-3 flex-shrink-0">
              <Button variant="secondary" icon={<FolderPlus className="w-4 h-4" />}>New folder</Button>
              <Button icon={<Plus className="w-4 h-4" />}>Add</Button>
            </div>
          )}
        </div>

        {/* Document list */}
        {allDocuments.length === 0 ? (
          <TabEmptyState label={isDocumentsTab ? 'documents' : 'assessments'} />
        ) : (
          <DocumentList documents={filteredDocuments} />
        )}
      </div>
    </div>
  );
}
