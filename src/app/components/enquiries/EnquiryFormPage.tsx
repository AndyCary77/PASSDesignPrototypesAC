import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Check, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../buttons/Button';
import { badge } from '../customer/PeopleList';
import { StatusBadge as CustomerStatusBadge } from '../customer/CustomersListDummy';
import { ENQUIRIES, ENQUIRY_STATUS_LABEL, type Enquiry } from '../../data/enquiriesDummy';

// The "Initial enquiry" form, rebuilt from the production enquiry screen (see the DOM
// sample it was based on). Same fields, prompts and option lists, in this app's own
// form styling (as on the Office details page): native inputs with the shared classes.
// Nothing is saved anywhere — Save just marks the form as clean again.
const INPUT_CLASS = 'w-full px-3 py-2 border border-gray-300 rounded-md text-body bg-white';
const LABEL_CLASS = 'block text-body font-medium text-gray-700 mb-2';
const CHECKBOX_CLASS = 'h-5 w-5 accent-[rgb(154,38,214)] cursor-pointer';

const TITLES = ['Mr', 'Mrs', 'Miss', 'Ms', 'Master', 'Dr', 'Prof', 'Sir', 'Dame', 'Lady', 'Lord', 'Rev', 'Other'];
const CARE_NEED_FOR = ['Yourself', 'Spouse', 'Mother', 'Father', 'Friend', 'Patient (NHS)', 'Service user (Social Services)', 'Son', 'Daughter', 'Other'];
const HEARD_ABOUT_US = [
  'Leaflet delivered to house', 'Leaflet picked up from elsewhere', 'Google search',
  'Referred by a social or healthcare professional', 'Referral from a friend or relative',
  'Referral from a Care Assistant', 'Found us in Social Care Guide', 'Referral from sheltered housing warden',
  'Advert / article in newspaper', 'ABC magazine', 'Transport', 'Office Signage', 'Outdoor Signage',
  'Events', 'Support Groups', 'Corporate Identity', 'Pairly', 'Other',
];
const HOW_WE_MAY_SUPPORT = ['Day and evening visits', 'Waking night', 'Sleeping night', 'Live-in care'];
const TYPES_OF_SUPPORT = ['Personal care', 'Medication', 'Domestic support', 'Companionship', 'Trips out'];

interface FormValues {
  title: string; firstname: string; surname: string;
  address1: string; address2: string; city: string; postcode: string;
  tel: string; email: string; mobile: string; dob: string;
  callerTitle: string; callerFirstname: string; callerSurname: string;
  callerAddress1: string; callerAddress2: string; callerCity: string; callerPostcode: string;
  callerTel: string; callerEmail: string;
  careNeedFor: string; careFor: string; careNeeded: string; supportNeeded: string; exampleCareplan: string;
  allProvidedSupport: string[]; allSupportRequired: string[];
  visitDateAndTime: string; nextSteps: string; heardAboutUs: string;
}

// The list holds a name, a one-line address and a dd/mm/yyyy date of birth; the form
// wants them split up, so pull them apart as well as a made-up list reasonably can.
function initialValues(e: Enquiry): FormValues {
  const [title = '', ...rest] = e.name.split(' ');
  const surname = rest.length > 1 ? rest[rest.length - 1] : '';
  const firstname = rest.length > 1 ? rest.slice(0, -1).join(' ') : rest.join(' ');
  const postcode = e.address.match(/\bHF\d \d[A-Z]{2}\b|\bHF\d \d?[A-Z]{0,2}\b/i)?.[0] ?? '';
  const parts = e.address.replace(postcode, '').split(',').map(p => p.trim()).filter(Boolean);
  // The last part is the town, unless it's actually another street line ("St Pauls Cray Road").
  const last = parts.length > 1 ? parts[parts.length - 1] : '';
  const lastIsStreet = /\b(Road|Street|Lane|Close|Drive|Way|Avenue|Crescent|Court|House|Lodge)\b/i.test(last);
  const city = lastIsStreet ? '' : last;
  const addr2 = parts.slice(1, lastIsStreet ? undefined : -1).join(', ');
  const [d, m, y] = (e.dob ?? '').split('/');
  const empty: FormValues = {
    title: TITLES.includes(title) ? title : '', firstname, surname,
    address1: parts[0] ?? '', address2: addr2, city, postcode,
    tel: e.tel ?? '', email: '', mobile: '', dob: e.dob ? `${y}-${m}-${d}` : '',
    callerTitle: '', callerFirstname: '', callerSurname: '',
    callerAddress1: '', callerAddress2: '', callerCity: '', callerPostcode: '',
    callerTel: '', callerEmail: '',
    careNeedFor: '', careFor: '', careNeeded: '', supportNeeded: '', exampleCareplan: '',
    allProvidedSupport: [], allSupportRequired: [],
    visitDateAndTime: '', nextSteps: '', heardAboutUs: '',
  };
  return empty;
}

