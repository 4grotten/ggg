import { memo, useMemo, useState, useRef, useEffect } from "react";
import { CreditCard, ArrowDownLeft, ArrowUpRight, Wallet, ExternalLink, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CardType } from "@/types/card";
import { WithdrawalDetailsDrawer } from "./WithdrawalDetailsDrawer";
import { motion } from "framer-motion";

type FilterType = "all" | "cards" | "transactions" | "withdrawals";

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
  // Withdrawal specific fields
  withdrawalMethod?: "crypto" | "card";
  cryptoNetwork?: string;
  networkFee?: number;
  isClickable?: boolean;
}

export const MOCK_TRANSACTIONS: ReferralTransaction[] = [
  {
    id: "1",
    userName: "Александр К.",
    type: "card",
    cardType: "virtual",
    amount: 27.45,
    originalAmount: 183,
    percent: 15,
    date: "14:32",
    dateGroup: "today",
    dateTimestamp: Date.now() - 3600000,
    level: "R1"
  },
  {
    id: "2",
    userName: "Мария С.",
    type: "transaction",
    amount: 2.50,
    originalAmount: 5000,
    percent: 0.05,
    date: "12:15",
    dateGroup: "today",
    dateTimestamp: Date.now() - 7200000,
    level: "R1"
  },
  {
    id: "3",
    userName: "Дмитрий В.",
    type: "card",
    cardType: "metal",
    amount: 45.75,
    originalAmount: 305,
    percent: 15,
    date: "19:45",
    dateGroup: "yesterday",
    dateTimestamp: Date.now() - 86400000,
    level: "R1"
  },
  {
    id: "4",
    userName: "Елена П.",
    type: "transaction",
    amount: 7.50,
    originalAmount: 15000,
    percent: 0.05,
    date: "16:20",
    dateGroup: "yesterday",
    dateTimestamp: Date.now() - 90000000,
    level: "R1"
  },
  {
    id: "5",
    userName: "Артём Н.",
    type: "card",
    cardType: "metal",
    amount: 75.00,
    originalAmount: 500,
    percent: 15,
    date: "11:00",
    dateGroup: "yesterday",
    dateTimestamp: Date.now() - 100000000,
    level: "R1"
  },
  {
    id: "6",
    userName: "Ольга М.",
    type: "transaction",
    amount: 12.00,
    originalAmount: 24000,
    percent: 0.05,
    date: "20:30",
    dateGroup: "23 января",
    dateTimestamp: Date.now() - 172800000,
    level: "R1"
  },
  {
    id: "7",
    userName: "Иван Т.",
    type: "card",
    cardType: "virtual",
    amount: 27.45,
    originalAmount: 183,
    percent: 15,
    date: "15:12",
    dateGroup: "23 января",
    dateTimestamp: Date.now() - 180000000,
    level: "R1"
  },
  {
    id: "8",
    userName: "Наталья Р.",
    type: "transaction",
    amount: 3.75,
    originalAmount: 7500,
    percent: 0.05,
    date: "18:45",
    dateGroup: "22 января",
    dateTimestamp: Date.now() - 259200000,
    level: "R1"
  },
  {
    id: "9",
    userName: "Сергей Л.",
    type: "card",
    cardType: "metal",
    amount: 45.75,
    originalAmount: 305,
    percent: 15,
    date: "10:30",
    dateGroup: "22 января",
    dateTimestamp: Date.now() - 270000000,
    level: "R1"
  },
  {
    id: "10",
    userName: "Анна Б.",
    type: "transaction",
    amount: 5.00,
    originalAmount: 10000,
    percent: 0.05,
    date: "14:00",
    dateGroup: "21 января",
    dateTimestamp: Date.now() - 345600000,
    level: "R1"
  },
  {
    id: "11",
    userName: "Вывод средств",
    type: "withdrawal",
    amount: -100,
    originalAmount: 100,
    percent: 0,
    date: "16:45",
    dateGroup: "23 января",
    dateTimestamp: Date.now() - 172800000 + 3600000,
    level: "R1",
    withdrawalMethod: "crypto",
    cryptoNetwork: "TRC20",
    networkFee: 5.90,
    isClickable: true
  },
  {
    id: "12",
    userName: "Вывод средств",
    type: "withdrawal",
    amount: -50,
    originalAmount: 50,
    percent: 0.5,
    date: "11:20",
    dateGroup: "26 января",
    dateTimestamp: Date.now() + 86400000,
    level: "R1",
    withdrawalMethod: "card",
    cardType: "virtual",
    networkFee: 0.25,
    isClickable: true
  },
];

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

