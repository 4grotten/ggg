import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ChevronRight, X, Banknote } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AnimatedDrawerContainer, AnimatedDrawerItem } from "@/components/ui/animated-drawer-item";
import { useAuth } from "@/contexts/AuthContext";

// Card data for carousel
const cardsData = {
  virtual: {
    holderName: "RINAT KAMIEV",
    lastFour: "7617",
    type: "virtual" as const,
    label: "Virtual",
    balance: 213757.49,
  },
  metal: {
    holderName: "RINAT KAMIEV",
    lastFour: "4521",
    type: "metal" as const,
    label: "Metal",
    balance: 256508.98,
  },
};

const cardTypes = ["virtual", "metal"] as const;

interface LimitItemProps {
  label: string;
  dailyValue: number;
  perTransactionValue: number;
  onClick: () => void;
  isLast?: boolean;
  dailyLabel: string;
  perTxLabel: string;
}

const formatAmount = (amount: number) => {
  return amount.toLocaleString('en-US') + ' AED';
};

const LimitItem = ({ label, dailyValue, perTransactionValue, onClick, isLast = false, dailyLabel, perTxLabel }: LimitItemProps) => (
  <button 
    onClick={onClick}
    className={`flex items-center justify-between py-4 w-full text-left ${!isLast ? 'border-b border-border' : ''}`}
  >
    <div className="flex flex-col">
      <span className="text-foreground font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">
        {dailyLabel}: {formatAmount(dailyValue)} · {perTxLabel}: {formatAmount(perTransactionValue)}
      </span>
    </div>
    <ChevronRight className="w-5 h-5 text-muted-foreground" />
  </button>
);

interface LimitSliderProps {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}

const LimitSlider = ({ label, value, max, onChange }: LimitSliderProps) => (
  <div className="py-4">
    <div className="flex items-center justify-between mb-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{formatAmount(value)}</span>
    </div>
    <Slider
      value={[value]}
      onValueChange={(values) => onChange(values[0])}
      max={max}
      min={0}
      step={max === 1000000 ? 10000 : 1000}
      className="w-full"
    />
    <div className="flex justify-between mt-1">
      <span className="text-xs text-muted-foreground">0 AED</span>
      <span className="text-xs text-muted-foreground">{formatAmount(max)}</span>
    </div>
  </div>
);