function Field({ label, htmlFor, required, children }: { label: string; htmlFor?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className={LABEL_CLASS}>
        {label}
        {required && <span className="text-red-500" aria-hidden="true"> *</span>}
      </label>
      {children}
    </div>
  );
}

// The prompts the call-handler reads out, between groups of fields.
function Prompt({ children }: { children: React.ReactNode }) {
  return <p className="pt-2 text-body font-semibold text-gray-900 border-t border-gray-200 first:border-t-0 first:pt-0">{children}</p>;
}

function CheckGroup({ legend, options, selected, onToggle }: {
  legend: string; options: string[]; selected: string[]; onToggle: (option: string) => void;
}) {
  return (
    <fieldset>
      <legend className={LABEL_CLASS}>{legend}</legend>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {options.map(o => (
          <label key={o} className="flex items-center gap-2.5 text-body text-gray-800 cursor-pointer">
            <input type="checkbox" className={CHECKBOX_CLASS} checked={selected.includes(o)} onChange={() => onToggle(o)} />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function EnquiryFormPage() {
  const { enquiryId } = useParams();
  const navigate = useNavigate();
  const enquiry = ENQUIRIES.find(e => e.id === enquiryId);

  const initial = useMemo(() => (enquiry ? initialValues(enquiry) : null), [enquiry]);
  const [saved, setSaved] = useState<FormValues | null>(initial);
  const [values, setValues] = useState<FormValues | null>(initial);

  if (!enquiry || !values || !saved) {
    return (
      <div className="max-w-4xl w-full mx-auto space-y-4">
        <Button variant="tertiary" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/enquiries')}>Back</Button>
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-body text-gray-600">Enquiry not found.</div>
      </div>
    );
  }

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => setValues(v => (v ? { ...v, [key]: value } : v));
  const toggle = (key: 'allProvidedSupport' | 'allSupportRequired', option: string) =>
    setValues(v => v && ({ ...v, [key]: v[key].includes(option) ? v[key].filter(o => o !== option) : [...v[key], option] }));
  const text = (key: keyof FormValues, max?: number) => ({
    id: key, name: key, maxLength: max, className: INPUT_CLASS,
    value: values[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key, e.target.value as never),
  });
  const area = (key: 'careNeeded' | 'supportNeeded' | 'exampleCareplan') => (
    <textarea
      id={key} name={key} rows={3} className={`${INPUT_CLASS} resize-y`}
      value={values[key]} onChange={e => set(key, e.target.value)}
    />
  );
  const select = (key: keyof FormValues, options: { value: string; label: string }[]) => (
    <select id={key} name={key} className={INPUT_CLASS} value={values[key] as string} onChange={e => set(key, e.target.value as never)}>
      <option value="">- Select -</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
  const same = (list: string[]) => list.map(v => ({ value: v, label: v }));

  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  const { className = '', style } = enquiry.status === 'closed'
    ? { className: '', style: { backgroundColor: '#D4EBC3', color: '#2D5F1E', borderColor: '#AFDB98' } as React.CSSProperties }
    : { className: 'bg-amber-100 text-amber-800 border-amber-300', style: undefined };

  return (
    <div className="max-w-4xl w-full mx-auto space-y-4">
      {/* Actions bar: Back on the left; Delete and Save on the right. Delete is not wired; Save only clears the changed state. */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="tertiary" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/enquiries')}>Back</Button>
        <div className="flex items-center gap-3">
          <Button variant="secondary-danger" icon={<Trash2 className="w-4 h-4" />}>Delete</Button>
          <Button variant="primary" disabled={!dirty} onClick={() => setSaved(values)}>Save</Button>
        </div>
      </div>

      <form noValidate autoComplete="off" onSubmit={e => e.preventDefault()} className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Initial enquiry</h1>
          <p className="mt-1 text-body text-gray-600">Items marked with an asterisk (*) are mandatory.</p>
        </div>

        <div>
          <div className={LABEL_CLASS}>Status</div>
          <div className="flex items-center gap-3">
            <span className={`${badge} ${className}`} style={style}>
              {enquiry.status === 'closed' && <Check className="w-4 h-4" aria-hidden="true" />}
              {ENQUIRY_STATUS_LABEL[enquiry.status]}
            </span>
            {enquiry.customerStatus && <CustomerStatusBadge status={enquiry.customerStatus} />}
            <Button variant="tertiary" size="sm" icon={<Pencil className="w-4 h-4" />}>Update</Button>
          </div>
        </div>

        <Prompt>Prompts for enquiry conversation</Prompt>
        <p className="text-body text-gray-700">Can you tell me who the care is for?</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Title" htmlFor="title" required>{select('title', same(TITLES))}</Field>
          <Field label="First Name" htmlFor="firstname" required><input type="text" {...text('firstname', 25)} /></Field>
          <Field label="Surname" htmlFor="surname" required><input type="text" {...text('surname', 25)} /></Field>
          <Field label="DOB" htmlFor="dob">
            <input type="date" id="dob" name="dob" className={INPUT_CLASS} value={values.dob} onChange={e => set('dob', e.target.value)} />
          </Field>
          <Field label="Address 1" htmlFor="address1"><input type="text" {...text('address1', 100)} /></Field>
          <Field label="Address 2" htmlFor="address2"><input type="text" {...text('address2', 50)} /></Field>
          <Field label="City" htmlFor="city"><input type="text" {...text('city', 25)} /></Field>
          <Field label="Postcode" htmlFor="postcode"><input type="text" {...text('postcode', 25)} /></Field>
          <Field label="Tel" htmlFor="tel"><input type="text" {...text('tel', 50)} /></Field>
          <Field label="Mobile" htmlFor="mobile"><input type="text" {...text('mobile', 25)} /></Field>
          <div className="md:col-span-2">
            <Field label="Email" htmlFor="email"><input type="text" {...text('email', 50)} /></Field>
          </div>
        </div>

        <Prompt>If the caller is enquiring on behalf of someone else, then take the details of the caller</Prompt>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Title" htmlFor="callerTitle">{select('callerTitle', same(TITLES))}</Field>
          <Field label="First Name" htmlFor="callerFirstname"><input type="text" {...text('callerFirstname')} /></Field>
          <Field label="Surname" htmlFor="callerSurname"><input type="text" {...text('callerSurname')} /></Field>
          <Field label="Address 1" htmlFor="callerAddress1"><input type="text" {...text('callerAddress1')} /></Field>
          <Field label="Address 2" htmlFor="callerAddress2"><input type="text" {...text('callerAddress2')} /></Field>
          <Field label="City" htmlFor="callerCity"><input type="text" {...text('callerCity')} /></Field>
          <Field label="Postcode" htmlFor="callerPostcode"><input type="text" {...text('callerPostcode')} /></Field>
          <Field label="Tel" htmlFor="callerTel"><input type="text" {...text('callerTel')} /></Field>
          <div className="md:col-span-2">
            <Field label="Email" htmlFor="callerEmail"><input type="text" {...text('callerEmail')} /></Field>
          </div>
        </div>

        <div className="space-y-4">
          <Field label="And who is the care needed for?" htmlFor="careNeedFor" required>{select('careNeedFor', same(CARE_NEED_FOR))}</Field>
          <Field label="Do they live in an area you can serve?" htmlFor="careFor">
            {select('careFor', [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }])}
          </Field>
          <Field label="Can you tell us in what ways you / they are struggling to do things around the home or when getting out and about?" htmlFor="careNeeded">{area('careNeeded')}</Field>
          <Field label="What things can we help with?" htmlFor="supportNeeded">{area('supportNeeded')}</Field>
          <Field label="So, something along the following lines may provide some useful support?" htmlFor="exampleCareplan">{area('exampleCareplan')}</Field>
        </div>

        <Prompt>Note which elements of care were of interest</Prompt>
        <div className="space-y-4">
          <CheckGroup legend="How we may provide support" options={HOW_WE_MAY_SUPPORT} selected={values.allProvidedSupport} onToggle={o => toggle('allProvidedSupport', o)} />
          <CheckGroup legend="Types of support required" options={TYPES_OF_SUPPORT} selected={values.allSupportRequired} onToggle={o => toggle('allSupportRequired', o)} />
        </div>

        <Prompt>Most customers and their families think it is helpful to discuss this in person</Prompt>
        <div className="space-y-4">
          <Field label="Are you available to meet please? (Time, Date, Place)" htmlFor="visitDateAndTime"><input type="text" {...text('visitDateAndTime')} /></Field>
          <Field label="Next steps" htmlFor="nextSteps"><input type="text" {...text('nextSteps')} /></Field>
          <Field label="Can you tell us where you heard about us?" htmlFor="heardAboutUs">{select('heardAboutUs', same(HEARD_ABOUT_US))}</Field>
        </div>
      </form>
    </div>
  );
}
