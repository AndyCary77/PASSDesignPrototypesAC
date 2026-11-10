import { OutcomesTab } from './OutcomesTab';
import { TasksTab } from './TasksTab';
import { VisitsTab } from './VisitsTab';
import { CareGroupsTab } from './CareGroupsTab';
import { useCareManagement } from './CareManagementContext';
import { ReasonableAdjustmentsCarePlanNote } from '../ReasonableAdjustmentsCarePlanNote';
import { SHOW_CARE_PLAN_RA_NOTE } from '../../../data/reasonableAdjustments';

export function CareManagementPage() {
  const { activeTab } = useCareManagement();

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hidden (SHOW_CARE_PLAN_RA_NOTE): the PO felt it duplicated the header badge. */}
      {SHOW_CARE_PLAN_RA_NOTE && activeTab !== 'caregroups' && <ReasonableAdjustmentsCarePlanNote />}
      {activeTab === 'outcomes'   && <OutcomesTab />}
      {activeTab === 'tasks'      && <TasksTab />}
      {activeTab === 'visits'     && <VisitsTab />}
      {activeTab === 'caregroups' && <CareGroupsTab />}
    </div>
  );
}
