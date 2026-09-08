import { createContext, useContext as useReactContext, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, History, Printer, Trash2, ChevronRight, CheckCircle2, Send } from 'lucide-react';
import { Button } from '../../buttons/Button';
import { useCustomer } from '../../../data/CustomerContext';
import type { CustomerProfile } from '../../../data/customers';
import { FormFieldsView, isFieldCaptured, resolveRecording, type FormField, type Recording } from '../CareBridgePage';
import { DocumentTabs } from './DocumentTabs';
import { PERSONAL_CARE_FIELDS, PERSONAL_CARE_GROUPS } from './personalCareMovingHandlingData';
import { useScrolled } from '../../../hooks/useScrolled';
import passgeniusPurpleUrl from '../../icons/passgenius-purple.svg';
import { triggerPassGeniusHover } from '../../icons/passgenius';

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
  linkedRecording: Recording | null;
  fields: FormField[];
  setFields: (fields: FormField[]) => void;
  pendingReview: boolean;
  pendingCount: number;
  passgeniusRef: React.RefObject<HTMLObjectElement | null>;
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
  const passgeniusRef = useRef<HTMLObjectElement>(null);
  const [fields, setFields] = useState<FormField[]>(PERSONAL_CARE_FIELDS);
  const linkedRecording = resolveRecording(customer.id, 'personal-care') ?? null;

  // isFieldCaptured (not a plain `!!f.value` check) so the "Risks and control
  // measures" table field — captured via `rows`, not `value` — counts toward
  // the pending total too.
  const pendingFields = fields.filter(f => isFieldCaptured(f) && f.reviewed === false);
  const pendingReview = pendingFields.length > 0;
  const pendingCount = pendingFields.length;
  const [published, setPublished] = useState(false);

  return (
    <PersonalCareDocumentContext.Provider
      value={{ customer, navigate, dirty, setDirty, published, setPublished, linkedRecording, fields, setFields, pendingReview, pendingCount, passgeniusRef }}
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
  const { customer, navigate, published, linkedRecording, fields, setFields, pendingReview, pendingCount, passgeniusRef, setDirty, setPublished } = usePersonalCareDocument();

  return (
    <div className="flex flex-col gap-4 max-w-[1280px] mx-auto">
      {published ? (
        <div className="flex items-start gap-3 rounded-lg border border-[rgb(178,224,178)] bg-[rgb(232,247,232)] px-4 py-3">
          <div className="w-7 h-7 rounded-lg bg-[rgb(212,240,212)] flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-[rgb(33,166,33)]" />
          </div>
          <div>
            <p className="text-lg font-semibold text-[rgb(12,77,12)]">Published</p>
            <p className="text-sm text-[rgb(16,100,16)] mt-0.5">
              This document has been published from the Assessment Hero draft — it's now a saved document and is no
              longer tracked as a draft.
            </p>
          </div>
        </div>
      ) : (
        <div
          className="rounded-lg border border-purple-200 shadow overflow-hidden"
          onMouseEnter={() => triggerPassGeniusHover(passgeniusRef.current, true)}
          onMouseLeave={() => triggerPassGeniusHover(passgeniusRef.current, false)}
        >
          <div className="flex items-start gap-3 bg-white px-4 py-3">
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 pt-1">
              <object ref={passgeniusRef} type="image/svg+xml" data={passgeniusPurpleUrl} className="w-8 h-8" aria-label="PASSgenius" tabIndex={-1} />
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

              {linkedRecording && (
                <p className="text-sm text-purple-800 mt-0.5">
                  Generated from <strong>{linkedRecording.label}</strong>, recorded{' '}
                  <strong>
                    {linkedRecording.recordingMeta.split(' · ')[0]} at{' '}
                    {linkedRecording.recordingMeta.split(' · ')[1].split('–')[0]}
                  </strong>{' '}
                  by <strong>{linkedRecording.recordedBy}</strong> — review the fields below and accept them to
                  confirm they're correct before they're saved to the customer file.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-purple-50 border-t border-purple-200 px-4 py-3">
            {linkedRecording ? (
              <button
                type="button"
                onClick={() => navigate(`/customers/${customer.id}/documents/recording/${linkedRecording.id}`)}
                className="flex items-center gap-1 text-sm font-medium text-[rgb(154,38,214)] hover:underline cursor-pointer"
              >
                View recording
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : <span />}

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

      <div className="flex items-center px-5 py-4 rounded-lg border border-gray-200 bg-white">
        <h2 className="text-xl font-semibold text-gray-900">Personal Care / Moving and Handling</h2>
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
                  transcript={linkedRecording?.transcript ?? []}
                  audioUrl={linkedRecording?.audioUrl}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
