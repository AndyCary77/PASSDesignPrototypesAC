import { Link } from 'react-router';

const SCREENS = [
  {
    title: 'Customer Profile',
    items: [
      { label: 'Customers List', to: '/customers/list' },
      { label: 'Rostering — Care Requirements & Service Agreement', to: '/customers/arthur-barrington' },
      { label: 'Care Management — Outcomes, Tasks, Visits & Care Groups', to: '/customers/arthur-barrington/caremanagement' },
      { label: 'Care Notes', to: '/customers/arthur-barrington/carenotes' },
      { label: 'Documents', to: '/customers/arthur-barrington/documents' },
      { label: 'MAR Chart', to: '/customers/arthur-barrington/marchart' },
      { label: 'Customer Details', to: '/customers/arthur-barrington/details' },
    ],
  },
  {
    title: 'CareBridge',
    items: [
      { label: 'CareBridge (existing customer) — Arthur Barrington', to: '/customers/arthur-barrington/carebridge' },
      { label: 'CareBridge (new enquiry) — Edith Caldwell', to: '/customers/edith-caldwell/carebridge' },
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

// The mobile prototypes are standalone HTML apps (their own React roots),
// not react-router routes — so these are real page navigations, not <Link>s.
const MOBILE = [
  {
    title: 'Mobile App',
    items: [
      { label: 'Account', to: '/src/app/components/mobile/account/' },
      { label: 'CareBridge — Assessment capture', to: '/src/app/components/mobile/carebridge/' },
      { label: 'Messaging', to: '/src/app/components/mobile/messaging/' },
      { label: 'Mileage Pay', to: '/src/app/components/mobile/mileage-pay/' },
      { label: 'Notifications', to: '/src/app/components/mobile/notifications/' },
    ],
  },
];

const COMPONENTS = [
  {
    title: 'Layout — New',
    items: [
      { label: 'Side Nav + Top Nav', to: '/components/new-nav' },
    ],
  },
  {
    title: 'Layout — Legacy',
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
    <div className="max-w-[1600px] w-full mx-auto px-8 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        PASS UX — Prototypes
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
                          className="text-sm font-medium text-[rgb(109,27,152)] hover:text-[rgb(154,38,214)] hover:underline transition-colors"
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
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Mobile</h2>
            <div className="space-y-8">
              {MOBILE.map(section => (
                <div key={section.title}>
                  <p className="text-xs font-semibold text-gray-500 mb-2">{section.title}</p>
                  <ul className="space-y-1.5">
                    {section.items.map(item => (
                      <li key={item.to}>
                        <a
                          href={item.to}
                          className="text-sm font-medium text-[rgb(109,27,152)] hover:text-[rgb(154,38,214)] hover:underline transition-colors"
                        >
                          {item.label}
                        </a>
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
                          className="text-sm font-medium text-[rgb(109,27,152)] hover:text-[rgb(154,38,214)] hover:underline transition-colors"
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
    </div>
  );
}
