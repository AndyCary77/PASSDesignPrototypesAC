import React, { useState, useEffect } from 'react';
import { X, Calendar, Edit2, ChevronDown, MoreVertical, Trash2, Info } from 'lucide-react';
import { PencilSolidIcon } from '../../icons/PencilSolidIcon';
import { VisitNoteIcon } from '../../icons/VisitNoteIcon';

interface Employee {
  id: string;
  title: string;
  name: string;
  type: string;
  photoUrl: string;
}

interface AppointmentPanelProps {
  onClose: () => void;
}

export function AppointmentPanel({ onClose }: AppointmentPanelProps) {
  const [activeTab, setActiveTab] = useState('assigned');
  const [showVisitNotePanel, setShowVisitNotePanel] = useState(false);
  const [visitNote, setVisitNote] = useState('');
  const [savedVisitNote, setSavedVisitNote] = useState('');
  const [noteCreatedAt, setNoteCreatedAt] = useState<Date | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletionInfo, setDeletionInfo] = useState<{ deletedBy: string; deletedAt: Date } | null>(null);
  const [showDeletionTooltip, setShowDeletionTooltip] = useState(false);

  // Load visit note from local storage on mount
  useEffect(() => {
    const storedNote = localStorage.getItem('visitNote');
    const storedTimestamp = localStorage.getItem('visitNoteTimestamp');
    const storedDeletion = localStorage.getItem('visitNoteDeletion');
    
    if (storedNote) {
      setSavedVisitNote(storedNote);
      setShowVisitNotePanel(true); // Automatically show the panel if there's a saved note
    }
    if (storedTimestamp) {
      setNoteCreatedAt(new Date(storedTimestamp));
    }
    if (storedDeletion) {
      setDeletionInfo(JSON.parse(storedDeletion));
    }
  }, []);

  // Save visit note to local storage whenever it changes
  useEffect(() => {
    if (savedVisitNote) {
      localStorage.setItem('visitNote', savedVisitNote);
      if (noteCreatedAt) {
        localStorage.setItem('visitNoteTimestamp', noteCreatedAt.toISOString());
      }
    } else {
      localStorage.removeItem('visitNote');
      localStorage.removeItem('visitNoteTimestamp');
    }
  }, [savedVisitNote, noteCreatedAt]);

  // Save deletion info to local storage
  useEffect(() => {
    if (deletionInfo) {
      localStorage.setItem('visitNoteDeletion', JSON.stringify(deletionInfo));
    } else {
      localStorage.removeItem('visitNoteDeletion');
    }
  }, [deletionInfo]);

  const assignedEmployee: Employee = {
    id: '1',
    title: 'Mrs',
    name: 'Adrianna Janowski',
    type: 'Fixed hours',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop'
  };

  const shadowEmployee: Employee = {
    id: '2',
    title: 'Mr',
    name: 'David Bukowski',
    type: 'Fixed hours',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop'
  };

  return (
    <>
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="font-semibold mb-2">Delete Visit Note?</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete this visit note? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors cursor-pointer"
                  style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setSavedVisitNote('');
                    setNoteCreatedAt(null);
                    setShowVisitNotePanel(false);
                    setShowDeleteConfirm(false);
                    setDeletionInfo({ deletedBy: 'Andrew Cary', deletedAt: new Date() });
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors cursor-pointer"
                  style={{ fontSize: 'var(--text-base)' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-black/30 z-50 flex justify-end">
        <div className="bg-white w-3/4 max-w-[1250px] h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200">
          <div className="pt-6 pb-6 p-[32px]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl text-[24px] font-semibold">Morning Visit with Anthony Dobson</h2>
                  <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded">
                    Pending
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 cursor-pointer hover:opacity-80"
                style={{ color: 'rgb(154, 38, 214)' }}
                aria-label="Close event panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Info */}
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop"
                  alt="Anthony Dobson"
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1 flex items-end gap-6 flex-wrap">
                <div className="flex flex-col items-start gap-1">
                  <div className="text-xs text-gray-500 text-[14px]">Customer</div>
                  <button className="text-[#5c1c85] hover:underline cursor-pointer" style={{ fontSize: 'var(--text-base)' }}>
                    Anthony Dobson
                  </button>
                </div>

                <div style={{ fontSize: 'var(--text-base)' }}>Morning Visit</div>
                
                <div className="flex items-center gap-2 text-sm">
                  <span>Tue 16th Dec</span>
                  <button className="text-gray-400 hover:text-gray-600 cursor-pointer">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span style={{ fontSize: 'var(--text-base)' }}>09:30 - 11:30</span>
                  <span className="text-gray-500" style={{ fontSize: 'var(--text-base)' }}>(2hr 00m)</span>
                  <button className="text-gray-400 hover:text-gray-600 cursor-pointer">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span style={{ fontSize: 'var(--text-base)' }}>Daily</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>

                <div className="flex items-center ml-auto">
                  <button
                    className="flex items-center gap-1.5 text-gray-600 hover:bg-gray-100 border border-gray-400 px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer font-medium"
                    onClick={() => setShowVisitNotePanel(!showVisitNotePanel)}
                    style={{ fontSize: 'var(--text-sm)' }}
                  >
                    <VisitNoteIcon className="w-4 h-4" />
                    Visit Note
                  </button>
                  
                  {/* Deletion info icon - only shows if a note was deleted */}
                  {deletionInfo && !savedVisitNote && (
                    <div className="relative ml-4">
                      <button
                        className="flex items-center justify-center w-7 h-7 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                        onMouseEnter={() => setShowDeletionTooltip(true)}
                        onMouseLeave={() => setShowDeletionTooltip(false)}
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      
                      {/* Tooltip */}
                      {showDeletionTooltip && (
                        <div className="absolute right-0 top-full mt-2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 shadow-lg">
                          <div>Visit note deleted by {deletionInfo.deletedBy}</div>
                          <div className="text-gray-300">
                            {new Date(deletionInfo.deletedAt).toLocaleString('en-GB', {
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {/* Tooltip arrow */}
                          <div className="absolute bottom-full right-3 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Visit Note Panel - slides down between customer info and tabs */}
          <div 
            className="overflow-hidden transition-all duration-500 ease-in-out origin-top"
            style={{
              maxHeight: showVisitNotePanel ? '400px' : '0px',
              opacity: showVisitNotePanel ? 1 : 0,
            }}
          >
            <div className="bg-[rgb(255,255,255)] border-t border-gray-200 px-[32px] py-6 pt-[16px] pr-[32px] pb-[24px] pl-[32px]">
              {!savedVisitNote ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <VisitNoteIcon className="w-5 h-5 text-gray-900" />
                    <h4 className="font-semibold text-gray-900" style={{ fontSize: 'var(--text-base)' }}>Visit Note</h4>
                  </div>

                  <div className="space-y-3 mt-[0px] mr-[0px] mb-[4px] ml-[0px]">
                    <textarea
                      id="visit-note"
                      placeholder="Add details for other office users..."
                      value={visitNote}
                      onChange={(e) => setVisitNote(e.target.value)}
                      rows={3}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5c1c85] focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3 pt-2 justify-end p-[0px]">
                    <button
                      onClick={() => setShowVisitNotePanel(false)}
                      className="text-gray-600 hover:text-gray-800 px-6 py-2 rounded-full hover:bg-gray-50 transition-colors cursor-pointer"
                      style={{ fontSize: 'var(--text-base)', fontWeight: 600, backgroundColor: '#EDECF1' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (visitNote.trim()) {
                          setSavedVisitNote(visitNote);
                          setVisitNote('');
                          setNoteCreatedAt(new Date());
                        }
                      }}
                      className="bg-[rgb(154,38,214)] hover:bg-[rgb(134,28,194)] text-white px-6 py-2 rounded-full transition-colors cursor-pointer"
                      style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-start gap-3 flex-1 mt-[0px] mr-[0px] mb-[0px] ml-[8px] m-[0px]">
                      <VisitNoteIcon className="w-6 h-6 text-blue-800" />
                      <div className="text-base text-blue-800 flex-1">
                        <span className="font-semibold text-blue-900 mr-2 text-base">Visit Note</span>
                        <span className="whitespace-pre-wrap">{savedVisitNote}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-right text-xs text-blue-700 whitespace-nowrap px-[0px] py-[8px] pt-[0px] pr-[8px] pb-[0px] pl-[0px]">
                        <div className="text-[rgb(51,51,51)] text-xs">Updated by Andrew Cary</div>
                        {noteCreatedAt && (
                          <div className="text-[rgb(51,51,51)] text-xs">
                            {noteCreatedAt.toLocaleString('en-GB', {
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          className="h-8 w-8 text-blue-900 hover:text-blue-700 hover:bg-blue-100 rounded-full p-1 transition-colors flex items-center justify-center cursor-pointer"
                          onClick={() => {
                            setVisitNote(savedVisitNote);
                            setSavedVisitNote('');
                            setDeletionInfo(null); // Clear deletion info when editing
                          }}
                        >
                          <PencilSolidIcon className="w-4 h-4" />
                        </button>
                        <button
                          className="h-8 w-8 text-blue-900 hover:text-red-600 hover:bg-red-100 rounded-full p-1 transition-colors flex items-center justify-center cursor-pointer"
                          onClick={() => setShowDeleteConfirm(true)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex justify-between px-[32px] py-[0px]">
              <TabButton
                active={activeTab === 'assigned'}
                onClick={() => setActiveTab('assigned')}
                label="Assigned Today"
              />
              <TabButton
                active={activeTab === 'recurring'}
                onClick={() => setActiveTab('recurring')}
                label="Recurring Employees"
                hasNotification
              />
              <TabButton
                active={activeTab === 'care'}
                onClick={() => setActiveTab('care')}
                label="Care Required"
              />
              <TabButton
                active={activeTab === 'history'}
                onClick={() => setActiveTab('history')}
                label="History"
              />
              <TabButton
                active={activeTab === 'customer'}
                onClick={() => setActiveTab('customer')}
                label="Customer Details"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 p-[32px]">
          {activeTab === 'assigned' && (
            <div className="space-y-6">
              {/* Assignment Summary */}
              <div className="text-sm">
                <span className="font-medium text-[16px]">1/1 employee assigned</span>
                <span className="text-gray-600" style={{ fontSize: 'var(--text-sm)', marginLeft: '8px' }}> (Adrianna Janowski today only)</span>
              </div>

              {/* Assigned Employee */}
              <EmployeeCard employee={assignedEmployee} />

              {/* Shadow Employee Section */}
              <div>
                <div className="mb-3 text-gray-700" style={{ fontSize: 'var(--text-base)' }}>Shadow employee assigned</div>
                <EmployeeCard employee={shadowEmployee} isShadow />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between bg-white p-[32px]">
          <button className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-full cursor-pointer" style={{ fontSize: 'var(--text-base)', fontWeight: 600, backgroundColor: '#EDECF1' }}>
            Cancel visit
          </button>
          <button className="bg-[rgb(154,38,214)] hover:bg-[rgb(134,28,194)] text-white px-8 py-2 rounded-full transition-colors cursor-pointer" style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>
            Save
          </button>
        </div>
      </div>
      </div>
    </>
  );
}

function TabButton({
  active,
  onClick,
  label,
  hasNotification
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hasNotification?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-4 py-4 transition-colors cursor-pointer
        ${active
          ? 'text-[#5c1c85] border-b-2'
          : 'text-gray-600 hover:text-gray-900'
        }
      `}
      style={{ 
        fontSize: 'var(--text-base)', 
        fontWeight: 500,
        borderBottomColor: active ? 'rgb(154, 38, 214)' : 'transparent'
      }}
    >
      <span className="relative inline-block">
        {label}
        {hasNotification && (
          <span className="absolute -top-1 -right-2 w-2 h-2 bg-[#5c1c85] rounded-full"></span>
        )}
      </span>
    </button>
  );
}

function EmployeeCard({ employee, isShadow }: { employee: Employee; isShadow?: boolean }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${isShadow ? 'bg-gray-50/50' : ''}`}>
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
          <img
            src={employee.photoUrl}
            alt={employee.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Details */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-end gap-4">
                <div className="w-[180px]">
                  <div className="text-gray-500" style={{ fontSize: 'var(--text-sm)' }}>{employee.title}</div>
                  <div className="font-medium">{employee.name}</div>
                </div>
                <div className="flex flex-col">
                  <div className="text-gray-500" style={{ fontSize: 'var(--text-sm)' }}>Type</div>
                  <div style={{ fontSize: 'var(--text-base)' }}>{employee.type}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* More Menu */}
        <button className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function VisitCard({ name, status }: { name: string; status: string }) {
  return (
    <div className="inline-block bg-white rounded-2xl border-2 border-gray-300 px-4 py-2 h-[52px] flex items-center justify-center">
      <div className="text-left">
        <div className="font-medium text-[16px] leading-tight">{name}</div>
        <div className="text-gray-400 text-[14px] leading-tight">{status}</div>
      </div>
    </div>
  );
}