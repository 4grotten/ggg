import { useNavigate } from "react-router-dom";
import { Plus, Ban, ArrowUpRight, Clock, CheckCircle, Send, Landmark, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Transaction, TransactionGroup } from "@/types/transaction";

interface CardTransactionsListProps {
  groups: TransactionGroup[];
  onTransactionClick?: (transaction: Transaction) => void;
  walletView?: boolean;
}

const getInitial = (name: string) => name.charAt(0).toUpperCase();

const formatDateNumeric = (date: string): string => {
  const monthsMap: { [key: string]: number } = {
    "January": 1,
    "February": 2,
    "March": 3,
    "April": 4,
    "May": 5,
    "June": 6,
    "July": 7,
    "August": 8,
    "September": 9,
    "October": 10,
    "November": 11,
    "December": 12,
  };
  
  // Already in numeric format (DD.MM.YYYY)
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(date)) {
    return date;
  }
  
  // Parse "Month Day" format (e.g., "January 17")
  for (const [month, monthNum] of Object.entries(monthsMap)) {
    if (date.includes(month)) {
      const day = date.replace(month, "").trim();
      const currentYear = new Date().getFullYear();
      const paddedDay = day.padStart(2, "0");
      const paddedMonth = String(monthNum).padStart(2, "0");
      return `${paddedDay}.${paddedMonth}.${currentYear}`;
    }
  }
  return date;
};

const translateMerchant = (merchant: string, type: string | undefined, t: (key: string) => string): string => {
  if (type === "bank_transfer_incoming") {
    return t("transactions.bankTransferIncoming");
  }
  
  const merchantsMap: { [key: string]: string } = {
    "Card Transfer": "transactions.cardTransfer",
    "Top up": "transactions.topUp",
    "Annual Card fee": "transactions.annualCardFee",
    "Stablecoin Send": "transactions.stablecoinSend",
    "Bank Transfer": "transactions.bankTransfer",
  };
  
  return merchantsMap[merchant] ? t(merchantsMap[merchant]) : merchant;
};

