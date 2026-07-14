import React from 'react';
import { Check, X, ChevronRight, AlertCircle, CalendarX } from 'lucide-react';
import { Document } from '../../../data/mock-documents';

interface DocumentListProps {
  documents: Document[];
}

export function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-lg font-medium">No documents found</p>
        <p className="text-sm">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {documents.map((doc) => (
        <div 
          key={doc.id} 
          className="group flex items-center justify-between px-4 h-24 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-[#5c1c85] border-b !border-b-gray-200 last:border-b-0"
        >
          {/* Left Side: Status + Info */}
          <div className="flex items-center gap-4">
            {/* Status Icon */}
            <div>
              {doc.status === 'success' ? (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              ) : doc.status === 'warning' ? (
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
                  <CalendarX className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
                  <X className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              )}
            </div>

            {/* Text Content */}
            <div className="flex flex-col">
              <span className="text-gray-900 font-bold text-base leading-snug">
                {doc.title}
              </span>
              {doc.subtitle && (
                <span className="text-gray-500 text-sm italic mt-0.5">
                  {doc.subtitle}
                </span>
              )}
            </div>
          </div>

          {/* Right Side: Date + Chevron */}
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <span className="text-gray-500 text-sm">Created Date {doc.createdDate}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#5c1c85] transition-colors" />
          </div>
        </div>
      ))}
    </div>
  );
}