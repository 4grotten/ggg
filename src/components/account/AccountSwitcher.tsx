/**
 * Account Switcher Component
 * Shows list of accounts like Telegram/Instagram style
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, LogOut, X } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useMultiAccount, SavedAccount, saveCurrentAccount } from '@/hooks/useMultiAccount';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedDrawerItem, AnimatedDrawerContainer } from '@/components/ui/animated-drawer-item';

interface AccountSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AccountSwitcher = ({ open, onOpenChange }: AccountSwitcherProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, switchUser } = useAuth();
  const { accounts, removeAccountById, refreshAccounts } = useMultiAccount();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [accountToRemove, setAccountToRemove] = useState<SavedAccount | null>(null);

  // Ensure we always show the latest saved_accounts when the drawer opens
  useEffect(() => {
    if (open) refreshAccounts();
  }, [open, refreshAccounts]);

  const handleSwitchAccount = (account: SavedAccount) => {
    // Switch user instantly without page reload
    switchUser(account.user, account.token);
    onOpenChange(false);
    // Navigate to dashboard after switch
    navigate('/');
  };

  const handleAddAccount = () => {
    // Save current account BEFORE navigating to add new one
    // Use explicit token to ensure we capture it before any navigation/state changes
    if (user) {
      const currentToken = localStorage.getItem('auth_token');
      if (currentToken) {
        saveCurrentAccount(user, currentToken);
        console.log('[AccountSwitcher] Saved current account before adding new:', user.id, user.full_name);
      }
    }
    onOpenChange(false);
    navigate('/auth/phone');
  };

  const handleRemoveClick = (e: React.MouseEvent, account: SavedAccount) => {
    e.stopPropagation();
    setAccountToRemove(account);
    setLogoutConfirmOpen(true);
  };

  const handleConfirmRemove = () => {
    if (accountToRemove) {
      removeAccountById(accountToRemove.user.id);
      setAccountToRemove(null);
    }
    setLogoutConfirmOpen(false);
  };

  const handleCancelRemove = () => {
    setAccountToRemove(null);
    setLogoutConfirmOpen(false);
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  // Filter out current user from the list
  const otherAccounts = accounts.filter(a => a.user.id !== user?.id);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent className="bg-background/95 backdrop-blur-xl">
        <DrawerHeader className="relative flex items-center justify-center py-4">
          <DrawerTitle className="text-center text-base font-semibold">
            {t('settings.accounts') || 'Accounts'}
          </DrawerTitle>
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-primary" />
          </button>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-3">
          {/* Current Account */}
          {user && (
            <div className="bg-primary/5 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage 
                    src={user.avatar?.medium || user.avatar?.file} 
                    alt={user.full_name} 
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-base font-medium text-foreground">{user.full_name}</p>
                  <p className="text-sm text-muted-foreground">{user.phone_number}</p>
                </div>
                <Check className="w-5 h-5 text-primary" />
              </div>
            </div>
          )}

          {/* Add Account Button */}
          <motion.button
            onClick={handleAddAccount}
            className="w-full flex items-center gap-3 px-4 py-4 bg-muted/50 rounded-xl hover:bg-muted/80 transition-colors"
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-base font-medium text-foreground">
                {t('settings.addAccount') || 'Add Account'}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('settings.addAccountDesc') || 'Sign in to another account'}
              </p>
            </div>
          </motion.button>

          {/* Other Accounts */}
          {otherAccounts.length > 0 && (
            <AnimatedDrawerContainer className="bg-muted/50 rounded-xl overflow-hidden">
              {otherAccounts.map((account, index) => (
                <AnimatedDrawerItem key={account.id} index={index}>
                  <button
                    onClick={() => handleSwitchAccount(account)}
                    className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/80 transition-colors ${
                      index < otherAccounts.length - 1 ? 'border-b border-border/50' : ''
                    }`}
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage 
                        src={account.user.avatar?.medium || account.user.avatar?.file} 
                        alt={account.user.full_name} 
                      />
                      <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                        {getInitials(account.user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-base font-medium text-foreground">{account.user.full_name}</p>
                      <p className="text-sm text-muted-foreground">{account.user.phone_number}</p>
                    </div>
                    <button
                      onClick={(e) => handleRemoveClick(e, account)}
                      className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-destructive" />
                    </button>
                  </button>
                </AnimatedDrawerItem>
              ))}
            </AnimatedDrawerContainer>
          )}
        </div>

        {/* iOS-style Logout Confirmation Alert */}
        <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
          <AlertDialogContent className="max-w-[280px] rounded-2xl p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/50">
            <AlertDialogHeader className="p-5 pb-3 text-center">
              <AlertDialogTitle className="text-[17px] font-semibold text-center">
                {t('settings.logoutFromAccount') || 'Выйти из аккаунта?'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[13px] text-muted-foreground text-center mt-1">
                {accountToRemove?.user.full_name}
                <br />
                <span className="text-xs">{accountToRemove?.user.phone_number}</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col p-0 gap-0 border-t border-border/50">
              <AlertDialogAction 
                onClick={handleConfirmRemove}
                className="w-full h-11 rounded-none bg-transparent hover:bg-muted/50 text-destructive font-medium text-[17px] border-0"
              >
                {t('settings.logout') || 'Выйти'}
              </AlertDialogAction>
              <AlertDialogCancel 
                onClick={handleCancelRemove}
                className="w-full h-11 rounded-none rounded-b-2xl bg-transparent hover:bg-muted/50 text-primary font-semibold text-[17px] border-t border-border/50 m-0"
              >
                {t('common.cancel') || 'Отмена'}
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DrawerContent>
    </Drawer>
  );
};
