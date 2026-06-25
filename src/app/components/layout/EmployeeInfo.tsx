import { Link, useLocation } from 'react-router';
import davidPhoto from '../../imports/david_b.jpg';

const activeTabClass =
  'px-4 py-3 text-sm bg-purple-50 text-[rgb(154,38,214)] hover:bg-purple-100 whitespace-nowrap border-b-2 border-[rgb(154,38,214)] transition-colors';
const inactiveTabClass =
  'px-4 py-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap border-b-2 border-transparent hover:border-gray-300 transition-colors';

export function EmployeeInfo() {
  const { pathname } = useLocation();
  const isRecords = pathname === '/employees/records';

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 m-[0px]">
        <div className="flex items-start gap-4 py-4">
          {/* Avatar */}
          <div
            className="h-16 w-16 rounded-full overflow-hidden flex-shrink-0 bg-gray-300"
            style={{
              backgroundImage: `url(${davidPhoto})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          ></div>
          
          <div className="flex-1 min-w-0">
            {/* Name and Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-gray-900 font-semibold">Mr David Buckowski</h2>
              <span 
                className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ backgroundColor: '#B7DDA8', color: '#2D5F1E' }}
              >
                ACTIVE
              </span>
              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">Careworker</span>
            </div>
            
            {/* Contact Info */}
            <div className="text-sm text-gray-600 flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
              <span><span className="text-gray-500">Mob:</span> <span className="text-gray-700">07355943508</span></span>
              <span className="text-gray-300">•</span>
              <span><span className="text-gray-500">Username:</span> <span className="text-gray-700">davidbuckowski</span></span>
            </div>
            
            {/* Address */}
            <div className="text-gray-700 text-[16px]">
              11 Matlock Close, Walsall, WS3 3QE
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-gray-200 -mx-4 px-4">
          <nav className="flex gap-1 overflow-x-auto">
            <a href="#" className={inactiveTabClass}>
              Dashboard
            </a>
            <Link to="/employees" className={isRecords ? inactiveTabClass : activeTabClass}>
              Details
            </Link>
            <a href="#" className={inactiveTabClass}>
              Checklists
            </a>
            <Link to="/employees/records" className={isRecords ? activeTabClass : inactiveTabClass}>
              Records
            </Link>
            <a href="#" className={inactiveTabClass}>
              Timeline
            </a>
            <a href="#" className={inactiveTabClass}>
              Roster
            </a>
          </nav>
        </div>
      </div>
    </div>
  );
}