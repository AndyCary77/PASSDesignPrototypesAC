import { useState, type ReactNode } from 'react';
import { useCustomer } from '../../data/CustomerContext';
import { canSeeRafDetail, useRafAccess } from '../../data/RafAccessContext';
import { activeItems, formatRafDate, todayIso } from '../../data/reasonableAdjustments';
import { Button } from '../buttons/Button';
import { SegmentedControl } from '../buttons/SegmentedControl';
import { SubnavTabs } from '../tabs/SubnavTabs';
import { RafItemDetails } from './RafItemDetails';
import passLogo from './customer-file-assets/pass-logo.png';
import openPassBox from './customer-file-assets/openpass-app-box.png';
import demoQrCode from './customer-file-assets/demo-qr-code.png';

// A simplified Customer File: the document PASS renders from a customer's care plan, shown on screen exactly as
// it is printed or exported as a PDF. Only the first page (the cover), the index and the start of the care and
// support plan are built; the rest of the document isn't shown in this prototype. Reasonable Adjustments is a
// section of the care and support plan (straight after Customer details), not part of the cover.

type FileSize = 'xlarge' | 'large' | 'normal';

// On-screen size of the pages, applied as a zoom so everything on them scales together.
const ZOOM: Record<FileSize, number> = { normal: 1, large: 1.25, xlarge: 1.5 };

const PURPLE = 'rgb(109, 27, 152)';

type IndexEntry = { number: string; title: string; children?: IndexEntry[] };

/** The index, numbered to match the document. Reasonable Adjustments only has a section (and so an entry) when it is shown. */
function buildIndex(showAdjustments: boolean): IndexEntry[] {
  const planSections: { title: string; children?: string[] }[] = [
    { title: 'About Me', children: ['Additional information'] },
    { title: 'Customer details' },
    ...(showAdjustments ? [{ title: 'Reasonable Adjustments' }] : []),
    { title: 'Medical history' },
    { title: 'Outcomes' },
    { title: 'Care visits' },
    { title: 'Care visits & Tasks' },
  ];
  return [
    {
      number: '1',
      title: 'Care and support plan',
      children: planSections.map((sec, i) => ({
        number: `1.${i + 1}`,
        title: sec.title,
        children: sec.children?.map((title, j) => ({ number: `1.${i + 1}.${j + 1}`, title })),
      })),
    },
    ...['Important Contacts', 'Care Assessment', 'Nutrition and Hydration', 'Privacy Statement', 'Confirmation of Instructions', 'Confirmation of Receipt', 'Terms and Conditions']
      .map((title, i) => ({ number: String(i + 2), title })),
  ];
}

/** One printed page: white sheet, A4 proportions, growing taller rather than cutting content off. */
function Sheet({ children, className = 'py-[64px]' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`bg-white border border-gray-200 shadow-md w-[794px] min-h-[1123px] px-[57px] flex flex-col ${className}`}>
      {children}
    </section>
  );
}

function SectionRule() {
  return <div className="h-0.5 w-full mt-3" style={{ backgroundColor: PURPLE }} />;
}

