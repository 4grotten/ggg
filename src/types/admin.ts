// Admin Settings Types

export type AppRole = 'admin' | 'moderator' | 'user';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface AdminSetting {
  id: string;
  category: 'exchange_rates' | 'fees' | 'limits';
  key: string;
  value: number;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

// Grouped settings for easier UI rendering
export interface ExchangeRates {
  usdt_to_aed_buy: number;
  usdt_to_aed_sell: number;
  aed_to_usd_buy: number;
  aed_to_usd_sell: number;
  usd_to_aed_buy: number;
  usd_to_aed_sell: number;
}

export interface Fees {
  top_up_crypto_flat: number;
  top_up_bank_percent: number;
  card_to_card_percent: number;
  bank_transfer_percent: number;
  network_fee_percent: number;
  currency_conversion_percent: number;
  virtual_card_annual: number;
  virtual_card_replacement: number;
  metal_card_annual: number;
  metal_card_replacement: number;
  virtual_account_opening: number;
}

export interface Limits {
  // Minimums
  top_up_crypto_min: number;
  top_up_bank_min: number;
  transfer_min: number;
  withdrawal_min: number;
  // Maximums
  top_up_crypto_max: number;
  top_up_bank_max: number;
  transfer_max: number;
  withdrawal_max: number;
  // Daily
  daily_top_up_limit: number;
  daily_transfer_limit: number;
  daily_withdrawal_limit: number;
  // Monthly
  monthly_top_up_limit: number;
  monthly_transfer_limit: number;
  monthly_withdrawal_limit: number;
}
