import { useState, type ReactNode } from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Combobox } from '../ui/combobox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Button } from '../buttons/Button';
import { Alert } from '../ui/alert';
import { InfoBanner } from '../banners/InfoBanner';
import { Tag } from '../ui/tag';
import {
  ADJUSTMENT_CATEGORIES,
  BESPOKE_CATEGORY_CODE,
  IMPAIRMENT_OTHER_CODE,
  IMPAIRMENT_PREFER_NOT_TO_SAY_CODE,
  IMPAIRMENT_VALUES,
  MAX_FREE_TEXT,
  REMOVAL_REASONS,
  categoryName,
  formatRafDate,
  type RafItem,
  type RafSection,
} from '../../data/reasonableAdjustments';

const EQUALITY_ACT_GUIDANCE_URL = 'https://www.gov.uk/guidance/equality-act-2010-guidance';

export interface RafPerson {
  name: string;
  dob: string;
  nhs?: string;
}

// ASCII only, as the national flag requires (the printable range plus newline/tab).
const isAscii = (text: string) => /^[\x09\x0A\x0D\x20-\x7E]*$/.test(text);

function textError(text: string): string | null {
  if (text.length > MAX_FREE_TEXT) return `Use ${MAX_FREE_TEXT.toLocaleString()} characters or fewer.`;
  if (!isAscii(text)) return 'Use plain characters only. Symbols and accented letters are not accepted by the national flag.';
  return null;
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-body font-medium text-gray-800">{label}</Label>
      {children}
    </div>
  );
}

function FreeTextField({
  id,
  label,
  value,
  onChange,
  error,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  disabled?: boolean;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <Textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        rows={4}
        aria-invalid={!!error}
        className="text-body"
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-red-700" role={error ? 'alert' : undefined}>{error ?? ''}</p>
        <p className="text-sm text-gray-600 shrink-0">{value.length.toLocaleString()} / {MAX_FREE_TEXT.toLocaleString()}</p>
      </div>
    </Field>
  );
}

/** Name, date of birth and NHS number — the removal and delete screens must show the person's key demographics (RAU013). */
function PersonSummary({ person }: { person: RafPerson }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-body">
      <dt className="text-gray-600">Name</dt>
      <dd className="font-medium text-gray-900">{person.name}</dd>
      <dt className="text-gray-600">Date of birth</dt>
      <dd className="font-medium text-gray-900">{person.dob}</dd>
      {person.nhs && (
        <>
          <dt className="text-gray-600">NHS number</dt>
          <dd className="font-medium text-gray-900">{person.nhs}</dd>
        </>
      )}
    </dl>
  );
}

/**
 * Shown inside the dialog when a save is rejected, so what was entered is kept and the user can try again.
 * The message always says what did and didn't happen, and what to do next (the AC for every create, add,
 * remove and delete). The wording here is placeholder: the spec fixes its own error text.
 */
function SaveError({ children }: { children: ReactNode }) {
  return (
    <Alert className="border-red-300 bg-red-50 text-red-900 items-start">
      <AlertCircle aria-hidden="true" />
      <p className="text-body font-medium">{children}</p>
    </Alert>
  );
}

const DIALOG_CLASS = 'sm:max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto';
const TITLE_CLASS = 'text-2xl font-semibold text-gray-900';
const DESCRIPTION_CLASS = 'text-body text-gray-700';

// ─── Create ────────────────────────────────────────────────────────────────────

/**
 * Two steps: the fixed eligibility wording with the Equality Act link, then the
 * fixed confirmation (RAC008). A bare flag is valid, so impairments and
 * adjustments are added from the tab afterwards rather than in this journey.
 * The wording here is placeholder — the real text is fixed by the NHS spec.
 */
export function CreateFlagDialog({
  open,
  onOpenChange,
  person,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: RafPerson;
  /** Returns an error message if the flag couldn't be created, otherwise nothing. */
  onCreate: () => string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={DIALOG_CLASS}>
        {/* Remounts on every open so it always starts at the first step, unticked. */}
        {open && <CreateFlagSteps person={person} onCancel={() => onOpenChange(false)} onCreate={onCreate} />}
      </DialogContent>
    </Dialog>
  );
}

