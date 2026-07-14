import { OutcomesTab } from './OutcomesTab';
import { TasksTab } from './TasksTab';
import { VisitsTab } from './VisitsTab';
import { CareGroupsTab } from './CareGroupsTab';
import { useCareManagement } from './CareManagementContext';

export function CareManagementPage() {
  const { activeTab } = useCareManagement();

  return (
    <div className="min-h-screen">
      {activeTab === 'outcomes'   && <OutcomesTab />}
      {activeTab === 'tasks'      && <TasksTab />}
      {activeTab === 'visits'     && <VisitsTab />}
      {activeTab === 'caregroups' && <CareGroupsTab />}
    </div>
  );
}
