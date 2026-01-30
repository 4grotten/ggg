import { useState, useEffect, useCallback, useMemo, useRef, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, LockOpen, Fingerprint, Clock, ChevronRight, Check, AlertCircle, Shield, X, EyeOff, Pause, Trash2 } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { AnimatedDrawerItem, AnimatedDrawerContainer } from '@/components/ui/animated-drawer-item';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useScreenLockContext } from '@/contexts/ScreenLockContext';
import type { LockTimeout } from '@/hooks/useScreenLock';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PasscodeLockAnimation } from './PasscodeLockAnimation';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ScreenLockDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type SetupStep = 'main' | 'create-passcode' | 'verify-passcode' | 'timeout-select';
type DisableAction = 'pause' | 'delete' | null;

const PASSCODE_LENGTH = 4;

const TIMEOUT_OPTIONS: { value: LockTimeout; labelKey: string }[] = [
  { value: 'immediately', labelKey: 'screenLock.timeout.immediately' },
  { value: '1min', labelKey: 'screenLock.timeout.1min' },
  { value: '5min', labelKey: 'screenLock.timeout.5min' },
  { value: '15min', labelKey: 'screenLock.timeout.15min' },
  { value: '30min', labelKey: 'screenLock.timeout.30min' },
  { value: 'never', labelKey: 'screenLock.timeout.never' },
];

