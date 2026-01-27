import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { useConversation } from "@elevenlabs/react";
import { toast } from "sonner";
import { useDialTone } from "@/hooks/useDialTone";
import { getAuthToken, AUTH_USER_KEY } from "@/services/api/apiClient";
import type { UserProfile } from "@/services/api/authApi";

// Agent IDs
export const AGENTS = {
  EVA: "agent_5801kfp8shb2fv48yefns7hvkh5a",      // Main chat assistant
  ANGIE: "agent_9701kfya7rw9fxhs981fh1wvky6x",   // Partner support & sales
} as const;

export type AgentType = keyof typeof AGENTS;

interface VoiceCallContextType {
  isConnecting: boolean;
  isConnected: boolean;
  isSpeaking: boolean;
  currentAgent: AgentType | null;
  startCall: (agent?: AgentType) => Promise<void>;
  endCall: () => Promise<void>;
}

const VoiceCallContext = createContext<VoiceCallContextType | undefined>(undefined);

// Helper to get current user from localStorage
const getCurrentUserProfile = (): UserProfile | null => {
  try {
    const cached = localStorage.getItem(AUTH_USER_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // ignore
  }
  return null;
};

// Helper to calculate age from date of birth
const calculateAge = (dateOfBirth: string | null): number | null => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Mock cards data for balance (same as in cards.ts)
const mockCardsData = [
  { 
    id: "1", 
    type: "virtual", 
    name: "Visa Virtual", 
    balance: 213757.49,
    lastFourDigits: "4521",
  },
  { 
    id: "2", 
    type: "metal", 
    name: "Visa Metal", 
    balance: 256508.98,
    lastFourDigits: "8834",
  },
];

// Client tools for ElevenLabs agent
const getTransactionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-transactions`;

const clientTools = {
  // MUST BE CALLED FIRST - Get user identity and authorization status
  get_user_identity: async () => {
    console.log("Agent calling get_user_identity");
    
    const token = getAuthToken();
    const user = getCurrentUserProfile();
    
    // Check if user is a guest (not authenticated)
    if (!token || !user) {
      return JSON.stringify({
        status: "guest",
        message: "Пользователь не авторизован. Для доступа к финансовой информации необходимо войти в аккаунт. Попросите пользователя авторизоваться через кнопку входа в приложении."
      });
    }
    
    // User is authenticated - return profile info
    const age = calculateAge(user.date_of_birth);
    
    return JSON.stringify({
      status: "authenticated",
      name: user.full_name || "Не указано",
      age: age,
      has_name: !!user.full_name,
      has_age: !!user.date_of_birth,
      phone: user.phone_number,
      email: user.email || null,
      gender: user.gender || null,
      message: user.full_name 
        ? `Пользователь авторизован. Имя: ${user.full_name}${age ? `, возраст: ${age} лет` : ", возраст не указан"}.`
        : "Пользователь авторизован, но имя не указано в профиле."
    });
  },
  
  // Get card balances - REQUIRES authenticated user
  get_card_balance: async () => {
    console.log("Agent calling get_card_balance");
    
    const token = getAuthToken();
    if (!token) {
      return JSON.stringify({
        error: true,
        message: "Для просмотра баланса карт необходимо авторизоваться. Пожалуйста, войдите в аккаунт."
      });
    }
    
    // Calculate total balance
    const totalBalance = mockCardsData.reduce((sum, card) => sum + card.balance, 0);
    
    // Format cards info
    const cardsInfo = mockCardsData.map(card => ({
      type: card.type === "virtual" ? "Виртуальная карта" : "Металлическая карта",
      name: card.name,
      last_digits: card.lastFourDigits,
      balance: card.balance,
      balance_formatted: `${card.balance.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} AED`
    }));
    
    return JSON.stringify({
      total_balance: totalBalance,
      total_balance_formatted: `${totalBalance.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} AED`,
      cards: cardsInfo,
      message: `Общий баланс: ${totalBalance.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} дирхам. ${cardsInfo.map(c => `${c.type} *${c.last_digits}: ${c.balance.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} дирхам`).join('. ')}.`
    });
  },
  
  // Get user transactions - REQUIRES authenticated user
  get_transactions: async (params: { type?: string; limit?: number; days?: number; summary?: boolean }) => {
    // Check authorization first
    const token = getAuthToken();
    if (!token) {
      return "Для просмотра транзакций необходимо авторизоваться. Пожалуйста, войдите в аккаунт.";
    }
    
    try {
      console.log("Agent calling get_transactions:", params);
      const response = await fetch(getTransactionsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Transactions fetched:", data);
      
      // Return formatted string for agent to speak
      if (params.summary && data.summary) {
        return `За последние ${params.days || 30} дней: доходы ${data.summary.total_income}, расходы ${data.summary.total_expenses}, баланс ${data.summary.net_balance}. Всего ${data.summary.transaction_count} транзакций.`;
      }
      
      if (data.transactions && data.transactions.length > 0) {
        const txList = data.transactions.slice(0, 5).map((tx: any) => 
          `${tx.type}: ${tx.amount} - ${tx.description || tx.merchant}`
        ).join(". ");
        return `Последние транзакции: ${txList}`;
      }
      
      return "Транзакции не найдены за указанный период.";
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return "Не удалось загрузить транзакции. Попробуйте позже.";
    }
  },
  
  // Get account balance summary - REQUIRES authenticated user
  get_balance_summary: async () => {
    // Check authorization first
    const token = getAuthToken();
    if (!token) {
      return "Для просмотра баланса необходимо авторизоваться. Пожалуйста, войдите в аккаунт.";
    }
    
    try {
      console.log("Agent calling get_balance_summary");
      const response = await fetch(getTransactionsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ summary: true, days: 30 }),
      });
      
      const data = await response.json();
      
      if (data.summary) {
        const topMerchants = data.summary.top_merchants
          .map((m: any) => `${m.name}: ${m.amount}`)
          .join(", ");
        return `Сводка за месяц. Доходы: ${data.summary.total_income}. Расходы: ${data.summary.total_expenses}. Чистый баланс: ${data.summary.net_balance}. Топ расходов: ${topMerchants}.`;
      }
      
      return "Не удалось получить сводку баланса.";
    } catch (error) {
      console.error("Error fetching balance:", error);
      return "Не удалось загрузить баланс.";
    }
  },
  
  // Get spending by category - REQUIRES authenticated user
  get_spending_by_category: async (params: { days?: number }) => {
    // Check authorization first
    const token = getAuthToken();
    if (!token) {
      return "Для просмотра расходов по категориям необходимо авторизоваться. Пожалуйста, войдите в аккаунт.";
    }
    
    try {
      console.log("Agent calling get_spending_by_category:", params);
      const response = await fetch(getTransactionsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ summary: true, days: params.days || 30 }),
      });
      
      const data = await response.json();
      
      if (data.summary?.by_type) {
        const categories = Object.entries(data.summary.by_type)
          .map(([type, info]: [string, any]) => `${type}: ${info.count} операций на сумму ${info.total.toFixed(2)} AED`)
          .join(". ");
        return `Расходы по категориям за ${params.days || 30} дней: ${categories}`;
      }
      
      return "Нет данных по категориям.";
    } catch (error) {
      console.error("Error fetching categories:", error);
      return "Не удалось загрузить данные по категориям.";
    }
  },
};

export const VoiceCallProvider = ({ children }: { children: ReactNode }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<AgentType | null>(null);
  const { playRingTone, stopRingTone } = useDialTone();
  const connectionSuccessRef = useRef(false);

  const conversation = useConversation({
    clientTools,
    onConnect: () => {
      console.log("Connected to ElevenLabs agent");
      connectionSuccessRef.current = true;
      stopRingTone();
      toast.success("Звонок начат! 📞");
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs agent");
      setCurrentAgent(null);
      stopRingTone();
      toast.info("Звонок завершён");
    },
    onError: (error) => {
      console.error("ElevenLabs error:", error);
      stopRingTone();
      toast.error("Ошибка соединения. Попробуйте позже.");
    },
  });

  const startCall = useCallback(async (agent: AgentType = "EVA") => {
    setIsConnecting(true);
    connectionSuccessRef.current = false;
    
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setCurrentAgent(agent);
      
      // Simulate dialing: ALWAYS play 2/3/5 rings fully, then connect.
      const completedAllRings = await playRingTone();
      if (!completedAllRings) {
        // User ended call while ringing; don't connect.
        return;
      }

      await conversation.startSession({
        agentId: AGENTS[agent],
        connectionType: "websocket",
      } as any);
      
    } catch (error) {
      console.error("Failed to start call:", error);
      setCurrentAgent(null);
      stopRingTone();
      
      if (error instanceof Error && error.name === "NotAllowedError") {
        toast.error("Разрешите доступ к микрофону для звонка");
      } else {
        toast.error("Не удалось начать звонок");
      }
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, playRingTone, stopRingTone]);

  const endCall = useCallback(async () => {
    stopRingTone();
    await conversation.endSession();
    setCurrentAgent(null);
  }, [conversation, stopRingTone]);

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  return (
    <VoiceCallContext.Provider
      value={{
        isConnecting,
        isConnected,
        isSpeaking,
        currentAgent,
        startCall,
        endCall,
      }}
    >
      {children}
    </VoiceCallContext.Provider>
  );
};

export const useVoiceCall = () => {
  const context = useContext(VoiceCallContext);
  if (!context) {
    throw new Error("useVoiceCall must be used within a VoiceCallProvider");
  }
  return context;
};
