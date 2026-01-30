import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, LockOpen, Fingerprint, Delete, AlertCircle, X } from 'lucide-react';
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
  const [unlocking, setUnlocking] = useState(false);

  const handleDigitPress = useCallback((digit: string) => {
    if (passcode.length >= PASSCODE_LENGTH || unlocking) return;
    
    setError(false);
    const newPasscode = passcode + digit;
    setPasscode(newPasscode);

    if (newPasscode.length === PASSCODE_LENGTH) {
      // Immediate check - no delay
      const success = verifyPasscode(newPasscode);
      if (success) {
        setUnlocking(true);
        // Quick unlock animation then close
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 400);
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setPasscode('');
          setShake(false);
        }, 400);
      }
    }
  }, [passcode, verifyPasscode, onSuccess, onClose, unlocking]);

  const handleDelete = useCallback(() => {
    setPasscode(prev => prev.slice(0, -1));
    setError(false);
  }, []);

  const handleBiometric = useCallback(async () => {
    if (!isBiometricEnabled || !isBiometricAvailable) return;
    
    try {
      const result = await authenticateWithBiometric();
      if (result.success) {
        setUnlocking(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 400);
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
      setUnlocking(false);
    }
  }, [isOpen]);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const bottomRow = [
    isBiometricEnabled && isBiometricAvailable ? 'biometric' : null,
    '0',
    'delete',
  ];

  const dialogContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 flex items-center justify-center px-8 bg-black/40 backdrop-blur-sm"
          style={{ zIndex: 99999 }}
          onClick={onClose}
        >
          {/* Compact Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="relative w-full max-w-[280px] bg-card/90 backdrop-blur-xl rounded-2xl p-5 pt-4 shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-2.5 right-2.5 p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Lock Icon with unlock animation */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="mb-3 flex items-center justify-center"
            >
              <motion.div 
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  unlocking ? "bg-green-500/30" : "bg-primary/20"
                )}
                animate={{
                  scale: unlocking ? [1, 1.15, 1] : 1,
                  boxShadow: unlocking 
                    ? ['0 0 0 0 rgba(34, 197, 94, 0)', '0 0 30px 12px rgba(34, 197, 94, 0.5)', '0 0 20px 8px rgba(34, 197, 94, 0.3)']
                    : '0 0 0 0 rgba(0, 122, 255, 0)'
                }}
                transition={{ duration: 0.4 }}
              >
                {unlocking ? (
                  <motion.div
                    key="unlocked"
                    initial={{ scale: 0, rotate: -45, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.05 }}
                  >
                    <LockOpen className="w-6 h-6 text-green-500" strokeWidth={2.5} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="locked"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, rotate: 45, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <Lock className="w-6 h-6 text-primary" strokeWidth={2.5} />
                  </motion.div>
                )}
              </motion.div>
            </motion.div>

            {/* Title */}
            <h1 className="text-base font-semibold text-foreground mb-0.5">
              {unlocking ? t('screenLock.unlocked', 'Unlocked') : t('screenLock.enterPasscode', 'Enter Passcode')}
            </h1>

            {/* Subtitle / Error */}
            <p className={cn(
              "text-xs mb-4 flex items-center gap-1",
              error ? "text-destructive" : "text-muted-foreground"
            )}>
              {error ? (
                <>
                  <AlertCircle className="w-3 h-3" />
                  {t('screenLock.wrongPasscode', 'Wrong passcode')}
                </>
              ) : unlocking ? (
                t('screenLock.accessGranted', 'Access granted')
              ) : (
                t('screenLock.viewSensitiveData', 'To view sensitive data')
              )}
            </p>

            {/* Dots - brighter glow */}
            <motion.div
              animate={shake ? { x: [-6, 6, -6, 6, 0] } : {}}
              transition={{ duration: 0.3 }}
              className="flex justify-center gap-2.5 mb-5"
            >
              {Array.from({ length: PASSCODE_LENGTH }).map((_, i) => {
                const isFilled = i < passcode.length;
                const isLatest = i === passcode.length - 1 && passcode.length > 0;
                
                return (
                  <motion.div
                    key={i}
                    animate={{ 
                      scale: isLatest ? [1, 1.4, 1] : 1,
                      backgroundColor: isFilled 
                        ? error ? 'hsl(var(--destructive))' 
                        : unlocking ? 'rgb(34, 197, 94)'
                        : 'hsl(var(--primary))'
                        : 'hsl(var(--muted))'
                    }}
                    transition={{ 
                      scale: { duration: 0.15, ease: "easeOut" },
                      backgroundColor: { duration: 0.1 }
                    }}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      isFilled && !error && !unlocking && "shadow-[0_0_12px_3px_hsl(var(--primary)/0.6)]",
                      isFilled && error && "shadow-[0_0_12px_3px_hsl(var(--destructive)/0.6)]",
                      isFilled && unlocking && "shadow-[0_0_12px_3px_rgba(34,197,94,0.6)]"
                    )}
                  />
                );
              })}
            </motion.div>

            {/* Compact Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {digits.map((digit) => (
                <motion.button
                  key={digit}
                  whileTap={{ scale: 0.9, backgroundColor: 'hsl(var(--primary)/0.3)' }}
                  onClick={() => handleDigitPress(digit)}
                  disabled={unlocking}
                  className="w-14 h-14 mx-auto rounded-full bg-muted/40 flex items-center justify-center text-lg font-semibold text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
                >
                  {digit}
                </motion.button>
              ))}
              
              {/* Bottom row */}
              {bottomRow.map((item, i) => (
                <motion.button
                  key={item || `empty-${i}`}
                  whileTap={item ? { scale: 0.9 } : undefined}
                  onClick={() => {
                    if (item === 'biometric') handleBiometric();
                    else if (item === 'delete') handleDelete();
                    else if (item === '0') handleDigitPress('0');
                  }}
                  disabled={!item || unlocking}
                  className={cn(
                    "w-14 h-14 mx-auto rounded-full flex items-center justify-center transition-colors",
                    item === null && "opacity-0 pointer-events-none",
                    item === '0' && "bg-muted/40 hover:bg-muted/60",
                    item === 'biometric' && "hover:bg-muted/40",
                    item === 'delete' && "hover:bg-muted/40"
                  )}
                >
                  {item === 'biometric' && (
                    <Fingerprint className="w-5 h-5 text-primary" />
                  )}
                  {item === 'delete' && (
                    <Delete className="w-4 h-4 text-muted-foreground" />
                  )}
                  {item === '0' && (
                    <span className="text-lg font-semibold text-foreground">0</span>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Biometric hint */}
            {isBiometricEnabled && isBiometricAvailable && !unlocking && (
              <p className="mt-4 text-[10px] text-center text-muted-foreground">
                {t('screenLock.useBiometric', 'Or use {{method}}', { method: getBiometricLabel() })}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(dialogContent, document.body);
};
