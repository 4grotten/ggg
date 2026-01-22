// Transactions API Service

import { 
  Transaction, 
  TransactionGroup, 
  TransactionsResponse, 
  TransactionDetailsResponse,
  FetchTransactionsParams,
  TransactionType 
} from '@/types/transaction';
import { buildApiUrl, ENDPOINTS } from './config';

// Mock data - will be replaced with actual API calls
const mockTransactionGroups: TransactionGroup[] = [
  {
    date: "January 17",
    totalSpend: 0,
    transactions: [
      { id: "23", merchant: "Bank Transfer", time: "14:30", amountUSDT: 28000.00, amountLocal: 28000.00, localCurrency: "AED", color: "#22C55E", type: "bank_transfer_incoming" as TransactionType, status: "settled" },
      { id: "22", merchant: "Top up", time: "11:15", amountUSDT: 50410.96, amountLocal: 184000.00, localCurrency: "USDT", color: "#22C55E", type: "topup" as TransactionType, status: "settled" },
    ],
  },
  {
    date: "January 12",
    totalSpend: 3273.20,
    transactions: [
      { id: "21", merchant: "Bank Transfer", time: "19:45", amountUSDT: 1890.00, amountLocal: 1890.00, localCurrency: "AED", color: "#8B5CF6", type: "bank_transfer" as TransactionType, status: "settled" },
      { id: "20", merchant: "Stablecoin Send", time: "18:20", amountUSDT: 280.00, amountLocal: 1033.20, localCurrency: "AED", color: "#10B981", type: "crypto_withdrawal" as TransactionType, status: "settled" },
      { id: "19", merchant: "Card Transfer", time: "16:45", amountUSDT: 50.00, amountLocal: 50.00, localCurrency: "AED", color: "#22C55E", type: "card_transfer", senderName: "ANNA JOHNSON", senderCard: "8834", status: "settled" },
      { id: "17", merchant: "Card Transfer", time: "15:30", amountUSDT: 250.00, amountLocal: 250.00, localCurrency: "AED", color: "#007AFF", type: "card_transfer", recipientCard: "4521", status: "processing" },
      { id: "18", merchant: "Card Transfer", time: "12:15", amountUSDT: 100.00, amountLocal: 100.00, localCurrency: "AED", color: "#007AFF", type: "card_transfer", recipientCard: "8834", status: "settled" },
    ],
  },
  {
    date: "January 10",
    totalSpend: 89.19,
    transactions: [
      { id: "1", merchant: "LIFE", time: "13:02", amountUSDT: 8.34, amountLocal: 29.87, localCurrency: "AED", color: "#3B82F6" },
      { id: "2", merchant: "ALAYA", time: "00:59", amountUSDT: 26.80, amountLocal: 96.00, localCurrency: "AED", color: "#22C55E" },
      { id: "3", merchant: "Ongaku", time: "00:17", amountUSDT: 54.05, amountLocal: 193.60, localCurrency: "AED", color: "#F97316" },
    ],
  },
  {
    date: "January 02",
    totalSpend: 62.82,
    transactions: [
      { id: "4", merchant: "OPERA", time: "20:20", amountUSDT: 62.82, amountLocal: 225.00, localCurrency: "AED", color: "#A855F7" },
    ],
  },
  {
    date: "December 31",
    totalSpend: 22.06,
    transactions: [
      { id: "5", merchant: "CELLAR", time: "20:48", amountUSDT: 22.06, amountLocal: 79.00, localCurrency: "AED", color: "#EAB308" },
      { id: "6", merchant: "Top up", time: "20:46", amountUSDT: 194.10, amountLocal: 200.00, localCurrency: "USDT", color: "#22C55E", type: "topup", status: "settled" },
    ],
  },
  {
    date: "December 30",
    totalSpend: 678.58,
    transactions: [
      { id: "7", merchant: "BHPC", time: "20:16", amountUSDT: 125.64, amountLocal: 450.00, localCurrency: "AED", color: "#EAB308" },
      { id: "8", merchant: "Bhpc", time: "20:15", amountUSDT: 142.90, amountLocal: 140.78, localCurrency: "$", color: "#EC4899", type: "declined" },
      { id: "9", merchant: "Bhpc", time: "20:14", amountUSDT: 157.49, amountLocal: 155.16, localCurrency: "$", color: "#EC4899", type: "declined" },
      { id: "10", merchant: "CELLAR", time: "19:53", amountUSDT: 116.54, amountLocal: 114.81, localCurrency: "$", color: "#22C55E" },
      { id: "11", merchant: "Service CEO", time: "07:58", amountUSDT: 11.59, amountLocal: 41.50, localCurrency: "AED", color: "#06B6D4" },
      { id: "12", merchant: "RESTAURANT", time: "03:21", amountUSDT: 424.81, amountLocal: 418.53, localCurrency: "AED", color: "#EF4444" },
      { id: "13", merchant: "Top up", time: "02:30", amountUSDT: 494.10, amountLocal: 500.00, localCurrency: "USDT", color: "#22C55E", type: "topup", status: "settled" },
    ],
  },
  {
    date: "December 29",
    totalSpend: 67.01,
    transactions: [
      { id: "14", merchant: "LOGS", time: "23:27", amountUSDT: 67.01, amountLocal: 240.00, localCurrency: "AED", color: "#3B82F6" },
    ],
  },
  {
    date: "December 21",
    totalSpend: 5.00,
    transactions: [
      { id: "15", merchant: "Annual Card fee", time: "23:31", amountUSDT: 183.50, amountLocal: 183.50, localCurrency: "AED", color: "#CCFF00", type: "card_activation" },
      { id: "16", merchant: "Top up", time: "23:30", amountUSDT: 44.10, amountLocal: 50.00, localCurrency: "USDT", color: "#22C55E", type: "topup", status: "settled" },
    ],
  },
];

