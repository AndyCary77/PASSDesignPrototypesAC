// Mock data for the office-wide Alerts page. Static, no backend. The first four alert types are copied from a
// screenshot of the live page so the new type is designed against what is really there; 'reasonable-adjustments'
// is the new one (an NHS update added or changed a Reasonable Adjustment).

export type AlertType = 'booking' | 'medication-form' | 'checklist-item' | 'reasonable-adjustments';

export const ALERT_TYPE_LABEL: Record<AlertType, string> = {
  booking: 'Booking',
  'medication-form': 'Medication form',
  'checklist-item': 'Checklist item',
  'reasonable-adjustments': 'Reasonable adjustments',
};

export interface AlertRecord {
  id: string;
  type: AlertType;
  /** The red heading on the card. */
  title: string;
  /** Bullet lines. `strong` words are bold, as on the live page. */
  lines: { strong?: string; text: string }[];
  /** yyyy-mm-dd and hh:mm, shown under the card. */
  date: string;
  time: string;
  /** Checklist alerts only: the "Task Type" filter. */
  taskType?: string;
  /** Reasonable adjustments only. */
  customerId?: string;
  customerName?: string;
  /** What the NHS update changed. Detail, so hidden from internal admin users. */
  change?: { summary: string; by: string };
}

export const TODAY = '2026-11-09';

export const ALERTS: AlertRecord[] = [
  // The new type: newest first, as the page orders them.
  {
    id: 'ra-2',
    type: 'reasonable-adjustments',
    title: 'Reasonable adjustment updated by the NHS',
    lines: [],
    date: TODAY,
    time: '09:41',
    customerId: 'edith-caldwell',
    customerName: 'Mrs Edith Caldwell',
    change: { summary: 'Impairment added: Vision (for example blindness or partial sight)', by: 'Priya Shah at Midlands Community Eye Clinic' },
  },
  {
    id: 'ra-1',
    type: 'reasonable-adjustments',
    title: 'Reasonable adjustment updated by the NHS',
    lines: [],
    date: TODAY,
    time: '08:05',
    customerId: 'arthur-barrington',
    customerName: 'Mr Arthur Barrington',
    change: { summary: 'Adjustment added: Requires contact by email', by: 'Dr Anita Patel at Tamworth Medical Practice' },
  },
  {
    id: 'b-1',
    type: 'booking',
    title: 'Booking',
    lines: [{ strong: 'MISSED', text: ' for Dorothy Gomersall' }, { text: 'at 12:00 09/11' }, { text: 'by Karen Patton' }],
    date: TODAY,
    time: '12:32',
  },
  {
    id: 'b-2',
    type: 'booking',
    title: 'Booking',
    lines: [{ strong: 'MISSED', text: ' for Geoff Tate' }, { text: 'at 12:00 09/11' }, { text: 'by Natasha Flora Odongo' }],
    date: TODAY,
    time: '12:32',
  },
  {
    id: 'm-1',
    type: 'medication-form',
    title: 'medication form',
    lines: [{ strong: 'MEDICATION', text: ' for Eric Thomas' }, { text: 'by Kim Martin' }],
    date: TODAY,
    time: '11:15',
  },
  {
    id: 'c-1',
    type: 'checklist-item',
    title: 'Checklist item - renewal approaching',
    lines: [
      { strong: 'MOT Document (Annual)', text: ' for Roberta Giganti' },
      { text: 'Renewal approaching in 1 month' },
      { text: 'Due on: 09/12/2026' },
      { strong: 'MOT', text: ' checklist' },
    ],
    date: TODAY,
    time: '00:38',
    taskType: 'MOT Document (Annual)',
  },
  {
    id: 'c-2',
    type: 'checklist-item',
    title: 'Checklist item - renewal approaching',
    lines: [
      { strong: 'MOT Document (Annual)', text: ' for Mobola Lugboso' },
      { text: 'Renewal approaching in 1 month' },
      { text: 'Due on: 09/12/2026' },
      { strong: 'MOT', text: ' checklist' },
    ],
    date: TODAY,
    time: '00:38',
    taskType: 'MOT Document (Annual)',
  },
  {
    id: 'c-3',
    type: 'checklist-item',
    title: 'Checklist item - deadline approaching',
    lines: [
      { strong: 'MOT Document (Annual)', text: ' for Maandero Siririka' },
      { text: 'Deadline approaching in 1 month' },
      { text: 'Due on: 09/12/2026' },
      { strong: 'MOT', text: ' checklist' },
    ],
    date: TODAY,
    time: '00:38',
    taskType: 'MOT Document (Annual)',
  },
  {
    id: 'c-4',
    type: 'checklist-item',
    title: 'Checklist item - deadline approaching',
    lines: [
      { strong: 'MOT Document (Annual)', text: ' for Jane Webster' },
      { text: 'Deadline approaching in 1 month' },
      { text: 'Due on: 09/12/2026' },
      { strong: 'MOT', text: ' checklist' },
    ],
    date: TODAY,
    time: '00:38',
    taskType: 'MOT Document (Annual)',
  },
  // Yesterday, so the Date Range filter has something to do.
  {
    id: 'b-0',
    type: 'booking',
    title: 'Booking',
    lines: [{ strong: 'MISSED', text: ' for Harold Pinkney' }, { text: 'at 18:00 08/11' }, { text: 'by Karen Patton' }],
    date: '2026-11-08',
    time: '18:34',
  },
];

/** Suggested notes when resolving a Reasonable Adjustments alert. The note itself is free text. */
export const RA_RESOLVE_SUGGESTIONS = ['Care plan updated', 'Visits and rostering updated', 'Reviewed, no action needed'];
