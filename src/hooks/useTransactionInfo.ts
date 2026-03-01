import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/services/api/apiClient";

export interface TransactionInfo {
  fee_type: string; // "percent" | "flat" | "composite"
  fee_value: number;
  service_fee_percent?: number;
  network_fee_flat?: number;
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
      const res = await apiRequest<any>(
        `/transactions/info/?type=${encodeURIComponent(type)}`,
        { method: "GET" },
        true
      );
      const data = res.data;
      if (!data) return null;

      const svcPct = data.service_fee_percent ?? 0;
      const svcFlat = data.service_fee_flat ?? 0;
      const netPct = data.network_fee_percent ?? 0;
      const netFlat = data.network_fee_flat ?? 0;

      // Determine composite fee type
      const hasPercent = svcPct > 0 || netPct > 0;
      const hasFlat = svcFlat > 0 || netFlat > 0;

      let fee_type: string;
      let fee_value: number;

      if (hasPercent && hasFlat) {
        // Composite: percent + flat (e.g. crypto_to_card: 1% + 5.90)
        fee_type = "composite";
        fee_value = svcPct || netPct; // percent part as main value
      } else if (hasPercent) {
        fee_type = "percent";
        fee_value = svcPct || netPct;
      } else if (hasFlat) {
        fee_type = "flat";
        fee_value = svcFlat || netFlat;
      } else {
        fee_type = "percent";
        fee_value = 0;
      }

      return {
        fee_type,
        fee_value,
        service_fee_percent: svcPct,
        network_fee_flat: netFlat,
        min_amount: data.min_amount ?? 0,
        max_amount: data.max_amount ?? Infinity,
        exchange_rate: data.exchange_rate ?? 0,
        currency_from: data.currency_from ?? "AED",
        currency_to: data.currency_to ?? "AED",
      };
    },
    enabled: !!type,
    staleTime: 5 * 60 * 1000,
  });
}
