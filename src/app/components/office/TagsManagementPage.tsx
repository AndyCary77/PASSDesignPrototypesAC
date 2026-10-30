import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Info, Search, Tag as TagIcon } from 'lucide-react';
import { Button } from '../buttons/Button';
import { SegmentedControl } from '../buttons/SegmentedControl';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { TAG_TYPE_GROUPS } from './tagsMockData';
import { TagTypeListItem } from './TagTypeListItem';
import { OfficeDetailsPage } from './OfficeDetailsPage';
import { RosterSettingsPage } from '../settings/RosterSettingsPage';
import { OfficeSettingsPage } from './OfficeSettingsPage';
import { useOffice, OFFICE_TABS } from './OfficeContext';
import { ReviewAllocationsView } from './ReviewAllocationsView';
import { MissingTagsView } from './MissingTagsView';
import { Banner } from './Banner';
import type { RelationChange } from './personRelations';
import { ALL_TAG_TYPES, buildAllocations, buildMissing, typeName, type Assigned, type BulkChange, type MissingRow } from './tagAllocations';

type Lens = 'types' | 'review' | 'missing';

// What each view is for. It sits behind the info button beside the view switch, so the page itself stays compact.
const VIEW_INFO = {
  types: 'Tags can be used to assign custom attributes to your customers and employees. Tag types group your tags. Once configured, tags will be available within filters throughout PASS to help you target and match your customers and employees in ways that suit your delivery of care.',
  review: 'See where every tag is used: on a profile, or as a rule in roster matching. Select a number to see who is behind it.',
  missing: "Active customers and employees who have no tag from a tag type that's marked mandatory, soonest needed first.",
} as const;

