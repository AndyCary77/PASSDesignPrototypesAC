import { Heart } from 'lucide-react';
import customerPhoto from '../../imports/david_f.jpg';

export function CustomerInfo() {
  const inactiveTabClass =
    'px-4 py-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap border-b-2 border-transparent hover:border-gray-300 transition-colors';

  const activeTabClass =
    'px-4 py-3 text-sm whitespace-nowrap border-b-2 bg-purple-50 text-[rgb(154,38,214)] border-[rgb(154,38,214)]';

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 m-[0px]">
        <div className="flex items-start gap-4 py-4">
          {/* Avatar */}
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-cover bg-center bg-gray-300"
            style={{ backgroundImage: `url(${customerPhoto})` }}
          />

          <div className="flex-1 min-w-0">
            {/* Name and Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-gray-900 font-semibold">Mr Arthur Barrington</h2>
              <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded inline-flex items-center gap-1">
                <Heart size={12} fill="currentColor" />
                <span>DNACPR</span>
              </span>
              <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded">
                <span>HIGH RISK</span>
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ backgroundColor: '#B7DDA8', color: '#2D5F1E' }}
              >
                ACTIVE
              </span>
            </div>

            {/* Contact Info */}
            <div className="text-sm text-gray-600 flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
              <span><span className="text-gray-500">Tel:</span> <span className="text-gray-700">0121 353 4695</span></span>
              <span className="text-gray-300">•</span>
              <span><span className="text-gray-500">Mob:</span> <span className="text-gray-700">07980 077250 (David)</span></span>
              <span className="text-gray-300">•</span>
              <span><span className="text-gray-500">DOB:</span> <span className="text-gray-700">22/07/1937</span></span>
              <span className="text-gray-300">•</span>
              <span><span className="text-gray-500">NHS:</span> <span className="text-gray-700">488 754 3816</span></span>
            </div>

            {/* Address */}
            <div className="text-gray-700 text-[16px]">
              91 Westwood Road, Sutton Coldfield, B73 6UJ
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-gray-200 -mx-4 px-4">
          <nav className="flex gap-1 overflow-x-auto">
            <a href="#" className={inactiveTabClass}>Dashboard</a>
            <a href="#" className={inactiveTabClass}>Care Management</a>
            <a href="#" className={inactiveTabClass}>Care Notes</a>
            <a href="#" className={inactiveTabClass}>MAR Chart</a>
            <a href="#" className={inactiveTabClass}>Timeline</a>
            <a href="#" className={inactiveTabClass}>Documents</a>
            <a href="#" className={inactiveTabClass}>About Me</a>
            <a href="#" className={inactiveTabClass}>Details</a>
            <a href="#" className={inactiveTabClass}>Checklists</a>
            <span className={activeTabClass}>Rostering</span>
            <a href="#" className={inactiveTabClass}>Communications</a>
            <a href="#" className={inactiveTabClass}>Medical History</a>
            <a href="#" className={inactiveTabClass}>Customer File</a>
          </nav>
        </div>
      </div>
    </div>
  );
}