import React, { createContext, useContext, useMemo } from "react";
import { useScreenLock, type LockTimeout } from "@/hooks/useScreenLock";

type ScreenLockContextValue = ReturnType<typeof useScreenLock> & {
  lockTimeout: LockTimeout;
};

const ScreenLockContext = createContext<ScreenLockContextValue | null>(null);

export const ScreenLockProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useScreenLock();
  const memo = useMemo(() => value, [
    value.isEnabled,
    value.isLocked,
    value.isBiometricEnabled,
    value.lockTimeout,
  ]);

  return <ScreenLockContext.Provider value={memo}>{children}</ScreenLockContext.Provider>;
};

export const useScreenLockContext = () => {
  const ctx = useContext(ScreenLockContext);
  if (!ctx) throw new Error("useScreenLockContext must be used within ScreenLockProvider");
  return ctx;
};
