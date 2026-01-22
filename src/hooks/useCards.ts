import { useQuery } from '@tanstack/react-query';
import { 
  fetchCards, 
  fetchCardById, 
  fetchCardBalance,
  fetchTotalBalance 
} from '@/services/api/cards';
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
};

/**
 * Hook to fetch all cards
 */
export const useCards = (params?: FetchCardsParams) => {
  return useQuery({
    queryKey: cardKeys.list(params),
    queryFn: () => fetchCards(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch single card details
 */
export const useCardDetails = (id: string) => {
  return useQuery({
    queryKey: cardKeys.detail(id),
    queryFn: () => fetchCardById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Hook to fetch card balance
 */
export const useCardBalance = (id: string) => {
  return useQuery({
    queryKey: cardKeys.balance(id),
    queryFn: () => fetchCardBalance(id),
    enabled: !!id,
    staleTime: 1000 * 30, // 30 seconds - balance should refresh more often
    refetchInterval: 1000 * 60, // Refetch every minute
  });
};

/**
 * Hook to fetch total balance across all cards
 */
export const useTotalBalance = () => {
  return useQuery({
    queryKey: cardKeys.totalBalance(),
    queryFn: fetchTotalBalance,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });
};
