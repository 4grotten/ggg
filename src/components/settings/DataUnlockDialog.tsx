import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Fingerprint, Delete, AlertCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useScreenLockContext } from '@/contexts/ScreenLockContext';
import { cn } from '@/lib/utils';

interface DataUnlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PASSCODE_LENGTH = 4;

export const DataUnlockDialog = ({ isOpen, onClose, onSuccess }: DataUnlockDialogProps) => {
  const { t } = useTranslation();
  const { verifyPasscode, isBiometricEnabled } = useScreenLockContext();
  const { authenticateWithBiometric, getBiometricLabel, isAvailable: isBiometricAvailable } = useBiometricAuth();
  
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleDigitPress = useCallback((digit: string) => {
    if (passcode.length >= PASSCODE_LENGTH) return;
    
    setError(false);
    const newPasscode = passcode + digit;
    setPasscode(newPasscode);

    if (newPasscode.length === PASSCODE_LENGTH) {
      setTimeout(() => {
        const success = verifyPasscode(newPasscode);
        if (success) {
          onSuccess();
          onClose();
        } else {
          setError(true);
          setShake(true);
          setTimeout(() => {
            setPasscode('');
            setShake(false);
          }, 500);
        }
      }, 100);
    }
  }, [passcode, verifyPasscode, onSuccess, onClose]);

  const handleDelete = useCallback(() => {
    setPasscode(prev => prev.slice(0, -1));
    setError(false);
  }, []);

  const handleBiometric = useCallback(async () => {
    if (!isBiometricEnabled || !isBiometricAvailable) return;
    
    try {
      const result = await authenticateWithBiometric();
      if (result.success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Biometric auth failed:', err);
    }
  }, [isBiometricEnabled, isBiometricAvailable, authenticateWithBiometric, onSuccess, onClose]);

  // Try biometric on open if enabled
  useEffect(() => {
    if (isOpen && isBiometricEnabled && isBiometricAvailable) {
      handleBiometric();
    }
  }, [isOpen, isBiometricEnabled, isBiometricAvailable]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setError(false);
    }
  }, [isOpen]);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const bottomRow = [
    isBiometricEnabled && isBiometricAvailable ? 'biometric' : null,
    '0',
    'delete',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] bg-background backdrop-blur-sm flex flex-col items-center justify-center px-6"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Lock Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="mb-4"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-lg font-semibold text-foreground mb-1"
          >
            {t('screenLock.enterPasscode', 'Enter Passcode')}
          </motion.h1>

          {/* Subtitle / Error */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "text-sm mb-6 flex items-center gap-1",
              error ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {error ? (
              <>
                <AlertCircle className="w-4 h-4" />
                {t('screenLock.wrongPasscode', 'Wrong passcode')}
              </>
            ) : (
              t('screenLock.viewSensitiveData', 'To view sensitive data')
            )}
          </motion.p>

          {/* Dots */}
          <motion.div
            animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex gap-3 mb-8"
          >
            {Array.from({ length: PASSCODE_LENGTH }).map((_, i) => {
              const isFilled = i < passcode.length;
              const isLatest = i === passcode.length - 1 && passcode.length > 0;
              
              return (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: isLatest ? [1, 1.3, 1] : 1,
                    backgroundColor: isFilled 
                      ? error ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'
                      : 'hsl(var(--muted))'
                  }}
                  transition={{ 
                    scale: { duration: 0.25, ease: "easeOut" },
                    backgroundColor: { duration: 0.15 }
                  }}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all duration-200",
                    isFilled && !error && "shadow-[0_0_10px_hsl(var(--primary)/0.5)]",
                    isFilled && error && "shadow-[0_0_10px_hsl(var(--destructive)/0.5)]"
                  )}
                />
              );
            })}
          </motion.div>

          {/* Compact Keypad */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-3 gap-3"
          >
            {digits.map((digit, i) => (
              <motion.button
                key={digit}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.02 }}
                whileTap={{ scale: 0.92, backgroundColor: 'hsl(var(--muted))' }}
                onClick={() => handleDigitPress(digit)}
                className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center text-xl font-semibold text-foreground hover:bg-muted transition-colors"
              >
                {digit}
              </motion.button>
            ))}
            
            {/* Bottom row */}
            {bottomRow.map((item, i) => (
              <motion.button
                key={item || `empty-${i}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.02 }}
                whileTap={item ? { scale: 0.92, backgroundColor: 'hsl(var(--muted))' } : undefined}
                onClick={() => {
                  if (item === 'biometric') handleBiometric();
                  else if (item === 'delete') handleDelete();
                  else if (item === '0') handleDigitPress('0');
                }}
                disabled={!item}
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                  item === null && "opacity-0 pointer-events-none",
                  item === '0' && "bg-muted/50 hover:bg-muted",
                  item === 'biometric' && "hover:bg-muted/50",
                  item === 'delete' && "hover:bg-muted/50"
                )}
              >
                {item === 'biometric' && (
                  <Fingerprint className="w-6 h-6 text-primary" />
                )}
                {item === 'delete' && (
                  <Delete className="w-5 h-5 text-muted-foreground" />
                )}
                {item === '0' && (
                  <span className="text-xl font-semibold text-foreground">0</span>
                )}
              </motion.button>
            ))}
          </motion.div>

          {/* Biometric hint */}
          {isBiometricEnabled && isBiometricAvailable && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-5 text-xs text-muted-foreground"
            >
              {t('screenLock.useBiometric', 'Or use {{method}}', { method: getBiometricLabel() })}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
