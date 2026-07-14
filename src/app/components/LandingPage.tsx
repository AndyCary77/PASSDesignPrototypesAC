import { Link } from 'react-router';
import { Header } from './layout/TopNavBar';

const SCREENS = [
  {
    title: 'Customer Profile',
    items: [
      { label: 'Rostering — Care Requirements & Service Agreement', to: '/customers' },
      { label: 'Care Management — Outcomes, Tasks, Visits & Care Groups', to: '/customers/caremanagement' },
      { label: 'Care Notes', to: '/customers/carenotes' },
      { label: 'Documents', to: '/customers/documents' },
      { label: 'MAR Chart', to: '/customers/marchart' },
      { label: 'Customer Details', to: '/customers/details' },
    ],
  },
  {
    title: 'Employee Profile',
    items: [
      { label: 'Employee Profile — Roster Matching', to: '/employees' },
      { label: 'Employee Records', to: '/employees/records' },
    ],
  },
  {
    title: 'Schedule',
    items: [
      { label: 'Schedule', to: '/schedule' },
    ],
  },
];

const COMPONENTS = [
  {
    title: 'Layout',
    items: [
      { label: 'Top Nav Bar', to: '/components/top-nav-bar' },
      { label: 'Customer Info Nav', to: '/components/customer-info-nav' },
      { label: 'Employee Info Nav', to: '/components/employee-info-nav' },
      { label: 'Care Management Sub-nav', to: '/components/care-management-subnav' },
    ],
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-0 z-40">
        <Header />
      </div>
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-8 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Roster &amp; Schedule — Prototypes
        </h1>
        <div className="flex gap-6 items-start">
          <div className="bg-white rounded-[10px] border border-gray-200 p-8 flex-1 max-w-2xl">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Screens</h2>
            <div className="space-y-8">
              {SCREENS.map(section => (
                <div key={section.title}>
                  <p className="text-xs font-semibold text-gray-500 mb-2">{section.title}</p>
                  <ul className="space-y-1.5">
                    {section.items.map(item => (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          className="text-sm text-[rgb(109,27,152)] hover:text-[rgb(154,38,214)] hover:underline transition-colors"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[10px] border border-gray-200 p-8 w-72">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Components</h2>
            <div className="space-y-8">
              {COMPONENTS.map(section => (
                <div key={section.title}>
                  <p className="text-xs font-semibold text-gray-500 mb-2">{section.title}</p>
                  <ul className="space-y-1.5">
                    {section.items.map(item => (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          className="text-sm text-[rgb(109,27,152)] hover:text-[rgb(154,38,214)] hover:underline transition-colors"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
