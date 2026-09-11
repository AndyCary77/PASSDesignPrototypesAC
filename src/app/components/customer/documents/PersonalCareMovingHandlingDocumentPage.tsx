import { createContext, useContext as useReactContext, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, History, Printer, Trash2, Send } from 'lucide-react';
import { Button } from '../../buttons/Button';
import { useCustomer } from '../../../data/CustomerContext';
import type { CustomerProfile } from '../../../data/customers';
import {
  FormFieldsView,
  isFieldCaptured,
  resolveRecording,
  ChangeRecordingsButton,
  RecordingsLink,
  AssessmentHeroReuseBanner,
  PublishedConfirmationBanner,
  type FormField,
  type Recording,
  type RecordingSelectionMode,
} from '../CareBridgePage';
import { DocumentTabs } from './DocumentTabs';
import { PERSONAL_CARE_FIELDS, PERSONAL_CARE_GROUPS } from './personalCareMovingHandlingData';
import { useScrolled } from '../../../hooks/useScrolled';
import assessmentHeroIconUrl from '../../icons/assessment-hero.svg';

// A single, focused document — no left-hand section nav, no relink/upload
// machinery, always sourced from the customer's own 'personal-care'
// recording (a separate, later visit from the Initial Assessment — see
// ARTHUR_PERSONAL_CARE_TRANSCRIPT). Deliberately the simpler sibling of
// CarePlanDocumentPage (16 sections, replace/unlink a recording, upload
// simulation): built for Arthur's demo specifically because that complexity
// read as too much for a quick walkthrough of the review flow — see
// personalCareMovingHandlingData.ts.

interface PersonalCareDocumentState {
  customer: CustomerProfile;
  navigate: ReturnType<typeof useNavigate>;
  dirty: boolean;
  setDirty: (dirty: boolean) => void;
  published: boolean;
  setPublished: (published: boolean) => void;
  linkedRecordings: Recording[];
  linkedRecordingIds: string[];
  handleChangeRecordings: (ids: string[], mode: RecordingSelectionMode) => void;
  fields: FormField[];
  setFields: (fields: FormField[]) => void;
  pendingReview: boolean;
  pendingCount: number;
}

const PersonalCareDocumentContext = createContext<PersonalCareDocumentState | null>(null);

function usePersonalCareDocument(): PersonalCareDocumentState {
  const ctx = useReactContext(PersonalCareDocumentContext);
  if (!ctx) throw new Error('usePersonalCareDocument must be used within PersonalCareDocumentProvider');
  return ctx;
}

/**
 * Holds all state for the "Personal Care / Moving and Handling" click-through
 * so the pinned sub-nav and the scrolling content below can both read/act on
 * it as siblings — same mechanism as CarePlanDocumentPage/WhatIsImportantToMeDocumentPage.
 */
export function PersonalCareDocumentProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const customer = useCustomer();
  const [dirty, setDirty] = useState(false);
  const [fields, setFields] = useState<FormField[]>(PERSONAL_CARE_FIELDS);
  // 'personal-care' is the one recording every existing field's sourceLines
  // actually came from — kept as an explicit, changeable set (rather than a
  // single fixed id) so "Change recording(s)" below has something to act on.
  const [linkedRecordingIds, setLinkedRecordingIds] = useState<string[]>(['personal-care']);
  const linkedRecordings: Recording[] = linkedRecordingIds
    .map(id => resolveRecording(customer.id, id))
    .filter((r): r is Recording => !!r);
  const [published, setPublished] = useState(false);

  // Merge just extends the linked set — every field keeps whatever citation
  // it already had. Replace only touches existing citations if
  // 'personal-care' (the recording every current sourceLines reference)
  // itself is dropped — in which case every field's citation is cleared
  // (honest gap, not the field's drafted value — there's no alternate
  // content to regenerate from) and marked pending again, rather than left
  // pointing at a transcript this document no longer draws on while still
  // reading as reviewed. This is also what makes reopening "Change
  // recording(s)" from AssessmentHeroReuseBanner (shown once published)
  // actually useful rather than a dead end: dropping the source kicks the
  // document back into draft/review, same as Publish being un-done — a
  // pure Merge, which invalidates nothing, leaves `published` alone.
  const handleChangeRecordings = (ids: string[], mode: RecordingSelectionMode) => {
    if (mode === 'replace') {
      if (!ids.includes('personal-care')) {
        setFields(prev => prev.map(f => ({ ...f, sourceLines: undefined, reviewed: false })));
        setPublished(false);
      }
      setLinkedRecordingIds(ids);
    } else {
      setLinkedRecordingIds(prev => Array.from(new Set([...prev, ...ids])));
    }
  };

  // isFieldCaptured (not a plain `!!f.value` check) so the "Risks and control
  // measures" table field — captured via `rows`, not `value` — counts toward
  // the pending total too.
  const pendingFields = fields.filter(f => isFieldCaptured(f) && f.reviewed === false);
  const pendingReview = pendingFields.length > 0;
  const pendingCount = pendingFields.length;

  return (
    <PersonalCareDocumentContext.Provider
      value={{
        customer, navigate, dirty, setDirty, published, setPublished,
        linkedRecordings, linkedRecordingIds, handleChangeRecordings,
        fields, setFields, pendingReview, pendingCount,
      }}
    >
      {children}
    </PersonalCareDocumentContext.Provider>
  );
}

