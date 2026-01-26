import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import apofizLogo from "@/assets/apofiz-logo.svg";
import { openApofizWithAuth } from "@/components/layout/PoweredByFooter";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { ActionButtons } from "@/components/dashboard/ActionButtons";
import { VerifyIdentityCard } from "@/components/dashboard/VerifyIdentityCard";
import { PartnerCard } from "@/components/dashboard/PartnerCard";
import { PartnerDrawer } from "@/components/dashboard/PartnerDrawer";
import { CardsList } from "@/components/dashboard/CardsList";
import { SendToCardButton } from "@/components/dashboard/SendToCardButton";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { OpenCardButton } from "@/components/dashboard/OpenCardButton";
import { OpenCardDrawer } from "@/components/dashboard/OpenCardDrawer";
import { AccountSwitcher } from "@/components/account/AccountSwitcher";

import { CardTransactionsList } from "@/components/card/CardTransactionsList";
import { TopUpDrawer } from "@/components/dashboard/TopUpDrawer";
import { SendDrawer } from "@/components/dashboard/SendDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// API hooks
import { useCards, useTotalBalance } from "@/hooks/useCards";
import { useTransactionGroups } from "@/hooks/useTransactions";
import { useQueryClient } from "@tanstack/react-query";
import { TransactionGroup, Transaction } from "@/types/transaction";
import { useAuth } from "@/contexts/AuthContext";
import { useAvatar } from "@/contexts/AvatarContext";
import { useMultiAccount } from "@/hooks/useMultiAccount";
import { useVerificationProgress } from "@/hooks/useVerificationProgress";