export const CardTransactionsList = ({
  groups,
  onTransactionClick,
  walletView = false,
}: CardTransactionsListProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

const handleClick = (transaction: Transaction) => {
    if (onTransactionClick) {
      onTransactionClick(transaction);
    } else {
      navigate(`/transaction/${transaction.id}`);
    }
  };

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-3">
          <span className="text-2xl text-muted-foreground">💳</span>
        </div>
        <p className="text-muted-foreground text-center text-sm">
          {t("transactions.noTransactions")}
        </p>
      </div>
    );
  }

  const formatAmount = (transaction: Transaction) => {
    const isTopup = transaction.type === "topup";
    const isDeclined = transaction.type === "declined";
    const isCardActivation = transaction.type === "card_activation";
    const isCardTransfer = transaction.type === "card_transfer";
    const isCryptoSend = transaction.type === "crypto_withdrawal";
    const isCryptoDeposit = transaction.type === "crypto_deposit";
    const isBankTransfer = transaction.type === "bank_transfer";
    const isBankTransferIncoming = transaction.type === "bank_transfer_incoming";
    const isIncomingTransfer = isCardTransfer && transaction.senderCard;
    const isOutgoingTransfer = isCardTransfer && transaction.recipientCard;
    const isProcessing = transaction.status === "processing";
    // In wallet view, topup = outgoing (wallet → card), so it's negative
    const walletTopupOutgoing = walletView && isTopup;
    const prefix = (isTopup && !walletView) || isIncomingTransfer || isBankTransferIncoming || isCryptoDeposit ? "+" : walletTopupOutgoing || isOutgoingTransfer || isCryptoSend || isBankTransfer ? "-" : "";
    
    let colorClass = "";
    if (isProcessing && (isCardTransfer || isBankTransfer || isCryptoSend)) {
      colorClass = "text-[#FFA000]";
    } else if (walletTopupOutgoing) {
      colorClass = "text-[#007AFF]";
    } else if (isTopup || isIncomingTransfer || isBankTransferIncoming || isCryptoDeposit) {
      colorClass = "text-green-500";
    } else if (isDeclined) {
      colorClass = "text-red-500";
    } else if (isOutgoingTransfer || isCryptoSend || isBankTransfer) {
      colorClass = "text-[#007AFF]";
    }
    
    return { prefix, colorClass, isCardActivation, isCardTransfer, isIncomingTransfer, isOutgoingTransfer, isCryptoSend, isCryptoDeposit, isBankTransfer, isBankTransferIncoming };
  };

  return (
    <div className="space-y-4">
      {groups.map((group, groupIndex) => (
        <div 
          key={groupIndex} 
          className="space-y-2"
        >
          {/* Date Header */}
          <div className="flex items-center justify-between px-4">
            <span className="font-semibold text-base">{formatDateNumeric(group.date)}</span>
            {group.totalSpend > 0 && !walletView && (
              <span className="text-[#007AFF] text-sm font-medium">
                -{group.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED
              </span>
            )}
          </div>

          {/* Transactions */}
          <div className="bg-muted/70 dark:bg-card/70 backdrop-blur-xl rounded-2xl overflow-hidden border border-border/50">
            {group.transactions.map((transaction, index) => {
              const { prefix, colorClass, isCardActivation, isCardTransfer, isIncomingTransfer, isOutgoingTransfer, isCryptoSend, isCryptoDeposit, isBankTransfer, isBankTransferIncoming } = formatAmount(transaction);
              const isTopup = transaction.type === "topup";
              const isDeclined = transaction.type === "declined";

              return (
                <button
                  key={transaction.id}
                  onClick={() => handleClick(transaction)}
                  className={`w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors ${
                    index < group.transactions.length - 1 ? 'border-b border-border/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {isCardActivation ? (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                          style={{ backgroundColor: "#CCFF00" }}
                        >
                          <span className="text-black text-lg font-black">C</span>
                        </div>
                      ) : isBankTransferIncoming ? (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: "#22C55E" }}
                        >
                          <Landmark className="w-5 h-5" />
                        </div>
                      ) : isBankTransfer ? (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: "#8B5CF6" }}
                        >
                          <Landmark className="w-5 h-5" />
                        </div>
                      ) : isCryptoSend ? (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: "#007AFF" }}
                        >
                          <Send className="w-5 h-5" />
                        </div>
                      ) : isCardTransfer ? (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: isIncomingTransfer ? "#22C55E" : "#007AFF" }}
                        >
                          <ArrowUpRight className={`w-5 h-5 ${isIncomingTransfer ? "rotate-180" : ""}`} />
                        </div>
                      ) : isCryptoDeposit ? (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: "#22C55E" }}
                        >
                          <Plus className="w-5 h-5" />
                        </div>
                      ) : walletView && isTopup ? (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: "#007AFF" }}
                        >
                          <CreditCard className="w-5 h-5" />
                        </div>
                      ) : (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: transaction.color }}
                        >
                          {isTopup ? <Plus className="w-5 h-5" /> : getInitial(transaction.merchant)}
                        </div>
                      )}
                      {isDeclined && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                          <Ban className="w-3 h-3 text-red-500" />
                        </div>
                      )}
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <p className="font-medium">
                        {walletView && isTopup 
                          ? t("transactions.cardTopUp") 
                          : isCryptoDeposit
                          ? t("transactions.walletDeposit")
                          : translateMerchant(transaction.merchant, transaction.type, t)
                        }
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {transaction.time}
                        {isCardTransfer && transaction.senderCard
                          ? ` · ${t("transactions.from")} •••• ${transaction.senderCard}`
                          : isCardTransfer && transaction.recipientCard
                          ? ` · ${t("transactions.to")} •••• ${transaction.recipientCard}`
                          : isBankTransferIncoming && transaction.senderName
                          ? ` · ${t("transactions.from")} ${transaction.senderName}`
                          : isBankTransfer && transaction.description
                          ? ` · ${t("transactions.to")} ${transaction.description}`
                          : isCryptoSend && transaction.description
                          ? ` · ${t("transactions.to")} ${transaction.description}`
                          : isCryptoDeposit && transaction.description
                          ? ` · ${t("transactions.from")} ${transaction.description}`
                          : isTopup && transaction.description
                          ? ` · ${t("transactions.from")} ${transaction.description}`
                          : ""
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {walletView ? (
                      <>
                        <p className={`font-semibold ${colorClass}`}>
                          {prefix}{transaction.amountUSDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {prefix}{(isTopup ? (transaction.amountUSDT * 3.65 * 0.98) : transaction.amountLocal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED
                        </p>
                      </>
                    ) : (
                      <p className={`font-semibold ${colorClass}`}>
                        {prefix}{(isTopup ? (transaction.amountUSDT * 3.65 * 0.98) : transaction.amountLocal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED
                      </p>
                    )}
                    {transaction.status === 'processing' && (
                      <p className="flex items-center justify-end gap-0.5 text-[#FFA000] text-xs mt-0.5">
                        <Clock className="w-3 h-3" />
                        {t("transactions.processing")}
                      </p>
                    )}
                    {transaction.status === 'settled' && (
                      <p className="flex items-center justify-end gap-0.5 text-green-500 text-xs mt-0.5">
                        <CheckCircle className="w-3 h-3" />
                        {t("transactions.settled")}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
