import React, { createContext, useContext, useMemo } from 'react';

const WorkspaceSyncContext = createContext<{ bumpSync: () => void }>({
  bumpSync: () => {},
});

export const WorkspaceSyncProvider: React.FC<{
  bumpSync: () => void;
  children: React.ReactNode;
}> = ({ bumpSync, children }) => {
  const value = useMemo(() => ({ bumpSync }), [bumpSync]);
  return <WorkspaceSyncContext.Provider value={value}>{children}</WorkspaceSyncContext.Provider>;
};

export function useWorkspaceSyncBump(): () => void {
  return useContext(WorkspaceSyncContext).bumpSync;
}
