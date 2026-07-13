import { createBrowserRouter } from "react-router";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Header } from './components/layout/Header';
import { CustomerInfo } from './components/layout/CustomerInfo';
import { EmployeeInfo } from './components/layout/EmployeeInfo';
import { RosteringLayout } from './components/rostering/RosteringLayout';
import { EmployeeDetailsPage } from './components/employee/EmployeeDetailsPage';
import { EmployeeRecordsPage } from './components/employee/EmployeeRecordsPage';
import { CustomerDetailsPage } from './components/customer/CustomerDetailsPage';
import { CareNotes } from './components/carenotes/CareNotes';
import { DocumentsPage } from './components/documents/DocumentsPage';
import { CareManagementPage } from './components/caremanagement/CareManagementPage';
import { CareManagementProvider } from './components/caremanagement/CareManagementContext';
import { CareManagementSubnav } from './components/caremanagement/CareManagementSubnav';
import { MARChart } from './components/mar/MARChart';
import { SchedulePage } from './components/schedule/SchedulePage';

function CustomerLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-0 z-40">
        <Header />
        <CustomerInfo />
      </div>
      <DndProvider backend={HTML5Backend}>
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6">
          <RosteringLayout />
        </main>
      </DndProvider>
    </div>
  );
}

function CustomerDetailsLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-0 z-40">
        <Header />
        <CustomerInfo />
      </div>
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6">
        <CustomerDetailsPage />
      </main>
    </div>
  );
}

function CareManagementLayout() {
  return (
    <CareManagementProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="sticky top-0 z-40">
          <Header />
          <CustomerInfo />
          <CareManagementSubnav />
        </div>
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6">
          <CareManagementPage />
        </main>
      </div>
    </CareManagementProvider>
  );
}

function CareNotesLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-0 z-40">
        <Header />
        <CustomerInfo />
      </div>
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6">
        <CareNotes />
      </main>
    </div>
  );
}

function DocumentsLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-0 z-40">
        <Header />
        <CustomerInfo />
      </div>
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6">
        <DocumentsPage />
      </main>
    </div>
  );
}

function MARChartLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-0 z-40">
        <Header />
        <CustomerInfo />
      </div>
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6">
        <MARChart />
      </main>
    </div>
  );
}

function ScheduleLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-0 z-40">
        <Header />
      </div>
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6">
        <SchedulePage />
      </main>
    </div>
  );
}

function EmployeeLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-0 z-40">
        <Header />
        <EmployeeInfo />
      </div>
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6">
        <EmployeeDetailsPage />
      </main>
    </div>
  );
}

function EmployeeRecordsLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-0 z-40">
        <Header />
        <EmployeeInfo />
      </div>
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6">
        <EmployeeRecordsPage />
      </main>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: CustomerLayout,
  },
  {
    path: "/customers",
    Component: CustomerLayout,
  },
  {
    path: "/customers/details",
    Component: CustomerDetailsLayout,
  },
  {
    path: "/customers/caremanagement",
    Component: CareManagementLayout,
  },
  {
    path: "/customers/carenotes",
    Component: CareNotesLayout,
  },
  {
    path: "/customers/documents",
    Component: DocumentsLayout,
  },
  {
    path: "/customers/marchart",
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
]);