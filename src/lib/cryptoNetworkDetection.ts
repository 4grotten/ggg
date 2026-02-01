/**
 * Utility functions for detecting cryptocurrency networks from wallet addresses
 */

// Wallet address patterns for different networks
const WALLET_PATTERNS = {
  // Bitcoin (starts with 1, 3, or bc1)
  btc: /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/,
  // Ethereum/ERC20 (0x + 40 hex)
  erc20: /^0x[a-fA-F0-9]{40}$/,
  // TRON/TRC20 (starts with T)
  trc20: /^T[a-zA-Z0-9]{33}$/,
  // Solana (base58, 32-44 chars)
  solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  // Litecoin (starts with L, M, or ltc1)
  ltc: /^(L[a-km-zA-HJ-NP-Z1-9]{26,33}|M[a-km-zA-HJ-NP-Z1-9]{26,33}|ltc1[a-z0-9]{39,59})$/,
  // TON
  ton: /^(EQ|UQ)[a-zA-Z0-9_-]{46}$/,
};

export type CryptoNetwork = 'btc' | 'erc20' | 'bep20' | 'trc20' | 'solana' | 'ltc' | 'ton' | 'polygon' | null;

export interface NetworkInfo {
  value: CryptoNetwork;
  label: string;
  subtitle: string;
  color: string;
}

export const NETWORK_INFO: Record<string, NetworkInfo> = {
  btc: { value: 'btc', label: 'Bitcoin', subtitle: 'BTC', color: '#F7931A' },
  erc20: { value: 'erc20', label: 'ERC20', subtitle: 'Ethereum', color: '#627EEA' },
  bep20: { value: 'bep20', label: 'BEP20', subtitle: 'BSC', color: '#F3BA2F' },
  trc20: { value: 'trc20', label: 'TRC20', subtitle: 'Tron', color: '#FF0013' },
  solana: { value: 'solana', label: 'Solana', subtitle: 'SOL', color: '#00FFA3' },
  ltc: { value: 'ltc', label: 'Litecoin', subtitle: 'LTC', color: '#345D9D' },
  ton: { value: 'ton', label: 'TON', subtitle: 'Toncoin', color: '#0098EA' },
  polygon: { value: 'polygon', label: 'Polygon', subtitle: 'MATIC', color: '#8247E5' },
};

/**
 * Detect cryptocurrency network from wallet address
 */
export function detectCryptoNetwork(address: string): CryptoNetwork {
  const trimmed = address.trim();
  
  // Check specific patterns first (order matters for disambiguation)
  if (WALLET_PATTERNS.btc.test(trimmed)) return 'btc';
  if (WALLET_PATTERNS.trc20.test(trimmed)) return 'trc20';
  if (WALLET_PATTERNS.ltc.test(trimmed)) return 'ltc';
  if (WALLET_PATTERNS.ton.test(trimmed)) return 'ton';
  if (WALLET_PATTERNS.erc20.test(trimmed)) return 'erc20';
  
  // Solana check last (broad pattern can match others)
  // Only if it doesn't match other patterns and is 32-44 chars
  if (WALLET_PATTERNS.solana.test(trimmed) && trimmed.length >= 32 && trimmed.length <= 44) {
    // Additional check: Solana addresses don't start with numbers in practice
    if (!/^[0-9]/.test(trimmed)) {
      return 'solana';
    }
  }
  
  return null;
}

/**
 * Get network display info
 */
export function getNetworkInfo(network: string): NetworkInfo | null {
  return NETWORK_INFO[network.toLowerCase()] || null;
}

/**
 * Validate if address matches expected network format
 */
export function validateAddressForNetwork(address: string, network: CryptoNetwork): boolean {
  if (!network || !address) return false;
  
  const trimmed = address.trim();
  
  switch (network) {
    case 'btc':
      return WALLET_PATTERNS.btc.test(trimmed);
    case 'erc20':
    case 'bep20':
    case 'polygon':
      return WALLET_PATTERNS.erc20.test(trimmed);
    case 'trc20':
      return WALLET_PATTERNS.trc20.test(trimmed);
    case 'ltc':
      return WALLET_PATTERNS.ltc.test(trimmed);
    case 'ton':
      return WALLET_PATTERNS.ton.test(trimmed);
    case 'solana':
      return WALLET_PATTERNS.solana.test(trimmed);
    default:
      return false;
  }
}

/**
 * Format wallet address for display (truncate middle)
 */
export function formatWalletAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address || address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}
