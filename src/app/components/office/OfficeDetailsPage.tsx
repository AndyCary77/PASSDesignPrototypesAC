import { Info, Minus, Plus } from 'lucide-react';
import { BRAND_OPTIONS, type OfficeDetails, type PpeStockItem } from './officeMockData';
import { useOffice } from './OfficeContext';
import { SegmentedToggle } from '../buttons/SegmentedToggle';

// Rebuilt from the legacy AngularJS office-details form (see the pasted
// DOM this was based on). Static-permission gating (ng-show="vm.isAdmin"
// etc.) isn't modelled here — there's no auth system in this prototype —
// every section that existed in the legacy form is shown.
//
// Inputs/selects/textareas/checkboxes/labels here are plain native
// elements with the same hand-written classes used throughout the rest of
// the app (see CustomerDetailsPage.tsx) — not the shadcn ui/ primitives,
// which no other page actually uses and which render with different
// height/padding/focus styling than everywhere else.
const INPUT_CLASS = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm';
const SELECT_CLASS = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white';
const LABEL_CLASS = 'block text-sm font-medium text-gray-700 mb-2';

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label, htmlFor, required, hint, children,
}: { label: string; htmlFor?: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className={`${LABEL_CLASS} flex items-center gap-1.5`}>
        {label}
        {required && <span className="text-red-500">*</span>}
        {hint && (
          <span title={hint} className="cursor-help">
            <Info className="w-3.5 h-3.5 text-gray-400" />
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function CheckboxField({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm text-gray-700">
      <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded border-gray-300" />
      <span>{label}</span>
    </label>
  );
}

function rgbToHex(rgb: string): string {
  const nums = rgb.match(/\d+/g);
  if (!nums) return '#000000';
  const [r, g, b] = nums.map(Number);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <label className="inline-flex items-center gap-3 cursor-pointer">
        <span className="relative w-10 h-10 rounded-md border border-gray-300 overflow-hidden flex-shrink-0" style={{ backgroundColor: value }}>
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={label}
          />
        </span>
        <span className="text-sm text-gray-600 uppercase">{value}</span>
      </label>
    </div>
  );
}

function ragColor(daysRemaining: number | null) {
  if (daysRemaining === null) return 'bg-green-500';
  if (daysRemaining <= 0) return 'bg-red-500';
  if (daysRemaining <= 7) return 'bg-amber-500';
  return 'bg-green-500';
}
function ragLabel(daysRemaining: number | null) {
  return daysRemaining === null ? '30+' : String(daysRemaining);
}

function PpeStockCard({ items, lastUpdatedAt, onChange }: { items: PpeStockItem[]; lastUpdatedAt: string; onChange: (items: PpeStockItem[]) => void }) {
  const setCount = (index: number, count: number) => {
    onChange(items.map((it, i) => (i === index ? { ...it, count: Math.max(0, count) } : it)));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h4 className="font-semibold text-gray-900">PPE stock</h4>
        <span className="text-xs text-gray-500 whitespace-nowrap">Last updated at {lastUpdatedAt}</span>
      </div>
      <p className="text-sm text-gray-600 mt-3">
        Days remaining is an approximation based on your PPE stock history and the current PPE stock. It is
        important to update your office PPE stock levels regularly in order for PASS to calculate this more
        accurately.
      </p>
      <p className="text-sm text-gray-600 mt-2">Please ensure the units recorded are consistent across your organisation.</p>
      <p className="text-sm text-gray-500 italic mt-1">E.g. if you choose to record in packs of 10, everyone should record in packs of 10.</p>

      <div className="mt-4 overflow-x-auto">
        {/* Same plain-table convention as CustomerDetailsPage's "Integration details" card. */}
        <table className="w-full border border-gray-200 rounded-md">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200">Type</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200">Units</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200">Days remaining*</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.label} className="border-b border-gray-200 last:border-b-0">
                <td className="px-4 py-2 text-sm text-gray-900">{item.label}</td>
                <td className="px-4 py-2">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCount(i, item.count - 1)}
                      disabled={item.count <= 0}
                      className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={item.count}
                      onChange={e => setCount(i, Number(e.target.value))}
                      className="w-20 px-2 py-1.5 border border-gray-300 rounded-md text-sm text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setCount(i, item.count + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ragColor(item.daysRemaining)}`} />
                    {ragLabel(item.daysRemaining)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-3">*At current estimated daily usage levels.</p>
    </div>
  );
}

export function OfficeDetailsPage() {
  // Office/edit state lives in OfficeProvider so the pinned OfficeSubnav's
  // Save button (a top CTA, same as Care Management/Care Plan document)
  // can act on it from outside this component.
  const { office, updateOffice: update } = useOffice();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ── Left column ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <SectionCard title="Brand settings">
            {/* Intentionally minimal for now — the legacy typeahead search
                is being replaced with real functionality to be specified
                separately, so this just holds a plain value for the
                moment rather than pre-building search/matching behaviour
                that would need to change anyway. */}
            <Field label="Brand" htmlFor="brand" required>
              <input
                id="brand"
                list="brand-options"
                value={office.brand}
                onChange={e => update('brand', e.target.value)}
                placeholder="Search brands…"
                className={INPUT_CLASS}
              />
              <datalist id="brand-options">
                {BRAND_OPTIONS.map(b => <option key={b} value={b} />)}
              </datalist>
            </Field>
          </SectionCard>

          <SectionCard title="Office details">
            <Field label="Name" htmlFor="name" required>
              <input id="name" maxLength={50} value={office.name} onChange={e => update('name', e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Company name" htmlFor="company-name">
              <input id="company-name" maxLength={255} value={office.companyName} onChange={e => update('companyName', e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Address line 1" htmlFor="address1">
              <input id="address1" maxLength={50} value={office.address1} onChange={e => update('address1', e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Address line 2" htmlFor="address2">
              <input id="address2" maxLength={50} value={office.address2} onChange={e => update('address2', e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="City" htmlFor="city">
              <input id="city" maxLength={25} value={office.city} onChange={e => update('city', e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="County" htmlFor="county">
              <input id="county" maxLength={25} value={office.county} onChange={e => update('county', e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Country" htmlFor="country">
              <input id="country" maxLength={25} value={office.country} onChange={e => update('country', e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Postcode" htmlFor="postcode">
              <input id="postcode" maxLength={10} value={office.postcode} onChange={e => update('postcode', e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Office secret" htmlFor="secret" required>
              <input id="secret" maxLength={25} value={office.secret} onChange={e => update('secret', e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Account ID" htmlFor="accountID" required>
              <input id="accountID" maxLength={50} value={office.accountId} onChange={e => update('accountId', e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Social services reference" htmlFor="ssReference">
              <input id="ssReference" maxLength={50} value={office.ssReference} onChange={e => update('ssReference', e.target.value)} className={INPUT_CLASS} />
            </Field>
          </SectionCard>

          <SectionCard title="Communication details">
            <Field label="Opening hours" htmlFor="openingHours">
              <input id="openingHours" maxLength={100} value={office.openingHours} onChange={e => update('openingHours', e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="On-call hours" htmlFor="onCallHours">
              <input id="onCallHours" maxLength={100} value={office.onCallHours} onChange={e => update('onCallHours', e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Email" htmlFor="email">
              <input id="email" type="email" maxLength={50} value={office.email} onChange={e => update('email', e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Website" htmlFor="website">
              <input id="website" maxLength={50} value={office.website} onChange={e => update('website', e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Tel" htmlFor="tel">
              <input id="tel" maxLength={25} value={office.tel} onChange={e => update('tel', e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Out of hours tel" htmlFor="outOfHoursTel">
              <input id="outOfHoursTel" maxLength={25} value={office.outOfHoursTel} onChange={e => update('outOfHoursTel', e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Fax" htmlFor="fax">
              <input id="fax" maxLength={25} value={office.fax} onChange={e => update('fax', e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Main contact" htmlFor="contact">
              <input id="contact" maxLength={50} value={office.contact} onChange={e => update('contact', e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Contact mobile" htmlFor="mobile">
              <input id="mobile" maxLength={25} value={office.mobile} onChange={e => update('mobile', e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="On-call" htmlFor="oncall">
              <input id="oncall" maxLength={100} value={office.oncall} onChange={e => update('oncall', e.target.value)} className={INPUT_CLASS} />
            </Field>
          </SectionCard>

          <SectionCard title="Colour scheme">
            <ColorField
              label="Main title underline colour"
              value={rgbToHex(office.colours.main)}
              onChange={hex => update('colours', { main: hex })}
            />
          </SectionCard>
        </div>

        {/* ── Right column ────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <SectionCard title="Status and type">
            <div>
              <label className={LABEL_CLASS}>Status</label>
              <SegmentedToggle value={office.active} onChange={v => update('active', v)} onLabel="Active" offLabel="Inactive" />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                Test PASS office
                <span title="Test offices are demo, test, documents or training offices" className="cursor-help">
                  <Info className="w-3.5 h-3.5 text-gray-400" />
                </span>
              </label>
              <select value={office.isTest ? 'test' : 'live'} onChange={e => update('isTest', e.target.value === 'test')} className={`${SELECT_CLASS} sm:w-56`}>
                <option value="live">Live Office</option>
                <option value="test">Test Office</option>
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Type</label>
              <select value={office.type} onChange={e => update('type', e.target.value as OfficeDetails['type'])} className={`${SELECT_CLASS} sm:w-56`}>
                <option value="DOMICILIARY">DOMICILIARY</option>
                <option value="RESIDENTIAL">RESIDENTIAL</option>
              </select>
            </div>
          </SectionCard>

          <PpeStockCard
            items={office.ppeStock.items}
            lastUpdatedAt={office.ppeStock.lastUpdatedAt}
            onChange={items => update('ppeStock', { ...office.ppeStock, items })}
          />

          <SectionCard title="Visit timeout and task settings">
            {office.type !== 'RESIDENTIAL' && (
              <CheckboxField
                id="enableTimeout"
                label="Enable task timeout"
                checked={office.enableTaskTimeout}
                onChange={v => update('enableTaskTimeout', v)}
              />
            )}
            {(office.type === 'RESIDENTIAL' || office.enableTaskTimeout) && (
              <CheckboxField
                id="taskMissedAlertsEnabled"
                label="Generate missed task alerts?"
                checked={office.taskMissedAlerts}
                onChange={v => update('taskMissedAlerts', v)}
              />
            )}
            {office.taskMissedAlerts && (
              <>
                <Field label="Email all task alerts to" htmlFor="visitTaskTimeoutEmail">
                  <input id="visitTaskTimeoutEmail" type="email" maxLength={100} value={office.visitTaskTimeoutEmail} onChange={e => update('visitTaskTimeoutEmail', e.target.value)} className={INPUT_CLASS} />
                </Field>
                <Field label="SMS all task alerts to" htmlFor="visitTaskTimeoutSmsNumber">
                  <input id="visitTaskTimeoutSmsNumber" maxLength={16} value={office.visitTaskTimeoutSmsNumber} onChange={e => update('visitTaskTimeoutSmsNumber', e.target.value)} className={INPUT_CLASS} />
                </Field>
              </>
            )}
          </SectionCard>

          <SectionCard title="Booking settings">
            <CheckboxField
              id="bookingMissedAlertsEnabled"
              label="Generate booking missed alerts?"
              checked={office.bookingMissedAlerts}
              onChange={v => update('bookingMissedAlerts', v)}
            />
            {office.bookingMissedAlerts && (
              <>
                <Field label="Timeout after (minutes)" htmlFor="bookingTimeout" required>
                  <input
                    id="bookingTimeout"
                    type="number"
                    min={0}
                    max={360}
                    value={office.bookingTimeout ?? ''}
                    onChange={e => update('bookingTimeout', e.target.value === '' ? null : Number(e.target.value))}
                    className={`${INPUT_CLASS} sm:w-40`}
                  />
                  {office.bookingTimeout === null && (
                    <p className="text-sm text-red-500 mt-1">Timeout value is required if timeouts are enabled</p>
                  )}
                </Field>
                <Field label="Email booking missed alerts to" htmlFor="bookingTimeoutEmail">
                  <input id="bookingTimeoutEmail" type="email" maxLength={100} value={office.bookingTimeoutEmail} onChange={e => update('bookingTimeoutEmail', e.target.value)} className={INPUT_CLASS} />
                </Field>
                <Field label="SMS booking missed alerts to" htmlFor="bookingTimeoutSmsNumber">
                  <input id="bookingTimeoutSmsNumber" maxLength={16} value={office.bookingTimeoutSmsNumber} onChange={e => update('bookingTimeoutSmsNumber', e.target.value)} className={INPUT_CLASS} />
                </Field>
              </>
            )}
          </SectionCard>

          <SectionCard title="openPASS settings">
            <div>
              <label className={LABEL_CLASS}>openPASS enabled</label>
              <SegmentedToggle
                value={office.openpassEnabled}
                onChange={v => update('openpassEnabled', v)}
                onLabel="Yes"
                offLabel="No"
                onColor="bg-[rgb(154,38,214)]"
                offColor="bg-gray-400"
              />
            </div>
            <Field label="openPASS contact email" htmlFor="openpassEmail" required={office.openpassEnabled}>
              <input id="openpassEmail" type="email" maxLength={100} value={office.openpassEmail} onChange={e => update('openpassEmail', e.target.value)} className={INPUT_CLASS} />
            </Field>
          </SectionCard>

          <SectionCard title="App settings">
            <Field label="App message" htmlFor="message">
              <textarea id="message" maxLength={400} value={office.message} onChange={e => update('message', e.target.value)} rows={4} className={`${INPUT_CLASS} resize-none`} />
            </Field>
            <Field label="Device white list" htmlFor="deviceWhiteList">
              <textarea id="deviceWhiteList" value={office.deviceWhiteList} onChange={e => update('deviceWhiteList', e.target.value)} rows={2} className={`${INPUT_CLASS} resize-none`} />
            </Field>
          </SectionCard>

          <SectionCard title="Regulator details">
            <Field label="Registration number" htmlFor="cqcProviderId">
              <input id="cqcProviderId" maxLength={25} value={office.cqcProviderId} onChange={e => update('cqcProviderId', e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Location number (if applicable)" htmlFor="cqcLocation">
              <input id="cqcLocation" maxLength={25} value={office.cqcLocation} onChange={e => update('cqcLocation', e.target.value)} className={INPUT_CLASS} />
            </Field>
          </SectionCard>

          <SectionCard title="NHS integration details">
            <Field label="ODS code" htmlFor="odsCode">
              <input id="odsCode" maxLength={25} value={office.odsCode} onChange={e => update('odsCode', e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="ASID" htmlFor="asid">
              <input id="asid" maxLength={25} value={office.asid} onChange={e => update('asid', e.target.value)} className={INPUT_CLASS} />
            </Field>
          </SectionCard>

          <SectionCard title="Features">
            <CheckboxField id="enablePassRoster" label="Enable PASSroster" checked={office.passRosterEnabled} onChange={v => update('passRosterEnabled', v)} />
            <CheckboxField id="enableMfa" label="Enable MFA" checked={office.mfaEnabled} onChange={v => update('mfaEnabled', v)} />
            <CheckboxField id="enableJournal" label="Enable Journal" checked={office.journalEnabled} onChange={v => update('journalEnabled', v)} />
          </SectionCard>
        </div>
      </div>

      {/* Save now lives as a pinned top CTA in OfficeSubnav, matching Care
          Management/Care Plan document — just the audit line stays here. */}
      <p className="text-sm text-gray-500 pt-2">
        Modified: {office.modifiedAt} by {office.modifiedBy} | Created: {office.createdAt} by {office.createdBy}
      </p>
    </div>
  );
}
