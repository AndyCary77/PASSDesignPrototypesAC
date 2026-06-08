import { createBrowserRouter } from "react-router";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Header } from './components/layout/Header';
import { CustomerInfo } from './components/layout/CustomerInfo';
import { EmployeeInfo } from './components/layout/EmployeeInfo';
import { RosteringLayout } from './components/rostering/RosteringLayout';
import { EmployeeDetailsPage } from './components/employee/EmployeeDetailsPage';
import { CustomerDetailsPage } from './components/customer/CustomerDetailsPage';
import { SchedulePage } from './components/schedule/SchedulePage';

function CustomerLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <CustomerInfo />
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
      <Header />
      <CustomerInfo />
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6">
        <CustomerDetailsPage />
      </main>
    </div>
  );
}

function ScheduleLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6">
        <SchedulePage />
      </main>
    </div>
  );
}

function EmployeeLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <EmployeeInfo />
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6">
        <EmployeeDetailsPage />
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
    path: "/employees",
    Component: EmployeeLayout,
  },
  {
    path: "/schedule",
    Component: ScheduleLayout,
  },
]);