const FILTER_OPTIONS: FilterType[] = ["all", "cards", "transactions", "withdrawals"];

const FilterTabs = memo(({ 
  activeFilter, 
  onFilterChange,
  labels
}: { 
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  labels: Record<FilterType, string>;
}) => {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  
  useEffect(() => {
    const activeIndex = FILTER_OPTIONS.indexOf(activeFilter);
    const button = buttonRefs.current[activeIndex];
    if (button) {
      setIndicatorStyle({
        left: button.offsetLeft,
        width: button.offsetWidth
      });
    }
  }, [activeFilter]);

  return (
    <div className="relative flex items-center gap-1">
      {/* Animated indicator */}
      <motion.div
        className="absolute h-full bg-primary rounded-full"
        initial={false}
        animate={{
          x: indicatorStyle.left,
          width: indicatorStyle.width
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 35
        }}
        style={{ left: 0 }}
      />
      
      {FILTER_OPTIONS.map((filter, index) => (
        <button
          key={filter}
          ref={(el) => { buttonRefs.current[index] = el; }}
          onClick={() => onFilterChange(filter)}
          className={`relative z-10 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
            activeFilter === filter 
              ? "text-primary-foreground" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {labels[filter]}
        </button>
      ))}
    </div>
  );
});

FilterTabs.displayName = "FilterTabs";

export const ReferralTransactions = memo(() => {
  const { t } = useTranslation();
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<ReferralTransaction | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const handleWithdrawalClick = (tx: ReferralTransaction) => {
    setSelectedWithdrawal(tx);
    setDrawerOpen(true);
  };
  
  // Filter and group transactions
  const { groupedTransactions, filteredTransactions } = useMemo(() => {
    let filtered = [...MOCK_TRANSACTIONS];
    
    // Apply filter
    if (filterType === "cards") {
      filtered = filtered.filter(tx => tx.type === "card");
    } else if (filterType === "transactions") {
      filtered = filtered.filter(tx => tx.type === "transaction");
    } else if (filterType === "withdrawals") {
      filtered = filtered.filter(tx => tx.type === "withdrawal");
    }
    
    // Sort by date
    filtered.sort((a, b) => b.dateTimestamp - a.dateTimestamp);
    
    // Group by date
    const groups: { [key: string]: { transactions: ReferralTransaction[]; income: number; withdrawals: number } } = {};
    
    filtered.forEach((tx) => {
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
    
    return { groupedTransactions: groups, filteredTransactions: filtered };
  }, [filterType]);
  
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
  
  const totalAmount = useMemo(() => 
    filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0),
  [filteredTransactions]);
  
  
  return (
    <div className="px-4 mb-6">
      {/* Filter tabs with animated indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <FilterTabs
            activeFilter={filterType}
            onFilterChange={setFilterType}
            labels={{
              all: t('partner.filterAll', 'Все'),
              cards: t('partner.filterCards', 'Карты'),
              transactions: t('partner.filterTransactions', 'Транзакции'),
              withdrawals: t('partner.filterWithdrawals', 'Выводы')
            }}
          />
        </div>
        
        {/* Referral History Button */}
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
        >
          <Clock className="w-4 h-4" />
          {t('partner.referralHistory', 'Реферальная история')}
        </button>
      </div>
      
      {/* Grouped by date */}
      {Object.keys(groupedTransactions).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([dateGroup, { transactions, income, withdrawals }]) => (
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
                  {transactions.map((tx) => (
                    <TransactionItem key={tx.id} tx={tx} onWithdrawalClick={handleWithdrawalClick} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-muted/70 dark:bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border/50 text-center">
          <p className="text-muted-foreground text-sm">
            {t('partner.noTransactions', 'Нет транзакций')}
          </p>
        </div>
      )}
      
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
          walletAddress: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
          cardLast4: "7617",
          cardFeePercent: selectedWithdrawal.percent,
          status: "completed"
        } : null}
      />
    </div>
  );
});

ReferralTransactions.displayName = "ReferralTransactions";
