import { useNavigate } from "react-router-dom";
import { Plus, Ban, ArrowUpRight, Clock, CheckCircle, Send, Landmark, CreditCard } from "lucide-react";
import { UsdtIcon } from "@/components/icons/CryptoIcons";
import { useTranslation } from "react-i18next";
import { Transaction, TransactionGroup } from "@/types/transaction";

interface CardTransactionsListProps {
  groups: TransactionGroup[];
  onTransactionClick?: (transaction: Transaction) => void;
  walletView?: boolean;
  viewAsUserId?: string;
}

const getInitial = (name: string) => name.charAt(0).toUpperCase();

const maskMiddle = (value: string): string => {
  if (value.length <= 10) return value;
  return `${value.slice(0, 7)}···${value.slice(-4)}`;
};

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
  
  if (type === "crypto_to_bank") {
    return t("transaction.walletToIban");
  }
  
  if (type === "iban_to_iban") {
    return "IBAN Bank → IBAN Bank";
  }
  
  const merchantsMap: { [key: string]: string } = {
    "Card Transfer": "transactions.cardTransfer",
    "Top up": "transactions.topUp",
    "Annual Card fee": "transactions.annualCardFee",
    "Stablecoin Send": "transactions.stablecoinSend",
    "Bank Transfer": "transactions.bankTransfer",
    "IBAN to Card": "transactions.ibanToCard",
    "iban_to_iban": "IBAN Bank → IBAN Bank",
  };
  
  return merchantsMap[merchant] ? t(merchantsMap[merchant]) : merchant;
};

