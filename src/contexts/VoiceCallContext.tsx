import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { useConversation } from "@elevenlabs/react";
import { toast } from "sonner";
import { useDialTone } from "@/hooks/useDialTone";
import { getAuthToken, AUTH_USER_KEY } from "@/services/api/apiClient";
import type { UserProfile } from "@/services/api/authApi";
import { fetchCards } from "@/services/api/cards";
import { supabase } from "@/integrations/supabase/client";
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
      const profile = JSON.parse(cached);
      console.log("getCurrentUserProfile:", profile);
      return profile;
    }
  } catch {
    // ignore
  }
  return null;
};

// Helper to calculate age from date of birth
const calculateAge = (dateOfBirth: string | null | undefined): number | null => {
  if (!dateOfBirth) return null;
  try {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) return null;
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
};

// Edge function name for transactions
const TRANSACTIONS_FUNCTION = "get-transactions";

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
    
    try {
      // Fetch real cards data from API
      const cardsResponse = await fetchCards();
      
      if (!cardsResponse.success || !cardsResponse.data.length) {
        return JSON.stringify({
          error: true,
          message: "Не удалось загрузить информацию о картах."
        });
      }
      
      const cards = cardsResponse.data;
      
      // Calculate total balance
      const totalBalance = cards.reduce((sum, card) => sum + card.balance, 0);
      
      // Format cards info
      const cardsInfo = cards.map(card => ({
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
    } catch (error) {
      console.error("Error fetching card balance:", error);
      return JSON.stringify({
        error: true,
        message: "Произошла ошибка при загрузке баланса карт."
      });
    }
  },
  
  // Get user transactions - REQUIRES authenticated user
  get_transactions: async (params: { type?: string; limit?: number; days?: number; summary?: boolean }) => {
    // Check authorization first
    const token = getAuthToken();
    const user = getCurrentUserProfile();
    if (!token || !user) {
      return "Для просмотра транзакций необходимо авторизоваться. Пожалуйста, войдите в аккаунт.";
    }
    
    try {
      console.log("Agent calling get_transactions:", params, "user.id:", user.id);
      
      // Use supabase.functions.invoke instead of raw fetch to avoid CORS/WebSocket issues
      const { data, error } = await supabase.functions.invoke(TRANSACTIONS_FUNCTION, {
        body: { ...params, external_user_id: user.id },
      });
      
      if (error) {
        console.error("Error from edge function:", error);
        throw error;
      }
      
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
    const user = getCurrentUserProfile();
    if (!token || !user) {
      return "Для просмотра баланса необходимо авторизоваться. Пожалуйста, войдите в аккаунт.";
    }
    
    try {
      console.log("Agent calling get_balance_summary, user.id:", user.id);
      
      // Use supabase.functions.invoke instead of raw fetch
      const { data, error } = await supabase.functions.invoke(TRANSACTIONS_FUNCTION, {
        body: { summary: true, days: 30, external_user_id: user.id },
      });
      
      if (error) {
        console.error("Error from edge function:", error);
        throw error;
      }
      
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
    const user = getCurrentUserProfile();
    if (!token || !user) {
      return "Для просмотра расходов по категориям необходимо авторизоваться. Пожалуйста, войдите в аккаунт.";
    }
    
    try {
      console.log("Agent calling get_spending_by_category:", params, "user.id:", user.id);
      
      // Use supabase.functions.invoke instead of raw fetch
      const { data, error } = await supabase.functions.invoke(TRANSACTIONS_FUNCTION, {
        body: { summary: true, days: params.days || 30, external_user_id: user.id },
      });
      
      if (error) {
        console.error("Error from edge function:", error);
        throw error;
      }
      
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

      // IMPORTANT: reset / pin the agent to tool-based truth to avoid hallucinations from prior context.
      // This does not trigger a spoken response, but updates the agent context.
      try {
        conversation.sendContextualUpdate(
          [
            "ВАЖНО: Игнорируй любую ранее сказанную финансовую информацию.",
            "Единственный источник правды по транзакциям — результат инструментов get_transactions / get_balance_summary.",
            "Если инструмент не вызывался, скажи что нужно запросить данные инструментом.",
          ].join(" ")
        );
      } catch (e) {
        console.warn("Failed to send contextual update", e);
      }
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs agent");
      setCurrentAgent(null);
      stopRingTone();
      toast.info("Звонок завершён");
    },
    onMessage: (message: any) => {
      // Debugging: helps verify whether agent actually calls tools and what it receives.
      // We'll see these logs in the browser console.
      try {
        if (message?.type === "client_tool_call") {
          console.log("ElevenLabs client_tool_call:", message);
        } else if (message?.type === "agent_tool_response") {
          console.log("ElevenLabs agent_tool_response:", message);
        } else if (message?.type === "agent_response") {
          console.log("ElevenLabs agent_response:", message?.agent_response_event?.agent_response);
        } else if (message?.type === "user_transcript") {
          console.log("ElevenLabs user_transcript:", message?.user_transcription_event?.user_transcript);
        }
      } catch {
        // ignore
      }
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
