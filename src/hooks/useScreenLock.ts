import { useState, useEffect, useCallback } from 'react';

const SCREEN_LOCK_ENABLED_KEY = 'screen_lock_enabled';
const SCREEN_LOCK_PASSCODE_KEY = 'screen_lock_passcode';
const SCREEN_LOCK_BIOMETRIC_KEY = 'screen_lock_biometric';
const SCREEN_LOCK_TIMEOUT_KEY = 'screen_lock_timeout';
const SCREEN_LOCK_LAST_ACTIVITY_KEY = 'screen_lock_last_activity';
const SCREEN_LOCK_HIDE_DATA_KEY = 'screen_lock_hide_data';
const SCREEN_LOCK_PAUSED_KEY = 'screen_lock_paused';

export type LockTimeout = 'immediately' | '1min' | '5min' | '15min' | '30min' | 'never';

const TIMEOUT_MS: Record<LockTimeout, number> = {
  immediately: 0,
  '1min': 60 * 1000,
  '5min': 5 * 60 * 1000,
  '15min': 15 * 60 * 1000,
  '30min': 30 * 60 * 1000,
  'never': Infinity,
};

// Simple hash for passcode storage
const hashPasscode = (passcode: string): string => {
  let hash = 0;
  for (let i = 0; i < passcode.length; i++) {
    const char = passcode.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return btoa(String(hash));
};

export const useScreenLock = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [lockTimeout, setLockTimeoutState] = useState<LockTimeout>('immediately');
  const [isHideDataEnabled, setIsHideDataEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const enabled = localStorage.getItem(SCREEN_LOCK_ENABLED_KEY) === 'true';
    const biometric = localStorage.getItem(SCREEN_LOCK_BIOMETRIC_KEY) === 'true';
    const timeout = (localStorage.getItem(SCREEN_LOCK_TIMEOUT_KEY) as LockTimeout) || 'immediately';
    const hideData = localStorage.getItem(SCREEN_LOCK_HIDE_DATA_KEY) !== 'false';
    const paused = localStorage.getItem(SCREEN_LOCK_PAUSED_KEY) === 'true';
    
    setIsEnabled(enabled);
    setIsBiometricEnabled(biometric);
    setLockTimeoutState(timeout);
    setIsHideDataEnabled(hideData);
    setIsPaused(paused);

    // Check if should be locked on app start
    if (enabled) {
      const lastActivity = parseInt(localStorage.getItem(SCREEN_LOCK_LAST_ACTIVITY_KEY) || '0');
      const timeoutMs = TIMEOUT_MS[timeout];
      
      if (timeoutMs !== Infinity && Date.now() - lastActivity > timeoutMs) {
        setIsLocked(true);
      }
    }
  }, []);

  // Track activity for timeout
  useEffect(() => {
    if (!isEnabled || lockTimeout === 'never') return;

    const updateActivity = () => {
      localStorage.setItem(SCREEN_LOCK_LAST_ACTIVITY_KEY, String(Date.now()));
    };

    // Update on user interaction
    window.addEventListener('click', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    // Initial update
    updateActivity();

    return () => {
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, [isEnabled, lockTimeout]);

  // Check for lock on visibility change
  useEffect(() => {
    if (!isEnabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Leaving the app: lock immediately if configured
        if (lockTimeout === 'immediately') {
          setIsLocked(true);
        }
        return;
      }

      if (document.visibilityState === 'visible') {
        const lastActivity = parseInt(localStorage.getItem(SCREEN_LOCK_LAST_ACTIVITY_KEY) || '0');
        const timeoutMs = TIMEOUT_MS[lockTimeout];
        
        if (timeoutMs !== Infinity && Date.now() - lastActivity > timeoutMs) {
          setIsLocked(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isEnabled, lockTimeout]);

  // Extra reliability on mobile/PWA: lock on pagehide for "immediately"
  // Note: we intentionally do NOT lock on 'blur' because SPA route changes
  // (e.g. navigating to /wallet or /account) fire blur events and would
  // incorrectly lock the app during internal navigation.
  useEffect(() => {
    if (!isEnabled) return;

    const handlePageHide = () => {
      if (lockTimeout === 'immediately') setIsLocked(true);
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [isEnabled, lockTimeout]);

  const enableScreenLock = useCallback((passcode: string) => {
    const hashedPasscode = hashPasscode(passcode);
    localStorage.setItem(SCREEN_LOCK_PASSCODE_KEY, hashedPasscode);
    localStorage.setItem(SCREEN_LOCK_ENABLED_KEY, 'true');
    localStorage.setItem(SCREEN_LOCK_LAST_ACTIVITY_KEY, String(Date.now()));
    localStorage.removeItem(SCREEN_LOCK_PAUSED_KEY);
    setIsEnabled(true);
    setIsPaused(false);
  }, []);

  const disableScreenLock = useCallback(() => {
    localStorage.removeItem(SCREEN_LOCK_PASSCODE_KEY);
    localStorage.removeItem(SCREEN_LOCK_ENABLED_KEY);
    localStorage.removeItem(SCREEN_LOCK_BIOMETRIC_KEY);
    localStorage.removeItem(SCREEN_LOCK_TIMEOUT_KEY);
    localStorage.removeItem(SCREEN_LOCK_LAST_ACTIVITY_KEY);
    localStorage.removeItem(SCREEN_LOCK_HIDE_DATA_KEY);
    localStorage.removeItem(SCREEN_LOCK_PAUSED_KEY);
    setIsEnabled(false);
    setIsBiometricEnabled(false);
    setIsLocked(false);
    setIsHideDataEnabled(false);
    setIsPaused(false);
  }, []);

  const pauseScreenLock = useCallback(() => {
    localStorage.setItem(SCREEN_LOCK_ENABLED_KEY, 'false');
    localStorage.setItem(SCREEN_LOCK_PAUSED_KEY, 'true');
    setIsEnabled(false);
    setIsPaused(true);
    setIsLocked(false);
  }, []);

  const resumeScreenLock = useCallback(() => {
    localStorage.setItem(SCREEN_LOCK_ENABLED_KEY, 'true');
    localStorage.removeItem(SCREEN_LOCK_PAUSED_KEY);
    localStorage.setItem(SCREEN_LOCK_LAST_ACTIVITY_KEY, String(Date.now()));
    setIsEnabled(true);
    setIsPaused(false);
  }, []);

  const verifyPasscode = useCallback((passcode: string): boolean => {
    const storedHash = localStorage.getItem(SCREEN_LOCK_PASSCODE_KEY);
    const inputHash = hashPasscode(passcode);
    return storedHash === inputHash;
  }, []);

  const changePasscode = useCallback((oldPasscode: string, newPasscode: string): boolean => {
    if (!verifyPasscode(oldPasscode)) return false;
    
    const hashedPasscode = hashPasscode(newPasscode);
    localStorage.setItem(SCREEN_LOCK_PASSCODE_KEY, hashedPasscode);
    return true;
  }, [verifyPasscode]);

  const unlock = useCallback((passcode: string): boolean => {
    if (verifyPasscode(passcode)) {
      setIsLocked(false);
      localStorage.setItem(SCREEN_LOCK_LAST_ACTIVITY_KEY, String(Date.now()));
      return true;
    }
    return false;
  }, [verifyPasscode]);

  const unlockWithBiometric = useCallback(() => {
    if (isBiometricEnabled) {
      setIsLocked(false);
      localStorage.setItem(SCREEN_LOCK_LAST_ACTIVITY_KEY, String(Date.now()));
      return true;
    }
    return false;
  }, [isBiometricEnabled]);

  const lock = useCallback(() => {
    if (isEnabled) {
      setIsLocked(true);
    }
  }, [isEnabled]);

  const setBiometricEnabled = useCallback((enabled: boolean) => {
    localStorage.setItem(SCREEN_LOCK_BIOMETRIC_KEY, String(enabled));
    setIsBiometricEnabled(enabled);
  }, []);

  const setLockTimeout = useCallback((timeout: LockTimeout) => {
    localStorage.setItem(SCREEN_LOCK_TIMEOUT_KEY, timeout);
    setLockTimeoutState(timeout);
  }, []);

  const setHideDataEnabled = useCallback((enabled: boolean) => {
    localStorage.setItem(SCREEN_LOCK_HIDE_DATA_KEY, String(enabled));
    setIsHideDataEnabled(enabled);
  }, []);

  return {
    isEnabled,
    isLocked,
    isBiometricEnabled,
    lockTimeout,
    isHideDataEnabled,
    isPaused,
    enableScreenLock,
    disableScreenLock,
    pauseScreenLock,
    resumeScreenLock,
    verifyPasscode,
    changePasscode,
    unlock,
    unlockWithBiometric,
    lock,
    setBiometricEnabled,
    setLockTimeout,
    setHideDataEnabled,
  };
};
