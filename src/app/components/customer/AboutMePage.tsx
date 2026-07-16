import { Printer, Calendar } from 'lucide-react';
import { Button } from '../buttons/Button';
import { useScrolled } from '../../hooks/useScrolled';
import { useCustomer } from '../../data/CustomerContext';

export function AboutMeSubnav() {
  const scrolled = useScrolled();
  const customer = useCustomer();
  if (!customer.hasCarePlan) return null;
  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className={`max-w-[1600px] w-full mx-auto px-6 flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3.5'}`}>
        <span className="text-xs text-gray-500">Last updated: 14/10/2025 &nbsp;·&nbsp; Sharon Hunter</span>
        <div className="flex items-center gap-3">
          <Button variant="tertiary" icon={<Printer className="w-4 h-4" />}>Print</Button>
          <Button>Save</Button>
        </div>
      </div>
    </div>
  );
}

const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';
const inputClass =
  'w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[rgb(154,38,214)] focus:ring-1 focus:ring-[rgb(154,38,214)]';

const FIELDS = [
  {
    id: 'importantToMe',
    label: 'What is most important to me',
    value: 'Being supported in my own home and maintaining my independence as much as possible.',
    rows: 3,
  },
  {
    id: 'importantPeople',
    label: 'People who are important to me',
    value: 'My children Christopher, Lorraine and David. Lorraine lives in Seghill, Christopher lives in Leicester and David lives in Florida.',
    rows: 3,
  },
  {
    id: 'communication',
    label: 'How I communicate and how to communicate with me',
    value: 'I communicate verbally and I would like my carer to communicate with me the same way. Please speak clearly as my hearing is not as sharp as it used to be.',
    rows: 3,
  },
  {
    id: 'wellness',
    label: 'My wellness',
    value: 'I am a very positive man. I have been living with vascular dementia which can affect my memory and sometimes causes periods of confusion, particularly later in the day. I also have hypertension which I manage with medication. I try to stay active and keep a positive outlook.',
    rows: 4,
  },
  {
    id: 'doAndDont',
    label: 'Please do and please don\'t',
    value: 'Please don\'t come into my home and take over. I am very house proud and value my independence. Please do ask me what I would like help with before starting — I like things done a certain way.',
    rows: 3,
  },
  {
    id: 'howToSupportMe',
    label: 'How and when to support me',
    value: 'I would like a carer to visit me regularly to help with daily tasks and companionship. I may decide I would like help with household chores such as hoovering or polishing. I may also decide to go shopping. My son David\'s contact number is 07980 077250 — please call him if there are any concerns.',
    rows: 4,
  },
  {
    id: 'alsoWorthKnowing',
    label: 'Also worth knowing about me',
    value: 'I was born in Birmingham and have lived in Sutton Coldfield for most of my adult life. I worked as a mechanical engineer for over thirty years before retiring. I have three children — Lorraine, Christopher and David. David emigrated to Florida many years ago but we stay in regular contact. I enjoy watching football and cricket and like to keep up with the news each day. In my younger years I was very active and enjoyed gardening and walking. I still try to get outside when I am able.',
    rows: 5,
  },
];

export function AboutMePage() {
  return (
    <div>
      {/* Form card */}
      <div className="bg-white rounded-[10px] border border-gray-200 p-6 max-w-[900px] space-y-5">
        <h2 className="text-base font-semibold text-gray-900">About me</h2>

        {FIELDS.map(field => (
          <div key={field.id}>
            <label htmlFor={field.id} className={labelClass}>{field.label}</label>
            <textarea
              id={field.id}
              defaultValue={field.value}
              rows={field.rows}
              className={`${inputClass} resize-none`}
            />
          </div>
        ))}

        {/* Date + Supported by */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Date</label>
            <div className="relative">
              <input
                type="text"
                defaultValue="14/10/2025 00:00"
                className={`${inputClass} pr-10`}
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Supported by</label>
            <input type="text" defaultValue="Sharon Hunter" className={inputClass} />
          </div>
        </div>
      </div>
    </div>
  );
}
