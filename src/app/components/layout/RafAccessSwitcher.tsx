import { createPortal } from 'react-dom';
import { useLocation } from 'react-router';
import { useRafAccess, type NationalFlagState, type RafAccessLevel, type NhsRequestState, type SaveOutcome } from '../../data/RafAccessContext';
import { RAF_WRITE_ENABLED } from '../../data/reasonableAdjustments';
import { SegmentedControl } from '../buttons/SegmentedControl';
import { Button } from '../buttons/Button';

/**
 * Prototype-only review controls for the Reasonable Adjustments tab, kept out of the page content:
 *
 *  - "View as": who is signed in, so each level can be reviewed. "Admin" is an internal EveryLife admin user, who
 *    sees that a flag exists but not its details, so the tab is hidden. On every customer tab, including the ones where
 *    the tab itself is hidden, which is the only way back from "Admin".
 *  - "National flag" (on the Reasonable Adjustments tab only): what the NHS holds for the customer,
 *    and a button standing in for another organisation changing it.
 *  - "NHS request" (same tab): whether the live request to the NHS gets an answer, to review the error state.
 *  - "Next save" (same tab): whether the national flag service accepts the next change, to review the
 *    error messages. One-shot, so the retry succeeds.
 *
 * Rendered from the customer header and floated bottom-right, like the Default/Bolder toggle
 * bottom-left; portalled to the body so no ancestor's sticky/transform can move it.
 */
export function RafAccessSwitcher() {
  const { level, setLevel, nationalFlag, setNationalFlag, simulateNationalChange, saveOutcome, setSaveOutcome, nhsRequest, setNhsRequest } = useRafAccess();
  const onRaTab = useLocation().pathname.endsWith('/reasonableadjustments');

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-stretch gap-1.5 rounded-[10px] border border-gray-200 bg-white p-2 shadow-md">
      <span className="text-sm font-medium text-gray-700 text-center">View as</span>
      <SegmentedControl<RafAccessLevel>
        ariaLabel="Reasonable Adjustment Flag access level"
        orientation="vertical"
        value={level}
        onChange={setLevel}
        options={[
          { value: 'admin', label: 'Admin' },
          { value: '1', label: 'Level 1' },
          { value: '2', label: 'Level 2' },
          // Level 3 only differs by being able to write, which is parked for phase 1.
          ...(RAF_WRITE_ENABLED ? [{ value: '3' as const, label: 'Level 3' }] : []),
        ]}
      />

      {onRaTab && (
        <>
          <span className="mt-1 text-sm font-medium text-gray-700 text-center">National flag</span>
          <SegmentedControl<NationalFlagState>
            ariaLabel="What the national flag holds for this customer"
            orientation="vertical"
            value={nationalFlag}
            onChange={setNationalFlag}
            options={[
              { value: 'found', label: 'Found' },
              { value: 'none', label: 'Not found' },
              { value: 'no-nhs-number', label: 'No NHS no.' },
            ]}
          />
          <Button variant="secondary" size="sm" onClick={simulateNationalChange} disabled={nationalFlag === 'no-nhs-number'}>
            NHS update
          </Button>

          <span className="mt-1 text-sm font-medium text-gray-700 text-center">NHS request</span>
          <SegmentedControl<NhsRequestState>
            ariaLabel="Whether the NHS answers the request the tab makes when it opens"
            orientation="vertical"
            value={nhsRequest}
            onChange={setNhsRequest}
            options={[
              { value: 'ok', label: 'Answers' },
              { value: 'error', label: 'Fails' },
            ]}
          />

          {RAF_WRITE_ENABLED && (
            <>
              <span className="mt-1 text-sm font-medium text-gray-700 text-center">Next save</span>
              <SegmentedControl<SaveOutcome>
                ariaLabel="Whether the national flag accepts the next save"
                orientation="vertical"
                value={saveOutcome}
                onChange={setSaveOutcome}
                options={[
                  { value: 'ok', label: 'Works' },
                  { value: 'error', label: 'Fails' },
                  { value: 'conflict', label: 'Conflict' },
                ]}
              />
            </>
          )}
        </>
      )}
    </div>,
    document.body,
  );
}