function CreateFlagSteps({ person, onCancel, onCreate }: { person: RafPerson; onCancel: () => void; onCreate: () => string | null }) {
  const [step, setStep] = useState<'eligibility' | 'confirm'>('eligibility');
  const [error, setError] = useState<string | null>(null);
  const [eligible, setEligible] = useState(false);

  if (step === 'eligibility') {
    return (
      <>
        <DialogHeader>
          <DialogTitle className={TITLE_CLASS}>Create a Reasonable Adjustment Flag</DialogTitle>
          <DialogDescription className={DESCRIPTION_CLASS}>Step 1 of 2: check {person.name} is eligible.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-body text-gray-800 leading-relaxed">
            A Reasonable Adjustment Flag should only be created for a person with an impairment that has a substantial and
            long-term adverse effect on their ability to carry out normal day-to-day activities. This is the definition of
            disability in the Equality Act 2010.
          </p>
          <a
            href={EQUALITY_ACT_GUIDANCE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-body font-medium text-[rgb(154,38,214)] underline underline-offset-2"
          >
            Read the Equality Act 2010 guidance <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
          <InfoBanner>
            Creating the flag also records the Equality Act disability threshold on the national flag. You can add
            adjustments and impairments once it exists.
          </InfoBanner>
          <div className="flex items-start gap-3">
            <Checkbox id="raf-eligible" checked={eligible} onCheckedChange={v => setEligible(v === true)} className="mt-0.5 size-5 border-2 border-gray-500 bg-white" />
            <Label htmlFor="raf-eligible" className="text-body text-gray-900 leading-snug">
              I confirm that {person.name} meets this definition.
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="tertiary" onClick={onCancel}>Cancel</Button>
          <Button disabled={!eligible} onClick={() => setStep('confirm')}>Continue</Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className={TITLE_CLASS}>Confirm the flag</DialogTitle>
        <DialogDescription className={DESCRIPTION_CLASS}>Step 2 of 2: check these details, then create the flag.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <PersonSummary person={person} />
        <p className="text-body text-gray-800 leading-relaxed">
          You are about to create a Reasonable Adjustment Flag for {person.name} in PASS, and on the national flag. Other NHS and care
          organisations with access will be able to see that this flag exists.
        </p>
      </div>
      {error && <SaveError>{error}</SaveError>}
      <DialogFooter>
        <Button variant="tertiary" onClick={() => { setError(null); setStep('eligibility'); }}>Back</Button>
        <Button onClick={() => setError(onCreate())}>Create flag</Button>
      </DialogFooter>
    </>
  );
}

// ─── Add ───────────────────────────────────────────────────────────────────────

export interface NewRafItem {
  code: string;
  categoryCode?: string;
  term: string;
  freeText?: string;
}

/**
 * Adds one adjustment or impairment. The pickers only offer valueset values
 * (display text is never free-typed). Adding free text to an adjustment that is
 * already recorded appends to it rather than duplicating it, as the national
 * service merges them (RAU005).
 */
export function AddItemDialog({
  section,
  onOpenChange,
  existing,
  onAdd,
}: {
  /** null = closed. */
  section: Exclude<RafSection, 'condition'> | null;
  onOpenChange: (open: boolean) => void;
  existing: RafItem[];
  /** Returns an error message if the item couldn't be added, otherwise nothing. */
  onAdd: (item: NewRafItem) => string | null;
}) {
  return (
    <Dialog open={section !== null} onOpenChange={onOpenChange}>
      <DialogContent className={DIALOG_CLASS}>
        {section && <AddItemForm section={section} existing={existing} onCancel={() => onOpenChange(false)} onAdd={onAdd} />}
      </DialogContent>
    </Dialog>
  );
}

function AddItemForm({
  section,
  existing,
  onCancel,
  onAdd,
}: {
  section: Exclude<RafSection, 'condition'>;
  existing: RafItem[];
  onCancel: () => void;
  onAdd: (item: NewRafItem) => string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const isAdjustment = section === 'adjustment';
  const [categoryCode, setCategoryCode] = useState('');
  const [termCode, setTermCode] = useState('');
  const [text, setText] = useState('');

  const category = ADJUSTMENT_CATEGORIES.find(c => c.code === categoryCode);
  const termOptions = isAdjustment
    ? (category?.terms ?? [])
    : IMPAIRMENT_VALUES.map(v => ({ code: v.code, term: v.term }));
  const selected = termOptions.find(t => t.code === termCode);

  const active = existing.filter(i => i.section === section);
  const duplicate = active.find(i => i.code === termCode);

  // Impairment rules: "prefer not to say" can't sit alongside any other impairment, and takes no text.
  const preferNotToSay = !isAdjustment && termCode === IMPAIRMENT_PREFER_NOT_TO_SAY_CODE;
  const hasPreferNotToSay = active.some(i => i.code === IMPAIRMENT_PREFER_NOT_TO_SAY_CODE);
  const hasOtherImpairment = active.some(i => i.code !== IMPAIRMENT_PREFER_NOT_TO_SAY_CODE);

  let blocked: string | null = null;
  if (!isAdjustment && termCode) {
    if (preferNotToSay && hasOtherImpairment) blocked = '“Patient would prefer not to say” can’t be combined with other impairments. Remove them first.';
    else if (!preferNotToSay && hasPreferNotToSay) blocked = 'The person has chosen not to say. Remove “Patient would prefer not to say” before adding an impairment.';
    else if (duplicate) blocked = 'This impairment is already recorded.';
  }

  const needsText = isAdjustment
    ? categoryCode === BESPOKE_CATEGORY_CODE || !!duplicate
    : termCode === IMPAIRMENT_OTHER_CODE;
  const trimmed = text.trim();
  const lengthError = textError(text);
  const missingText = needsText && !trimmed;

  const canAdd = !!selected && !blocked && !lengthError && !missingText;

  const label = isAdjustment ? 'adjustment' : 'impairment';

  const submit = () => {
    if (!selected || !canAdd) return;
    setError(
      onAdd({
        code: selected.code,
        categoryCode: isAdjustment ? categoryCode : undefined,
        term: selected.term,
        freeText: preferNotToSay ? undefined : trimmed || undefined,
      }),
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className={TITLE_CLASS}>{isAdjustment ? 'Add a reasonable adjustment' : 'Add an impairment'}</DialogTitle>
        <DialogDescription className={DESCRIPTION_CLASS}>
          Items can't be edited once added. They can be removed, with a reason, and added again.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {isAdjustment && (
          <Field label="Category" htmlFor="raf-category">
            <Combobox
              id="raf-category"
              value={categoryCode}
              onValueChange={v => {
                setCategoryCode(v);
                // Bespoke has only one value, so there's nothing left to pick.
                const terms = ADJUSTMENT_CATEGORIES.find(c => c.code === v)?.terms ?? [];
                setTermCode(terms.length === 1 ? terms[0].code : '');
              }}
              options={ADJUSTMENT_CATEGORIES.map(c => ({ value: c.code, label: c.name }))}
              placeholder="Choose a category"
              searchPlaceholder="Search categories"
            />
          </Field>
        )}

        <Field label={isAdjustment ? 'Adjustment' : 'Impairment'} htmlFor="raf-term">
          <Combobox
            id="raf-term"
            value={termCode}
            onValueChange={setTermCode}
            // The code is searchable too (SNOMED CT for adjustments), so a code copied from elsewhere finds its term.
            options={termOptions.map(t => ({ value: t.code, label: t.term, searchText: t.code }))}
            disabled={isAdjustment && !categoryCode}
            placeholder={isAdjustment ? (categoryCode ? 'Choose an adjustment' : 'Choose a category first') : 'Choose an impairment'}
            searchPlaceholder={isAdjustment ? 'Search adjustments' : 'Search impairments'}
          />
        </Field>

        {blocked && <InfoBanner>{blocked}</InfoBanner>}
        {isAdjustment && duplicate && (
          <InfoBanner>
            This adjustment is already recorded. Your text will be added to the existing entry, not saved as a second one.
          </InfoBanner>
        )}

        {!preferNotToSay && (
          <FreeTextField
            id="raf-free-text"
            label={needsText ? 'Details (required)' : 'Details (optional)'}
            value={text}
            onChange={setText}
            error={lengthError ?? (missingText && text.length > 0 ? 'Add some details.' : null)}
          />
        )}
      </div>

      {error && <SaveError>{error}</SaveError>}
      <DialogFooter>
        <Button variant="tertiary" onClick={onCancel}>Cancel</Button>
        <Button disabled={!canAdd} onClick={submit}>Add {label}</Button>
      </DialogFooter>
    </>
  );
}

// ─── Remove / delete ───────────────────────────────────────────────────────────

/** Where a removal applies: PASS and the national flag, or PASS only. */
export type RemoveScope = 'both' | 'pass';

export type RemoveTarget = { kind: 'item'; item: RafItem } | { kind: 'flag'; itemCount: number };

/**
 * One screen for both removing a single item and deleting the whole flag:
 * pick one of four reasons, add a mandatory comment, and confirm against the
 * person's key demographics and the item's details (RAU012–014, RAD002). Locally
 * the item becomes inactive with an end date rather than being hard-deleted.
 */
export function RemoveDialog({
  target,
  onOpenChange,
  person,
  onConfirm,
}: {
  /** null = closed. */
  target: RemoveTarget | null;
  onOpenChange: (open: boolean) => void;
  person: RafPerson;
  /** Returns an error message if nothing could be changed, otherwise nothing. */
  onConfirm: (reason: string, comment: string, scope: RemoveScope) => string | null;
}) {
  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent className={DIALOG_CLASS}>
        {target && <RemoveForm target={target} person={person} onCancel={() => onOpenChange(false)} onConfirm={onConfirm} />}
      </DialogContent>
    </Dialog>
  );
}

function RemoveForm({
  target,
  person,
  onCancel,
  onConfirm,
}: {
  target: RemoveTarget;
  person: RafPerson;
  onCancel: () => void;
  onConfirm: (reason: string, comment: string, scope: RemoveScope) => string | null;
}) {
  // Two steps: choose and explain, then a separate "Confirm delete" before anything is removed.
  const [step, setStep] = useState<'details' | 'confirm'>('details');
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  // Asked every time rather than assumed: the user can say no (RAO009).
  const [scope, setScope] = useState<RemoveScope>('both');
  const [error, setError] = useState<string | null>(null);
  const isFlag = target.kind === 'flag';
  const lengthError = textError(comment);
  const canContinue = !!reason && !!comment.trim() && !lengthError;

  // What is about to be removed: the same box on both steps.
  const targetSummary = (
    <div className="rounded-lg border border-gray-200 px-4 py-3 space-y-1.5">
      {target.kind === 'item' ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-body font-semibold text-gray-900">{target.item.term}</p>
            {target.item.categoryCode && <Tag label={categoryName(target.item.categoryCode)} />}
          </div>
          {target.item.freeText && <p className="text-body text-gray-700 whitespace-pre-line">{target.item.freeText}</p>}
          <p className="text-sm text-gray-600">
            Added: {formatRafDate(target.item.addedOn)} by {target.item.addedBy} at {target.item.organisation}
          </p>
        </>
      ) : (
        <p className="text-body text-gray-800">
          The flag and its {target.itemCount} {target.itemCount === 1 ? 'item' : 'items'} will be removed.
        </p>
      )}
    </div>
  );

  if (step === 'confirm') {
    const reasonLabel = REMOVAL_REASONS.find(r => r.value === reason)?.label;
    return (
      <>
        <DialogHeader>
          <DialogTitle className={TITLE_CLASS}>Confirm delete</DialogTitle>
          <DialogDescription className={DESCRIPTION_CLASS}>
            {isFlag
              ? 'Check the details below. Once confirmed, the whole flag is deleted.'
              : 'Check the details below. Once confirmed, the item is removed. It is kept in PASS with an end date and is no longer shown.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <PersonSummary person={person} />
          {targetSummary}
          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-body">
            <dt className="text-gray-600">{isFlag ? 'Deleted from' : 'Removed from'}</dt>
            <dd className="font-medium text-gray-900">{scope === 'both' ? 'PASS and the national flag' : 'PASS only'}</dd>
            <dt className="text-gray-600">Reason</dt>
            <dd className="font-medium text-gray-900">{reasonLabel}</dd>
            <dt className="text-gray-600">Comment</dt>
            <dd className="text-gray-900 whitespace-pre-line">{comment.trim()}</dd>
          </dl>
        </div>

        {error && <SaveError>{error}</SaveError>}
        <DialogFooter>
          <Button variant="tertiary" onClick={() => { setError(null); setStep('details'); }}>Back</Button>
          <Button variant="secondary-danger" onClick={() => setError(onConfirm(reason, comment.trim(), scope))}>
            Confirm delete
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className={TITLE_CLASS}>{isFlag ? 'Delete the Reasonable Adjustment Flag' : 'Remove from the flag'}</DialogTitle>
        <DialogDescription className={DESCRIPTION_CLASS}>
          {isFlag
            ? 'This removes the whole flag, including everything on it. A reason and a comment are required.'
            : 'A reason and a comment are required. The item stops being shown but is kept in the record with an end date.'}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <PersonSummary person={person} />
        {targetSummary}

        <Field label={isFlag ? 'Where to delete it' : 'Where to remove it'}>
          <RadioGroup value={scope} onValueChange={v => setScope(v as RemoveScope)} className="gap-2">
            {[
              {
                value: 'both',
                label: 'PASS and the national flag',
                hint: 'Other NHS and care organisations will no longer see it.',
              },
              { value: 'pass', label: 'PASS only', hint: 'It stays on the national flag.' },
            ].map(o => (
              <div key={o.value} className="flex items-start gap-3 rounded-lg border border-gray-200 px-3 py-2.5">
                <RadioGroupItem value={o.value} id={`raf-scope-${o.value}`} className="mt-0.5 size-5 border-2 border-gray-500 bg-white data-[state=checked]:border-[rgb(154,38,214)]" />
                <Label htmlFor={`raf-scope-${o.value}`} className="flex flex-col items-start gap-0.5 cursor-pointer">
                  <span className="text-body font-medium text-gray-900">{o.label}</span>
                  <span className="text-sm text-gray-600 font-normal">{o.hint}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </Field>

        <Field label="Reason">
          <RadioGroup value={reason} onValueChange={setReason} className="gap-2">
            {REMOVAL_REASONS.map(r => (
              <div key={r.value} className="flex items-start gap-3 rounded-lg border border-gray-200 px-3 py-2.5">
                <RadioGroupItem value={r.value} id={`raf-reason-${r.value}`} className="mt-0.5 size-5 border-2 border-gray-500 bg-white data-[state=checked]:border-[rgb(154,38,214)]" />
                <Label htmlFor={`raf-reason-${r.value}`} className="flex flex-col items-start gap-0.5 cursor-pointer">
                  <span className="text-body font-medium text-gray-900">{r.label}</span>
                  <span className="text-sm text-gray-600 font-normal">{r.hint}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </Field>

        <FreeTextField id="raf-remove-comment" label="Comment (required)" value={comment} onChange={setComment} error={lengthError} />
      </div>

      <DialogFooter>
        <Button variant="tertiary" onClick={onCancel}>Cancel</Button>
        <Button disabled={!canContinue} onClick={() => setStep('confirm')}>Continue</Button>
      </DialogFooter>
    </>
  );
}
