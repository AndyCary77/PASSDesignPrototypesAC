import React, { useState } from 'react';
import { ClipboardList, AlertTriangle, Users, CalendarClock, X } from 'lucide-react';
import { VisitSlideout } from './VisitSlideout';
import { ScheduleTimeline } from './ScheduleTimeline';

export function SchedulePage() {
  const [slideoutOpen, setSlideoutOpen] = useState(false);
  const [slideoutTab, setSlideoutTab] = useState('Care Required');
  const [slideoutFooterWarning, setSlideoutFooterWarning] = useState<string | undefined>();
  const [slideoutFooterConflicts, setSlideoutFooterConflicts] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const openSlideout = (tab: string, options?: { footerWarning?: string; footerConflicts?: boolean }) => {
    setSlideoutTab(tab);
    setSlideoutFooterWarning(options?.footerWarning);
    setSlideoutFooterConflicts(options?.footerConflicts ?? false);
    setSlideoutOpen(true);
  };

  return (
    <>
      <div className={`space-y-6 ${slideoutOpen || modalOpen ? 'invisible' : ''}`}>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Morning Visit — Arthur Barrington</h2>
          <p className="text-sm text-gray-500">Select a scenario to preview</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <ScenarioTile
            icon={<ClipboardList className="w-8 h-8" />}
            iconColor="text-[rgb(154,38,214)]"
            iconBg="bg-purple-100"
            title="Care & Visit Requirements"
            description="View the care requirements and visit tasks for this appointment, including medications, preferred employees, and environment details."
            onClick={() => openSlideout('Care Required')}
          />
          <ScenarioTile
            icon={<AlertTriangle className="w-8 h-8" />}
            iconColor="text-red-600"
            iconBg="bg-red-100"
            title="Assignment Conflict Warning"
            description="Preview a blocking conflict modal showing why an assignment cannot be completed due to contract and availability issues."
            onClick={() => setModalOpen(true)}
          />
          <ScenarioTile
            icon={<Users className="w-8 h-8" />}
            iconColor="text-amber-600"
            iconBg="bg-amber-100"
            title="Assigned Today with Warning"
            description="View the employees assigned to this visit with conflicts flagged in the footer."
            onClick={() => openSlideout('Assigned Today', { footerConflicts: true })}
          />
          <ScenarioTile
            icon={<CalendarClock className="w-8 h-8" />}
            iconColor="text-amber-600"
            iconBg="bg-amber-100"
            title="Timeline — Carer Restriction Warnings"
            description="Preview the daily timeline schedule with warning icons flagged against carer rows for employees who have restrictions added."
            onClick={() => setTimelineOpen(true)}
          />
        </div>
      </div>

      {slideoutOpen && (
        <VisitSlideout
          onClose={() => setSlideoutOpen(false)}
          initialTab={slideoutTab}
          footerWarning={slideoutFooterWarning}
          footerConflicts={slideoutFooterConflicts}
        />
      )}

      {modalOpen && <AssignmentWarningModal onClose={() => setModalOpen(false)} />}

      {timelineOpen && <ScheduleTimeline onClose={() => setTimelineOpen(false)} />}
    </>
  );
}

