import { useState, useEffect } from 'react';
import { X, ChevronDown, Clock, Calendar, Info } from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

function parseDuration(dur: string): { hours: number; mins: number } {
  const hourMatch = dur.match(/(\d+)\s*hour/);
  const minMatch = dur.match(/(\d+)\s*min/);
  return {
    hours: hourMatch ? parseInt(hourMatch[1]) : 0,
    mins: minMatch ? parseInt(minMatch[1]) : 0,
  };
}

function addTime(startTime: string, hours: number, mins: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const total = h * 60 + m + hours * 60 + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputClass =
  'w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[rgb(154,38,214)] focus:ring-1 focus:ring-[rgb(154,38,214)]';

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1.5">
      {required && <span className="text-[rgb(154,38,214)] mr-0.5">*</span>}
      {children}
    </label>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-gray-900 pb-2 mb-4 border-b border-gray-200">
      {children}
    </h3>
  );
}

function StyledSelect({
  id,
  value,
  onChange,
  children,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} appearance-none pr-8`}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

function TimeSelect({
  id,
  value,
  onChange,
  allowNone,
  disabled,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  allowNone?: boolean;
  disabled?: boolean;
}) {
  const listId = `${id ?? 'time'}-list`;
  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="HH:MM"
        className={`${inputClass} pr-8 disabled:opacity-40 disabled:cursor-not-allowed`}
      />
      <datalist id={listId}>
        {allowNone && <option value="" />}
        {TIME_OPTIONS.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <Clock className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

const DAYS_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function DayToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium border transition-colors cursor-pointer ${
        active
          ? 'bg-[rgb(154,38,214)] border-[rgb(154,38,214)] text-white'
          : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
      }`}
    >
      {label}
    </button>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VisitEditData {
  title: string;
  startDate: string;
  endDate: string;
  careType: string;
  startTime: string;
  earliestStart?: string;
  endTime: string;
  latestEnd?: string;
  duration: string;
  careworkers: number;
  funder: string;
  chargeRateSheet: string;
  depositStatus: string;
  payRateSheet: string;
  cadenceType: string;
  weeks: Array<{ currentWeek?: boolean; activeDays: number[] }>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VisitEditSlideout({
  visitNumber,
  data,
  onClose,
}: {
  visitNumber: number;
  data: VisitEditData;
  onClose: () => void;
}) {
  const dur = parseDuration(data.duration);

  const [title, setTitle] = useState(data.title);
  const [startDate, setStartDate] = useState(data.startDate);
  const [ongoing, setOngoing] = useState(data.endDate === 'Ongoing');
  const [endDate, setEndDate] = useState(data.endDate === 'Ongoing' ? '' : data.endDate);
  const [careType, setCareType] = useState(data.careType);
  const [startTime, setStartTime] = useState(data.startTime);
  const [earliestStart, setEarliestStart] = useState(data.earliestStart ?? '');
  const [durationHours, setDurationHours] = useState(dur.hours);
  const [durationMins, setDurationMins] = useState(dur.mins);
  const [latestEnd, setLatestEnd] = useState(data.latestEnd ?? '');
  const [timeCritical, setTimeCritical] = useState(false);
  const [careworkers, setCareworkers] = useState(data.careworkers);
  const [cadence, setCadence] = useState(data.cadenceType);
  const [weeks, setWeeks] = useState<Array<{ currentWeek?: boolean; activeDays: Set<number> }>>(
    data.weeks.map((w) => ({ currentWeek: w.currentWeek, activeDays: new Set(w.activeDays) })),
  );
  const [chargeRateSheet, setChargeRateSheet] = useState(data.chargeRateSheet);
  const [depositPaid, setDepositPaid] = useState(data.depositStatus !== '-');
  const [payRateSheet, setPayRateSheet] = useState(
    data.payRateSheet === '-' ? '' : data.payRateSheet,
  );

  const untilTime = addTime(startTime, durationHours, durationMins);

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const toggleDay = (weekIdx: number, dayIdx: number) => {
    setWeeks((prev) =>
      prev.map((w, i) => {
        if (i !== weekIdx) return w;
        const next = new Set(w.activeDays);
        next.has(dayIdx) ? next.delete(dayIdx) : next.add(dayIdx);
        return { ...w, activeDays: next };
      }),
    );
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end transition-colors duration-300 ${visible ? 'bg-black/30' : 'bg-black/0'}`}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className={`bg-white !w-1/2 !max-w-[960px] h-full shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 ease-in-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">
            Edit visit {visitNumber} — {data.title}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 cursor-pointer hover:opacity-70 transition-opacity"
            style={{ color: 'rgb(154, 38, 214)' }}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-8 py-8 bg-gray-50">
          <form id="visit-edit-form" className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleClose(); }}>

            {/* ── Visit details ─────────────────────────────────────────── */}
            <div>
              <SectionHeading>Visit details</SectionHeading>
              <div className="space-y-4">

                <div>
                  <FormLabel htmlFor="ve-title" required>Visit title</FormLabel>
                  <input
                    id="ve-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <FormLabel htmlFor="ve-start-date" required>Start date</FormLabel>
                  <div className="relative">
                    <input
                      id="ve-start-date"
                      type="text"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className={`${inputClass} pr-10`}
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <FormLabel htmlFor="ve-end-date">End date</FormLabel>
                  <div className="relative mb-2">
                    <input
                      id="ve-end-date"
                      type="text"
                      value={ongoing ? '' : endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="DD/MM/YYYY"
                      disabled={ongoing}
                      className={`${inputClass} pr-10 disabled:opacity-40`}
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={ongoing}
                      onChange={(e) => setOngoing(e.target.checked)}
                      className="rounded border-gray-300 accent-[rgb(154,38,214)]"
                    />
                    Ongoing
                  </label>
                </div>

                <div>
                  <FormLabel htmlFor="ve-care-type" required>Care type</FormLabel>
                  <StyledSelect id="ve-care-type" value={careType} onChange={setCareType}>
                    {['Personal care', 'Companionship', 'Domestic', 'Live-in', 'Night', 'Reablement', 'Supported living'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </StyledSelect>
                </div>

                {/* Grid: row 1 = Start time | Duration, row 2 = info banner, row 3 = Earliest start | Latest end */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 items-start">

                  {/* Row 1 left — Start time */}
                  <div>
                    <div className="h-6 flex items-center mb-1.5">
                      <label htmlFor="ve-start-time" className="text-sm font-medium text-gray-700">
                        <span className="text-[rgb(154,38,214)] mr-0.5">*</span>Start time
                      </label>
                    </div>
                    <TimeSelect id="ve-start-time" value={startTime} onChange={setStartTime} />
                  </div>

                  {/* Row 1 right — Duration */}
                  <div>
                    <div className="h-6 flex items-center mb-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        <span className="text-[rgb(154,38,214)] mr-0.5">*</span>Duration
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={durationHours}
                          onChange={(e) => setDurationHours(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-2.5 text-sm text-center focus:outline-none focus:border-[rgb(154,38,214)]"
                        />
                        <span className="text-sm text-gray-600">Hours</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={59}
                          step={5}
                          value={durationMins}
                          onChange={(e) => setDurationMins(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-2.5 text-sm text-center focus:outline-none focus:border-[rgb(154,38,214)]"
                        />
                        <span className="text-sm text-gray-600">Mins</span>
                      </div>
                      <span className="text-sm text-gray-900">Until: {untilTime}</span>
                    </div>
                  </div>

                  {/* Row 2 — full-width info banner */}
                  <div className="col-span-2 flex items-start gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2.5 text-sm text-gray-800">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-400" />
                    <span>Use the fields below to enter leeway times if these have been agreed with the customer.</span>
                  </div>

                  {/* Row 3 left — Earliest start */}
                  <div>
                    <div className="h-6 flex items-center mb-1.5">
                      <label htmlFor="ve-earliest-start" className={`text-sm font-medium ${timeCritical ? 'text-gray-400' : 'text-gray-700'}`}>
                        Earliest start
                      </label>
                    </div>
                    <TimeSelect id="ve-earliest-start" value={earliestStart} onChange={setEarliestStart} allowNone disabled={timeCritical} />
                  </div>

                  {/* Row 3 right — Latest end */}
                  <div>
                    <div className="h-6 flex items-center mb-1.5">
                      <label htmlFor="ve-latest-end" className={`text-sm font-medium ${timeCritical ? 'text-gray-400' : 'text-gray-700'}`}>
                        Latest end
                      </label>
                    </div>
                    <TimeSelect id="ve-latest-end" value={latestEnd} onChange={setLatestEnd} allowNone disabled={timeCritical} />
                  </div>

                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={timeCritical}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setTimeCritical(checked);
                      if (checked) {
                        setEarliestStart('');
                        setLatestEnd('');
                      }
                    }}
                    className="rounded border-gray-300 accent-[rgb(154,38,214)]"
                  />
                  Time critical
                </label>

                {/* Careworkers */}
                <div>
                  <FormLabel htmlFor="ve-careworkers" required>Careworkers</FormLabel>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCareworkers(Math.max(1, careworkers - 1))}
                      className="w-9 h-9 flex items-center justify-center rounded-full text-gray-700 hover:brightness-95 cursor-pointer text-lg leading-none flex-shrink-0"
            style={{ backgroundColor: 'rgb(220, 217, 228)' }}
                    >
                      −
                    </button>
                    <input
                      id="ve-careworkers"
                      type="number"
                      min={1}
                      value={careworkers}
                      onChange={(e) => setCareworkers(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-2.5 text-sm text-center focus:outline-none focus:border-[rgb(154,38,214)]"
                    />
                    <button
                      type="button"
                      onClick={() => setCareworkers(careworkers + 1)}
                      className="w-9 h-9 flex items-center justify-center rounded-full text-gray-700 hover:brightness-95 cursor-pointer text-lg leading-none flex-shrink-0"
            style={{ backgroundColor: 'rgb(220, 217, 228)' }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Cadence */}
                <div>
                  <FormLabel required>Cadence</FormLabel>
                  <div className="flex gap-5 flex-wrap">
                    {(['Daily', 'Weekly', 'BiWeekly', 'Custom'] as const).map((c) => (
                      <label key={c} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="ve-cadence"
                          value={c}
                          checked={cadence === c}
                          onChange={() => setCadence(c)}
                          className="accent-[rgb(154,38,214)]"
                        />
                        {c === 'BiWeekly' ? 'Bi-weekly' : c}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Day selection per week */}
                <div>
                  <FormLabel required>On these days</FormLabel>
                  <div className="space-y-4">
                    {weeks.map((week, wi) => (
                      <div key={wi}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-700">Week {wi + 1}</span>
                          {week.currentWeek && (
                            <span className="text-sm text-gray-500">(Current week)</span>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          {DAYS_LABELS.map((day, di) => (
                            <DayToggle
                              key={`w${wi}-d${di}`}
                              label={day}
                              active={week.activeDays.has(di)}
                              onClick={() => toggleDay(wi, di)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* ── Charge details ────────────────────────────────────────── */}
            <div>
              <SectionHeading>Charge details</SectionHeading>
              <div className="space-y-4">

                <div>
                  <FormLabel required>Funder</FormLabel>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="ve-funder"
                      checked
                      readOnly
                      className="accent-[rgb(154,38,214)]"
                    />
                    {data.funder}
                  </label>
                </div>

                <div>
                  <FormLabel htmlFor="ve-charge-rate" required>Charge rate sheet</FormLabel>
                  <StyledSelect id="ve-charge-rate" value={chargeRateSheet} onChange={setChargeRateSheet}>
                    {['North Northumberland', 'North Tyneside', 'South Tyneside', 'Gateshead'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </StyledSelect>
                </div>

                <div>
                  <FormLabel>Deposit</FormLabel>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={depositPaid}
                      onChange={(e) => setDepositPaid(e.target.checked)}
                      className="rounded border-gray-300 accent-[rgb(154,38,214)]"
                    />
                    Paid
                  </label>
                </div>

              </div>
            </div>

            {/* ── Pay details ───────────────────────────────────────────── */}
            <div className="pb-4">
              <SectionHeading>Pay details</SectionHeading>
              <div className="space-y-4">

                <div>
                  <FormLabel htmlFor="ve-pay-rate">Pay rate sheet</FormLabel>
                  <StyledSelect id="ve-pay-rate" value={payRateSheet} onChange={setPayRateSheet}>
                    <option value="">Select</option>
                    {['Standard', 'North Northumberland', 'North Tyneside'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </StyledSelect>
                  <p className="text-sm text-gray-500 mt-1.5">
                    This will override the rate sheet set on the employee.
                  </p>
                </div>

              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 flex items-center justify-between bg-white px-8 py-4 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2.5 rounded-full text-gray-700 font-semibold text-sm cursor-pointer hover:brightness-95 transition-all"
            style={{ backgroundColor: 'rgb(237, 236, 241)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="visit-edit-form"
            className="bg-[rgb(154,38,214)] hover:bg-[rgb(134,28,194)] text-white px-8 py-2.5 rounded-full text-sm font-semibold cursor-pointer transition-colors"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
