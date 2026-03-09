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
  EVA: "agent_5801kfp8shb2fv48yefns7hvkh5a",      // Main chat assistant (Card support)
  ANGIE: "agent_2601khm9nawwe87b6hssvw19c197",   // Partner support & sales
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
  
  // Get user transactions via Django backend
  get_transactions: async (params: { type?: string; limit?: number; days?: number; summary?: boolean }) => {
    const token = getAuthToken();
    const user = getCurrentUserProfile();
    if (!token || !user) return "Для просмотра транзакций необходимо авторизоваться.";

    try {
      const limit = params.limit || 10;
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.ueasycard.com';
      console.log(`ИИ запросил ${limit} транзакций`);

      // Use the existing transactions/all/ endpoint via cards-proxy
      const cardsProxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cards-proxy`;
      const response = await fetch(`${cardsProxyUrl}?endpoint=${encodeURIComponent(`/transactions/all/?limit=${limit}`)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'x-backend-token': token,
        }
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      console.log("get_transactions raw response:", JSON.stringify(data).substring(0, 500));

      // Support both { results: [...] } and plain array formats
      const results = Array.isArray(data) ? data : (data.results || []);
      if (results.length === 0) {
        return "Список транзакций пуст. Скажи пользователю, что у него нет операций.";
      }

      const txStrings = results.slice(0, limit).map((tx: any, index: number) => {
        const isIncome = tx.receiver_id === String(user.id);
        const direction = isIncome ? "Поступление" : "Списание";
        // Use display block if available, fallback to raw fields
        const displayTitle = tx.display?.title || tx.description || "Операция";
        const amount = tx.display?.primary_amount?.amount || tx.amount || "0";
        const currency = tx.display?.primary_amount?.currency || tx.currency || 'AED';
        const dateStr = new Date(tx.created_at).toLocaleDateString('ru-RU');
        return `${index + 1}. ${displayTitle}: ${tx.display?.primary_amount?.sign || ''}${amount} ${currency}. Дата: ${dateStr}.`;
      });

      return `Вот последние ${txStrings.length} транзакций пользователя: ${txStrings.join(' | ')}. Проанализируй их и ответь пользователю.`;
    } catch (error) {
      console.error("Ошибка:", error);
      return "Не удалось загрузить историю транзакций с сервера.";
    }
  },

  // Get balance summary via Django backend
  get_balance_summary: async () => {
    const token = getAuthToken();
    const user = getCurrentUserProfile();
    if (!token || !user) return "Нужна авторизация.";

    try {
      const cardsProxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cards-proxy`;
      const response = await fetch(`${cardsProxyUrl}?endpoint=${encodeURIComponent('/transactions/all/?limit=50')}`, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'x-backend-token': token,
        }
      });

      if (!response.ok) throw new Error("API Error");
      const data = await response.json();

      if (!data.results || data.results.length === 0) return "Нет данных для формирования сводки.";

      let income = 0;
      let expenses = 0;
      data.results.forEach((tx: any) => {
        if (tx.receiver_id === String(user.id)) {
          income += parseFloat(tx.amount);
        } else {
          expenses += parseFloat(tx.amount);
        }
      });

      return `Сводка по последним ${data.results.length} операциям: Доходы составили +${income.toFixed(2)} AED. Расходы составили -${expenses.toFixed(2)} AED. Разница: ${(income - expenses).toFixed(2)} AED. Расскажи это пользователю.`;
    } catch (error) {
      return "Не удалось посчитать сводку.";
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
