import { useEffect, useState } from "react";
import { createBrowserRouter } from "react-router";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Header } from './components/layout/TopNavBarLegacy';
import { CustomerInfo } from './components/layout/CustomerInfoNav';
import { EmployeeInfo } from './components/layout/EmployeeInfoNav';
import { RosteringLayout } from './components/customer/rostering/RosteringLayout';
import { EmployeeDetailsPage } from './components/employee/EmployeeDetailsPage';
import { EmployeeRecordsPage } from './components/employee/EmployeeRecordsPage';
import { CustomerDetailsPage } from './components/customer/CustomerDetailsPage';
import { CareNotes } from './components/customer/carenotes/CareNotes';
import { DocumentsPage } from './components/customer/documents/DocumentsPage';
import { CarePlanDocumentProvider, CarePlanDocumentSubnav, CarePlanDocumentContent } from './components/customer/documents/CarePlanDocumentPage';
import { RecordingDocumentPage } from './components/customer/documents/RecordingDocumentPage';
import { WiitmDocumentProvider, WiitmDocumentSubnav, WiitmDocumentContent } from './components/customer/documents/WhatIsImportantToMeDocumentPage';
import { PersonalCareDocumentProvider, PersonalCareDocumentSubnav, PersonalCareDocumentContent } from './components/customer/documents/PersonalCareMovingHandlingDocumentPage';
import { CareManagementPage } from './components/customer/caremanagement/CareManagementPage';
import { CareManagementProvider } from './components/customer/caremanagement/CareManagementContext';
import { CareManagementSubnav } from './components/customer/caremanagement/CareManagementSubnav';
import { MARChart } from './components/customer/mar/MARChart';
import { SchedulePage } from './components/schedule/SchedulePage';
import { LandingPage } from './components/LandingPage';
import { CustomersListPage } from './components/customer/CustomersListPage';
import { AboutMePage, AboutMeSubnav, AboutMeProvider } from './components/customer/AboutMePage';
import { MedicalHistoryPage } from './components/customer/MedicalHistoryPage';
import { CareBridgePage, CareBridgeProvider, CareBridgeSubnav } from './components/customer/CareBridgePage';
import { AdminSettingsPage } from './components/admin/AdminSettingsPage';
import { TagsManagementPage } from './components/office/TagsManagementPage';
import { TagTypeDetailPage } from './components/office/TagTypeDetailPage';
import { OfficeProvider } from './components/office/OfficeContext';
import { OfficeSubnav } from './components/office/OfficeSubnav';
import { CustomerProvider } from './data/CustomerContext';
import SideNav from './components/layout/SideNav';
import TopNav from './components/layout/TopNav';
import { useNavMode } from './components/layout/NavModeContext';

// ─── Shared shell ──────────────────────────────────────────────────────────────

