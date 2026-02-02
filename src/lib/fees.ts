// Centralized fee constants for the application
// All fee values should be defined here to maintain consistency

// Top Up Fees
export const TOP_UP_CRYPTO_FEE = 5.90; // USDT flat fee
export const TOP_UP_BANK_FEE_PERCENT = 1.5; // 1.5%

// Send/Transfer Fees
export const CARD_TO_CARD_FEE_PERCENT = 1; // 1%
export const BANK_TRANSFER_FEE_PERCENT = 2; // 2%
export const NETWORK_FEE_PERCENT = 1; // 1%

// Exchange Rates
export const USDT_TO_AED_TOP_UP = 3.65; // 1 USDT = 3.65 AED (for top-ups)
export const USDT_TO_AED_SEND = 3.69; // 1 USDT = 3.69 AED (for withdrawals)
export const AED_TO_USDT_RATE = 1 / USDT_TO_AED_SEND; // ~0.271

// Transaction Fees
export const CURRENCY_CONVERSION_FEE_PERCENT = 1.5; // 1.50%

// One-Time Fees (in AED)
export const VIRTUAL_CARD_ANNUAL_FEE = 183.00;
export const VIRTUAL_CARD_REPLACEMENT_FEE = 183.00;
export const METAL_CARD_ANNUAL_FEE = 183.00;
export const METAL_CARD_REPLACEMENT_FEE = 183.00;
export const VIRTUAL_ACCOUNT_OPENING_FEE = 183.00;

// Crypto Top Up
export const TOP_UP_CRYPTO_MIN_AMOUNT = 15.00; // USDT

// Bank Top Up
export const TOP_UP_BANK_MIN_AMOUNT = 50; // AED
