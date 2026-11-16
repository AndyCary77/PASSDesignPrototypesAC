// Mock uploads for the Documents › Files tab — the loose files a care office attaches to a customer's record
// (referral paperwork, signed agreements, hospital letters, legal documents), as opposed to the structured
// Documents / Assessments the platform generates itself. Names are the kind of thing a coordinator or
// careworker would actually upload: scanned PDFs, Word templates, a phone photo of a key safe.
//
// Everything is static. `sizeBytes` is stored as a number so the table can sort by size and format it
// (3.1 MB, 26.5 kB) the same way the production grid does. Timestamps are local ISO strings; "today" in the
// prototype is 16 Nov 2026, so the most recent uploads land on that date.

export type FileExtension = 'pdf' | 'docx' | 'xlsx' | 'jpg';

export interface CustomerFile {
  id: string;
  /** Name without the extension — the extension is its own column. */
  name: string;
  extension: FileExtension;
  sizeBytes: number;
  uploaded: string;  // 'YYYY-MM-DDTHH:mm'
  modified: string;  // 'YYYY-MM-DDTHH:mm' — equal to `uploaded` unless the file has been renamed/replaced
  uploadedBy: string;
}

const KB = 1000;
const MB = 1000 * 1000;

export const CUSTOMER_FILES: Record<string, CustomerFile[]> = {
  'arthur-barrington': [
    {
      id: 'ab-1', name: 'Hospital Discharge Summary - Hip Fracture', extension: 'pdf',
      sizeBytes: 1.8 * MB, uploaded: '2026-11-16T09:41', modified: '2026-11-16T09:41', uploadedBy: 'Admin',
    },
    {
      id: 'ab-2', name: 'Moving and Handling Risk Assessment', extension: 'docx',
      sizeBytes: 412 * KB, uploaded: '2026-11-16T10:05', modified: '2026-11-16T10:32', uploadedBy: 'Priya Sharma',
    },
    {
      id: 'ab-3', name: 'Falls Risk Assessment (Initial)', extension: 'docx',
      sizeBytes: 96.4 * KB, uploaded: '2026-11-13T15:18', modified: '2026-11-13T15:18', uploadedBy: 'Priya Sharma',
    },
    {
      id: 'ab-4', name: 'Occupational Therapy Report - Bed and Stair Rails', extension: 'pdf',
      sizeBytes: 1.1 * MB, uploaded: '2026-11-12T11:52', modified: '2026-11-12T11:52', uploadedBy: 'Admin',
    },
    {
      id: 'ab-5', name: 'GP Medication List - October 2026', extension: 'pdf',
      sizeBytes: 188 * KB, uploaded: '2026-10-20T16:33', modified: '2026-10-20T16:33', uploadedBy: 'Adrianna Janowski',
    },
    {
      id: 'ab-6', name: 'Key Safe Location and Access Instructions', extension: 'docx',
      sizeBytes: 31.4 * KB, uploaded: '2026-10-05T08:47', modified: '2026-10-19T13:10', uploadedBy: 'Admin',
    },
    {
      id: 'ab-7', name: 'Front Door Key Safe Photo', extension: 'jpg',
      sizeBytes: 2.6 * MB, uploaded: '2026-10-05T08:49', modified: '2026-10-05T08:49', uploadedBy: 'Adrianna Janowski',
    },
    {
      id: 'ab-8', name: 'Signed Service Agreement - Arthur Barrington', extension: 'pdf',
      sizeBytes: 2.4 * MB, uploaded: '2026-10-02T14:20', modified: '2026-10-02T14:20', uploadedBy: 'Admin',
    },
    {
      id: 'ab-9', name: 'Funding Approval Letter - Birmingham City Council', extension: 'pdf',
      sizeBytes: 214 * KB, uploaded: '2026-09-29T10:04', modified: '2026-09-29T10:04', uploadedBy: 'Admin',
    },
    {
      id: 'ab-10', name: 'DNACPR Form (Original Copy)', extension: 'pdf',
      sizeBytes: 640 * KB, uploaded: '2026-09-28T11:12', modified: '2026-09-28T11:12', uploadedBy: 'Admin',
    },
    {
      id: 'ab-11', name: 'Lasting Power of Attorney - Health and Welfare', extension: 'pdf',
      sizeBytes: 3.2 * MB, uploaded: '2026-09-28T11:15', modified: '2026-09-28T11:15', uploadedBy: 'Admin',
    },
  ],

  'vera-bramwell': [
    {
      id: 'vb-1', name: 'Initial Assessment Notes - Home Visit', extension: 'docx',
      sizeBytes: 148 * KB, uploaded: '2026-11-16T11:09', modified: '2026-11-16T11:40', uploadedBy: 'Priya Sharma',
    },
    {
      id: 'vb-2', name: 'Nutrition and Hydration Screening (MUST)', extension: 'docx',
      sizeBytes: 58.7 * KB, uploaded: '2026-11-16T11:08', modified: '2026-11-16T11:08', uploadedBy: 'Priya Sharma',
    },
    {
      id: 'vb-3', name: 'District Nurse Handover - Pressure Care', extension: 'pdf',
      sizeBytes: 326 * KB, uploaded: '2026-11-11T14:26', modified: '2026-11-11T14:26', uploadedBy: 'Admin',
    },
    {
      id: 'vb-4', name: 'GP Surgery Letter - Medication Review', extension: 'pdf',
      sizeBytes: 172 * KB, uploaded: '2026-11-09T09:15', modified: '2026-11-09T09:15', uploadedBy: 'Admin',
    },
    {
      id: 'vb-5', name: 'Mental Capacity Assessment - Managing Finances', extension: 'pdf',
      sizeBytes: 905 * KB, uploaded: '2026-11-06T16:02', modified: '2026-11-06T16:02', uploadedBy: 'Priya Sharma',
    },
    {
      id: 'vb-6', name: 'Medication Administration Consent Form', extension: 'pdf',
      sizeBytes: 1.3 * MB, uploaded: '2026-11-04T12:30', modified: '2026-11-04T12:30', uploadedBy: 'Admin',
    },
    {
      id: 'vb-7', name: 'Care Package Referral - Staffordshire County Council', extension: 'pdf',
      sizeBytes: 2.1 * MB, uploaded: '2026-11-02T10:11', modified: '2026-11-02T10:11', uploadedBy: 'Admin',
    },
    {
      id: 'vb-8', name: 'Next of Kin and Emergency Contacts', extension: 'xlsx',
      sizeBytes: 24.2 * KB, uploaded: '2026-11-02T10:14', modified: '2026-11-05T09:48', uploadedBy: 'Admin',
    },
  ],
  // Edith has no uploads yet, so her Files tab shows its empty state.
};

/** 1.8 MB / 412 kB / 26.5 kB — decimal units, one decimal place, like the production file grid. */
export function formatFileSize(bytes: number): string {
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`;
  return `${(bytes / KB).toFixed(bytes >= 100 * KB ? 0 : 1)} kB`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 'Nov 16 2026, 11:09' — the production grid's date format. */
export function formatFileDate(iso: string): string {
  const [date, time] = iso.split('T');
  const [y, m, d] = date.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d} ${y}, ${time}`;
}
