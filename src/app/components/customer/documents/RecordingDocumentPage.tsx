import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Mic, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '../../buttons/Button';
import { useCustomer } from '../../../data/CustomerContext';
import { resolveRecordings, RecordingDocumentView } from '../CareBridgePage';
import { DocumentTabs } from './DocumentTabs';

/** The Documents tab's CareBridge click-through — duplicates the main CareBridge tab's recording view so it can be demoed without leaving Documents. */
export function RecordingDocumentPage() {
  const { recordingId } = useParams();
  const navigate = useNavigate();
  const customer = useCustomer();
  const recording = resolveRecordings(customer.id).find(r => r.id === recordingId);

  if (!recording) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">
        Recording not found.
      </div>
    );
  }

  return (
    // Matches the Documents/Assessments list and CustomerDetailsPage's two-column width.
    <div className="flex flex-col gap-4 max-w-[1280px] mx-auto">
      {/* Keeps the sub-nav visible (and "CareBridge" active) on this
          click-through, rather than it disappearing once you drill in. */}
      <DocumentTabs activeTab="carebridge" onTabChange={tab => navigate(`/customers/${customer.id}/documents?tab=${tab}`)} />

      <div className="flex items-center justify-between">
        <Button
          variant="tertiary"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate(`/customers/${customer.id}/documents?tab=carebridge`)}
        >
          Back
        </Button>
        <Button variant="tertiary" icon={<Trash2 className="w-4 h-4" />}>Delete</Button>
      </div>

      <div className="flex items-center justify-between gap-3 px-5 py-4 rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Mic className="w-4 h-4 text-[rgb(154,38,214)]" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{recording.label}</h2>
            <p className="text-body text-gray-500">{recording.recordingMeta}</p>
          </div>
        </div>

        {/* Jumps to wherever this recording's draft actually lives — a
            standalone document page (Care Plan, or another via
            focusDocumentPath) when one exists, otherwise the main
            CareBridge tab. */}
        <button
          type="button"
          onClick={() =>
            navigate(
              recording.isCarePlanFocus
                ? `/customers/${customer.id}/documents/care-plan`
                : recording.focusDocumentPath
                  ? `/customers/${customer.id}/${recording.focusDocumentPath}?recording=${recording.id}`
                  : `/customers/${customer.id}/carebridge?recording=${recording.id}&view=summary`
            )
          }
          className="flex items-center gap-1 text-body font-medium text-[rgb(154,38,214)] hover:underline cursor-pointer flex-shrink-0"
        >
          Linked to: {recording.focusDocumentName}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <RecordingDocumentView recordingId={recording.id} />
    </div>
  );
}
