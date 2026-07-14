import { Info } from 'lucide-react';

export function CareGroupsTab() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-[rgb(154,38,214)]">
        This is a read only list of care groups linked to visits in this care plan. Care groups can be configured in the Visits tab.
      </p>
      <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span>This care plan has no care groups associated with it. Add care groups to visits in the Visits tab.</span>
        </div>
      </div>
    </div>
  );
}
