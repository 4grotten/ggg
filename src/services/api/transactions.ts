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
import { apiRequest, getAuthToken } from './apiClient';

// === Receipt type returned by GET /transactions/<id>/receipt/ ===
export interface TransactionReceipt {
  transaction_id: string;
  status: string;
  date_time: string;
  type: string;
  operation: string;
  // Common
  amount?: number;
  currency?: string;
  fee?: number;
  exchange_rate?: number | null;
  original_amount?: number | null;
  original_currency?: string | null;
  description?: string | null;
  merchant_name?: string | null;
  merchant_category?: string | null;
  reference_id?: string | null;
  card_id?: string | null;
  user_id?: string;
  // Crypto fields
  token?: string;
  network?: string;
  to_address_mask?: string;
  to_address?: string;
  from_address_mask?: string;
  deposit_address_mask?: string;
  network_and_token?: string;
  amount_crypto?: number;
  tx_hash?: string | null;
  fee_type?: string;
  total_debit?: number;
  credited_amount_aed?: number | null;
  // Card transfer fields
  sender_card_mask?: string;
  receiver_card_mask?: string;
  sender_name?: string | null;
  recipient_name?: string | null;
  total_amount?: number;
  // Bank topup fields
  transfer_rail?: string;
  reference_value?: string;
  sender_bank?: string | null;
  sender_iban_mask?: string | null;
  instructions?: Record<string, unknown>;
  deposit_iban_mask?: string | null;
  deposit_bank_name?: string | null;
  deposit_beneficiary?: string | null;
  // Bank withdrawal fields
  iban_mask?: string;
  beneficiary_iban?: string;
  beneficiary_name?: string;
  beneficiary_bank_name?: string;
  bank_name?: string;
  amount_aed?: number;
  fee_amount?: number;
  total_debit_aed?: number;
  from_card_id?: string | null;
  from_bank_account_id?: string | null;
  // Balance movements
  movements?: Array<{ account_type: string; amount: number; type: string }>;
  // Generic catch-all
  [key: string]: unknown;
}

