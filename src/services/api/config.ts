// API Configuration

export const API_CONFIG = {
  // Base URL for API requests - will be replaced with actual backend URL
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  
  // API version
  version: 'v1',
  
  // Default timeout in milliseconds
  timeout: 30000,
  
  // Default headers
  headers: {
    'Content-Type': 'application/json',
  },
};

// API Endpoints
export const ENDPOINTS = {
  // Transactions
  transactions: {
    list: '/transactions',
    details: (id: string) => `/transactions/${id}`,
    grouped: '/transactions/grouped',
  },
  
  // Cards
  cards: {
    list: '/cards',
    details: (id: string) => `/cards/${id}`,
    balance: (id: string) => `/cards/${id}/balance`,
    transactions: (id: string) => `/cards/${id}/transactions`,
  },
  
  // User
  user: {
    profile: '/user/profile',
    balance: '/user/balance',
  },
  
  // Transfers
  transfers: {
    cardToCard: '/transfers/card-to-card',
    toBank: '/transfers/bank',
    toCrypto: '/transfers/crypto',
  },
  
  // Top-up
  topup: {
    crypto: '/topup/crypto',
    bank: '/topup/bank',
  },
};

// Build full API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseUrl}/${API_CONFIG.version}${endpoint}`;
};
