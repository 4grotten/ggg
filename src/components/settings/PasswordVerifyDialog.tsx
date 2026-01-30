import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, LockOpen, Eye, EyeOff, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PasswordVerifyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export const PasswordVerifyDialog = ({
  isOpen,
  onOpenChange,
  onSuccess,
  title,
  description,
}: PasswordVerifyDialogProps) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleVerify = useCallback(async () => {
    if (!password.trim()) {
      setError(t('auth.enterPassword', 'Please enter your password'));
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // Get current user email
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        setError(t('auth.userNotFound', 'User not found'));
        setIsVerifying(false);
        return;
      }

      // Re-authenticate with password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (authError) {
        setError(t('auth.wrongPassword', 'Wrong password'));
        setShake(true);
        setTimeout(() => setShake(false), 400);
        setIsVerifying(false);
        return;
      }

      // Success
      setSuccess(true);
      setTimeout(() => {
        setPassword('');
        setSuccess(false);
        onOpenChange(false);
        onSuccess();
      }, 600);
    } catch (err) {
      console.error('Password verification error:', err);
      setError(t('auth.verificationFailed', 'Verification failed'));
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } finally {
      setIsVerifying(false);
    }
  }, [password, t, onOpenChange, onSuccess]);

  const handleClose = () => {
    setPassword('');
    setError('');
    setSuccess(false);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && password.trim() && !isVerifying) {
      handleVerify();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent 
        className={cn(
          "max-w-sm mx-auto rounded-3xl border-border/50",
          "bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-xl",
          "shadow-2xl shadow-black/20"
        )}
      >
        <div className="flex flex-col items-center py-4">
          {/* Animated Icon */}
          <motion.div
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center mb-6",
              success 
                ? "bg-gradient-to-br from-green-500/20 to-green-500/10" 
                : "bg-gradient-to-br from-primary/20 to-primary/10"
            )}
            animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="unlocked"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <LockOpen className="w-10 h-10 text-green-500" />
                </motion.div>
              ) : (
                <motion.div
                  key="locked"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0, rotate: 180 }}
                >
                  <Lock className="w-10 h-10 text-primary" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <AlertDialogTitle className="text-xl font-semibold text-center mb-2">
            {title || t('auth.verifyPassword', 'Verify Password')}
          </AlertDialogTitle>
          
          <AlertDialogDescription className="text-center text-muted-foreground mb-6 px-4">
            {description || t('auth.enterAccountPassword', 'Enter your account password to continue')}
          </AlertDialogDescription>

          {/* Password Input */}
          <div className="w-full px-4 space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                placeholder={t('auth.password', 'Password')}
                className={cn(
                  "h-14 pr-12 rounded-xl text-lg",
                  "bg-muted/50 border-border/50",
                  "focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                  error && "border-destructive/50 focus:border-destructive/50 focus:ring-destructive/20"
                )}
                autoFocus
                disabled={isVerifying || success}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isVerifying || success}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm text-destructive text-center"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-12 rounded-xl"
                disabled={isVerifying || success}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={handleVerify}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80"
                disabled={!password.trim() || isVerifying || success}
              >
                {isVerifying ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : success ? (
                  <LockOpen className="w-5 h-5" />
                ) : (
                  t('common.confirm', 'Confirm')
                )}
              </Button>
            </div>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
