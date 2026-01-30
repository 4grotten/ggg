/**
 * Overlay for revealing hidden sensitive data with passcode/biometric verification
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, ScanFace, Fingerprint, X, Delete } from 'lucide-react';
import { useScreenLockContext } from '@/contexts/ScreenLockContext';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

interface RevealDataOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PASSCODE_LENGTH = 4;

export const RevealDataOverlay = ({ open, onOpenChange }: RevealDataOverlayProps) => {
  const { t } = useTranslation();
  const { verifyPasscode, revealData, isBiometricEnabled } = useScreenLockContext();
  const { authenticateWithBiometric, getBiometricLabel, isAvailable: isBiometricAvailable } = useBiometricAuth();
  
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const biometricLabel = getBiometricLabel();
  const BiometricIcon = biometricLabel === 'Face ID' ? ScanFace : Fingerprint;

  // Try biometric on open
  useEffect(() => {
    if (open && isBiometricEnabled && isBiometricAvailable) {
      handleBiometricAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setPasscode('');
      setError(false);
    }
  }, [open]);

  const handleBiometricAuth = async () => {
    const result = await authenticateWithBiometric();
    if (result.success) {
      revealData();
      onOpenChange(false);
    }
  };

  const handlePasscodeChange = (digit: string) => {
    if (passcode.length >= PASSCODE_LENGTH) return;
    
    const newPasscode = passcode + digit;
    setPasscode(newPasscode);
    setError(false);

    if (newPasscode.length === PASSCODE_LENGTH) {
      if (verifyPasscode(newPasscode)) {
        revealData();
        onOpenChange(false);
      } else {
        setError(true);
        setAttempts(prev => prev + 1);
        setTimeout(() => setPasscode(''), 300);
      }
    }
  };

  const handleDelete = () => {
    setPasscode(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleKeypadClick = (key: string) => {
    if (key === 'delete') {
      handleDelete();
    } else if (key === 'biometric') {
      handleBiometricAuth();
    } else {
      handlePasscodeChange(key);
    }
  };

  const keypadButtons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [isBiometricEnabled && isBiometricAvailable ? 'biometric' : '', '0', 'delete'],
  ];

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={() => onOpenChange(false)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"
          >
            <Eye className="w-10 h-10 text-primary" />
          </motion.div>

          {/* Title */}
          <h2 className="text-xl font-bold mb-2 text-center">
            {t('screenLock.revealDataTitle', 'View Hidden Data')}
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            {t('screenLock.revealDataDesc', 'Enter passcode to view your data')}
          </p>

          {/* Passcode dots */}
          <div className="flex gap-4 mb-8">
            {Array.from({ length: PASSCODE_LENGTH }).map((_, i) => (
              <motion.div
                key={i}
                className={`w-4 h-4 rounded-full transition-colors ${
                  error
                    ? 'bg-red-500'
                    : i < passcode.length
                    ? 'bg-primary'
                    : 'bg-muted-foreground/30'
                }`}
                animate={
                  error
                    ? { x: [0, -8, 8, -8, 8, 0] }
                    : i < passcode.length
                    ? { scale: [1, 1.2, 1] }
                    : {}
                }
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>

          {/* Error message */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm mb-4"
            >
              {t('screenLock.wrongPasscode', 'Wrong passcode')}
              {attempts > 2 && ` (${attempts} ${t('screenLock.attempts', 'attempts')})`}
            </motion.p>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-4 max-w-[280px] w-full">
            {keypadButtons.flat().map((key, idx) => (
              <motion.button
                key={idx}
                onClick={() => key && handleKeypadClick(key)}
                disabled={!key}
                className={`h-16 rounded-2xl font-semibold text-xl transition-colors ${
                  !key
                    ? 'invisible'
                    : key === 'delete'
                    ? 'bg-muted/50 hover:bg-muted'
                    : key === 'biometric'
                    ? 'bg-primary/10 hover:bg-primary/20'
                    : 'bg-muted hover:bg-muted/80'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {key === 'delete' ? (
                  <Delete className="w-6 h-6 mx-auto" />
                ) : key === 'biometric' ? (
                  <BiometricIcon className="w-6 h-6 mx-auto text-primary" />
                ) : (
                  key
                )}
              </motion.button>
            ))}
          </div>

          {/* Biometric hint */}
          {isBiometricEnabled && isBiometricAvailable && (
            <button
              onClick={handleBiometricAuth}
              className="mt-6 text-primary text-sm font-medium"
            >
              {t('screenLock.useBiometric', 'Or use {{method}}').replace('{{method}}', biometricLabel)}
            </button>
          )}
        </div>

        {/* Hidden input for keyboard */}
        <input
          ref={hiddenInputRef}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          className="absolute opacity-0 pointer-events-none"
          value={passcode}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            if (val.length <= PASSCODE_LENGTH) {
              setPasscode(val);
              if (val.length === PASSCODE_LENGTH) {
                if (verifyPasscode(val)) {
                  revealData();
                  onOpenChange(false);
                } else {
                  setError(true);
                  setAttempts(prev => prev + 1);
                  setTimeout(() => setPasscode(''), 300);
                }
              }
            }
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};