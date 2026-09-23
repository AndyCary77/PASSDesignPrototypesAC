import { useFontWeightMode } from '../../data/FontWeightContext';

/**
 * Fixed, floating, always-on-screen — same "review tool, not a real
 * product setting" treatment as LoginPage's own two-segment pill toggles
 * (`LayoutToggle`/`PromoSourceToggle`), rather than NavModeToggle's more
 * elaborate track+thumb+tooltip switch, which is built for a genuine
 * permanent product feature. This is a temporary comparison aid for the
 * "should everything be bolder" question, so it's deliberately simpler and
 * lives in its own corner (bottom-left) rather than inside either nav
 * shell's own bar — that would mean building/maintaining two placements
 * (legacy dark bar vs. new light bar) for what's meant to be a quick,
 * throwaway-once-decided comparison tool.
 */
export function FontWeightToggle() {
  const { mode, toggle } = useFontWeightMode();

  return (
    <div className="fixed bottom-4 left-4 z-50 inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => mode !== 'default' && toggle()}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
          mode === 'default' ? 'bg-[rgb(154,38,214)] text-white' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Default
      </button>
      <button
        type="button"
        onClick={() => mode !== 'bold' && toggle()}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
          mode === 'bold' ? 'bg-[rgb(154,38,214)] text-white' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Bolder
      </button>
    </div>
  );
}
