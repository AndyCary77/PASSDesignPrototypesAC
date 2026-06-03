import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Edit2,
  ChevronDown,
  Info,
  Pencil,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { VisitNoteIcon } from "./icons/VisitNoteIcon";
import { Button } from "./ui/button";

// Custom SVG Icons
const CustomAlertIcon = ({
  className,
}: {
  className?: string;
}) => (
  <svg
    className={className}
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g stroke="none" fill="none" fillRule="evenodd">
      <g>
        <polygon points="0 0 24 0 24 24 0 24"></polygon>
        <path
          d="M10.366447,4.91222128 C11.0935197,3.65636839 12.9064803,3.65636839 13.633553,4.91222128 L20.7437577,17.1969175 C21.4708304,18.4527704 20.5643501,20.0296684 19.1102047,20.0296684 L4.88979533,20.0296684 C3.43564989,20.0296684 2.52916961,18.4527704 3.25624234,17.1969175 Z M12,15.3084169 C11.478505,15.3084169 11.0557497,15.7311722 11.0557497,16.2526672 C11.0557497,16.7741623 11.478505,17.1969175 12,17.1969175 C12.521495,17.1969175 12.9442503,16.7741623 12.9442503,16.2526672 C12.9442503,15.3084169 12.521495,15.3084169 12,15.3084169 Z M12,7.75441464 C11.478505,7.75441464 11.0557497,8.1771699 11.0557497,8.69866493 L11.0557497,12.4756661 C11.0557497,12.9971611 11.478505,13.4199164 12,13.4199164 C12.521495,13.4199164 12.9442503,12.9971611 12.9442503,12.4756661 L12.9442503,8.69866493 C12.9442503,8.1771699 12.521495,7.75441464 12,7.75441464 Z"
          fill="currentColor"
        ></path>
      </g>
    </g>
  </svg>
);

const BlockingIcon = ({
  className,
}: {
  className?: string;
}) => (
  <svg
    className={className}
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g stroke="none" fill="none" fillRule="evenodd">
      <polygon points="0 0 24 0 24 24 0 24"></polygon>
      <path
        d="M11.99,2 C17.52,2 22,6.48 22,12 C22,17.52 17.52,22 11.99,22 C6.47,22 2,17.52 2,12 C2,6.48 6.47,2 11.99,2 Z M17.8913973,6.58643665 L7.63602701,18.7069445 C8.89085419,19.5248143 10.3896791,20 12,20 C16.42,20 20,16.42 20,12 C20,9.9116195 19.2007958,8.01076176 17.8913973,6.58643665 Z M12,4 C7.58,4 4,7.58 4,12 C4,14.0883805 4.79920418,15.9892382 6.1086027,17.4135634 L16.363973,5.29305555 C15.1091458,4.47518571 13.6103209,4 12,4 Z"
        fill="currentColor"
      ></path>
    </g>
  </svg>
);