type FilterType = "all" | "income" | "expenses" | "transfers";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { avatarUrl } = useAvatar();
  const queryClient = useQueryClient();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [openCardOpen, setOpenCardOpen] = useState(false);
  const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
  const [partnerDrawerOpen, setPartnerDrawerOpen] = useState(false);
  const [authAlertOpen, setAuthAlertOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  
  // Long press handling for avatar
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const { addCurrentAccount } = useMultiAccount();
  const { getCompletedSteps } = useVerificationProgress();
  const isVerified = getCompletedSteps() >= 3;

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

  // User display data
  const displayName = user?.full_name || 'Guest';
  const displayAvatar = user?.avatar?.small || user?.avatar?.file || avatarUrl;
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const firstName = displayName.split(' ')[0];
  

  // Save current account to multi-account storage (welcome toast is now shown only at login)
  useEffect(() => {
    if (isAuthenticated && user) {
      addCurrentAccount(user);
    }
  }, [isAuthenticated, user, addCurrentAccount]);

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
          <button 
            onClick={openApofizWithAuth}
            className="flex items-center gap-1 hover:opacity-80 transition-opacity"
          >
            <p className="text-xs text-muted-foreground">
              {t('dashboard.poweredBy')}
            </p>
            <img src={apofizLogo} alt="Apofiz" className="w-4 h-4" />
            <span className="text-xs font-semibold text-foreground">Apofiz</span>
          </button>
        }
        rightAction={
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
            {isAuthenticated ? (
              <motion.button 
                onClick={() => navigate("/settings")}
                onPointerDown={() => {
                  longPressTimer.current = setTimeout(() => {
                    setAccountSwitcherOpen(true);
                  }, 500);
                }}
                onPointerUp={() => {
                  if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                  }
                }}
                onPointerLeave={() => {
                  if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                  }
                }}
                className="relative"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 20,
                  delay: 0.2 
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  initial={{ boxShadow: "0 0 0 0 rgba(var(--primary), 0)" }}
                  animate={{ 
                    boxShadow: [
                      "0 0 0 0 hsl(var(--primary) / 0.4)",
                      "0 0 0 8px hsl(var(--primary) / 0)",
                      "0 0 0 0 hsl(var(--primary) / 0)"
                    ]
                  }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  className="rounded-full"
                >
                  <Avatar className="w-10 h-10 ring-2 ring-transparent transition-all duration-300 hover:ring-primary/50">
                    <AvatarImage src={displayAvatar} alt={displayName} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                </motion.div>
                <motion.div 
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 border-background",
                    isVerified ? "bg-green-500" : "bg-red-500"
                  )}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.6 }}
                >
                  {isVerified ? (
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-white"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  ) : (
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-white"
                      animate={{ 
                        opacity: [1, 0.3, 1],
                        scale: [1, 0.8, 1]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </motion.div>
              </motion.button>
            ) : (
              <motion.button 
                onClick={() => navigate("/auth/phone")}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/25"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 20,
                  delay: 0.2 
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogIn className="w-5 h-5 text-primary-foreground" />
              </motion.button>
            )}
          </div>
        }
      >
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-4 py-6 space-y-6 pb-28">
          {/* Balance - only for authenticated users */}
          {isAuthenticated && !balanceLoading && (
            <BalanceCard balance={totalBalance} />
          )}
          {isAuthenticated && balanceLoading && (
            <Skeleton className="h-32 w-full rounded-2xl" />
          )}

          {/* Action Buttons */}
          <ActionButtons onTopUp={() => setTopUpOpen(true)} onSend={() => setSendOpen(true)} />

          {/* Verify Identity Card */}
          <VerifyIdentityCard />

          {/* Partner Program Card */}
          <PartnerCard onClick={() => setPartnerDrawerOpen(true)} />

          {/* Open New Card Button */}
          <OpenCardButton onClick={() => setOpenCardOpen(true)} />

          {/* Cards */}
          {cardsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          ) : (
            <CardsList 
              cards={isAuthenticated ? cards : cards.map(c => ({ ...c, balance: undefined }))} 
              onCardClick={!isAuthenticated ? () => setAuthAlertOpen(true) : undefined}
            />
          )}

          {/* Send to Card */}
          <SendToCardButton />

          {/* Transactions - only for authenticated users */}
          {isAuthenticated && (
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
          )}

        </div>
      </PullToRefresh>
    </MobileLayout>

    <TopUpDrawer open={topUpOpen} onOpenChange={setTopUpOpen} />
    <SendDrawer open={sendOpen} onOpenChange={setSendOpen} />
    <OpenCardDrawer open={openCardOpen} onOpenChange={setOpenCardOpen} />
    <AccountSwitcher open={accountSwitcherOpen} onOpenChange={setAccountSwitcherOpen} />
    <PartnerDrawer open={partnerDrawerOpen} onOpenChange={setPartnerDrawerOpen} />
    
    {/* iOS-style Auth Alert */}
    <AlertDialog open={authAlertOpen} onOpenChange={setAuthAlertOpen}>
      <AlertDialogContent className="w-[270px] rounded-2xl p-0 gap-0 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border-0 shadow-2xl">
        <div className="pt-5 pb-4 px-4 text-center">
          <AlertDialogTitle className="text-[17px] font-semibold text-foreground mb-1">
            {t('feesAndLimits.authRequired')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[13px] text-muted-foreground leading-tight">
            {t('feesAndLimits.authRequiredMessage')}
          </AlertDialogDescription>
        </div>
        <div className="border-t border-[#C6C6C8] dark:border-[#38383A]">
          <button
            onClick={() => setAuthAlertOpen(false)}
            className="w-full py-[11px] text-[17px] text-[#007AFF] font-normal border-b border-[#C6C6C8] dark:border-[#38383A] active:bg-black/5 dark:active:bg-white/5 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => {
              setAuthAlertOpen(false);
              navigate("/auth/phone");
            }}
            className="w-full py-[11px] text-[17px] text-[#007AFF] font-semibold active:bg-black/5 dark:active:bg-white/5 transition-colors"
          >
            {t('common.authorize')}
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  </>
);
};

export default Dashboard;
