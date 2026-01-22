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