function ScenarioTile({
  icon, iconColor, iconBg, title, description, onClick,
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-6 text-left hover:border-purple-300 hover:shadow-md transition-all group cursor-pointer"
    >
      <div className={`w-14 h-14 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      <div className="mt-4 text-sm font-semibold text-[rgb(154,38,214)] group-hover:underline">Open →</div>
    </button>
  );
}

function InlineTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center self-start px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap"
      style={{ backgroundColor: 'rgb(220, 217, 228)', color: '#374151' }}
    >
      {children}
    </span>
  );
}

const CONFLICTS = [
  {
    tags: ['Medical Condition – PEG Feeding'],
    category: 'Mandatory Requirement',
    reason: "not in David Bukowski's Skills or Work Criteria",
  },
  {
    tags: ['Dog', 'Smoker'],
    category: 'Environment',
    reason: "conflicts with David Bukowski's Restriction",
  },
];

function AssignmentWarningModal({ onClose }: { onClose: () => void }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[620px] relative">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-[#9a26d6] hover:opacity-70 transition-opacity cursor-pointer z-10"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {!confirming ? (
          <>
            {/* Header */}
            <div className="p-10 pb-6">
              <h2 className="text-[21px] font-semibold text-gray-900 leading-tight mb-2">
                Unsuitable Assignment
              </h2>
              <p className="text-[16px] text-gray-600">
                <strong>David Bukowski</strong> has one or more conflicts that make them unsuitable for assignment to <strong>Arthur Barrington</strong>.
              </p>
            </div>

            {/* Conflicts list */}
            <div className="px-10 pb-8">
              <div className="bg-amber-50 border border-amber-200 rounded-[8px] px-4 py-4">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <span className="text-[16px] font-bold text-amber-900">Conflicts</span>
                </div>
                <ul className="space-y-4">
                  {CONFLICTS.map((conflict, i) => {
                    const reason = conflict.tags.length > 1
                      ? conflict.reason.replace('Restriction', 'Restrictions')
                      : conflict.reason;
                    return (
                      <li key={i} className="flex flex-col gap-1">
                        <div className="flex flex-wrap gap-2">
                          {conflict.tags.map((tag, j) => (
                            <InlineTag key={j}>{tag}</InlineTag>
                          ))}
                        </div>
                        <span className="text-sm text-gray-700 leading-relaxed">
                          <span className="font-semibold">{conflict.category}</span>: {reason}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="pb-10 px-10 flex items-center justify-between">
              <button
                onClick={onClose}
                className="h-[48px] px-10 rounded-full bg-[#9a26d6] text-white text-[16px] font-semibold hover:bg-[#831eb8] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setConfirming(true)}
                className="h-[48px] px-10 rounded-full border border-gray-300 text-gray-700 text-[16px] font-semibold hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Override and Assign
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Confirmation header */}
            <div className="p-10 pb-6">
              <h2 className="text-[21px] font-semibold text-gray-900 leading-tight mb-2">
                Are you sure?
              </h2>
              <p className="text-[16px] text-gray-600">
                You are about to assign <strong>David Bukowski</strong> to <strong>Arthur Barrington</strong> despite the conflicts listed below. This action will be recorded.
              </p>
            </div>

            {/* Confirmation warning */}
            <div className="px-10 pb-8">
              <div className="bg-red-50 border border-red-200 rounded-[8px] px-4 py-4">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-[16px] font-bold text-red-900">Overriding the following conflicts</span>
                </div>
                <ul className="space-y-4">
                  {CONFLICTS.map((conflict, i) => {
                    const reason = conflict.tags.length > 1
                      ? conflict.reason.replace('Restriction', 'Restrictions')
                      : conflict.reason;
                    return (
                      <li key={i} className="flex flex-col gap-1">
                        <div className="flex flex-wrap gap-2">
                          {conflict.tags.map((tag, j) => (
                            <InlineTag key={j}>{tag}</InlineTag>
                          ))}
                        </div>
                        <span className="text-sm text-gray-700 leading-relaxed">
                          <span className="font-semibold">{conflict.category}</span>: {reason}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Confirmation footer */}
            <div className="pb-10 px-10 flex items-center justify-between">
              <button
                onClick={() => setConfirming(false)}
                className="h-[48px] px-10 rounded-full border border-gray-300 text-gray-700 text-[16px] font-semibold hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Back
              </button>
              <button
                onClick={onClose}
                className="h-[48px] px-10 rounded-full bg-[#9a26d6] text-white text-[16px] font-semibold hover:bg-[#831eb8] cursor-pointer transition-colors"
              >
                Confirm Assignment
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
