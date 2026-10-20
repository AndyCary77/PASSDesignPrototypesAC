import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../buttons/Button';
import { useRosterSettings, useVisitTypes } from '../../data/RosterSettingsContext';
import { InfoBanner } from '../banners/InfoBanner';
import {
  DAYS,
  defaultAvailabilityTypeId,
  formatDuration,
  isValidRange,
  nextSlot,
  resolveAvailabilityType,
  sameSlots,
  slotsMinutes,
  slotsOverlap,
  type DayAvail,
  type TimeRange,
} from './availabilityData';

/** What to apply to every selected day. `undefined` = leave alone, `[]` = clear. */
export type AvailabilityChange = {
  regular?: TimeRange[];
  optional?: TimeRange[];
};

export function AvailabilityModal({
  open,
  onOpenChange,
  selectedKeys,
  availability,
  onConfirm,
  showTypes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `${weekIndex}-${shortDay}` keys */
  selectedKeys: string[];
  availability: Record<string, DayAvail>;
  onConfirm: (change: AvailabilityChange) => void;
  /** Availability types are on for this office. */
  showTypes: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl p-0 gap-0 max-h-[calc(100vh-2rem)] overflow-y-auto [&>button]:text-[rgb(154,38,214)] [&>button]:opacity-100 [&>button]:top-6 [&>button]:right-6 [&>button_svg]:!size-6"
      >
        {/* Remounts on every open, so the form always starts from the current selection */}
        <AvailabilityForm
          selectedKeys={selectedKeys}
          availability={availability}
          onConfirm={onConfirm}
          showTypes={showTypes}
        />
      </DialogContent>
    </Dialog>
  );
}

function effectiveDayLines(selectedKeys: string[]) {
  const byWeek = new Map<number, Set<string>>();
  for (const key of selectedKeys) {
    const [week, day] = key.split('-');
    const w = Number(week);
    if (!byWeek.has(w)) byWeek.set(w, new Set());
    byWeek.get(w)!.add(day);
  }
  return [...byWeek.entries()]
    .sort(([a], [b]) => a - b)
    .map(([w, days]) => ({
      week: w + 1,
      names: days.size === DAYS.length ? ['All days'] : DAYS.filter((d) => days.has(d.short)).map((d) => d.full),
    }));
}

/** The shared slots across all selected days, or `mixed` if they disagree. */
function commonSlots(
  selectedKeys: string[],
  availability: Record<string, DayAvail>,
  field: 'regular' | 'optional',
  showTypes: boolean,
) {
  const first = availability[selectedKeys[0]]?.[field];
  const mixed = selectedKeys.some((k) => !sameSlots(availability[k]?.[field], first, !showTypes));
  return { slots: mixed ? [] : (first ?? []).map((r) => ({ ...r })), mixed };
}

type Editable = { slots: TimeRange[]; touched: boolean };

const slotsError = (e: Editable) => {
  if (!e.touched) return null;
  if (e.slots.some((r) => !isValidRange(r))) return 'invalid';
  if (slotsOverlap(e.slots)) return 'overlap';
  return null;
};

function AvailabilityForm({
  selectedKeys,
  availability,
  onConfirm,
  showTypes,
}: {
  selectedKeys: string[];
  availability: Record<string, DayAvail>;
  onConfirm: (change: AvailabilityChange) => void;
  showTypes: boolean;
}) {
  const regularInit = commonSlots(selectedKeys, availability, 'regular', showTypes);
  const optionalInit = commonSlots(selectedKeys, availability, 'optional', showTypes);
  const [regular, setRegular] = useState<Editable>({ slots: regularInit.slots, touched: false });
  const [optional, setOptional] = useState<Editable>({ slots: optionalInit.slots, touched: false });

  const lines = effectiveDayLines(selectedKeys);
  const invalid = !!slotsError(regular) || !!slotsError(optional);
  const canConfirm = (regular.touched || optional.touched) && !invalid;

  const confirm = () => {
    onConfirm({
      regular: regular.touched ? regular.slots : undefined,
      optional: optional.touched ? optional.slots : undefined,
    });
  };

  return (
    <div className="p-8">
      <DialogTitle className="text-3xl font-semibold text-gray-900 leading-tight pb-4 border-b-2 border-gray-200">
        Add availability
      </DialogTitle>
      <DialogDescription className="sr-only">
        Set regular hours and optional overtime for the selected days.
      </DialogDescription>

      <div className="mt-6">
        <div className="text-body text-gray-700">Effective days</div>
        <ul className="mt-2 space-y-1">
          {lines.map((l) => (
            <li key={l.week} className="text-lg font-medium text-gray-900">
              Week {l.week}: {l.names.join(', ')}
            </li>
          ))}
        </ul>
      </div>

      <InfoBanner size="md" className="mt-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>Please note</span>
          <span aria-hidden="true">•</span>
          <span>Changes made to availability will only be effective upon save of the contract</span>
          <span aria-hidden="true">•</span>
          <span>Ad-hoc availability will be replaced by recurring availability where overlaps occur</span>
        </div>
      </InfoBanner>

      <div className="mt-6 grid gap-6 md:grid-cols-2 items-start">
        <HoursCard
          title="Regular hours"
          idBase="regular"
          value={regular}
          onChange={setRegular}
          mixed={regularInit.mixed}
          showTypes={showTypes}
        />
        <HoursCard
          title="Optional Overtime"
          idBase="optional"
          description="Add any hours the employee has agreed they can work on an ad-hoc basis"
          value={optional}
          onChange={setOptional}
          mixed={optionalInit.mixed}
          showTypes={showTypes}
        />
      </div>

      <div className="mt-6 flex justify-center">
        <Button size="lg" disabled={!canConfirm} onClick={confirm}>
          Confirm selection
        </Button>
      </div>
    </div>
  );
}

