import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, CheckCircle, Info, MessageSquare, Ban, Plus, ExternalLink, ArrowUpRight, Clock, Eye, EyeOff, Copy, CreditCard, XCircle, Send, Landmark } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useTranslation } from "react-i18next";

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
  type?: "payment" | "topup" | "declined" | "card_activation" | "card_transfer" | "crypto_send" | "crypto_deposit" | "bank_transfer" | "bank_transfer_incoming";
  fromAddress?: string;
  tokenNetwork?: string;
  kartaFee?: number;
  declineReason?: string;
  cardType?: "Virtual" | "Metal";
  recipientCard?: string;
  recipientCardFull?: string;
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
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  
  const transaction = id ? mockTransactions[id] : null;

  if (!transaction) {
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
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t("transaction.notFound")}</p>
        </div>
      </MobileLayout>
    );
  }

  const getInitial = (name: string) => name.charAt(0).toUpperCase();
  const isTopup = transaction.type === "topup";
  const isDeclined = transaction.type === "declined";
  const isCardActivation = transaction.type === "card_activation";
  const isCardTransfer = transaction.type === "card_transfer";
  const isCryptoSend = transaction.type === "crypto_send";
  const isCryptoDeposit = transaction.type === "crypto_deposit";
  const isBankTransfer = transaction.type === "bank_transfer";
  const isBankTransferIncoming = transaction.type === "bank_transfer_incoming";
  const isIncomingTransfer = isCardTransfer && !!transaction.senderCard;
  const isOutgoingTransfer = isCardTransfer && !!transaction.recipientCard;
  
  const [showToCard, setShowToCard] = useState(false);
  const [showFromCard, setShowFromCard] = useState(false);
  const [showWalletAddress, setShowWalletAddress] = useState(false);
  const [showFromAddress, setShowFromAddress] = useState(false);
  const [showIban, setShowIban] = useState(false);

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
            <p className={`text-4xl font-bold ${isTopup || isIncomingTransfer || isBankTransferIncoming || isCryptoDeposit ? 'text-green-500' : isDeclined ? 'text-red-500' : isOutgoingTransfer || isCryptoSend || isBankTransfer ? 'text-[#007AFF]' : ''}`}>
              {isTopup || isIncomingTransfer || isBankTransferIncoming || isCryptoDeposit ? '+' : '-'}{isCryptoDeposit || isCryptoSend ? transaction.amountUSDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (isTopup ? (transaction.amountUSDT * 3.65 * 0.98) : transaction.amountLocal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xl font-medium text-muted-foreground">{isCryptoDeposit || isCryptoSend ? 'USDT' : 'AED'}</span>
            </p>
            <p className="text-base">
              {isCryptoDeposit ? t('transactions.walletDeposit') : isBankTransferIncoming ? t('transaction.bankTransferIncoming') : isBankTransfer ? t('transaction.bankTransfer') : isCryptoSend ? t('transaction.stablecoinSend') : isTopup ? t('transaction.topUp') : isCardActivation ? t('transaction.annualCardFee') : isIncomingTransfer ? t('transaction.received') : isOutgoingTransfer ? t('transaction.cardTransfer') : t('transaction.paymentTo', { merchant: transaction.merchant })}
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
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.sender")}</span>
                <span className="font-medium">{transaction.senderName}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">{t("transaction.iban")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-right text-sm">
                    {showIban ? transaction.senderIban : `${transaction.senderIban?.slice(0, 4)}••••${transaction.senderIban?.slice(-4)}`}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(transaction.senderIban || '');
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
                <span className="font-medium">{transaction.senderBankName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.toCard")}</span>
                <button 
                  onClick={() => navigate(transaction.cardType === "Metal" ? "/card/metal" : "/card/virtual")}
                  className="font-medium text-[#007AFF] hover:underline transition-colors"
                >
                  Visa {transaction.cardType} ••{transaction.cardLast4}
                </button>
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
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.fromCard")}</span>
                <button 
                  onClick={() => navigate(transaction.cardType === "Metal" ? "/card/metal" : "/card/virtual")}
                  className="font-medium text-[#007AFF] hover:underline transition-colors"
                >
                  Visa {transaction.cardType} ••{transaction.cardLast4}
                </button>
              </div>
            </>
          ) : isCryptoSend ? (
            <>
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">{t("transaction.toAddress")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-right text-sm max-w-[160px] break-all">
                    {showWalletAddress ? transaction.toWalletAddress : `${transaction.toWalletAddress?.slice(0, 6)}...${transaction.toWalletAddress?.slice(-6)}`}
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
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.tokenNetwork")}</span>
                <span className="font-medium">{transaction.tokenNetwork}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">{t("transaction.fromWallet")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-right text-sm max-w-[160px] break-all">
                    {showFromAddress ? transaction.fromWalletAddress : `${transaction.fromWalletAddress?.slice(0, 6)}...${transaction.fromWalletAddress?.slice(-6)}`}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(transaction.fromWalletAddress || '');
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
                <button 
                  onClick={() => navigate(transaction.cardType === "Metal" ? "/card/metal" : "/card/virtual")}
                  className="font-medium text-[#007AFF] hover:underline transition-colors"
                >
                  Visa {transaction.cardType} ••{transaction.cardLast4}
                </button>
              </div>
            </>
          ) : isCardActivation ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.cardType")}</span>
                <button 
                  onClick={() => navigate(transaction.cardType === "Metal" ? "/card/metal" : "/card/virtual")}
                  className="font-medium text-[#007AFF] hover:underline transition-colors"
                >
                  Visa {transaction.cardType}
                </button>
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
                  <button 
                    onClick={() => navigate("/card/virtual")}
                    className="font-medium text-[#007AFF] hover:underline transition-colors"
                  >
                    {showToCard ? `Visa Virtual ${transaction.toCardFull}` : `Visa Virtual ••${transaction.cardLast4}`}
                  </button>
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
                <span className="text-muted-foreground">{t("transaction.recipient")}</span>
                <span className="font-medium">{transaction.recipientName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.toCard")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {showToCard ? `Visa ${transaction.recipientCardFull}` : `Visa ••${transaction.recipientCard}`}
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
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("transaction.fromCard")}</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => navigate(transaction.cardType === "Metal" ? "/card/metal" : "/card/virtual")}
                    className="font-medium text-[#007AFF] hover:underline transition-colors"
                  >
                    {showFromCard ? `Visa ${transaction.cardType} ${transaction.fromCardFull}` : `Visa ${transaction.cardType} ••${transaction.cardLast4}`}
                  </button>
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
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("transaction.card")}</span>
              <button 
                onClick={() => navigate(transaction.cardType === "Metal" ? "/card/metal" : "/card/virtual")}
                className="font-medium text-[#007AFF] hover:underline transition-colors"
              >
                Visa {transaction.cardType || 'Virtual'} ••{transaction.cardLast4}
              </button>
            </div>
          )}
        </div>

        {/* Transaction details */}
        <div className="bg-secondary rounded-2xl p-4 space-y-3">
          {isBankTransfer ? (
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
