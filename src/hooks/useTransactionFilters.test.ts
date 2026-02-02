import { describe, it, expect } from "vitest";
import {
  isIncomeTransaction,
  isExpenseTransaction,
  isTransferTransaction,
  filterTransactionGroups,
} from "./useTransactionFilters";
import { Transaction, TransactionGroup } from "@/types/transaction";

// Helper to create mock transaction
const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: "tx-1",
  merchant: "Test Merchant",
  time: "10:00",
  amountUSDT: 100,
  amountLocal: 367,
  localCurrency: "AED",
  color: "#10b981",
  status: "settled",
  ...overrides,
});

// Helper to create mock transaction group
const createMockGroup = (transactions: Transaction[], date = "2024-01-15"): TransactionGroup => ({
  date,
  totalSpend: transactions.reduce((sum, tx) => sum + tx.amountUSDT, 0),
  transactions,
});

describe("isIncomeTransaction", () => {
  it("should return true for topup transactions", () => {
    const tx = createMockTransaction({ type: "topup" });
    expect(isIncomeTransaction(tx)).toBe(true);
  });

  it("should return true for bank_transfer_incoming transactions", () => {
    const tx = createMockTransaction({ type: "bank_transfer_incoming" });
    expect(isIncomeTransaction(tx)).toBe(true);
  });

  it("should return true for card_transfer with senderCard", () => {
    const tx = createMockTransaction({ 
      type: "card_transfer", 
      senderCard: "1234 **** **** 5678"
    });
    expect(isIncomeTransaction(tx)).toBe(true);
  });

  it("should return false for card_transfer without senderCard", () => {
    const tx = createMockTransaction({ type: "card_transfer" });
    expect(isIncomeTransaction(tx)).toBe(false);
  });

  it("should return false for expense transactions", () => {
    const tx = createMockTransaction({ type: "bank_transfer" });
    expect(isIncomeTransaction(tx)).toBe(false);
  });
});

describe("isExpenseTransaction", () => {
  it("should return true for transactions without type", () => {
    const tx = createMockTransaction({ type: undefined });
    expect(isExpenseTransaction(tx)).toBe(true);
  });

  it("should return true for declined transactions", () => {
    const tx = createMockTransaction({ type: "declined" });
    expect(isExpenseTransaction(tx)).toBe(true);
  });

  it("should return true for card_activation transactions", () => {
    const tx = createMockTransaction({ type: "card_activation" });
    expect(isExpenseTransaction(tx)).toBe(true);
  });

  it("should return true for bank_transfer transactions", () => {
    const tx = createMockTransaction({ type: "bank_transfer" });
    expect(isExpenseTransaction(tx)).toBe(true);
  });

  it("should return true for crypto_withdrawal transactions", () => {
    const tx = createMockTransaction({ type: "crypto_withdrawal" });
    expect(isExpenseTransaction(tx)).toBe(true);
  });

  it("should return false for topup transactions", () => {
    const tx = createMockTransaction({ type: "topup" });
    expect(isExpenseTransaction(tx)).toBe(false);
  });
});

describe("isTransferTransaction", () => {
  it("should return true for card_transfer transactions", () => {
    const tx = createMockTransaction({ type: "card_transfer" });
    expect(isTransferTransaction(tx)).toBe(true);
  });

  it("should return true for bank_transfer transactions", () => {
    const tx = createMockTransaction({ type: "bank_transfer" });
    expect(isTransferTransaction(tx)).toBe(true);
  });

  it("should return true for bank_transfer_incoming transactions", () => {
    const tx = createMockTransaction({ type: "bank_transfer_incoming" });
    expect(isTransferTransaction(tx)).toBe(true);
  });

  it("should return true for crypto_withdrawal transactions", () => {
    const tx = createMockTransaction({ type: "crypto_withdrawal" });
    expect(isTransferTransaction(tx)).toBe(true);
  });

  it("should return false for topup transactions", () => {
    const tx = createMockTransaction({ type: "topup" });
    expect(isTransferTransaction(tx)).toBe(false);
  });
});

describe("filterTransactionGroups", () => {
  const topupTx = createMockTransaction({ id: "1", type: "topup" });
  const bankTransferTx = createMockTransaction({ id: "2", type: "bank_transfer" });
  const cardTransferTx = createMockTransaction({ id: "3", type: "card_transfer" });
  const incomingTransferTx = createMockTransaction({ 
    id: "4", 
    type: "card_transfer", 
    senderCard: "1234 **** **** 5678"
  });

  const groups: TransactionGroup[] = [
    createMockGroup([topupTx, bankTransferTx], "2024-01-15"),
    createMockGroup([cardTransferTx, incomingTransferTx], "2024-01-14"),
  ];

  it("should return all transactions when filter is 'all'", () => {
    const result = filterTransactionGroups(groups, "all");
    expect(result).toHaveLength(2);
    expect(result[0].transactions).toHaveLength(2);
    expect(result[1].transactions).toHaveLength(2);
  });

  it("should filter only income transactions", () => {
    const result = filterTransactionGroups(groups, "income");
    // Group 1: topup is income
    // Group 2: incomingTransferTx (card_transfer with senderCard) is income
    expect(result).toHaveLength(2);
    expect(result[0].transactions).toHaveLength(1);
    expect(result[0].transactions[0].id).toBe("1");
    expect(result[1].transactions).toHaveLength(1);
    expect(result[1].transactions[0].id).toBe("4");
  });

  it("should filter only expense transactions", () => {
    const result = filterTransactionGroups(groups, "expenses");
    // Group 1: bankTransferTx is expense
    // Group 2: none match expense criteria (card_transfer without senderCard is not in expense list)
    expect(result).toHaveLength(1);
    expect(result[0].transactions).toHaveLength(1);
    expect(result[0].transactions[0].id).toBe("2");
  });

  it("should filter only transfer transactions", () => {
    const result = filterTransactionGroups(groups, "transfers");
    // Group 1: bankTransferTx is transfer
    // Group 2: cardTransferTx and incomingTransferTx are transfers
    expect(result).toHaveLength(2);
    expect(result[0].transactions).toHaveLength(1);
    expect(result[1].transactions).toHaveLength(2);
  });

  it("should remove empty groups after filtering", () => {
    const groupsWithEmptyResult: TransactionGroup[] = [
      createMockGroup([topupTx], "2024-01-15"),
    ];
    const result = filterTransactionGroups(groupsWithEmptyResult, "expenses");
    expect(result).toHaveLength(0);
  });
});
