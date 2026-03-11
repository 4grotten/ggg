import { useQuery } from '@tanstack/react-query';
import { 
  fetchCards, 
  fetchCardById, 
  fetchCardBalance,
  fetchTotalBalance,
  fetchWalletSummary,
  fetchIban,
  fetchCardsList,
  fetchBankAccounts,
  fetchCryptoWallets,
} from '@/services/api/cards';
import { getAuthToken } from '@/services/api/apiClient';
import { FetchCardsParams } from '@/types/card';

// Query keys for caching
export const cardKeys = {
  all: ['cards'] as const,
  lists: () => [...cardKeys.all, 'list'] as const,
  list: (params?: FetchCardsParams) => [...cardKeys.lists(), params] as const,
  details: () => [...cardKeys.all, 'detail'] as const,
  detail: (id: string) => [...cardKeys.details(), id] as const,
  balances: () => [...cardKeys.all, 'balance'] as const,
  balance: (id: string) => [...cardKeys.balances(), id] as const,
  totalBalance: () => [...cardKeys.all, 'totalBalance'] as const,
  walletSummary: () => [...cardKeys.all, 'walletSummary'] as const,
  iban: () => [...cardKeys.all, 'iban'] as const,
  cardsList: () => [...cardKeys.all, 'cardsList'] as const,
  bankAccounts: () => [...cardKeys.all, 'bankAccounts'] as const,
  cryptoWallets: () => [...cardKeys.all, 'cryptoWallets'] as const,
};

/**
 * Hook to fetch all cards
 */
export const useCards = (params?: FetchCardsParams) => {
  return useQuery({
    queryKey: cardKeys.list(params),
    queryFn: () => fetchCards(params),
    enabled: !!getAuthToken(),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook to fetch single card details
 */
export const useCardDetails = (id: string) => {
  return useQuery({
    queryKey: cardKeys.detail(id),
    queryFn: () => fetchCardById(id),
    enabled: !!id && !!getAuthToken(),
    staleTime: 1000 * 60 * 10,
  });
};

/**
 * Hook to fetch card balance
 */
export const useCardBalance = (id: string) => {
  return useQuery({
    queryKey: cardKeys.balance(id),
    queryFn: () => fetchCardBalance(id),
    enabled: !!id && !!getAuthToken(),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
};

/**
 * Hook to fetch total balance across all cards
 */
export const useTotalBalance = () => {
  return useQuery({
    queryKey: cardKeys.totalBalance(),
    queryFn: fetchTotalBalance,
    enabled: !!getAuthToken(),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
};

/**
 * Hook to fetch wallet summary (IBAN + cards in one request)
 * GET /cards/wallet/summary/
 */
export const useWalletSummary = () => {
  return useQuery({
    queryKey: cardKeys.walletSummary(),
    queryFn: fetchWalletSummary,
    enabled: !!getAuthToken(),
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 2,
  });
};

/**
 * Hook to fetch IBAN bank account
 * GET /cards/accounts/IBAN_AED/
 */
export const useIban = () => {
  return useQuery({
    queryKey: cardKeys.iban(),
    queryFn: fetchIban,
    enabled: !!getAuthToken(),
    staleTime: 1000 * 60 * 10,
  });
};

/**
 * Hook to fetch cards list (separate from balances)
 * GET /cards/cards/
 */
export const useCardsList = () => {
  return useQuery({
    queryKey: cardKeys.cardsList(),
    queryFn: fetchCardsList,
    enabled: !!getAuthToken(),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook to fetch user bank accounts
 * GET /transactions/bank-accounts/
 */
export const useBankAccounts = () => {
  return useQuery({
    queryKey: cardKeys.bankAccounts(),
    queryFn: fetchBankAccounts,
    enabled: !!getAuthToken(),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook to fetch user crypto wallets
 * GET /transactions/crypto-wallets/
 */
export const useCryptoWallets = () => {
  return useQuery({
    queryKey: cardKeys.cryptoWallets(),
    queryFn: fetchCryptoWallets,
    enabled: !!getAuthToken(),
    staleTime: 1000 * 60 * 5,
  });
};
