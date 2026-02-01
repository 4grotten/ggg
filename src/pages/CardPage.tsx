import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronDown, Lock, LockOpen, RefreshCw, Eye, EyeOff, X, ChevronUp, Clock, Share2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CardTransactionsList } from "@/components/card/CardTransactionsList";
import { CardMiniature } from "@/components/dashboard/CardMiniature";
import { AddToWalletDrawer } from "@/components/card/AddToWalletDrawer";
import { detectPlatform } from "@/lib/walletDeepLinks";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

// Card data for both types
const cardsData = {
  virtual: {
    holderName: "RINAT KAMIEV",
    lastFour: "7617",
    fullNumber: "4532 8901 2345 7617",
    expiry: "12/28",
    cvv: "123",
    balance: 213757.49,
    type: "virtual" as const,
    label: "Signature",
    transactions: [
      {
        date: "January 10",
        totalSpend: 125.87,
        transactions: [
          { id: "1", merchant: "LIFE", time: "13:02", amountUSDT: 8.34, amountLocal: 29.87, localCurrency: "AED", color: "#3B82F6" },
          { id: "2", merchant: "ALAYA", time: "00:59", amountUSDT: 26.80, amountLocal: 96.00, localCurrency: "AED", color: "#22C55E" },
        ],
      },
      {
        date: "December 31",
        totalSpend: 101.06,
        transactions: [
          { id: "5", merchant: "CELLAR", time: "20:48", amountUSDT: 22.06, amountLocal: 79.00, localCurrency: "AED", color: "#EAB308" },
          { id: "6", merchant: "Top up", time: "20:46", amountUSDT: 194.10, amountLocal: 200.00, localCurrency: "USDT", color: "#22C55E", type: "topup" as const },
        ],
      },
      {
        date: "December 21",
        totalSpend: 204.55,
        transactions: [
          { id: "15", merchant: "Annual Card fee", time: "23:31", amountUSDT: 56.04, amountLocal: 204.55, localCurrency: "AED", color: "#CCFF00", type: "card_activation" as const },
          { id: "16", merchant: "Top up", time: "23:30", amountUSDT: 44.10, amountLocal: 50.00, localCurrency: "USDT", color: "#22C55E", type: "topup" as const },
        ],
      },
    ],
  },
  metal: {
    holderName: "RINAT KAMIEV",
    lastFour: "4521",
    fullNumber: "4532 8901 2345 4521",
    expiry: "12/29",
    cvv: "456",
    balance: 256508.98,
    type: "metal" as const,
    label: "Metal",
    transactions: [
      {
        date: "January 12",
        totalSpend: 250.00,
        transactions: [
          { id: "17", merchant: "Card Transfer", time: "15:30", amountUSDT: 250.00, amountLocal: 250.00, localCurrency: "AED", color: "#007AFF", type: "card_transfer" as const, recipientCard: "4521", status: "processing" as const },
        ],
      },
      {
        date: "January 10",
        totalSpend: 193.60,
        transactions: [
          { id: "3", merchant: "Ongaku", time: "00:17", amountUSDT: 54.05, amountLocal: 193.60, localCurrency: "AED", color: "#F97316" },
        ],
      },
      {
        date: "January 02",
        totalSpend: 225.00,
        transactions: [
          { id: "4", merchant: "OPERA", time: "20:20", amountUSDT: 62.82, amountLocal: 225.00, localCurrency: "AED", color: "#A855F7" },
        ],
      },
      {
        date: "December 30",
        totalSpend: 996.50,
        transactions: [
          { id: "7", merchant: "BHPC", time: "20:16", amountUSDT: 125.64, amountLocal: 450.00, localCurrency: "AED", color: "#EAB308" },
          { id: "11", merchant: "Service CEO", time: "07:58", amountUSDT: 11.59, amountLocal: 41.50, localCurrency: "AED", color: "#06B6D4" },
          { id: "13", merchant: "Top up", time: "02:30", amountUSDT: 494.10, amountLocal: 500.00, localCurrency: "USDT", color: "#22C55E", type: "topup" as const },
        ],
      },
    ],
  },
};

const cardTypes = ["virtual", "metal"] as const;

