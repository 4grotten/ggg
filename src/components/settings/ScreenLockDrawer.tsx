import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, LockOpen, Fingerprint, Clock, ChevronRight, Check, AlertCircle, Shield } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { AnimatedDrawerItem, AnimatedDrawerContainer } from '@/components/ui/animated-drawer-item';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useScreenLockContext } from '@/contexts/ScreenLockContext';
import type { LockTimeout } from '@/hooks/useScreenLock';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ScreenLockDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type SetupStep = 'main' | 'create-passcode' | 'verify-passcode' | 'timeout-select';

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
    enableScreenLock,
    disableScreenLock,
    verifyPasscode,
    setBiometricEnabled,
    setLockTimeout,
  } = useScreenLockContext();

  const [step, setStep] = useState<SetupStep>('main');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [error, setError] = useState('');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [shake, setShake] = useState(false);
  
  // Track which phase of passcode entry we're in (1 = first entry, 2 = confirm)
  const [entryPhase, setEntryPhase] = useState<1 | 2>(1);
  
  // Single input ref - never destroyed
  const inputRef = useRef<HTMLInputElement>(null);

  // Force focus on the input
  const focusInput = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    
    // Use setTimeout to ensure we're in a user gesture context
    setTimeout(() => {
      input.focus();
      input.click();
    }, 50);
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
    }
  }, [isOpen]);

  // Focus input when entering passcode step
  useEffect(() => {
    if (step === 'create-passcode' || step === 'verify-passcode') {
      // Delay to allow drawer animation
      setTimeout(() => {
        focusInput();
      }, 200);
    }
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
        disableScreenLock();
        toast.success(t('screenLock.disabled', 'Screen lock disabled'));
        setStep('main');
        setPasscode('');
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
  }, [step, passcode, verifyPasscode, disableScreenLock, t, focusInput]);

  const handleEnableToggle = useCallback((checked: boolean) => {
    if (checked) {
      setStep('create-passcode');
      setEntryPhase(1);
      setPasscode('');
      setConfirmPasscode('');
    } else {
      setStep('verify-passcode');
      setPasscode('');
    }
  }, []);

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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="space-y-4">
      <AnimatedDrawerContainer>
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

        {biometricRow}

        {isEnabled && (
          <AnimatedDrawerItem index={2}>
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
        )}
      </AnimatedDrawerContainer>

      <AnimatedDrawerContainer>
        <AnimatedDrawerItem index={3}>
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
    const dotStates = getDotStates();

    const getTitle = () => {
      if (step === 'verify-passcode') {
        return t('screenLock.enterPasscode', 'Enter Passcode');
      }
      return entryPhase === 1 
        ? t('screenLock.createPasscode', 'Create Passcode')
        : t('screenLock.confirmPasscode', 'Confirm Passcode');
    };

    const getDescription = () => {
      if (step === 'verify-passcode') {
        return t('screenLock.verifyDesc', 'Enter your current passcode to disable');
      }
      return entryPhase === 1 
        ? t('screenLock.createDesc', 'Enter a {{length}}-digit passcode', { length: PASSCODE_LENGTH })
        : t('screenLock.confirmDesc', 'Re-enter your passcode');
    };

    return (
      <div 
        className={cn(
          "flex flex-col transition-all duration-300",
          isKeyboardOpen ? "justify-start pt-4" : "justify-end min-h-[50vh]"
        )}
      >
        {/* Hidden input - always mounted, never destroyed */}
        <input
          ref={inputRef}
          value={getCurrentValue()}
          onChange={handleInputChange}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          autoCapitalize="off"
          autoCorrect="off"
          enterKeyHint="done"
          className="sr-only"
        />

        <div className="space-y-6">
          {/* Header with step indicators */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
            >
              <Lock className="w-8 h-8 text-primary" />
            </motion.div>
            
            {/* Step indicator for create flow */}
            {isCreating && (
              <div className="flex items-center justify-center gap-2 mb-3">
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
            
            <AnimatePresence mode="wait">
              <motion.div
                key={`${step}-${entryPhase}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-semibold text-foreground">
                  {getTitle()}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {getDescription()}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Passcode dots - clickable to focus input */}
          <motion.button
            type="button"
            onClick={focusInput}
            animate={shake ? { x: [-8, 8, -8, 8, 0] } : undefined}
            transition={{ duration: 0.35 }}
            className="w-full flex items-center justify-center gap-4 py-4"
            aria-label="Passcode input"
          >
            <AnimatePresence mode="popLayout">
              {dotStates.map((state, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    backgroundColor:
                      state === "empty"
                        ? "hsl(var(--muted))"
                        : state === "mismatch"
                        ? "hsl(var(--destructive))"
                        : "hsl(var(--primary))",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="w-5 h-5 rounded-full"
                />
              ))}
            </AnimatePresence>
          </motion.button>

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

          {/* Cancel button */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep('main');
                setPasscode('');
                setConfirmPasscode('');
                setError('');
                setEntryPhase(1);
              }}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderTimeoutSelect = () => (
    <div className="space-y-4">
      <AnimatedDrawerContainer>
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
      </AnimatedDrawerContainer>
    </div>
  );

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            {step === 'timeout-select' 
              ? t('screenLock.autoLock', 'Auto-lock')
              : t('screenLock.title', 'Screen Lock')
            }
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-8 overflow-y-auto">
          {step === 'main' && renderMainContent()}
          {(step === 'create-passcode' || step === 'verify-passcode') && renderPasscodeInput()}
          {step === 'timeout-select' && renderTimeoutSelect()}
        </div>
      </DrawerContent>
    </Drawer>
  );
};