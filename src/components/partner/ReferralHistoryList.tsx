import { memo, useMemo, useState } from "react";
import { CreditCard, ArrowDownLeft, ArrowUpRight, Wallet, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CardType } from "@/types/card";
import { WithdrawalDetailsDrawer } from "./WithdrawalDetailsDrawer";

interface ReferralTransaction {
  id: string;
  userName: string;
  type: "card" | "transaction" | "withdrawal";
  cardType?: CardType;
  amount: number;
  originalAmount: number;
  percent: number;
  date: string;
  dateGroup: string;
  dateTimestamp: number;
  level: string;
  withdrawalMethod?: "crypto" | "card";
  cryptoNetwork?: string;
  networkFee?: number;
  isClickable?: boolean;
}

interface ReferralHistoryListProps {
  transactions: ReferralTransaction[];
}

const CardIcon = memo(({ cardType }: { cardType?: CardType }) => {
  if (cardType === "metal") {
    return <CreditCard className="w-5 h-5 text-zinc-800 dark:text-zinc-300" />;
  }
  return <CreditCard className="w-5 h-5 text-emerald-500 dark:text-[#BFFF00]" />;
});

CardIcon.displayName = "CardIcon";

const TransactionIcon = memo(({ type, cardType, withdrawalMethod }: { type: "card" | "transaction" | "withdrawal"; cardType?: CardType; withdrawalMethod?: "crypto" | "card" }) => {
  if (type === "withdrawal") {
    if (withdrawalMethod === "crypto") {
      return <Wallet className="w-5 h-5 text-blue-500" />;
    }
    return <ArrowUpRight className="w-5 h-5 text-blue-500" />;
  }
  if (type === "card") {
    return <CardIcon cardType={cardType} />;
  }
  return <ArrowDownLeft className="w-5 h-5 text-blue-500" />;
});

TransactionIcon.displayName = "TransactionIcon";

const maskName = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    const firstName = parts[0];
    const lastName = parts[1];
    const maskedFirst = firstName.slice(0, 2) + '***';
    const maskedLast = lastName.slice(0, 1) + '***';
    return `${maskedFirst} ${maskedLast}`;
  }
  return name.slice(0, 2) + '***';
};

const getCardTypeName = (cardType?: CardType, t?: (key: string, fallback: string) => string): string => {
  if (cardType === "metal") {
    return t?.('partner.metalCard', 'Metal карта') ?? 'Metal карта';
  }
  return t?.('partner.virtualCard', 'Virtual карта') ?? 'Virtual карта';
};

const TransactionItem = memo(({ tx, onWithdrawalClick }: { tx: ReferralTransaction; onWithdrawalClick?: (tx: ReferralTransaction) => void }) => {
  const { t } = useTranslation();
  const isCard = tx.type === "card";
  const isWithdrawal = tx.type === "withdrawal";
  
  const handleClick = () => {
    if (isWithdrawal && tx.isClickable && onWithdrawalClick) {
      onWithdrawalClick(tx);
    }
  };
  
  const getDescription = () => {
    if (isWithdrawal) {
      if (tx.withdrawalMethod === "crypto") {
        return `${tx.cryptoNetwork} • Комиссия ${tx.networkFee} USDT`;
      }
      return `${t('partner.virtualCard', 'Virtual карта')} • Комиссия ${tx.percent}%`;
    }
    if (isCard) {
      return `${getCardTypeName(tx.cardType, t)} • ${tx.percent}%`;
    }
    return `${t('partner.transactionFee', 'Комиссия с транзакции')} • ${tx.percent}%`;
  };
  
  return (
    <button 
      onClick={handleClick}
      className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
        tx.isClickable 
          ? "bg-blue-500/5 hover:bg-blue-500/10 active:bg-blue-500/15" 
          : "hover:bg-secondary/50 active:bg-secondary/70"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isWithdrawal ? "bg-blue-100 dark:bg-blue-900/30" : "bg-secondary"
        }`}>
          <TransactionIcon type={tx.type} cardType={tx.cardType} withdrawalMethod={tx.withdrawalMethod} />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-sm">
              {isWithdrawal ? t('partner.withdrawal', 'Вывод средств') : maskName(tx.userName)}
            </p>
            {tx.isClickable && (
              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {getDescription()}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-semibold text-sm ${isWithdrawal ? "text-blue-500" : "text-success"}`}>
          {isWithdrawal ? `${tx.amount.toFixed(2)}` : `+${tx.amount.toFixed(2)}`} AED
        </p>
        <p className="text-xs text-muted-foreground">{tx.date}</p>
      </div>
    </button>
  );
});

TransactionItem.displayName = "TransactionItem";

export const ReferralHistoryList = memo(({ transactions }: ReferralHistoryListProps) => {
  const { t } = useTranslation();
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<ReferralTransaction | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleWithdrawalClick = (tx: ReferralTransaction) => {
    setSelectedWithdrawal(tx);
    setDrawerOpen(true);
  };

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: { transactions: ReferralTransaction[]; income: number; withdrawals: number } } = {};
    
    transactions.forEach((tx) => {
      if (!groups[tx.dateGroup]) {
        groups[tx.dateGroup] = { transactions: [], income: 0, withdrawals: 0 };
      }
      groups[tx.dateGroup].transactions.push(tx);
      if (tx.type === "withdrawal") {
        groups[tx.dateGroup].withdrawals += Math.abs(tx.amount);
      } else {
        groups[tx.dateGroup].income += tx.amount;
      }
    });
    
    return groups;
  }, [transactions]);

  const getDateLabel = (dateGroup: string) => {
    if (dateGroup === "today") {
      const today = new Date();
      return today.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    }
    if (dateGroup === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    }
    return dateGroup;
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-muted/70 dark:bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border/50 text-center">
        <p className="text-muted-foreground text-sm">
          {t('partner.noTransactions', 'Нет транзакций')}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groupedTransactions).map(([dateGroup, { transactions: txs, income, withdrawals }]) => (
          <div key={dateGroup}>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-sm font-medium">
                {getDateLabel(dateGroup)}
              </p>
              <div className="flex items-center gap-3">
                {income > 0 && (
                  <p className="text-sm font-medium text-success">
                    +{income.toFixed(2)} AED
                  </p>
                )}
                {withdrawals > 0 && (
                  <p className="text-sm font-medium text-blue-500">
                    -{withdrawals.toFixed(2)} AED
                  </p>
                )}
              </div>
            </div>
            <div className="bg-muted/70 dark:bg-card/70 backdrop-blur-xl rounded-2xl overflow-hidden border border-border/50">
              <div className="space-y-0">
                {txs.map((tx) => (
                  <TransactionItem key={tx.id} tx={tx} onWithdrawalClick={handleWithdrawalClick} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Withdrawal Details Drawer */}
      <WithdrawalDetailsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        withdrawal={selectedWithdrawal ? {
          id: selectedWithdrawal.id,
          amount: selectedWithdrawal.amount,
          date: selectedWithdrawal.dateGroup,
          time: selectedWithdrawal.date,
          withdrawalMethod: selectedWithdrawal.withdrawalMethod || "crypto",
          cryptoNetwork: selectedWithdrawal.cryptoNetwork,
          networkFee: selectedWithdrawal.networkFee,
          cardType: selectedWithdrawal.cardType,
          cardFeePercent: selectedWithdrawal.percent,
          status: "completed"
        } : null}
      />
    </>
  );
});

ReferralHistoryList.displayName = "ReferralHistoryList";