// Legacy mode drops the side rail entirely and goes back to the old
// single top-bar layout — that's what "legacy" meant before the new side
// nav existed, not just a different-looking top bar alongside the rail.
function LegacyAppShell({ infoBar, children }: { infoBar?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40">
        <Header />
        {infoBar}
      </div>
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
}

// Matches NavModeToggle's own SLIDE_MS — by the time that switch animation
// finishes and actually calls toggle(), the shell swap itself should feel
// like a continuation of the same motion, not a second separate delay.
const SHELL_CROSSFADE_MS = 150;

function renderShellFor(mode: 'new' | 'legacy', infoBar: React.ReactNode, children: React.ReactNode) {
  if (mode === 'legacy') {
    return <LegacyAppShell infoBar={infoBar}>{children}</LegacyAppShell>;
  }
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideNav />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-40">
          <TopNav appName="Office Name" />
          {infoBar}
        </div>
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function AppShell({ infoBar, children }: { infoBar?: React.ReactNode; children: React.ReactNode }) {
  const { mode } = useNavMode();
  // Rendered mode lags the real one by one crossfade — dips to opacity 0,
  // swaps which shell is actually mounted while invisible, then fades back
  // in. A true side-by-side dissolve isn't really possible here (the side
  // rail and the legacy top bar occupy different shapes of screen, and
  // overlapping them would mean mounting the page's own content twice at
  // once), so this is a quick fade-out/fade-in instead — fast enough that
  // it reads as one continuous crossfade rather than two separate steps.
  const [displayMode, setDisplayMode] = useState(mode);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (mode === displayMode) return;
    setVisible(false);
    const timer = setTimeout(() => {
      setDisplayMode(mode);
      setVisible(true);
    }, SHELL_CROSSFADE_MS);
    return () => clearTimeout(timer);
  }, [mode, displayMode]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${SHELL_CROSSFADE_MS}ms ease`,
      }}
    >
      {renderShellFor(displayMode, infoBar, children)}
    </div>
  );
}

// Legacy isolation shell — for component demos only
function IsolationShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 flex flex-col">
      <div className="sticky top-0 z-40">{children}</div>
      <div className="min-h-[300vh] max-w-[1600px] w-full mx-auto px-4 py-8 space-y-4">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ─── Page layouts ──────────────────────────────────────────────────────────────

function CustomerLayout() {
  return (
    <CustomerProvider>
      <AppShell infoBar={<CustomerInfo />}>
        <DndProvider backend={HTML5Backend}>
          <RosteringLayout />
        </DndProvider>
      </AppShell>
    </CustomerProvider>
  );
}

function CustomerDetailsLayout() {
  return (
    <CustomerProvider>
      <AppShell infoBar={<CustomerInfo />}>
        <CustomerDetailsPage />
      </AppShell>
    </CustomerProvider>
  );
}

function MedicalHistoryLayout() {
  return (
    <CustomerProvider>
      <AppShell infoBar={<CustomerInfo />}>
        <MedicalHistoryPage />
      </AppShell>
    </CustomerProvider>
  );
}

function CareManagementLayout() {
  return (
    <CustomerProvider>
      <CareManagementProvider>
        <AppShell infoBar={<><CustomerInfo /><CareManagementSubnav /></>}>
          <CareManagementPage />
        </AppShell>
      </CareManagementProvider>
    </CustomerProvider>
  );
}

function CareNotesLayout() {
  return (
    <CustomerProvider>
      <AppShell infoBar={<CustomerInfo />}>
        <CareNotes />
      </AppShell>
    </CustomerProvider>
  );
}

function DocumentsLayout() {
  return (
    <CustomerProvider>
      <AppShell infoBar={<CustomerInfo />}>
        <DocumentsPage />
      </AppShell>
    </CustomerProvider>
  );
}

function CarePlanDocumentLayout() {
  return (
    <CustomerProvider>
      <CareBridgeProvider>
        <CarePlanDocumentProvider>
          <AppShell infoBar={<><CustomerInfo /><CarePlanDocumentSubnav /></>}>
            <CarePlanDocumentContent />
          </AppShell>
        </CarePlanDocumentProvider>
      </CareBridgeProvider>
    </CustomerProvider>
  );
}

function RecordingDocumentLayout() {
  return (
    <CustomerProvider>
      <CareBridgeProvider>
        <AppShell infoBar={<CustomerInfo />}>
          <RecordingDocumentPage />
        </AppShell>
      </CareBridgeProvider>
    </CustomerProvider>
  );
}

// No CareBridgeProvider needed — this document manages its own linked-recording
// and field state locally, rather than through the Care Plan's shared context.
function WhatIsImportantToMeDocumentLayout() {
  return (
    <CustomerProvider>
      <WiitmDocumentProvider>
        <AppShell infoBar={<><CustomerInfo /><WiitmDocumentSubnav /></>}>
          <WiitmDocumentContent />
        </AppShell>
      </WiitmDocumentProvider>
    </CustomerProvider>
  );
}

function PersonalCareDocumentLayout() {
  return (
    <CustomerProvider>
      <PersonalCareDocumentProvider>
        <AppShell infoBar={<><CustomerInfo /><PersonalCareDocumentSubnav /></>}>
          <PersonalCareDocumentContent />
        </AppShell>
      </PersonalCareDocumentProvider>
    </CustomerProvider>
  );
}

function MARChartLayout() {
  return (
    <CustomerProvider>
      <AppShell infoBar={<CustomerInfo />}>
        <MARChart />
      </AppShell>
    </CustomerProvider>
  );
}

function AboutMeLayout() {
  return (
    <CustomerProvider>
      <AboutMeProvider>
        <AppShell infoBar={<><CustomerInfo /><AboutMeSubnav /></>}>
          <AboutMePage />
        </AppShell>
      </AboutMeProvider>
    </CustomerProvider>
  );
}

function CareBridgeLayout() {
  return (
    <CustomerProvider>
      <CareBridgeProvider>
        <AppShell infoBar={<><CustomerInfo /><CareBridgeSubnav /></>}>
          <CareBridgePage />
        </AppShell>
      </CareBridgeProvider>
    </CustomerProvider>
  );
}

function ScheduleLayout() {
  return (
    <AppShell>
      <SchedulePage />
    </AppShell>
  );
}

function OfficeLayout() {
  return (
    <OfficeProvider>
      <AppShell infoBar={<OfficeSubnav />}>
        <TagsManagementPage />
      </AppShell>
    </OfficeProvider>
  );
}

function TagTypeDetailLayout() {
  return (
    <AppShell>
      <TagTypeDetailPage />
    </AppShell>
  );
}

function EmployeeLayout() {
  return (
    <AppShell infoBar={<EmployeeInfo />}>
      <EmployeeDetailsPage />
    </AppShell>
  );
}

function EmployeeRecordsLayout() {
  return (
    <AppShell infoBar={<EmployeeInfo />}>
      <EmployeeRecordsPage />
    </AppShell>
  );
}

// ─── Routes ────────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  {
    path: "/",
    Component: () => <AppShell><LandingPage /></AppShell>,
  },
  {
    path: "/customers/list",
    Component: () => <AppShell><CustomersListPage /></AppShell>,
  },
  {
    path: "/admin",
    Component: () => <AppShell><AdminSettingsPage /></AppShell>,
  },
  {
    path: "/customers/:customerId",
    Component: CustomerLayout,
  },
  {
    path: "/customers/:customerId/carebridge",
    Component: CareBridgeLayout,
  },
  {
    path: "/customers/:customerId/aboutme",
    Component: AboutMeLayout,
  },
  {
    path: "/customers/:customerId/medicalhistory",
    Component: MedicalHistoryLayout,
  },
  {
    path: "/customers/:customerId/details",
    Component: CustomerDetailsLayout,
  },
  {
    path: "/customers/:customerId/caremanagement",
    Component: CareManagementLayout,
  },
  {
    path: "/customers/:customerId/carenotes",
    Component: CareNotesLayout,
  },
  {
    path: "/customers/:customerId/documents",
    Component: DocumentsLayout,
  },
  {
    path: "/customers/:customerId/documents/care-plan",
    Component: CarePlanDocumentLayout,
  },
  {
    path: "/customers/:customerId/documents/recording/:recordingId",
    Component: RecordingDocumentLayout,
  },
  {
    path: "/customers/:customerId/documents/wiitm",
    Component: WhatIsImportantToMeDocumentLayout,
  },
  {
    path: "/customers/:customerId/documents/personal-care",
    Component: PersonalCareDocumentLayout,
  },
  {
    path: "/customers/:customerId/marchart",
    Component: MARChartLayout,
  },
  {
    path: "/employees",
    Component: EmployeeLayout,
  },
  {
    path: "/employees/records",
    Component: EmployeeRecordsLayout,
  },
  {
    path: "/schedule",
    Component: ScheduleLayout,
  },
  {
    path: "/office/tags",
    Component: OfficeLayout,
  },
  {
    path: "/office/tags/:tagTypeId",
    Component: TagTypeDetailLayout,
  },
  // ─── Component isolation demos ───────────────────────────────────────────────
  {
    path: "/components/new-nav",
    Component: () => (
      <div className="flex min-h-screen bg-gray-50">
        <SideNav />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav appName="Office Name" />
          <div className="px-4 py-8 space-y-4 min-h-[300vh]">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg max-w-[1600px] mx-auto w-full" />
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    path: "/components/top-nav-bar",
    Component: () => <IsolationShell><Header /></IsolationShell>,
  },
  {
    path: "/components/customer-info-nav",
    Component: () => <IsolationShell><Header /><CustomerInfo withSlideOffset /></IsolationShell>,
  },
  {
    path: "/components/employee-info-nav",
    Component: () => <IsolationShell><Header /><EmployeeInfo withSlideOffset /></IsolationShell>,
  },
  {
    path: "/components/care-management-subnav",
    Component: () => (
      <CareManagementProvider>
        <IsolationShell><Header /><CustomerInfo withSlideOffset /><CareManagementSubnav /></IsolationShell>
      </CareManagementProvider>
    ),
  },
]);