export function CustomerFilePage() {
  const customer = useCustomer();
  const { level, getFlagRecord } = useRafAccess();
  const [size, setSize] = useState<FileSize>('normal');

  // The Reasonable Adjustments section: only the adjustments (the audit page's Level 1 view, never impairments or
  // conditions), for a customer who has a flag, shown to users with any RA access level. The printout matches the screen.
  const record = canSeeRafDetail(level) ? getFlagRecord(customer.id) : null;
  const adjustments = record ? activeItems(record, 'adjustment') : [];
  const showAdjustments = record !== null && adjustments.length > 0;
  const index = buildIndex(showAdjustments);
  const adjustmentsNumber = `1.${index[0].children!.findIndex(c => c.title === 'Reasonable Adjustments') + 1}`;

  const printedOn = (() => {
    const [y, m, d] = todayIso().split('-');
    return `${d}/${m}/${y}`;
  })();

  const addressLines = [...customer.addressLines, ...(customer.suburb ? [customer.suburb] : []), customer.postcode];

  return (
    <div className="flex flex-col gap-6 max-w-[1280px] mx-auto">
      {/* Controls above the document, as on the real screen. The QR code and the sizes don't change what is printed. */}
      <div className="flex flex-wrap items-center justify-end gap-4">
        <Button>Generate a new QR Code</Button>
        <SegmentedControl<FileSize>
          ariaLabel="Page size"
          value={size}
          onChange={setSize}
          options={[
            { value: 'xlarge', label: 'X Large' },
            { value: 'large', label: 'Large' },
            { value: 'normal', label: 'Normal' },
          ]}
        />
      </div>

      {/* Care Plan is a separate view of the document that isn't built in this prototype. */}
      <SubnavTabs
        tabs={[
          { id: 'careplan', label: 'Care Plan' },
          { id: 'customerfile', label: 'Customer File' },
        ]}
        activeTab="customerfile"
        onChange={() => {}}
        className="flex justify-center gap-8"
      />

      <div className="overflow-x-auto pb-8">
        <div className="flex flex-col items-center gap-6 min-w-max mx-auto" style={{ zoom: ZOOM[size] }}>
          {/* Cover */}
          <Sheet className="pt-6 pb-8">
            <div className="flex justify-end">
              <img src={passLogo} alt="PASS" className="h-14 w-auto" />
            </div>

            <div className="mt-4 text-center">
              <h1 className="text-[40px] leading-tight font-light text-gray-900">{customer.fullName}</h1>
              <p className="mt-3 text-[26px] leading-tight font-light text-gray-800">Customer file</p>
              <div className="mt-5 text-sm leading-[1.3] text-gray-700">
                {addressLines.map(line => <p key={line} className="text-sm">{line}</p>)}
              </div>
            </div>
            <div className="h-px w-full bg-gray-300 mt-8" />

            <div className="mt-8 flex items-start justify-between gap-6">
              <div>
                <h2 className="text-[26px] leading-tight font-light text-gray-800">EveryLIFE Care</h2>
                <p className="mt-3 text-[22px] leading-tight font-light text-gray-800">EveryLife Care</p>
                <dl className="mt-4 grid grid-cols-[146px_1fr] text-sm leading-5 text-gray-700">
                  <dt className="text-sm">Email:</dt><dd className="text-sm">EveryLifeCare@demomail.com</dd>
                  <dt className="text-sm">Office tel:</dt><dd className="text-sm">01956 453199</dd>
                  <dt className="text-sm">Main contact:</dt><dd />
                  <dt className="text-sm">Hours:</dt><dd className="text-sm">8:00am - 7:00pm</dd>
                  <dt className="text-sm pt-3">On call:</dt><dd className="pt-3" />
                  <dt className="text-sm">Hours:</dt><dd className="text-sm">7:00pm - 8:00am</dd>
                </dl>
              </div>
              {/* A demo customer's QR code; "Generate a new QR Code" doesn't produce a new one in this prototype. */}
              <img src={demoQrCode} alt="QR code for openPASS access (demo customer)" className="h-[200px] w-[200px] flex-shrink-0" />
            </div>

            <div className="mt-auto pt-10">
              <img
                src={openPassBox}
                alt="openPASS. For 30 minute access to the customer's Care Notes, download the openPASS app on your smartphone, register and then scan QR Code (above). Download the free app from the App Store or Google Play."
                className="w-full"
              />
              <p className="mt-4 text-center text-sm text-gray-500">powered by everyLIFE</p>
            </div>
          </Sheet>

          {/* Index */}
          <Sheet>
            <h2 className="text-3xl font-light text-gray-900">Index</h2>
            <SectionRule />
            <ol className="mt-8 space-y-4">
              {index.map(section => (
                <li key={section.number}>
                  <p className="text-xl font-light text-gray-800">{section.number} {section.title}</p>
                  {section.children && (
                    <ul className="mt-2 ml-6 space-y-1 text-sm text-gray-700">
                      {section.children.map(child => (
                        <li key={child.number}>
                          {child.number} {child.title}
                          {child.children && (
                            <ul className="ml-6 mt-1">
                              {child.children.map(grand => <li key={grand.number}>{grand.number} {grand.title}</li>)}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </Sheet>

          {/* Section 1; only the start of the document is built in this prototype. */}
          <Sheet>
            <h2 className="text-3xl font-light text-gray-900">1 Care and support plan</h2>
            <SectionRule />
            <p className="mt-6 text-sm text-gray-800">{customer.fullName}</p>
            <p className="text-sm text-gray-700">This is version 1 of the care plan and was printed on {printedOn}.</p>

            <p className="mt-8 text-sm text-gray-500 italic">1.1 About Me and 1.2 Customer details are not shown in this prototype.</p>

            {/* Reasonable Adjustments: its own section of the care and support plan, straight after Customer details. */}
            {showAdjustments && record && (
              <div className="mt-8" aria-label="Reasonable Adjustments">
                <h3 className="text-xl font-light text-gray-900">{adjustmentsNumber} Reasonable Adjustments</h3>
                <SectionRule />
                <ul className="mt-2 divide-y divide-gray-200">
                  {adjustments.map(item => (
                    <li key={item.id} className="py-3">
                      <RafItemDetails item={item} />
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-sm text-gray-600">Last updated on: {formatRafDate(record.lastUpdatedOn)}</p>
              </div>
            )}

            <p className="mt-8 text-sm text-gray-500 italic">The rest of the Customer File is not shown in this prototype.</p>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