// Mock data - will be replaced with actual API calls
const mockTransactionGroups: TransactionGroup[] = [
  {
    date: "17.01.2026",
    totalSpend: 0,
    transactions: [
      { id: "24", merchant: "Wallet Deposit", time: "16:00", amountUSDT: 5000.00, amountLocal: 5000.00, localCurrency: "USDT", color: "#22C55E", type: "crypto_deposit" as TransactionType, status: "settled", description: "TRx8K...Wp4mN2" },
      { id: "23", merchant: "Bank Transfer", time: "14:30", amountUSDT: 28000.00, amountLocal: 28000.00, localCurrency: "AED", color: "#22C55E", type: "bank_transfer_incoming" as TransactionType, status: "settled", senderName: "AL MAJID TRADING LLC", description: "AE07 0331 0100 4900 1234 001" },
      { id: "22", merchant: "Top up", time: "11:15", amountUSDT: 50410.96, amountLocal: 184000.00, localCurrency: "USDT", color: "#22C55E", type: "topup" as TransactionType, status: "settled", description: "TFVFkt...TxhX9L" },
    ],
  },
  {
    date: "12.01.2026",
    totalSpend: 3273.20,
    transactions: [
      { id: "21", merchant: "Bank Transfer", time: "19:45", amountUSDT: 1890.00, amountLocal: 1890.00, localCurrency: "AED", color: "#8B5CF6", type: "bank_transfer" as TransactionType, status: "settled", description: "AE07 0331 0100 4900 5678 002" },
      { id: "20", merchant: "Stablecoin Send", time: "18:20", amountUSDT: 280.00, amountLocal: 1033.20, localCurrency: "AED", color: "#10B981", type: "crypto_withdrawal" as TransactionType, status: "settled", description: "TQn9Y...3jM5rL" },
      { id: "19", merchant: "Card Transfer", time: "16:45", amountUSDT: 50.00, amountLocal: 50.00, localCurrency: "AED", color: "#22C55E", type: "card_transfer", senderName: "ANNA JOHNSON", senderCard: "8834", status: "settled" },
      { id: "17", merchant: "Card Transfer", time: "15:30", amountUSDT: 250.00, amountLocal: 250.00, localCurrency: "AED", color: "#007AFF", type: "card_transfer", recipientCard: "4521", status: "processing" },
      { id: "18", merchant: "Card Transfer", time: "12:15", amountUSDT: 100.00, amountLocal: 100.00, localCurrency: "AED", color: "#007AFF", type: "card_transfer", recipientCard: "8834", status: "settled" },
    ],
  },
  {
    date: "10.01.2026",
    totalSpend: 89.19,
    transactions: [
      { id: "1", merchant: "LIFE", time: "13:02", amountUSDT: 8.34, amountLocal: 29.87, localCurrency: "AED", color: "#3B82F6" },
      { id: "2", merchant: "ALAYA", time: "00:59", amountUSDT: 26.80, amountLocal: 96.00, localCurrency: "AED", color: "#22C55E" },
      { id: "3", merchant: "Ongaku", time: "00:17", amountUSDT: 54.05, amountLocal: 193.60, localCurrency: "AED", color: "#F97316" },
    ],
  },
  {
    date: "02.01.2026",
    totalSpend: 62.82,
    transactions: [
      { id: "4", merchant: "OPERA", time: "20:20", amountUSDT: 62.82, amountLocal: 225.00, localCurrency: "AED", color: "#A855F7" },
    ],
  },
  {
    date: "31.12.2025",
    totalSpend: 22.06,
    transactions: [
      { id: "5", merchant: "CELLAR", time: "20:48", amountUSDT: 22.06, amountLocal: 79.00, localCurrency: "AED", color: "#EAB308" },
      { id: "6", merchant: "Top up", time: "20:46", amountUSDT: 194.10, amountLocal: 200.00, localCurrency: "USDT", color: "#22C55E", type: "topup", status: "settled", description: "TFVFkt...TxhX9L" },
    ],
  },
  {
    date: "30.12.2025",
    totalSpend: 678.58,
    transactions: [
      { id: "7", merchant: "BHPC", time: "20:16", amountUSDT: 125.64, amountLocal: 450.00, localCurrency: "AED", color: "#EAB308" },
      { id: "8", merchant: "Bhpc", time: "20:15", amountUSDT: 142.90, amountLocal: 140.78, localCurrency: "$", color: "#EC4899", type: "declined" },
      { id: "9", merchant: "Bhpc", time: "20:14", amountUSDT: 157.49, amountLocal: 155.16, localCurrency: "$", color: "#EC4899", type: "declined" },
      { id: "10", merchant: "CELLAR", time: "19:53", amountUSDT: 116.54, amountLocal: 114.81, localCurrency: "$", color: "#22C55E" },
      { id: "11", merchant: "Service CEO", time: "07:58", amountUSDT: 11.59, amountLocal: 41.50, localCurrency: "AED", color: "#06B6D4" },
      { id: "12", merchant: "RESTAURANT", time: "03:21", amountUSDT: 424.81, amountLocal: 418.53, localCurrency: "AED", color: "#EF4444" },
      { id: "13", merchant: "Top up", time: "02:30", amountUSDT: 494.10, amountLocal: 500.00, localCurrency: "USDT", color: "#22C55E", type: "topup", status: "settled", description: "TFVFkt...TxhX9L" },
    ],
  },
  {
    date: "29.12.2025",
    totalSpend: 67.01,
    transactions: [
      { id: "14", merchant: "LOGS", time: "23:27", amountUSDT: 67.01, amountLocal: 240.00, localCurrency: "AED", color: "#3B82F6" },
    ],
  },
  {
    date: "21.12.2025",
    totalSpend: 204.55,
    transactions: [
      { id: "15", merchant: "Annual Card fee", time: "23:31", amountUSDT: 56.04, amountLocal: 204.55, localCurrency: "AED", color: "#CCFF00", type: "card_activation" },
      { id: "16", merchant: "Top up", time: "23:30", amountUSDT: 44.10, amountLocal: 50.00, localCurrency: "USDT", color: "#22C55E", type: "topup", status: "settled", description: "TFVFkt...TxhX9L" },
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

// =============================================
// REAL API CALLS (via cards-proxy → ueasycard.com)
// =============================================

// Raw transaction from backend GET /transactions/
export interface ApiTransaction {
  id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  created_at: string;
  updated_at?: string;
  description?: string;
  fee?: number | null;
  exchange_rate?: string | null;
  original_amount?: number | null;
  original_currency?: string | null;
  merchant_name?: string | null;
  merchant_category?: string | null;
  recipient_card?: string | null;
  sender_name?: string | null;
  sender_card?: string | null;
  reference_id?: string | null;
  card_id?: string | null;
  metadata?: Record<string, unknown> | null;
  // Legacy/extra fields
  card_mask?: string;
  to_address_mask?: string;
  from_address_mask?: string;
  network_and_token?: string;
  operation?: string;
  [key: string]: unknown;
}

/**
 * Fetch real transactions list from backend
 * GET /api/v1/transactions/
 */
export const fetchApiTransactions = async (): Promise<{
  data: ApiTransaction[] | null;
  error: string | null;
}> => {
  try {
    const result = await apiRequest<ApiTransaction[] | { results: ApiTransaction[] }>(
      `/transactions/all/`,
      { method: 'GET' },
      true
    );
    
    if (result.error) {
      console.warn('[Transactions API] List error:', result.error);
      return { data: null, error: result.error.detail || result.error.message || 'Failed to fetch' };
    }
    
    // Handle both array and paginated response formats
    const transactions = Array.isArray(result.data)
      ? result.data
      : (result.data as any)?.results || [];
    
    return { data: transactions, error: null };
  } catch (error) {
    console.error('[Transactions API] List fetch failed:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Network error' };
  }
};

/**
 * Convert API transaction to local Transaction format
 */
export const mapApiTransactionToLocal = (tx: ApiTransaction): Transaction => {
  const date = new Date(tx.created_at);
  const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  const dateStr = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  
  // Map backend type to frontend type
  const typeMap: Record<string, TransactionType> = {
    'topup': 'topup',
    'bank_topup': 'topup',
    'crypto_topup': 'topup',
    'card_transfer': 'card_transfer',
    'withdrawal': 'crypto_withdrawal',
    'crypto_withdrawal': 'crypto_withdrawal',
    'bank_withdrawal': 'bank_transfer',
    'bank_transfer': 'bank_transfer',
    'bank_transfer_incoming': 'bank_transfer_incoming',
    'crypto_deposit': 'crypto_deposit',
    'payment': 'payment',
    'card_payment': 'payment',
    'card_activation': 'card_activation',
    'internal_transfer': 'bank_transfer',
    'bank_to_card': 'bank_transfer',
    'card_to_bank': 'bank_transfer_incoming',
    'iban_to_card': 'bank_transfer',
    'iban_to_iban': 'bank_transfer',
    'transfer_out': 'bank_transfer',
    'transfer_in': 'bank_transfer_incoming',
    'declined': 'declined',
  };
  
  let mappedType = typeMap[tx.type] || 'payment' as TransactionType;
  
  // For internal_transfer, determine direction by amount sign
  if (tx.type === 'internal_transfer') {
    mappedType = tx.amount > 0 ? 'bank_transfer_incoming' : 'bank_transfer';
  }

  // Determine incoming/outgoing status
  // For card_transfer: API always returns positive amount, use operation or sender/recipient fields
  let isIncoming: boolean;
  if (mappedType === 'card_transfer') {
    // If operation explicitly says direction, use it
    const op = (tx.operation as string || '').toLowerCase();
    if (op.includes('incoming') || op.includes('received')) {
      isIncoming = true;
    } else if (op.includes('outgoing') || op.includes('sent')) {
      isIncoming = false;
    } else {
      // Fallback: if only sender_card present (no recipient) = incoming
      isIncoming = !tx.recipient_card && !!tx.sender_card;
    }
  } else {
    isIncoming = ['bank_transfer_incoming', 'crypto_deposit', 'topup'].includes(mappedType) 
      || (['transfer_in', 'card_to_bank'].includes(tx.type));
  }
  
  // Color based on type
  const colorMap: Record<string, string> = {
    'topup': '#22C55E',
    'crypto_deposit': '#22C55E',
    'bank_transfer_incoming': '#22C55E',
    'card_transfer': isIncoming ? '#22C55E' : '#007AFF',
    'crypto_withdrawal': '#10B981',
    'bank_transfer': '#8B5CF6',
    'payment': '#3B82F6',
    'card_activation': '#CCFF00',
    'declined': '#EC4899',
  };
  
  // Merchant name: prefer merchant_name from DB, then operation, then fallback
  const merchantFallback: Record<string, string> = {
    'topup': 'Top up',
    'bank_topup': 'Top up',
    'crypto_topup': 'Top up',
    'card_transfer': 'Card Transfer',
    'withdrawal': 'Stablecoin Send',
    'crypto_withdrawal': 'Stablecoin Send',
    'bank_withdrawal': 'Bank Transfer',
    'bank_transfer': 'Bank Transfer',
    'bank_transfer_incoming': 'Bank Transfer',
    'crypto_deposit': 'Wallet Deposit',
    'card_activation': 'Annual Card fee',
    'internal_transfer': 'IBAN to Card',
    'transfer_out': 'IBAN to Card',
    'transfer_in': 'Bank Transfer',
    'card_payment': tx.merchant_name || 'Payment',
  };

  const merchant = tx.merchant_name || (tx.operation as string) || merchantFallback[tx.type] || tx.type;

  // Compute USDT equivalent if exchange_rate is available
  const absAmount = Math.abs(tx.amount);
  let amountUSDT = absAmount;
  if (tx.original_amount != null) {
    amountUSDT = Math.abs(tx.original_amount);
  } else if (tx.exchange_rate) {
    const rate = parseFloat(tx.exchange_rate);
    if (rate > 0) amountUSDT = absAmount / rate;
  }

  return {
    id: `api_${tx.id}`,
    merchant,
    time,
    amountUSDT: parseFloat(amountUSDT.toFixed(2)),
    amountLocal: absAmount,
    localCurrency: tx.currency || 'AED',
    color: colorMap[mappedType] || '#3B82F6',
    type: mappedType,
    status: tx.status === 'completed' ? 'settled' : tx.status as any,
    senderName: tx.sender_name || undefined,
    senderCard: tx.sender_card || undefined,
    recipientCard: tx.recipient_card || undefined,
    description: tx.description || undefined,
    createdAt: tx.created_at,
    cardId: tx.card_id || undefined,
    fee: tx.fee != null ? Number(tx.fee) : undefined,
    metadata: { 
      apiDate: dateStr, 
      fromApi: true,
      isIncoming,
      merchantCategory: tx.merchant_category,
      referenceId: tx.reference_id,
      originalCurrency: tx.original_currency,
    },
  };
};

/**
 * Fetch real transactions and group by date
 */
export const fetchApiTransactionGroups = async (): Promise<TransactionGroup[]> => {
  const { data, error } = await fetchApiTransactions();
  if (error || !data || data.length === 0) return [];
  
  return groupApiTransactions(data);
};

/**
 * Fetch IBAN-only transactions from backend
 * GET /api/v1/transactions/iban/
 */
export const fetchIbanTransactions = async (): Promise<{
  data: ApiTransaction[] | null;
  error: string | null;
}> => {
  try {
    const result = await apiRequest<ApiTransaction[] | { results: ApiTransaction[] }>(
      `/transactions/iban/`,
      { method: 'GET' },
      true
    );
    
    if (result.error) {
      console.warn('[Transactions API] IBAN list error:', result.error);
      return { data: null, error: result.error.detail || result.error.message || 'Failed to fetch' };
    }
    
    const transactions = Array.isArray(result.data)
      ? result.data
      : (result.data as any)?.results || [];
    
    return { data: transactions, error: null };
  } catch (error) {
    console.error('[Transactions API] IBAN fetch failed:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Network error' };
  }
};

/**
 * Fetch IBAN transactions and group by date
 */
export const fetchIbanTransactionGroups = async (): Promise<TransactionGroup[]> => {
  const { data, error } = await fetchIbanTransactions();
  if (error || !data || data.length === 0) return [];
  
  return groupApiTransactions(data);
};

/**
 * Helper: group API transactions by date
 */
const groupApiTransactions = (data: ApiTransaction[]): TransactionGroup[] => {
  const mapped = data.map(mapApiTransactionToLocal);
  
  const groupMap = new Map<string, Transaction[]>();
  for (const tx of mapped) {
    const dateStr = (tx.metadata as any)?.apiDate || 'Unknown';
    if (!groupMap.has(dateStr)) groupMap.set(dateStr, []);
    groupMap.get(dateStr)!.push(tx);
  }
  
  const groups: TransactionGroup[] = [];
  for (const [date, transactions] of groupMap) {
    const totalSpend = transactions
      .filter(t => !['topup', 'crypto_deposit', 'bank_transfer_incoming'].includes(t.type || ''))
      .reduce((sum, t) => sum + t.amountLocal, 0);
    groups.push({ date, totalSpend, transactions });
  }
  
  return groups;
};

/**
 * Fetch transaction receipt from backend
 * GET /api/v1/transactions/<transaction_id>/receipt/
 */
export const fetchTransactionReceipt = async (
  transactionId: string
): Promise<{ data: TransactionReceipt | null; error: string | null }> => {
  try {
    const result = await apiRequest<TransactionReceipt>(
      `/transactions/${transactionId}/receipt/`,
      { method: 'GET' },
      true // rawEndpoint — skip /accounts prefix
    );
    
    if (result.error) {
      console.warn('[Transactions API] Receipt error:', result.error);
      return { data: null, error: result.error.detail || result.error.message || 'Failed to fetch receipt' };
    }
    
    return { data: result.data, error: null };
  } catch (error) {
    console.error('[Transactions API] Receipt fetch failed:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Network error' };
  }
};

// =============================================
// BANK WITHDRAWAL (Bank Wire to external bank)
// POST /api/v1/transactions/withdrawal/bank/
// =============================================

export interface BankWithdrawalRequest {
  from_card_id?: string;
  from_bank_account_id?: string;
  iban: string;
  beneficiary_name: string;
  bank_name: string;
  amount_aed: string;
}

export interface BankWithdrawalResponse {
  message: string;
  transaction_id: string;
  [key: string]: unknown;
}

/**
 * Submit bank withdrawal (wire transfer to external bank)
 * POST /api/v1/transactions/withdrawal/bank/
 */
export const submitBankWithdrawal = async (
  request: BankWithdrawalRequest
): Promise<{ success: boolean; data?: BankWithdrawalResponse; error?: string }> => {
  try {
    const result = await apiRequest<BankWithdrawalResponse>(
      `/transactions/withdrawal/bank/`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      true
    );

    if (result.error) {
      console.warn('[Transactions API] Bank withdrawal error:', result.error);
      return { success: false, error: result.error.detail || result.error.message || 'Withdrawal failed' };
    }

    if (result.data?.transaction_id) {
      return { success: true, data: result.data };
    }

    return { success: false, error: 'Unexpected response' };
  } catch (error) {
    console.error('[Transactions API] Bank withdrawal failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
};

// =============================================
// INTERNAL TRANSFER (Swap between own accounts)
// POST /api/v1/transactions/transfer/internal/
// =============================================

export interface InternalTransferRequest {
  from_type: 'card' | 'bank' | 'crypto';
  from_id: string;
  to_type: 'card' | 'bank' | 'crypto';
  to_id: string;
  amount: string;
}

export interface InternalTransferResponse {
  message: string;
  transaction_id: string;
  deducted_amount: string;
  fee: string;
  credited_amount: string;
}

/**
 * Execute internal transfer (swap between own accounts)
 * POST /api/v1/transactions/transfer/internal/
 */
export const submitInternalTransfer = async (
  request: InternalTransferRequest
): Promise<{ success: boolean; data?: InternalTransferResponse; error?: string }> => {
  try {
    const result = await apiRequest<InternalTransferResponse>(
      `/transactions/transfer/internal/`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      true // rawEndpoint
    );

    if (result.error) {
      console.warn('[Transactions API] Internal transfer error:', result.error);
      return { success: false, error: result.error.detail || result.error.message || 'Transfer failed' };
    }

    if (result.data?.transaction_id) {
      return { success: true, data: result.data };
    }

    return { success: false, error: 'Unexpected response' };
  } catch (error) {
    console.error('[Transactions API] Internal transfer failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
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
