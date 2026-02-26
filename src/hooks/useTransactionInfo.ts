import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/services/api/apiClient";

export interface TransactionInfo {
  fee_type: string; // "percent" | "flat"
  fee_value: number;
  min_amount: number;
  max_amount: number;
  exchange_rate: number;
  currency_from: string;
  currency_to: string;
}

/**
 * Fetch transaction fee/limit info from backend.
 * @param type - transaction type, e.g. "card_to_crypto", "bank_to_crypto", "crypto_withdrawal"
 */
export function useTransactionInfo(type: string | null) {
  return useQuery<TransactionInfo | null>({
    queryKey: ["transaction-info", type],
    queryFn: async () => {
      if (!type) return null;
      const res = await apiRequest<TransactionInfo>(
        `/transactions/info/?type=${encodeURIComponent(type)}`,
        { method: "GET" },
        true
      );
      return res.data ?? null;
    },
    enabled: !!type,
    staleTime: 5 * 60 * 1000, // cache 5 min
  });
}
