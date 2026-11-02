import { useState, type ReactNode } from 'react';
import { useCustomer } from '../../data/CustomerContext';
import { useRafAccess } from '../../data/RafAccessContext';
import { activeItems, categoryName, formatRafDate, todayIso, type RafItem } from '../../data/reasonableAdjustments';
import { Button } from '../buttons/Button';
import { SegmentedControl } from '../buttons/SegmentedControl';
import { SubnavTabs } from '../tabs/SubnavTabs';
import { RafItemDetails } from './RafItemDetails';
import passLogo from './customer-file-assets/pass-logo.png';
import openPassBox from './customer-file-assets/openpass-app-box.png';
import demoQrCode from './customer-file-assets/demo-qr-code.png';

// A simplified Customer File: the document PASS renders from a customer's care plan, shown on screen exactly as
// it is printed or exported as a PDF. Only the first page (the cover or "header page"), the index and the start of
// the care and support plan are built; the rest of the document isn't shown in this prototype.

type FileSize = 'xlarge' | 'large' | 'normal';

// On-screen size of the pages, applied as a zoom so everything on them scales together.
const ZOOM: Record<FileSize, number> = { normal: 1, large: 1.25, xlarge: 1.5 };

// The cover is one A4 page with only so much room under the address. Adjustments are placed by estimated height
// (a long one takes more room than a short one) and the rest continue on a following header page, rather than being
// cut off or pushing the cover past one page: the printout has to show everything, or say it doesn't. The numbers
// come from measuring the cover (about 134px of room once the block's heading and spacing are taken out, with the
// QR code and openPASS box in place, which is room for a single adjustment); a real PDF renderer would paginate properly.
const COVER_BUDGET_PX = 134;

function estimatedHeight(item: RafItem): number {
  const textLines = item.freeText ? Math.ceil(item.freeText.length / 80) : 0;
  const tagWraps = item.term.length + categoryName(item.categoryCode).length > 62;
  return 84 + 24 * textLines + (tagWraps ? 28 : 0);
}

/** Takes adjustments for the cover until its room runs out. Always at least one, so the cover never has an empty block. */
function splitForCover(items: RafItem[]): { onCover: RafItem[]; continued: RafItem[] } {
  let used = 0;
  let count = 0;
  for (const item of items) {
    const h = estimatedHeight(item);
    if (count > 0 && used + h > COVER_BUDGET_PX) break;
    used += h;
    count += 1;
  }
  return { onCover: items.slice(0, count), continued: items.slice(count) };
}

const PURPLE = 'rgb(109, 27, 152)';

const INDEX: { number: string; title: string; children?: { number: string; title: string; children?: { number: string; title: string }[] }[] }[] = [
  {
    number: '1',
    title: 'Care and support plan',
    children: [
      { number: '1.1', title: 'About Me', children: [{ number: '1.1.1', title: 'Additional information' }] },
      { number: '1.2', title: 'Customer details' },
      { number: '1.3', title: 'Medical history' },
      { number: '1.4', title: 'Outcomes' },
      { number: '1.5', title: 'Care visits' },
      { number: '1.6', title: 'Care visits & Tasks' },
    ],
  },
  { number: '2', title: 'Important Contacts' },
  { number: '3', title: 'Care Assessment' },
  { number: '4', title: 'Nutrition and Hydration' },
  { number: '5', title: 'Privacy Statement' },
  { number: '6', title: 'Confirmation of Instructions' },
  { number: '7', title: 'Confirmation of Receipt' },
  { number: '8', title: 'Terms and Conditions' },
];

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

  // The Reasonable Adjustments on the header page: only the adjustments (the audit page's Level 1 view, never impairments
  // or conditions), for a customer who has a flag, shown to users with any RA access level. The printout matches the screen.
  const record = level !== 'none' ? getFlagRecord(customer.id) : null;
  const adjustments = record ? activeItems(record, 'adjustment') : [];
  const { onCover, continued } = splitForCover(adjustments);

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
          {/* Header page */}
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

            {/* Reasonable Adjustments: about the customer, so it sits with them rather than with the provider's details below. */}
            {onCover.length > 0 && record && (
              <div className="mt-8" aria-label="Reasonable Adjustments">
                <h2 className="text-xl font-light text-gray-900">Reasonable Adjustments</h2>
                <SectionRule />
                <ul className="mt-2 divide-y divide-gray-200">
                  {onCover.map(item => (
                    <li key={item.id} className="py-3">
                      <RafItemDetails item={item} />
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-sm text-gray-600">
                  Last updated on: {formatRafDate(record.lastUpdatedOn)}
                  {continued.length > 0 && ` · ${continued.length} more on the next page`}
                </p>
              </div>
            )}

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

          {/* Anything that didn't fit under the address continues here, so the printed header page shows every adjustment. */}
          {continued.length > 0 && record && (
            <Sheet>
              <h2 className="text-2xl font-light text-gray-900">{customer.fullName}</h2>
              <h3 className="mt-6 text-xl font-light text-gray-900">Reasonable Adjustments (continued)</h3>
              <SectionRule />
              <ul className="mt-2 divide-y divide-gray-200">
                {continued.map(item => (
                  <li key={item.id} className="py-3">
                    <RafItemDetails item={item} />
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-sm text-gray-600">Last updated on: {formatRafDate(record.lastUpdatedOn)}</p>
            </Sheet>
          )}

          {/* Index */}
          <Sheet>
            <h2 className="text-3xl font-light text-gray-900">Index</h2>
            <SectionRule />
            <ol className="mt-8 space-y-4">
              {INDEX.map(section => (
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

          {/* Start of section 1; the rest of the document isn't built in this prototype. */}
          <Sheet>
            <h2 className="text-3xl font-light text-gray-900">1 Care and support plan</h2>
            <SectionRule />
            <p className="mt-6 text-sm text-gray-800">{customer.fullName}</p>
            <p className="text-sm text-gray-700">This is version 1 of the care plan and was printed on {printedOn}.</p>
            <p className="mt-8 text-sm text-gray-400 italic">The rest of the Customer File is not shown in this prototype.</p>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
