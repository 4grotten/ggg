import { memo, useMemo } from "react";
import { CreditCard, ArrowDownLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ReferralTransaction {
  id: string;
  userName: string;
  type: "card" | "transaction";
  amount: number;
  originalAmount: number;
  percent: number;
  date: string;
  dateGroup: string;
  level: string;
}

const MOCK_TRANSACTIONS: ReferralTransaction[] = [
  {
    id: "1",
    userName: "Александр К.",
    type: "card",
    amount: 27.45,
    originalAmount: 183,
    percent: 15,
    date: "14:32",
    dateGroup: "today",
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
    level: "R1"
  },
  {
    id: "3",
    userName: "Дмитрий В.",
    type: "card",
    amount: 27.45,
    originalAmount: 183,
    percent: 15,
    date: "19:45",
    dateGroup: "yesterday",
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
    level: "R1"
  },
  {
    id: "5",
    userName: "Артём Н.",
    type: "card",
    amount: 27.45,
    originalAmount: 183,
    percent: 15,
    date: "11:00",
    dateGroup: "yesterday",
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
    level: "R1"
  },
  {
    id: "7",
    userName: "Иван Т.",
    type: "card",
    amount: 27.45,
    originalAmount: 183,
    percent: 15,
    date: "15:12",
    dateGroup: "23 января",
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
    level: "R1"
  },
  {
    id: "9",
    userName: "Сергей Л.",
    type: "card",
    amount: 27.45,
    originalAmount: 183,
    percent: 15,
    date: "10:30",
    dateGroup: "22 января",
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
    level: "R1"
  },
];

const TransactionIcon = memo(({ type }: { type: "card" | "transaction" }) => {
  if (type === "card") {
    return <CreditCard className="w-5 h-5 text-emerald-600 dark:text-[#BFFF00]" />;
  }
  return <ArrowDownLeft className="w-5 h-5 text-success" />;
});

TransactionIcon.displayName = "TransactionIcon";

const maskName = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    const firstName = parts[0];
    const lastName = parts[1];
    // Show first 2 chars, then stars, then last initial
    const maskedFirst = firstName.slice(0, 2) + '***';
    return `${maskedFirst} ${lastName}`;
  }
  return name.slice(0, 2) + '***';
};

const TransactionItem = memo(({ tx }: { tx: ReferralTransaction }) => {
  const { t } = useTranslation();
  const isCard = tx.type === "card";
  
  return (
    <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 active:bg-secondary/70 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <TransactionIcon type={tx.type} />
        </div>
        <div className="text-left">
          <p className="font-medium text-sm">{maskName(tx.userName)}</p>
          <p className="text-xs text-muted-foreground">
            {isCard 
              ? t('partner.cardPurchase', 'Покупка карты')
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

export const ReferralTransactions = memo(() => {
  const { t } = useTranslation();
  
  // Group transactions by date with totals
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: { transactions: ReferralTransaction[]; total: number } } = {};
    
    MOCK_TRANSACTIONS.forEach((tx) => {
      if (!groups[tx.dateGroup]) {
        groups[tx.dateGroup] = { transactions: [], total: 0 };
      }
      groups[tx.dateGroup].transactions.push(tx);
      groups[tx.dateGroup].total += tx.amount;
    });
    
    return groups;
  }, []);
  
  const getDateLabel = (dateGroup: string) => {
    if (dateGroup === "today") return t('common.today', 'Сегодня');
    if (dateGroup === "yesterday") return t('common.yesterday', 'Вчера');
    return dateGroup;
  };
  
  return (
    <div className="px-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">
          {t('partner.recentEarnings', 'Последние начисления')}
        </h3>
      </div>
      
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
    </div>
  );
});

ReferralTransactions.displayName = "ReferralTransactions";
