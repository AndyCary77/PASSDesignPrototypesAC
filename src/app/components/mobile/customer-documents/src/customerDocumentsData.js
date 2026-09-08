// Mock data for the Customer Documents prototype (AIOP-23664 — folder
// support in Assessments & Other Documents). One customer, matching the
// Figma "Arthur Barrington" reference (file Mo0MhJ9pRTFSeDcsBOS3AU,
// node 429:4918).

// Same photo as the web app's Arthur Barrington (src/app/data/customers.ts'
// `photo: arthurPhoto`), so the two prototypes show the same person.
import arthurPhoto from '../../assets/img/Customer=Arthur Barrington.jpg'

export const CUSTOMER = {
  id: 1,
  name: 'Arthur Barrington',
  photo: arthurPhoto,
  addressLine1: '22 Dunlop Street',
  addressLine2: 'Farnham GU23 4EE',
  dob: '17/01/44',
  highRisk: true,
  legalChips: [
    { id: 'allergies', label: 'Allergies' },
    { id: 'dnacpr', label: 'DNACPR' },
    { id: 'dols', label: 'DoLS' },
  ],
}

// ─── Assessments ────────────────────────────────────────────────
// Same set (and dates) as Arthur's real Assessments in the web platform —
// STANDARD_ASSESSMENT_PACK in src/app/data/mock-documents.ts — kept flat,
// top-level, no folders, matching how they appear there. group: 'mandatory'
// | 'optional' — a classification on the document itself, shown inline on
// its row (not a folder property — see ASSESSMENT_FOLDERS below); the web
// pack carries no such distinction, so every item here is 'mandatory'.
// status: 'complete' | 'partial' | 'notStarted' — maps to the uploaded
// Mobile Icons DocumentComplete (green) / DocumentIncomplete (amber,
// "partially complete") / DocumentNotStarted (red) icons (Icons/Mobile
// Uploads/Used across multiple mobile screens/); the web pack is entirely
// status: 'success', so every item here is 'complete'. folderId is the
// foreign key onto ASSESSMENT_FOLDERS — null means "loose", not in a
// folder; every item is loose here, matching the web list's flat layout.
//
// d0 — "Personal Care / Moving and Handling" — is the exception to all of
// that: it's the mobile mirror of the same Assessment Hero demo document on
// the web platform (see ASSESSMENT_TEMPLATES['arthur-barrington'][0] in
// mock-documents.ts and PersonalCareMovingHandlingDocumentPage), not part
// of the original web pack. `status: 'partial'` stands in for the web
// version's "AI draft pending review" state — mobile has no separate draft
// status to distinguish it further. Its carebridgeTemplateId ('personal-care')
// has a matching mobile/carebridge template too (see TEMPLATES there), so
// it's selectable from "Record with CareBridge" like everything else — the
// "Select documents" picker no longer requires status === 'complete' to
// offer an item, since recording against a still-pending Assessment Hero
// draft is exactly the point, not just re-confirming an already-settled
// one. Kept first in the array so it renders at the top of the list, same
// relative position as on the web platform.
// carebridgeTemplateId links each row to its matching template in
// mobile/carebridge (see TEMPLATES there) — the "Record with CareBridge"
// picker uses this to deep-link into that recording flow.
export const ASSESSMENTS = [
  { id: 'd0', name: 'Personal Care / Moving and Handling',         group: 'mandatory', status: 'partial',  date: '05/09/2026', folderId: null, carebridgeTemplateId: 'personal-care' },
  { id: 'd1', name: 'Customer Care and Support Plan',              group: 'mandatory', status: 'complete', date: '14/05/2026', folderId: null, carebridgeTemplateId: 'careplan' },
  { id: 'd2', name: 'Consent to Care',                             group: 'mandatory', status: 'complete', date: '15/05/2026', folderId: null, carebridgeTemplateId: 'consent-care' },
  { id: 'd3', name: 'Confirmation of Receipt',                     group: 'mandatory', status: 'complete', date: '14/05/2026', folderId: null, carebridgeTemplateId: 'confirm-receipt' },
  { id: 'd4', name: 'Confirmation of Instructions',                group: 'mandatory', status: 'complete', date: '14/05/2026', folderId: null, carebridgeTemplateId: 'confirm-instructions' },
  { id: 'd5', name: 'Privacy Policy',                              group: 'mandatory', status: 'complete', date: '14/05/2026', folderId: null, carebridgeTemplateId: 'privacy' },
  { id: 'd6', name: 'Terms and Conditions of Business',            group: 'mandatory', status: 'complete', date: '14/05/2026', folderId: null, carebridgeTemplateId: 'terms' },
  { id: 'd7', name: 'Customer Guide',                              group: 'mandatory', status: 'complete', date: '14/05/2026', folderId: null, carebridgeTemplateId: 'customer-guide' },
]

