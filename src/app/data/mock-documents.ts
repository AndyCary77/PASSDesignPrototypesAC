export interface Document {
  id: string;
  status: 'success' | 'danger' | 'warning' | 'draft';
  title: string;
  subtitle?: string;
  createdDate: string;
  /** Only some records carry a review date (e.g. a periodic review or follow-up meeting). */
  reviewDate?: string;
  category: string;
  /** If set, the row links through to this route instead of just looking clickable. */
  to?: string;
}

// ─── Documents ──────────────────────────────────────────────────────────────────
// The customer's own ad hoc record store — completed reviews, follow-up
// meeting notes and one-off audits get filed here, per customer.

export const CUSTOMER_DOCUMENTS: Record<string, Document[]> = {
  'arthur-barrington': [
    {
      id: '1',
      status: 'success',
      title: '28/11/2025',
      subtitle: '6 monthly Review of Customer Care',
      createdDate: '28/11/2025',
      category: 'Information Governance',
    },
    {
      id: '2',
      status: 'success',
      title: '15/11/2025',
      subtitle: '6 monthly Review of Customer Care',
      createdDate: '15/11/2025',
      category: 'Information Governance',
    },
    {
      id: '3',
      status: 'success',
      title: '4 Week Review of Care',
      subtitle: '4 Week Review of Care - DO NOT USE',
      createdDate: '22/10/2025',
      category: 'Other',
    },
    {
      id: '4',
      status: 'success',
      title: 'Good visit',
      subtitle: 'Positve Outcome form (win Form)',
      createdDate: '10/10/2025',
      category: 'Other',
    },
    {
      id: '5',
      status: 'success',
      title: '1st week - Visit review',
      subtitle: '1st week - telephone review',
      createdDate: '15/09/2025',
      category: 'Information Governance',
    },
    {
      id: '6',
      status: 'success',
      title: 'Covid-19 Risk assessment',
      createdDate: '03/09/2025',
      category: 'Infection Control',
    },
    {
      id: '7',
      status: 'success',
      title: 'Mask wearing checklist',
      createdDate: '15/07/2025',
      category: 'Infection Control',
    },
    {
      id: '8',
      status: 'success',
      title: 'Oral Health Risk Assessment',
      createdDate: '20/06/2025',
      category: 'Medication',
    },
    {
      id: '9',
      status: 'danger',
      title: 'Update / Communication form',
      createdDate: '10/03/2025',
      category: 'Information Governance',
    },
    {
      id: '10',
      status: 'warning',
      title: 'Care Plan Review',
      subtitle: 'Annual review pending approval',
      createdDate: '05/12/2025',
      reviewDate: '05/12/2025',
      category: 'Safe Guarding',
    },
  ],
  // Follow-up meetings (6/2-week reviews) and audits, filed as documents —
  // none of these are the Care and Support Plan, so all read as incomplete.
  'edith-caldwell': [
    {
      id: 'e1',
      status: 'danger',
      title: '6 week review July 26',
      subtitle: '6 Week review',
      createdDate: '09/07/2026',
      reviewDate: '09/01/2027',
      category: 'Information Governance',
    },
    {
      id: 'e2',
      status: 'danger',
      title: '2 Week review',
      createdDate: '04/06/2026',
      category: 'Information Governance',
    },
    {
      id: 'e3',
      status: 'danger',
      title: 'Care note audit May 26',
      subtitle: 'Daily notes audit',
      createdDate: '02/06/2026',
      category: 'Other',
    },
  ],
};

// ─── Assessments ────────────────────────────────────────────────────────────────
// The standard assessment/onboarding template pack — the same set of
// compliance forms applies to every customer, so this list isn't
// customer-specific the way Documents is; every customer id maps to the
// same pack below.
// (Note: only the first 4 of these were visible in the reference screenshot
// used to build this — "12 items" was shown there, so there may be a few
// more real templates in the actual pack than are listed here.)

const STANDARD_ASSESSMENT_PACK: Document[] = [
  { id: 'd1', status: 'success', title: 'BBC SD05 (6) Customer Care and Support Plan', createdDate: '14/05/2026', category: 'Other' },
  { id: 'd2', status: 'success', title: 'Consent to Care', createdDate: '15/05/2026', category: 'Other' },
  { id: 'd3', status: 'success', title: 'Confirmation of Receipt', createdDate: '14/05/2026', category: 'Other' },
  { id: 'd4', status: 'success', title: 'Confirmation of Instructions', createdDate: '14/05/2026', category: 'Other' },
  { id: 'd5', status: 'success', title: 'Privacy Policy', createdDate: '14/05/2026', category: 'Other' },
  { id: 'd6', status: 'success', title: 'Terms and Conditions of Business', createdDate: '14/05/2026', category: 'Other' },
  { id: 'd7', status: 'success', title: 'Customer Guide', createdDate: '14/05/2026', category: 'Other' },
];

