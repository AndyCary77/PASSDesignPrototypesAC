/**
 * SegmentedToggle for more than two choices (Open | Closed | All). Same grey track and
 * raised white selected segment as `SegmentedToggle variant="track" neutral`, so the two
 * sit side by side on a page without looking like different components.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  ariaLabel?: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="inline-flex gap-1 rounded-lg bg-[#EDECF1] p-1">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-5 py-1.5 text-body font-semibold transition-colors cursor-pointer ${
            value === o.value ? 'bg-white text-[rgb(154,38,214)] shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
