import { memo } from "react";
import { CreditCard, ArrowRightLeft, User } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ReferralTransaction {
  id: string;
  userName: string;
  userInitials: string;
  type: "card" | "transaction";
  amount: number;
  originalAmount: number;
  percent: number;
  date: string;
  level: string;
}

const MOCK_TRANSACTIONS: ReferralTransaction[] = [
  {
    id: "1",
    userName: "Александр К.",
    userInitials: "АК",
    type: "card",
    amount: 27.45,
    originalAmount: 183,
    percent: 15,
    date: "Сегодня, 14:32",
    level: "R1"
  },
  {
    id: "2",
    userName: "Мария С.",
    userInitials: "МС",
    type: "transaction",
    amount: 2.50,
    originalAmount: 5000,
    percent: 0.05,
    date: "Сегодня, 12:15",
    level: "R1"
  },
  {
    id: "3",
    userName: "Дмитрий В.",
    userInitials: "ДВ",
    type: "card",
    amount: 27.45,
    originalAmount: 183,
    percent: 15,
    date: "Вчера, 19:45",
    level: "R1"
  },
  {
    id: "4",
    userName: "Елена П.",
    userInitials: "ЕП",
    type: "transaction",
    amount: 7.50,
    originalAmount: 15000,
    percent: 0.05,
    date: "Вчера, 16:20",
    level: "R1"
  },
  {
    id: "5",
    userName: "Артём Н.",
    userInitials: "АН",
    type: "card",
    amount: 27.45,
    originalAmount: 183,
    percent: 15,
    date: "Вчера, 11:00",
    level: "R1"
  },
  {
    id: "6",
    userName: "Ольга М.",
    userInitials: "ОМ",
    type: "transaction",
    amount: 12.00,
    originalAmount: 24000,
    percent: 0.05,
    date: "23 янв, 20:30",
    level: "R1"
  },
  {
    id: "7",
    userName: "Иван Т.",
    userInitials: "ИТ",
    type: "card",
    amount: 27.45,
    originalAmount: 183,
    percent: 15,
    date: "23 янв, 15:12",
    level: "R1"
  },
  {
    id: "8",
    userName: "Наталья Р.",
    userInitials: "НР",
    type: "transaction",
    amount: 3.75,
    originalAmount: 7500,
    percent: 0.05,
    date: "22 янв, 18:45",
    level: "R1"
  },
  {
    id: "9",
    userName: "Сергей Л.",
    userInitials: "СЛ",
    type: "card",
    amount: 27.45,
    originalAmount: 183,
    percent: 15,
    date: "22 янв, 10:30",
    level: "R1"
  },
  {
    id: "10",
    userName: "Анна Б.",
    userInitials: "АБ",
    type: "transaction",
    amount: 5.00,
    originalAmount: 10000,
    percent: 0.05,
    date: "21 янв, 14:00",
    level: "R1"
  },
];

const TransactionItem = memo(({ tx }: { tx: ReferralTransaction }) => {
  const { t } = useTranslation();
  
  const isCard = tx.type === "card";
  
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
      {/* Avatar */}
      <div className="relative">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-sm font-semibold text-muted-foreground">
          {tx.userInitials}
        </div>
        <div 
          className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
            isCard 
              ? "bg-gradient-to-br from-emerald-500 to-green-500" 
              : "bg-gradient-to-br from-blue-500 to-indigo-500"
          }`}
        >
          {isCard ? (
            <CreditCard className="w-2.5 h-2.5 text-white" />
          ) : (
            <ArrowRightLeft className="w-2.5 h-2.5 text-white" />
          )}
        </div>
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{tx.userName}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {tx.level}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isCard 
            ? t('partner.cardPurchase', 'Покупка карты') 
            : t('partner.transactionFee', 'Комиссия с транзакции')
          }
          <span className="mx-1">•</span>
          <span className="text-emerald-600 dark:text-[#BFFF00]">{tx.percent}%</span>
        </p>
      </div>
      
      {/* Amount */}
      <div className="text-right">
        <p className="font-bold text-sm text-emerald-600 dark:text-[#BFFF00]">
          +{tx.amount.toFixed(2)} AED
        </p>
        <p className="text-[10px] text-muted-foreground">
          {isCard 
            ? `${t('partner.fromCard', 'с')} ${tx.originalAmount} AED`
            : `${t('partner.fromTx', 'с')} ${tx.originalAmount.toLocaleString()} AED`
          }
        </p>
      </div>
    </div>
  );
});

TransactionItem.displayName = "TransactionItem";

export const ReferralTransactions = memo(() => {
  const { t } = useTranslation();
  
  return (
    <div className="px-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">
          {t('partner.recentEarnings', 'Последние начисления')}
        </h3>
        <span className="text-xs text-muted-foreground">
          {t('partner.last10', 'Последние 10')}
        </span>
      </div>
      
      <div className="bg-card rounded-2xl p-4 border border-border/50">
        {MOCK_TRANSACTIONS.map((tx) => (
          <TransactionItem key={tx.id} tx={tx} />
        ))}
      </div>
    </div>
  );
});

ReferralTransactions.displayName = "ReferralTransactions";
