import { Printer, Calendar } from 'lucide-react';
import { Button } from '../buttons/Button';
import { useScrolled } from '../../hooks/useScrolled';
import { useCustomer } from '../../data/CustomerContext';
import { TabEmptyState } from './TabEmptyState';

const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';
const inputClass =
  'w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[rgb(154,38,214)] focus:ring-1 focus:ring-[rgb(154,38,214)]';

interface AboutMeField {
  id: string;
  label: string;
  value: string;
  rows: number;
}

interface AboutMeRecord {
  updatedDate: string;
  updatedBy: string;
  supportedBy: string;
  fields: AboutMeField[];
}

const ABOUT_ME: Record<string, AboutMeRecord> = {
  'arthur-barrington': {
    updatedDate: '14/10/2025',
    updatedBy: 'Sharon Hunter',
    supportedBy: 'Sharon Hunter',
    fields: [
      { id: 'importantToMe', label: 'What is most important to me', rows: 3, value: 'Being supported in my own home and maintaining my independence as much as possible.' },
      { id: 'importantPeople', label: 'People who are important to me', rows: 3, value: 'My children Christopher, Lorraine and David. Lorraine lives in Seghill, Christopher lives in Leicester and David lives in Florida.' },
      { id: 'communication', label: 'How I communicate and how to communicate with me', rows: 3, value: 'I communicate verbally and I would like my carer to communicate with me the same way. Please speak clearly as my hearing is not as sharp as it used to be.' },
      { id: 'wellness', label: 'My wellness', rows: 4, value: 'I am a very positive man. I have been living with vascular dementia which can affect my memory and sometimes causes periods of confusion, particularly later in the day. I also have hypertension which I manage with medication. I try to stay active and keep a positive outlook.' },
      { id: 'doAndDont', label: 'Please do and please don\'t', rows: 3, value: 'Please don\'t come into my home and take over. I am very house proud and value my independence. Please do ask me what I would like help with before starting — I like things done a certain way.' },
      { id: 'howToSupportMe', label: 'How and when to support me', rows: 4, value: 'I would like a carer to visit me regularly to help with daily tasks and companionship. I may decide I would like help with household chores such as hoovering or polishing. I may also decide to go shopping. My son David\'s contact number is 07980 077250 — please call him if there are any concerns.' },
      { id: 'alsoWorthKnowing', label: 'Also worth knowing about me', rows: 5, value: 'I was born in Birmingham and have lived in Sutton Coldfield for most of my adult life. I worked as a mechanical engineer for over thirty years before retiring. I have three children — Lorraine, Christopher and David. David emigrated to Florida many years ago but we stay in regular contact. I enjoy watching football and cricket and like to keep up with the news each day. In my younger years I was very active and enjoyed gardening and walking. I still try to get outside when I am able.' },
    ],
  },
  'edith-caldwell': {
    updatedDate: '07/07/2026',
    updatedBy: 'Alison Reed',
    supportedBy: 'Alison Reed',
    fields: [
      { id: 'importantToMe', label: 'What is most important to me', rows: 3, value: 'Staying in my own bungalow and keeping my independence. I have managed on my own for years and I do not want to be a burden to my daughter.' },
      { id: 'importantPeople', label: 'People who are important to me', rows: 3, value: 'My daughter Susan, who visits most evenings, and my neighbour Margaret who keeps an eye on me.' },
      { id: 'communication', label: 'How I communicate and how to communicate with me', rows: 3, value: 'I communicate verbally. My hearing is fine but please speak clearly and give me time — I can be a little forgetful.' },
      { id: 'wellness', label: 'My wellness', rows: 4, value: 'I have had arthritis for years and recently fractured my hip in a fall, which has knocked my confidence. I get some pain and take tablets for it and for my blood pressure. I tire more easily than I used to.' },
      { id: 'doAndDont', label: 'Please do and please don\'t', rows: 3, value: 'Please don\'t rush me or do things for me that I can still manage myself. Please do encourage me to keep moving safely and to eat properly.' },
      { id: 'howToSupportMe', label: 'How and when to support me', rows: 4, value: 'Help me wash and dress in the mornings, prepare a proper breakfast and lunch, and prompt my tablets. A female carer is preferred for personal care. Please call Susan on 07712 660145 if you have any concerns.' },
      { id: 'alsoWorthKnowing', label: 'Also worth knowing about me', rows: 5, value: 'I was a school secretary for many years and I love crosswords and gardening, though I cannot get out in the garden much now. I take great pride in my home and like things kept just so.' },
    ],
  },
};

export function AboutMeSubnav() {
  const scrolled = useScrolled();
  const customer = useCustomer();
  const record = ABOUT_ME[customer.id];
  if (!record) return null;
  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className={`max-w-[1600px] w-full mx-auto px-6 flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3.5'}`}>
        <span className="text-xs text-gray-500">Last updated: {record.updatedDate} &nbsp;·&nbsp; {record.updatedBy}</span>
        <div className="flex items-center gap-3">
          <Button variant="tertiary" icon={<Printer className="w-4 h-4" />}>Print</Button>
          <Button>Save</Button>
        </div>
      </div>
    </div>
  );
}

export function AboutMePage() {
  const customer = useCustomer();
  const record = ABOUT_ME[customer.id];

  if (!record) {
    return <TabEmptyState label="About Me information" />;
  }

  return (
    <div>
      {/* Form card */}
      <div className="bg-white rounded-[10px] border border-gray-200 p-6 max-w-[900px] space-y-5">
        <h2 className="text-base font-semibold text-gray-900">About me</h2>

        {record.fields.map(field => (
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
                defaultValue={`${record.updatedDate} 00:00`}
                className={`${inputClass} pr-10`}
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Supported by</label>
            <input type="text" defaultValue={record.supportedBy} className={inputClass} />
          </div>
        </div>
      </div>
    </div>
  );
}
