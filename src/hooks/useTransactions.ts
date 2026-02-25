import { useQuery } from '@tanstack/react-query';
import { 
  fetchTransactions, 
  fetchTransactionGroups, 
  fetchTransactionById,
  fetchTransactionReceipt,
  fetchApiTransactionGroups,
  fetchIbanTransactionGroups,
  fetchCardTransactionGroups,
  fetchCryptoTransactionGroups
} from '@/services/api/transactions';
import { FetchTransactionsParams, TransactionGroup } from '@/types/transaction';
import { getAuthToken } from '@/services/api/apiClient';

// Query keys for caching
export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (params?: FetchTransactionsParams) => [...transactionKeys.lists(), params] as const,
  groups: () => [...transactionKeys.all, 'groups'] as const,
  groupsWithParams: (params?: FetchTransactionsParams) => [...transactionKeys.groups(), params] as const,
  apiGroups: () => [...transactionKeys.all, 'apiGroups'] as const,
  cryptoGroups: () => [...transactionKeys.all, 'cryptoGroups'] as const,
  cardGroups: () => [...transactionKeys.all, 'cardGroups'] as const,
  ibanGroups: () => [...transactionKeys.all, 'ibanGroups'] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
  receipts: () => [...transactionKeys.all, 'receipt'] as const,
  receipt: (id: string) => [...transactionKeys.receipts(), id] as const,
};

/**
 * Hook to fetch transactions list
 */
export const useTransactions = (params?: FetchTransactionsParams) => {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => fetchTransactions(params),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook to fetch real transactions from API, returns groups
 */
export const useApiTransactionGroups = () => {
  const token = getAuthToken();
  return useQuery({
    queryKey: transactionKeys.apiGroups(),
    queryFn: fetchApiTransactionGroups,
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};

/**
 * Hook to fetch crypto-only transactions from API
 */
export const useCryptoTransactionGroups = () => {
  const token = getAuthToken();
  return useQuery({
    queryKey: transactionKeys.cryptoGroups(),
    queryFn: fetchCryptoTransactionGroups,
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};

/**
 * Hook to fetch card-only transactions from API
 */
export const useCardTransactionGroups = () => {
  const token = getAuthToken();
  return useQuery({
    queryKey: transactionKeys.cardGroups(),
    queryFn: fetchCardTransactionGroups,
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};

/**
 * Hook to fetch IBAN-only transactions from API
 */
export const useIbanTransactionGroups = () => {
  const token = getAuthToken();
  return useQuery({
    queryKey: transactionKeys.ibanGroups(),
    queryFn: fetchIbanTransactionGroups,
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};

/**
 * Hook to fetch transactions grouped by date (mock data)
 */
export const useTransactionGroups = (params?: FetchTransactionsParams) => {
  return useQuery({
    queryKey: transactionKeys.groupsWithParams(params),
    queryFn: () => fetchTransactionGroups(params),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook to fetch merged transactions: real API groups first, then mock groups
 */
export const useMergedTransactionGroups = (params?: FetchTransactionsParams) => {
  const mockQuery = useTransactionGroups(params);
  const apiQuery = useApiTransactionGroups();
  
  const mergedGroups: TransactionGroup[] = [];
  
  // API groups first (real data)
  if (apiQuery.data && apiQuery.data.length > 0) {
    mergedGroups.push(...apiQuery.data);
  }
  
  // Then mock groups (existing dates won't overlap since they're different)
  if (mockQuery.data?.groups) {
    mergedGroups.push(...mockQuery.data.groups);
  }
  
  return {
    ...mockQuery,
    data: {
      ...mockQuery.data,
      groups: mergedGroups,
    },
    isLoading: mockQuery.isLoading,
    apiLoading: apiQuery.isLoading,
  };
};

/**
 * Hook to fetch single transaction details
 */
export const useTransactionDetails = (id: string) => {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => fetchTransactionById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
};

/**
 * Hook to fetch transaction receipt from backend API
 */
// UUID regex to validate transaction IDs before calling receipt endpoint
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const useTransactionReceipt = (transactionId: string, enabled = true, viewAsUserId?: string) => {
  const isUuid = UUID_RE.test(transactionId);
  return useQuery({
    queryKey: [...transactionKeys.receipt(transactionId), viewAsUserId],
    queryFn: () => fetchTransactionReceipt(transactionId, viewAsUserId),
    enabled: !!transactionId && enabled && isUuid,
    staleTime: 1000 * 60 * 30,
    retry: 0,
  });
};
