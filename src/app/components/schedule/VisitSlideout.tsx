import { useState } from 'react';
import { X, Calendar, ChevronDown, EllipsisVertical, CheckCircle2, Coffee, Utensils, Pill, PhoneCall, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router';
import { Tag } from '../ui/tag';
import { VisitNoteIcon } from '../icons/VisitNoteIcon';
import { PencilSolidIcon } from '../icons/PencilSolidIcon';
import davidPhoto from '../../imports/david_b.jpg';
import customerPhoto from '../../imports/david_f.jpg';

const TABS = ['Assigned Today', 'Recurring Employees', 'Care Required', 'History', 'Customer Details'];

const FOOTER_BLOCKING = [
  {
    tags: ['Medical Condition – PEG Feeding'],
    category: 'Mandatory Requirement',
    reason: "not in David Bukowski's Skills or Work Criteria",
  },
];

const FOOTER_CONFLICTS = [
  {
    tags: ['Dog', 'Smoker'],
    category: 'Environment',
    reason: "conflicts with David Bukowski's Restriction",
  },
];

function FooterTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center self-start px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap"
      style={{ backgroundColor: 'rgb(220, 217, 228)', color: '#374151' }}
    >
      {children}
    </span>
  );
}

export function VisitSlideout({ onClose, initialTab = 'Care Required', footerWarning, footerConflicts }: {
  onClose: () => void;
  initialTab?: string;
  footerWarning?: string;
  footerConflicts?: boolean;
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [saveBlocked, setSaveBlocked] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const dismissPanel = () => { setSaveBlocked(false); setConfirming(false); };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex justify-end">
      <div className="bg-white w-3/4 max-w-[1250px] h-full shadow-2xl flex flex-col overflow-hidden relative">

        {/* Visit Header */}
        <div className="border-b border-gray-200">
          <div className="pt-6 pb-6 px-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold">Morning Visit with Arthur Barrington</h2>
                <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded">Pending</span>
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

            <div className="flex items-center gap-6">
              <div
                className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0"
                style={{ backgroundImage: `url(${customerPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              />
              <div className="flex-1 flex items-end gap-6 flex-wrap">
                <div className="flex flex-col items-start gap-1">
                  <div className="text-xs text-gray-500">Customer</div>
                  <button className="text-[#5c1c85] hover:underline cursor-pointer">Arthur Barrington</button>
                </div>
                <div>Morning Visit</div>
                <div className="flex items-center gap-2 text-sm">
                  <span>Tue 16th Dec</span>
                  <button className="text-gray-400 hover:text-gray-600 cursor-pointer">
                    <PencilSolidIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>09:30 – 11:30</span>
                  <span className="text-gray-500">(2hr 00m)</span>
                  <button className="text-gray-400 hover:text-gray-600 cursor-pointer">
                    <PencilSolidIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" aria-hidden="true" />
                  <span>Daily</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" aria-hidden="true" />
                </div>
                <div className="flex items-center ml-auto">
                  <button className="flex items-center gap-1.5 text-gray-600 hover:bg-gray-100 border border-gray-400 px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer font-medium text-sm">
                    <VisitNoteIcon className="w-4 h-4" /> Visit Note
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex justify-between px-8">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-4 transition-colors cursor-pointer border-b-2 ${
                  activeTab === tab ? 'text-[#5c1c85]' : 'text-gray-600 hover:text-gray-900'
                }`}
                style={{
                  fontWeight: 500,
                  borderBottomColor: activeTab === tab ? 'rgb(154, 38, 214)' : 'transparent',
                }}
              >
                <span className="relative inline-block">
                  {tab}
                  {tab === 'Recurring Employees' && (
                    <span className="absolute -top-1 -right-2 w-2 h-2 bg-[#5c1c85] rounded-full" />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
          {activeTab === 'Assigned Today' && <AssignedTodayContent />}
          {activeTab === 'Care Required' && <CareRequiredContent />}
          {activeTab !== 'Assigned Today' && activeTab !== 'Care Required' && (
            <p className="text-gray-400 text-sm italic">Content not shown in this prototype.</p>
          )}
        </div>

        {/* Footer warning — simple bar */}
        {footerWarning && (
          <div className="border-t border-amber-200 bg-amber-50 px-8 py-3 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-800">{footerWarning}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 flex items-center justify-between bg-white px-8 py-6">
          <button
            className="text-gray-600 hover:text-gray-800 px-6 py-2.5 rounded-full cursor-pointer font-semibold"
            style={{ backgroundColor: 'rgb(237, 236, 241)' }}
          >
            Cancel visit
          </button>
          <button
            onClick={() => { if (footerConflicts) setSaveBlocked(true); }}
            className="bg-[rgb(154,38,214)] hover:bg-[rgb(134,28,194)] text-white px-8 py-2.5 rounded-full transition-colors cursor-pointer font-semibold"
          >
            Save
          </button>
        </div>

        {/* Slide-up conflicts panel */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-white shadow-[0_-8px_32px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-in-out ${
            saveBlocked ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-8 pt-6 pb-4 border-b border-gray-100">
            <div>
              {confirming ? (
                <>
                  <h3 className="text-lg font-bold text-gray-900">Are you sure?</h3>
                  <p className="text-sm text-gray-500 mt-0.5">You are about to assign <strong className="text-gray-700">David Bukowski</strong> to <strong className="text-gray-700">Arthur Barrington</strong> despite the conflicts listed below. This action will be recorded.</p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-gray-900">This change can't be saved</h3>
                  <p className="text-sm text-gray-500 mt-0.5"><strong className="text-gray-700">David Bukowski</strong> cannot be assigned to this visit due to the following issues.</p>
                </>
              )}
            </div>
            <button
              onClick={dismissPanel}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Panel content */}
          <div className="px-8 py-5 space-y-4 overflow-y-auto max-h-[40vh]">
            {confirming ? (
              <div className="bg-red-50 border border-red-200 rounded-[8px] px-4 py-4">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-base font-bold text-red-900">Overriding the following conflicts</span>
                </div>
                <ul className="space-y-4">
                  {[...FOOTER_BLOCKING, ...FOOTER_CONFLICTS].map((conflict, i) => {
                    const reason = conflict.tags.length > 1
                      ? conflict.reason.replace('Restriction', 'Restrictions')
                      : conflict.reason;
                    return (
                      <li key={i} className="flex flex-col gap-1">
                        <div className="flex flex-wrap gap-2">
                          {conflict.tags.map((tag, j) => <FooterTag key={j}>{tag}</FooterTag>)}
                        </div>
                        <span className="text-sm text-gray-700 leading-relaxed">
                          <span className="font-semibold">{conflict.category}</span>: {reason}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-[8px] px-4 py-4">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <span className="text-base font-bold text-amber-900">Conflicts</span>
                </div>
                <ul className="space-y-4">
                  {[...FOOTER_BLOCKING, ...FOOTER_CONFLICTS].map((conflict, i) => {
                    const reason = conflict.tags.length > 1
                      ? conflict.reason.replace('Restriction', 'Restrictions')
                      : conflict.reason;
                    return (
                      <li key={i} className="flex flex-col gap-1">
                        <div className="flex flex-wrap gap-2">
                          {conflict.tags.map((tag, j) => <FooterTag key={j}>{tag}</FooterTag>)}
                        </div>
                        <span className="text-sm text-gray-700 leading-relaxed">
                          <span className="font-semibold">{conflict.category}</span>: {reason}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Panel footer */}
          <div className="border-t border-gray-200 flex items-center justify-between px-8 py-6">
            <button
              className="text-gray-600 hover:text-gray-800 px-6 py-2.5 rounded-full cursor-pointer font-semibold"
              style={{ backgroundColor: 'rgb(237, 236, 241)' }}
            >
              Cancel visit
            </button>
            <div className="flex items-center gap-3">
              {confirming ? (
                <>
                  <button
                    onClick={() => setConfirming(false)}
                    className="text-gray-600 hover:text-gray-800 px-6 py-2.5 rounded-full cursor-pointer font-semibold"
                    style={{ backgroundColor: 'rgb(237, 236, 241)' }}
                  >
                    Back
                  </button>
                  <button
                    onClick={onClose}
                    className="bg-[rgb(154,38,214)] hover:bg-[rgb(134,28,194)] text-white px-8 py-2.5 rounded-full transition-colors cursor-pointer font-semibold"
                  >
                    Confirm Assignment
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={dismissPanel}
                    className="bg-[rgb(154,38,214)] hover:bg-[rgb(134,28,194)] text-white px-6 py-2.5 rounded-full cursor-pointer font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setConfirming(true)}
                    className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-2.5 rounded-full cursor-pointer font-semibold transition-colors"
                  >
                    Override and Assign
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssignedTodayContent() {
  return (
    <div className="space-y-4">
      <div>
        <span className="font-semibold text-base">1/1 employee assigned</span>
        <span className="text-gray-500 text-sm ml-2">(Adrianna Janowski today only)</span>
      </div>

      <EmployeeCard title="Mrs" name="Adrianna Janowski" type="Fixed hours" photo="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" />

      <p className="text-sm text-gray-600">Shadow employee assigned</p>

      <EmployeeCard title="Mr" name="David Bukowski" type="Fixed hours" photo={davidPhoto} />
    </div>
  );
}

function EmployeeCard({ title, name, type, photo }: { title: string; name: string; type: string; photo: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0"
        style={{ backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      <div className="flex-1 flex items-end gap-8">
        <div className="w-[180px]">
          <div className="text-gray-500 text-sm">{title}</div>
          <div className="font-semibold">{name}</div>
        </div>
        <div>
          <div className="text-gray-500 text-sm">Type</div>
          <div>{type}</div>
        </div>
      </div>
      <button className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
        <EllipsisVertical className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  );
}

const CARE_TASKS = [
  {
    id: 'general-daily',
    name: 'General Daily Tasks',
    iconBg: 'bg-[rgb(150,140,175)]',
    Icon: CheckCircle2,
    description: "Carers to support with laundry, please ask my wife Gill what she would like to go in or be taken out, if there is washing to come out this can then be hung to dry. Please change mine and my wife's bed once a week on a Monday. Make the beds each morning, my own and my wife's. Check to see if there is any ironing that needs doing, there will be my bedding that needs ironing on a Tuesday. Empty and restack the dishwasher as required and clean the kitchen sides. Please check my toilet and bathroom to make sure they are clean. My toilet will need cleaning on every visit, there are cleaning supplies next to it. Go to the shops if there is anything that we have ran out of, my wife may also go with you. We have shopping delivered, which my wife orders online, we will try to have this delivered at the time the carer is there if the carer could help put this away. Put hoover round as needed and mop kitchen floors at every visit. Take any rubbish out to the main bin. Please document tasks that have been completed.",
  },
  {
    id: 'drinks',
    name: 'Drinks',
    iconBg: 'bg-[rgb(92,168,229)]',
    Icon: Coffee,
    description: 'Please make myself and Gill a drink of our choice to have with our breakfast we both like either tea or coffee. Please also make us a drink of our choice at lunch. We will also have water but if you could offer us drinks a couple of times throughout the visits here with us as we need to be encouraged to drink more.',
  },
  {
    id: 'wellbeing',
    name: 'Wellbeing',
    iconBg: 'bg-[rgb(150,140,175)]',
    Icon: CheckCircle2,
    description: 'Please always record my physical and emotional well being. If you have any concerns regarding my health and well being or there is a change in my care and support, please record it in the notes and report it to the office or on call.',
  },
  {
    id: 'breakfast',
    name: 'Breakfast',
    iconBg: 'bg-[rgb(148,170,75)]',
    Icon: Utensils,
    description: "Please check if I have had my breakfast. If I haven't eaten I will require the care worker to make me my breakfast. I will be able to tell you what I would like. Please document what I have had.",
  },
  {
    id: 'finasteride',
    name: 'Finasteride 5mg tablets',
    iconBg: 'bg-[rgb(242,109,109)]',
    Icon: Pill,
    description: 'Please administer from blister pack. Arthur takes one tablet each morning. Finasteride is used to treat an enlarged prostate (benign prostate enlargement) and is only available on prescription. Serious side effects are rare and happen in less than 1 in 1,000 people. Call your doctor or call 111 now if you get: any lumps, pain or swelling in your chest area or discharge from your nipples.',
    medDetails: { form: 'Tablet', route: 'Oral', dosage: '1xAM', controlCategory: 'N/A', location: 'In blister pack, in lounge', supportRequired: 'Administer', schedule: '–' },
  },
  {
    id: 'tamsulosin',
    name: 'Tamsulosin 400microgram modified-release capsules',
    iconBg: 'bg-[rgb(242,109,109)]',
    Icon: Pill,
    description: 'Please administer from blister pack. Tamsulosin is used to treat difficulties passing urine caused by an enlarged prostate. Arthur takes one capsule each morning after breakfast.',
    medDetails: { form: 'Capsule', route: 'Oral', dosage: '1xAM', controlCategory: 'N/A', location: 'In blister pack, in lounge', supportRequired: 'Administer', schedule: '–' },
  },
  {
    id: 'sotalol',
    name: 'Sotalol 40mg tablets',
    iconBg: 'bg-[rgb(242,109,109)]',
    Icon: Pill,
    description: 'Please administer from blister pack. Sotalol is used to treat an irregular heartbeat (arrhythmia). Arthur takes one tablet in the morning and one in the evening. Do not crush or chew.',
    medDetails: { form: 'Tablet', route: 'Oral', dosage: '1xAM, 1xPM', controlCategory: 'N/A', location: 'In blister pack, in bedroom', supportRequired: 'Administer', schedule: '–' },
  },
  {
    id: 'clopidogrel',
    name: 'Clopidogrel 75mg tablets',
    iconBg: 'bg-[rgb(242,109,109)]',
    Icon: Pill,
    description: 'Please administer from blister pack. Clopidogrel is used to prevent blood clots. Arthur takes one tablet each morning. Report any unusual bleeding or bruising to the office immediately.',
    medDetails: { form: 'Tablet', route: 'Oral', dosage: '1xAM', controlCategory: 'N/A', location: 'In blister pack, in lounge', supportRequired: 'Administer', schedule: '–' },
  },
  {
    id: 'ramipril',
    name: 'Ramipril 10mg capsules',
    iconBg: 'bg-[rgb(242,109,109)]',
    Icon: Pill,
    description: 'Please administer from blister pack. Ramipril is used to treat high blood pressure and heart failure. Arthur takes one capsule each morning. Monitor for dizziness when standing.',
    medDetails: { form: 'Capsule', route: 'Oral', dosage: '1xAM', controlCategory: 'N/A', location: 'In blister pack, in lounge', supportRequired: 'Administer', schedule: '–' },
  },
  {
    id: 'duloxetine',
    name: 'Duloxetine 30mg gastro-resistant capsules',
    iconBg: 'bg-[rgb(242,109,109)]',
    Icon: Pill,
    description: 'Please administer from blister pack. Duloxetine is used to treat depression and anxiety. Arthur takes one capsule each morning. Do not crush or chew. Report any changes in mood or behaviour to the office.',
    medDetails: { form: 'Capsule', route: 'Oral', dosage: '1xAM', controlCategory: 'N/A', location: 'In blister pack, in bedroom', supportRequired: 'Administer', schedule: '–' },
  },
  {
    id: 'lifeline',
    name: 'Lifeline',
    iconBg: 'bg-[rgb(150,140,175)]',
    Icon: PhoneCall,
    description: 'Check that the lifeline pendant is charged and in working order. Ensure the customer is wearing it or it is within easy reach at all times during the visit.',
  },
];

function CareRequiredContent() {
  return (
    <div className="grid gap-y-6 gap-x-20 items-start" style={{ gridTemplateColumns: '30% 1fr' }}>
      {/* Left: scheduling constraints */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Care Requirements</p>
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200 relative">
          <Link
            to="/customers/list"
            className="absolute top-3 right-3 p-2 text-gray-600 hover:text-gray-900 rounded-full border border-gray-200 transition-colors"
            style={{ backgroundColor: 'rgb(220, 217, 228)' }}
            aria-label="Edit care requirements"
          >
            <PencilSolidIcon className="w-4 h-4" />
          </Link>
          <CareSection
            title="Mandatory"
            items={[{ label: 'Area', value: 'Sutton Coldfield' }]}
          />
          <CareSection
            title="Preferred"
            items={[
              { label: 'Medical Conditions', value: 'Glaucoma' },
              { label: 'Medical Conditions', value: 'Hypertension' },
              { label: 'Medical Conditions', value: 'Stroke' },
            ]}
          />
          <CareSection
            title="Preferred Employees"
            items={[{ label: 'Claire Restall', variant: 'preferred' }]}
          />
          <CareSection
            title="Excluded Careworkers"
            items={[{ label: 'John Smith', variant: 'excluded' }]}
          />
          <CareSection
            title="Environment"
            items={[{ label: 'Other pets' }, { label: 'Smoker' }, { label: 'Stairs' }]}
          />
        </div>
      </div>

      {/* Right: visit care tasks */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Visit Care Tasks</p>
        <div className="space-y-0">
          {CARE_TASKS.map((task) => (
            <TaskAccordion key={task.id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CareSection({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value?: string; variant?: 'preferred' | 'excluded' }>;
}) {
  return (
    <div className="px-4 py-3">
      <p className="text-xs font-medium text-gray-500 mb-2">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.length > 0 ? (
          items.map((item, index) => (
            <Tag key={index} label={item.label} value={item.value} variant={item.variant} />
          ))
        ) : (
          <span className="text-gray-400 text-sm italic">None specified</span>
        )}
      </div>
    </div>
  );
}

function TaskAccordion({ task }: { task: typeof CARE_TASKS[number] }) {
  const [open, setOpen] = useState(false);
  const { name, iconBg, Icon, description, medDetails } = task as typeof CARE_TASKS[number] & { medDetails?: { form: string; route: string; dosage: string; controlCategory: string; location: string; supportRequired: string; schedule: string } };

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 py-3 hover:bg-gray-100 transition-colors text-left"
      >
        <ChevronDown
          className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-base font-semibold text-gray-900">{name}</span>
      </button>

      {open && (
        <div className="bg-white mb-2 border border-gray-200 rounded-lg overflow-hidden">
          {medDetails ? (
            <div className="p-6 space-y-0">
              {/* Medication details group 1 */}
              <MedRow label="Form" value={medDetails.form} />
              <MedRow label="Route" value={medDetails.route} />
              <MedRow label="Dosage" value={medDetails.dosage} />
              <MedRow label="Control category" value={medDetails.controlCategory} />
              <MedRow label="Location" value={medDetails.location} last />
              {/* Group 2 */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <MedRow label="Support required" value={medDetails.supportRequired} />
                <MedRow label="Schedule" value={medDetails.schedule} last />
              </div>
              {/* Description */}
              <div className="border-t border-gray-200 pt-4 mt-4 flex gap-8">
                <span className="text-sm font-semibold text-gray-700 w-40 flex-shrink-0">Description</span>
                <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
              </div>
            </div>
          ) : (
            <div className="p-6 flex gap-8">
              <span className="text-sm font-semibold text-gray-700 w-28 flex-shrink-0">Description</span>
              <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MedRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex gap-8 py-2 ${!last ? 'border-b border-gray-100' : ''}`}>
      <span className="text-sm font-semibold text-gray-700 w-40 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-700">{value}</span>
    </div>
  );
}