export const ScreenLockDrawer = ({ isOpen, onOpenChange }: ScreenLockDrawerProps) => {
  const { t } = useTranslation();
  const { 
    isAvailable: isBiometricAvailable, 
    getBiometricLabel, 
    registerBiometric 
  } = useBiometricAuth();
  const {
    isEnabled,
    isBiometricEnabled,
    lockTimeout,
    isHideDataEnabled,
    enableScreenLock,
    disableScreenLock,
    verifyPasscode,
    setBiometricEnabled,
    setLockTimeout,
    setHideDataEnabled,
  } = useScreenLockContext();

  const [step, setStep] = useState<SetupStep>('main');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [error, setError] = useState('');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [shake, setShake] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [pendingDisableAction, setPendingDisableAction] = useState<DisableAction>(null);
  
  // Track which phase of passcode entry we're in (1 = first entry, 2 = confirm)
  const [entryPhase, setEntryPhase] = useState<1 | 2>(1);
  
  // Single input ref - never destroyed
  const inputRef = useRef<HTMLInputElement>(null);

  // Force focus on the input
  const focusInput = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    
    // iOS Safari is picky: focus should happen as close to the user gesture as possible.
    // Still keep a rAF to wait for layout/animation.
    requestAnimationFrame(() => {
      input.focus();
      input.click();
    });
  }, []);

  // Detect keyboard open/close via viewport resize (mobile)
  useEffect(() => {
    if (typeof visualViewport === 'undefined') return;
    
    const initialHeight = window.innerHeight;
    
    const handleResize = () => {
      const currentHeight = visualViewport?.height ?? window.innerHeight;
      setIsKeyboardOpen(currentHeight < initialHeight * 0.75);
    };

    visualViewport?.addEventListener('resize', handleResize);
    return () => visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  // Reset state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setStep('main');
      setPasscode('');
      setConfirmPasscode('');
      setError('');
      setEntryPhase(1);
      setShake(false);
      setShowDisableDialog(false);
      setPendingDisableAction(null);
    }
  }, [isOpen]);

  // Focus input when entering passcode step
  // NOTE: focusing in an effect is often blocked on iOS (not a user gesture).
  // We keep a best-effort attempt, but primary focus happens in the click handler.
  useEffect(() => {
    if (step !== 'create-passcode' && step !== 'verify-passcode') return;
    const t = window.setTimeout(() => focusInput(), 250);
    return () => window.clearTimeout(t);
  }, [step, focusInput]);

  // Auto-advance to confirm phase when first passcode is complete
  useEffect(() => {
    if (step === 'create-passcode' && entryPhase === 1 && passcode.length === PASSCODE_LENGTH) {
      setTimeout(() => {
        setEntryPhase(2);
        setConfirmPasscode('');
        setError('');
        // Keep focus on same input
        focusInput();
      }, 300);
    }
  }, [step, entryPhase, passcode, focusInput]);

  // Auto-submit when confirm passcode is complete
  useEffect(() => {
    if (step === 'create-passcode' && entryPhase === 2 && confirmPasscode.length === PASSCODE_LENGTH) {
      if (confirmPasscode === passcode) {
        enableScreenLock(passcode);
        toast.success(t('screenLock.enabled', 'Screen lock enabled'));
        setStep('main');
        setPasscode('');
        setConfirmPasscode('');
        setEntryPhase(1);
      } else {
        setError(t('screenLock.passcodesNoMatch', "Passcodes don't match"));
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setConfirmPasscode('');
          focusInput();
        }, 400);
      }
    }
  }, [step, entryPhase, confirmPasscode, passcode, enableScreenLock, t, focusInput]);

  // Auto-submit verify passcode
  useEffect(() => {
    if (step === 'verify-passcode' && passcode.length === PASSCODE_LENGTH) {
      if (verifyPasscode(passcode)) {
        if (pendingDisableAction === 'pause') {
          // Just disable but keep the passcode stored (conceptually "paused")
          // For simplicity, we toggle off but user can re-enable without re-entering
          localStorage.setItem('screen_lock_paused', 'true');
          localStorage.setItem('screen_lock_enabled', 'false');
          toast.success(t('screenLock.paused', 'Screen lock paused'));
        } else {
          // Full delete - remove everything
          disableScreenLock();
          localStorage.removeItem('screen_lock_paused');
          toast.success(t('screenLock.deleted', 'Screen lock removed'));
        }
        setStep('main');
        setPasscode('');
        setPendingDisableAction(null);
      } else {
        setError(t('screenLock.wrongPasscode', 'Wrong passcode'));
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setPasscode('');
          focusInput();
        }, 400);
      }
    }
  }, [step, passcode, verifyPasscode, disableScreenLock, t, focusInput, pendingDisableAction]);

  const handleEnableToggle = useCallback((checked: boolean) => {
    if (checked) {
      setStep('create-passcode');
      setEntryPhase(1);
      setPasscode('');
      setConfirmPasscode('');
      // Focus immediately from the user gesture to open the keyboard on iOS.
      focusInput();
    } else {
      // Show dialog to choose pause or delete
      setShowDisableDialog(true);
    }
  }, [focusInput]);

  const handleDisableChoice = useCallback((action: 'pause' | 'delete') => {
    setShowDisableDialog(false);
    setPendingDisableAction(action);
    setStep('verify-passcode');
    setPasscode('');
    setTimeout(() => focusInput(), 100);
  }, [focusInput]);

  const handleBiometricToggle = useCallback(async (checked: boolean) => {
    if (checked) {
      try {
        const success = await registerBiometric('screen-lock');
        if (success) {
          setBiometricEnabled(true);
          toast.success(t('screenLock.biometricEnabled', '{{method}} enabled', { method: getBiometricLabel() }));
        } else {
          toast.error(t('screenLock.biometricFailed', 'Failed to enable {{method}}', { method: getBiometricLabel() }));
        }
      } catch (err) {
        toast.error(t('screenLock.biometricFailed', 'Failed to enable {{method}}', { method: getBiometricLabel() }));
      }
    } else {
      setBiometricEnabled(false);
      toast.success(t('screenLock.biometricDisabled', '{{method}} disabled', { method: getBiometricLabel() }));
    }
  }, [registerBiometric, setBiometricEnabled, getBiometricLabel, t]);

  const biometricRow = useMemo(() => {
    if (!isEnabled) return null;

    const unavailable = !isBiometricAvailable;
    return (
      <AnimatedDrawerItem index={1}>
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{getBiometricLabel()}</p>
              <p className="text-sm text-muted-foreground">
                {unavailable
                  ? t('screenLock.biometricUnavailable', 'Not available on this device')
                  : t('screenLock.biometricDesc', 'Quick unlock with biometrics')}
              </p>
            </div>
          </div>
          <Switch
            checked={isBiometricEnabled}
            onCheckedChange={handleBiometricToggle}
            disabled={unavailable}
          />
        </div>
      </AnimatedDrawerItem>
    );
  }, [
    getBiometricLabel,
    handleBiometricToggle,
    isBiometricAvailable,
    isBiometricEnabled,
    isEnabled,
    t,
  ]);

  const handleTimeoutSelect = useCallback((timeout: LockTimeout) => {
    setLockTimeout(timeout);
    setStep('main');
    toast.success(t('screenLock.timeoutUpdated', 'Lock timeout updated'));
  }, [setLockTimeout, t]);

  const getTimeoutLabel = (timeout: LockTimeout): string => {
    const option = TIMEOUT_OPTIONS.find(o => o.value === timeout);
    if (!option) return timeout;
    return t(option.labelKey, timeout);
  };

  // Get current value based on step/phase
  const getCurrentValue = () => {
    if (step === 'create-passcode') {
      return entryPhase === 1 ? passcode : confirmPasscode;
    }
    return passcode;
  };

  // Handle input change
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value.replace(/\D/g, '').slice(0, PASSCODE_LENGTH);
    setError('');
    
    if (step === 'create-passcode') {
      if (entryPhase === 1) {
        setPasscode(next);
      } else {
        setConfirmPasscode(next);
      }
    } else {
      setPasscode(next);
    }
  };

  // Handle keydown for backspace between phases
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && step === 'create-passcode' && entryPhase === 2 && confirmPasscode.length === 0) {
      // Go back to phase 1 and delete last character from first passcode
      e.preventDefault();
      setEntryPhase(1);
      setPasscode(prev => prev.slice(0, -1));
    }
  };

  // Generate dot states for current value
  const getDotStates = () => {
    const value = getCurrentValue();
    const compareTo = step === 'create-passcode' && entryPhase === 2 ? passcode : undefined;
    
    return Array.from({ length: PASSCODE_LENGTH }).map((_, i) => {
      const hasDigit = i < value.length;
      if (!hasDigit) return 'empty' as const;
      if (!compareTo) return 'filled' as const;
      return value[i] === compareTo[i] ? 'match' as const : 'mismatch' as const;
    });
  };

  const renderMainContent = () => (
    <div className="space-y-5">
      <AnimatedDrawerContainer className="space-y-3">
        <AnimatedDrawerItem index={0}>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {isEnabled ? (
                  <Lock className="w-5 h-5 text-primary" />
                ) : (
                  <LockOpen className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {t('screenLock.passcode', 'Passcode Lock')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isEnabled 
                    ? t('screenLock.enabledDesc', '4-digit passcode is set')
                    : t('screenLock.disabledDesc', 'Protect your app with a passcode')
                  }
                </p>
              </div>
            </div>
            <Switch 
              checked={isEnabled} 
              onCheckedChange={handleEnableToggle}
            />
          </div>
        </AnimatedDrawerItem>

        {isEnabled && (
          <>
            {biometricRow}

            <AnimatedDrawerItem index={2}>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
                    <EyeOff className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {t('screenLock.hideData', 'Hide Sensitive Data')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('screenLock.hideDataDesc', 'Hide balances and card numbers')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isHideDataEnabled}
                  onCheckedChange={(checked) => {
                    setHideDataEnabled(checked);
                    toast.success(checked 
                      ? t('screenLock.hideDataEnabled', 'Data hidden') 
                      : t('screenLock.hideDataDisabled', 'Data visible')
                    );
                  }}
                />
              </div>
            </AnimatedDrawerItem>

            <AnimatedDrawerItem index={3}>
              <button
                onClick={() => setStep('timeout-select')}
                className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">
                      {t('screenLock.autoLock', 'Auto-lock')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('screenLock.autoLockDesc', 'Lock after inactivity')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-primary font-medium">
                    {getTimeoutLabel(lockTimeout)}
                  </span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </button>
            </AnimatedDrawerItem>
          </>
        )}
      </AnimatedDrawerContainer>

      <AnimatedDrawerContainer>
        <AnimatedDrawerItem index={4}>
          <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl">
            <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              {t('screenLock.securityNote', 'Screen lock adds an extra layer of security to protect your sensitive data.')}
            </p>
          </div>
        </AnimatedDrawerItem>
      </AnimatedDrawerContainer>
    </div>
  );

  const renderPasscodeInput = () => {
    const isCreating = step === 'create-passcode';

    const getTitle = () => {
      if (step === 'verify-passcode') {
        return t('screenLock.enterPasscode', 'Enter Passcode');
      }
      return t('screenLock.createPasscode', 'Create Passcode');
    };

    const getDescription = () => {
      if (step === 'verify-passcode') {
        return t('screenLock.verifyDesc', 'Enter your current passcode to disable');
      }
      return t('screenLock.createDesc', 'Enter a {{length}}-digit passcode', { length: PASSCODE_LENGTH });
    };

    // Generate dot states for first passcode (always filled or empty)
    const getFirstPasscodeDots = () => {
      return Array.from({ length: PASSCODE_LENGTH }).map((_, i) => {
        return i < passcode.length ? 'filled' as const : 'empty' as const;
      });
    };

    // Generate dot states for confirm passcode with character-by-character comparison
    const getConfirmPasscodeDots = () => {
      return Array.from({ length: PASSCODE_LENGTH }).map((_, i) => {
        const hasDigit = i < confirmPasscode.length;
        if (!hasDigit) return 'empty' as const;
        return confirmPasscode[i] === passcode[i] ? 'match' as const : 'mismatch' as const;
      });
    };

    // Single input for verify mode
    const getVerifyDots = () => {
      return Array.from({ length: PASSCODE_LENGTH }).map((_, i) => {
        return i < passcode.length ? 'filled' as const : 'empty' as const;
      });
    };

    const renderDots = (states: ('empty' | 'filled' | 'match' | 'mismatch')[], shouldShake: boolean) => (
      <motion.div
        animate={shouldShake ? { x: [-8, 8, -8, 8, 0] } : undefined}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-center gap-4"
      >
        {states.map((state, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{
              scale: state === 'mismatch' ? [1, 1.2, 1] : 1,
              opacity: 1,
              backgroundColor:
                state === "empty"
                  ? "hsl(var(--muted))"
                  : state === "mismatch"
                  ? "hsl(var(--destructive))"
                  : state === "match"
                  ? "hsl(142 71% 45%)" // green for match
                  : "hsl(var(--primary))",
            }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30,
              scale: { duration: 0.2 }
            }}
            className="w-5 h-5 rounded-full"
          />
        ))}
      </motion.div>
    );

    return (
      <div 
        className={cn(
          "flex flex-col transition-all duration-300",
          isKeyboardOpen ? "justify-start pt-2" : "justify-end min-h-[50vh]"
        )}
      >
        {/* Invisible but clickable input overlay */}
        <div className="relative">
          <input
            ref={inputRef}
            value={getCurrentValue()}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setError('')}
            onClick={() => focusInput()}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            autoCapitalize="off"
            autoCorrect="off"
            enterKeyHint="done"
            className="absolute inset-0 z-10 w-full h-full opacity-0 caret-transparent select-none"
            style={{ caretColor: 'transparent', color: 'transparent' }}
            aria-label={t('screenLock.passcode', 'Passcode Lock')}
          />

          <div className="space-y-3">
            {/* Header with animated icon */}
            <div className="text-center">
              <PasscodeLockAnimation />
              
              {/* Step indicator for create flow */}
              {isCreating && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <motion.div 
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      entryPhase >= 1 ? "bg-primary" : "bg-muted"
                    )}
                    animate={{ scale: entryPhase === 1 ? 1.2 : 1 }}
                  />
                  <motion.div 
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      entryPhase >= 2 ? "bg-primary" : "bg-muted"
                    )}
                    animate={{ scale: entryPhase === 2 ? 1.2 : 1 }}
                  />
                </div>
              )}
            </div>

            {/* For verify mode - single row of dots */}
            {step === 'verify-passcode' && (
              <div className="py-2">
                {renderDots(getVerifyDots(), shake && step === 'verify-passcode')}
              </div>
            )}

            {/* For create mode - two rows of dots always visible */}
            {isCreating && (
              <div className="space-y-3">
                {/* First passcode row */}
                <div className={cn(
                  "p-3 rounded-xl transition-all",
                  entryPhase === 1 ? "bg-primary/5 ring-2 ring-primary/20" : "bg-muted/30"
                )}>
                  {renderDots(getFirstPasscodeDots(), false)}
                </div>

                {/* Confirm passcode row */}
                <div className={cn(
                  "p-3 rounded-xl transition-all",
                  entryPhase === 2 ? "bg-primary/5 ring-2 ring-primary/20" : "bg-muted/30",
                  shake && entryPhase === 2 && "ring-destructive/30"
                )}>
                  {renderDots(getConfirmPasscodeDots(), shake && entryPhase === 2)}
                </div>
              </div>
            )}

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-destructive text-sm text-center flex items-center justify-center gap-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  };

  const renderTimeoutSelect = () => (
    <div className="space-y-3">
      {TIMEOUT_OPTIONS.map((option, index) => (
        <AnimatedDrawerItem key={option.value} index={index}>
          <button
            onClick={() => handleTimeoutSelect(option.value)}
            className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
          >
            <span className="font-medium text-foreground">
              {t(option.labelKey, option.value)}
            </span>
            {lockTimeout === option.value && (
              <Check className="w-5 h-5 text-primary" />
            )}
          </button>
        </AnimatedDrawerItem>
      ))}
    </div>
  );

  return (
    <>
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="relative flex items-center justify-between py-4 px-4">
            <DrawerTitle className="flex items-center gap-2 text-base font-semibold">
              <Lock className="w-5 h-5 text-primary" />
              {step === 'timeout-select' 
                ? t('screenLock.autoLock', 'Auto-lock')
                : t('screenLock.title', 'Screen Lock')
              }
            </DrawerTitle>
            <DrawerClose className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <X className="w-3.5 h-3.5 text-primary" />
            </DrawerClose>
          </DrawerHeader>

          <div className="px-4 pb-8 overflow-y-auto">
            {step === 'main' && renderMainContent()}
            {(step === 'create-passcode' || step === 'verify-passcode') && renderPasscodeInput()}
            {step === 'timeout-select' && renderTimeoutSelect()}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Pause or Delete Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent className="w-[300px] rounded-2xl p-0 gap-0 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border-0 shadow-2xl">
          <div className="pt-5 pb-4 px-4 text-center">
            <AlertDialogTitle className="text-[17px] font-semibold text-foreground mb-1">
              {t('screenLock.disableTitle', 'Disable Screen Lock')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-muted-foreground leading-tight">
              {t('screenLock.disableDesc', 'Would you like to pause temporarily or remove completely?')}
            </AlertDialogDescription>
          </div>
          <div className="border-t border-[#C6C6C8] dark:border-[#38383A]">
            <button
              onClick={() => handleDisableChoice('pause')}
              className="w-full flex items-center justify-center gap-2 py-[11px] text-[17px] text-[#007AFF] font-normal border-b border-[#C6C6C8] dark:border-[#38383A] active:bg-black/5 dark:active:bg-white/5 transition-colors"
            >
              <Pause className="w-4 h-4" />
              {t('screenLock.pause', 'Pause temporarily')}
            </button>
            <button
              onClick={() => handleDisableChoice('delete')}
              className="w-full flex items-center justify-center gap-2 py-[11px] text-[17px] text-red-500 font-normal border-b border-[#C6C6C8] dark:border-[#38383A] active:bg-black/5 dark:active:bg-white/5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {t('screenLock.delete', 'Remove completely')}
            </button>
            <button
              onClick={() => setShowDisableDialog(false)}
              className="w-full py-[11px] text-[17px] text-[#007AFF] font-semibold active:bg-black/5 dark:active:bg-white/5 transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};