import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { CalendarClock, FileText, Search, Sparkles, Timer, UserCheck, UserCog } from 'lucide-react';
import { Button } from '../buttons/Button';
import { SettingSwitch } from '../buttons/SettingSwitch';
import { InfoBanner } from '../banners/InfoBanner';
import { EditSlideout } from '../layout/EditSlideout';
import { PencilSolidIcon } from '../icons/PencilSolidIcon';
import { useOffice } from './OfficeContext';
import {
  JOURNAL_CATEGORIES,
  MOCK_EMPLOYEES,
  type AssessmentHeroVoice,
  type DraftVoice,
  type OfficeSettings,
  type RosterPermissions,
} from './officeSettingsMockData';

// "Settings and Permissions" tab — rebuilt from the live office screen (five
// cards, each with its own edit pencil). Edits go through the same shared
// EditSlideout shell Roster Settings uses, one slide-out per card, rather than
// the live app's page-level Save: the card you edited is the thing that
// saves, and the pinned sub-nav just echoes "Saved".
//
// Every value element here carries its own explicit text-* class — a bare
// <p>/<span> falls back to 16px in this repo even inside a text-sm wrapper.

type CardKey = 'overdue' | 'allocation' | 'punctuality' | 'journal' | 'permissions' | 'voice';

const INPUT_CLASS = 'w-28 px-3 py-3 border border-gray-300 rounded-md text-body bg-white';

// ─── Read view ───────────────────────────────────────────────────────────────

function SettingsCard({
  title,
  Icon,
  onEdit,
  children,
}: {
  title: string;
  Icon: ComponentType<{ className?: string }>;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <section className="bg-white rounded-[10px] border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-200">
        <div className="flex items-center gap-3 min-w-0">
          <Icon className="w-6 h-6 text-gray-800 shrink-0" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <Button variant="tertiary" size="sm" iconOnly aria-label={`Edit ${title}`} onClick={onEdit}>
          <PencilSolidIcon className="w-4 h-4" />
        </Button>
      </div>
      {children}
    </section>
  );
}

/** A label on the left and its value on the right, both bold — as on the live screen. */
function ValueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-body font-semibold text-gray-900">{label}</dt>
      <dd className="text-body font-semibold text-gray-900 whitespace-nowrap">{value}</dd>
    </div>
  );
}

const Helper = ({ children }: { children: ReactNode }) => (
  <p className="text-body text-gray-700 leading-relaxed my-2">{children}</p>
);

const atLeast = (n: number, unit: string) => `≥ ${n}${unit}`;

// ─── Slide-out pieces (module level, so inputs keep focus between renders) ───

/** Draft numbers are held as strings so a field can be cleared while typing. */
const parseNumber = (v: string, max: number): number | null => {
  if (!/^\d+$/.test(v)) return null;
  const n = Number(v);
  return n <= max ? n : null;
};

function NumberField({
  id, label, helper, unit, value, onChange, max,
}: {
  id: string; label: string; helper?: string; unit: string; value: string; onChange: (v: string) => void; max: number;
}) {
  const invalid = parseNumber(value, max) === null;
  return (
    <div>
      <label htmlFor={id} className="block text-base font-semibold text-gray-900">{label}</label>
      {helper && <p className="text-body text-gray-800 mt-1">{helper}</p>}
      <div className="mt-3 flex items-center gap-2.5">
        <span className="text-base font-semibold text-gray-800" aria-hidden="true">≥</span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          aria-invalid={invalid}
          className={`${INPUT_CLASS} ${invalid ? 'border-red-500' : ''}`}
        />
        <span className="text-body text-gray-800">{unit}</span>
      </div>
      {invalid && <p className="text-body text-red-700 mt-2">Enter a whole number from 0 to {max}.</p>}
    </div>
  );
}

function SlideoutSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-[10px] shadow-sm p-6 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

// ─── Overdue and missed visits ───────────────────────────────────────────────

