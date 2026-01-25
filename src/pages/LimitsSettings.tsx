import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { SlidersHorizontal, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

const AnimatedLimitsIcon = () => {
  const [isAnimated, setIsAnimated] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center pt-8 pb-6">
      <motion.div 
        className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <motion.div
          initial={{ rotate: -20, opacity: 0 }}
          animate={isAnimated ? { rotate: 0, opacity: 1 } : {}}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <SlidersHorizontal className="w-12 h-12 text-primary" />
        </motion.div>
      </motion.div>
    </div>
  );
};

const LimitsSettings = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  
  const [transferDrawerOpen, setTransferDrawerOpen] = useState(false);
  const [withdrawalDrawerOpen, setWithdrawalDrawerOpen] = useState(false);
  const [authAlertOpen, setAuthAlertOpen] = useState(false);
  
  const [transferDailyLimit, setTransferDailyLimit] = useState(500000);
  const [transferPerTransaction, setTransferPerTransaction] = useState(50000);
  const [withdrawalDailyLimit, setWithdrawalDailyLimit] = useState(500000);
  const [withdrawalPerTransaction, setWithdrawalPerTransaction] = useState(50000);

  const handleLimitClick = (openDrawer: () => void) => {
    if (!isAuthenticated) {
      setAuthAlertOpen(true);
    } else {
      openDrawer();
    }
  };

  return (
    <MobileLayout
      showBackButton
      onBack={() => navigate(-1)}
      rightAction={<LanguageSwitcher />}
    >
      <AnimatedLimitsIcon />
      <div className="flex flex-col items-center pb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("settings.limitsSettings")}</h1>
      </div>

      <div className="px-4 pb-28">
        {/* Transfer Limits */}
        <div className="bg-card rounded-2xl px-4 border border-border/50 shadow-sm mb-4">
          <LimitItem 
            label={t("feesAndLimits.transferLimits")}
            dailyValue={transferDailyLimit}
            perTransactionValue={transferPerTransaction}
            onClick={() => handleLimitClick(() => setTransferDrawerOpen(true))}
            dailyLabel={t("feesAndLimits.daily")}
            perTxLabel={t("feesAndLimits.perTx")}
          />
          <LimitItem 
            label={t("feesAndLimits.withdrawalLimits")}
            dailyValue={withdrawalDailyLimit}
            perTransactionValue={withdrawalPerTransaction}
            onClick={() => handleLimitClick(() => setWithdrawalDrawerOpen(true))}
            dailyLabel={t("feesAndLimits.daily")}
            perTxLabel={t("feesAndLimits.perTx")}
            isLast
          />
        </div>

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
                  value={transferDailyLimit} 
                  max={1000000}
                  onChange={setTransferDailyLimit}
                />
              </AnimatedDrawerItem>
              <AnimatedDrawerItem index={1}>
                <LimitSlider 
                  label={t("feesAndLimits.perTransaction")}
                  value={transferPerTransaction} 
                  max={100000}
                  onChange={setTransferPerTransaction}
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
                  value={withdrawalDailyLimit} 
                  max={1000000}
                  onChange={setWithdrawalDailyLimit}
                />
              </AnimatedDrawerItem>
              <AnimatedDrawerItem index={1}>
                <LimitSlider 
                  label={t("feesAndLimits.perTransaction")}
                  value={withdrawalPerTransaction} 
                  max={100000}
                  onChange={setWithdrawalPerTransaction}
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