// Not-yet-added optional assessment templates — offered by "Add assessment".
// Fictional (the web pack above is fixed/complete), just here to demo that
// interaction.
export const OPTIONAL_ASSESSMENT_TEMPLATES = [
  { id: 'interests',       name: 'Interests and Activities' },
  { id: 'personal-goals',  name: 'Personal Goals and Aspirations' },
  { id: 'falls-risk',      name: 'Falls Risk Assessment' },
  { id: 'nutrition',       name: 'Nutrition and Hydration Assessment' },
  { id: 'sleep',           name: 'Sleep Assessment' },
  { id: 'skin-integrity',  name: 'Skin Integrity Assessment' },
  { id: 'oral-health',     name: 'Oral Health Assessment' },
  { id: 'mental-capacity', name: 'Mental Capacity Assessment' },
]

// Empty — Arthur's real Assessments list is flat/top-level, no folders.
// Folder creation is still reachable from the "Add" menu (see
// AssessmentsScreen) if that interaction needs demoing.
export const ASSESSMENT_FOLDERS = []

// ─── Other Documents ────────────────────────────────────────────
// No `group` field at all — this section has no Mandatory/Optional concept.
// carebridgeTemplateId — same purpose as on ASSESSMENTS above: links each
// row to its matching mobile/carebridge template, so "Record with
// CareBridge" can offer these alongside Assessments, not just Assessments
// alone.

export const OTHER_DOCUMENTS = [
  { id: 1, title: 'Best Interest Decision Making - Consent to care', code: 'BBC SD09(2) Best Interest Decision Making Framework', status: 'complete', date: '10/08/2026', folderId: 'g1', carebridgeTemplateId: 'best-interest-consent' },
  { id: 2, title: 'Best Interest Decision Making - Cot Sides',       code: 'BBC SD09(2) Best Interest Decision Making Framework', status: 'complete', date: '28/07/2026', folderId: 'g1', carebridgeTemplateId: 'best-interest-cotsides' },
  { id: 3, title: 'Best Interest Decision Making - Medication',      code: 'BBC SD09(2) Best Interest Decision Making Framework', status: 'complete', date: '05/07/2026', folderId: 'g1', carebridgeTemplateId: 'best-interest-medication' },
  { id: 4, title: 'Communication Chart',                              code: 'SD05(7) My Communication chart',                       status: 'complete', date: '01/05/2026', folderId: null, carebridgeTemplateId: 'communication-chart' },
  { id: 5, title: 'Waterlow Score Assessment',                        code: 'BBC Adapted Waterlow Score assessment',                 status: 'complete', date: '01/12/2025', folderId: null, carebridgeTemplateId: 'waterlow' },
]

export const OTHER_DOCUMENT_FOLDERS = [
  { id: 'g1', name: 'Best Interest Decisions' },
]

// Offered on "Add document" — the user picks one of these first, then names
// the new document; the template's own name becomes the new document's
// `code` (matching the existing OTHER_DOCUMENTS shape above, e.g. "BBC
// SD09(2) Best Interest Decision Making Framework").
export const DOCUMENT_TEMPLATES = [
  { id: 'accident', name: 'Accident' },
  { id: 'falls-register', name: 'BBC SD15(7) Falls Register' },
  { id: 'complaint', name: 'Complaint' },
  { id: 'covid-screening', name: 'COVID-19 Screening - DO NOT EDIT' },
  { id: 'info-governance', name: 'Information Governance Incident' },
  { id: 'medication-incident', name: 'Medication Incident' },
  { id: 'safeguarding-incident', name: 'Safeguarding Incident' },
  { id: 'financial-transaction', name: 'SD16(1) Financial Transaction Sheet and Audit' },
  { id: 'medication-disposal', name: 'SD18(5) Medication Disposal Form' },
  { id: 'repositioning-chart', name: 'SD20(2) Customer Repositioning Chart' },
  { id: 'fluid-balance-chart', name: 'SD21(6) Fluid Balance Chart' },
  { id: 'food-chart', name: 'SD21(7) Food chart' },
]

let _nextAssessmentId = ASSESSMENTS.length + 1
export function nextAssessmentId() { return _nextAssessmentId++ }

let _nextOtherDocId = OTHER_DOCUMENTS.length + 1
export function nextOtherDocId() { return _nextOtherDocId++ }

let _nextFolderId = ASSESSMENT_FOLDERS.length + OTHER_DOCUMENT_FOLDERS.length + 1
export function nextFolderId() { return `f${_nextFolderId++}` }