const TabButton = ({
  active,
  onClick,
  label,
  hasNotification,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hasNotification?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-4 relative transition-all cursor-pointer text-[15px] font-medium whitespace-nowrap ${
      active
        ? "text-[#9a26d6] border-b-2 border-[#9a26d6]"
        : "text-gray-500 hover:text-gray-700"
    }`}
  >
    {label}
    {hasNotification && (
      <span className="ml-2 bg-[#9a26d6] text-white text-[10px] w-4 h-4 rounded-full inline-flex items-center justify-center">
        1
      </span>
    )}
  </button>
);

const EmployeeCard = ({
  name,
  isShadow,
  img,
}: {
  name: string;
  isShadow?: boolean;
  img: string;
}) => (
  <div className="bg-white rounded-[12px] border border-gray-200 p-4 flex items-center gap-4">
    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
      <img
        src={img}
        alt={name}
        className="w-full h-full object-cover"
      />
    </div>
    <div className="flex-1">
      <div className="font-semibold text-gray-900">{name}</div>
      <div className="text-sm text-gray-500">
        {isShadow ? "Shadow Employee" : "Primary Employee"}
      </div>
    </div>
    {!isShadow && (
      <CheckCircle2 className="w-5 h-5 text-green-500" />
    )}
  </div>
);

interface VisitDetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  type: "conflicts" | "blockers_conflicts" | "past_visits_only" | "past_visits_blocked" | "past_visits_conflict" | "all";
}

export const VisitDetailsPanel = ({
  isOpen,
  onClose,
  type,
}: VisitDetailsPanelProps) => {
  const [activeTab, setActiveTab] = useState("assigned");
  const [showVisitNotePanel, setShowVisitNotePanel] =
    useState(false);
  const [savedVisitNote, setSavedVisitNote] = useState("");
  const [visitNote, setVisitNote] = useState("");
  const [showFooterAlert, setShowFooterAlert] = useState(false);

  const hasBlockers =
    type === "blockers_conflicts" || type === "past_visits_blocked" || type === "all";

  useEffect(() => {
    if (!isOpen) {
      setShowFooterAlert(false);
      setShowVisitNotePanel(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 z-[100] flex justify-end">
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 200,
        }}
        className="bg-white w-3/4 max-w-[1250px] h-full shadow-2xl flex flex-col overflow-hidden relative"
      >
        {/* Header Section Container */}
        <div className="flex-shrink-0">
          {/* Header */}
          <div className="border-b border-gray-200">
            <div className="pt-6 pb-6 p-[32px]">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[24px] font-semibold">
                      Morning Visit with Anthony Dobson
                    </h2>
                    <span
                      className={`text-xs px-3 py-1 rounded ${
                        type === "all"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {type === "all" ? "Completed" : "Pending"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 cursor-pointer hover:opacity-80"
                  style={{ color: "rgb(154, 38, 214)" }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer Info */}
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1735063456221-91dcb101285b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZW5pb3IlMjBtYW4lMjBwb3J0cmFpdCUyMGZhY2V8ZW58MXx8fHwxNzY4OTIxMTIxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Anthony Dobson"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 flex items-end gap-6 flex-wrap">
                  <div className="flex flex-col items-start gap-1">
                    <div className="text-xs text-gray-500">
                      Customer
                    </div>
                    <button className="text-[#5c1c85] hover:underline cursor-pointer text-base">
                      Anthony Dobson
                    </button>
                  </div>

                  <div className="text-base">Morning Visit</div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-base">
                      Tue 16th Dec
                    </span>
                    <button className="text-gray-400 hover:text-gray-600 cursor-pointer">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-base">
                      09:30 - 11:30
                    </span>
                    <span className="text-gray-500 text-base">
                      (2hr 00m)
                    </span>
                    <button className="text-gray-400 hover:text-gray-600 cursor-pointer">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-base">Daily</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </div>

                  <div className="flex items-center ml-auto">
                    <button
                      className="flex items-center gap-1.5 text-gray-600 hover:bg-gray-100 border border-gray-400 px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer font-medium text-sm"
                      onClick={() =>
                        setShowVisitNotePanel(
                          !showVisitNotePanel,
                        )
                      }
                    >
                      <VisitNoteIcon className="w-4 h-4" />
                      Visit Note
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Visit Note Panel */}
            <div
              className="overflow-hidden transition-all duration-500 ease-in-out origin-top"
              style={{
                maxHeight: showVisitNotePanel ? "400px" : "0px",
                opacity: showVisitNotePanel ? 1 : 0,
              }}
            >
              <div className="bg-white border-t border-gray-200 px-[32px] py-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <VisitNoteIcon className="w-5 h-5 text-gray-900" />
                    <h4 className="font-semibold text-gray-900 text-base">
                      Visit Note
                    </h4>
                  </div>
                  <textarea
                    placeholder="Add details for other office users..."
                    value={visitNote}
                    onChange={(e) =>
                      setVisitNote(e.target.value)
                    }
                    rows={3}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5c1c85]"
                  />
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() =>
                        setShowVisitNotePanel(false)
                      }
                      className="text-gray-600 px-6 py-2 rounded-full bg-[#EDECF1] hover:bg-gray-200 transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (visitNote.trim()) {
                          setSavedVisitNote(visitNote);
                          setVisitNote("");
                          setShowVisitNotePanel(false);
                        }
                      }}
                      className="bg-[#9a26d6] hover:bg-[#831eb8] text-white px-6 py-2 rounded-full transition-colors font-semibold"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex justify-between px-[32px]">
                <TabButton
                  active={activeTab === "assigned"}
                  onClick={() => setActiveTab("assigned")}
                  label="Assigned Today"
                />
                <TabButton
                  active={activeTab === "recurring"}
                  onClick={() => setActiveTab("recurring")}
                  label="Recurring Employees"
                  hasNotification
                />
                <TabButton
                  active={activeTab === "care"}
                  onClick={() => setActiveTab("care")}
                  label="Care Required"
                />
                <TabButton
                  active={activeTab === "history"}
                  onClick={() => setActiveTab("history")}
                  label="History"
                />
                <TabButton
                  active={activeTab === "customer"}
                  onClick={() => setActiveTab("customer")}
                  label="Customer Details"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-[32px]">
          {activeTab === "assigned" && (
            <div className="w-full space-y-8">
              {/* Potential issues Section */}
              {null /* Issues moved to sliding footer alert */}

              {/* Assignment Summary */}
              <div className="space-y-6">
                <div className="text-sm">
                  <span className="font-medium text-[16px]">
                    1/1 employee assigned
                  </span>
                  <span className="text-gray-600 ml-2">
                    {" "}
                    (Jessica Gill today only)
                  </span>
                </div>

                <EmployeeCard
                  name="Jessica Gill"
                  img="https://images.unsplash.com/photo-1713947506697-4bdb5b85ef17?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0JTIwZmFjZSUyMG9mZmljZSUyMHdvcmtlcnxlbnwxfHx8fDE3Njg5MjExMjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                />

                <div>
                  <div className="mb-3 text-gray-700 text-base">
                    Shadow employee assigned
                  </div>
                  <EmployeeCard
                    name="Adriana Janowski"
                    isShadow
                    img="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Area with Sliding Alert */}
        <div className="relative flex-shrink-0">
          <AnimatePresence>
            {showFooterAlert && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 180,
                }}
                className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] z-[110]"
              >
                <div className="p-8 max-h-[70vh] overflow-y-auto">
                  <div className="flex justify-between items-start mb-6">
                    <h4 className="text-[18px] font-bold text-gray-900">
                      {hasBlockers
                        ? "This change can't be saved"
                        : type === "past_visits_only"
                        ? "Confirm past visit edits"
                        : "Assignment conflict"}
                    </h4>
                    <button
                      onClick={() => setShowFooterAlert(false)}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-6 mb-8">
                    {hasBlockers && (
                      <div className="space-y-4">
                        <div className="bg-red-50 px-4 py-4 border border-red-200 rounded-[8px]">
                          <div className="flex items-center gap-3 mb-4">
                            <BlockingIcon className="w-5 h-5 text-[#e31a1a]" />
                            <span className="text-[16px] font-bold text-red-900">
                              Blocking issues
                            </span>
                          </div>
                          <div className="pl-2">
                            <ul className="space-y-3 text-[16px] text-gray-900 leading-relaxed list-disc pl-5">
                              <li>
                                <span>
                                  <span className="font-bold">
                                    Jessica Gill
                                  </span>{" "}
                                  does not have a valid contract
                                </span>
                              </li>
                              {type === "all" && (
                                <>
                                  <li>
                                    <span>
                                      <span className="font-bold">
                                        Jessica Gill
                                      </span>{" "}
                                      is an Excluded Carer for
                                      Anthony Dobson
                                    </span>
                                  </li>
                                  <li>
                                    <span>
                                      Morning Visit with Anthony Dobson is in
                                      progress or completed
                                    </span>
                                  </li>
                                  <li>
                                    <span>
                                      Morning Visit with Anthony Dobson has
                                      been modified or verified in
                                      timesheets
                                    </span>
                                  </li>
                                </>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {type !== "past_visits_only" && (
                      <div className="space-y-4">
                        <div className="bg-amber-50 px-4 py-4 border border-amber-200 rounded-[8px]">
                          <div className="flex items-center gap-3 mb-4">
                            <CustomAlertIcon className="w-5 h-5 text-amber-500" />
                            <span className="text-[16px] font-bold text-amber-900">
                              Conflicts
                            </span>
                          </div>
                          <div className="pl-2">
                            <ul className="space-y-4 text-[16px] text-gray-900 leading-relaxed list-disc pl-5">
                              <li>
                                <div>
                                  <span className="font-bold">
                                    Jessica Gill
                                  </span>{" "}
                                  is not available for the following
                                  visits:
                                  <ul className="mt-2 space-y-1 ml-4 opacity-80 list-none">
                                    <li>
                                      • Morning Visit with Anthony Dobson —
                                      09:30–10:30
                                    </li>
                                  </ul>
                                </div>
                              </li>
                              {type === "all" && (
                                <>
                                  <li>
                                    <span>
                                      The contracted hours for{" "}
                                      <span className="font-bold">
                                        Jessica Gill
                                      </span>{" "}
                                      will exceed their limit (40
                                      hrs)
                                    </span>
                                  </li>
                                  <li>
                                    <span>
                                      Morning Visit with Anthony Dobson end
                                      time is in the past
                                    </span>
                                  </li>
                                </>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {(type === "past_visits_blocked" || type === "past_visits_conflict" || type === "past_visits_only") && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 px-4 py-4 border border-blue-200 rounded-[8px]">
                          <div className="flex items-center gap-3 mb-4">
                            <Info className="w-5 h-5 text-blue-600" />
                            <span className="text-[16px] font-bold text-blue-900">Check before saving</span>
                          </div>
                          <div className="pl-2">
                            <p className="text-[16px] text-gray-900 leading-relaxed">
                              <span className="font-bold">Morning Visit</span> will be changed in the past.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions removed as requested, main button now handles transitions */}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Actions Bar */}
          <div className="p-8 border-t border-gray-200 flex items-center justify-between bg-white relative z-[111]">
            <button className="text-gray-700 hover:text-gray-900 px-8 py-3 rounded-full bg-[#EDECF1] hover:bg-gray-200 transition-colors font-bold text-base cursor-pointer">
              Cancel visit
            </button>
            
            {/* Show two buttons when blockers exist and alert is showing */}
            {hasBlockers && showFooterAlert ? (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onClose();
                  }}
                  className="text-gray-700 hover:text-gray-900 px-8 py-3 rounded-full bg-[#EDECF1] hover:bg-gray-200 transition-colors font-bold text-base cursor-pointer"
                >
                  Close and discard changes
                </button>
                <button
                  onClick={() => {
                    setShowFooterAlert(false);
                  }}
                  className="bg-[#9a26d6] hover:bg-[#831eb8] text-white px-12 py-3 rounded-full transition-colors font-bold text-base cursor-pointer min-w-[160px]"
                >
                  Continue editing
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (showFooterAlert && !hasBlockers) {
                    onClose(); // Save anyway action
                  } else {
                    setShowFooterAlert(true);
                  }
                }}
                className="bg-[#9a26d6] hover:bg-[#831eb8] text-white px-12 py-3 rounded-full transition-colors font-bold text-base cursor-pointer min-w-[160px]"
              >
                {showFooterAlert && !hasBlockers
                  ? "Save anyway"
                  : "Save"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};