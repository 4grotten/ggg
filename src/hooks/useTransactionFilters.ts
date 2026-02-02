import { useMemo, useState } from "react";
import { TransactionGroup, Transaction } from "@/types/transaction";

export type FilterType = "all" | "income" | "expenses" | "transfers";

export const isIncomeTransaction = (tx: Transaction): boolean => {
  return tx.type === "topup" || 
         tx.type === "bank_transfer_incoming" || 
         (tx.type === "card_transfer" && !!tx.senderCard);
};

export const isExpenseTransaction = (tx: Transaction): boolean => {
  return !tx.type || 
         tx.type === "declined" || 
         tx.type === "card_activation" ||
         tx.type === "bank_transfer" ||
         tx.type === "crypto_withdrawal";
};

export const isTransferTransaction = (tx: Transaction): boolean => {
  return tx.type === "card_transfer" || 
         tx.type === "bank_transfer" || 
         tx.type === "bank_transfer_incoming" ||
         tx.type === "crypto_withdrawal";
};

export const filterTransactionGroups = (
  groups: TransactionGroup[],
  filter: FilterType
): TransactionGroup[] => {
  return groups
    .map((group) => {
      let filteredTxs = group.transactions;
      
      if (filter === "income") {
        filteredTxs = group.transactions.filter(isIncomeTransaction);
      } else if (filter === "expenses") {
        filteredTxs = group.transactions.filter(isExpenseTransaction);
      } else if (filter === "transfers") {
        filteredTxs = group.transactions.filter(isTransferTransaction);
      }
      
      return { ...group, transactions: filteredTxs };
    })
    .filter((group) => group.transactions.length > 0);
};

export const useTransactionFilters = (transactionGroups: TransactionGroup[]) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filteredGroups = useMemo(() => {
    return filterTransactionGroups(transactionGroups, activeFilter);
  }, [transactionGroups, activeFilter]);

  return {
    activeFilter,
    setActiveFilter,
    filteredGroups,
  };
};
