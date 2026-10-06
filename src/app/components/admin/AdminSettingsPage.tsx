import { useFeatureFlags, type FeatureFlag } from '../../data/FeatureFlagsContext';
import { SettingSwitch } from '../buttons/SettingSwitch';

interface FeatureToggle {
  flag: FeatureFlag;
  label: string;
  description: React.ReactNode;
  status?: string;
}

const FEATURE_TOGGLES: FeatureToggle[] = [
  {
    flag: 'canEditRosterSettings',
    label: 'Can change Roster settings',
    description: (
      <>
        Simulates the signed-in user's permission to change <strong>Roster Settings</strong> (Office → Roster Settings).
        Switch this off to see the read-only experience: the edit buttons are disabled and the settings can't be changed.
      </>
    ),
  },
  {
    flag: 'customerCareBridgeTab',
    label: 'Customer Assessment Hero tab',
    status: 'Deprecated',
    // Worded neutrally rather than "it's off because…" — the same sentence
    // has to read correctly with the switch in either position.
    description: (
      <>
        Shows the standalone Assessment Hero tab on a customer's profile. That tab is retired: Assessment Hero is now managed per
        section, with recordings under <strong>Documents → Assessment Hero</strong> linked to the assessment, document or
        care management content they draft, so each draft is reviewed where that content lives. Switch this on to
        review the old tab.
      </>
    ),
  },
];

/**
 * Admin → prototype settings. Somewhere to park switches for surfaces being
 * retired, so a deprecated flow can be pulled back up for review instead of
 * being deleted and re-argued from memory.
 */
export function AdminSettingsPage() {
  const { flags, setFlag } = useFeatureFlags();

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Admin</h1>
        <p className="text-sm text-gray-600 mt-1">
          Prototype settings. These are stored in this browser only — they don't affect anyone else.
        </p>
      </div>

      <div className="bg-white rounded-[10px] border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50">
          <h2 className="text-base font-semibold text-gray-900">Features</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {FEATURE_TOGGLES.map(({ flag, label, description, status }) => (
            <div key={flag} className="flex items-start justify-between gap-6 px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-semibold text-gray-900">{label}</span>
                  {status && (
                    <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-sm font-semibold text-amber-800">
                      {status}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{description}</p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 pt-0.5">
                <span className="text-sm font-medium text-gray-500 w-8 text-right">{flags[flag] ? 'On' : 'Off'}</span>
                <SettingSwitch checked={flags[flag]} onChange={value => setFlag(flag, value)} label={label} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
