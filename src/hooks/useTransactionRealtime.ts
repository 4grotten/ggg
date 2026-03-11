import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

/**
 * Subscribes to realtime broadcast channel for transaction updates.
 * When a new transaction webhook fires, this auto-invalidates all
 * relevant React Query caches so the UI refreshes automatically.
 */
export const useTransactionRealtime = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  useEffect(() => {
    const channel = supabase
      .channel("transaction-updates")
      .on("broadcast", { event: "new_transaction" }, (payload) => {
        console.log("[realtime] New transaction broadcast:", payload);

        // Invalidate all financial data caches
        queryClient.invalidateQueries({ queryKey: ["cards"] });
        queryClient.invalidateQueries({ queryKey: ["balance"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["crypto-wallets"] });
        queryClient.invalidateQueries({ queryKey: ["bankAccounts"] });
        queryClient.invalidateQueries({ queryKey: ["wallet-summary"] });

        // Show toast notification
        const data = payload.payload;
        if (data?.amount && data?.currency) {
          const sign = data.event === "transaction_incoming" ? "+" : "";
          toast.info(
            t("notifications.newTransaction", "Новая транзакция"),
            {
              description: `${sign}${data.amount} ${data.currency}`,
              duration: 4000,
            }
          );
        } else {
          toast.info(t("notifications.dataUpdated", "Данные обновлены"), {
            duration: 3000,
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, t]);
};