export const ASSESSMENT_TEMPLATES: Record<string, Document[]> = {
  // Arthur is the demo persona for Assessment Hero (2026-09-07) — his
  // assessment list has a click-through into an AI-drafted, pending-review
  // document, same shape as Edith's own Care and Support Plan entry below,
  // rather than the plain "BBC SD05 (6)" row from the shared pack. Swapped
  // (2026-09-08) from the full 16-section Care and Support Plan to the much
  // simpler single-page "Personal Care / Moving and Handling" — the 16-section
  // document read as too much to walk through in a quick demo of the review
  // flow; see PersonalCareMovingHandlingDocumentPage.
  //
  // 2026-09-11: also given a genuine, separate, *completed* "Customer Care
  // and Support Plan" row (his real 16-section document — see
  // CarePlanDocumentPage/CareBridgePage's RECORDINGS['arthur-barrington'],
  // which already has it as the 'initial' recording's isCarePlanFocus
  // document) so Care Management's "drafted from completed documents"
  // banner has two genuinely separate, real documents to cite — see
  // CareManagementContext.tsx's draftSourceDocuments. Personal Care /
  // Moving and Handling's own status flipped from 'draft' to 'success' at
  // the same time — CarePlanDraftSourcePicker (ChangeDocumentsButton's
  // picker) only offers/pre-checks documents getCompletedDocuments
  // considers complete, so leaving it 'draft' meant a document this plan
  // is actually cited as drafted from wasn't even selectable there, and
  // "Update" with no changes would have silently dropped it. (Each
  // document's own page still tracks its *own* Assessment Hero
  // review/publish state independently of this list-row status — same
  // simplification already accepted for the Care Plan row above.)
  'arthur-barrington': [
    {
      ...STANDARD_ASSESSMENT_PACK[0],
      id: 'd0',
      status: 'success',
      title: 'Customer Care and Support Plan',
      to: '/customers/arthur-barrington/documents/care-plan',
    },
    {
      ...STANDARD_ASSESSMENT_PACK[0],
      status: 'success',
      title: 'Personal Care / Moving and Handling',
      to: '/customers/arthur-barrington/documents/personal-care',
    },
    ...STANDARD_ASSESSMENT_PACK.slice(1),
  ],
  // Edith's Care and Support Plan is click-through — no form-code prefix,
  // it opens the same Care Plan view CareBridge shows for her, and it's a
  // draft rather than complete/incomplete. Consent to Care and the Privacy
  // Policy are already signed; the rest are still outstanding — a mix so
  // every status shows together in the list.
  'edith-caldwell': [
    {
      ...STANDARD_ASSESSMENT_PACK[0],
      status: 'draft',
      title: 'Customer Care and Support Plan',
      to: '/customers/edith-caldwell/documents/care-plan',
    },
    // Sits right under the Care Plan — starts incomplete (blank, no recording
    // linked yet); linking one on the click-through drafts it in.
    {
      id: 'd-wiitm',
      status: 'danger',
      title: 'What Is Important To Me',
      createdDate: '14/05/2026',
      category: 'Other',
      to: '/customers/edith-caldwell/documents/wiitm',
    },
    ...STANDARD_ASSESSMENT_PACK.slice(1).map(doc => ({
      ...doc,
      status: (doc.title === 'Consent to Care' || doc.title === 'Privacy Policy' ? 'success' : 'danger') as const,
    })),
  ],
  // Same shape as Edith's for the rest of the pack — same mix of signed vs
  // outstanding, since nothing about which forms are signed is specific to
  // either of them. The Care and Support Plan and What Is Important To Me
  // both diverge deliberately: complete rather than draft/incomplete, since
  // Vera's flow is being built around drafting the care plan from her
  // completed assessment documents instead of from a CareBridge recording
  // (see project notes) — documents still mid-draft wouldn't make sense as
  // that flow's source.
  'vera-bramwell': [
    {
      ...STANDARD_ASSESSMENT_PACK[0],
      status: 'success',
      title: 'Customer Care and Support Plan',
      to: '/customers/vera-bramwell/documents/care-plan',
    },
    {
      id: 'd-wiitm',
      status: 'success',
      title: 'What Is Important To Me',
      createdDate: '14/05/2026',
      category: 'Other',
      to: '/customers/vera-bramwell/documents/wiitm',
    },
    ...STANDARD_ASSESSMENT_PACK.slice(1).map(doc => ({
      ...doc,
      status: (doc.title === 'Consent to Care' || doc.title === 'Privacy Policy' ? 'success' : 'danger') as const,
    })),
  ],
};

/**
 * A customer's completed (status: 'success') documents, split by which tab
 * they live on — powers the "Draft care plan from completed documents" flow
 * in Care Management (see CarePlanDraftSourcePicker in
 * caremanagement/shared.tsx): Assessments is the default source, Documents
 * is there to also draw from if the reviewer wants to include one.
 */
export function getCompletedDocuments(customerId: string): { assessments: Document[]; documents: Document[] } {
  return {
    assessments: (ASSESSMENT_TEMPLATES[customerId] ?? []).filter(d => d.status === 'success'),
    documents: (CUSTOMER_DOCUMENTS[customerId] ?? []).filter(d => d.status === 'success'),
  };
}
