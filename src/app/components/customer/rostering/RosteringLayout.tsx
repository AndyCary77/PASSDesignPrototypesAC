import { useState } from 'react';
import { HandCoins, CheckCircle2, FileEdit, Users } from 'lucide-react';
import { CareRequirementsPage } from './CareRequirementsPage';
import { ServiceAgreementPage } from '../ServiceAgreementPage';
import { useCustomer } from '../../../data/CustomerContext';

type RosteringSection = 'funders' | 'care-requirements' | 'service-agreement' | 'funder-allocation';

const sectionLabels: Record<RosteringSection, string> = {
  'funders': 'Funders',
  'care-requirements': 'Care requirements',
  'service-agreement': 'Service agreement',
  'funder-allocation': 'Funder allocation',
};

export function RosteringLayout() {
  const customer = useCustomer();
  // New enquiry customers land on the Service agreement (where their planned visits live);
  // established customers open on Care requirements as before.
  const [activeSection, setActiveSection] = useState<RosteringSection>(
    customer.hasCarePlan ? 'care-requirements' : 'service-agreement'
  );

  return (
    <div className="flex flex-col">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-900 font-semibold">Rostering</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">{sectionLabels[activeSection]}</span>
        </div>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="flex-shrink-0">
          <ul className="flex flex-col gap-2 min-w-[200px]">
            <NavItem
              icon={<HandCoins className="w-5 h-5" />}
              label="Funders"
              active={activeSection === 'funders'}
              onClick={() => setActiveSection('funders')}
            />
            <NavItem
              icon={<CheckCircle2 className="w-5 h-5" />}
              label="Care requirements"
              active={activeSection === 'care-requirements'}
              onClick={() => setActiveSection('care-requirements')}
            />
            <NavItem
              icon={<FileEdit className="w-5 h-5" />}
              label="Service agreement"
              active={activeSection === 'service-agreement'}
              onClick={() => setActiveSection('service-agreement')}
            />
            <NavItem
              icon={<Users className="w-5 h-5" />}
              label="Funder allocation"
              active={activeSection === 'funder-allocation'}
              onClick={() => setActiveSection('funder-allocation')}
            />
          </ul>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeSection === 'care-requirements' && <CareRequirementsPage />}
          {activeSection === 'service-agreement' && <ServiceAgreementPage />}
          {(activeSection === 'funders' || activeSection === 'funder-allocation') && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">
              {sectionLabels[activeSection]} — coming soon
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <li
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors rounded-lg ${
        active
          ? 'text-black'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
      style={active ? { backgroundColor: 'rgba(220, 217, 228, 0.5)' } : undefined}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </li>
  );
}
