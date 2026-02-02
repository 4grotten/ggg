import React, { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminSetting } from "@/types/admin";

// Fallback values (used when DB is unavailable)
const FALLBACK_SETTINGS: Record<string, Record<string, number>> = {
  exchange_rates: {
    usdt_to_aed_buy: 3.65,
    usdt_to_aed_sell: 3.69,
    aed_to_usd_buy: 0.2723,
    aed_to_usd_sell: 0.2710,
    usd_to_aed_buy: 3.6725,
    usd_to_aed_sell: 3.69,
  },
  fees: {
    top_up_crypto_flat: 5.90,
    top_up_bank_percent: 1.5,
    card_to_card_percent: 1.0,
    bank_transfer_percent: 2.0,
    network_fee_percent: 1.0,
    currency_conversion_percent: 1.5,
    virtual_card_annual: 183.00,
    virtual_card_replacement: 183.00,
    metal_card_annual: 183.00,
    metal_card_replacement: 183.00,
    virtual_account_opening: 183.00,
  },
  limits: {
    top_up_crypto_min: 15.00,
    top_up_bank_min: 50.00,
    transfer_min: 10.00,
    withdrawal_min: 50.00,
    top_up_crypto_max: 50000.00,
    top_up_bank_max: 100000.00,
    transfer_max: 50000.00,
    withdrawal_max: 50000.00,
    daily_top_up_limit: 100000.00,
    daily_transfer_limit: 100000.00,
    daily_withdrawal_limit: 50000.00,
    monthly_top_up_limit: 1000000.00,
    monthly_transfer_limit: 500000.00,
    monthly_withdrawal_limit: 200000.00,
  },
};

interface SettingsContextType {
  // Exchange rates
  USDT_TO_AED_BUY: number;
  USDT_TO_AED_SELL: number;
  AED_TO_USD_BUY: number;
  AED_TO_USD_SELL: number;
  USD_TO_AED_BUY: number;
  USD_TO_AED_SELL: number;
  // Derived rates
  AED_TO_USDT_RATE: number;
  
  // Fees
  TOP_UP_CRYPTO_FEE: number;
  TOP_UP_BANK_FEE_PERCENT: number;
  CARD_TO_CARD_FEE_PERCENT: number;
  BANK_TRANSFER_FEE_PERCENT: number;
  NETWORK_FEE_PERCENT: number;
  CURRENCY_CONVERSION_FEE_PERCENT: number;
  VIRTUAL_CARD_ANNUAL_FEE: number;
  VIRTUAL_CARD_REPLACEMENT_FEE: number;
  METAL_CARD_ANNUAL_FEE: number;
  METAL_CARD_REPLACEMENT_FEE: number;
  VIRTUAL_ACCOUNT_OPENING_FEE: number;
  
  // Limits
  TOP_UP_CRYPTO_MIN_AMOUNT: number;
  TOP_UP_BANK_MIN_AMOUNT: number;
  TRANSFER_MIN_AMOUNT: number;
  WITHDRAWAL_MIN_AMOUNT: number;
  TOP_UP_CRYPTO_MAX_AMOUNT: number;
  TOP_UP_BANK_MAX_AMOUNT: number;
  TRANSFER_MAX_AMOUNT: number;
  WITHDRAWAL_MAX_AMOUNT: number;
  DAILY_TOP_UP_LIMIT: number;
  DAILY_TRANSFER_LIMIT: number;
  DAILY_WITHDRAWAL_LIMIT: number;
  MONTHLY_TOP_UP_LIMIT: number;
  MONTHLY_TRANSFER_LIMIT: number;
  MONTHLY_WITHDRAWAL_LIMIT: number;
  
  // Status
  isLoading: boolean;
  error: Error | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("category, key, value");

      if (error) throw error;
      return data as Pick<AdminSetting, "category" | "key" | "value">[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2,
  });

  // Helper to get value with fallback
  const getValue = (category: string, key: string): number => {
    const setting = settings?.find((s) => s.category === category && s.key === key);
    return setting?.value ?? FALLBACK_SETTINGS[category]?.[key] ?? 0;
  };

  // Build context value
  const value: SettingsContextType = {
    // Exchange rates
    USDT_TO_AED_BUY: getValue("exchange_rates", "usdt_to_aed_buy"),
    USDT_TO_AED_SELL: getValue("exchange_rates", "usdt_to_aed_sell"),
    AED_TO_USD_BUY: getValue("exchange_rates", "aed_to_usd_buy"),
    AED_TO_USD_SELL: getValue("exchange_rates", "aed_to_usd_sell"),
    USD_TO_AED_BUY: getValue("exchange_rates", "usd_to_aed_buy"),
    USD_TO_AED_SELL: getValue("exchange_rates", "usd_to_aed_sell"),
    AED_TO_USDT_RATE: 1 / getValue("exchange_rates", "usdt_to_aed_sell"),
    
    // Fees
    TOP_UP_CRYPTO_FEE: getValue("fees", "top_up_crypto_flat"),
    TOP_UP_BANK_FEE_PERCENT: getValue("fees", "top_up_bank_percent"),
    CARD_TO_CARD_FEE_PERCENT: getValue("fees", "card_to_card_percent"),
    BANK_TRANSFER_FEE_PERCENT: getValue("fees", "bank_transfer_percent"),
    NETWORK_FEE_PERCENT: getValue("fees", "network_fee_percent"),
    CURRENCY_CONVERSION_FEE_PERCENT: getValue("fees", "currency_conversion_percent"),
    VIRTUAL_CARD_ANNUAL_FEE: getValue("fees", "virtual_card_annual"),
    VIRTUAL_CARD_REPLACEMENT_FEE: getValue("fees", "virtual_card_replacement"),
    METAL_CARD_ANNUAL_FEE: getValue("fees", "metal_card_annual"),
    METAL_CARD_REPLACEMENT_FEE: getValue("fees", "metal_card_replacement"),
    VIRTUAL_ACCOUNT_OPENING_FEE: getValue("fees", "virtual_account_opening"),
    
    // Limits
    TOP_UP_CRYPTO_MIN_AMOUNT: getValue("limits", "top_up_crypto_min"),
    TOP_UP_BANK_MIN_AMOUNT: getValue("limits", "top_up_bank_min"),
    TRANSFER_MIN_AMOUNT: getValue("limits", "transfer_min"),
    WITHDRAWAL_MIN_AMOUNT: getValue("limits", "withdrawal_min"),
    TOP_UP_CRYPTO_MAX_AMOUNT: getValue("limits", "top_up_crypto_max"),
    TOP_UP_BANK_MAX_AMOUNT: getValue("limits", "top_up_bank_max"),
    TRANSFER_MAX_AMOUNT: getValue("limits", "transfer_max"),
    WITHDRAWAL_MAX_AMOUNT: getValue("limits", "withdrawal_max"),
    DAILY_TOP_UP_LIMIT: getValue("limits", "daily_top_up_limit"),
    DAILY_TRANSFER_LIMIT: getValue("limits", "daily_transfer_limit"),
    DAILY_WITHDRAWAL_LIMIT: getValue("limits", "daily_withdrawal_limit"),
    MONTHLY_TOP_UP_LIMIT: getValue("limits", "monthly_top_up_limit"),
    MONTHLY_TRANSFER_LIMIT: getValue("limits", "monthly_transfer_limit"),
    MONTHLY_WITHDRAWAL_LIMIT: getValue("limits", "monthly_withdrawal_limit"),
    
    // Status
    isLoading,
    error: error as Error | null,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
