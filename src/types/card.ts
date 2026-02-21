// Card types for API integration

export type CardType = "virtual" | "metal";

export type CardStatus = "active" | "inactive" | "blocked" | "expired";

export interface Card {
  id: string;
  type: CardType;
  name: string;
  isActive: boolean;
  balance: number;
  status?: CardStatus;
  lastFourDigits?: string;
  expiryDate?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// API Request types
export interface FetchCardsParams {
  userId?: string;
  type?: CardType;
  status?: CardStatus;
}

// API Response types
export interface CardsResponse {
  success: boolean;
  data: Card[];
  error?: string;
}

export interface CardDetailsResponse {
  success: boolean;
  data: Card | null;
  error?: string;
}

export interface CardBalanceResponse {
  success: boolean;
  balance: number;
  currency: string;
  error?: string;
}

// IBAN / Bank Account from GET /cards/accounts/IBAN_AED/
export interface IbanAccount {
  iban: string;
  bank_name?: string;
  account_holder?: string;
  currency?: string;
  balance?: number;
}

export interface IbanResponse {
  success: boolean;
  data: IbanAccount | null;
  error?: string;
}

// Wallet Summary from GET /cards/wallet/summary/
export interface WalletSummaryData {
  bank_account: IbanAccount | null;
  cards: Array<{
    card_id: number;
    type: string;
    balance: number;
    last_four_digits: string;
    status: string;
    name?: string;
  }>;
  total_balance_aed: number;
}

export interface WalletSummaryResponse {
  success: boolean;
  data: WalletSummaryData | null;
  error?: string;
}
