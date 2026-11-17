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
  /** Which folder in the Files tab it sits in — shown in Assessment Hero's source picker. */
  folder: string;
  /**
   * Set when Assessment Hero can't read the file's content: a password-protected PDF, a damaged file, or a scan
   * with no text layer (scanned PDFs aren't read with OCR in this phase). Drafting from it names the file and
   * drafts nothing from it (AIOP-24513). Left unset for a normal, readable file.
   */
  readability?: FileReadability;
  /** The date written in the document itself (the letter's date, the assessment date) — not the upload date. YYYY-MM-DD. */
  documentDate?: string;
  /** The document has a date but Assessment Hero can't be sure of it (handwritten, smudged, ambiguous). */
  dateUncertain?: boolean;
  /** A legal document — a Lasting Power of Attorney, a DNACPR, a signed consent. Never overridden by a newer non-legal source. */
  legal?: boolean;
}

export type FileReadability = 'password-protected' | 'corrupt' | 'no-text';

/** The formats Assessment Hero can read as a source: PDF and Word. Anything else is listed but can't be selected. */
export const SOURCE_EXTENSIONS: FileExtension[] = ['pdf', 'docx'];
export const isSupportedSource = (f: Pick<CustomerFile, 'extension'>) => SOURCE_EXTENSIONS.includes(f.extension);

export function getFileReadability(customerId: string, fileId: string): FileReadability | undefined {
  return CUSTOMER_FILES[customerId]?.find(f => f.id === fileId)?.readability;
}

const KB = 1000;
const MB = 1000 * 1000;

