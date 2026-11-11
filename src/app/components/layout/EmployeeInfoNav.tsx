import { Link, useLocation } from 'react-router';
import davidPhoto from '../../imports/david_b.jpg';
import { useScrolled } from '../../hooks/useScrolled';
import { useNavMode } from './NavModeContext';
import { LEGACY_SUBNAV_BG, infoPanelText, navTabClasses } from './CustomerInfoNav';

export function EmployeeInfo({ withSlideOffset = false }: { withSlideOffset?: boolean }) {
  const { pathname } = useLocation();
  const scrolled = useScrolled();
  const legacy = useNavMode().mode === 'legacy';
  const panelText = infoPanelText(legacy);
  const { active: activeTabClass, inactive: inactiveTabClass } = navTabClasses(legacy);
  const isRecords = pathname === '/employees/records';

  return (
    <div className={`${legacy ? LEGACY_SUBNAV_BG : 'bg-white border-b border-gray-200'} transition-[margin] duration-300 ${scrolled && withSlideOffset ? '-mt-12' : 'mt-0'}`}>
      <div className="px-6">
        <div className={`flex gap-4 transition-all duration-300 ${scrolled ? 'py-1.5 items-center' : 'py-4 items-start'}`}>
          {/* Avatar */}
          <div
            className={`rounded-full flex-shrink-0 bg-cover bg-center bg-gray-300 transition-all duration-300 ${scrolled ? 'h-9 w-9' : 'h-16 w-16'}`}
            style={{ backgroundImage: `url(${davidPhoto})` }}
          />

          {/* font-weight-fixed: see the matching note in CustomerInfoNav —
              this profile header stays at the base weight scale even in
              "Bolder" mode. */}
          <div className="flex-1 min-w-0 font-weight-fixed">
            {/* Name and badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`${panelText.name} font-semibold`}>Mr David Buckowski</h2>
              <span
                className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ backgroundColor: '#D4EBC3', color: '#2D5F1E' }}
              >
                ACTIVE
              </span>
              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">Careworker</span>
            </div>

            {/* Full details — shown when not scrolled */}
            <div className={`transition-all duration-300 overflow-hidden ${scrolled ? 'max-h-0 opacity-0 mt-0' : 'max-h-32 opacity-100 mt-1'}`}>
              <div className={`text-body font-medium ${legacy ? 'text-white' : 'text-gray-600'} flex flex-wrap items-center gap-x-3 gap-y-1 mb-1`}>
                <span><span className={panelText.label}>Mob:</span> <span className={panelText.value}>07355943508</span></span>
                <span className={panelText.dot}>•</span>
                <span><span className={panelText.label}>Username:</span> <span className={panelText.value}>davidbuckowski</span></span>
              </div>
              <div className={`${panelText.value} text-[15px] font-medium`}>
                11 Matlock Close, Walsall, WS3 3QE
              </div>
            </div>

            {/* Condensed single line — shown when scrolled */}
            <div className={`transition-all duration-300 overflow-hidden ${scrolled ? 'max-h-10 opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}>
              <p className={`text-body font-medium ${legacy ? 'text-white' : 'text-gray-600'} truncate`}>
                07355943508 &nbsp;·&nbsp; davidbuckowski &nbsp;·&nbsp; 11 Matlock Close, Walsall, WS3 3QE
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`-mx-6 px-6 ${legacy ? `${LEGACY_SUBNAV_BG} border-t border-white/20` : 'border-t border-gray-200'}`}>
          <nav className="flex gap-1 overflow-x-auto">
            <a href="#" className={inactiveTabClass}>Dashboard</a>
            <Link to="/employees" className={isRecords ? inactiveTabClass : activeTabClass}>Details</Link>
            <a href="#" className={inactiveTabClass}>Checklists</a>
            <Link to="/employees/records" className={isRecords ? activeTabClass : inactiveTabClass}>Records</Link>
            <a href="#" className={inactiveTabClass}>Timeline</a>
            <a href="#" className={inactiveTabClass}>Roster</a>
          </nav>
        </div>
      </div>
    </div>
  );
}
