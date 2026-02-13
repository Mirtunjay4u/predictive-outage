import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface DashboardUiContextValue {
  boardroomMode: boolean;
  setBoardroomMode: (value: boolean) => void;
  toggleBoardroomMode: () => void;
}

const DashboardUiContext = createContext<DashboardUiContextValue | undefined>(undefined);

const BOARDROOM_KEY = 'dashboard:boardroom_mode';

export function DashboardUiProvider({ children }: { children: ReactNode }) {
  const [boardroomMode, setBoardroomMode] = useState<boolean>(() => {
    return localStorage.getItem(BOARDROOM_KEY) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(BOARDROOM_KEY, String(boardroomMode));
  }, [boardroomMode]);

  const value = useMemo(
    () => ({
      boardroomMode,
      setBoardroomMode,
      toggleBoardroomMode: () => setBoardroomMode((prev) => !prev),
    }),
    [boardroomMode],
  );

  return <DashboardUiContext.Provider value={value}>{children}</DashboardUiContext.Provider>;
}

export function useDashboardUi() {
  const context = useContext(DashboardUiContext);
  if (!context) {
    throw new Error('useDashboardUi must be used within DashboardUiProvider');
  }
  return context;
}