function OverdueSlideout({ onClose }: { onClose: () => void }) {
  const { settings, saveSettings } = useOffice();
  const [pct, setPct] = useState(String(settings.overdueVisitsThresholdPct));
  const [overdue, setOverdue] = useState(String(settings.overdueMins));
  const [missed, setMissed] = useState(String(settings.missedMins));
  const [missedTc, setMissedTc] = useState(String(settings.missedTimeCriticalMins));

  const next = {
    overdueVisitsThresholdPct: parseNumber(pct, 100),
    overdueMins: parseNumber(overdue, 999),
    missedMins: parseNumber(missed, 999),
    missedTimeCriticalMins: parseNumber(missedTc, 999),
  };
  const valid = Object.values(next).every((v) => v !== null);
  const dirty =
    next.overdueVisitsThresholdPct !== settings.overdueVisitsThresholdPct ||
    next.overdueMins !== settings.overdueMins ||
    next.missedMins !== settings.missedMins ||
    next.missedTimeCriticalMins !== settings.missedTimeCriticalMins;

  return (
    <EditSlideout
      title="Edit overdue and missed visits"
      size="large"
      onClose={onClose}
      saveDisabled={!valid || !dirty}
      onSave={(close) => {
        saveSettings(next as Pick<OfficeSettings, 'overdueVisitsThresholdPct' | 'overdueMins' | 'missedMins' | 'missedTimeCriticalMins'>);
        close();
      }}
    >
      <div className="space-y-6">
        <SlideoutSection title="Overdue visits threshold">
          <NumberField
            id="overdue-pct"
            label="Overdue visits threshold"
            helper="The percentage of visits that can be overdue at the same time before the KPI indicator turns red."
            unit="%"
            max={100}
            value={pct}
            onChange={setPct}
          />
        </SlideoutSection>
        <SlideoutSection title="When a visit counts as late">
          <NumberField id="overdue-mins" label="Overdue" unit="minutes" max={999} value={overdue} onChange={setOverdue} />
          <NumberField id="missed-mins" label="Missed" unit="minutes" max={999} value={missed} onChange={setMissed} />
          <NumberField id="missed-tc-mins" label="Missed (Time critical)" unit="minutes" max={999} value={missedTc} onChange={setMissedTc} />
        </SlideoutSection>
      </div>
    </EditSlideout>
  );
}

// ─── Permanent allocation ────────────────────────────────────────────────────

const HEATMAP_OPTIONS = [
  { value: 'customer', label: 'Customer schedule' },
  { value: 'employee', label: 'Employee schedule' },
] as const;

