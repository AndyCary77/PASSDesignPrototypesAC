import { useParams, useNavigate, Link } from 'react-router';
import { ArrowLeft, Tag as TagIcon, Plus } from 'lucide-react';
import { Button } from '../buttons/Button';
import { TAG_TYPE_GROUPS } from './tagsMockData';
import { TagSummaryPill } from './TagSummaryPill';
import { tagAudit } from './tagMembers';
import { Banner } from './Banner';

// Read-only "Tag Type" detail field — matches the label/value pairs in the
// real tenant's tag-type-details screen (see the DOM sample supplied when
// this page was built).
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-body text-gray-900">{value}</div>
    </div>
  );
}

export function TagTypeDetailPage() {
  const { tagTypeId } = useParams();
  const navigate = useNavigate();
  const tagType = TAG_TYPE_GROUPS.flatMap(g => g.tagTypes).find(t => t.id === tagTypeId);

  if (!tagType) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">
        Tag type not found.
      </div>
    );
  }

  const audit = tagAudit(tagType.id);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <div>
        <Button variant="tertiary" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/office/tags')}>
          Back to tags
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold text-gray-900">{tagType.name}</h2>
        {tagType.isNew && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[rgb(154,38,214)] text-white">
            New
          </span>
        )}
      </div>

      {/* Tag type details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Tag Type</h4>
        {tagType.isNew && (
          <div className="mb-6">
            <Banner variant="warning">
              <p>
                Environment tags will support improved scheduling suggestions. They’ll also be used to help
                prevent assigning care workers to unsuitable environments based on their restrictions.
              </p>
              <p>This section has been added ahead of the feature release later this year.</p>
            </Banner>
          </div>
        )}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <Field label="Name" value={tagType.name} />
          <Field label="Applies to" value={tagType.appliesTo.join(' & ')} />
        </div>
        <div className="mb-6">
          <Field label="Description" value={tagType.description} />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Field label="Limit one tag per person" value={tagType.limitOnePerTag ? 'Enabled' : 'Disabled'} />
          <Field label="Mandatory onboarding" value={tagType.mandatoryOnboarding ? 'Enabled' : 'Disabled'} />
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TagIcon className="w-4 h-4 text-gray-400" />
          Tags
        </h4>
        <div className="flex flex-wrap gap-2">
          {/* Each tag opens its own page, showing who has it. */}
          {tagType.tags.map(tag => (
            <Link
              key={tag.id}
              to={`/office/tags/${tagType.id}/${tag.id}`}
              className="rounded-full outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50"
            >
              <TagSummaryPill tag={tag} />
            </Link>
          ))}
          {/* Not wired — this is a static page. */}
          <Button variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />}>Add</Button>
        </div>
      </div>

      <p className="text-center text-sm text-gray-600">
        Modified: {audit.modified}
        <span className="mx-5" aria-hidden="true" />
        Created: {audit.created}
      </p>
    </div>
  );
}
