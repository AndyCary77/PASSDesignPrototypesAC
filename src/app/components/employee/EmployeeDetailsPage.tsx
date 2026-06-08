import { Clock, Calendar, Image, Crop, Trash2, Lock, ChevronDown } from 'lucide-react';
import { PencilSolidIcon } from '../icons/PencilSolidIcon';
import { Tag } from '../ui/tag';
import davidPhoto from '../../imports/david_b.jpg';

export function EmployeeDetailsPage() {
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left Column */}
      <div className="space-y-6">
        {/* Main Details Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Main details</h4>
          
          <div className="space-y-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex items-center gap-3">
                <span 
                  className="text-xs px-2 py-1 rounded font-medium"
                  style={{ backgroundColor: '#B7DDA8', color: '#2D5F1E' }}
                >
                  ACTIVE
                </span>
                <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                  <PencilSolidIcon className="w-3 h-3" /> Update
                </button>
                <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> History
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
                <option>Mr</option>
              </select>
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value="David" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                readOnly
              />
            </div>

            {/* Surname */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Surname <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value="Buckowski" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                readOnly
              />
            </div>

            {/* Sex */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sex</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
                <option>Male</option>
              </select>
            </div>

            {/* DOB */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">DOB</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value="15/03/1985" 
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  readOnly
                />
                <button className="px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50">
                  <Calendar className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Contact information</h4>
          
          <div className="space-y-4">
            {/* Address 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address 1</label>
              <input 
                type="text" 
                value="11 Matlock Close" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                readOnly
              />
            </div>

            {/* Address 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address 2</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                readOnly
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input 
                type="text" 
                value="Walsall" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                readOnly
              />
            </div>

            {/* County */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">County</label>
              <input 
                type="text" 
                value="West Midlands" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                readOnly
              />
            </div>

            {/* Postcode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
              <input 
                type="text" 
                value="WS3 3QE" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                readOnly
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                readOnly
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
                <span className="ml-2 text-green-500">✓</span>
              </label>
              <input 
                type="email" 
                value="funmilola.akamiro@example.com" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                readOnly
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile</label>
              <input 
                type="text" 
                value="07355943508" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                readOnly
              />
            </div>

            {/* Tel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tel</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                readOnly
              />
            </div>

            {/* Authenticator */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Authenticator</label>
              <div className="text-sm text-gray-600">Disabled</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Image Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Image</h4>
          
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-40 h-40 rounded-lg bg-gray-200"
              style={{
                backgroundImage: `url(${davidPhoto})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            ></div>
            <div className="flex gap-2">
              <button className="px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm flex items-center gap-2">
                <Image className="w-4 h-4" /> Upload
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm flex items-center gap-2">
                <Crop className="w-4 h-4" /> Crop
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm text-red-600 flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-2">Tags</h4>
          <p className="text-sm text-gray-500 mb-4">Classify this careworker for filtering and reporting.</p>
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search and add tags..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm pr-8"
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Tag label="Staff type" value="Field based" removable onRemove={() => {}} />
            </div>
          </div>
        </div>

        {/* Skills Matching Profile Card - Replaces Tags */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-2">Roster matching profile</h4>
          <p className="text-sm text-gray-500 mb-6">This information is used to match careworkers to customers and improve scheduling decisions.</p>
          
          <div className="space-y-6 divide-y divide-gray-200">
            {/* Capabilities */}
            <div className="pt-0 pb-6">
              <h6 className="text-base font-semibold text-gray-900 mb-1">Skills & work criteria</h6>
              <p className="text-sm text-gray-500 mb-3">Add tags this careworker possesses to match them with relevant customer care requirements. <strong>Medical conditions added will show as Training.</strong></p>
              
              <div className="space-y-3">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search and add capabilities..." 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm pr-8"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Tag
                    label="Training"
                    value="Peg Feeding"
                    removable={true}
                    onRemove={() => console.log('Remove tag')}
                  />
                  <Tag
                    label="Area"
                    value="Tamworth & Lichfield"
                    removable={true}
                    onRemove={() => console.log('Remove tag')}
                  />
                  <Tag
                    label="Area"
                    value="Walsall"
                    removable={true}
                    onRemove={() => console.log('Remove tag')}
                  />
                </div>
              </div>
            </div>

            {/* Restrictions */}
            <div className="px-[0px] pt-[0px] pb-[24px]">
              <h6 className="text-base font-semibold text-gray-900">Restrictions</h6>
              <p className="text-sm text-gray-500 mb-3">Specify any limitations or conditions that prevent this careworker from being assigned to certain visits.</p>
              
              <div>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search and add restrictions..." 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm pr-8"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Tag
                    label="Dogs"
                    removable={true}
                    onRemove={() => console.log('Remove tag')}
                  />
                  <Tag
                    label="Other pets"
                    removable={true}
                    onRemove={() => console.log('Remove tag')}
                  />
                </div>
              </div>
            </div>

            {/* Preferred Customers */}
            <div className="px-[0px] pt-[0px] pb-[24px]">
              <h6 className="text-base font-semibold text-gray-900">Preferred customers</h6>
              <p className="text-sm text-gray-500 mb-3">These customers will be prioritized when scheduling visits for this careworker.</p>
              
              <div>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search and add preferred customers..." 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm pr-8"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Tag 
                    label="Margaret Thompson"
                    variant="preferred"
                    removable={true}
                    onRemove={() => console.log('Remove tag')}
                  />
                </div>
              </div>
            </div>

            {/* Excluded Customers */}
            <div className="px-[0px] pt-[0px] pb-[24px]">
              <h6 className="text-base font-semibold text-gray-900">Excluded customers</h6>
              <p className="text-sm text-gray-500 mb-3">This careworker will be blocked from being scheduled for visits to these customers.</p>
              
              <div>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search and add excluded customers..." 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm pr-8"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Tag 
                    label="Robert Jenkins"
                    variant="excluded"
                    removable={true}
                    onRemove={() => console.log('Remove tag')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Login Details Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Login details</h4>
          
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value="davidbuckowski" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                disabled
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  value="********" 
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  readOnly
                />
                <button className="px-4 py-2 bg-[rgb(154,38,214)] text-white rounded-md text-sm hover:bg-purple-700">
                  Generate temp password
                </button>
              </div>
              <a href="#" className="text-sm text-[rgb(154,38,214)] hover:underline mt-2 inline-block">
                Show password policy
              </a>
            </div>
          </div>
        </div>

        {/* Role Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Role</h4>
          
          <div className="relative">
            <button className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-left flex items-center justify-between">
              <span>Careworker</span>
              <span className="text-gray-400">▼</span>
            </button>
          </div>
        </div>

        {/* Care Groups Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Care Groups</h4>
          
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" className="rounded border-gray-300" />
              <span>Select all care groups</span>
            </label>
          </div>
        </div>

        {/* Integration Details Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Integration details</h4>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm">
                <Lock className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
          
          <table className="w-full border border-gray-200 rounded-md">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                  External System
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                  External ID
                </th>
                <th className="w-10 border-b border-gray-200"></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="px-4 py-2">
                  <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50" disabled>
                    <option>CARAS</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input 
                    type="text" 
                    value="FA123456" 
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                    disabled
                  />
                </td>
                <td className="px-4 py-2 text-center">
                  <button className="text-gray-400 hover:text-red-600 disabled:opacity-50" disabled>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}