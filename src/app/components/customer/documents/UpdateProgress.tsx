import { Fragment } from 'react';
import { Check, Loader2 } from 'lucide-react';
import assessmentHeroIconUrl from '../../icons/assessment-hero.svg';

// The "thinking time" while a finished document is updated from a recording or file: the same stepper Care
// Management shows while it drafts a care plan (CarePlanDraftFlow) — a purple panel, numbered steps that tick off
// as each finishes, and a line between steps that fills in as the next one starts. It's a simulation: the steps
// run on timers, then the update is applied.

export type UpdateSourceKind = 'recording' | 'file';

/** How long each step takes, in the same range as CARE_PLAN_DRAFT_STEPS so the two waits feel alike. */
export function getUpdateSteps(kind: UpdateSourceKind): { label: string; ms: number }[] {
  return [
    { label: `Reading the ${kind}`, ms: 1300 },
    { label: "Finding what's new", ms: 2000 },
    { label: 'Updating the document', ms: 1500 },
  ];
}

/** A brief hold with every step ticked, so the finished stepper is actually seen before the result replaces it. */
export const UPDATE_COMPLETE_HOLD_MS = 700;

export function DocumentUpdateProgress({ documentName, sourceLabel, steps, step, action = 'Updating' }: {
  documentName: string;
  /** The verb in the heading: "Updating" a finished document, or "Filling in" a blank one. */
  action?: string;
  sourceLabel: string;
  steps: { label: string }[];
  /** Index of the step running; equal to `steps.length` during the final hold, when all are done. */
  step: number;
}) {
  const current = Math.min(step, steps.length - 1);
  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 shadow-sm" role="status" aria-live="polite">
      <div className="flex items-center gap-2.5 mb-4">
        <img src={assessmentHeroIconUrl} className="w-6 h-6 flex-shrink-0" alt="" />
        <p className="text-body font-semibold text-purple-900">
          {action} the {documentName} from <span className="break-words">{sourceLabel}</span>…
        </p>
      </div>
      {/* Spoken once per step; the visual stepper below is decorative to a screen reader. */}
      <span className="sr-only">
        {step >= steps.length ? 'Finished.' : `Step ${current + 1} of ${steps.length}: ${steps[current].label}`}
      </span>
      <div className="flex items-start px-1" aria-hidden="true">
        {steps.map((s, i) => {
          const state = i < step ? 'done' : i === step ? 'active' : 'pending';
          return (
            <Fragment key={s.label}>
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0 w-44">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${
                    state === 'done' ? 'bg-[rgb(33,166,33)] text-white' : state === 'active' ? 'bg-[rgb(154,38,214)] text-white' : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {/* Keyed by state so the tick plays a pop-in rather than silently swapping icons. */}
                  <span key={state} className="flex items-center justify-center animate-in zoom-in-50 duration-300">
                    {state === 'done' ? <Check className="w-3 h-3" /> : state === 'active' ? <Loader2 className="w-3 h-3 animate-spin" /> : i + 1}
                  </span>
                </span>
                <span className={`text-body text-center ${state === 'pending' ? 'text-purple-700' : 'text-purple-900 font-medium'}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-purple-100 rounded-full overflow-hidden mt-2.5 mx-1">
                  <div
                    className="h-full bg-[rgb(154,38,214)] transition-all ease-out duration-300"
                    style={{ width: i < step ? '100%' : '0%' }}
                  />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