export const CUSTOMER_FILES: Record<string, CustomerFile[]> = {
  'arthur-barrington': [
    {
      id: 'ab-1', name: 'Hospital Discharge Summary - Hip Fracture', extension: 'pdf',
      sizeBytes: 1.8 * MB, uploaded: '2026-11-16T09:41', modified: '2026-11-16T09:41', uploadedBy: 'Admin', folder: 'Health and hospital', documentDate: '2026-11-05',
    },
    {
      id: 'ab-2', name: 'Moving and Handling Risk Assessment', extension: 'docx',
      sizeBytes: 412 * KB, uploaded: '2026-11-16T10:05', modified: '2026-11-16T10:32', uploadedBy: 'Priya Sharma', folder: 'Assessments', documentDate: '2026-11-14', dateUncertain: true,
    },
    {
      id: 'ab-3', name: 'Falls Risk Assessment (Initial)', extension: 'docx',
      sizeBytes: 96.4 * KB, uploaded: '2026-11-13T15:18', modified: '2026-11-13T15:18', uploadedBy: 'Priya Sharma', folder: 'Assessments', documentDate: '2026-11-12',
    },
    {
      id: 'ab-4', name: 'Occupational Therapy Report - Bed and Stair Rails', extension: 'pdf',
      sizeBytes: 1.1 * MB, uploaded: '2026-11-12T11:52', modified: '2026-11-12T11:52', uploadedBy: 'Admin', folder: 'Health and hospital', documentDate: '2026-11-10',
    },
    {
      id: 'ab-5', name: 'GP Medication List - October 2026', extension: 'pdf',
      sizeBytes: 188 * KB, uploaded: '2026-10-20T16:33', modified: '2026-10-20T16:33', uploadedBy: 'Adrianna Janowski', folder: 'Health and hospital', documentDate: '2026-10-20',
    },
    {
      id: 'ab-6', name: 'Key Safe Location and Access Instructions', extension: 'docx',
      sizeBytes: 31.4 * KB, uploaded: '2026-10-05T08:47', modified: '2026-10-19T13:10', uploadedBy: 'Admin', folder: 'Access and safety', readability: 'corrupt', documentDate: '2026-10-05',
    },
    {
      id: 'ab-7', name: 'Front Door Key Safe Photo', extension: 'jpg',
      sizeBytes: 2.6 * MB, uploaded: '2026-10-05T08:49', modified: '2026-10-05T08:49', uploadedBy: 'Adrianna Janowski', folder: 'Access and safety',
    },
    {
      id: 'ab-8', name: 'Signed Service Agreement - Arthur Barrington', extension: 'pdf',
      sizeBytes: 2.4 * MB, uploaded: '2026-10-02T14:20', modified: '2026-10-02T14:20', uploadedBy: 'Admin', folder: 'Agreements and funding', readability: 'no-text', documentDate: '2026-10-02',
    },
    {
      id: 'ab-9', name: 'Funding Approval Letter - Birmingham City Council', extension: 'pdf',
      sizeBytes: 214 * KB, uploaded: '2026-09-29T10:04', modified: '2026-09-29T10:04', uploadedBy: 'Admin', folder: 'Agreements and funding', readability: 'password-protected', documentDate: '2026-09-29',
    },
    {
      id: 'ab-10', name: 'DNACPR Form (Original Copy)', extension: 'pdf',
      sizeBytes: 640 * KB, uploaded: '2026-09-28T11:12', modified: '2026-09-28T11:12', uploadedBy: 'Admin', folder: 'Legal', documentDate: '2026-09-20', legal: true,
    },
    {
      id: 'ab-11', name: 'Lasting Power of Attorney - Health and Welfare', extension: 'pdf',
      sizeBytes: 3.2 * MB, uploaded: '2026-09-28T11:15', modified: '2026-09-28T11:15', uploadedBy: 'Admin', folder: 'Legal', documentDate: '2026-08-14', legal: true,
    },
  ],

  'vera-bramwell': [
    {
      id: 'vb-1', name: 'Initial Assessment Notes - Home Visit', extension: 'docx',
      sizeBytes: 148 * KB, uploaded: '2026-11-16T11:09', modified: '2026-11-16T11:40', uploadedBy: 'Priya Sharma', folder: 'Assessments', documentDate: '2026-11-02',
    },
    {
      id: 'vb-2', name: 'Nutrition and Hydration Screening (MUST)', extension: 'docx',
      sizeBytes: 58.7 * KB, uploaded: '2026-11-16T11:08', modified: '2026-11-16T11:08', uploadedBy: 'Priya Sharma', folder: 'Assessments', documentDate: '2026-11-10',
    },
    {
      id: 'vb-3', name: 'District Nurse Handover - Pressure Care', extension: 'pdf',
      sizeBytes: 326 * KB, uploaded: '2026-11-11T14:26', modified: '2026-11-11T14:26', uploadedBy: 'Admin', folder: 'Health and hospital', documentDate: '2026-11-09',
    },
    {
      id: 'vb-4', name: 'GP Surgery Letter - Medication Review', extension: 'pdf',
      sizeBytes: 172 * KB, uploaded: '2026-11-09T09:15', modified: '2026-11-09T09:15', uploadedBy: 'Admin', folder: 'Health and hospital', documentDate: '2026-11-08',
    },
    {
      id: 'vb-5', name: 'Mental Capacity Assessment - Managing Finances', extension: 'pdf',
      sizeBytes: 905 * KB, uploaded: '2026-11-06T16:02', modified: '2026-11-06T16:02', uploadedBy: 'Priya Sharma', folder: 'Legal', documentDate: '2026-11-05', legal: true,
    },
    {
      id: 'vb-6', name: 'Medication Administration Consent Form', extension: 'pdf',
      sizeBytes: 1.3 * MB, uploaded: '2026-11-04T12:30', modified: '2026-11-04T12:30', uploadedBy: 'Admin', folder: 'Legal', readability: 'no-text', documentDate: '2026-11-04', legal: true,
    },
    {
      id: 'vb-7', name: 'Care Package Referral - Staffordshire County Council', extension: 'pdf',
      sizeBytes: 2.1 * MB, uploaded: '2026-11-02T10:11', modified: '2026-11-02T10:11', uploadedBy: 'Admin', folder: 'Referral', readability: 'password-protected', documentDate: '2026-11-01',
    },
    {
      id: 'vb-8', name: 'Next of Kin and Emergency Contacts', extension: 'xlsx',
      sizeBytes: 24.2 * KB, uploaded: '2026-11-02T10:14', modified: '2026-11-05T09:48', uploadedBy: 'Admin', folder: 'Referral',
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