function HoursCard({
  title,
  idBase,
  description,
  value,
  onChange,
  mixed,
  showTypes,
}: {
  title: string;
  idBase: string;
  description?: string;
  value: Editable;
  onChange: (next: Editable) => void;
  mixed: boolean;
  showTypes: boolean;
}) {
  const { slots } = value;
  const error = slotsError(value);
  const { availabilityTypes } = useRosterSettings();
  const defaultTypeId = defaultAvailabilityTypeId(availabilityTypes);

  const setSlots = (next: TimeRange[]) => onChange({ slots: next, touched: true });
  const updateSlot = (i: number, patch: Partial<TimeRange>) =>
    setSlots(slots.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <div className="rounded-[10px] border-2 border-gray-200 p-6 flex flex-col">
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-4 text-body text-gray-900">{description}</p>}

      <div className="pt-6">
        {slots.length > 0 ? (
          <div className="space-y-3">
            {slots.map((slot, i) => (
              <div key={i} className="space-y-3">
              <div className="flex items-end gap-3">
                <TimeField
                  id={`${idBase}-${i}-start`}
                  label="From"
                  value={slot.start}
                  onChange={(start) => updateSlot(i, { start })}
                />
                <TimeField
                  id={`${idBase}-${i}-end`}
                  label="To"
                  value={slot.end}
                  onChange={(end) => updateSlot(i, { end })}
                />
                <Button
                  variant="tertiary-danger"
                  iconOnly
                  aria-label={`Delete ${title.toLowerCase()} slot ${i + 1}`}
                  onClick={() => setSlots(slots.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {showTypes && (
                <AvailabilityTypeField
                  id={`${idBase}-${i}-availability-type`}
                  value={slot.availabilityType}
                  onChange={(availabilityType) => updateSlot(i, { availabilityType })}
                />
              )}
              </div>
            ))}

            {error === 'invalid' && (
              <p role="alert" className="text-body font-medium text-red-700">
                Each slot's end time must be after its start time.
              </p>
            )}
            {error === 'overlap' && (
              <p role="alert" className="text-body font-medium text-red-700">
                Slots can't overlap.
              </p>
            )}
            {!error && (
              <p className="text-body text-gray-600">{formatDuration(slotsMinutes(slots))} per day</p>
            )}

            <Button
              variant="secondary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setSlots([...slots, nextSlot(slots, defaultTypeId)])}
            >
              Add another slot
            </Button>
          </div>
        ) : (
          <>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setSlots([nextSlot([], defaultTypeId)])}
            >
              Add hours
            </Button>
            {mixed && !value.touched && (
              <p className="mt-2 text-body text-gray-600">
                The selected days have different hours. Adding hours replaces them.
              </p>
            )}
            {value.touched && (
              <p className="mt-2 text-body text-gray-600">Hours will be cleared for the selected days.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TypeDot({ colour }: { colour: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-3.5 w-3.5 shrink-0 rounded-full"
      style={{ backgroundColor: colour }}
    />
  );
}

function AvailabilityTypeField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { availabilityTypes } = useRosterSettings();
  const visitTypes = useVisitTypes();
  // A slot with no (or an unknown) type is the default type.
  const current = resolveAvailabilityType(availabilityTypes, value);
  // Types switched off in Roster Settings can't be picked for new availability
  // (a slot already using one still shows it).
  const options = availabilityTypes.filter((t) => t.id === current.id || t.enabled);
  const covers = (current.visitTypeIds as string[])
    .map((vid) => visitTypes.find((v) => v.id === vid)?.label)
    .filter(Boolean)
    .join(', ');
  return (
    <div>
      <label htmlFor={id} className="block text-body font-medium text-gray-700 mb-1">
        Availability type
      </label>
      <Select value={current.id} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-10 w-full text-body border-gray-300 bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-[60]">
          {options.map((t) => (
            <SelectItem key={t.id} value={t.id} className="text-body">
              <TypeDot colour={t.colour} />
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {covers && <p className="mt-1 text-sm text-gray-700">Covers {covers}</p>}
    </div>
  );
}

function TimeField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-body font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md text-body bg-white focus:outline-none focus:border-[rgb(154,38,214)] focus:ring-1 focus:ring-[rgb(154,38,214)]"
      />
    </div>
  );
}