const CardPage = () => {
  const navigate = useNavigate();
  const { type } = useParams<{ type: string }>();
  const { t } = useTranslation();
  
  const initialIndex = type === "metal" ? 1 : 0;
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [showDetails, setShowDetails] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isCardLocked, setIsCardLocked] = useState(false);
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [walletDrawerOpen, setWalletDrawerOpen] = useState(false);

  const handleUnlock = () => {
    setIsUnlocking(true);
    setTimeout(() => {
      setIsCardLocked(false);
      setIsUnlocking(false);
    }, 1000);
  };

  const currentCardType = cardTypes[activeIndex];
  const cardData = cardsData[currentCardType];

  // Update URL when card changes
  useEffect(() => {
    const newType = cardTypes[activeIndex];
    if (type !== newType) {
      navigate(`/card/${newType}`, { replace: true });
    }
  }, [activeIndex, type, navigate]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Reset states when switching cards
  useEffect(() => {
    setShowDetails(false);
    setBillingOpen(false);
    setBalanceVisible(false);
  }, [activeIndex]);

  const toggleBalanceVisibility = () => {
    if (!balanceVisible) {
      setAnimationKey(prev => prev + 1);
    }
    setBalanceVisible(!balanceVisible);
  };

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    toast.success(t('toast.dataUpdated'));
  }, [t]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (offset < -threshold || velocity < -500) {
      // Swipe left - next card
      if (activeIndex < cardTypes.length - 1) {
        setDirection(1);
        setActiveIndex(activeIndex + 1);
      }
    } else if (offset > threshold || velocity > 500) {
      // Swipe right - previous card
      if (activeIndex > 0) {
        setDirection(-1);
        setActiveIndex(activeIndex - 1);
      }
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      opacity: 0,
      scale: 0.95,
    }),
  };

  const renderCardVisual = () => {
    return (
      <div className="relative overflow-hidden rounded-2xl">
        <CardMiniature type={currentCardType} />
        
        {/* Fantasy glint overlay */}
        <div 
          className="absolute inset-0 animate-fantasy-glint pointer-events-none"
          style={{
            background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.1) 35%, rgba(200,180,255,0.25) 42%, rgba(180,220,255,0.3) 50%, rgba(255,200,255,0.25) 58%, rgba(255,255,255,0.1) 65%, transparent 80%)",
          }}
        />
      </div>
    );
  };

  return (
    <>
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
      rightAction={
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      }
    >
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-4 py-6 space-y-5">
          {/* Card Carousel */}
          <div className="relative flex items-center justify-center">
            {/* Left Arrow - Desktop only */}
            <button
              onClick={() => {
                if (activeIndex > 0) {
                  setDirection(-1);
                  setActiveIndex(activeIndex - 1);
                }
              }}
              className={`hidden sm:flex absolute left-0 z-10 w-10 h-10 items-center justify-center rounded-full bg-secondary hover:bg-muted transition-all ${
                activeIndex === 0 ? "opacity-30 cursor-not-allowed" : "opacity-100"
              }`}
              disabled={activeIndex === 0}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="w-full max-w-xs sm:max-w-sm overflow-hidden">
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                className="cursor-grab active:cursor-grabbing"
              >
                {renderCardVisual()}
              </motion.div>
              
              {/* Pagination dots */}
              <div className="flex justify-center gap-2 mt-4">
                {cardTypes.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDirection(index > activeIndex ? 1 : -1);
                      setActiveIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === activeIndex 
                        ? "bg-primary w-6" 
                        : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Right Arrow - Desktop only */}
            <button
              onClick={() => {
                if (activeIndex < cardTypes.length - 1) {
                  setDirection(1);
                  setActiveIndex(activeIndex + 1);
                }
              }}
              className={`hidden sm:flex absolute right-0 z-10 w-10 h-10 items-center justify-center rounded-full bg-secondary hover:bg-muted transition-all ${
                activeIndex === cardTypes.length - 1 ? "opacity-30 cursor-not-allowed" : "opacity-100"
              }`}
              disabled={activeIndex === cardTypes.length - 1}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Add to Wallet Button */}
          <motion.button
            key={`wallet-${activeIndex}`}
            onClick={() => setWalletDrawerOpen(true)}
            className="w-full relative overflow-hidden rounded-xl p-4 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer text-white"
            style={{
              background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
              boxShadow: '0 4px 20px -4px rgba(30, 58, 95, 0.4)',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Subtle glow overlay */}
            <div 
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 30% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 60%)',
              }}
            />
            <div className="flex items-center gap-3 relative z-10">
              {detectPlatform() === 'android' ? (
                <Wallet className="w-5 h-5" />
              ) : (
                <div className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8.32a7.43 7.43 0 0 1 0 7.36"/>
                    <path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58"/>
                    <path d="M12.91 4.1a15.91 15.91 0 0 1 .01 15.8"/>
                    <path d="M16.37 2a20.16 20.16 0 0 1 0 20"/>
                  </svg>
                </div>
              )}
              <span className="text-sm font-medium">
                {detectPlatform() === 'android' ? t("card.addToGooglePay") : t("card.addToApplePay")}
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60 relative z-10" />
          </motion.button>

          {/* Balance Section */}
          <motion.div 
            key={`balance-${activeIndex}`}
            className="bg-secondary rounded-xl p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("card.cardBalance")}</p>
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={balanceVisible ? "visible" : "hidden"}
                    className="text-2xl font-bold"
                    initial={{ opacity: 0, filter: "blur(8px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(8px)" }}
                    transition={{ duration: 0.25 }}
                  >
                    {balanceVisible ? (
                      <><AnimatedNumber key={animationKey} value={cardData.balance} /> AED</>
                    ) : "••••••"}
                  </motion.p>
                </AnimatePresence>
              </div>
              <button
                onClick={toggleBalanceVisibility}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                {balanceVisible ? (
                  <Eye className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <EyeOff className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </div>
          </motion.div>

          {/* Card Details */}
          <motion.div 
            key={`details-${activeIndex}`}
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
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
                  onClick={async () => {
                    const cardDetails = `${t("card.shareHolder")}: ${cardData.holderName}\n${t("card.shareCard")}: ${cardData.fullNumber}\n${t("card.shareExpiry")}: ${cardData.expiry}\n${t("card.shareCvv")}: ${cardData.cvv}`;
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: t("card.shareTitle"),
                          text: cardDetails,
                        });
                      } catch (err) {
                        if ((err as Error).name !== 'AbortError') {
                          navigator.clipboard.writeText(cardDetails);
                          toast.success(t("toast.cardDetailsCopied"));
                        }
                      }
                    } else {
                      navigator.clipboard.writeText(cardDetails);
                      toast.success(t("toast.cardDetailsCopied"));
                    }
                  }}
                  className="p-2 h-8 w-8 rounded-full bg-secondary hover:bg-muted"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className={`text-xs font-medium gap-1.5 rounded-full border-none text-white ${
                    showDetails 
                      ? "bg-[#333333] hover:bg-[#444444]" 
                      : "bg-primary hover:bg-primary/80"
                  }`}
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

          {/* Action Buttons */}
          <motion.div 
            key={`actions-${activeIndex}`}
            className="grid grid-cols-2 gap-3 pt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Button 
              variant="outline" 
              className={`h-12 rounded-xl gap-2 border-none overflow-hidden transition-colors duration-300 ${
                isUnlocking
                  ? "bg-primary text-primary-foreground" 
                  : isCardLocked 
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                    : "bg-secondary hover:bg-muted"
              }`}
              onClick={() => {
                if (isCardLocked && !isUnlocking) {
                  handleUnlock();
                } else if (!isCardLocked && !isUnlocking) {
                  setShowLockDialog(true);
                }
              }}
              disabled={isUnlocking}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isUnlocking ? "unlocking-icon" : isCardLocked ? "locked-icon" : "unlock-icon"}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  {isCardLocked && !isUnlocking ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                </motion.div>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.span
                  key={isUnlocking ? "unlocking" : isCardLocked ? "locked" : "lock"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {isUnlocking 
                    ? t("card.cardUnlocked") 
                    : isCardLocked 
                      ? t("card.cardLocked") 
                      : t("card.lockCard")}
                </motion.span>
              </AnimatePresence>
            </Button>
            <Button 
              variant="outline"
              className="h-12 rounded-xl gap-2 bg-secondary border-none hover:bg-muted"
            >
              <RefreshCw className="w-4 h-4" />
              {t("card.replaceCard")}
            </Button>
          </motion.div>

          {/* Lock Card Confirmation Dialog - iOS Style */}
          <AlertDialog open={showLockDialog} onOpenChange={setShowLockDialog}>
            <AlertDialogContent className="max-w-[300px] rounded-2xl p-0 overflow-hidden gap-0">
              <AlertDialogHeader className="p-5 pb-3 text-center">
                <AlertDialogTitle className="text-center text-base font-semibold">
                  {t("card.lockConfirmTitle")}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-center text-sm">
                  {t("card.lockConfirmDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="border-t border-border">
                <AlertDialogAction 
                  onClick={() => setIsCardLocked(true)}
                  className="w-full h-12 rounded-none bg-transparent text-destructive hover:bg-muted font-normal text-base border-b border-border"
                >
                  {t("card.lockConfirmYes")}
                </AlertDialogAction>
                <AlertDialogCancel className="w-full h-12 rounded-none bg-transparent text-primary hover:bg-muted font-semibold text-base m-0 border-0">
                  {t("common.cancel")}
                </AlertDialogCancel>
              </div>
            </AlertDialogContent>
          </AlertDialog>

          {/* Transaction History Button */}
          <motion.button
            key={`history-btn-${activeIndex}`}
            onClick={() => navigate(`/card/${currentCardType}/history`)}
            className="w-full rounded-2xl p-3 flex items-center gap-3 bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all duration-200 active:scale-[0.98]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.17 }}
          >
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <span className="flex-1 text-left text-sm font-medium">{t("card.transactionHistory")}</span>
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>

          {/* Transactions */}
          <motion.div
            key={`transactions-${activeIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <h2 className="text-lg font-bold mb-3">{t("card.transactions")}</h2>
            <CardTransactionsList groups={cardData.transactions} />
          </motion.div>

          {/* Footer */}
          <div className="pt-4 pb-8">
            <PoweredByFooter />
          </div>
        </div>
      </PullToRefresh>
    </MobileLayout>

      <AddToWalletDrawer 
        open={walletDrawerOpen} 
        onOpenChange={setWalletDrawerOpen}
        cardNumber={cardData.fullNumber}
        expiryDate={cardData.expiry}
        cvv={cardData.cvv}
      />
  </>
  );
};

export default CardPage;
