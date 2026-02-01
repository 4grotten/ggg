/**
 * Types for saved contacts feature
 */

export interface PaymentMethod {
  id: string;
  type: 'card' | 'iban' | 'crypto' | 'paypal' | 'applepay' | 'googlepay' | 'wallet' | 'other';
  label: string;
  value: string;
  network?: string; // For crypto: TRC20, ERC20, etc.
}

export interface ContactSocialLink {
  id: string;
  networkId: string;
  networkName: string;
  url: string;
}

export interface SavedContact {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  email?: string;
  company?: string;
  position?: string;
  avatar_url?: string;
  notes?: string;
  payment_methods: PaymentMethod[];
  social_links: ContactSocialLink[];
  created_at: string;
  updated_at: string;
}

export interface SavedContactInsert {
  user_id: string;
  full_name: string;
  phone?: string;
  email?: string;
  company?: string;
  position?: string;
  avatar_url?: string;
  notes?: string;
  payment_methods?: PaymentMethod[];
  social_links?: ContactSocialLink[];
}

export interface SavedContactUpdate {
  full_name?: string;
  phone?: string;
  email?: string;
  company?: string;
  position?: string;
  avatar_url?: string;
  notes?: string;
  payment_methods?: PaymentMethod[];
  social_links?: ContactSocialLink[];
}

// Payment method type options
export const PAYMENT_METHOD_TYPES = [
  { value: 'card', label: 'Card Number', icon: 'CreditCard' },
  { value: 'iban', label: 'IBAN', icon: 'Building2' },
  { value: 'crypto', label: 'Crypto Wallet', icon: 'Wallet' },
  { value: 'paypal', label: 'PayPal', icon: 'Wallet' },
  { value: 'wallet', label: 'E-Wallet', icon: 'Smartphone' },
  { value: 'other', label: 'Other', icon: 'MoreHorizontal' },
] as const;

// Crypto networks
export const CRYPTO_NETWORKS = [
  { value: 'trc20', label: 'TRC20 (Tron)' },
  { value: 'erc20', label: 'ERC20 (Ethereum)' },
  { value: 'bep20', label: 'BEP20 (BSC)' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'solana', label: 'Solana' },
  { value: 'btc', label: 'Bitcoin' },
  { value: 'ltc', label: 'Litecoin' },
] as const;