/** Pinned sub-nav — same sticky treatment as the other document click-throughs. */
export function PersonalCareDocumentSubnav() {
  const { customer, navigate, dirty, published, setDirty } = usePersonalCareDocument();
  const scrolled = useScrolled();

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="max-w-[1280px] mx-auto">
          <div className={`flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3.5'}`}>
            <Button
              variant="tertiary"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate(`/customers/${customer.id}/documents?tab=assessments`)}
            >
              Back
            </Button>

            <div className="flex items-center gap-3">
              <Button variant="tertiary" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>Print</Button>
              <Button variant="tertiary-danger" icon={<Trash2 className="w-4 h-4" />}>Delete</Button>
              <Button disabled={published && !dirty} onClick={() => setDirty(false)}>
                {published ? 'Save' : 'Save Draft'}
              </Button>
            </div>
          </div>

          <div className={`border-t border-gray-200 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3'}`}>
            <DocumentTabs activeTab="assessments" onTabChange={tab => navigate(`/customers/${customer.id}/documents?tab=${tab}`)} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Everything below the pinned sub-nav — the Assessment Hero Draft panel, title bar, History and the form itself. */
export function PersonalCareDocumentContent() {
  const {
    customer, navigate, published, linkedRecordings, linkedRecordingIds, handleChangeRecordings,
    fields, setFields, pendingReview, pendingCount, setDirty, setPublished,
  } = usePersonalCareDocument();
  // Every field's sourceLines (where still present — see
  // handleChangeRecordings) indexes into 'personal-care' specifically,
  // regardless of what else is currently linked, so the transcript passed
  // to FormFieldsView stays fixed to that one recording.
  const citedRecording = resolveRecording(customer.id, 'personal-care');
  const scrolled = useScrolled();

  return (
    <div className="flex flex-col gap-4 max-w-[1280px] mx-auto">
      {published ? (
        <div className="flex flex-col gap-3">
          <PublishedConfirmationBanner />
          <AssessmentHeroReuseBanner
            customerId={customer.id}
            linkedRecordings={linkedRecordings}
            linkedRecordingIds={linkedRecordingIds}
            onConfirm={handleChangeRecordings}
            navigate={navigate}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-purple-200 shadow overflow-hidden">
          <div className="flex items-start gap-3 bg-white px-4 py-3">
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 pt-1">
              <img src={assessmentHeroIconUrl} className="w-8 h-8" alt="Assessment Hero" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                Assessment Hero Draft
                {pendingCount > 0 && (
                  <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    {pendingCount} {pendingCount === 1 ? 'field' : 'fields'} to review
                  </span>
                )}
              </p>

              {linkedRecordings.length === 1 && (
                <p className="text-sm text-purple-800 mt-0.5">
                  Generated from <strong>{linkedRecordings[0].label}</strong>, recorded{' '}
                  <strong>
                    {linkedRecordings[0].recordingMeta.split(' · ')[0]} at{' '}
                    {linkedRecordings[0].recordingMeta.split(' · ')[1].split('–')[0]}
                  </strong>{' '}
                  by <strong>{linkedRecordings[0].recordedBy}</strong> — please review before accepting.
                </p>
              )}
              {linkedRecordings.length > 1 && (
                <p className="text-sm text-purple-800 mt-0.5">
                  Generated from <strong>{linkedRecordings.length} recordings</strong> — not every entry is a direct
                  quote, so please review before accepting.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 bg-purple-50 border-t border-purple-200 px-4 py-3">
            <div className="flex items-center gap-4">
              <RecordingsLink customerId={customer.id} recordings={linkedRecordings} navigate={navigate} />
              {linkedRecordings.length === 0 && <span />}
              <ChangeRecordingsButton
                customerId={customer.id}
                linkedRecordingIds={linkedRecordingIds}
                onConfirm={handleChangeRecordings}
              />
            </div>

            <Button
              icon={<Send className="w-4 h-4" />}
              disabled={pendingReview}
              title={pendingReview ? 'Accept the outstanding drafted fields before publishing' : undefined}
              onClick={() => setPublished(true)}
            >
              Publish
            </Button>
          </div>
        </div>
      )}

      {/* Sticky beneath the pinned sub-nav, in an opaque bg-gray-50 shell that
          swallows the gap-4 above it — see the matching note in
          CarePlanDocumentPage. */}
      <div
        className={`sticky z-30 bg-gray-50 -mt-4 pt-4 transition-all duration-300 ${
          scrolled ? 'top-[263px]' : 'top-[335px]'
        }`}
      >
        <div
          className={`flex items-center justify-center px-5 rounded-lg border border-gray-200 transition-all duration-300 ${
            scrolled ? 'py-2' : 'py-4'
          }`}
          style={{ backgroundColor: '#6d1b98' }}
        >
          <h2 className="text-xl font-semibold text-white">Personal Care / Moving and Handling</h2>
        </div>
      </div>

      <div>
        <Button variant="tertiary" icon={<History className="w-4 h-4" />}>History</Button>
      </div>

      {/* Single continuous section — no left-hand nav like the Care Plan's
          16 sections, matching how simple the real example actually is. */}
      <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm p-6" onChange={() => setDirty(true)}>
        {PERSONAL_CARE_GROUPS.map((group, i) => {
          const groupFields = fields.filter(f => group.fieldIds.includes(f.id));
          return (
            <div key={i} className={i > 0 ? 'mt-6' : undefined}>
              {group.heading && <h2 className="text-lg font-semibold text-gray-900 mb-3">{group.heading}</h2>}
              {group.subheading && <h3 className="text-sm font-semibold text-gray-700 mb-2">{group.subheading}</h3>}
              {groupFields.length > 0 && (
                <FormFieldsView
                  fields={groupFields}
                  onChange={updated => setFields(fields.map(f => updated.find(u => u.id === f.id) ?? f))}
                  transcript={citedRecording?.transcript ?? []}
                  audioUrl={citedRecording?.audioUrl}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
