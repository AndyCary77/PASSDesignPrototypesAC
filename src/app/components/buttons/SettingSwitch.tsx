/**
 * A real on/off switch rather than a checkbox or a labelled Button — this is
 * a setting being flipped, not an action being taken, and it matches the
 * NavModeToggle already used for the nav switch. Deliberately a raw
 * <button>: the shared Button component is a pill with a text label, which
 * can't render a track-and-knob control.
 */
export function SettingSwitch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-[rgb(154,38,214)]' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
