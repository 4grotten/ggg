// Cards API Service

import { 
  Card, 
  CardsResponse, 
  CardDetailsResponse,
  CardBalanceResponse,
  FetchCardsParams 
} from '@/types/card';
import { TransactionsResponse } from '@/types/transaction';
import { buildApiUrl, ENDPOINTS } from './config';

// Mock data - will be replaced with actual API calls
const mockCards: Card[] = [
  { 
    id: "1", 
    type: "virtual", 
    name: "Visa Virtual", 
    isActive: true, 
    balance: 213757.49,
    status: "active",
    lastFourDigits: "4521",
  },
  { 
    id: "2", 
    type: "metal", 
    name: "Visa Metal", 
    isActive: true, 
    balance: 256508.98,
    status: "active",
    lastFourDigits: "8834",
  },
];

// Simulate API delay
const simulateApiDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch all cards for user
 * Replace mock implementation with actual API call when backend is ready
 */
export const fetchCards = async (
  params?: FetchCardsParams
): Promise<CardsResponse> => {
  try {
    // TODO: Replace with actual API call
    // const response = await fetch(buildApiUrl(ENDPOINTS.cards.list), {
    //   method: 'GET',
    //   headers: API_CONFIG.headers,
    // });
    // return await response.json();

    await simulateApiDelay();
    
    let filteredCards = [...mockCards];
    
    if (params?.type) {
      filteredCards = filteredCards.filter(c => c.type === params.type);
    }
    if (params?.status) {
      filteredCards = filteredCards.filter(c => c.status === params.status);
    }
    
    return {
      success: true,
      data: filteredCards,
    };
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
 * Replace mock implementation with actual API call when backend is ready
 */
export const fetchCardById = async (
  id: string
): Promise<CardDetailsResponse> => {
  try {
    // TODO: Replace with actual API call
    // const response = await fetch(buildApiUrl(ENDPOINTS.cards.details(id)), {
    //   method: 'GET',
    //   headers: API_CONFIG.headers,
    // });
    // return await response.json();

    await simulateApiDelay();
    
    const card = mockCards.find(c => c.id === id);
    
    return {
      success: !!card,
      data: card || null,
      error: card ? undefined : 'Card not found',
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
 * Replace mock implementation with actual API call when backend is ready
 */
export const fetchCardBalance = async (
  id: string
): Promise<CardBalanceResponse> => {
  try {
    // TODO: Replace with actual API call
    // const response = await fetch(buildApiUrl(ENDPOINTS.cards.balance(id)), {
    //   method: 'GET',
    //   headers: API_CONFIG.headers,
    // });
    // return await response.json();

    await simulateApiDelay(300);
    
    const card = mockCards.find(c => c.id === id);
    
    return {
      success: !!card,
      balance: card?.balance || 0,
      currency: 'AED',
      error: card ? undefined : 'Card not found',
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
    const cardsResponse = await fetchCards();
    
    if (!cardsResponse.success) {
      return {
        success: false,
        balance: 0,
        currency: 'AED',
        error: cardsResponse.error,
      };
    }
    
    const totalBalance = cardsResponse.data.reduce((sum, card) => sum + card.balance, 0);
    
    return {
      success: true,
      balance: totalBalance,
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