const LimitsSettings = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [transferDrawerOpen, setTransferDrawerOpen] = useState(false);
  const [withdrawalDrawerOpen, setWithdrawalDrawerOpen] = useState(false);
  const [accountWithdrawalDrawerOpen, setAccountWithdrawalDrawerOpen] = useState(false);
  const [authAlertOpen, setAuthAlertOpen] = useState(false);
  
  // Limits per card
  const [cardLimits, setCardLimits] = useState({
    virtual: {
      transferDaily: 500000,
      transferPerTx: 50000,
      withdrawalDaily: 500000,
      withdrawalPerTx: 50000,
      accountWithdrawalDaily: 300000,
      accountWithdrawalPerTx: 30000,
    },
    metal: {
      transferDaily: 1000000,
      transferPerTx: 100000,
      withdrawalDaily: 1000000,
      withdrawalPerTx: 100000,
      accountWithdrawalDaily: 500000,
      accountWithdrawalPerTx: 50000,
    },
  });

  const currentCardType = cardTypes[activeIndex];
  const currentLimits = cardLimits[currentCardType];

  const handleLimitClick = (openDrawer: () => void) => {
    if (!isAuthenticated) {
      setAuthAlertOpen(true);
    } else {
      openDrawer();
    }
  };

  const updateLimit = (field: keyof typeof currentLimits, value: number) => {
    setCardLimits(prev => ({
      ...prev,
      [currentCardType]: {
        ...prev[currentCardType],
        [field]: value,
      },
    }));
  };

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (offset < -threshold || velocity < -500) {
      if (activeIndex < cardTypes.length - 1) {
        setActiveIndex(activeIndex + 1);
      }
    } else if (offset > threshold || velocity > 500) {
      if (activeIndex > 0) {
        setActiveIndex(activeIndex - 1);
      }
    }
  }, [activeIndex]);

  const renderCardVisual = () => {
    const cardData = cardsData[currentCardType];
    
    if (currentCardType === "virtual") {
      return (
        <div 
          className="relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden p-5 flex flex-col justify-between"
          style={{
            background: 'linear-gradient(135deg, #d4f94e 0%, #a8e030 50%, #8bc926 100%)',
          }}
        >
          <div 
            className="absolute inset-0 opacity-40"
            style={{
              background: 'radial-gradient(ellipse at 20% 20%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(0,0,0,0.1) 0%, transparent 50%)',
            }}
          />
          
          <div className="relative flex items-center justify-between">
            <span className="text-xs font-semibold text-black/70 tracking-wide">VIRTUAL</span>
            <span className="text-xs font-medium text-black/60">•••• {cardData.lastFour}</span>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
              <svg width="20" height="15" viewBox="0 0 60 40" fill="none">
                <path d="M30 5L45 20L30 35L15 20L30 5Z" fill="rgba(0,0,0,0.3)" />
                <path d="M30 12L38 20L30 28L22 20L30 12Z" fill="rgba(200,245,66,0.8)" />
              </svg>
            </div>
          </div>
          
          <div className="relative flex items-end justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden">
                <span className="text-[10px] text-white font-medium">RK</span>
              </div>
              <span className="text-xs font-semibold text-black/80 bg-white/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
                {cardData.holderName}
              </span>
            </div>
            <span className="text-xl font-bold text-[#1a1f71] italic tracking-tight">VISA</span>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden p-5 flex flex-col justify-between"
        style={{
          background: 'linear-gradient(145deg, #3a3a3a 0%, #1f1f1f 50%, #0a0a0a 100%)',
        }}
      >
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.08) 35%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.08) 45%, transparent 60%)',
          }}
        />
        
        <div className="relative flex items-center justify-between">
          <span className="text-xs font-semibold text-white/50 tracking-wide">METAL</span>
          <span className="text-xs font-medium text-white/40">•••• {cardsData.metal.lastFour}</span>
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
            <svg width="20" height="15" viewBox="0 0 60 40" fill="none">
              <path d="M30 5L45 20L30 35L15 20L30 5Z" fill="rgba(255,255,255,0.2)" />
              <path d="M30 12L38 20L30 28L22 20L30 12Z" fill="rgba(255,255,255,0.1)" />
            </svg>
          </div>
        </div>
        
        <div className="relative flex items-end justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden">
              <span className="text-[10px] text-white font-medium">RK</span>
            </div>
            <span className="text-xs font-semibold text-white/90 bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-full">
              {cardsData.metal.holderName}
            </span>
          </div>
          <span className="text-xl font-bold text-white/70 italic tracking-tight">VISA</span>
        </div>
      </div>
    );
  };

  return (
    <MobileLayout
      showBackButton
      onBack={() => navigate(-1)}
      title={t("settings.limitsSettings")}
      rightAction={<LanguageSwitcher />}
    >
      <div className="px-4 pt-4 pb-6">
        
        
        {/* Card Carousel */}
        <div className="relative overflow-hidden mb-6">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              className="cursor-grab active:cursor-grabbing"
            >
              {renderCardVisual()}
            </motion.div>
          </AnimatePresence>
          
          {/* Pagination dots */}
          <div className="flex justify-center gap-2 mt-4">
            {cardTypes.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex 
                    ? "bg-primary w-6" 
                    : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Card label */}
        <motion.div
          key={`label-${activeIndex}`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <span className="text-sm text-muted-foreground">
            {t("limitsSettings.limitsFor", "Лимиты для")} <span className="font-semibold text-foreground">{cardsData[currentCardType].label}</span> •••• {cardsData[currentCardType].lastFour}
          </span>
        </motion.div>
      </div>

      <div className="px-4 pb-28">
        {/* Limits */}
        <motion.div
          key={`limits-${activeIndex}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-muted/70 dark:bg-card/70 backdrop-blur-xl rounded-2xl px-4 border border-border/50 mb-4"
        >
          <LimitItem 
            label={t("feesAndLimits.transferLimits")}
            dailyValue={currentLimits.transferDaily}
            perTransactionValue={currentLimits.transferPerTx}
            onClick={() => handleLimitClick(() => setTransferDrawerOpen(true))}
            dailyLabel={t("feesAndLimits.daily")}
            perTxLabel={t("feesAndLimits.perTx")}
          />
          <LimitItem 
            label={t("feesAndLimits.withdrawalLimits")}
            dailyValue={currentLimits.withdrawalDaily}
            perTransactionValue={currentLimits.withdrawalPerTx}
            onClick={() => handleLimitClick(() => setWithdrawalDrawerOpen(true))}
            dailyLabel={t("feesAndLimits.daily")}
            perTxLabel={t("feesAndLimits.perTx")}
          />
          <LimitItem 
            label={t("limitsSettings.accountWithdrawal", "Вывод на счёт")}
            dailyValue={currentLimits.accountWithdrawalDaily}
            perTransactionValue={currentLimits.accountWithdrawalPerTx}
            onClick={() => handleLimitClick(() => setAccountWithdrawalDrawerOpen(true))}
            dailyLabel={t("feesAndLimits.daily")}
            perTxLabel={t("feesAndLimits.perTx")}
            isLast
          />
        </motion.div>

        <PoweredByFooter />
      </div>

      {/* Transfer Limits Drawer */}
      <Drawer open={transferDrawerOpen} onOpenChange={setTransferDrawerOpen} shouldScaleBackground={false}>
        <DrawerContent className="bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="relative flex items-center justify-center py-4">
            <DrawerTitle className="text-center text-base font-semibold">
              {t("feesAndLimits.transferLimits")}
            </DrawerTitle>
            <DrawerClose className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <X className="w-3.5 h-3.5 text-primary" />
            </DrawerClose>
          </DrawerHeader>
          
          <div className="px-4 pb-6">
            <AnimatedDrawerContainer className="bg-muted/50 rounded-xl px-4">
              <AnimatedDrawerItem index={0}>
                <LimitSlider 
                  label={t("feesAndLimits.dailyLimit")}
                  value={currentLimits.transferDaily} 
                  max={currentCardType === "metal" ? 2000000 : 1000000}
                  onChange={(v) => updateLimit("transferDaily", v)}
                />
              </AnimatedDrawerItem>
              <AnimatedDrawerItem index={1}>
                <LimitSlider 
                  label={t("feesAndLimits.perTransaction")}
                  value={currentLimits.transferPerTx} 
                  max={currentCardType === "metal" ? 200000 : 100000}
                  onChange={(v) => updateLimit("transferPerTx", v)}
                />
              </AnimatedDrawerItem>
            </AnimatedDrawerContainer>
            <AnimatedDrawerItem index={2}>
              <button 
                onClick={() => setTransferDrawerOpen(false)} 
                className="w-full bg-primary text-white font-semibold py-4 rounded-xl hover:bg-primary/90 transition-all backdrop-blur-2xl border-2 border-white/50 shadow-lg active:scale-95 mt-4"
              >
                {t("feesAndLimits.save")}
              </button>
            </AnimatedDrawerItem>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Withdrawal Limits Drawer */}
      <Drawer open={withdrawalDrawerOpen} onOpenChange={setWithdrawalDrawerOpen} shouldScaleBackground={false}>
        <DrawerContent className="bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="relative flex items-center justify-center py-4">
            <DrawerTitle className="text-center text-base font-semibold">
              {t("feesAndLimits.withdrawalLimits")}
            </DrawerTitle>
            <DrawerClose className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <X className="w-3.5 h-3.5 text-primary" />
            </DrawerClose>
          </DrawerHeader>
          
          <div className="px-4 pb-6">
            <AnimatedDrawerContainer className="bg-muted/50 rounded-xl px-4">
              <AnimatedDrawerItem index={0}>
                <LimitSlider 
                  label={t("feesAndLimits.dailyLimit")}
                  value={currentLimits.withdrawalDaily} 
                  max={currentCardType === "metal" ? 2000000 : 1000000}
                  onChange={(v) => updateLimit("withdrawalDaily", v)}
                />
              </AnimatedDrawerItem>
              <AnimatedDrawerItem index={1}>
                <LimitSlider 
                  label={t("feesAndLimits.perTransaction")}
                  value={currentLimits.withdrawalPerTx} 
                  max={currentCardType === "metal" ? 200000 : 100000}
                  onChange={(v) => updateLimit("withdrawalPerTx", v)}
                />
              </AnimatedDrawerItem>
            </AnimatedDrawerContainer>
            <AnimatedDrawerItem index={2}>
              <button 
                onClick={() => setWithdrawalDrawerOpen(false)} 
                className="w-full bg-primary text-white font-semibold py-4 rounded-xl hover:bg-primary/90 transition-all backdrop-blur-2xl border-2 border-white/50 shadow-lg active:scale-95 mt-4"
              >
                {t("feesAndLimits.save")}
              </button>
            </AnimatedDrawerItem>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Account Withdrawal Limits Drawer */}
      <Drawer open={accountWithdrawalDrawerOpen} onOpenChange={setAccountWithdrawalDrawerOpen} shouldScaleBackground={false}>
        <DrawerContent className="bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="relative flex items-center justify-center py-4">
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-primary" />
              <DrawerTitle className="text-center text-base font-semibold">
                {t("limitsSettings.accountWithdrawal", "Вывод на счёт")}
              </DrawerTitle>
            </div>
            <DrawerClose className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <X className="w-3.5 h-3.5 text-primary" />
            </DrawerClose>
          </DrawerHeader>
          
          <div className="px-4 pb-6">
            <AnimatedDrawerContainer className="bg-muted/50 rounded-xl px-4">
              <AnimatedDrawerItem index={0}>
                <LimitSlider 
                  label={t("feesAndLimits.dailyLimit")}
                  value={currentLimits.accountWithdrawalDaily} 
                  max={currentCardType === "metal" ? 1000000 : 500000}
                  onChange={(v) => updateLimit("accountWithdrawalDaily", v)}
                />
              </AnimatedDrawerItem>
              <AnimatedDrawerItem index={1}>
                <LimitSlider 
                  label={t("feesAndLimits.perTransaction")}
                  value={currentLimits.accountWithdrawalPerTx} 
                  max={currentCardType === "metal" ? 100000 : 50000}
                  onChange={(v) => updateLimit("accountWithdrawalPerTx", v)}
                />
              </AnimatedDrawerItem>
            </AnimatedDrawerContainer>
            <AnimatedDrawerItem index={2}>
              <button 
                onClick={() => setAccountWithdrawalDrawerOpen(false)} 
                className="w-full bg-primary text-white font-semibold py-4 rounded-xl hover:bg-primary/90 transition-all backdrop-blur-2xl border-2 border-white/50 shadow-lg active:scale-95 mt-4"
              >
                {t("feesAndLimits.save")}
              </button>
            </AnimatedDrawerItem>
          </div>
        </DrawerContent>
      </Drawer>

      {/* iOS-style Auth Alert for Guests */}
      <AlertDialog open={authAlertOpen} onOpenChange={setAuthAlertOpen}>
        <AlertDialogContent className="w-[270px] rounded-2xl p-0 gap-0 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border-0 shadow-2xl">
          <div className="pt-5 pb-4 px-4 text-center">
            <AlertDialogTitle className="text-[17px] font-semibold text-foreground mb-1">
              {t("feesAndLimits.authRequired", "Требуется авторизация")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-muted-foreground leading-tight">
              {t("feesAndLimits.authRequiredMessage", "Для смены лимитов вам надо авторизоваться")}
            </AlertDialogDescription>
          </div>
          
          <div className="border-t border-[#C6C6C8] dark:border-[#38383A]">
            <button
              onClick={() => setAuthAlertOpen(false)}
              className="w-full py-[11px] text-[17px] text-[#007AFF] font-normal border-b border-[#C6C6C8] dark:border-[#38383A] active:bg-black/5 dark:active:bg-white/5 transition-colors"
            >
              {t("common.cancel", "Отмена")}
            </button>
            <button
              onClick={() => {
                setAuthAlertOpen(false);
                navigate("/auth/phone");
              }}
              className="w-full py-[11px] text-[17px] text-[#007AFF] font-semibold active:bg-black/5 dark:active:bg-white/5 transition-colors"
            >
              {t("common.authorize", "Авторизоваться")}
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
};

export default LimitsSettings;
