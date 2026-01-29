/**
 * Multi-account management hook
 * Stores multiple accounts and allows switching between them
 */

import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '@/services/api/authApi';
import { getAuthToken, setAuthToken, AUTH_USER_KEY } from '@/services/api/apiClient';

const ACCOUNTS_STORAGE_KEY = 'saved_accounts';

export interface SavedAccount {
  id: number;
  token: string;
  user: UserProfile;
  lastUsed: number;
}

/**
 * Get saved accounts from localStorage
 */
export const getSavedAccounts = (): SavedAccount[] => {
  try {
    const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

/**
 * Save accounts to localStorage
 */
const saveAccounts = (accounts: SavedAccount[]) => {
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
};

/**
 * Add or update account in saved accounts
 */
export const saveCurrentAccount = (user: UserProfile, explicitToken?: string) => {
  const token = explicitToken || getAuthToken();
  
  if (!token || !user.id) {
    return;
  }

  const accounts = getSavedAccounts();
  const existingIndex = accounts.findIndex(a => a.user.id === user.id);

  const account: SavedAccount = {
    id: user.id,
    token,
    user,
    lastUsed: Date.now(),
  };

  if (existingIndex >= 0) {
    accounts[existingIndex] = account;
  } else {
    accounts.push(account);
  }

  saveAccounts(accounts);
};

/**
 * Remove account from saved accounts
 */
export const removeAccount = (userId: number) => {
  const accounts = getSavedAccounts().filter(a => a.user.id !== userId);
  saveAccounts(accounts);
};

/**
 * Switch to a different account
 */
export const switchToAccount = (account: SavedAccount): boolean => {
  // Set the token
  setAuthToken(account.token);
  
  // Set the user data
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(account.user));
  
  // Update lastUsed
  const accounts = getSavedAccounts();
  const index = accounts.findIndex(a => a.id === account.id);
  if (index >= 0) {
    accounts[index].lastUsed = Date.now();
    saveAccounts(accounts);
  }

  return true;
};

/**
 * Hook for multi-account management
 */
export const useMultiAccount = () => {
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);

  // Load accounts on mount
  useEffect(() => {
    setAccounts(getSavedAccounts());
  }, []);

  const refreshAccounts = useCallback(() => {
    setAccounts(getSavedAccounts());
  }, []);

  const addCurrentAccount = useCallback((user: UserProfile) => {
    saveCurrentAccount(user);
    refreshAccounts();
  }, [refreshAccounts]);

  const removeAccountById = useCallback((userId: number) => {
    removeAccount(userId);
    refreshAccounts();
  }, [refreshAccounts]);

  const switchAccount = useCallback((account: SavedAccount) => {
    const result = switchToAccount(account);
    if (result) {
      refreshAccounts();
    }
    return result;
  }, [refreshAccounts]);

  const getOtherAccounts = useCallback((currentUserId?: number) => {
    return accounts.filter(a => a.user.id !== currentUserId);
  }, [accounts]);

  return {
    accounts,
    refreshAccounts,
    addCurrentAccount,
    removeAccountById,
    switchAccount,
    getOtherAccounts,
  };
};
