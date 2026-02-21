/**
 * Account Switcher Component
 * Shows list of accounts like Telegram/Instagram style
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, LogOut, X } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
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
  const queryClient = useQueryClient();

  // Ensure we always show the latest saved_accounts when the drawer opens
  useEffect(() => {
    if (open) refreshAccounts();
  }, [open, refreshAccounts]);

  const handleSwitchAccount = (account: SavedAccount) => {
    switchUser(account.user, account.token);
    onOpenChange(false);
    // Invalidate all cached queries so they refetch with new token
    queryClient.invalidateQueries();
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

  const handleRemoveAccount = (e: React.MouseEvent, userId: number) => {
    e.stopPropagation();
    removeAccountById(userId);
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
                      onClick={(e) => handleRemoveAccount(e, account.user.id)}
                      className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                    </button>
                  </button>
                </AnimatedDrawerItem>
              ))}
            </AnimatedDrawerContainer>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
