import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
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
    staleTime: 1000 * 30,
    refetchInterval: 15000,
    retry: 1,
  });
};

/**
 * Hook to fetch card-related transactions from API
 * Fetches ALL card transactions, then filters client-side by full card number.
 */
export const useCardTransactionGroups = (cardNumber?: string) => {
  const token = getAuthToken();
  const query = useQuery<TransactionGroup[]>({
    queryKey: transactionKeys.cardGroups(),
    queryFn: () => fetchCardTransactionGroups(),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  // Filter client-side by full card number
  const filteredData = useMemo(() => {
    if (!query.data || !cardNumber) return query.data;

    // Remove spaces from the card number for comparison
    const cleanCardNumber = cardNumber.replace(/\s/g, '');

    return query.data
      .map(group => ({
        ...group,
        transactions: group.transactions.filter(tx => {
          // Check if this transaction involves this specific card (full number match)
          const senderClean = tx.senderCard?.replace(/\s/g, '') || '';
          const recipientClean = tx.recipientCard?.replace(/\s/g, '') || '';
          const txCardId = tx.cardId || '';

          // Match by full card number
          if (senderClean === cleanCardNumber || recipientClean === cleanCardNumber) return true;

          // Also check metadata for card masks that contain the full number
          const meta = tx.metadata as Record<string, unknown> | undefined;
          const senderMask = String(meta?.sender_card_mask || '').replace(/\s/g, '');
          const receiverMask = String(meta?.receiver_card_mask || '').replace(/\s/g, '');
          if (senderMask === cleanCardNumber || receiverMask === cleanCardNumber) return true;

          // For card_activation or payment types, match by card_id if present
          if (tx.type === 'card_activation' || tx.type === 'payment') {
            // These may not have sender/recipient card but belong to a specific card
            // We can't filter these without card_id, so include them if no card number info
            if (!tx.senderCard && !tx.recipientCard && !senderMask && !receiverMask) return true;
          }

          return false;
        }),
      }))
      .filter(group => group.transactions.length > 0);
  }, [query.data, cardNumber]);

  return {
    ...query,
    data: filteredData,
  };
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
  
  // API groups only (real data)
  if (apiQuery.data && apiQuery.data.length > 0) {
    mergedGroups.push(...apiQuery.data);
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