// Simulate API delay
const simulateApiDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch transactions with optional filters
 * Replace mock implementation with actual API call when backend is ready
 */
export const fetchTransactions = async (
  params?: FetchTransactionsParams
): Promise<TransactionsResponse> => {
  try {
    // TODO: Replace with actual API call
    // const response = await fetch(buildApiUrl(ENDPOINTS.transactions.list), {
    //   method: 'GET',
    //   headers: API_CONFIG.headers,
    // });
    // return await response.json();

    await simulateApiDelay();
    
    let allTransactions = mockTransactionGroups.flatMap(g => g.transactions);
    
    // Apply filters
    if (params?.type) {
      allTransactions = allTransactions.filter(t => t.type === params.type);
    }
    if (params?.status) {
      allTransactions = allTransactions.filter(t => t.status === params.status);
    }
    if (params?.cardId) {
      allTransactions = allTransactions.filter(t => t.cardId === params.cardId);
    }
    
    // Apply pagination
    const limit = params?.limit || 50;
    const offset = params?.offset || 0;
    const paginatedTransactions = allTransactions.slice(offset, offset + limit);
    
    return {
      success: true,
      data: paginatedTransactions,
      pagination: {
        total: allTransactions.length,
        limit,
        offset,
        hasMore: offset + limit < allTransactions.length,
      },
    };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch transactions',
    };
  }
};

/**
 * Fetch transactions grouped by date
 * Replace mock implementation with actual API call when backend is ready
 */
export const fetchTransactionGroups = async (
  params?: FetchTransactionsParams
): Promise<TransactionsResponse> => {
  try {
    // TODO: Replace with actual API call
    // const response = await fetch(buildApiUrl(ENDPOINTS.transactions.grouped), {
    //   method: 'GET',
    //   headers: API_CONFIG.headers,
    // });
    // return await response.json();

    await simulateApiDelay();
    
    return {
      success: true,
      data: [],
      groups: mockTransactionGroups,
    };
  } catch (error) {
    console.error('Error fetching transaction groups:', error);
    return {
      success: false,
      data: [],
      groups: [],
      error: error instanceof Error ? error.message : 'Failed to fetch transactions',
    };
  }
};

/**
 * Fetch single transaction details
 * Replace mock implementation with actual API call when backend is ready
 */
export const fetchTransactionById = async (
  id: string
): Promise<TransactionDetailsResponse> => {
  try {
    // TODO: Replace with actual API call
    // const response = await fetch(buildApiUrl(ENDPOINTS.transactions.details(id)), {
    //   method: 'GET',
    //   headers: API_CONFIG.headers,
    // });
    // return await response.json();

    await simulateApiDelay();
    
    const allTransactions = mockTransactionGroups.flatMap(g => g.transactions);
    const transaction = allTransactions.find(t => t.id === id);
    
    return {
      success: !!transaction,
      data: transaction || null,
      error: transaction ? undefined : 'Transaction not found',
    };
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch transaction',
    };
  }
};
