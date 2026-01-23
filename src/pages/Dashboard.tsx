import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import apofizLogo from "@/assets/apofiz-logo.svg";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { ActionButtons } from "@/components/dashboard/ActionButtons";
import { VerifyIdentityCard } from "@/components/dashboard/VerifyIdentityCard";
import { CardsList } from "@/components/dashboard/CardsList";
import { SendToCardButton } from "@/components/dashboard/SendToCardButton";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { OpenCardButton } from "@/components/dashboard/OpenCardButton";
import { OpenCardDrawer } from "@/components/dashboard/OpenCardDrawer";

import { CardTransactionsList } from "@/components/card/CardTransactionsList";
import { TopUpDrawer } from "@/components/dashboard/TopUpDrawer";
import { SendDrawer } from "@/components/dashboard/SendDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// API hooks
import { useCards, useTotalBalance } from "@/hooks/useCards";
import { useTransactionGroups } from "@/hooks/useTransactions";
import { useQueryClient } from "@tanstack/react-query";
import { TransactionGroup, Transaction } from "@/types/transaction";

type FilterType = "all" | "income" | "expenses" | "transfers";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [openCardOpen, setOpenCardOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Refs for sliding indicator
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<FilterType, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Fetch data from API
  const { data: cardsData, isLoading: cardsLoading } = useCards();
  const { data: balanceData, isLoading: balanceLoading } = useTotalBalance();
  const { data: transactionsData, isLoading: transactionsLoading } = useTransactionGroups();

  // Extract data with fallbacks
  const cards = cardsData?.data || [];
  const totalBalance = balanceData?.balance || 0;
  const transactionGroups = transactionsData?.groups || [];

  // Filter options
  const filterOptions: { key: FilterType; label: string }[] = [
    { key: "all", label: t("history.all") },
    { key: "income", label: t("history.income") },
    { key: "expenses", label: t("history.expenses") },
    { key: "transfers", label: t("history.transfers") },
  ];

  // Update indicator position when active filter changes
  useEffect(() => {
    const activeTab = tabRefs.current.get(activeFilter);
    const container = tabsContainerRef.current;
    if (activeTab && container) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      setIndicatorStyle({
        left: tabRect.left - containerRect.left + container.scrollLeft,
        width: tabRect.width,
      });
    }
  }, [activeFilter]);

  // Transaction filter helpers
  const isIncomeTransaction = (tx: Transaction): boolean => {
    return tx.type === "topup" || 
           tx.type === "bank_transfer_incoming" || 
           (tx.type === "card_transfer" && !!tx.senderCard);
  };

  const isExpenseTransaction = (tx: Transaction): boolean => {
    return !tx.type || 
           tx.type === "declined" || 
           tx.type === "card_activation" ||
           tx.type === "bank_transfer" ||
           tx.type === "crypto_withdrawal";
  };

  const isTransferTransaction = (tx: Transaction): boolean => {
    return tx.type === "card_transfer" || 
           tx.type === "bank_transfer" || 
           tx.type === "bank_transfer_incoming" ||
           tx.type === "crypto_withdrawal";
  };

  // Filtered transactions
  const filteredGroups = useMemo(() => {
    return transactionGroups.map((group: TransactionGroup) => {
      let filteredTxs = group.transactions;
      if (activeFilter === "income") {
        filteredTxs = group.transactions.filter(isIncomeTransaction);
      } else if (activeFilter === "expenses") {
        filteredTxs = group.transactions.filter(isExpenseTransaction);
      } else if (activeFilter === "transfers") {
        filteredTxs = group.transactions.filter(isTransferTransaction);
      }
      return { ...group, transactions: filteredTxs };
    }).filter((group: TransactionGroup) => group.transactions.length > 0);
  }, [transactionGroups, activeFilter]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['cards'] }),
      queryClient.invalidateQueries({ queryKey: ['balance'] }),
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
    ]);
    toast.success(t('toast.dataUpdated'));
  }, [queryClient, t]);

  return (
    <>
      <MobileLayout
        header={
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {t('dashboard.poweredBy')}{" "}
            <img src={apofizLogo} alt="Apofiz" className="w-4 h-4 inline-block" />{" "}
            <span className="font-semibold text-foreground">Apofiz</span>
          </p>
        }
        rightAction={
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button 
              onClick={() => navigate("/auth/phone")}
              className="relative"
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                <span className="text-[8px] text-white font-bold">+</span>
              </div>
            </button>
          </div>
        }
      >
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-4 py-6 space-y-6 pb-28">
          {/* Balance */}
          {balanceLoading ? (
            <Skeleton className="h-32 w-full rounded-2xl" />
          ) : (
            <BalanceCard balance={totalBalance} />
          )}

          {/* Action Buttons */}
          <ActionButtons onTopUp={() => setTopUpOpen(true)} onSend={() => setSendOpen(true)} />

          {/* Verify Identity Card */}
          <VerifyIdentityCard />

          {/* Open New Card Button */}
          <OpenCardButton onClick={() => setOpenCardOpen(true)} />

          {/* Cards */}
          {cardsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          ) : (
            <CardsList cards={cards} />
          )}

          {/* Send to Card */}
          <SendToCardButton />

          {/* Transactions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold">{t('dashboard.transactions')}</h2>
              <button
                onClick={() => navigate("/card/virtual/history")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                <Clock className="w-4 h-4" />
                {t('card.transactionHistory')}
              </button>
            </div>

            {/* Filter Tabs - Telegram Style */}
            <div className="relative mb-4">
              <div 
                ref={tabsContainerRef}
                className="flex gap-0 overflow-x-auto scrollbar-hide relative"
              >
                {/* Sliding indicator */}
                <motion.div
                  className="absolute bottom-0 h-[3px] bg-primary rounded-full"
                  animate={{
                    left: indicatorStyle.left,
                    width: indicatorStyle.width,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
                
                {filterOptions.map((option) => (
                  <button
                    key={option.key}
                    ref={(el) => {
                      if (el) tabRefs.current.set(option.key, el);
                    }}
                    onClick={() => setActiveFilter(option.key)}
                    className={cn(
                      "px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative",
                      activeFilter === option.key
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {/* Bottom border */}
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-border/50" />
            </div>

            {transactionsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : (
              <CardTransactionsList groups={filteredGroups} />
            )}
          </div>

        </div>
      </PullToRefresh>
    </MobileLayout>

    <TopUpDrawer open={topUpOpen} onOpenChange={setTopUpOpen} />
    <SendDrawer open={sendOpen} onOpenChange={setSendOpen} />
    <OpenCardDrawer open={openCardOpen} onOpenChange={setOpenCardOpen} />
  </>
);
};

export default Dashboard;
