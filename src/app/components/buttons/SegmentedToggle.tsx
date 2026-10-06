/**
 * A segmented pill for a binary state that's a real labelled choice rather
 * than a plain on/off flag (Active vs. Inactive, Yes vs. No) — mirrors the
 * legacy app's own switch-toggle for these fields, reused across pages
 * rather than introducing a second toggle idiom.
 */
export function SegmentedToggle({
  value,
  onChange,
  onLabel,
  offLabel,
  onColor = 'bg-green-600',
  offColor = 'bg-amber-500',
  offFirst = false,
  variant = 'pill',
  disabled = false,
  ariaLabel,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  onLabel: string;
  offLabel: string;
  onColor?: string;
  offColor?: string;
  /** Put the "off" option on the left (No | Yes) rather than the "on" option (Active | Inactive). */
  offFirst?: boolean;
  /**
   * `pill`: outlined pill, the "on" side coloured (Active | Inactive).
   * `track`: grey track with a raised selected segment — green when "on",
   * white when "off" (No | Yes in the Roster Settings edit forms).
   */
  variant?: 'pill' | 'track';
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const track = variant === 'track';
  const base = track
    ? `rounded-md px-5 py-1.5 text-sm font-semibold transition-colors ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`
    : `px-4 py-1.5 text-sm font-medium transition-colors ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`;
  const unselected = track ? 'text-gray-600 hover:text-gray-900' : 'text-gray-500 hover:bg-gray-50';
  // rgb(28, 135, 28): white text on it clears 4.5:1 contrast.
  const selectedOn = track ? 'bg-[rgb(28,135,28)] text-white' : `${onColor} text-white`;
  const selectedOff = track ? 'bg-white text-gray-900 shadow-sm' : `${offColor} text-white`;
  const on = (
    <button
      key="on"
      type="button"
      disabled={disabled}
      aria-pressed={value}
      onClick={() => onChange(true)}
      className={`${base} ${value ? selectedOn : unselected}`}
    >
      {onLabel}
    </button>
  );
  const off = (
    <button
      key="off"
      type="button"
      disabled={disabled}
      aria-pressed={!value}
      onClick={() => onChange(false)}
      className={`${base} ${!value ? selectedOff : unselected}`}
    >
      {offLabel}
    </button>
  );
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex ${
        track ? 'gap-1 rounded-lg bg-[#EDECF1] p-1' : 'rounded-full border border-gray-200 overflow-hidden'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      {offFirst ? [off, on] : [on, off]}
    </div>
  );
}
