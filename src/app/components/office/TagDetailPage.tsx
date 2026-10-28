import { useId, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, ChevronDown, Info, Trash2, User, X } from 'lucide-react';
import { Button } from '../buttons/Button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { PALETTE, TAG_TYPE_GROUPS } from './tagsMockData';
import { ALL_CUSTOMERS, ALL_EMPLOYEES, tagAudit, tagMembers, type TagPerson } from './tagMembers';

// A single tag: its name, colour (where the type uses them) and who has it. Rebuilt from the
// production tag screen; in the same form styling as the enquiry form (native inputs, the
// shared INPUT/LABEL classes) and the same Back / Delete / Save bar. Nothing is saved.
const INPUT_CLASS = 'w-full px-3 py-2 border border-gray-300 rounded-md text-body bg-white';
const LABEL_CLASS = 'block text-body font-medium text-gray-700 mb-2';
const LIGHT_TOOLTIP = {
  className: 'bg-white text-gray-900 border border-gray-200 shadow-lg',
  arrowClassName: 'bg-white fill-white',
} as const;

type Colour = (typeof PALETTE)[number];
const COLOUR_NAMES = ['Pink', 'Teal', 'Blue', 'Green', 'Orange'];

function ColourPicker({ value, onChange }: { value: Colour; onChange: (c: Colour) => void }) {
  const [open, setOpen] = useState(false);
  const swatch = (c: Colour) => (
    <span className="w-6 h-6 rounded-full border" style={{ backgroundColor: c.bg, borderColor: c.border }} aria-hidden="true" />
  );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" aria-label={`Colour: ${COLOUR_NAMES[PALETTE.indexOf(value)] ?? 'custom'}`} className="!h-10 !px-3 !border !border-gray-300 !text-gray-700 !gap-2">
          {swatch(value)}
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <div role="group" aria-label="Tag colour" className="flex gap-2">
          {PALETTE.map((c, i) => (
            <Button
              key={c.bg}
              variant="tertiary"
              iconOnly
              aria-label={COLOUR_NAMES[i]}
              aria-pressed={c.bg === value.bg}
              onClick={() => { onChange(c); setOpen(false); }}
              className={`!bg-transparent hover:!bg-gray-100 ${c.bg === value.bg ? '!ring-2 !ring-[rgb(154,38,214)]' : ''}`}
            >
              {swatch(c)}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Plain lilac, or the tag's own colour for types that use them (Area).
function PersonChip({ person, colour, onRemove }: { person: TagPerson; colour?: Colour; onRemove: () => void }) {
  return (
    <li
      className="inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full border text-body font-medium text-gray-800"
      style={colour
        ? { backgroundColor: colour.bg, color: colour.text, borderColor: colour.border }
        : { backgroundColor: 'rgb(220, 217, 228)', borderColor: 'transparent' }}
    >
      <User className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span className="text-body font-medium">{person.name}{person.note ? ` (${person.note})` : ''}</span>
      <Button
        variant="tertiary"
        iconOnly
        size="sm"
        aria-label={`Remove ${person.name}`}
        onClick={onRemove}
        className="!h-6 !w-6 !bg-transparent hover:!bg-black/10"
      >
        <X className="w-4 h-4" />
      </Button>
    </li>
  );
}

// Type-ahead: start typing a name, pick from the matches, and they're added as a chip below.
function PeopleField({ label, noun, candidates, selected, all, colour, onAdd, onRemove }: {
  label: string;
  /** Tints the chips (the tag's colour, where the type has one). */
  colour?: Colour;
  noun: 'employee' | 'customer';
  candidates: TagPerson[];
  /** The chips shown (finished people are left out unless "Show finished" is ticked). */
  selected: TagPerson[];
  /** Everyone on the tag, shown or not, so nobody can be added twice. */
  all: TagPerson[];
  onAdd: (p: TagPerson) => void;
  onRemove: (id: string) => void;
}) {
  const inputId = useId();
  const listId = `${inputId}-list`;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const taken = new Set(all.map(p => p.id));
    return candidates.filter(p => !taken.has(p.id) && p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query, candidates, all]);

  const showList = open && query.trim() !== '';
  const choose = (p: TagPerson) => { onAdd(p); setQuery(''); setActive(0); };

  return (
    <div>
      <label htmlFor={inputId} className={LABEL_CLASS}>{label}</label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          placeholder={`Start typing to select ${noun === 'employee' ? 'an' : 'a'} ${noun}`}
          onChange={e => { setQuery(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, options.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
            else if (e.key === 'Enter' && showList && options[active]) { e.preventDefault(); choose(options[active]); }
            else if (e.key === 'Escape') { setQuery(''); setOpen(false); }
          }}
          className={`${INPUT_CLASS} placeholder:text-gray-500`}
        />
        {showList && (
          <ul
            id={listId}
            role="listbox"
            aria-label={`Matching ${noun}s`}
            className="absolute z-20 left-0 right-0 mt-1 max-h-64 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1"
          >
            {options.length === 0 && <li className="px-3 py-2 text-body text-gray-600">No matching {noun}s</li>}
            {options.map((p, i) => (
              <li
                key={p.id}
                role="option"
                aria-selected={i === active}
                // mousedown, not click: the input's blur would close the list before a click lands.
                onMouseDown={e => { e.preventDefault(); choose(p); }}
                onMouseEnter={() => setActive(i)}
                className={`px-3 py-2 text-body text-gray-900 cursor-pointer ${i === active ? 'bg-purple-50' : ''}`}
              >
                {p.name}{p.note ? <span className="text-gray-600"> ({p.note})</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
      {selected.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-3" aria-label={label}>
          {selected.map(p => <PersonChip key={p.id} person={p} colour={colour} onRemove={() => onRemove(p.id)} />)}
        </ul>
      ) : (
        <p className="mt-3 text-body text-gray-600">No {noun}s have this tag yet.</p>
      )}
    </div>
  );
}

export function TagDetailPage() {
  const { tagTypeId, tagId } = useParams();
  const navigate = useNavigate();
  const tagType = TAG_TYPE_GROUPS.flatMap(g => g.tagTypes).find(t => t.id === tagTypeId);
  const tag = tagType?.tags.find(t => t.id === tagId);

  const initial = useMemo(() => {
    if (!tagType || !tag) return null;
    const members = tagMembers(tagType, tag);
    return { name: tag.name, colour: tag.colour ?? PALETTE[0], ...members };
  }, [tagType, tag]);

  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [showFinished, setShowFinished] = useState(false);

  const back = () => navigate(`/office/tags/${tagTypeId}`);

  if (!tagType || !tag || !draft || !saved) {
    return (
      <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full">
        <div><Button variant="tertiary" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/office/tags')}>Back</Button></div>
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-body text-gray-600">Tag not found.</div>
      </div>
    );
  }

  const audit = tagAudit(tag.id);
  const appliesTo = tagType.appliesTo.join(' & ');
  const usesColours = tagType.tags.some(t => t.colour);
  const ids = (list: TagPerson[]) => list.map(p => p.id).join(',');
  const dirty = draft.name !== saved.name || draft.colour.bg !== saved.colour.bg
    || ids(draft.employees) !== ids(saved.employees) || ids(draft.customers) !== ids(saved.customers);
  const visible = (list: TagPerson[]) => (showFinished ? list : list.filter(p => !p.finished));
  const nameForLabel = draft.name.trim() || tag.name;

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full">
      {/* Same bar as the enquiry form: Back on the left; Delete and Save on the right. Delete is
          not wired; Save only clears the changed state. */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="tertiary" icon={<ArrowLeft className="w-4 h-4" />} onClick={back}>Back</Button>
        <div className="flex items-center gap-3">
          <Button variant="secondary-danger" icon={<Trash2 className="w-4 h-4" />}>Delete</Button>
          <Button variant="primary" disabled={!dirty} onClick={() => setSaved(draft)}>Save</Button>
        </div>
      </div>

      <form noValidate autoComplete="off" onSubmit={e => e.preventDefault()} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-5">
          <h1 className="text-xl font-semibold text-gray-900">Tag Type: {tagType.name}</h1>
          <div className="space-y-2 text-body text-gray-900">
            <p className="text-body"><span className="font-semibold">Description:</span> {tagType.description}</p>
            <p className="text-body">Applies to {appliesTo.toLowerCase()}</p>
          </div>

          <label className="flex items-center gap-2.5 text-body text-gray-800 cursor-pointer w-fit">
            <input type="checkbox" className="h-5 w-5 accent-[rgb(154,38,214)] cursor-pointer" checked={showFinished} onChange={e => setShowFinished(e.target.checked)} />
            Show finished
          </label>

          <div className="flex flex-wrap items-start gap-6">
            <div className="w-full max-w-md">
              <label htmlFor="tag-name" className={LABEL_CLASS}>
                Tag Name<span className="text-red-500" aria-hidden="true"> *</span>
              </label>
              <input
                id="tag-name"
                maxLength={50}
                value={draft.name}
                onChange={e => setDraft(d => d && ({ ...d, name: e.target.value }))}
                className={INPUT_CLASS}
              />
            </div>
            {usesColours && (
              <div>
                <div className={`${LABEL_CLASS} flex items-center gap-1.5`}>
                  Colour
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0} aria-label="About colours" className="inline-flex cursor-help outline-none focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50 rounded-full">
                        <Info className="w-4 h-4 text-gray-500" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" {...LIGHT_TOOLTIP}>Shown on this tag wherever it appears in PASS</TooltipContent>
                  </Tooltip>
                </div>
                <ColourPicker value={draft.colour} onChange={c => setDraft(d => d && ({ ...d, colour: c }))} />
              </div>
            )}
          </div>

          {tagType.appliesTo.includes('Employees') && (
            <PeopleField
              label={`'${nameForLabel}' Employees`}
              noun="employee"
              colour={usesColours ? draft.colour : undefined}
              candidates={ALL_EMPLOYEES}
              selected={visible(draft.employees)}
              all={draft.employees}
              onAdd={p => setDraft(d => d && ({ ...d, employees: [...d.employees, p] }))}
              onRemove={id => setDraft(d => d && ({ ...d, employees: d.employees.filter(p => p.id !== id) }))}
            />
          )}
          {tagType.appliesTo.includes('Customers') && (
            <PeopleField
              label={`'${nameForLabel}' Customers`}
              noun="customer"
              colour={usesColours ? draft.colour : undefined}
              candidates={ALL_CUSTOMERS}
              selected={visible(draft.customers)}
              all={draft.customers}
              onAdd={p => setDraft(d => d && ({ ...d, customers: [...d.customers, p] }))}
              onRemove={id => setDraft(d => d && ({ ...d, customers: d.customers.filter(p => p.id !== id) }))}
            />
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-x-10 gap-y-1 px-6 py-4 border-t border-gray-100 text-sm text-gray-600">
          <span className="text-sm">Modified: {audit.modified}</span>
          <span className="text-sm">Created: {audit.created}</span>
        </div>
      </form>
    </div>
  );
}
