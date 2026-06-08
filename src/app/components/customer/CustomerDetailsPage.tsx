import { Clock, Calendar, Image, Crop, Trash2, Lock, Heart, ChevronDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { PencilSolidIcon } from '../icons/PencilSolidIcon';
import { Tag } from '../ui/tag';
import customerPhoto from '../../imports/david_f.jpg';

export function CustomerDetailsPage() {
  return (
    <div className="grid grid-cols-2 gap-6">

      {/* ── Left column ───────────────────────────────────────────────── */}
      <div className="space-y-6">

        {/* Main details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Main details</h4>
          <div className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 rounded font-medium" style={{ backgroundColor: '#B7DDA8', color: '#2D5F1E' }}>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title <span className="text-red-500">*</span></label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
                <option>- Select -</option>
                <option selected>Mr</option>
                <option>Mrs</option><option>Miss</option><option>Ms</option><option>Dr</option>
                <option>Prof</option><option>Sir</option><option>Dame</option><option>Lady</option>
                <option>Lord</option><option>Rev</option><option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
              <input type="text" defaultValue="Arthur" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" readOnly />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Surname <span className="text-red-500">*</span></label>
              <input type="text" defaultValue="Barrington" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" readOnly />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Known as</label>
              <input type="text" defaultValue="Arthur" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" readOnly />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
                <option>Not specified</option>
                <option selected>Male</option>
                <option>Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ethnicity</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
                <option value="">Not selected</option>
                <option>Asian, Asian British or Asian Welsh</option>
                <option>Bangladeshi</option><option>Chinese</option><option>Indian</option>
                <option>Pakistani</option><option>Other Asian</option>
                <option>Black, Black British, Black Welsh, Caribbean or African</option>
                <option>African</option><option>Caribbean</option><option>Other Black</option>
                <option>Mixed or Multiple ethnic groups</option>
                <option>White and Asian</option><option>White and Black African</option>
                <option>White and Black Caribbean</option>
                <option>Other Mixed or Multiple ethnic groups</option>
                <option selected>White</option>
                <option>English, Welsh, Scottish, Northern Irish or British</option>
                <option>Irish</option><option>Gypsy or Irish Traveller</option><option>Roma</option>
                <option>Other White</option><option>Other ethnic group</option>
                <option>Arab</option><option>Any other ethnic group</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Religion</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
                <option value="">Not selected</option>
                <option>Hindu</option><option>Muslim</option><option>Jewish</option>
                <option>Sikh</option><option>Quaker</option><option>Baptist</option>
                <option>Lutheran</option><option>Buddhist</option>
                <option selected>Anglican</option>
                <option>Catholic</option><option>Methodist</option><option>Christian</option>
                <option>Evangelist</option><option>Presbyterian</option><option>Protestant</option>
                <option>Salvation Army</option><option>Spiritualist</option><option>Nonconformist</option>
                <option>Jehovah Witness</option><option>Plymouth Brethren</option>
                <option>Church of Ireland</option><option>Church of England</option>
                <option>Church of Scotland</option><option>Amish</option><option>Yoruba</option>
                <option>Mormon</option><option>Jainism</option><option>Judaism</option>
                <option>Rastafarian</option><option>Seventh Day Adventist</option>
                <option>Pentecostal</option><option>Apostolic</option><option>African</option>
                <option>Atheist movement</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">DOB</label>
              <div className="flex gap-2">
                <input type="text" defaultValue="22/07/1937" className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" readOnly />
                <button className="px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50">
                  <Calendar className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Social services number</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" readOnly />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start date</label>
              <div className="flex gap-2">
                <input type="text" defaultValue="14/02/2022" className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" readOnly />
                <button className="px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50">
                  <Calendar className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Contact details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Contact details</h4>
          <div className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Flat No / House Name</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" readOnly />
              <p className="text-xs text-gray-400 mt-1">This field is not used for travel calculations — it is supporting information for staff in the field.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address 1</label>
              <input type="text" defaultValue="91 Westwood Road" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" readOnly />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address 2</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" readOnly />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input type="text" defaultValue="Sutton Coldfield" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" readOnly />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">County</label>
              <input type="text" defaultValue="West Midlands" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" readOnly />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
              <input type="text" defaultValue="B73 6UJ" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" readOnly />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <input type="text" defaultValue="United Kingdom" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" readOnly />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address type</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
                <option>- Select -</option>
                <option selected>Main Permanent Residence</option>
                <option>Other Permanent Residence</option><option>Temporary Residence</option>
                <option>Correspondence (Non-Residence)</option><option>Main Business Premises</option>
                <option>Invoice</option><option>Other Business Premises</option>
                <option>Safe Haven Address</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Access details</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                rows={3}
                defaultValue="Key safe code: 4821. Door is around the side of the property."
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tel</label>
              <input type="text" defaultValue="0121 353 4695" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" readOnly />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" defaultValue="arthur.barrington@example.com" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" readOnly />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile</label>
              <input type="text" defaultValue="07980 077250" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" readOnly />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred contact method</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
                <option>- Select -</option>
                <option selected>UK Telephone number</option>
                <option>Other non UK telephone number</option><option>UK fax number</option>
                <option>Email address</option><option>Uniform Resource Locator (URL)</option>
                <option>Pager</option>
              </select>
            </div>

          </div>
        </div>
      </div>

      {/* ── Right column ──────────────────────────────────────────────── */}
      <div className="space-y-6">

        {/* Image */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Image</h4>
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-40 h-40 rounded-lg bg-gray-200"
              style={{ backgroundImage: `url(${customerPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
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
          <p className="text-sm text-gray-500 mb-4">Classify this customer for filtering, reporting, and scheduling. Area tags are used to determine which careworkers can be assigned.</p>
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
              <Tag label="Area" value="Sutton Coldfield" removable onRemove={() => {}} />
            </div>
          </div>
        </div>

        {/* Care requirements summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-gray-900">Care requirements</h4>
            <Link
              to="/customers"
              className="text-sm text-[rgb(154,38,214)] hover:underline flex items-center gap-1"
            >
              Edit in Rostering <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="text-sm text-gray-500 mb-4">A summary of the scheduling requirements set for this customer. Edit these in the Rostering tab.</p>

          <div className="divide-y divide-gray-100">

            {/* Mandatory */}
            <div className="py-3">
              <p className="text-sm font-semibold text-gray-900 mb-2">Mandatory</p>
              <div className="flex flex-wrap gap-2 items-center">
                <Tag label="Area" value="Sutton Coldfield" />
                <span className="text-xs text-gray-400 italic flex items-center gap-1">
                  from tags
                </span>
              </div>
            </div>

            {/* Preferred */}
            <div className="py-3">
              <p className="text-sm font-semibold text-gray-900 mb-2">Preferred</p>
              <div className="flex flex-wrap gap-2">
                <Tag label="Medical Conditions" value="Glaucoma" />
                <Tag label="Medical Conditions" value="Hypertension" />
                <Tag label="Medical Conditions" value="Stroke" />
              </div>
            </div>

            {/* Preferred employees */}
            <div className="py-3">
              <p className="text-sm font-semibold text-gray-900 mb-2">Preferred employees</p>
              <div className="flex flex-wrap gap-2">
                <Tag label="Claire Restall" variant="preferred" />
              </div>
            </div>

            {/* Excluded careworkers */}
            <div className="py-3">
              <p className="text-sm font-semibold text-gray-900 mb-2">Excluded careworkers</p>
              <div className="flex flex-wrap gap-2">
                <Tag label="John Smith" variant="excluded" />
              </div>
            </div>

            {/* Visit environment */}
            <div className="py-3">
              <p className="text-sm font-semibold text-gray-900 mb-2">Home & visit environment</p>
              <div className="flex flex-wrap gap-2">
                <Tag label="Other pets" />
                <Tag label="Smoker" />
                <Tag label="Stairs" />
              </div>
            </div>

          </div>
        </div>

        {/* High risk */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">High risk</h4>
            <button className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm">
              <Lock className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" defaultChecked className="rounded border-gray-300" disabled />
              <span>High risk</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none bg-gray-50"
                rows={3}
                defaultValue="Mr Barrington has a history of falls. Please ensure all visit notes are completed promptly and any concerns escalated immediately."
                disabled
              />
            </div>
          </div>
        </div>

        {/* Legal decisions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Legal decisions (if applicable)</h4>
            <button className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm">
              <Lock className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <div className="space-y-4">
            {/* DNACPR */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" defaultChecked className="rounded border-gray-300" disabled />
                <Heart className="w-3.5 h-3.5 text-gray-500" />
                <span>DNACPR</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none bg-gray-50"
                  rows={3}
                  defaultValue="A DNACPR was introduced in January 2023. The relevant paperwork can be found within the kitchen drawer. An electronic copy is stored in the Documents tab."
                  disabled
                />
              </div>
            </div>
            {/* DoLS */}
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="rounded border-gray-300" disabled />
                <span>DoLS</span>
              </label>
            </div>
          </div>
        </div>

        {/* Allergies */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Allergies</h4>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
            rows={3}
            defaultValue="Penicillin. Latex gloves — please use nitrile alternatives."
            readOnly
          />
        </div>

        {/* Emergency contacts */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Emergency contacts</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Next of kin</label>
              <input type="text" defaultValue="David Barrington (Son)" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Next of kin tel</label>
              <input type="text" defaultValue="07980 077250" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Other relevant people</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                rows={2}
                defaultValue="Neighbour Mrs Joyce Fletcher (key holder): 0121 354 2201"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Patient details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Patient details</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">NHS number</label>
              <input type="text" defaultValue="488 754 3816" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Practice name</label>
              <input type="text" defaultValue="Mere Green Medical Centre" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input type="text" defaultValue="Mere Green Road, Sutton Coldfield, B75 5BL" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telephone</label>
              <input type="text" defaultValue="0121 308 0555" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" readOnly />
            </div>
          </div>
        </div>

        {/* Integration details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Integration details</h4>
            <button className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm">
              <Lock className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <table className="w-full border border-gray-200 rounded-md">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200">External System</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200">External ID</th>
                <th className="w-10 border-b border-gray-200" />
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
                  <input type="text" defaultValue="CU884712" className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50" disabled />
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
