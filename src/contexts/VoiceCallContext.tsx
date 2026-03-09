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
  EVA: "agent_2601khm8sswzemb9v7tgg9s62yry",      // Main chat assistant (Card support)
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

// Format a single transaction with full details for voice assistant
const formatTransactionForVoice = (tx: any, user: any): string => {
  const parts: string[] = [];

  // Title & direction
  const title = tx.display?.title || tx.description || tx.type || "Операция";
  const sign = tx.display?.primary_amount?.sign || '';
  const amount = tx.display?.primary_amount?.amount || tx.amount || "0";
  const currency = tx.display?.primary_amount?.currency || tx.currency || 'AED';
  parts.push(`${title}: ${sign}${amount} ${currency}`);

  // Secondary amount (e.g. USDT equivalent)
  const sec = tx.display?.secondary_amount;
  if (sec?.amount && sec.amount !== "0" && sec.amount !== "0.00") {
    parts.push(`(${sec.sign || ''}${sec.amount} ${sec.currency || ''})`);
  }

  // Date
  if (tx.created_at) {
    parts.push(`Дата: ${new Date(tx.created_at).toLocaleDateString('ru-RU')}`);
  }

  // Sender info
  const senderName = tx.sender_name || tx.metadata?.sender_name;
  const senderCard = tx.sender_card_mask || tx.metadata?.sender_card_mask;
  const senderIban = tx.metadata?.sender_iban_mask;
  if (senderName) parts.push(`От: ${senderName}`);
  if (senderCard) parts.push(`С карты: ••••${senderCard.slice(-4)}`);
  if (senderIban) parts.push(`Со счёта: ${senderIban}`);

  // Receiver info
  const receiverName = tx.receiver_name || tx.metadata?.receiver_name || tx.metadata?.beneficiary_name;
  const receiverCard = tx.receiver_card_mask || tx.metadata?.receiver_card_mask;
  const receiverIban = tx.metadata?.receiver_iban_mask || tx.metadata?.beneficiary_iban;
  if (receiverName) parts.push(`Кому: ${receiverName}`);
  if (receiverCard) parts.push(`На карту: ••••${receiverCard.slice(-4)}`);
  if (receiverIban) parts.push(`На счёт: ${receiverIban}`);

  // Account types from movements
  const movements = tx.movements || tx.metadata?.movements;
  if (Array.isArray(movements) && movements.length > 0) {
    const accountTypes = movements.map((m: any) => {
      const acType = m.account_type === 'crypto' ? 'USDT кошелёк' :
                     m.account_type === 'card' ? 'Карта' :
                     m.account_type === 'bank' ? 'Банковский счёт' : m.account_type;
      return `${m.type === 'debit' ? 'Списание' : 'Зачисление'} ${acType}`;
    });
    parts.push(`Движение: ${accountTypes.join(' → ')}`);
  }

  // Fee
  const fee = tx.fee_amount || tx.metadata?.fee_amount || tx.metadata?.service_fee_usdt;
  const feePercent = tx.fee_percent || tx.metadata?.fee_percent || tx.metadata?.service_fee_percent;
  if (fee && parseFloat(fee) > 0) {
    const feeCurrency = tx.metadata?.fee_currency || currency;
    let feeStr = `Комиссия: ${fee} ${feeCurrency}`;
    if (feePercent && parseFloat(feePercent) > 0) feeStr += ` (${feePercent}%)`;
    parts.push(feeStr);
  }

  // Network fee (crypto)
  const networkFee = tx.metadata?.network_fee_usdt || tx.metadata?.network_fee;
  if (networkFee && parseFloat(networkFee) > 0) {
    parts.push(`Сетевая комиссия: ${networkFee} USDT`);
  }

  // Exchange rate
  const rate = tx.exchange_rate || tx.metadata?.exchange_rate;
  if (rate && parseFloat(rate) > 0 && parseFloat(rate) !== 1) {
    const fromCur = tx.metadata?.currency_from || tx.original_currency || '';
    const toCur = tx.metadata?.currency_to || currency;
    parts.push(`Курс: ${fromCur ? fromCur + '/' + toCur + ' = ' : ''}${rate}`);
  }

  // Status
  if (tx.status && tx.status !== 'completed' && tx.status !== 'settled') {
    parts.push(`Статус: ${tx.status}`);
  }

  return parts.join('. ');
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
  
  // Unified transactions tool for ElevenLabs agent
  tool_5801kkac8x3af67t323efk98nq5x: async (params: { type?: string; category?: string; limit?: number; days?: number; summary?: boolean }) => {
    const token = getAuthToken();
    const user = getCurrentUserProfile();
    if (!token || !user) return "Для просмотра транзакций необходимо авторизоваться.";

    try {
      const limit = params.limit || 10;
      const category = params.category || params.type;
      const cardsProxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cards-proxy`;
      
      let endpoint = `/transactions/all/?limit=${limit}`;
      if (category) {
        endpoint += `&type=${encodeURIComponent(category)}`;
      }
      
      console.log(`ИИ запросил ${limit} транзакций${category ? `, категория: ${category}` : ''}`);

      const response = await fetch(`${cardsProxyUrl}?endpoint=${encodeURIComponent(endpoint)}`, {
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
      console.log("tool_5801 raw response:", JSON.stringify(data).substring(0, 500));

      const results = Array.isArray(data) ? data : (data.results || []);
      if (results.length === 0) {
        return category 
          ? `Транзакций категории "${category}" не найдено.`
          : "Список транзакций пуст. Скажи пользователю, что у него нет операций.";
      }

      let totalAmount = 0;
      const txStrings = results.slice(0, limit).map((tx: any, index: number) => {
        const amount = tx.display?.primary_amount?.amount || tx.amount || "0";
        totalAmount += parseFloat(String(amount).replace(/,/g, ''));
        return `${index + 1}. ${formatTransactionForVoice(tx, user)}`;
      });

      if (category) {
        return `Найдено ${results.length} транзакций категории "${category}". Общая сумма: ${totalAmount.toFixed(2)} AED. Список: ${txStrings.join(' | ')}. Расскажи детали. Если какого-то поля нет — не упоминай его.`;
      }

      return `Вот последние ${txStrings.length} транзакций пользователя: ${txStrings.join(' | ')}. Расскажи пользователю детали. Если какого-то поля нет — не упоминай его.`;
    } catch (error) {
      console.error("Ошибка:", error);
      return "Не удалось загрузить историю транзакций с сервера.";
    }
  },

  // Get balance summary — returns full wallet balances (cards + IBAN + USDT)
  get_balance_summary: async () => {
    console.log("Agent calling get_balance_summary (wallet balances)");
    const token = getAuthToken();
    if (!token) return "Для просмотра баланса необходимо авторизоваться.";

    try {
      const cardsProxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cards-proxy`;
      const headers = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        'x-backend-token': token,
      };

      const [walletRes, ibanRes, cryptoRes] = await Promise.all([
        fetch(`${cardsProxyUrl}?endpoint=${encodeURIComponent('/cards/wallet/summary/')}`, { headers }),
        fetch(`${cardsProxyUrl}?endpoint=${encodeURIComponent('/cards/accounts/IBAN_AED/')}`, { headers }),
        fetch(`${cardsProxyUrl}?endpoint=${encodeURIComponent('/transactions/crypto-wallets/')}`, { headers }),
      ]);

      const walletData = await walletRes.json();
      const ibanData = await ibanRes.json();
      const cryptoData = await cryptoRes.json();
      console.log("get_balance_summary wallet:", JSON.stringify(walletData).substring(0, 500));
      console.log("get_balance_summary iban:", JSON.stringify(ibanData).substring(0, 300));
      console.log("get_balance_summary crypto:", JSON.stringify(cryptoData).substring(0, 300));

      // Cards
      const cards = walletData?.cards || [];
      const cardsTotal = cards.reduce((sum: number, c: any) => sum + parseFloat(c.balance || '0'), 0);

      // IBAN
      const physicalAccount = walletData?.physical_account;
      const ibanBalance = parseFloat(physicalAccount?.balance || ibanData?.balance || '0');
      const iban = physicalAccount?.iban || ibanData?.iban || null;
      const maskedIban = iban ? `${iban.substring(0, 4)}••••${iban.slice(-4)}` : null;

      // USDT
      const cryptoWallets = Array.isArray(cryptoData) ? cryptoData : (cryptoData?.results || []);
      const usdtWallet = cryptoWallets.find((w: any) => w.currency === 'USDT' || w.network === 'TRC20') || cryptoWallets[0];
      const usdtBalance = usdtWallet ? parseFloat(usdtWallet.balance || '0') : 0;
      const usdtNetwork = usdtWallet?.network || 'TRC20';

      const totalAed = cardsTotal + ibanBalance;

      // Build voice-friendly message
      const parts: string[] = [];
      cards.forEach((c: any) => {
        const type = c.type === 'virtual' ? 'Виртуальная карта' : 'Металлическая карта';
        const digits = c.card_number?.slice(-4) || '****';
        parts.push(`💳 ${type} (****${digits}): ${parseFloat(c.balance).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ${c.currency}`);
      });
      parts.push(`💰 Итого на картах: ${cardsTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} AED`);
      if (iban) {
        parts.push(`🏦 Банковский счёт (${maskedIban}): ${ibanBalance.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} AED`);
      }
      if (usdtWallet) {
        parts.push(`🪙 USDT (${usdtNetwork}): ${usdtBalance.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} USDT`);
      }

      return parts.join('. ') + '. Озвучь всю эту информацию пользователю.';
    } catch (error) {
      console.error("Error in get_balance_summary:", error);
      return "Не удалось загрузить информацию о балансах.";
    }
  },

  // Get full wallet summary: cards + IBAN bank account + totals
  get_wallet_summary: async () => {
    console.log("Agent calling get_wallet_summary");
    const token = getAuthToken();
    if (!token) {
      return JSON.stringify({ error: true, message: "Для просмотра баланса необходимо авторизоваться." });
    }

    try {
      const cardsProxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cards-proxy`;

      const [walletRes, ibanRes, cryptoRes] = await Promise.all([
        fetch(`${cardsProxyUrl}?endpoint=${encodeURIComponent('/cards/wallet/summary/')}`, {
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'x-backend-token': token,
          }
        }),
        fetch(`${cardsProxyUrl}?endpoint=${encodeURIComponent('/cards/accounts/IBAN_AED/')}`, {
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'x-backend-token': token,
          }
        }),
        fetch(`${cardsProxyUrl}?endpoint=${encodeURIComponent('/transactions/crypto-wallets/')}`, {
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'x-backend-token': token,
          }
        }),
      ]);

      const walletData = await walletRes.json();
      const ibanData = await ibanRes.json();
      const cryptoData = await cryptoRes.json();
      console.log("get_wallet_summary wallet:", JSON.stringify(walletData).substring(0, 500));
      console.log("get_wallet_summary iban:", JSON.stringify(ibanData).substring(0, 300));
      console.log("get_wallet_summary crypto:", JSON.stringify(cryptoData).substring(0, 300));

      // Parse cards
      const cards = walletData?.cards || [];
      const cardsInfo = cards.map((c: any) => ({
        type: c.type === 'virtual' ? 'Виртуальная карта' : 'Металлическая карта',
        last_digits: c.card_number?.slice(-4) || '****',
        currency: c.currency,
        balance: c.balance,
      }));
      const cardsTotal = cards.reduce((sum: number, c: any) => sum + parseFloat(c.balance || '0'), 0);

      // Parse IBAN / physical account
      const physicalAccount = walletData?.physical_account;
      const ibanBalance = parseFloat(physicalAccount?.balance || ibanData?.balance || '0');
      const iban = physicalAccount?.iban || ibanData?.iban || null;
      const maskedIban = iban ? `${iban.substring(0, 4)}••••${iban.slice(-4)}` : null;

      // Parse USDT crypto wallet
      const cryptoWallets = Array.isArray(cryptoData) ? cryptoData : (cryptoData?.results || []);
      const usdtWallet = cryptoWallets.find((w: any) => w.currency === 'USDT' || w.network === 'TRC20') || cryptoWallets[0];
      const usdtBalance = usdtWallet ? parseFloat(usdtWallet.balance || '0') : 0;
      const usdtNetwork = usdtWallet?.network || 'TRC20';

      const totalBalance = cardsTotal + ibanBalance;

      // Build message parts matching the expected format
      const parts: string[] = [];
      cardsInfo.forEach((c: any) => {
        parts.push(`💳 ${c.type} (****${c.last_digits}): ${parseFloat(c.balance).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ${c.currency}`);
      });
      parts.push(`💰 Итого на картах: ${cardsTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} AED`);
      if (iban) {
        parts.push(`🏦 Банковский счёт: ${ibanBalance.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} AED`);
      }
      if (usdtWallet) {
        parts.push(`🪙 USDT (${usdtNetwork}): ${usdtBalance.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} USDT`);
      }

      return JSON.stringify({
        cards: cardsInfo,
        cards_total: cardsTotal,
        iban: maskedIban,
        iban_balance: ibanBalance,
        usdt_balance: usdtBalance,
        usdt_network: usdtNetwork,
        total_balance: totalBalance,
        message: parts.join('. ') + '. Озвучь эту информацию пользователю.',
      });
    } catch (error) {
      console.error("Error in get_wallet_summary:", error);
      return JSON.stringify({ error: true, message: "Не удалось загрузить сводку по балансам." });
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
            "Единственный источник правды по транзакциям — результат инструмента tool_5801kkac8x3af67t323efk98nq5x / get_balance_summary.",
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
