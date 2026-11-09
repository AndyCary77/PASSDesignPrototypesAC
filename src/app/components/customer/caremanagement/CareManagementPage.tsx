import { OutcomesTab } from './OutcomesTab';
import { TasksTab } from './TasksTab';
import { VisitsTab } from './VisitsTab';
import { CareGroupsTab } from './CareGroupsTab';
import { useCareManagement } from './CareManagementContext';
import { ReasonableAdjustmentsCarePlanNote } from '../ReasonableAdjustmentsCarePlanNote';

export function CareManagementPage() {
  const { activeTab } = useCareManagement();

  return (
    <div className="max-w-5xl mx-auto">
      {/* Where the care plan is written and drafted, so it says up front that the customer has a Reasonable Adjustment Flag. */}
      {activeTab !== 'caregroups' && <ReasonableAdjustmentsCarePlanNote />}
      {activeTab === 'outcomes'   && <OutcomesTab />}
      {activeTab === 'tasks'      && <TasksTab />}
      {activeTab === 'visits'     && <VisitsTab />}
      {activeTab === 'caregroups' && <CareGroupsTab />}
    </div>
  );
}
