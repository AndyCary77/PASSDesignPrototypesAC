import React from 'react';
import { Search, Filter, X, Calendar } from 'lucide-react';
import { Document } from '../../data/mock-documents';

interface DocumentFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: 'all' | 'success' | 'danger' | 'warning';
  setStatusFilter: (status: 'all' | 'success' | 'danger' | 'warning') => void;
  dateFilter: string;
  setDateFilter: (range: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  documentCount: number;
  allDocuments: Document[];
}

export function DocumentFilters({ 
  searchQuery, 
  setSearchQuery, 
  statusFilter, 
  setStatusFilter,
  dateFilter,
  setDateFilter,
  categoryFilter,
  setCategoryFilter,
  documentCount,
  allDocuments
}: DocumentFiltersProps) {
  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || dateFilter !== 'all' || categoryFilter !== 'all';

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter('all');
    setCategoryFilter('all');
  };

  // Helper function to parse DD/MM/YYYY dates
  const parseDate = (dateStr: string): Date => {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  // Helper function to check if a date is within the selected range
  const isDateInRange = (dateStr: string, range: string): boolean => {
    if (range === 'all') return true;
    
    const docDate = parseDate(dateStr);
    const now = new Date();
    const cutoffDate = new Date();

    switch (range) {
      case '7days':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '3months':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return true;
    }

    return docDate >= cutoffDate;
  };

  // Calculate counts for each status filter option
  const getStatusCount = (status: 'all' | 'success' | 'danger' | 'warning'): number => {
    return allDocuments.filter((doc) => {
      const matchesSearch = 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (doc.subtitle && doc.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = status === 'all' || doc.status === status;
      const matchesDate = isDateInRange(doc.createdDate, dateFilter);
      const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesDate && matchesCategory;
    }).length;
  };

  // Calculate counts for each date filter option
  const getDateCount = (range: string): number => {
    return allDocuments.filter((doc) => {
      const matchesSearch = 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (doc.subtitle && doc.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      const matchesDate = isDateInRange(doc.createdDate, range);
      const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesDate && matchesCategory;
    }).length;
  };

  // Calculate counts for each category filter option
  const getCategoryCount = (category: string): number => {
    return allDocuments.filter((doc) => {
      const matchesSearch = 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (doc.subtitle && doc.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      const matchesDate = isDateInRange(doc.createdDate, dateFilter);
      const matchesCategory = category === 'all' || doc.category === category;
      return matchesSearch && matchesStatus && matchesDate && matchesCategory;
    }).length;
  };

  return (
    <div className="flex flex-1 items-center gap-4 w-full">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-20 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5c1c85] focus:border-transparent text-sm placeholder:text-gray-400"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {documentCount} {documentCount === 1 ? 'item' : 'items'}
          </span>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Status Filter */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
          <Filter className="w-3 h-3" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="w-44 pl-8 pr-8 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#5c1c85] appearance-none cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <option value="all">All Documents</option>
          <option value="success">Complete ({getStatusCount('success')})</option>
          <option value="danger">Incomplete ({getStatusCount('danger')})</option>
          <option value="warning">Review required ({getStatusCount('warning')})</option>
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-xs">
          ▼
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
          <Calendar className="w-3 h-3" />
        </div>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-44 pl-8 pr-8 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#5c1c85] appearance-none cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <option value="all">All time</option>
          <option value="7days">Last 7 days ({getDateCount('7days')})</option>
          <option value="30days">Last 30 days ({getDateCount('30days')})</option>
          <option value="3months">Last 3 months ({getDateCount('3months')})</option>
          <option value="6months">Last 6 months ({getDateCount('6months')})</option>
          <option value="1year">Last year ({getDateCount('1year')})</option>
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-xs">
          ▼
        </div>
      </div>

      {/* Category Filter */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
          <Filter className="w-3 h-3" />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-44 pl-8 pr-8 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#5c1c85] appearance-none cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <option value="all">All Categories</option>
          <option value="Accident">Accident ({getCategoryCount('Accident')})</option>
          <option value="Complaint">Complaint ({getCategoryCount('Complaint')})</option>
          <option value="Fall Tracking">Fall Tracking ({getCategoryCount('Fall Tracking')})</option>
          <option value="Incident">Incident ({getCategoryCount('Incident')})</option>
          <option value="Infection Control">Infection Control ({getCategoryCount('Infection Control')})</option>
          <option value="Information Governance">Information Governance ({getCategoryCount('Information Governance')})</option>
          <option value="Medication">Medication ({getCategoryCount('Medication')})</option>
          <option value="Safe Guarding">Safe Guarding ({getCategoryCount('Safe Guarding')})</option>
          <option value="Security">Security ({getCategoryCount('Security')})</option>
          <option value="Violence/Aggression">Violence/Aggression ({getCategoryCount('Violence/Aggression')})</option>
          <option value="Other">Other ({getCategoryCount('Other')})</option>
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-xs">
          ▼
        </div>
      </div>

      {/* Clear All Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          Clear all filters
        </button>
      )}
    </div>
  );
}