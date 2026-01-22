// Transaction types for API integration

export type TransactionType = 
  | "payment" 
  | "topup" 
  | "declined" 
  | "card_activation" 
  | "card_transfer"
  | "bank_transfer"
  | "bank_transfer_incoming"
  | "crypto_withdrawal";

export type TransactionStatus = 
  | "pending" 
  | "processing" 
  | "settled" 
  | "failed" 
  | "cancelled";

export interface Transaction {
  id: string;
  merchant: string;
  time: string;
  amountUSDT: number;
  amountLocal: number;
  localCurrency: string;
  color: string;
  type?: TransactionType;
  recipientCard?: string;
  senderName?: string;
  senderCard?: string;
  status?: TransactionStatus;
  createdAt?: string;
  updatedAt?: string;
  cardId?: string;
  userId?: string;
  fee?: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface TransactionGroup {
  date: string;
  totalSpend: number;
  transactions: Transaction[];
}

// API Request types
export interface FetchTransactionsParams {
  userId?: string;
  cardId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// API Response types
export interface TransactionsResponse {
  success: boolean;
  data: Transaction[];
  groups?: TransactionGroup[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: string;
}

export interface TransactionDetailsResponse {
  success: boolean;
  data: Transaction | null;
  error?: string;
}
