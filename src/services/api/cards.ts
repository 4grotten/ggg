// Cards API Service — connected to real backend

import { 
  Card, 
  CardsResponse, 
  CardDetailsResponse,
  CardBalanceResponse,
  FetchCardsParams,
  IbanAccount,
  IbanResponse,
  WalletSummaryData,
  WalletSummaryResponse,
} from '@/types/card';
import { getAuthToken } from './apiClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Cards API GET via edge function proxy (bypasses CORS)
 */
async function cardsApiGet<T>(endpoint: string): Promise<{ data: T | null; error: { message: string } | null }> {
  const url = `${SUPABASE_URL}/functions/v1/cards-proxy?endpoint=${encodeURIComponent(endpoint)}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
  const token = getAuthToken();
  if (token) {
    headers['x-backend-token'] = token;
  }
  try {
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      return { data: null, error: { message: `HTTP Error: ${response.status}` } };
    }
    const data = await response.json();
    return { data: data as T, error: null };
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'Network error' } };
  }
}

// Response type from GET /cards/balances/
interface BalancesApiResponse {
  user_id: number;
  total_balance_aed: number;
  cards: Array<{
    card_id: number;
    type: string;
    balance: number;
    last_four_digits: string;
    status: string;
  }>;
}

/**
 * Fetch all cards and balances from GET /cards/balances/
 */
const fetchBalancesFromApi = async (): Promise<BalancesApiResponse | null> => {
  const response = await cardsApiGet<BalancesApiResponse>('/cards/balances/');
  if (response.error || !response.data) {
    console.error('Error fetching balances:', response.error);
    return null;
  }
  return response.data;
};

/**
 * Map API card to frontend Card type
 */
const mapApiCard = (apiCard: BalancesApiResponse['cards'][number]): Card => ({
  id: String(apiCard.card_id),
  type: (apiCard.type === 'metal' ? 'metal' : 'virtual') as Card['type'],
  name: apiCard.type === 'metal' ? 'Visa Metal' : 'Visa Virtual',
  isActive: apiCard.status === 'active',
  balance: apiCard.balance,
  status: apiCard.status as Card['status'],
  lastFourDigits: apiCard.last_four_digits,
});

/**
 * Fetch all cards for user
 */
export const fetchCards = async (
  params?: FetchCardsParams
): Promise<CardsResponse> => {
  try {
    const data = await fetchBalancesFromApi();
    
    if (!data) {
      return { success: false, data: [], error: 'Failed to fetch cards' };
    }

    let cards = data.cards.map(mapApiCard);
    
    if (params?.type) {
      cards = cards.filter(c => c.type === params.type);
    }
    if (params?.status) {
      cards = cards.filter(c => c.status === params.status);
    }
    
    return { success: true, data: cards };
  } catch (error) {
    console.error('Error fetching cards:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch cards',
    };
  }
};

/**
 * Fetch single card details
 */
export const fetchCardById = async (
  id: string
): Promise<CardDetailsResponse> => {
  try {
    const data = await fetchBalancesFromApi();
    if (!data) {
      return { success: false, data: null, error: 'Failed to fetch card' };
    }
    
    const apiCard = data.cards.find(c => String(c.card_id) === id);
    
    return {
      success: !!apiCard,
      data: apiCard ? mapApiCard(apiCard) : null,
      error: apiCard ? undefined : 'Card not found',
    };
  } catch (error) {
    console.error('Error fetching card:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch card',
    };
  }
};

/**
 * Fetch card balance
 */
export const fetchCardBalance = async (
  id: string
): Promise<CardBalanceResponse> => {
  try {
    const data = await fetchBalancesFromApi();
    if (!data) {
      return { success: false, balance: 0, currency: 'AED', error: 'Failed to fetch balance' };
    }
    
    const apiCard = data.cards.find(c => String(c.card_id) === id);
    
    return {
      success: !!apiCard,
      balance: apiCard?.balance || 0,
      currency: 'AED',
      error: apiCard ? undefined : 'Card not found',
    };
  } catch (error) {
    console.error('Error fetching card balance:', error);
    return {
      success: false,
      balance: 0,
      currency: 'AED',
      error: error instanceof Error ? error.message : 'Failed to fetch balance',
    };
  }
};

/**
 * Get total balance across all cards
 */
export const fetchTotalBalance = async (): Promise<CardBalanceResponse> => {
  try {
    const data = await fetchBalancesFromApi();
    
    if (!data) {
      return { success: false, balance: 0, currency: 'AED', error: 'Failed to fetch total balance' };
    }
    
    return {
      success: true,
      balance: data.total_balance_aed,
      currency: 'AED',
    };
  } catch (error) {
    console.error('Error fetching total balance:', error);
    return {
      success: false,
      balance: 0,
      currency: 'AED',
      error: error instanceof Error ? error.message : 'Failed to fetch total balance',
    };
  }
};

// ─── NEW: Wallet Summary ────────────────────────────────────────

/**
 * Fetch wallet summary: IBAN + all cards in one call
 * GET /cards/wallet/summary/
 */
export const fetchWalletSummary = async (): Promise<WalletSummaryResponse> => {
  try {
    const response = await cardsApiGet<WalletSummaryData>('/cards/wallet/summary/');
    if (response.error || !response.data) {
      return { success: false, data: null, error: response.error?.message || 'Failed to fetch wallet summary' };
    }
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching wallet summary:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch wallet summary',
    };
  }
};

// ─── NEW: IBAN / Bank Account ───────────────────────────────────

/**
 * Fetch IBAN bank account details
 * GET /cards/accounts/IBAN_AED/
 */
export const fetchIban = async (): Promise<IbanResponse> => {
  try {
    const response = await cardsApiGet<IbanAccount>('/cards/accounts/IBAN_AED/');
    if (response.error || !response.data) {
      return { success: false, data: null, error: response.error?.message || 'Failed to fetch IBAN' };
    }
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching IBAN:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch IBAN',
    };
  }
};

// ─── NEW: Cards List ────────────────────────────────────────────

/**
 * Fetch cards list (separate endpoint)
 * GET /cards/cards/
 */
export const fetchCardsList = async (): Promise<CardsResponse> => {
  try {
    const response = await cardsApiGet<{ cards: BalancesApiResponse['cards'] }>('/cards/cards/');
    if (response.error || !response.data) {
      return { success: false, data: [], error: response.error?.message || 'Failed to fetch cards list' };
    }
    const cards = (response.data.cards || []).map(mapApiCard);
    return { success: true, data: cards };
  } catch (error) {
    console.error('Error fetching cards list:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch cards list',
    };
  }
};

// ─── NEW: Bank Accounts ─────────────────────────────────────────

export interface BankAccount {
  id: string;
  iban: string;
  bank_name: string;
  beneficiary: string;
  balance: string;
  is_active: boolean;
}

/**
 * Fetch user bank accounts
 * GET /transactions/bank-accounts/
 */
export const fetchBankAccounts = async (): Promise<{ success: boolean; data: BankAccount[]; error?: string }> => {
  try {
    const response = await cardsApiGet<BankAccount[]>('/transactions/bank-accounts/');
    if (response.error || !response.data) {
      return { success: false, data: [], error: response.error?.message || 'Failed to fetch bank accounts' };
    }
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch bank accounts',
    };
  }
};

// ─── NEW: Crypto Wallets ────────────────────────────────────────

export interface CryptoWallet {
  id: string;
  network: string;
  token: string;
  address: string;
  balance: string;
  is_active: boolean;
}

/**
 * Fetch user crypto wallets
 * GET /transactions/crypto-wallets/
 */
export const fetchCryptoWallets = async (): Promise<{ success: boolean; data: CryptoWallet[]; error?: string }> => {
  try {
    const response = await cardsApiGet<CryptoWallet[]>('/transactions/crypto-wallets/');
    if (response.error || !response.data) {
      return { success: false, data: [], error: response.error?.message || 'Failed to fetch crypto wallets' };
    }
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching crypto wallets:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch crypto wallets',
    };
  }
};
