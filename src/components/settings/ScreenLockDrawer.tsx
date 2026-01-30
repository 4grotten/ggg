import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { PasscodeMatchInput } from '@/components/settings/PasscodeMatchInput';

interface ScreenLockDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type SetupStep = 'main' | 'create-passcode' | 'confirm-passcode' | 'verify-passcode' | 'timeout-select';

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

  // Reset state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setStep('main');
      setPasscode('');
      setConfirmPasscode('');
      setError('');
    }
  }, [isOpen]);

  const handleEnableToggle = useCallback((checked: boolean) => {
    if (checked) {
      // Start setup flow
      setStep('create-passcode');
    } else {
      // Need to verify current passcode first
      setStep('verify-passcode');
    }
  }, []);

  const handlePasscodeSubmit = useCallback(() => {
    if (step === 'create-passcode') {
      if (passcode.length < PASSCODE_LENGTH) {
        setError(t('screenLock.passcodeTooShort', 'Passcode must be {{length}} digits', { length: PASSCODE_LENGTH }));
        return;
      }
      setStep('confirm-passcode');
      setConfirmPasscode('');
      setError('');
    } else if (step === 'confirm-passcode') {
      if (confirmPasscode !== passcode) {
        setError(t('screenLock.passcodesNoMatch', "Passcodes don't match"));
        setConfirmPasscode('');
        return;
      }
      enableScreenLock(passcode);
      toast.success(t('screenLock.enabled', 'Screen lock enabled'));
      setStep('main');
      setPasscode('');
      setConfirmPasscode('');
    } else if (step === 'verify-passcode') {
      if (verifyPasscode(passcode)) {
        disableScreenLock();
        toast.success(t('screenLock.disabled', 'Screen lock disabled'));
        setStep('main');
        setPasscode('');
      } else {
        setError(t('screenLock.wrongPasscode', 'Wrong passcode'));
        setPasscode('');
      }
    }
  }, [step, passcode, confirmPasscode, enableScreenLock, verifyPasscode, disableScreenLock, t]);

  const handleBiometricToggle = useCallback(async (checked: boolean) => {
    if (checked) {
      // Register biometric
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

  const renderMainContent = () => (
    <div className="space-y-4">
      {/* Enable/Disable Toggle */}
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

        {/* Biometric option (show even if unavailable, but disabled) */}
        {biometricRow}

        {/* Lock timeout option */}
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

      {/* Security note */}
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

  const renderPasscodeInput = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
        >
          <Lock className="w-8 h-8 text-primary" />
        </motion.div>
        <h2 className="text-lg font-semibold text-foreground">
          {step === 'create-passcode' && t('screenLock.createPasscode', 'Create Passcode')}
          {step === 'confirm-passcode' && t('screenLock.confirmPasscode', 'Confirm Passcode')}
          {step === 'verify-passcode' && t('screenLock.enterPasscode', 'Enter Passcode')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {step === 'create-passcode' && t('screenLock.createDesc', 'Enter a {{length}}-digit passcode', { length: PASSCODE_LENGTH })}
          {step === 'confirm-passcode' && t('screenLock.confirmDesc', 'Re-enter your passcode')}
          {step === 'verify-passcode' && t('screenLock.verifyDesc', 'Enter your current passcode to disable')}
        </p>
      </div>

      {/* Passcode input (step-by-step with match feedback) */}
      <PasscodeMatchInput
        value={step === 'confirm-passcode' ? confirmPasscode : passcode}
        onChange={(next) => {
          if (step === 'confirm-passcode') setConfirmPasscode(next);
          else setPasscode(next);
          setError('');
        }}
        length={PASSCODE_LENGTH}
        compareTo={step === 'confirm-passcode' ? passcode : undefined}
        autoFocus
      />

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

      {/* Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            setStep('main');
            setPasscode('');
            setConfirmPasscode('');
            setError('');
          }}
        >
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button
          className="flex-1"
          onClick={handlePasscodeSubmit}
          disabled={(step === 'confirm-passcode' ? confirmPasscode : passcode).length < PASSCODE_LENGTH}
        >
          {step === 'confirm-passcode' 
            ? t('screenLock.enable', 'Enable')
            : t('common.continue', 'Continue')
          }
        </Button>
      </div>
    </div>
  );

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
          {(step === 'create-passcode' || step === 'confirm-passcode' || step === 'verify-passcode') && renderPasscodeInput()}
          {step === 'timeout-select' && renderTimeoutSelect()}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
