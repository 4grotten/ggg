import React, { createContext, useContext } from "react";
import { useScreenLock, type LockTimeout } from "@/hooks/useScreenLock";

type ScreenLockContextValue = ReturnType<typeof useScreenLock>;

const ScreenLockContext = createContext<ScreenLockContextValue | null>(null);

export const ScreenLockProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useScreenLock();
  // Do NOT memoize – callbacks are stable via useCallback inside the hook
  return <ScreenLockContext.Provider value={value}>{children}</ScreenLockContext.Provider>;
};

export const useScreenLockContext = () => {
  const ctx = useContext(ScreenLockContext);
  if (!ctx) throw new Error("useScreenLockContext must be used within ScreenLockProvider");
  return ctx;
};