export const CardTransactionsList = ({
  groups,
  onTransactionClick,
  walletView = false,
  viewAsUserId,
}: CardTransactionsListProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

const handleClick = (transaction: Transaction) => {
    if (onTransactionClick) {
      onTransactionClick(transaction);
    } else {
      const url = viewAsUserId 
        ? `/transaction/${transaction.id}?viewAs=${viewAsUserId}`
        : `/transaction/${transaction.id}`;
      navigate(url);
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
    const isCryptoSend = transaction.type === "crypto_withdrawal" || transaction.type === "crypto_send" || (transaction.metadata as any)?.originalApiType === 'crypto_to_crypto';
    const isCryptoDeposit = transaction.type === "crypto_deposit";
    const isBankTransfer = transaction.type === "bank_transfer";
    const isBankTransferIncoming = transaction.type === "bank_transfer_incoming";
    const isCryptoToCard = transaction.type === "crypto_to_card";
    const isCryptoToIbanList = (transaction.type as string) === "crypto_to_iban";
    const isIncomingCryptoToCard = isCryptoToCard && (transaction.metadata as any)?.isIncoming;
    const isIncomingCryptoToIban = isCryptoToIbanList && (transaction.metadata as any)?.isIncoming;
    const apiIsIncoming = (transaction.metadata as any)?.isIncoming;
    const hasBothCards = !!transaction.senderCard && !!transaction.recipientCard;
    const isIncomingTransfer = isCardTransfer && (
      apiIsIncoming !== undefined ? apiIsIncoming 
      : hasBothCards ? false  // default outgoing if both present and no API flag
      : !!transaction.senderCard && !transaction.recipientCard
    );
    const isOutgoingTransfer = isCardTransfer && (
      apiIsIncoming !== undefined ? !apiIsIncoming 
      : hasBothCards ? true
      : !!transaction.recipientCard && !transaction.senderCard
    );
    const isProcessing = transaction.status === "processing";
    // In wallet view, topup = outgoing (wallet → card), so it's negative
    const walletTopupOutgoing = walletView && isTopup;
    const prefix = (isTopup && !walletView) || isIncomingTransfer || isBankTransferIncoming || isCryptoDeposit || isIncomingCryptoToCard || isIncomingCryptoToIban ? "+" : walletTopupOutgoing || isOutgoingTransfer || isCryptoSend || isBankTransfer || (isCryptoToCard && !isIncomingCryptoToCard) || (isCryptoToIbanList && !isIncomingCryptoToIban) ? "-" : "";
    
    let colorClass = "";
    if (isProcessing && (isCardTransfer || isBankTransfer || isCryptoSend)) {
      colorClass = "text-[#FFA000]";
    } else if (walletTopupOutgoing) {
      colorClass = "text-[#007AFF]";
    } else if (isTopup || isIncomingTransfer || isBankTransferIncoming || isCryptoDeposit || isIncomingCryptoToCard || isIncomingCryptoToIban) {
      colorClass = "text-green-500";
    } else if (isDeclined) {
      colorClass = "text-red-500";
    } else if (isOutgoingTransfer || isCryptoSend || isBankTransfer || isCryptoToCard || isCryptoToIbanList) {
      colorClass = "text-[#007AFF]";
    }
    
    return { prefix, colorClass, isCardActivation, isCardTransfer, isIncomingTransfer, isOutgoingTransfer, isCryptoSend, isCryptoDeposit, isBankTransfer, isBankTransferIncoming, isCryptoToCard, isIncomingCryptoToCard };
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
            {/* Daily total hidden */}
          </div>

          {/* Transactions */}
          <div className="bg-muted/70 dark:bg-card/70 backdrop-blur-xl rounded-2xl overflow-hidden border border-border/50">
            {group.transactions.map((transaction, index) => {
              const { prefix, colorClass, isCardActivation, isCardTransfer, isIncomingTransfer, isOutgoingTransfer, isCryptoSend, isCryptoDeposit, isBankTransfer, isBankTransferIncoming, isCryptoToCard, isIncomingCryptoToCard } = formatAmount(transaction);
              const isTopup = transaction.type === "topup";
              const isDeclined = transaction.type === "declined";
              const isIncomingCryptoToBank = isBankTransferIncoming && (transaction.metadata as any)?.originalApiType === 'crypto_to_bank';
              const isOutgoingCryptoToBank = (transaction.type as string) === "crypto_to_bank" || (isBankTransfer && (transaction.metadata as any)?.originalApiType === 'crypto_to_bank');
              const isBankToCrypto = (transaction.metadata as any)?.originalApiType === 'bank_to_crypto';
              const isCryptoToIban = (transaction.metadata as any)?.originalApiType === 'crypto_to_iban' || (transaction.type as string) === 'crypto_to_iban';
              const cryptoToIbanMovements = isCryptoToIban ? (transaction.metadata as any)?.movements as Array<{ account_type: string; amount: number; type: string }> | undefined : undefined;
              const isIbanToUsdt = isCryptoToIban && cryptoToIbanMovements?.length === 2 && cryptoToIbanMovements[0]?.account_type === 'bank' && cryptoToIbanMovements[0]?.type === 'debit';
              const isUsdtToIban = isCryptoToIban && !isIbanToUsdt;
              const isIncomingIbanToCard = isBankTransferIncoming && ['internal_transfer', 'bank_to_card', 'iban_to_card'].includes((transaction.metadata as any)?.originalApiType || '');
              const isIbanToIban = ((transaction.type as string) === 'iban_to_iban' || (transaction.metadata as any)?.originalApiType === 'iban_to_iban') && !(transaction.metadata as any)?.isIncoming;
              const isIncomingIbanToIban = ((transaction.type as string) === 'iban_to_iban' || (transaction.metadata as any)?.originalApiType === 'iban_to_iban') && !!(transaction.metadata as any)?.isIncoming;
              const isInternalCardTransfer = (transaction.metadata as any)?.originalApiType === 'internal_transfer' || (transaction.type as string) === 'internal_transfer';

              return (
                <button
                  key={transaction.id}
                  onClick={() => handleClick(transaction)}
                  className={`w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors ${
                    index < group.transactions.length - 1 ? 'border-b border-border/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                     <div className="relative shrink-0">
                      {isCardActivation ? (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                          style={{ backgroundColor: "#CCFF00" }}
                        >
                          <span className="text-black text-lg font-black">C</span>
                        </div>
                      ) : isIncomingCryptoToBank ? (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: "#22C55E" }}
                        >
                          <Landmark className="w-5 h-5" />
                        </div>
                      ) : isInternalCardTransfer ? (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: "#007AFF" }}
                        >
                          <CreditCard className="w-5 h-5" />
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
                          style={{ backgroundColor: "#007AFF" }}
                        >
                          <Landmark className="w-5 h-5" />
                        </div>
                      ) : isCryptoSend ? (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: (transaction.metadata as any)?.isIncoming ? "#22C55E" : "#007AFF" }}
                        >
                          <UsdtIcon size={22} />
                        </div>
                      ) : isCardTransfer ? (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: isIncomingTransfer ? "#22C55E" : "#007AFF" }}
                        >
                          <CreditCard className="w-5 h-5" />
                        </div>
                      ) : isCryptoDeposit ? (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: "#22C55E" }}
                        >
                          <UsdtIcon size={22} />
                        </div>
                      ) : walletView && isTopup ? (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: "#007AFF" }}
                        >
                          <CreditCard className="w-5 h-5" />
                        </div>
                      ) : isCryptoToCard ? (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm relative"
                          style={{ backgroundColor: isIncomingCryptoToCard ? "#22C55E" : "#007AFF" }}
                        >
                          <CreditCard className="w-5 h-5" />
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#26A17B] flex items-center justify-center ring-2 ring-background">
                            <UsdtIcon size={10} />
                          </div>
                        </div>
                      ) : isOutgoingCryptoToBank ? (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm relative"
                          style={{ backgroundColor: "#8B5CF6" }}
                        >
                          <Landmark className="w-5 h-5" />
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#26A17B] flex items-center justify-center ring-2 ring-background">
                            <UsdtIcon size={10} />
                          </div>
                        </div>
                      ) : isBankToCrypto ? (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm relative"
                          style={{ backgroundColor: "#007AFF" }}
                        >
                          <Landmark className="w-5 h-5" />
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#26A17B] flex items-center justify-center ring-2 ring-background">
                            <UsdtIcon size={10} />
                          </div>
                        </div>
                      ) : isCryptoToIban ? (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm relative"
                          style={{ backgroundColor: isIbanToUsdt ? "#007AFF" : "#26A17B" }}
                        >
                          {isIbanToUsdt ? <Landmark className="w-5 h-5" /> : <UsdtIcon size={20} />}
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-background"
                            style={{ backgroundColor: isIbanToUsdt ? "#26A17B" : "#007AFF" }}
                          >
                            {isIbanToUsdt ? <UsdtIcon size={10} /> : <Landmark className="w-2.5 h-2.5 text-white" />}
                          </div>
                        </div>
                      ) : isIncomingIbanToIban ? (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: "#22C55E" }}
                        >
                          <Landmark className="w-5 h-5" />
                        </div>
                      ) : isIbanToIban ? (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: "#007AFF" }}
                        >
                          <Landmark className="w-5 h-5" />
                        </div>
                      ) : (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: transaction.color }}
                        >
                          {isTopup ? <CreditCard className="w-5 h-5" /> : getInitial(transaction.merchant)}
                        </div>
                      )}
                      {isDeclined && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                          <Ban className="w-3 h-3 text-red-500" />
                        </div>
                      )}
                    </div>
                    <div className="text-left min-w-0 flex-1 overflow-hidden">
                      <p className="font-medium truncate text-xs sm:text-sm">
                      {isOutgoingCryptoToBank
                          ? t("transaction.walletToIban")
                          : isIncomingCryptoToBank
                          ? t("transaction.walletToIban")
                          : isCryptoToIban
                          ? (isIbanToUsdt ? "IBAN → USDT" : "USDT → IBAN")
                          : walletView && isTopup 
                          ? t("transactions.cardTopUp") 
                          : isCryptoDeposit
                          ? t("transactions.walletDeposit")
                          : isIncomingCryptoToCard
                           ? "USDT → EasyCard"
                           : isIncomingIbanToCard && !isInternalCardTransfer
                           ? "IBAN → EasyCard"
                           : isInternalCardTransfer
                           ? "EasyCard → EasyCard"
                           : isBankTransferIncoming
                           ? "IBAN Bank → IBAN Bank"
                           : isIncomingTransfer
                           ? t("transactions.cardReceived")
                           : isOutgoingTransfer
                           ? t("transactions.cardTransfer")
                           : isBankTransfer && !isOutgoingCryptoToBank && !isInternalCardTransfer && transaction.merchant === 'IBAN to Card'
                           ? "IBAN → EasyCard"
                           : isBankTransfer
                           ? "IBAN Bank → IBAN Bank"
                           : translateMerchant(transaction.merchant, transaction.type, t)
                        }
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {transaction.time}
                        {isInternalCardTransfer
                          ? (() => {
                              const receiverMask = (transaction.metadata as any)?.receiver_card_mask || transaction.recipientCard || '';
                              const senderMask = (transaction.metadata as any)?.sender_card_mask || transaction.senderCard || '';
                              if (receiverMask) return ` · ${t("transactions.to")} •••• ${receiverMask.slice(-4)}`;
                              if (senderMask) return ` · ${t("transactions.from")} •••• ${senderMask.slice(-4)}`;
                              return '';
                            })()
                          : isIncomingCryptoToBank
                          ? (() => {
                              const wallet = (transaction.metadata as any)?.from_address_mask || (transaction.metadata as any)?.senderWallet || '';
                              if (wallet) return ` · ${t("transactions.from")} ${maskMiddle(wallet)}`;
                              const sender = (transaction.metadata as any)?.sender_name || transaction.senderName || '';
                              return sender ? ` · ${t("transactions.from")} ${maskMiddle(sender)}` : '';
                            })()
                          : isIncomingIbanToCard
                          ? (() => {
                              const sender = transaction.senderName || (transaction.metadata as any)?.sender_name || '';
                              if (sender) return ` · ${t("transactions.from")} ${maskMiddle(sender)}`;
                              return ` · Card····${(transaction.recipientCard || transaction.senderCard || '').slice(-4)}`;
                            })()
                          : isIncomingTransfer
                          ? (() => {
                              const cardMask = transaction.senderCard || (transaction.metadata as any)?.sender_card_mask || transaction.recipientCard || '';
                              const senderName = transaction.senderName || '';
                              if (cardMask) return ` · ${t("transactions.from")} •••• ${cardMask.slice(-4)}`;
                              if (senderName) return ` · ${t("transactions.from")} ${maskMiddle(senderName)}`;
                              const subtitle = (transaction.metadata as any)?.displaySubtitle;
                              if (subtitle) return ` · ${subtitle}`;
                              return '';
                            })()
                          : isOutgoingTransfer && (transaction.recipientCard || transaction.senderCard)
                          ? ` · ${t("transactions.to")} •••• ${(transaction.recipientCard || transaction.senderCard || '').slice(-4)}`
                          : isIncomingIbanToIban
                          ? (() => {
                              const sender = transaction.senderName || (transaction.metadata as any)?.sender_name || '';
                              const receiver = transaction.recipientName || (transaction.metadata as any)?.beneficiary_name || '';
                              if (sender && receiver) return ` · ${sender} → ${receiver}`;
                              if (sender) return ` · ${t("transactions.from")} ${sender}`;
                              const senderIban = (transaction.metadata as any)?.senderIban || '';
                              if (senderIban) {
                                const display = senderIban.replace(/\s*\*+\s*/g, '••••');
                                return ` · ${t("transactions.from")} ${display}`;
                              }
                              return '';
                            })()
                          : isBankTransferIncoming && ((transaction.metadata as any)?.beneficiary_iban || transaction.senderName || (transaction.metadata as any)?.beneficiary_name)
                          ? (() => {
                              const iban = (transaction.metadata as any)?.beneficiary_iban;
                              if (iban) {
                                const display = iban.replace(/\s*\*+\s*/g, '••••');
                                return ` · ${t("transactions.from")} ${display}`;
                              }
                              const name = transaction.senderName || (transaction.metadata as any)?.beneficiary_name;
                              return name ? ` · ${t("transactions.from")} ${maskMiddle(name)}` : '';
                            })()
                          : isOutgoingCryptoToBank
                          ? (() => {
                              const iban = (transaction.metadata as any)?.beneficiary_iban;
                              if (iban) {
                                const display = iban.replace(/\s*\*+\s*/g, '••••');
                               return ` · ${t("transactions.to")} ${display}`;
                              }
                              const name = (transaction.metadata as any)?.beneficiary_name || transaction.recipientName;
                              if (name) return ` · ${t("transactions.to")} ${maskMiddle(name)}`;
                              return '';
                            })()
                          : isIbanToIban
                          ? (() => {
                              const sender = transaction.senderName || (transaction.metadata as any)?.sender_name || '';
                              const receiver = transaction.recipientName || (transaction.metadata as any)?.beneficiary_name || '';
                              if (sender && receiver) return ` · ${sender} → ${receiver}`;
                              if (receiver) return ` · ${t("transactions.to")} ${receiver}`;
                              const iban = (transaction.metadata as any)?.beneficiary_iban;
                              if (iban) {
                                const display = `${iban.slice(0, 4)}••••${iban.slice(-4)}`;
                                return ` · ${t("transactions.to")} ${display}`;
                              }
                              return '';
                            })()
                          : isBankTransfer && !isOutgoingCryptoToBank && transaction.merchant === 'IBAN to Card'
                          ? ` · Card····${(transaction.recipientCard || transaction.senderCard || '').slice(-4)}`
                          : isBankTransfer && !isOutgoingCryptoToBank && (transaction.metadata as any)?.beneficiary_iban
                          ? (() => {
                              const iban = (transaction.metadata as any).beneficiary_iban;
                              const display = `${iban.slice(0, 4)}••••${iban.slice(-4)}`;
                              return ` · ${t("transactions.to")} ${display}`;
                            })()
                          : isBankTransfer && !isOutgoingCryptoToBank && transaction.recipientName
                          ? ` · ${t("transactions.to")} ${maskMiddle(transaction.recipientName)}`
                          : isBankTransfer && !isOutgoingCryptoToBank && transaction.description
                          ? ` · ${t("transactions.to")} ${maskMiddle(transaction.description)}`
                          : isCryptoSend && (transaction.metadata as any)?.to_address
                          ? ` · ${t("transactions.to")} ${maskMiddle(String((transaction.metadata as any).to_address))}`
                          : isCryptoSend && transaction.description
                          ? ` · ${t("transactions.to")} ${maskMiddle(transaction.description.replace(/^Крипто\s*(перевод:?\s*)?/i, '').replace(/^.*→\s*/, '').trim())}`
                          : isCryptoDeposit && transaction.description
                          ? ` · ${t("transactions.from")} ${maskMiddle(transaction.description.replace(/^Крипто\s*(перевод:?\s*)?/i, '').split('→')[0].replace(/[:\s]+$/, '').trim())}`
                          : isCryptoToCard && transaction.recipientCard
                          ? ` ${t("transactions.toVisaCard", { type: (transaction.metadata as any)?.recipientCardType || "Metal", last4: (transaction.recipientCard || '').slice(-4), defaultValue: `На Visa ${(transaction.metadata as any)?.recipientCardType || "Metal"} ••${(transaction.recipientCard || '').slice(-4)}` })}`
                          : isCryptoToIban
                          ? (() => {
                              const wallet = (transaction.metadata as any)?.cryptoAddress || (transaction.metadata as any)?.senderWallet || '';
                              if (wallet) return ` · ${maskMiddle(wallet)}`;
                              const name = transaction.recipientName || '';
                              return name ? ` · ${t("transactions.to")} ${maskMiddle(name)}` : '';
                            })()
                          : isTopup && transaction.description
                          ? ` · ${t("transactions.from")} ${maskMiddle(transaction.description)}`
                          : (() => {
                              const sub = (transaction.metadata as any)?.displaySubtitle;
                              if (sub) return ` · ${sub}`;
                              return '';
                            })()
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-1 sm:ml-2">
                    {(isOutgoingCryptoToBank || isIncomingCryptoToBank) ? (
                      <>
                         <p className={`font-semibold text-xs sm:text-sm ${colorClass}`}>
                          {prefix}{transaction.amountLocal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {transaction.amountUSDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                        </p>
                      </>
                    ) : isCryptoToIban ? (
                      <>
                         <p className={`font-semibold text-xs sm:text-sm ${colorClass}`}>
                          {prefix}{transaction.amountUSDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {transaction.amountLocal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED
                        </p>
                      </>
                    ) : walletView ? (
                      <>
                        <p className={`font-semibold text-xs sm:text-sm md:text-base ${colorClass}`}>
                          {prefix}{transaction.amountUSDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {prefix}{transaction.amountLocal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED
                        </p>
                      </>
                    ) : isInternalCardTransfer ? (
                      <>
                        <p className="font-semibold text-xs sm:text-sm md:text-base text-[#007AFF]">
                          -{transaction.amountLocal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          -{(transaction.amountLocal + (transaction.fee || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED
                        </p>
                      </>
                    ) : (
                      <>
                        <p className={`font-semibold text-xs sm:text-sm md:text-base ${colorClass}`}>
                          {prefix}{(isCryptoDeposit || isCryptoSend) ? transaction.amountUSDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : transaction.amountLocal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {(isCryptoDeposit || isCryptoSend) ? 'USDT' : 'AED'}
                        </p>
                        {isIncomingCryptoToCard && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {transaction.amountUSDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                          </p>
                        )}
                      </>
                    )}
                    {transaction.status === 'processing' && (
                      <p className="flex items-center justify-end gap-0.5 text-[#FFA000] text-[10px] sm:text-xs mt-0.5">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        {t("transactions.processing")}
                      </p>
                    )}
                    {transaction.status === 'settled' && (
                      <p className="flex items-center justify-end gap-0.5 text-green-500 text-[10px] sm:text-xs mt-0.5">
                        <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
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
