import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Fingerprint, Delete, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { cn } from '@/lib/utils';

interface ScreenLockOverlayProps {
  isLocked: boolean;
  isBiometricEnabled: boolean;
  onUnlock: (passcode: string) => boolean;
  onBiometricUnlock: () => boolean;
}

const PASSCODE_LENGTH = 4;

export const ScreenLockOverlay = ({
  isLocked,
  isBiometricEnabled,
  onUnlock,
  onBiometricUnlock,
}: ScreenLockOverlayProps) => {
  const { t } = useTranslation();
  const { authenticateWithBiometric, getBiometricLabel, isAvailable: isBiometricAvailable } = useBiometricAuth();
  
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleDigitPress = useCallback((digit: string) => {
    if (passcode.length >= PASSCODE_LENGTH) return;
    
    setError(false);
    const newPasscode = passcode + digit;
    setPasscode(newPasscode);

    // Auto-submit when complete
    if (newPasscode.length === PASSCODE_LENGTH) {
      setTimeout(() => {
        const success = onUnlock(newPasscode);
        if (!success) {
          setError(true);
          setShake(true);
          setAttempts(prev => prev + 1);
          setTimeout(() => {
            setPasscode('');
            setShake(false);
          }, 500);
        }
      }, 100);
    }
  }, [passcode, onUnlock]);

  const handleDelete = useCallback(() => {
    setPasscode(prev => prev.slice(0, -1));
    setError(false);
  }, []);

  const handleBiometric = useCallback(async () => {
    if (!isBiometricEnabled || !isBiometricAvailable) return;
    
    try {
      const result = await authenticateWithBiometric();
      if (result.success) {
        onBiometricUnlock();
      }
    } catch (err) {
      console.error('Biometric auth failed:', err);
    }
  }, [isBiometricEnabled, isBiometricAvailable, authenticateWithBiometric, onBiometricUnlock]);

  // Try biometric on mount if enabled
  useEffect(() => {
    if (isLocked && isBiometricEnabled && isBiometricAvailable) {
      handleBiometric();
    }
  }, [isLocked, isBiometricEnabled, isBiometricAvailable]);

  // Reset passcode when overlay appears
  useEffect(() => {
    if (isLocked) {
      setPasscode('');
      setError(false);
      setAttempts(0);
    }
  }, [isLocked]);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const bottomRow = [
    isBiometricEnabled && isBiometricAvailable ? 'biometric' : null,
    '0',
    'delete',
  ];

  return (
    <AnimatePresence>
      {isLocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center px-8"
        >
          {/* Lock Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mb-6"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl font-semibold text-foreground mb-2"
          >
            {t('screenLock.enterPasscode', 'Enter Passcode')}
          </motion.h1>

          {/* Subtitle / Error */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={cn(
              "text-sm mb-8 flex items-center gap-1",
              error ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {error ? (
              <>
                <AlertCircle className="w-4 h-4" />
                {t('screenLock.wrongPasscode', 'Wrong passcode')}
                {attempts >= 3 && ` (${attempts} ${t('screenLock.attempts', 'attempts')})`}
              </>
            ) : (
              t('screenLock.unlockApp', 'Unlock to continue')
            )}
          </motion.p>

          {/* Dots */}
          <motion.div
            animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex gap-4 mb-10"
          >
            {Array.from({ length: PASSCODE_LENGTH }).map((_, i) => {
              const isFilled = i < passcode.length;
              const isLatest = i === passcode.length - 1 && passcode.length > 0;
              
              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: isLatest ? [1, 1.4, 1] : 1,
                    backgroundColor: isFilled 
                      ? error ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'
                      : 'hsl(var(--muted))'
                  }}
                  transition={{ 
                    scale: { duration: 0.3, ease: "easeOut" },
                    backgroundColor: { duration: 0.2 }
                  }}
                  className={cn(
                    "w-4 h-4 rounded-full transition-all duration-200",
                    isFilled && !error && "shadow-[0_0_12px_hsl(var(--primary)/0.6)]",
                    isFilled && error && "shadow-[0_0_12px_hsl(var(--destructive)/0.6)]"
                  )}
                />
              );
            })}
          </motion.div>

          {/* Keypad */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-4"
          >
            {digits.map((digit, i) => (
              <motion.button
                key={digit}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.03 }}
                whileTap={{ scale: 0.9, backgroundColor: 'hsl(var(--muted))' }}
                onClick={() => handleDigitPress(digit)}
                className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center text-2xl font-semibold text-foreground hover:bg-muted transition-colors"
              >
                {digit}
              </motion.button>
            ))}
            
            {/* Bottom row */}
            {bottomRow.map((item, i) => (
              <motion.button
                key={item || `empty-${i}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.03 }}
                whileTap={item ? { scale: 0.9, backgroundColor: 'hsl(var(--muted))' } : undefined}
                onClick={() => {
                  if (item === 'biometric') handleBiometric();
                  else if (item === 'delete') handleDelete();
                  else if (item === '0') handleDigitPress('0');
                }}
                disabled={!item}
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center transition-colors",
                  item === null && "opacity-0 pointer-events-none",
                  item === '0' && "bg-muted/50 hover:bg-muted",
                  item === 'biometric' && "hover:bg-muted/50",
                  item === 'delete' && "hover:bg-muted/50"
                )}
              >
                {item === 'biometric' && (
                  <Fingerprint className="w-7 h-7 text-primary" />
                )}
                {item === 'delete' && (
                  <Delete className="w-6 h-6 text-muted-foreground" />
                )}
                {item === '0' && (
                  <span className="text-2xl font-semibold text-foreground">0</span>
                )}
              </motion.button>
            ))}
          </motion.div>

          {/* Biometric hint */}
          {isBiometricEnabled && isBiometricAvailable && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-sm text-muted-foreground"
            >
              {t('screenLock.useBiometric', 'Or use {{method}}', { method: getBiometricLabel() })}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
