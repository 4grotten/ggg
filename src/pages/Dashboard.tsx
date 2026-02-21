import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { ApofizLogo } from "@/components/icons/ApofizLogo";
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
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AnimatedSection } from "@/components/dashboard/AnimatedSection";
import { DataUnlockDialog } from "@/components/settings/DataUnlockDialog";

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
import { useWalletSummary } from "@/hooks/useCards";
import { useTransactionGroups } from "@/hooks/useTransactions";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useAvatar } from "@/contexts/AvatarContext";
import { useMultiAccount } from "@/hooks/useMultiAccount";
import { useVerificationProgress } from "@/hooks/useVerificationProgress";
import { useTransactionFilters, FilterType } from "@/hooks/useTransactionFilters";
import { useScreenLockContext } from "@/contexts/ScreenLockContext";
import { preloadTgs } from "@/components/ui/TgsPlayer";
import partnerNetworkHero from "@/assets/partner-network-hero.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { avatarUrl } = useAvatar();
  const { isHideDataEnabled, isEnabled: isScreenLockEnabled } = useScreenLockContext();
  const queryClient = useQueryClient();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [openCardOpen, setOpenCardOpen] = useState(false);
  const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
  const [partnerDrawerOpen, setPartnerDrawerOpen] = useState(false);
  const [authAlertOpen, setAuthAlertOpen] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  
  const { addCurrentAccount } = useMultiAccount();
  const { getCompletedSteps } = useVerificationProgress();
  const isVerified = getCompletedSteps() >= 3;
  
  const requiresAuth = isHideDataEnabled && isScreenLockEnabled;

  // Refs for sliding indicator
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<FilterType, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Fetch wallet summary (IBAN + cards in one request)
  const { data: walletData, isLoading: walletLoading } = useWalletSummary();

  const { data: transactionsData, isLoading: transactionsLoading } = useTransactionGroups();

  // Map wallet summary to cards format
  const cards = (walletData?.data?.cards || []).map(c => ({
    id: c.id,
    type: (c.type === 'metal' ? 'metal' : 'virtual') as 'metal' | 'virtual',
    name: c.type === 'metal' ? 'Visa Metal' : 'Visa Virtual',
    isActive: true,
    balance: parseFloat(c.balance) || 0,
    lastFourDigits: c.card_number?.slice(-4),
  }));
  const totalBalance = cards.reduce((sum, c) => sum + c.balance, 0);
  const physicalAccount = walletData?.data?.physical_account;
  const transactionGroups = transactionsData?.groups || [];

  // Use transaction filters hook
  const { activeFilter, setActiveFilter, filteredGroups } = useTransactionFilters(transactionGroups);

  // User display data
  const displayName = user?.full_name || 'Guest';
  const displayAvatar = user?.avatar?.small || user?.avatar?.file || avatarUrl;

  // Preload Partner drawer animations and banner on mount
  useEffect(() => {
    preloadTgs("./animations/GlassDuck.tgs");
    preloadTgs("./animations/money-coins.tgs");
    preloadTgs("./animations/wowduck.tgs");
    preloadTgs("./animations/WonDuck.tgs");
    
    // Preload partner banner image
    const img = new Image();
    img.src = partnerNetworkHero;
  }, []);

  // Save current account to multi-account storage
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
            <ApofizLogo className="w-4 h-4" />
            <span className="text-xs font-semibold text-foreground">Apofiz</span>
          </button>
        }
        rightAction={
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <DashboardHeader
              isAuthenticated={isAuthenticated}
              displayName={displayName}
              displayAvatar={displayAvatar}
              isVerified={isVerified}
              onAccountSwitcherOpen={() => setAccountSwitcherOpen(true)}
            />
          </div>
        }
      >
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-4 py-6 space-y-6 pb-28">
          {/* Balance - only for authenticated users */}
          {isAuthenticated && !walletLoading && (
            <AnimatedSection delay={0.1} preset="fadeUpScale">
              <BalanceCard balance={totalBalance} cards={cards} usdtBalance={112000} />
            </AnimatedSection>
          )}
          {isAuthenticated && walletLoading && (
            <Skeleton className="h-32 w-full rounded-2xl" />
          )}

          {/* Action Buttons */}
          <AnimatedSection delay={0.2} preset="fadeUp">
            <ActionButtons 
              onTopUp={() => setTopUpOpen(true)} 
              onSend={() => {
                if (requiresAuth) {
                  setShowUnlockDialog(true);
                } else {
                  setSendOpen(true);
                }
              }} 
            />
          </AnimatedSection>

          {/* Verify Identity Card */}
          <AnimatedSection delay={0.3} preset="fadeUpBlur">
            <VerifyIdentityCard />
          </AnimatedSection>

          {/* Partner Program Card */}
          <AnimatedSection delay={0.4} preset="fadeUpBlur">
            <PartnerCard onClick={() => setPartnerDrawerOpen(true)} />
          </AnimatedSection>

          {/* Open New Card Button */}
          <AnimatedSection delay={0.5} preset="fadeUpScale">
            <OpenCardButton onClick={() => setOpenCardOpen(true)} />
          </AnimatedSection>

          {/* Cards */}
          {walletLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          ) : (
            <AnimatedSection delay={0.6} preset="fadeUpBlur">
              <CardsList 
                cards={isAuthenticated ? cards : cards.map(c => ({ ...c, balance: undefined }))} 
                onCardClick={!isAuthenticated ? () => setAuthAlertOpen(true) : undefined}
              />
            </AnimatedSection>
          )}

          {/* Send to Card */}
          <AnimatedSection delay={0.7} preset="fadeUpScale">
            <SendToCardButton />
          </AnimatedSection>

          {/* Transactions - only for authenticated users */}
          {isAuthenticated && (
            <AnimatedSection delay={0.8} preset="fadeUpBlur">
              <div className="flex items-center justify-between mb-3">
                <motion.h2 
                  className="text-xl font-bold"
                  initial={{ opacity: 0, x: -15, filter: "blur(4px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.9 }}
                >
                  {t('dashboard.transactions')}
                </motion.h2>
                <motion.button
                  onClick={() => navigate("/card/virtual/history")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                  initial={{ opacity: 0, x: 15, filter: "blur(4px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Clock className="w-4 h-4" />
                  {t('card.transactionHistory')}
                </motion.button>
              </div>

              {/* Filter Tabs - Telegram Style */}
              <motion.div 
                className="relative mb-4"
                initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 1.0 }}
              >
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
                  
                  {filterOptions.map((option, index) => (
                    <motion.button
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0 + index * 0.05 }}
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </div>
                {/* Bottom border */}
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-border/50" />
              </motion.div>

              {transactionsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                >
                  <CardTransactionsList groups={filteredGroups} />
                </motion.div>
              )}
            </AnimatedSection>
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

    <DataUnlockDialog
      isOpen={showUnlockDialog}
      onClose={() => setShowUnlockDialog(false)}
      onSuccess={() => setSendOpen(true)}
    />
  </>
);
};

export default Dashboard;