export function TagsManagementPage() {
  // Tab state (and, for "Details", the form state + Save action) is owned
  // by OfficeProvider and shared with the pinned OfficeSubnav — same shape
  // as CareManagementContext, since the top CTA row needs to reach into
  // whatever this page is currently showing.
  const { activeTab } = useOffice();
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');

  // The three views of the Tags tab. It's in the URL (?view=) so Back from a tag lands on the same one.
  const [params, setParams] = useSearchParams();
  const lens: Lens = params.get('view') === 'review' ? 'review' : params.get('view') === 'missing' ? 'missing' : 'types';
  const setLens = (v: Lens) => setParams(v === 'types' ? {} : { view: v });

  // Changes made on these screens: tags given from Missing tags, and bulk adds and removes from
  // Tag assignments. They count from then on in every view, and the latest can be undone.
  const [assigned, setAssigned] = useState<Assigned[]>([]);
  const [bulk, setBulk] = useState<BulkChange[]>([]);
  const [relations, setRelations] = useState<RelationChange[]>([]);
  const [lastBatch, setLastBatch] = useState<{ text: string; undo: () => void } | null>(null);
  const allocations = useMemo(() => buildAllocations(assigned, bulk), [assigned, bulk]);
  const missing = useMemo(() => buildMissing(assigned), [assigned]);

  const assign = (people: MissingRow[], typeId: string, tagId: string) => {
    const items = people.map(p => ({ person: p.person, typeId, tagId }));
    const tagName = ALL_TAG_TYPES.find(t => t.id === typeId)?.tags.find(t => t.id === tagId)?.name ?? '';
    setAssigned(a => [...a, ...items]);
    setLastBatch({
      text: `${items.length} ${items.length === 1 ? 'person' : 'people'} updated: ${typeName(typeId)}, ${tagName}.`,
      undo: () => { setAssigned(a => a.filter(i => !items.includes(i))); setLastBatch(null); },
    });
  };
  const bulkApply = (changes: BulkChange[], text: string, relationChanges: RelationChange[]) => {
    setBulk(b => [...b, ...changes]);
    setRelations(r => [...r, ...relationChanges]);
    setLastBatch({
      text,
      undo: () => {
        setBulk(b => b.filter(c => !changes.includes(c)));
        setRelations(r => r.filter(c => !relationChanges.includes(c)));
        setLastBatch(null);
      },
    });
  };

  const batchBanner = lastBatch && (
    <Banner variant="info" onDismiss={() => setLastBatch(null)}>
      <div className="flex items-center justify-between gap-4">
        <span className="text-body">{lastBatch.text}</span>
        <Button variant="tertiary" size="sm" onClick={lastBatch.undo}>Undo</Button>
      </div>
    </Banner>
  );

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TAG_TYPE_GROUPS;
    return TAG_TYPE_GROUPS.map(group => ({
      ...group,
      tagTypes: group.tagTypes.filter(
        t => t.name.toLowerCase().includes(q) || t.tags.some(tag => tag.name.toLowerCase().includes(q)),
      ),
    })).filter(group => group.tagTypes.length > 0);
  }, [query]);

  return (
    <div className={`flex flex-col mx-auto w-full ${activeTab === 'roster' || activeTab === 'settings' ? '' : activeTab === 'details' ? 'max-w-6xl' : activeTab === 'tags' ? '' : 'max-w-5xl'}`}>
      {activeTab === 'details' ? (
        <OfficeDetailsPage />
      ) : activeTab === 'roster' ? (
        // Wider than the other tabs: the section menu plus 7-column tables need the room.
        <RosterSettingsPage />
      ) : activeTab === 'settings' ? (
        <OfficeSettingsPage />
      ) : activeTab !== 'tags' ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">
          {OFFICE_TABS.find(t => t.id === activeTab)?.label} — coming soon
        </div>
      ) : (
        <div className="space-y-6">
          {/* The view switch, centred under the Office tabs, with an info button for what the view is. It stays put whatever width the view below needs. */}
          <div className="flex justify-center">
            <div className="relative">
            <SegmentedControl
              value={lens}
              onChange={setLens}
              ariaLabel="Tags view"
              options={[
                { value: 'types', label: 'Tag types' },
                { value: 'review', label: 'Tag assignments' },
                { value: 'missing', label: `Missing tags${missing.length > 0 ? ` · ${missing.length}` : ''}` },
              ]}
            />
            {/* Beside the switch rather than part of it, so the switch itself stays centred. */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="tertiary" iconOnly size="sm" aria-label="About this view" className="absolute left-full top-1/2 -translate-y-1/2 ml-2">
                  <Info className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="center" className="w-[min(380px,calc(100vw-3rem))] p-4">
                <p className="text-body text-gray-900">{VIEW_INFO[lens]}</p>
              </PopoverContent>
            </Popover>
            </div>
          </div>

          {/* Tag assignments runs the full width of the screen; the other views sit centred at a readable width. */}
          <div className={`space-y-6 ${lens === 'review' ? '' : 'max-w-[1280px] mx-auto w-full'}`}>
          {lens === 'review' && (
            <>
              {batchBanner}
              <ReviewAllocationsView allocations={allocations} relations={relations} onBulkApply={bulkApply} onBulkUndo={() => lastBatch?.undo()} />
            </>
          )}

          {lens === 'missing' && (
            <>
              {batchBanner}
              <MissingTagsView rows={missing} onAssign={assign} />
            </>
          )}

          {lens === 'types' && (<>
          {/* Title and description on the left, search on the right. */}
          <div className="flex items-start justify-between gap-8">
            <div className="flex items-start gap-4 min-w-0">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <TagIcon className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Tag Types &amp; Tags</h3>
              </div>
            </div>

            <form
              onSubmit={e => { e.preventDefault(); setQuery(queryInput); }}
              className="flex items-center gap-2 w-[400px] flex-shrink-0"
            >
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="search"
                  placeholder="Enter search terms here"
                  value={queryInput}
                  onChange={e => setQueryInput(e.target.value)}
                  aria-label="Search"
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(154,38,214)] focus:border-transparent text-body placeholder:text-gray-500"
                />
              </div>
              <Button type="submit" size="sm">Search</Button>
            </form>
          </div>

          {/* Tag type groups */}
          {filteredGroups.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">
              No tag types match “{query}”.
            </div>
          ) : (
            filteredGroups.map(group => (
              <div key={group.heading}>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">{group.heading}</h4>
                <ul className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                  {group.tagTypes.map(tagType => (
                    <TagTypeListItem
                      key={tagType.id}
                      tagType={tagType}
                      to={`/office/tags/${tagType.id}`}
                    />
                  ))}
                </ul>
              </div>
            ))
          )}
          </>)}
          </div>
        </div>
      )}
    </div>
  );
}