function AllocationSlideout({ onClose }: { onClose: () => void }) {
  const { settings, saveSettings } = useOffice();
  const [link, setLink] = useState(settings.heatmapLink);

  return (
    <EditSlideout
      title="Edit permanent allocation"
      size="large"
      onClose={onClose}
      saveDisabled={link === settings.heatmapLink}
      onSave={(close) => {
        saveSettings({ heatmapLink: link });
        close();
      }}
    >
      <SlideoutSection title="Heatmap link options">
        <fieldset>
          <legend className="text-body text-gray-800 mb-4">Choose where a cell in the permanent allocation heatmap takes you.</legend>
          <div className="space-y-4">
            {HEATMAP_OPTIONS.map((o) => (
              <label key={o.value} className="flex items-center gap-2.5 text-body text-gray-800 cursor-pointer w-fit">
                <input
                  type="radio"
                  name="heatmap-link"
                  checked={link === o.value}
                  onChange={() => setLink(o.value)}
                  className="h-6 w-6 accent-[rgb(154,38,214)] cursor-pointer"
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>
      </SlideoutSection>
    </EditSlideout>
  );
}

// ─── Employee punctuality ────────────────────────────────────────────────────

function PunctualitySlideout({ onClose }: { onClose: () => void }) {
  const { settings, saveSettings } = useOffice();
  const [deficit, setDeficit] = useState(String(settings.punctualityDeficitPct));
  const [leeway, setLeeway] = useState(String(settings.tagLeewayMins));
  const [duration, setDuration] = useState(String(settings.visitDurationPct));

  const next = {
    punctualityDeficitPct: parseNumber(deficit, 100),
    tagLeewayMins: parseNumber(leeway, 999),
    visitDurationPct: parseNumber(duration, 100),
  };
  const valid = Object.values(next).every((v) => v !== null);
  const dirty =
    next.punctualityDeficitPct !== settings.punctualityDeficitPct ||
    next.tagLeewayMins !== settings.tagLeewayMins ||
    next.visitDurationPct !== settings.visitDurationPct;

  return (
    <EditSlideout
      title="Edit employee punctuality"
      size="large"
      onClose={onClose}
      saveDisabled={!valid || !dirty}
      onSave={(close) => {
        saveSettings(next as Pick<OfficeSettings, 'punctualityDeficitPct' | 'tagLeewayMins' | 'visitDurationPct'>);
        close();
      }}
    >
      <div className="space-y-6">
        <SlideoutSection title="Average punctuality deficit threshold">
          <NumberField
            id="punctuality-deficit"
            label="Average punctuality deficit threshold"
            helper="The percentage of visits attended by your employees that breach the punctuality limits set below."
            unit="%"
            max={100}
            value={deficit}
            onChange={setDeficit}
          />
        </SlideoutSection>
        <SlideoutSection title="Punctuality limits">
          <NumberField id="tag-leeway" label="Tag-in and tag-out leeway threshold" unit="minutes" max={999} value={leeway} onChange={setLeeway} />
          <NumberField id="visit-duration" label="Visit duration threshold" unit="%" max={100} value={duration} onChange={setDuration} />
        </SlideoutSection>
      </div>
    </EditSlideout>
  );
}

// ─── Journal categories ──────────────────────────────────────────────────────

function JournalSlideout({ onClose }: { onClose: () => void }) {
  const { settings, saveSettings } = useOffice();
  const [draft, setDraft] = useState(settings.journalCategories);
  const dirty = JOURNAL_CATEGORIES.some((c) => draft[c] !== settings.journalCategories[c]);

  return (
    <EditSlideout
      title="Edit journal categories"
      size="large"
      onClose={onClose}
      saveDisabled={!dirty}
      onSave={(close) => {
        saveSettings({ journalCategories: draft });
        close();
      }}
    >
      <SlideoutSection title="Journal categories">
        <p className="text-body text-gray-800 -mt-2">Disabled categories can no longer be chosen when adding a journal entry.</p>
        <ul className="divide-y divide-gray-200">
          {JOURNAL_CATEGORIES.map((c) => (
            <li key={c} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <span className="text-body text-gray-900">{c}</span>
              <div className="flex items-center gap-3">
                <span className="text-body font-semibold text-gray-700 w-16 text-right">{draft[c] ? 'Enabled' : 'Disabled'}</span>
                <SettingSwitch checked={draft[c]} onChange={(v) => setDraft((d) => ({ ...d, [c]: v }))} label={c} />
              </div>
            </li>
          ))}
        </ul>
      </SlideoutSection>
    </EditSlideout>
  );
}

// ─── Roster permissions ──────────────────────────────────────────────────────

const PERMISSION_GROUPS: { key: keyof RosterPermissions; title: string; helper: string }[] = [
  { key: 'scheduleView', title: 'Schedule View', helper: 'Employees who can see the schedule.' },
  { key: 'scheduleEdit', title: 'Schedule Edit', helper: 'Employees who can change visits and allocations on the schedule.' },
  { key: 'finance', title: 'Finance', helper: 'Employees who can access timesheets, invoicing and other finance areas.' },
];

function EmployeePicker({
  groupKey, selected, onChange,
}: { groupKey: string; selected: string[]; onChange: (ids: string[]) => void }) {
  const [query, setQuery] = useState('');
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? MOCK_EMPLOYEES.filter((e) => e.name.toLowerCase().includes(q)) : MOCK_EMPLOYEES;
  }, [query]);
  const chosen = new Set(selected);

  const toggle = (id: string, on: boolean) => {
    const next = new Set(chosen);
    if (on) next.add(id); else next.delete(id);
    onChange(MOCK_EMPLOYEES.filter((e) => next.has(e.id)).map((e) => e.id));
  };
  const selectVisible = () => onChange(MOCK_EMPLOYEES.filter((e) => chosen.has(e.id) || visible.includes(e)).map((e) => e.id));
  const clearVisible = () => onChange(MOCK_EMPLOYEES.filter((e) => chosen.has(e.id) && !visible.includes(e)).map((e) => e.id));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employees"
            aria-label={`Search employees for ${groupKey}`}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-md text-body bg-white placeholder:text-gray-600"
          />
        </div>
        <Button type="button" variant="tertiary" size="sm" onClick={selectVisible}>Select all</Button>
        <Button type="button" variant="tertiary" size="sm" onClick={clearVisible}>Clear</Button>
      </div>
      <ul className="mt-3 max-h-64 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-200 bg-white">
        {visible.length === 0 && <li className="px-4 py-3 text-body text-gray-700">No employees match “{query}”.</li>}
        {visible.map((e) => (
          <li key={e.id}>
            <label className="flex items-center gap-3 px-4 py-2.5 text-body text-gray-900 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={chosen.has(e.id)}
                onChange={(ev) => toggle(e.id, ev.target.checked)}
                className="h-5 w-5 accent-[rgb(154,38,214)] cursor-pointer"
              />
              {e.name}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

const employeesLabel = (n: number) => `${n} ${n === 1 ? 'employee' : 'employees'}`;

function PermissionsSlideout({ onClose }: { onClose: () => void }) {
  const { settings, saveSettings } = useOffice();
  const [draft, setDraft] = useState<RosterPermissions>(settings.permissions);
  const dirty = PERMISSION_GROUPS.some(
    (g) => draft[g.key].length !== settings.permissions[g.key].length || draft[g.key].some((id, i) => id !== settings.permissions[g.key][i]),
  );

  return (
    <EditSlideout
      title="Edit roster permissions"
      size="large"
      onClose={onClose}
      saveDisabled={!dirty}
      onSave={(close) => {
        saveSettings({ permissions: draft });
        close();
      }}
    >
      <div className="space-y-6">
        {PERMISSION_GROUPS.map((g) => (
          <SlideoutSection key={g.key} title={`${g.title} · ${employeesLabel(draft[g.key].length)}`}>
            <p className="text-body text-gray-800 -mt-2">{g.helper}</p>
            <EmployeePicker groupKey={g.title} selected={draft[g.key]} onChange={(ids) => setDraft((d) => ({ ...d, [g.key]: ids }))} />
          </SlideoutSection>
        ))}
      </div>
    </EditSlideout>
  );
}

// ─── Assessment Hero drafting voice ──────────────────────────────────────────

const VOICE_LABEL: Record<DraftVoice, string> = { first: 'First person', third: 'Third person' };

/**
 * One row per kind of output Assessment Hero drafts. `audience` is why the
 * choice matters — each output has a different reader — and the examples show
 * the same sentence in both voices so the choice isn't abstract.
 */
const VOICE_OUTPUTS: {
  key: keyof AssessmentHeroVoice;
  title: string;
  audience: string;
  examples: Record<DraftVoice, string>;
}[] = [
  {
    key: 'documents',
    title: 'Assessment documents',
    audience: 'Read by the customer, the office and reviewers.',
    examples: {
      first: 'I live with my husband and my son.',
      third: 'Edith lives with her husband and her son.',
    },
  },
  {
    key: 'outcomes',
    title: 'Outcomes',
    audience: 'Read by office staff and kept in the care plan record.',
    examples: {
      first: 'I can wash my upper body myself and want to keep doing so.',
      third: 'Edith washes her upper body independently and wants to keep doing so.',
    },
  },
  {
    key: 'tasks',
    title: 'Tasks',
    audience: 'Read by carers on the care app.',
    examples: {
      first: 'Prompt me to take my amlodipine for my blood pressure. Please record what I have taken.',
      third: 'Prompt Edith to take her amlodipine for her blood pressure. Record what she has taken.',
    },
  },
];

function VoiceSlideout({ onClose }: { onClose: () => void }) {
  const { settings, saveSettings } = useOffice();
  const [draft, setDraft] = useState<AssessmentHeroVoice>(settings.assessmentHeroVoice);
  const dirty = VOICE_OUTPUTS.some((o) => draft[o.key] !== settings.assessmentHeroVoice[o.key]);

  return (
    <EditSlideout
      title="Edit Assessment Hero drafting"
      size="large"
      onClose={onClose}
      saveDisabled={!dirty}
      onSave={(close) => {
        saveSettings({ assessmentHeroVoice: draft });
        close();
      }}
    >
      <div className="space-y-6">
        <InfoBanner size="md">
          Choose who Assessment Hero writes as, separately for each kind of draft. This only changes drafts created from now on —
          anything already drafted or accepted stays as it is.
        </InfoBanner>

        {VOICE_OUTPUTS.map((o) => (
          <SlideoutSection key={o.key} title={o.title}>
            <p className="text-body text-gray-800 -mt-2">{o.audience}</p>
            <fieldset>
              <legend className="sr-only">{o.title} voice</legend>
              <div className="space-y-3">
                {(['first', 'third'] as const).map((v) => {
                  const selected = draft[o.key] === v;
                  return (
                    <label
                      key={v}
                      className={`flex items-start gap-3 rounded-md border p-4 cursor-pointer transition-colors ${
                        selected ? 'border-[rgb(154,38,214)] bg-[rgba(154,38,214,0.04)]' : 'border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`voice-${o.key}`}
                        checked={selected}
                        onChange={() => setDraft((d) => ({ ...d, [o.key]: v }))}
                        className="h-6 w-6 mt-0.5 accent-[rgb(154,38,214)] cursor-pointer shrink-0"
                      />
                      <span>
                        <span className="block text-base font-semibold text-gray-900">{VOICE_LABEL[v]}</span>
                        <span className="block text-body text-gray-800 mt-1">
                          <span className="font-semibold">Example: </span>“{o.examples[v]}”
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </SlideoutSection>
        ))}

        <InfoBanner size="md">
          Fields whose label is itself written in the first person, such as “What I can do” or “My living arrangements”, are always
          drafted in the first person, whichever option is chosen above.
        </InfoBanner>
      </div>
    </EditSlideout>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function OfficeSettingsPage() {
  const { settings: s } = useOffice();
  const [editing, setEditing] = useState<CardKey | null>(null);
  const close = () => setEditing(null);

  return (
    <>
      {/* items-start: cards keep their own height instead of stretching to the tallest in the row. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        <SettingsCard title="Overdue and missed visits" Icon={Timer} onEdit={() => setEditing('overdue')}>
          <dl>
            <ValueRow label="Overdue visits threshold" value={atLeast(s.overdueVisitsThresholdPct, '%')} />
          </dl>
          <Helper>
            The threshold is the percentage of visits that can be overdue at the same time before the KPI indicator turns red
          </Helper>
          <dl>
            <ValueRow label="Overdue" value={atLeast(s.overdueMins, 'm')} />
            <ValueRow label="Missed" value={atLeast(s.missedMins, 'm')} />
            <ValueRow label="Missed (Time critical)" value={atLeast(s.missedTimeCriticalMins, 'm')} />
          </dl>
        </SettingsCard>

        <SettingsCard title="Permanent allocation" Icon={UserCheck} onEdit={() => setEditing('allocation')}>
          <Helper>Options for the permanent allocation Heatmap</Helper>
          <p className="text-body font-semibold text-gray-900 mt-5">Heatmap link options</p>
          <p className="text-body text-gray-700 mt-2">
            Heatmap links to {s.heatmapLink === 'customer' ? 'customer' : 'employee'} schedule
          </p>
        </SettingsCard>

        <SettingsCard title="Employee punctuality" Icon={CalendarClock} onEdit={() => setEditing('punctuality')}>
          <dl>
            <ValueRow label="Average punctuality deficit threshold" value={atLeast(s.punctualityDeficitPct, '%')} />
          </dl>
          <Helper>
            The threshold is the percentage of visits attended by your employees that breach the punctuality limits set below.
          </Helper>
          <dl>
            <ValueRow label="Tag-in and tag-out leeway threshold" value={atLeast(s.tagLeewayMins, 'm')} />
            <ValueRow label="Visit duration threshold" value={atLeast(s.visitDurationPct, '%')} />
          </dl>
        </SettingsCard>

        <SettingsCard title="Journal categories" Icon={FileText} onEdit={() => setEditing('journal')}>
          <dl>
            {JOURNAL_CATEGORIES.map((c) => (
              <ValueRow key={c} label={c} value={s.journalCategories[c] ? 'Enabled' : 'Disabled'} />
            ))}
          </dl>
        </SettingsCard>

        <SettingsCard title="Roster permissions" Icon={UserCog} onEdit={() => setEditing('permissions')}>
          <Helper>Manage which employees can access scheduling and finance areas of the roster</Helper>
          <dl className="mt-4 pt-3 border-t border-gray-200">
            <ValueRow label="Schedule View" value={employeesLabel(s.permissions.scheduleView.length)} />
            <ValueRow label="Schedule Edit" value={employeesLabel(s.permissions.scheduleEdit.length)} />
            <ValueRow label="Finance" value={employeesLabel(s.permissions.finance.length)} />
          </dl>
        </SettingsCard>

        <SettingsCard title="Assessment Hero" Icon={Sparkles} onEdit={() => setEditing('voice')}>
          <Helper>Who Assessment Hero writes as when it drafts from a recording</Helper>
          <dl className="mt-4 pt-3 border-t border-gray-200">
            {VOICE_OUTPUTS.map((o) => (
              <ValueRow key={o.key} label={o.title} value={VOICE_LABEL[s.assessmentHeroVoice[o.key]]} />
            ))}
          </dl>
        </SettingsCard>
      </div>

      {editing === 'overdue' && <OverdueSlideout onClose={close} />}
      {editing === 'allocation' && <AllocationSlideout onClose={close} />}
      {editing === 'punctuality' && <PunctualitySlideout onClose={close} />}
      {editing === 'journal' && <JournalSlideout onClose={close} />}
      {editing === 'permissions' && <PermissionsSlideout onClose={close} />}
      {editing === 'voice' && <VoiceSlideout onClose={close} />}
    </>
  );
}
