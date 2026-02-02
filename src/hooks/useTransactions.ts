import { useQuery } from '@tanstack/react-query';
import { 
  fetchTransactions, 
  fetchTransactionGroups, 
  fetchTransactionById 
} from '@/services/api/transactions';
import { FetchTransactionsParams } from '@/types/transaction';

// Query keys for caching
export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (params?: FetchTransactionsParams) => [...transactionKeys.lists(), params] as const,
  groups: () => [...transactionKeys.all, 'groups'] as const,
  groupsWithParams: (params?: FetchTransactionsParams) => [...transactionKeys.groups(), params] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
};

/**
 * Hook to fetch transactions list
 */
export const useTransactions = (params?: FetchTransactionsParams) => {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => fetchTransactions(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch transactions grouped by date
 */
export const useTransactionGroups = (params?: FetchTransactionsParams) => {
  return useQuery({
    queryKey: transactionKeys.groupsWithParams(params),
    queryFn: () => fetchTransactionGroups(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch single transaction details
 */
export const useTransactionDetails = (id: string) => {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => fetchTransactionById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};
