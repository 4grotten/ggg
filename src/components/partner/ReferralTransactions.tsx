import { memo, useMemo, useState } from "react";
import { CreditCard, ArrowDownLeft, ArrowUpDown } from "lucide-react";
import { useTranslation } from "react-i18next";

type CardType = "black" | "green";
type SortType = "date" | "amount" | "type";

interface ReferralTransaction {
  id: string;
  userName: string;
  type: "card" | "transaction";
  cardType?: CardType;
  amount: number;
  originalAmount: number;
  percent: number;
  date: string;
  dateGroup: string;
  dateTimestamp: number;
  level: string;
}

const MOCK_TRANSACTIONS: ReferralTransaction[] = [
  {
    id: "1",
    userName: "Александр К.",
    type: "card",
    cardType: "green",
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
    cardType: "black",
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
    cardType: "black",
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
    cardType: "green",
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
    cardType: "black",
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
];

const CardIcon = memo(({ cardType }: { cardType?: CardType }) => {
  if (cardType === "black") {
    return <CreditCard className="w-5 h-5 text-zinc-800 dark:text-zinc-300" />;
  }
  return <CreditCard className="w-5 h-5 text-emerald-500 dark:text-[#BFFF00]" />;
});

CardIcon.displayName = "CardIcon";

CardIcon.displayName = "CardIcon";

const TransactionIcon = memo(({ type, cardType }: { type: "card" | "transaction"; cardType?: CardType }) => {
  if (type === "card") {
    return <CardIcon cardType={cardType} />;
  }
  return <ArrowDownLeft className="w-5 h-5 text-success" />;
});

TransactionIcon.displayName = "TransactionIcon";

const maskName = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    const firstName = parts[0];
    const lastName = parts[1];
    const maskedFirst = firstName.slice(0, 2) + '***';
    return `${maskedFirst} ${lastName}`;
  }
  return name.slice(0, 2) + '***';
};

const getCardTypeName = (cardType?: CardType, t?: (key: string, fallback: string) => string): string => {
  if (cardType === "black") {
    return t?.('partner.blackCard', 'Black карта') ?? 'Black карта';
  }
  return t?.('partner.greenCard', 'Green карта') ?? 'Green карта';
};

const TransactionItem = memo(({ tx }: { tx: ReferralTransaction }) => {
  const { t } = useTranslation();
  const isCard = tx.type === "card";
  
  return (
    <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 active:bg-secondary/70 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <TransactionIcon type={tx.type} cardType={tx.cardType} />
        </div>
        <div className="text-left">
          <p className="font-medium text-sm">{maskName(tx.userName)}</p>
          <p className="text-xs text-muted-foreground">
            {isCard 
              ? getCardTypeName(tx.cardType, t)
              : t('partner.transactionFee', 'Комиссия с транзакции')
            }
            <span className="mx-1">•</span>
            {tx.percent}%
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-sm text-success">
          +{tx.amount.toFixed(2)} AED
        </p>
        <p className="text-xs text-muted-foreground">{tx.date}</p>
      </div>
    </button>
  );
});

TransactionItem.displayName = "TransactionItem";

const SortButton = memo(({ 
  label, 
  active, 
  onClick 
}: { 
  label: string; 
  active: boolean; 
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
      active 
        ? "bg-primary text-primary-foreground" 
        : "bg-muted text-muted-foreground hover:bg-muted/80"
    }`}
  >
    {label}
  </button>
));

SortButton.displayName = "SortButton";

export const ReferralTransactions = memo(() => {
  const { t } = useTranslation();
  const [sortType, setSortType] = useState<SortType>("date");
  
  // Sort and group transactions
  const { groupedTransactions, sortedTransactions } = useMemo(() => {
    let sorted = [...MOCK_TRANSACTIONS];
    
    switch (sortType) {
      case "amount":
        sorted.sort((a, b) => b.amount - a.amount);
        break;
      case "type":
        sorted.sort((a, b) => {
          if (a.type === b.type) return b.dateTimestamp - a.dateTimestamp;
          return a.type === "card" ? -1 : 1;
        });
        break;
      case "date":
      default:
        sorted.sort((a, b) => b.dateTimestamp - a.dateTimestamp);
        break;
    }
    
    // Only group by date when sorting by date
    if (sortType === "date") {
      const groups: { [key: string]: { transactions: ReferralTransaction[]; total: number } } = {};
      
      sorted.forEach((tx) => {
        if (!groups[tx.dateGroup]) {
          groups[tx.dateGroup] = { transactions: [], total: 0 };
        }
        groups[tx.dateGroup].transactions.push(tx);
        groups[tx.dateGroup].total += tx.amount;
      });
      
      return { groupedTransactions: groups, sortedTransactions: sorted };
    }
    
    return { groupedTransactions: null, sortedTransactions: sorted };
  }, [sortType]);
  
  const getDateLabel = (dateGroup: string) => {
    if (dateGroup === "today") return t('common.today', 'Сегодня');
    if (dateGroup === "yesterday") return t('common.yesterday', 'Вчера');
    return dateGroup;
  };
  
  const totalAmount = useMemo(() => 
    MOCK_TRANSACTIONS.reduce((sum, tx) => sum + tx.amount, 0),
  []);
  
  return (
    <div className="px-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">
          {t('partner.recentEarnings', 'Последние начисления')}
        </h3>
        <p className="text-sm font-medium text-success">
          +{totalAmount.toFixed(2)} AED
        </p>
      </div>
      
      {/* Sort buttons */}
      <div className="flex items-center gap-2 mb-4">
        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
        <SortButton 
          label={t('partner.sortDate', 'По дате')} 
          active={sortType === "date"} 
          onClick={() => setSortType("date")} 
        />
        <SortButton 
          label={t('partner.sortAmount', 'По сумме')} 
          active={sortType === "amount"} 
          onClick={() => setSortType("amount")} 
        />
        <SortButton 
          label={t('partner.sortType', 'По типу')} 
          active={sortType === "type"} 
          onClick={() => setSortType("type")} 
        />
      </div>
      
      {/* Grouped by date */}
      {sortType === "date" && groupedTransactions && (
        <div className="space-y-4">
          {Object.entries(groupedTransactions).map(([dateGroup, { transactions, total }]) => (
            <div key={dateGroup}>
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-xs text-muted-foreground">
                  {getDateLabel(dateGroup)}
                </p>
                <p className="text-xs font-medium text-success">
                  +{total.toFixed(2)} AED
                </p>
              </div>
              <div className="bg-card rounded-2xl overflow-hidden border border-border/50">
                <div className="space-y-0">
                  {transactions.map((tx) => (
                    <TransactionItem key={tx.id} tx={tx} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Flat list for other sorts */}
      {sortType !== "date" && (
        <div className="bg-card rounded-2xl overflow-hidden border border-border/50">
          <div className="space-y-0">
            {sortedTransactions.map((tx) => (
              <TransactionItem key={tx.id} tx={tx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

ReferralTransactions.displayName = "ReferralTransactions";
