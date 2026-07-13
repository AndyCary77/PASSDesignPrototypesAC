import { useState, useMemo } from 'react';
import { MOCK_DOCUMENTS } from '../../data/mock-documents';
import { DocumentTabs } from './DocumentTabs';
import { DocumentFilters } from './DocumentFilters';
import { DocumentList } from './DocumentList';

export function DocumentsPage() {
  const [activeTab, setActiveTab] = useState('documents');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'danger' | 'warning'>('all');
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

  const filteredDocuments = useMemo(() => {
    return MOCK_DOCUMENTS.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.subtitle && doc.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      const matchesDate = isDateInRange(doc.createdDate, dateFilter);
      const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesDate && matchesCategory;
    });
  }, [searchQuery, statusFilter, dateFilter, categoryFilter]);

  return (
    <div>
      {/* Sub-tabs — on the gray background */}
      <div className="mb-4">
        <DocumentTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Filters toolbar */}
      <div className="px-6 py-3 border-b border-gray-200 bg-white">
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
          allDocuments={MOCK_DOCUMENTS}
        />
      </div>

      {/* Document list */}
      <DocumentList documents={filteredDocuments} />
      </div>
    </div>
  );
}
