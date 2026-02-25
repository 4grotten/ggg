import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, ChevronUp, X, Eye, EyeOff, Copy, Wallet, Share2 } from "lucide-react";
import { CardMiniature } from "@/components/dashboard/CardMiniature";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CardTransactionsList } from "@/components/card/CardTransactionsList";
import { DataUnlockDialog } from "@/components/settings/DataUnlockDialog";
import { useScreenLockContext } from "@/contexts/ScreenLockContext";
import { openWallet, detectPlatform, getWalletDeepLink } from "@/lib/walletDeepLinks";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useCards } from "@/hooks/useCards";
import { useCardTransactionGroups, useTransactionGroups } from "@/hooks/useTransactions";
import { Skeleton } from "@/components/ui/skeleton";
// Animated number component for balance
const AnimatedNumber = ({ value, duration = 800 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * easeOut);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <>{displayValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>;
};

const MetalCard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isHideDataEnabled } = useScreenLockContext();
  const [showDetails, setShowDetails] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'details' | 'balance' | null>(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch real balance from API
  const { data: cardsData } = useCards({ type: 'metal' });
  const apiCard = cardsData?.data?.[0];
  const cardId = apiCard?.id;

  // Fetch card transactions from API + mock data
  const { data: cardTxGroups, isLoading: txLoading } = useCardTransactionGroups();
  const { data: mockData } = useTransactionGroups();
  
  // Merge: API groups first, then mock groups below
  const mergedGroups = [
    ...(cardTxGroups || []),
    ...(mockData?.groups || []),
  ];

  const cardData = {
    holderName: "RINAT KAMIEV",
    lastFour: apiCard?.lastFourDigits || "4521",
    fullNumber: "4532 8901 2345 4521",
    expiry: "12/29",
    cvv: "456",
    balance: apiCard?.balance ?? 0,
  };

  const requiresAuth = isHideDataEnabled;

  const toggleBalanceVisibility = () => {
    if (!balanceVisible && requiresAuth) {
      setPendingAction('balance');
      setShowUnlockDialog(true);
      return;
    }
    if (!balanceVisible) {
      setAnimationKey(prev => prev + 1);
    }
    setBalanceVisible(!balanceVisible);
  };

  const toggleDetailsVisibility = () => {
    if (!showDetails && requiresAuth) {
      setPendingAction('details');
      setShowUnlockDialog(true);
      return;
    }
    setShowDetails(!showDetails);
  };

  const handleUnlockSuccess = () => {
    if (pendingAction === 'balance') {
      setAnimationKey(prev => prev + 1);
      setBalanceVisible(true);
    } else if (pendingAction === 'details') {
      setShowDetails(true);
    }
    setPendingAction(null);
  };

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    toast.success(t('toast.dataUpdated'));
  }, [t]);

  const handleOpenWallet = () => {
    const result = openWallet();

    if (!result.success) {
      toast.info(
        result.reason === 'embedded'
          ? t('card.walletPreviewHint')
          : t('card.walletDesktopHint'),
        { duration: 4500 }
      );
      return;
    }
  };

  const walletHref = getWalletDeepLink();

  return (
    <MobileLayout
      header={
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">{t("card.back")}</span>
        </button>
      }
    >
      <PullToRefresh onRefresh={handleRefresh}>
        <motion.div 
          className="px-4 py-6 space-y-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
        {/* Card Visual */}
        <motion.div 
          className="relative w-full max-w-md mx-auto aspect-[1.586/1] rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <CardMiniature type="metal" />
          
          {/* Eye icon in top right corner */}
          <button
            onClick={toggleBalanceVisibility}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/50 transition-colors"
          >
            {balanceVisible ? (
              <Eye className="w-4 h-4 text-white" />
            ) : (
              <EyeOff className="w-4 h-4 text-white" />
            )}
          </button>
          
          {/* Balance overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8 bg-gradient-to-t from-black/50 to-transparent rounded-b-2xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden">
                <span className="text-xs text-white font-medium">RK</span>
              </div>
              <span className="text-sm font-semibold text-white">
                {cardData.holderName}
              </span>
            </div>
            <p className="text-xl font-bold text-white drop-shadow-md">
              {balanceVisible 
                ? <><AnimatedNumber key={animationKey} value={cardData.balance} /> AED</>
                : "••••••"
              }
            </p>
          </div>
        </motion.div>

        {/* Wallet Banner - Clickable */}
        <motion.a
          href={walletHref ?? '#'}
          onClick={(e) => {
            if (!walletHref) {
              e.preventDefault();
              handleOpenWallet();
              return;
            }

            // If we're in preview (iframe), prevent navigation and show hint.
            // Otherwise allow the browser to handle the deep link.
            const result = openWallet();
            if (!result.success) {
              e.preventDefault();
              toast.info(
                result.reason === 'embedded'
                  ? t('card.walletPreviewHint')
                  : t('card.walletDesktopHint'),
                { duration: 4500 }
              );
            }
          }}
          role="button"
          className="w-full bg-secondary rounded-xl p-4 flex items-center justify-between hover:bg-secondary/80 active:scale-[0.98] transition-all"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {detectPlatform() === 'android' ? (
                <Wallet className="w-5 h-5" />
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8.32a7.43 7.43 0 0 1 0 7.36"/>
                    <path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58"/>
                    <path d="M12.91 4.1a15.91 15.91 0 0 1 .01 15.8"/>
                    <path d="M16.37 2a20.16 20.16 0 0 1 0 20"/>
                  </svg>
                </>
              )}
            </div>
            <span className="text-sm font-medium">
              {detectPlatform() === 'android' ? t("card.addToGooglePay") : t("card.addToApplePay")}
            </span>
          </div>
          <div className="p-1 hover:bg-muted rounded-full transition-colors" onClick={(e) => e.preventDefault()}>
            <X className="w-4 h-4 text-muted-foreground" />
          </div>
        </motion.a>

        {/* Card Details */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {/* Card Number */}
          <div className="bg-secondary rounded-xl p-4 flex items-center justify-between">
            <AnimatePresence mode="wait">
              <motion.span 
                key={showDetails ? "visible" : "hidden"}
                className="text-base font-mono"
                initial={{ opacity: 0, filter: "blur(8px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(8px)" }}
                transition={{ duration: 0.25 }}
              >
                {showDetails ? cardData.fullNumber : `•••• •••• •••• ${cardData.lastFour}`}
              </motion.span>
            </AnimatePresence>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(cardData.fullNumber.replace(/\s/g, ''));
                  toast.success(t("toast.cardNumberCopied"));
                }}
                className="p-2 h-8 w-8 rounded-full bg-secondary hover:bg-muted"
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const text = cardData.fullNumber.replace(/\s/g, '');
                  if (navigator.share) {
                    navigator.share({ text }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(text);
                    toast.success(t("toast.cardNumberCopied"));
                  }
                }}
                className="p-2 h-8 w-8 rounded-full bg-secondary hover:bg-muted"
              >
                <Share2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                onClick={toggleDetailsVisibility}
                className="text-xs font-medium gap-1.5 rounded-full border-none bg-black hover:bg-[#007AFF] text-white"
              >
                {showDetails ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showDetails ? t("card.hide") : t("card.reveal")}
              </Button>
            </div>
          </div>

          {/* Expiry and CVV */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">{t("card.expiry")}</p>
              <AnimatePresence mode="wait">
                <motion.p 
                  key={showDetails ? "exp-visible" : "exp-hidden"}
                  className="text-base font-mono"
                  initial={{ opacity: 0, filter: "blur(8px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(8px)" }}
                  transition={{ duration: 0.25 }}
                >
                  {showDetails ? cardData.expiry : "••/••"}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="bg-secondary rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">{t("card.cvv")}</p>
              <AnimatePresence mode="wait">
                <motion.p 
                  key={showDetails ? "cvv-visible" : "cvv-hidden"}
                  className="text-base font-mono"
                  initial={{ opacity: 0, filter: "blur(8px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(8px)" }}
                  transition={{ duration: 0.25 }}
                >
                  {showDetails ? cardData.cvv : "•••"}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Billing Address */}
        <Collapsible open={billingOpen} onOpenChange={setBillingOpen}>
          <CollapsibleTrigger className="w-full bg-secondary rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm font-medium">{t("card.billingAddress")}</span>
            {billingOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="bg-secondary rounded-b-xl px-4 pb-4 -mt-2 pt-2">
            <p className="text-sm text-muted-foreground">
              123 Main Street, Apt 4B<br />
              New York, NY 10001<br />
              United States
            </p>
          </CollapsibleContent>
        </Collapsible>

        {/* Add to Wallet Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Button
            asChild
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <a
              href={walletHref ?? '#'}
              onClick={(e) => {
                if (!walletHref) {
                  e.preventDefault();
                  handleOpenWallet();
                  return;
                }
                const result = openWallet();
                if (!result.success) {
                  e.preventDefault();
                  toast.info(
                    result.reason === 'embedded'
                      ? t('card.walletPreviewHint')
                      : t('card.walletDesktopHint'),
                    { duration: 4500 }
                  );
                }
              }}
            >
              {detectPlatform() === 'android' ? (
                <Wallet className="w-5 h-5" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              )}
              {detectPlatform() === 'android' ? t("card.addToGooglePay") : t("card.addToApplePay")}
            </a>
          </Button>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Button 
            variant="outline" 
            className="h-12 rounded-xl"
          >
            {t("card.lockCard")}
          </Button>
          <Button 
            variant="outline"
            className="h-12 rounded-xl"
          >
            {t("card.replaceCard")}
          </Button>
        </motion.div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <h2 className="text-lg font-bold mb-3">{t("card.transactions")}</h2>
          {txLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : mergedGroups.length > 0 ? (
            <CardTransactionsList groups={mergedGroups} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">{t("card.noTransactions", "No transactions yet")}</p>
          )}
        </motion.div>

        {/* Footer */}
        <div className="pt-4 pb-8">
          <PoweredByFooter />
        </div>
        </motion.div>
      </PullToRefresh>

      <DataUnlockDialog
        isOpen={showUnlockDialog}
        onClose={() => {
          setShowUnlockDialog(false);
          setPendingAction(null);
        }}
        onSuccess={handleUnlockSuccess}
      />
    </MobileLayout>
  );
};

export default MetalCard;
