import { createContext, useCallback, useContext, useState } from 'react';

type Tab = 'outcomes' | 'tasks' | 'visits' | 'caregroups';

interface CareManagementContextType {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  backFn: { fn: () => void } | null;
  registerBack: (fn: () => void) => void;
  clearBack: () => void;
}

const CareManagementContext = createContext<CareManagementContextType>({
  activeTab: 'outcomes',
  setActiveTab: () => {},
  backFn: null,
  registerBack: () => {},
  clearBack: () => {},
});

export function CareManagementProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<Tab>('outcomes');
  const [backFn, setBackFn] = useState<{ fn: () => void } | null>(null);

  const registerBack = useCallback((fn: () => void) => setBackFn({ fn }), []);
  const clearBack = useCallback(() => setBackFn(null), []);

  return (
    <CareManagementContext.Provider value={{ activeTab, setActiveTab, backFn, registerBack, clearBack }}>
      {children}
    </CareManagementContext.Provider>
  );
}

export function useCareManagement() {
  return useContext(CareManagementContext);
}
