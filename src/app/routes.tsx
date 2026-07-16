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
import { CareManagementPage } from './components/customer/caremanagement/CareManagementPage';
import { CareManagementProvider } from './components/customer/caremanagement/CareManagementContext';
import { CareManagementSubnav } from './components/customer/caremanagement/CareManagementSubnav';
import { MARChart } from './components/customer/mar/MARChart';
import { SchedulePage } from './components/schedule/SchedulePage';
import { LandingPage } from './components/LandingPage';
import { CustomersListPage } from './components/customer/CustomersListPage';
import { AboutMePage, AboutMeSubnav } from './components/customer/AboutMePage';
import { CareBridgePage, CareBridgeProvider, CareBridgeSubnav } from './components/customer/CareBridgePage';
import { CustomerProvider, useCustomer } from './data/CustomerContext';
import { EnquiryEmptyState } from './components/customer/EnquiryEmptyState';
import SideNav from './components/layout/SideNav';
import TopNav from './components/layout/TopNav';

// ─── Shared shell ──────────────────────────────────────────────────────────────

function AppShell({ infoBar, children }: { infoBar?: React.ReactNode; children: React.ReactNode }) {
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

// Renders the tab content for an established customer, or an "assessment stage"
// empty state for a new (post-enquiry) customer who has no care plan yet.
function Gated({ tabLabel, children }: { tabLabel: string; children: React.ReactNode }) {
  const customer = useCustomer();
  return customer.hasCarePlan ? <>{children}</> : <EnquiryEmptyState tabLabel={tabLabel} />;
}

function CustomerLayout() {
  return (
    <CustomerProvider>
      <AppShell infoBar={<CustomerInfo />}>
        <Gated tabLabel="rostering">
          <DndProvider backend={HTML5Backend}>
            <RosteringLayout />
          </DndProvider>
        </Gated>
      </AppShell>
    </CustomerProvider>
  );
}

function CustomerDetailsLayout() {
  return (
    <CustomerProvider>
      <AppShell infoBar={<CustomerInfo />}>
        <Gated tabLabel="details"><CustomerDetailsPage /></Gated>
      </AppShell>
    </CustomerProvider>
  );
}

function CareManagementLayout() {
  return (
    <CustomerProvider>
      <CareManagementProvider>
        <AppShell infoBar={<><CustomerInfo /><CareManagementSubnav /></>}>
          <Gated tabLabel="care management"><CareManagementPage /></Gated>
        </AppShell>
      </CareManagementProvider>
    </CustomerProvider>
  );
}

function CareNotesLayout() {
  return (
    <CustomerProvider>
      <AppShell infoBar={<CustomerInfo />}>
        <Gated tabLabel="care notes"><CareNotes /></Gated>
      </AppShell>
    </CustomerProvider>
  );
}

function DocumentsLayout() {
  return (
    <CustomerProvider>
      <AppShell infoBar={<CustomerInfo />}>
        <Gated tabLabel="documents"><DocumentsPage /></Gated>
      </AppShell>
    </CustomerProvider>
  );
}

function MARChartLayout() {
  return (
    <CustomerProvider>
      <AppShell infoBar={<CustomerInfo />}>
        <Gated tabLabel="MAR chart"><MARChart /></Gated>
      </AppShell>
    </CustomerProvider>
  );
}

function AboutMeLayout() {
  return (
    <CustomerProvider>
      <AppShell infoBar={<><CustomerInfo /><AboutMeSubnav /></>}>
        <Gated tabLabel="About Me"><AboutMePage /></Gated>
      </AppShell>
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
