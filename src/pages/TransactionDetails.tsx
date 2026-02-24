import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, CheckCircle, Info, MessageSquare, Ban, Plus, ExternalLink, ArrowUpRight, Clock, Eye, EyeOff, Copy, CreditCard, XCircle, Send, Landmark, FileText, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useTranslation } from "react-i18next";
import { useWalletSummary, useCryptoWallets } from "@/hooks/useCards";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactionReceipt, useApiTransactionGroups } from "@/hooks/useTransactions";
import { getAuthToken, apiRequest } from "@/services/api/apiClient";
import { useQuery } from "@tanstack/react-query";

// Mock transaction data - in real app would come from API/state
const mockTransactions: Record<string, {
  id: string;
  merchant: string;
  time: string;
  date: string;
  amountUSDT: number;
  amountLocal: number;
  localCurrency: string;
  color: string;
  cardLast4: string;
  exchangeRate: number;
  status: "settled" | "pending" | "failed" | "processing";
  type?: "payment" | "topup" | "declined" | "card_activation" | "card_transfer" | "crypto_send" | "crypto_deposit" | "bank_transfer" | "bank_transfer_incoming" | "internal_transfer" | "crypto_to_card" | "crypto_to_bank";
  fromAddress?: string;
  tokenNetwork?: string;
  kartaFee?: number;
  declineReason?: string;
  cardType?: "Virtual" | "Metal";
  recipientCard?: string;
  recipientCardFull?: string;
  recipientCardType?: "Virtual" | "Metal";
  recipientName?: string;
  transferFee?: number;
  fromCardFull?: string;
  senderName?: string;
  senderCard?: string;
  senderCardFull?: string;
  toCardFull?: string;
  toWalletAddress?: string;
  fromWalletAddress?: string;
  networkFee?: number;
  recipientIban?: string;
  recipientBankName?: string;
  bankFee?: number;
  senderIban?: string;
  senderBankName?: string;
  recipientAvatar?: string;
  cryptoToCardCreditedAed?: number;
  cryptoToCardExchangeRate?: number | null;
  cryptoToCardFeePercent?: number;
}> = {
  "1": { id: "1", merchant: "LIFE", time: "01:02 PM", date: "10.01.2026", amountUSDT: 8.34, amountLocal: 29.87, localCurrency: "AED", color: "#3B82F6", cardLast4: "7617", exchangeRate: 3.58, status: "settled", cardType: "Virtual" },
  "2": { id: "2", merchant: "ALAYA", time: "12:59 AM", date: "10.01.2026", amountUSDT: 26.80, amountLocal: 96.00, localCurrency: "AED", color: "#22C55E", cardLast4: "7617", exchangeRate: 3.58, status: "settled", cardType: "Virtual" },
  "3": { id: "3", merchant: "Ongaku", time: "12:17 AM", date: "10.01.2026", amountUSDT: 54.05, amountLocal: 193.60, localCurrency: "AED", color: "#F97316", cardLast4: "4521", exchangeRate: 3.58, status: "settled", cardType: "Metal" },
  "4": { id: "4", merchant: "OPERA", time: "08:20 PM", date: "02.01.2026", amountUSDT: 62.82, amountLocal: 225.00, localCurrency: "AED", color: "#A855F7", cardLast4: "4521", exchangeRate: 3.58, status: "settled", cardType: "Metal" },
  "5": { id: "5", merchant: "CELLAR", time: "08:48 PM", date: "31.12.2025", amountUSDT: 22.06, amountLocal: 79.00, localCurrency: "AED", color: "#EAB308", cardLast4: "7617", exchangeRate: 3.58, status: "settled", cardType: "Virtual" },
  "6": { id: "6", merchant: "Top up", time: "08:46 PM", date: "31.12.2025", amountUSDT: 194.10, amountLocal: 200.00, localCurrency: "USDT", color: "#22C55E", cardLast4: "7617", exchangeRate: 1, status: "settled", type: "topup", fromAddress: "TFVFktvwmaEnMVh6ZxZq2rvmLePfTxhX9L", tokenNetwork: "USDT, Tron (TRC20)", kartaFee: 5.90, cardType: "Virtual" },
  "7": { id: "7", merchant: "BHPC", time: "08:16 PM", date: "30.12.2025", amountUSDT: 125.64, amountLocal: 450.00, localCurrency: "AED", color: "#EAB308", cardLast4: "4521", exchangeRate: 3.58, status: "settled", cardType: "Metal" },
  "8": { id: "8", merchant: "Bhpc", time: "08:15 PM", date: "30.12.2025", amountUSDT: 142.90, amountLocal: 140.78, localCurrency: "$", color: "#EC4899", cardLast4: "7617", exchangeRate: 0.99, status: "failed", type: "declined", declineReason: "No funds", cardType: "Virtual" },
  "9": { id: "9", merchant: "Bhpc", time: "08:14 PM", date: "30.12.2025", amountUSDT: 157.49, amountLocal: 155.16, localCurrency: "$", color: "#EC4899", cardLast4: "4521", exchangeRate: 0.99, status: "failed", type: "declined", declineReason: "No funds", cardType: "Metal" },
  "10": { id: "10", merchant: "CELLAR", time: "07:53 PM", date: "30.12.2025", amountUSDT: 116.54, amountLocal: 114.81, localCurrency: "$", color: "#22C55E", cardLast4: "7617", exchangeRate: 0.985, status: "settled", cardType: "Virtual" },
  "11": { id: "11", merchant: "Service CEO", time: "07:58 AM", date: "30.12.2025", amountUSDT: 11.59, amountLocal: 41.50, localCurrency: "AED", color: "#06B6D4", cardLast4: "4521", exchangeRate: 3.58, status: "settled", cardType: "Metal" },
  "12": { id: "12", merchant: "RESTAURANT", time: "03:21 AM", date: "30.12.2025", amountUSDT: 424.81, amountLocal: 418.53, localCurrency: "AED", color: "#EF4444", cardLast4: "7617", exchangeRate: 0.985, status: "settled", cardType: "Virtual" },
  "13": { id: "13", merchant: "Top up", time: "02:30 AM", date: "30.12.2025", amountUSDT: 494.10, amountLocal: 500.00, localCurrency: "USDT", color: "#22C55E", cardLast4: "4521", exchangeRate: 1, status: "settled", type: "topup", fromAddress: "TFVFktvwmaEnMVh6ZxZq2rvmLePfTxhX9L", tokenNetwork: "USDT, Tron (TRC20)", kartaFee: 5.90, cardType: "Metal" },
  "14": { id: "14", merchant: "LOGS", time: "11:27 PM", date: "29.12.2025", amountUSDT: 67.01, amountLocal: 240.00, localCurrency: "AED", color: "#3B82F6", cardLast4: "7617", exchangeRate: 3.58, status: "settled", cardType: "Virtual" },
  "15": { id: "15", merchant: "Annual Card fee", time: "11:31 PM", date: "21.12.2025", amountUSDT: 56.04, amountLocal: 204.55, localCurrency: "AED", color: "#CCFF00", cardLast4: "7617", exchangeRate: 3.65, status: "settled", type: "card_activation", cardType: "Virtual", networkFee: 5.90 },
  "16": { id: "16", merchant: "Top up", time: "11:30 PM", date: "21.12.2025", amountUSDT: 44.10, amountLocal: 50.00, localCurrency: "USDT", color: "#22C55E", cardLast4: "7617", exchangeRate: 1, status: "settled", type: "topup", fromAddress: "TFVFktvwmaEnMVh6ZxZq2rvmLePfTxhX9L", tokenNetwork: "USDT, Tron (TRC20)", kartaFee: 5.90, cardType: "Virtual" },
  "17": { id: "17", merchant: "Card Transfer", time: "03:30 PM", date: "12.01.2026", amountUSDT: 250.00, amountLocal: 250.00, localCurrency: "AED", color: "#007AFF", cardLast4: "7617", exchangeRate: 1, status: "processing", type: "card_transfer", recipientCard: "4521", recipientCardFull: "4532 8921 0045 4521", recipientName: "JOHN SMITH", transferFee: 3.75, fromCardFull: "4147 2034 5567 7617", cardType: "Virtual" },
  "18": { id: "18", merchant: "Card Transfer", time: "12:15 PM", date: "12.01.2026", amountUSDT: 100.00, amountLocal: 100.00, localCurrency: "AED", color: "#007AFF", cardLast4: "4521", exchangeRate: 1, status: "settled", type: "card_transfer", recipientCard: "8834", recipientCardFull: "4111 2233 4455 8834", recipientName: "ANNA JOHNSON", transferFee: 1.50, fromCardFull: "4532 8921 0045 4521", cardType: "Metal" },
  "19": { id: "19", merchant: "Card Transfer", time: "04:45 PM", date: "12.01.2026", amountUSDT: 50.00, amountLocal: 50.00, localCurrency: "AED", color: "#22C55E", cardLast4: "7617", exchangeRate: 1, status: "settled", type: "card_transfer", senderName: "ANNA JOHNSON", senderCard: "8834", senderCardFull: "4111 2233 4455 8834", toCardFull: "4147 2034 5567 7617", cardType: "Virtual" },
  "20": { id: "20", merchant: "Stablecoin Send", time: "06:20 PM", date: "12.01.2026", amountUSDT: 280.00, amountLocal: 1033.20, localCurrency: "AED", color: "#10B981", cardLast4: "", exchangeRate: 3.69, status: "settled", type: "crypto_send", toWalletAddress: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7", fromWalletAddress: "TQn9Y4sBbhMczK8dXgU5dBMkR2YJb3jM5r", tokenNetwork: "USDT, Tron (TRC20)", networkFee: 5.90, transferFee: 2.80 },
  "21": { id: "21", merchant: "Bank Transfer", time: "07:45 PM", date: "12.01.2026", amountUSDT: 1890.00, amountLocal: 1890.00, localCurrency: "AED", color: "#8B5CF6", cardLast4: "7617", exchangeRate: 1, status: "settled", type: "bank_transfer", recipientName: "EMIRATES TRADING LLC", recipientIban: "AE07 0331 2345 6789 0123 456", recipientBankName: "Emirates NBD", bankFee: 37.80, cardType: "Virtual" },
  "22": { id: "22", merchant: "Top up", time: "11:15 AM", date: "17.01.2026", amountUSDT: 50410.96, amountLocal: 184000.00, localCurrency: "USDT", color: "#22C55E", cardLast4: "7617", exchangeRate: 3.65, status: "settled", type: "topup", fromAddress: "TFVFktvwmaEnMVh6ZxZq2rvmLePfTxhX9L", tokenNetwork: "USDT, Tron (TRC20)", kartaFee: 5.90, cardType: "Virtual" },
  "23": { id: "23", merchant: "Bank Transfer", time: "02:30 PM", date: "17.01.2026", amountUSDT: 28000.00, amountLocal: 28000.00, localCurrency: "AED", color: "#22C55E", cardLast4: "7617", exchangeRate: 1, status: "settled", type: "bank_transfer_incoming", senderName: "AL MAJID TRADING LLC", senderIban: "AE21 0331 2345 6789 0654 321", senderBankName: "Abu Dhabi Commercial Bank", cardType: "Virtual" },
  "24": { id: "24", merchant: "Wallet Deposit", time: "04:00 PM", date: "17.01.2026", amountUSDT: 5000.00, amountLocal: 5000.00, localCurrency: "USDT", color: "#22C55E", cardLast4: "", exchangeRate: 1, status: "settled", type: "crypto_deposit", fromAddress: "TRx8Kp2mN4vD9qL7wE3jF6hY5tR8Wp4mN2", toWalletAddress: "TQn9Y4sBbhMczK8dXgU5dBMkR2YJb3jM5r", tokenNetwork: "USDT, Tron (TRC20)" },
};

const TransactionDetails = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: walletData } = useWalletSummary();
  const { user } = useAuth();
  const userIban = walletData?.data?.physical_account?.iban || "";
  const hasToken = !!getAuthToken();
  
  // Strip api_ prefix for receipt API calls
  const realTransactionId = id?.startsWith('api_') ? id.slice(4) : (id || '');
  
  // Fetch receipt from real API (only if user is authenticated)
  const { data: receiptResult, isLoading: receiptLoading } = useTransactionReceipt(
    realTransactionId,
    hasToken && !!realTransactionId
  );
  const receipt = receiptResult?.data || null;
  
  
  // Fetch crypto wallets for wallet address display
  const { data: cryptoWalletsData } = useCryptoWallets();
  const userCryptoWallet = (cryptoWalletsData as any)?.data?.[0] || (cryptoWalletsData as any)?.[0] || null;
  
  // For crypto_to_card, find recipient card from cached transaction data
  const { data: apiTxGroups } = useApiTransactionGroups();
  const cachedRecipientCard = receipt?.type === 'crypto_to_card' ? (() => {
    if (apiTxGroups) {
      for (const group of apiTxGroups) {
        const found = group.transactions?.find((t: any) => {
          const txRealId = t.id?.startsWith('api_') ? t.id.slice(4) : t.id;
          return txRealId === realTransactionId;
        });
        if (found?.recipientCard) return found.recipientCard;
      }
    }
    return null;
  })() : null;
  
  // Fetch recipient info for crypto_to_card
  const { data: cryptoToCardRecipient } = useQuery({
    queryKey: ['recipient-info', cachedRecipientCard],
    queryFn: async () => {
      const res = await apiRequest<{ recipient_name: string; card_type: string; avatar_url?: string }>(
        `/transactions/recipient-info/?card_number=${cachedRecipientCard}`,
        { method: 'GET' },
        true
      );
      return res.data;
    },
    enabled: !!cachedRecipientCard,
    staleTime: 1000 * 60 * 30,
  });
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  
  const mockTransaction = id ? mockTransactions[id] : null;
  
  // Helper: resolve full card number from wallet data by last 4 digits
  const walletCards = walletData?.data?.cards || [];
  const formatCardNumber = (num: string): string => {
    const clean = num.replace(/\s/g, '');
    if (clean.length >= 16) return `${clean.slice(0,4)} ${clean.slice(4,8)} ${clean.slice(8,12)} ${clean.slice(12,16)}`;
    return num;
  };
  const resolveFullCard = (mask: string | undefined | null, movementIndex?: number): string | undefined => {
    if (!mask) return undefined;
    const last4 = mask.replace(/[^0-9]/g, '').slice(-4);
    // Try wallet cards first
    const found = walletCards.find((c: any) => c.card_number?.slice(-4) === last4);
    if (found) {
      return formatCardNumber(found.card_number);
    }
    // Try movements card_number
    if (receipt?.movements && movementIndex !== undefined && (receipt.movements[movementIndex] as any)?.card_number) {
      return formatCardNumber((receipt.movements[movementIndex] as any).card_number);
    }
    // Try any movement matching last4
    if (receipt?.movements) {
      for (const mov of receipt.movements) {
        if ((mov as any).card_number && (mov as any).card_number.slice(-4) === last4) {
          return formatCardNumber((mov as any).card_number);
        }
      }
    }
    return mask;
  };
  const resolveCardType = (mask: string | undefined | null, movementIndex?: number): "Virtual" | "Metal" => {
    // First try movements from receipt
    if (receipt?.movements && movementIndex !== undefined && receipt.movements[movementIndex]) {
      const accType = receipt.movements[movementIndex].account_type;
      if (accType === 'metal') return 'Metal';
      if (accType === 'virtual') return 'Virtual';
    }
    if (!mask) return "Virtual";
    const last4 = mask.slice(-4);
    const found = walletCards.find((c: any) => c.card_number?.slice(-4) === last4);
    return found?.type === 'metal' ? 'Metal' : 'Virtual';
  };

  // Resolve full IBAN from wallet data
  const fullIban = walletData?.data?.physical_account?.iban || '';
  const resolveFullIban = (mask: string | undefined | null): string | undefined => {
    if (!mask) return undefined;
    // If receipt has beneficiary_iban (full), use it
    if (receipt?.beneficiary_iban) return receipt.beneficiary_iban;
    // Try to match from wallet
    const last4 = mask.slice(-4);
    if (fullIban && fullIban.slice(-4) === last4) return fullIban;
    return mask;
  };

  // Build transaction from receipt data if no mock found (API transaction)
  const transaction = mockTransaction || (receipt ? (() => {
    const senderLast4 = receipt.sender_card_mask?.slice(-4) || '';
    const receiverLast4 = receipt.receiver_card_mask?.slice(-4) || '';
    const senderCardType = resolveCardType(receipt.sender_card_mask, 0);
    const receiverCardType = resolveCardType(receipt.receiver_card_mask, 1);
    
    return {
      id: id || '',
      merchant: receipt.operation || receipt.type || 'Transaction',
      time: new Date(receipt.date_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      date: new Date(receipt.date_time).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      amountUSDT: receipt.amount_crypto ?? receipt.amount ?? receipt.amount_aed ?? 0,
      amountLocal: receipt.amount_aed ?? receipt.amount ?? 0,
      localCurrency: receipt.amount_crypto != null ? 'USDT' : 'AED',
      color: '#3B82F6',
      cardLast4: senderLast4 || receiverLast4 || '',
      exchangeRate: 3.65,
      status: (receipt.status === 'completed' ? 'settled' : receipt.status) as any,
      type: (() => {
        const typeMap: Record<string, string> = {
          'bank_withdrawal': 'bank_transfer',
          'bank_topup': 'topup',
          'crypto_topup': 'topup',
          'crypto_withdrawal': 'crypto_send',
          'card_transfer': 'card_transfer',
          'crypto_deposit': 'crypto_deposit',
          'bank_transfer_incoming': 'bank_transfer_incoming',
          'transfer_out': 'bank_transfer',
          'transfer_in': 'bank_transfer_incoming',
          'internal_transfer': 'internal_transfer',
          'bank_to_card': 'bank_transfer',
          'card_to_bank': 'bank_transfer_incoming',
          'iban_to_card': 'bank_transfer',
          'iban_to_iban': 'bank_transfer',
          'crypto_to_card': 'crypto_to_card',
          'crypto_to_bank': 'crypto_to_bank',
        };
        let mapped = typeMap[receipt.type] || receipt.type || 'payment';
        // If crypto_withdrawal but user is the recipient (different user_id), treat as deposit
        if (receipt.type === 'crypto_withdrawal') {
          const currentUserId = String(user?.id || '');
          const receiptUserId = String(receipt.user_id || '');
          const isIncoming = (currentUserId && receiptUserId && currentUserId !== receiptUserId) ||
            (receipt as any).is_incoming === true;
          if (isIncoming) mapped = 'crypto_deposit';
        }
        // If bank_withdrawal, determine direction by comparing user IDs
        if (receipt.type === 'bank_withdrawal') {
          let isIncoming = false;
          // Primary: compare receipt user_id (sender) with current user
          const currentUserId = String(user?.id || '');
          const receiptUserId = String(receipt.user_id || '');
          if (currentUserId && receiptUserId && currentUserId !== receiptUserId) {
            // Current user is NOT the sender → they are the recipient
            isIncoming = true;
          } else if (!currentUserId || !receiptUserId) {
            // Fallback: if beneficiary matches current user name, it's incoming
            if (receipt.beneficiary_name && user?.full_name) {
              const benName = receipt.beneficiary_name.toLowerCase().trim();
              const userName = user.full_name.toLowerCase().trim();
              if (benName === userName || userName.includes(benName) || benName.includes(userName)) {
                isIncoming = true;
              }
            }
          }
          if (isIncoming) mapped = 'bank_transfer_incoming';
        }
        return mapped as any;
      })(),
      recipientCard: receipt.type === 'crypto_to_card' ? cachedRecipientCard?.slice(-4) : receiverLast4,
      recipientCardFull: receipt.type === 'crypto_to_card' ? (cachedRecipientCard ? formatCardNumber(cachedRecipientCard) : undefined) : resolveFullCard(receipt.receiver_card_mask, 1),
      recipientCardType: receipt.type === 'crypto_to_card' ? ((cryptoToCardRecipient as any)?.card_type === 'metal' ? 'Metal' : 'Virtual') : receiverCardType,
      recipientName: receipt.type === 'crypto_to_card' ? (cryptoToCardRecipient as any)?.recipient_name : (receipt.recipient_name || receipt.beneficiary_name || (receipt as any).to_name),
      recipientAvatar: receipt.type === 'crypto_to_card' ? (cryptoToCardRecipient as any)?.avatar_url : undefined,
      senderName: receipt.sender_name,
      senderCard: senderLast4 || undefined,
      senderCardFull: resolveFullCard(receipt.sender_card_mask, 0),
      fromCardFull: resolveFullCard(receipt.sender_card_mask, 0),
      toCardFull: receipt.type === 'crypto_to_card' ? (cachedRecipientCard ? formatCardNumber(cachedRecipientCard) : undefined) : resolveFullCard(receipt.receiver_card_mask, 1),
      toWalletAddress: receipt.to_address_mask || receipt.to_address || (receipt as any).recipient_address,
      fromWalletAddress: receipt.type === 'crypto_to_card' ? ((receipt as any).direction === 'inbound' ? (receipt.from_address_mask || receipt.from_address || undefined) : userCryptoWallet?.address) : (receipt.from_address_mask || receipt.from_address || (receipt as any).sender_address),
      fromAddress: receipt.type === 'crypto_to_card' ? ((receipt as any).direction === 'inbound' ? (receipt.from_address_mask || receipt.from_address || undefined) : userCryptoWallet?.address) : (receipt.from_address_mask || receipt.from_address || (receipt as any).sender_address),
      toWalletAddressFull: receipt.to_address || (receipt as any).recipient_address,
      fromWalletAddressFull: receipt.type === 'crypto_to_card' ? userCryptoWallet?.address : (receipt.from_address || (receipt as any).sender_address),
      tokenNetwork: receipt.type === 'crypto_to_card' ? (userCryptoWallet ? `${userCryptoWallet.token}, ${userCryptoWallet.network}` : 'USDT, TRC20') : (receipt.network_and_token || ((receipt as any).token && (receipt as any).network ? `${(receipt as any).token}, ${(receipt as any).network}` : undefined)),
      transferFee: receipt.fee ?? receipt.fee_amount,
      networkFee: receipt.fee ?? receipt.fee_amount,
      bankFee: receipt.fee_amount,
      recipientIban: receipt.type === 'crypto_to_bank' ? (receipt.beneficiary_iban || (receipt as any).to_iban || resolveFullIban(receipt.iban_mask)) : resolveFullIban(receipt.iban_mask),
      recipientBankName: receipt.beneficiary_bank_name || receipt.bank_name,
      senderIban: receipt.iban_mask,
      senderBankName: receipt.bank_name,
      beneficiaryName: receipt.beneficiary_name,
      cardType: senderCardType,
      originalApiType: receipt.type,
      // crypto_to_card specific
      cryptoToCardCreditedAed: receipt.type === 'crypto_to_card' ? receipt.movements?.find(m => m.type === 'credit')?.amount : undefined,
      cryptoToCardExchangeRate: receipt.type === 'crypto_to_card' ? receipt.exchange_rate : undefined,
      cryptoToCardFeePercent: receipt.type === 'crypto_to_card' && receipt.amount && receipt.fee ? ((receipt.fee / receipt.amount) * 100) : undefined,
    };
  })() : null) as typeof mockTransaction;

  const getInitial = (name: string) => name.charAt(0).toUpperCase();
  const isTopup = transaction?.type === "topup";
  const isDeclined = transaction?.type === "declined";
  const isCardActivation = transaction?.type === "card_activation";
  const isCardTransfer = transaction?.type === "card_transfer";
  const isCryptoSend = transaction?.type === "crypto_send";
  const isCryptoDeposit = transaction?.type === "crypto_deposit";
  const isBankTransfer = transaction?.type === "bank_transfer";
  const isBankTransferIncoming = transaction?.type === "bank_transfer_incoming";
  const isInternalTransfer = transaction?.type === "internal_transfer";
   const isCryptoToCard = transaction?.type === "crypto_to_card";
  const isCryptoToBank = transaction?.type === "crypto_to_bank";
  const isIncomingCryptoToBank = isCryptoToBank && (() => {
    // Check cached list data for direction (primary source of truth)
    if (apiTxGroups) {
      for (const group of apiTxGroups) {
        const found = group.transactions?.find((t: any) => {
          const txRealId = t.id?.startsWith('api_') ? t.id.slice(4) : t.id;
          return txRealId === realTransactionId;
        });
        if (found?.metadata?.isIncoming !== undefined) return found.metadata.isIncoming;
      }
    }
    if ((receipt as any)?.direction === 'inbound') return true;
    if ((receipt as any)?.direction === 'outbound') return false;
    // For crypto_to_bank, do NOT use beneficiary name matching as fallback
    // because the user may send to their own IBAN, which would falsely flag as incoming
    return false;
  })();
  const isIncomingCryptoToCard = isCryptoToCard && (() => {
    // Check cached list data for isIncoming flag (from direction: 'inbound')
    if (apiTxGroups) {
      for (const group of apiTxGroups) {
        const found = group.transactions?.find((t: any) => {
          const txRealId = t.id?.startsWith('api_') ? t.id.slice(4) : t.id;
          return txRealId === realTransactionId;
        });
        if (found?.metadata?.isIncoming !== undefined) return found.metadata.isIncoming;
      }
    }
    // Check receipt direction explicitly
    if ((receipt as any)?.direction === 'inbound') return true;
    if ((receipt as any)?.direction === 'outbound') return false;
    // If sender name matches current user, it's outgoing (user sends from their wallet to card)
    if (receipt?.sender_name && user?.full_name) {
      const senderName = receipt.sender_name.toLowerCase().trim();
      const userName = user.full_name.toLowerCase().trim();
      if (senderName === userName || userName.includes(senderName) || senderName.includes(userName)) return false;
    }
    // Fallback: check movements
    if (receipt?.movements?.length) {
      return receipt.movements[0]?.type === 'credit';
    }
    // Fallback: no fromWalletAddress means recipient side
    return !transaction?.fromWalletAddress && !!transaction?.recipientCard;
  })();
  // For API transactions, determine direction: if movements[0] is debit, it's outgoing
  const isIncomingTransfer = isCardTransfer && (() => {
    if (receipt?.movements?.length) {
      return receipt.movements[0]?.type === 'credit';
    }
    return !!transaction?.senderCard && !transaction?.recipientCard;
  })();
  const isOutgoingTransfer = isCardTransfer && !isIncomingTransfer && !!transaction?.recipientCard;
  
  const [showToCard, setShowToCard] = useState(false);
  const [showFromCard, setShowFromCard] = useState(false);
  const [showWalletAddress, setShowWalletAddress] = useState(false);
  const [showFromAddress, setShowFromAddress] = useState(false);
  const [showIban, setShowIban] = useState(false);

  // Loading state for API transactions
  if (!transaction && receiptLoading) {
    return (
      <MobileLayout header={<button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft className="w-5 h-5" /><span className="text-sm">{t("transaction.back")}</span></button>}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </MobileLayout>
    );
  }

  if (!transaction) {
    return (
      <MobileLayout header={<button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft className="w-5 h-5" /><span className="text-sm">{t("transaction.back")}</span></button>}>
        <div className="flex flex-col items-center justify-center h-64 gap-2">
          <p className="text-muted-foreground">{t("transaction.notFound", "Транзакция не найдена")}</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      header={
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">{t("transaction.back")}</span>
        </button>
      }
    >
      <PullToRefresh
        onRefresh={async () => {
          // Simulate checking for status update
          await new Promise(resolve => setTimeout(resolve, 1000));
          toast.success(t("transaction.statusChecked"));
        }}
        className="h-full overflow-auto"
      >
        <div className="px-4 py-6 space-y-6 pb-28">
        {/* Header with merchant icon and amount */}
        <div className="flex flex-col items-center text-center space-y-3">
          {isBankTransferIncoming ? (
            <motion.div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-white overflow-hidden"
              style={{ backgroundColor: "#22C55E" }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <motion.div
                initial={{ y: -60, x: 60, opacity: 0 }}
                animate={{ y: 0, x: 0, opacity: 1 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.15, 
                  ease: [0.34, 1.56, 0.64, 1]
                }}
              >
                <Landmark className="w-10 h-10" strokeWidth={2} />
              </motion.div>
            </motion.div>
          ) : isBankTransfer ? (
            <motion.div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-white overflow-hidden"
              style={{ backgroundColor: "#8B5CF6" }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <motion.div
                initial={{ y: 60, x: -60, opacity: 0 }}
                animate={{ y: 0, x: 0, opacity: 1 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.15, 
                  ease: [0.34, 1.56, 0.64, 1]
                }}
              >
                <Landmark className="w-10 h-10" strokeWidth={2} />
              </motion.div>
            </motion.div>
          ) : isCryptoToCard || isCryptoToBank ? (
            <motion.div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-white overflow-hidden"
              style={{ backgroundColor: isCryptoToBank ? (isIncomingCryptoToBank ? "#22C55E" : "#8B5CF6") : (isIncomingCryptoToCard ? "#22C55E" : "#007AFF") }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <motion.div
                initial={{ y: isCryptoToBank ? 60 : (isIncomingCryptoToCard ? -60 : 60), x: isCryptoToBank ? -60 : (isIncomingCryptoToCard ? 60 : -60), opacity: 0 }}
                animate={{ y: 0, x: 0, opacity: 1 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.15, 
                  ease: [0.34, 1.56, 0.64, 1]
                }}
              >
                {isCryptoToBank ? <Landmark className="w-10 h-10" strokeWidth={2} /> : <CreditCard className="w-10 h-10" strokeWidth={2} />}
              </motion.div>
            </motion.div>
          ) : isCryptoSend ? (
            <motion.div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-white overflow-hidden"
              style={{ backgroundColor: "#007AFF" }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <motion.div
                initial={{ y: 60, x: -60, opacity: 0 }}
                animate={{ y: 0, x: 0, opacity: 1 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.15, 
                  ease: [0.34, 1.56, 0.64, 1]
                }}
              >
                <Send className="w-10 h-10" strokeWidth={2.5} />
              </motion.div>
            </motion.div>
          ) : isCryptoDeposit ? (
            <motion.div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: "#22C55E" }}
              initial={{ scale: 1 }}
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 90, 90]
              }}
              transition={{
                duration: 0.6,
                ease: "easeOut",
                times: [0, 0.4, 1]
              }}
            >
              <motion.div
                initial={{ rotate: 0, scale: 0 }}
                animate={{ rotate: 90, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1, ease: "backOut" }}
              >
                <Plus className="w-10 h-10" strokeWidth={2.5} />
              </motion.div>
            </motion.div>
          ) : isCardActivation ? (
            <motion.div 
              className="w-20 h-20 rounded-full flex items-center justify-center font-black text-4xl overflow-hidden relative"
              style={{ backgroundColor: "#CCFF00" }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Card flying away */}
              <motion.div
                className="absolute"
                initial={{ scale: 1, y: 0, opacity: 1 }}
                animate={{ scale: 0.5, y: -60, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeIn" }}
              >
                <CreditCard className="w-10 h-10 text-black" strokeWidth={2} />
              </motion.div>
              {/* Letter C flying in */}
              <motion.span
                className="text-black"
                initial={{ scale: 0, y: 40, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.35, 
                  ease: [0.34, 1.56, 0.64, 1]
                }}
              >
                C
              </motion.span>
            </motion.div>
          ) : isCardTransfer ? (
            <motion.div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-white overflow-hidden"
              style={{ backgroundColor: isIncomingTransfer ? "#22C55E" : "#007AFF" }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{
                duration: 0.4,
                ease: "easeOut"
              }}
            >
              {isIncomingTransfer ? (
                <motion.div
                  initial={{ y: -60, x: 60, opacity: 0 }}
                  animate={{ y: 0, x: 0, opacity: 1 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.15, 
                    ease: [0.34, 1.56, 0.64, 1]
                  }}
                >
                  <ArrowUpRight className="w-10 h-10 rotate-180" strokeWidth={2.5} />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ y: 60, x: -60, opacity: 0 }}
                  animate={{ y: 0, x: 0, opacity: 1 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.15, 
                    ease: [0.34, 1.56, 0.64, 1]
                  }}
                >
                  <ArrowUpRight className="w-10 h-10" strokeWidth={2.5} />
                </motion.div>
              )}
            </motion.div>
          ) : isDeclined ? (
            <motion.div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl overflow-hidden relative"
              initial={{ backgroundColor: "#EF4444" }}
              animate={{ 
                backgroundColor: transaction.color,
                x: [0, -4, 4, -4, 4, -2, 2, 0]
              }}
              transition={{
                backgroundColor: { duration: 0.6, delay: 0.4 },
                x: { duration: 0.5, delay: 0.1 }
              }}
            >
              {/* Error icon flying away */}
              <motion.div
                className="absolute"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 0.5, y: -50, opacity: 0 }}
                transition={{ duration: 0.35, delay: 0.3, ease: "easeIn" }}
              >
                <XCircle className="w-10 h-10 text-white" strokeWidth={2} />
              </motion.div>
              {/* Letter appearing */}
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 0.55, 
                  ease: [0.34, 1.56, 0.64, 1]
                }}
              >
                {getInitial(transaction.merchant)}
              </motion.span>
            </motion.div>
          ) : isTopup ? (
            <motion.div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl"
              style={{ backgroundColor: transaction.color }}
              initial={{ scale: 1 }}
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 90, 90]
              }}
              transition={{
                duration: 0.6,
                ease: "easeOut",
                times: [0, 0.4, 1]
              }}
            >
              <motion.div
                initial={{ rotate: 0, scale: 0 }}
                animate={{ rotate: 90, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1, ease: "backOut" }}
              >
                <Plus className="w-10 h-10" strokeWidth={2.5} />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl overflow-hidden relative"
              style={{ backgroundColor: transaction.color }}
              initial={{ scale: 0.8 }}
              animate={{ scale: [0.8, 1.15, 1] }}
              transition={{
                duration: 0.5,
                ease: "easeOut",
                times: [0, 0.5, 1]
              }}
            >
              {/* Checkmark flying away */}
              <motion.div
                className="absolute"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1.5, y: -50, opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.2, ease: "easeIn" }}
              >
                <CheckCircle className="w-8 h-8 text-white" strokeWidth={2.5} />
              </motion.div>
              {/* Letter appearing */}
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 0.5, 
                  ease: [0.34, 1.56, 0.64, 1]
                }}
              >
                {getInitial(transaction.merchant)}
              </motion.span>
            </motion.div>
          )}
          
          <div className="space-y-1">
            <p className={`text-4xl font-bold ${isTopup || isIncomingTransfer || isBankTransferIncoming || isCryptoDeposit || isIncomingCryptoToCard || isIncomingCryptoToBank ? 'text-green-500' : isDeclined ? 'text-red-500' : isOutgoingTransfer || isCryptoSend || isBankTransfer || isInternalTransfer || isCryptoToCard || isCryptoToBank ? 'text-[#007AFF]' : ''}`}>
              {isTopup || isIncomingTransfer || isBankTransferIncoming || isCryptoDeposit || isIncomingCryptoToCard || isIncomingCryptoToBank ? '+' : '-'}{isCryptoToBank ? (receipt?.movements?.[1]?.amount || (transaction.amountUSDT * (receipt?.exchange_rate || 3.65))).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : isCryptoToCard ? transaction.amountUSDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : isCryptoDeposit || isCryptoSend ? transaction.amountUSDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (isTopup ? (transaction.amountUSDT * 3.65 * 0.98) : transaction.amountLocal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xl font-medium text-muted-foreground">{isCryptoToBank ? 'AED' : isCryptoToCard || isCryptoDeposit || isCryptoSend ? 'USDT' : 'AED'}</span>
            </p>
            <p className="text-base">
              {isCryptoToBank ? t('transaction.walletToIban') : isIncomingCryptoToCard ? "USDT → EasyCard" : isCryptoToCard ? t('transaction.walletToCard') : isCryptoDeposit ? t('transactions.walletDeposit') : isBankTransferIncoming ? t('transaction.accountIncoming') : isInternalTransfer ? t('transactions.ibanToCard') : isBankTransfer ? ((transaction as any)?.originalApiType === 'transfer_out' ? t('transactions.ibanToCard') : "IBAN Bank → IBAN Bank") : isCryptoSend ? t('transaction.stablecoinSend') : isTopup ? t('transaction.topUp') : isCardActivation ? t('transaction.annualCardFee') : isIncomingTransfer ? t('transaction.received') : isOutgoingTransfer ? t('transaction.cardTransfer') : t('transaction.paymentTo', { merchant: transaction.merchant })}
            </p>
            <p className="text-sm text-muted-foreground">
              {transaction.date}, {transaction.time}
            </p>
          </div>
        </div>

        {/* Status and Card/Address info */}
        <div className="bg-secondary rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("transaction.status")}</span>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <span className={`font-medium ${isDeclined ? 'text-red-500' : transaction.status === 'processing' ? 'text-[#FFA000]' : ''}`}>
                  {isDeclined ? t("transaction.declined") : transaction.status === 'processing' ? t("transaction.processing") : t("transaction.settled")}
                </span>
                {isDeclined ? (
                  <Ban className="w-4 h-4 text-red-500" />
                ) : transaction.status === 'processing' ? (
                  <Clock className="w-4 h-4 text-[#FFA000]" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>
              {isDeclined && transaction.declineReason && (
                <span className="text-sm text-muted-foreground">
                  {transaction.declineReason === "No funds" ? t("transaction.noFunds") : transaction.declineReason}
                </span>
              )}
            </div>
          </div>
          
          {isBankTransferIncoming ? (
            <>
              {/* Sender info - from the receipt's user_id perspective */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.sender")}</span>
                <span className="font-medium">{transaction.senderName || (receipt as any)?.sender_name || "—"}</span>
              </div>
              {/* Sender IBAN - use userIban from the sender's wallet if available via multi-account */}
              {(() => {
                // Try to find sender's IBAN from multi-account wallet data
                // The receipt user_id is the sender
                const senderUserId = String(receipt?.user_id || '');
                // We don't have sender's IBAN in the receipt, so skip this row
                return null;
              })()}
              {/* Recipient IBAN (current user's account) */}
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">{t("transaction.toAccount")}</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => navigate("/account")}
                    className="font-medium text-[#007AFF] hover:underline transition-colors text-right text-sm"
                  >
                    {(() => {
                      const recipientIban = receipt?.beneficiary_iban || userIban;
                      if (!recipientIban) return "AED Account";
                      return showToCard ? recipientIban : `${recipientIban.slice(0, 4)}••••${recipientIban.slice(-4)}`;
                    })()}
                  </button>
                  {(receipt?.beneficiary_iban || userIban) && (
                    <>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(receipt?.beneficiary_iban || userIban || '');
                          toast.success(t("toast.copied", { label: "IBAN" }));
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setShowToCard(!showToCard)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showToCard ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.recipient")}</span>
                <span className="font-medium">{receipt?.beneficiary_name || user?.full_name || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.bankName")}</span>
                <span className="font-medium">{receipt?.beneficiary_bank_name || "EasyCard FZE"}</span>
              </div>
            </>
          ) : isInternalTransfer ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.fromAccount")}</span>
                <button 
                  onClick={() => navigate("/account")}
                  className="font-medium text-[#007AFF] hover:underline transition-colors"
                >
                  {userIban 
                    ? (showIban ? userIban : `${userIban.slice(0, 4)}••••${userIban.slice(-4)}`)
                    : t("transaction.aedAccount")
                  }
                </button>
              </div>
              {userIban && (
                <div className="flex items-center justify-end gap-2 -mt-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(userIban);
                      toast.success(t("toast.copied", { label: "IBAN" }));
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowIban(!showIban)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showIban ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.toCard")}</span>
                <span className="font-medium">{t("transaction.cardBalance")}</span>
              </div>
              {receipt?.description && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("transaction.description")}</span>
                  <span className="font-medium text-right text-sm max-w-[200px]">{receipt.description}</span>
                </div>
              )}
            </>
          ) : isCryptoToCard && isIncomingCryptoToCard ? (
            <>
              {/* Sender info */}
              {transaction.senderName && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("transaction.sender")}</span>
                  <span className="font-medium">{transaction.senderName}</span>
                </div>
              )}
              {/* To Card (user's card) */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.toCard")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {showToCard ? `Visa ${transaction.recipientCardType || ''} ${transaction.recipientCardFull || ''}` : `Visa ${transaction.recipientCardType || ''} ••${transaction.recipientCard || transaction.cardLast4 || ''}`}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(transaction.recipientCardFull?.replace(/\s/g, '') || '');
                      toast.success(t("toast.cardNumberCopied"));
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowToCard(!showToCard)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showToCard ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {/* From Wallet (sender's wallet) */}
              {transaction.fromWalletAddress && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("transaction.fromWallet")}</span>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {showFromAddress ? transaction.fromWalletAddress : `${transaction.fromWalletAddress?.slice(0, 6)}...${transaction.fromWalletAddress?.slice(-4)}`}
                    </span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText((transaction as any).fromWalletAddressFull || transaction.fromWalletAddress || '');
                        toast.success(t("toast.addressCopied"));
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setShowFromAddress(!showFromAddress)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showFromAddress ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
              {/* Token & Network */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.tokenNetwork")}</span>
                <span className="font-medium">{transaction.tokenNetwork || 'USDT, TRC20'}</span>
              </div>
            </>
          ) : isCryptoToCard ? (
            <>
              {/* Recipient with avatar */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.recipient")}</span>
                <div className="flex items-center gap-2">
                  {(transaction as any).recipientAvatar && (
                    <img src={(transaction as any).recipientAvatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                  )}
                  <span className="font-medium">{transaction.recipientName || '—'}</span>
                </div>
              </div>
              {/* To Card */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.toCard")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {showToCard ? `Visa ${transaction.recipientCardType || ''} ${transaction.recipientCardFull || ''}` : `Visa ${transaction.recipientCardType || ''} ••${transaction.recipientCard || ''}`}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(transaction.recipientCardFull?.replace(/\s/g, '') || '');
                      toast.success(t("toast.cardNumberCopied"));
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowToCard(!showToCard)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showToCard ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {/* From Wallet */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.fromWallet", "Кошелёк")}</span>
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">
                    {showFromAddress ? transaction.fromWalletAddress : `${transaction.fromWalletAddress?.slice(0, 6)}...${transaction.fromWalletAddress?.slice(-4)}`}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText((transaction as any).fromWalletAddressFull || transaction.fromWalletAddress || '');
                      toast.success(t("toast.addressCopied"));
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowFromAddress(!showFromAddress)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showFromAddress ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {/* Token & Network */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.tokenNetwork")}</span>
                <span className="font-medium">{transaction.tokenNetwork}</span>
              </div>
            </>
          ) : isCryptoToBank ? (
            <>
              {/* Sender - wallet */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.sender")}</span>
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">
                    {showFromAddress ? (userCryptoWallet?.address || '—') : `${(userCryptoWallet?.address || '').slice(0, 6)}...${(userCryptoWallet?.address || '').slice(-4)}`}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(userCryptoWallet?.address || '');
                      toast.success(t("toast.addressCopied"));
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowFromAddress(!showFromAddress)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showFromAddress ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {/* Token & Network */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.tokenNetwork")}</span>
                <span className="font-medium">{userCryptoWallet ? `${userCryptoWallet.token}, ${userCryptoWallet.network}` : 'USDT, TRC20'}</span>
              </div>
              {/* Recipient - IBAN */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.recipient")}</span>
                <span className="font-medium">{transaction.recipientName || receipt?.beneficiary_name || receipt?.recipient_name || (receipt as any)?.to_name || '—'}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">{t("transaction.iban")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-right text-sm">
                    {showIban ? (receipt?.beneficiary_iban || receipt?.to_iban || transaction.recipientIban || fullIban || '—') : `${(receipt?.beneficiary_iban || receipt?.to_iban || transaction.recipientIban || fullIban || '').slice(0, 4)}••••${(receipt?.beneficiary_iban || receipt?.to_iban || transaction.recipientIban || fullIban || '').slice(-4)}`}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(receipt?.beneficiary_iban || receipt?.to_iban || transaction.recipientIban || fullIban || '');
                      toast.success(t("toast.copied", { label: "IBAN" }));
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowIban(!showIban)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showIban ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.bankName")}</span>
                <span className="font-medium">{receipt?.beneficiary_bank_name || receipt?.bank_name || 'EasyCard Default Bank'}</span>
              </div>
            </>
          ) : isBankTransfer ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.recipient")}</span>
                <span className="font-medium">{transaction.recipientName}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">{t("transaction.iban")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-right text-sm">
                    {showIban ? transaction.recipientIban : `${transaction.recipientIban?.slice(0, 4)}••••${transaction.recipientIban?.slice(-4)}`}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(transaction.recipientIban || '');
                      toast.success(t("toast.copied", { label: "IBAN" }));
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowIban(!showIban)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showIban ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.bankName")}</span>
                <span className="font-medium">{transaction.recipientBankName}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">{t("transaction.fromAccount")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-right text-sm">
                    {userIban 
                      ? (showFromCard ? userIban : `${userIban.slice(0, 4)}••••${userIban.slice(-4)}`)
                      : t("transaction.aedAccount")
                    }
                  </span>
                  {userIban && (
                    <>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(userIban);
                          toast.success(t("toast.copied", { label: "IBAN" }));
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setShowFromCard(!showFromCard)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showFromCard ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : isCryptoSend ? (
            <>
              {/* Recipient info for internal transfers */}
              {receipt?.is_internal && receipt?.recipient_name && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("transaction.recipient")}</span>
                  <div className="flex items-center gap-2">
                    {receipt.recipient_avatar && (
                      <img src={receipt.recipient_avatar as string} alt="" className="w-6 h-6 rounded-full object-cover" />
                    )}
                    <span className="font-medium">{receipt.recipient_name as string}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-500">
                      {t("transaction.inNetwork")}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">{t("transaction.toAddress")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-right text-sm max-w-[160px] break-all">
                    {showWalletAddress ? ((transaction as any).toWalletAddressFull || transaction.toWalletAddress) : `${transaction.toWalletAddress?.slice(0, 6)}...${transaction.toWalletAddress?.slice(-6)}`}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText((transaction as any).toWalletAddressFull || transaction.toWalletAddress || '');
                      toast.success(t("toast.addressCopied"));
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowWalletAddress(!showWalletAddress)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showWalletAddress ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.tokenNetwork")}</span>
                <span className="font-medium">{transaction.tokenNetwork}</span>
              </div>
              {transaction.fromWalletAddress && (
                <div className="flex items-start justify-between">
                  <span className="text-muted-foreground">{t("transaction.fromWallet")}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-right text-sm max-w-[160px] break-all">
                      {showFromAddress ? ((transaction as any).fromWalletAddressFull || transaction.fromWalletAddress) : `${transaction.fromWalletAddress?.slice(0, 6)}...${transaction.fromWalletAddress?.slice(-6)}`}
                    </span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText((transaction as any).fromWalletAddressFull || transaction.fromWalletAddress || '');
                        toast.success(t("toast.addressCopied"));
                      }}
                      className="p-1 rounded-md hover:bg-muted transition-colors"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button 
                      onClick={() => setShowFromAddress(!showFromAddress)}
                      className="p-1 rounded-md hover:bg-muted transition-colors"
                    >
                      {showFromAddress ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : isCryptoDeposit ? (
            <>
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">{t("transaction.fromAddress")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-right text-sm max-w-[160px] break-all">
                    {showFromAddress ? transaction.fromAddress : `${transaction.fromAddress?.slice(0, 6)}...${transaction.fromAddress?.slice(-6)}`}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(transaction.fromAddress || '');
                      toast.success(t("toast.addressCopied"));
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowFromAddress(!showFromAddress)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showFromAddress ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.tokenNetwork")}</span>
                <span className="font-medium">{transaction.tokenNetwork}</span>
              </div>
              {transaction.toWalletAddress && (
                <div className="flex items-start justify-between">
                  <span className="text-muted-foreground">{t("transaction.toWallet")}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-right text-sm max-w-[160px] break-all">
                      {showWalletAddress ? transaction.toWalletAddress : `${transaction.toWalletAddress.slice(0, 6)}...${transaction.toWalletAddress.slice(-6)}`}
                    </span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(transaction.toWalletAddress || '');
                        toast.success(t("toast.addressCopied"));
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setShowWalletAddress(!showWalletAddress)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showWalletAddress ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : isTopup ? (
            <>
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">{t("transaction.fromAddress")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-right text-sm max-w-[160px] break-all">
                    {showFromAddress ? transaction.fromAddress : `${transaction.fromAddress?.slice(0, 6)}...${transaction.fromAddress?.slice(-6)}`}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(transaction.fromAddress || '');
                      toast.success(t("toast.addressCopied"));
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowFromAddress(!showFromAddress)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showFromAddress ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.tokenNetwork")}</span>
                <span className="font-medium">{transaction.tokenNetwork}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.toCard")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {showToCard ? `Visa ${transaction.cardType} ${transaction.toCardFull || ''}` : `Visa ${transaction.cardType} ••${transaction.cardLast4}`}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(transaction.toCardFull?.replace(/\s/g, '') || '');
                      toast.success(t("toast.cardNumberCopied"));
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowToCard(!showToCard)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showToCard ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : isCardActivation ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.cardType")}</span>
                <span className="font-medium">Visa {transaction.cardType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.annualCardFee")}</span>
                <span className="font-medium">183.00 AED</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.networkFeeFlat")}</span>
                <span className="font-medium">{transaction.networkFee?.toFixed(2)} USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.networkFeeAed")}</span>
                <span className="font-medium">{((transaction.networkFee || 5.90) * 3.65).toFixed(2)} AED</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-muted-foreground font-medium">{t("transaction.total")}</span>
                <span className="font-bold text-primary">{transaction.amountLocal.toFixed(2)} AED</span>
              </div>
            </>
          ) : isIncomingTransfer ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.sender")}</span>
                <span className="font-medium">{transaction.senderName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.fromCard")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {showFromCard ? `Visa ${transaction.senderCardFull}` : `Visa ••${transaction.senderCard}`}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(transaction.senderCardFull?.replace(/\s/g, '') || '');
                      toast.success(t("toast.cardNumberCopied"));
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowFromCard(!showFromCard)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showFromCard ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.toCard")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {showToCard ? `Visa ${transaction.cardType || 'Virtual'} ${transaction.toCardFull}` : `Visa ${transaction.cardType || 'Virtual'} ••${transaction.cardLast4}`}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(transaction.toCardFull?.replace(/\s/g, '') || '');
                      toast.success(t("toast.cardNumberCopied"));
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowToCard(!showToCard)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showToCard ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : isOutgoingTransfer ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.sender")}</span>
                <span className="font-medium">{transaction.senderName || user?.full_name || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.fromCard")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {showFromCard ? `Visa ${transaction.cardType} ${transaction.fromCardFull}` : `Visa ${transaction.cardType} ••${transaction.cardLast4}`}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(transaction.fromCardFull?.replace(/\s/g, '') || '');
                      toast.success(t("toast.cardNumberCopied"));
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowFromCard(!showFromCard)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showFromCard ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.recipient")}</span>
                <span className="font-medium">{transaction.recipientName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.toCard")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {showToCard ? `Visa ${transaction.recipientCardType || ''} ${transaction.recipientCardFull}` : `Visa ${transaction.recipientCardType || ''} ••${transaction.recipientCard}`}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(transaction.recipientCardFull?.replace(/\s/g, '') || '');
                      toast.success(t("toast.cardNumberCopied"));
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowToCard(!showToCard)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showToCard ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("transaction.card")}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {showToCard ? `Visa ${transaction.cardType || 'Virtual'} ${transaction.toCardFull || transaction.fromCardFull || ''}` : `Visa ${transaction.cardType || 'Virtual'} ••${transaction.cardLast4}`}
                </span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText((transaction.toCardFull || transaction.fromCardFull || '')?.replace(/\s/g, '') || '');
                    toast.success(t("toast.cardNumberCopied"));
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShowToCard(!showToCard)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showToCard ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Transaction details */}
        <div className="bg-secondary rounded-2xl p-4 space-y-3">
          {isCryptoToCard && isIncomingCryptoToCard ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.sentAmount")}</span>
                <span className="font-medium">{transaction.amountUSDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.fee")} ({(transaction as any).cryptoToCardFeePercent?.toFixed(0) || '1'}%)</span>
                <span className="font-medium">{transaction.transferFee?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.networkFeeFlat")}</span>
                <span className="font-medium">5.90 USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.exchangeRate")}</span>
                <span className="font-medium">1 USDT = {(transaction as any).cryptoToCardExchangeRate || 3.65} AED</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-muted-foreground">{t("transaction.credited")}</span>
                <span className="font-semibold text-green-500">+{((transaction as any).cryptoToCardCreditedAed || transaction.amountLocal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED</span>
              </div>
            </>
          ) : isCryptoToCard ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.sentAmount")}</span>
                <span className="font-medium">{transaction.amountUSDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.fee")} ({(transaction as any).cryptoToCardFeePercent?.toFixed(0) || '1'}%)</span>
                <span className="font-medium">{transaction.transferFee?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.networkFeeFlat")}</span>
                <span className="font-medium">5.90 USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.totalDeducted")}</span>
                <span className="font-medium">{(transaction.amountUSDT + (transaction.transferFee || 0) + 5.90).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.exchangeRate")}</span>
                <span className="font-medium">1 USDT = {(transaction as any).cryptoToCardExchangeRate || 3.65} AED</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-muted-foreground">{t("transaction.credited")}</span>
                <span className="font-semibold text-green-500">+{((transaction as any).cryptoToCardCreditedAed || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED</span>
              </div>
            </>
          ) : isCryptoToBank ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.sentAmount")}</span>
                <span className="font-medium">{transaction.amountUSDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.fee")} ({receipt?.amount && receipt?.fee ? `${((receipt.fee / receipt.amount) * 100).toFixed(0)}%` : '2%'})</span>
                <span className="font-medium">{(receipt?.fee || transaction.transferFee || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.networkFeeFlat")}</span>
                <span className="font-medium">5.90 USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.totalDeducted")}</span>
                <span className="font-medium">{(receipt?.movements?.[0]?.amount || (transaction.amountUSDT + (receipt?.fee || 0) + 5.90)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.exchangeRate")}</span>
                <span className="font-medium">1 USDT = {receipt?.exchange_rate || 3.65} AED</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-muted-foreground">{t("transaction.creditedToIban")}</span>
                <span className="font-semibold text-green-500">+{(receipt?.movements?.[1]?.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED</span>
              </div>
            </>
          ) : isInternalTransfer ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.transferAmount")}</span>
                <span className="font-medium">{transaction.amountLocal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.fee")}</span>
                <span className="font-medium">{(transaction.bankFee || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-muted-foreground">{t("transaction.total")}</span>
                <span className="font-semibold text-[#007AFF]">-{transaction.amountLocal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED</span>
              </div>
            </>
          ) : isBankTransfer ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.transferAmount")}</span>
                <span className="font-medium">{transaction.amountUSDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.bankFee")}</span>
                <span className="font-medium">{transaction.bankFee?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED (2%)</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-muted-foreground">{t("transaction.total")}</span>
                <span className="font-semibold text-[#007AFF]">-{(transaction.amountUSDT + (transaction.bankFee || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED</span>
              </div>
            </>
          ) : isCryptoSend ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.sentAmount")}</span>
                <span className="font-medium">{transaction.amountUSDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.fee")} (1%)</span>
                <span className="font-medium">{transaction.transferFee?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.networkFeeFlat")}</span>
                <span className="font-medium">{transaction.networkFee?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-muted-foreground">{t("transaction.total")}</span>
                <span className="font-semibold text-[#007AFF]">-{(transaction.amountUSDT + (transaction.transferFee || 0) + (transaction.networkFee || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
              </div>
            </>
          ) : isCryptoDeposit ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.received")}</span>
                <span className="font-medium">{transaction.amountUSDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.tokenNetwork")}</span>
                <span className="font-medium">{transaction.tokenNetwork}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-muted-foreground">{t("transaction.credited")}</span>
                <span className="font-semibold text-green-500">+{transaction.amountUSDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
              </div>
            </>
          ) : isTopup ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.received")}</span>
                <span className="font-medium">{transaction.amountUSDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.exchangeRate")}</span>
                <span className="font-medium">1 USDT = 3.65 AED</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.cardFee")}</span>
                <span className="font-medium">2%</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-muted-foreground">{t("transaction.credited")}</span>
                <span className="font-semibold text-green-500">+{(transaction.amountUSDT * 3.65 * 0.98).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED</span>
              </div>
            </>
          ) : isCardActivation ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.price")}</span>
                <span className="font-medium">50.00 USD</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.exchangeRate")}</span>
                <span className="font-medium">1 USD = 3.65 AED</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-muted-foreground">{t("transaction.amount")}</span>
                <span className="font-semibold">182.50 AED</span>
              </div>
            </>
          ) : isIncomingTransfer ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.receivedAmount")}</span>
                <span className="font-semibold text-green-500">+{transaction.amountLocal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED</span>
              </div>
            </>
          ) : isOutgoingTransfer ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.transferAmount")}</span>
                <span className="font-medium">{transaction.amountLocal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.fee")}</span>
                <span className="font-medium">{transaction.transferFee?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-muted-foreground">{t("transaction.total")}</span>
                <span className="font-semibold">{(transaction.amountUSDT + (transaction.transferFee || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.amount")}</span>
                <span className="font-semibold">{transaction.amountUSDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED</span>
              </div>
            </>
          )}
        </div>

        {/* Transaction details link (only for topup) */}
        {isTopup && (
          <div className="bg-secondary rounded-2xl overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <span className="font-medium">{t("transaction.transactionDetails")}</span>
              <ExternalLink className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Receipt from API */}
        {hasToken && (
          <div className="bg-secondary rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">{t("transaction.receipt")}</span>
            </div>
            {receiptLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : receipt ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("transaction.status")}</span>
                  <span className="font-medium capitalize">{receipt.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("transaction.operation")}</span>
                  <span className="font-medium">{receipt.operation}</span>
                </div>
                {receipt.amount_crypto != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("transaction.amount")}</span>
                    <span className="font-medium">{receipt.amount_crypto} {receipt.network_and_token || 'USDT'}</span>
                  </div>
                )}
                {receipt.amount != null && !receipt.amount_crypto && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("transaction.amount")}</span>
                    <span className="font-medium">{receipt.amount} AED</span>
                  </div>
                )}
                {receipt.fee != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("transaction.fee")}</span>
                    <span className="font-medium">{receipt.fee} {receipt.amount_crypto != null ? 'USDT' : 'AED'}</span>
                  </div>
                )}
                {receipt.to_address_mask && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("transaction.toAddress")}</span>
                    <span className="font-medium">{receipt.to_address_mask}</span>
                  </div>
                )}
                {receipt.from_address_mask && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("transaction.fromAddress")}</span>
                    <span className="font-medium">{receipt.from_address_mask}</span>
                  </div>
                )}
                {receipt.network_and_token && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("transaction.tokenNetwork")}</span>
                    <span className="font-medium">{receipt.network_and_token}</span>
                  </div>
                )}
                {receipt.sender_card_mask && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("transaction.fromCard")}</span>
                    <span className="font-medium">{receipt.sender_card_mask}</span>
                  </div>
                )}
                {receipt.receiver_card_mask && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("transaction.toCard")}</span>
                    <span className="font-medium">{receipt.receiver_card_mask}</span>
                  </div>
                )}
                {receipt.recipient_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("transaction.recipient")}</span>
                    <span className="font-medium">{receipt.recipient_name}</span>
                  </div>
                )}
                {receipt.iban_mask && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("transaction.iban")}</span>
                    <span className="font-medium">{receipt.iban_mask}</span>
                  </div>
                )}
                {receipt.tx_hash && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">TX Hash</span>
                    <span className="font-medium text-xs break-all max-w-[180px] text-right">{receipt.tx_hash}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                  <span>ID</span>
                  <span className="font-mono">{receipt.transaction_id?.slice(0, 8)}...</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("transaction.receiptUnavailable")}</p>
            )}
          </div>
        )}

        {/* Links */}
        <div className="bg-secondary rounded-2xl overflow-hidden">
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b border-border/50">
            <span className="font-medium">{t("transaction.termsAndFees")}</span>
            <Info className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <span className="font-medium">{t("transaction.contactSupport")}</span>
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Footer */}
        <div className="pt-4">
          <PoweredByFooter />
        </div>
        </div>
      </PullToRefresh>
    </MobileLayout>
  );
};

export default TransactionDetails;
