import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Receipt, CreditCard, ArrowDownToLine, Send, ArrowLeftRight, Percent, Banknote, CircleDollarSign, Headphones, Users, MessageCircle } from "lucide-react";
import { useVoiceCall } from "@/contexts/VoiceCallContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  VIRTUAL_CARD_ANNUAL_FEE,
  VIRTUAL_CARD_REPLACEMENT_FEE,
  METAL_CARD_ANNUAL_FEE,
  METAL_CARD_REPLACEMENT_FEE,
  VIRTUAL_ACCOUNT_OPENING_FEE,
  USDT_TO_AED_TOP_UP,
  USDT_TO_AED_SEND,
  TOP_UP_CRYPTO_FEE,
  TOP_UP_BANK_FEE_PERCENT,
  CARD_TO_CARD_FEE_PERCENT,
  BANK_TRANSFER_FEE_PERCENT,
  NETWORK_FEE_PERCENT,
  CURRENCY_CONVERSION_FEE_PERCENT,
} from "@/lib/fees";

interface FeeItemProps {
  label: string;
  value: string;
  isLast?: boolean;
}

const FeeItem = ({ label, value, isLast = false }: FeeItemProps) => (
  <div className={`flex items-center justify-between py-3 ${!isLast ? 'border-b border-border' : ''}`}>
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground font-medium text-right">{value}</span>
  </div>
);

interface FeeSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const FeeSection = ({ title, icon, children }: FeeSectionProps) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3 px-1">
      <div className="text-primary">{icon}</div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
    </div>
    <div className="bg-muted/70 dark:bg-card/70 backdrop-blur-xl rounded-2xl px-4 border border-border/50">
      {children}
    </div>
  </div>
);

const AnimatedFeeIcon = () => {
  const [step, setStep] = useState(0);
  
  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 300),
      setTimeout(() => setStep(2), 600),
      setTimeout(() => setStep(3), 900),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const icons = [
    { Icon: Percent, key: "percent" },
    { Icon: Banknote, key: "money" },
    { Icon: CircleDollarSign, key: "usdt" },
    { Icon: Receipt, key: "receipt" },
  ];

  return (
    <div className="flex flex-col items-center pt-8 pb-6">
      <motion.div 
        className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative overflow-hidden"
        animate={step === 3 ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {icons.map((item, index) => (
            step === index && (
              <motion.div
                key={item.key}
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="absolute"
              >
                <item.Icon className="w-12 h-12 text-primary" />
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const FeesAndLimits = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <MobileLayout
      showBackButton
      onBack={() => navigate(-1)}
      title={t("feesAndLimits.title")}
      rightAction={<LanguageSwitcher />}
    >
      <AnimatedFeeIcon />

      <div className="px-4 pb-28">
        {/* One-Time Fees */}
        <FeeSection title={t("feesAndLimits.oneTimeFees")} icon={<CreditCard className="w-4 h-4" />}>
          <FeeItem label={t("feesAndLimits.virtualCardAnnual")} value={`${VIRTUAL_CARD_ANNUAL_FEE.toFixed(2)} AED`} />
          <FeeItem label={t("feesAndLimits.virtualCardReplacement")} value={`${VIRTUAL_CARD_REPLACEMENT_FEE.toFixed(2)} AED`} />
          <FeeItem label={t("feesAndLimits.metalCardAnnual")} value={`${METAL_CARD_ANNUAL_FEE.toFixed(2)} AED`} />
          <FeeItem label={t("feesAndLimits.metalCardReplacement")} value={`${METAL_CARD_REPLACEMENT_FEE.toFixed(2)} AED`} />
          <FeeItem label={t("feesAndLimits.virtualAccountOpening")} value={`${VIRTUAL_ACCOUNT_OPENING_FEE.toFixed(2)} AED`} isLast />
        </FeeSection>

        {/* Top Up */}
        <FeeSection title={t("feesAndLimits.topUp")} icon={<ArrowDownToLine className="w-4 h-4" />}>
          <FeeItem label={t("feesAndLimits.exchangeRate")} value={`1 USDT = ${USDT_TO_AED_TOP_UP.toFixed(2)} AED`} />
          <FeeItem label={t("feesAndLimits.withCrypto")} value={`${TOP_UP_CRYPTO_FEE.toFixed(2)} USDT`} />
          <FeeItem label={t("feesAndLimits.withBankTransfer")} value={`${TOP_UP_BANK_FEE_PERCENT}%`} isLast />
        </FeeSection>

        {/* Send */}
        <FeeSection title={t("feesAndLimits.send")} icon={<Send className="w-4 h-4" />}>
          <FeeItem label={t("feesAndLimits.easyCardToEasyCard")} value={`${CARD_TO_CARD_FEE_PERCENT}%`} />
          <FeeItem label={t("feesAndLimits.toBankAccount")} value={`${BANK_TRANSFER_FEE_PERCENT}%`} />
          <FeeItem label={t("feesAndLimits.networkFee")} value={`${NETWORK_FEE_PERCENT}%`} />
          <FeeItem label={t("feesAndLimits.exchangeRate")} value={`1 USDT = ${USDT_TO_AED_SEND.toFixed(2)} AED`} isLast />
        </FeeSection>

        {/* Transactions */}
        <FeeSection title={t("feesAndLimits.transactionsSection")} icon={<ArrowLeftRight className="w-4 h-4" />}>
          <FeeItem label={t("feesAndLimits.currencyConversion")} value={`${CURRENCY_CONVERSION_FEE_PERCENT.toFixed(2)}%`} isLast />
        </FeeSection>

        {/* Support Buttons */}
        <SupportButtons />

        <PoweredByFooter />
      </div>
    </MobileLayout>
  );
};

const SupportButtons = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { startCall } = useVoiceCall();

  const handleCardSupport = () => {
    startCall("EVA");
  };

  const handleReferralSupport = () => {
    startCall("ANGIE");
  };

  const handleAIChat = () => {
    navigate("/chat");
  };

  return (
    <div className="flex flex-col gap-3 mb-6">
      <Button
        variant="outline"
        className="w-full h-14 justify-start gap-3 rounded-2xl bg-muted/70 dark:bg-card/70 backdrop-blur-xl border-border/50 hover:bg-muted"
        onClick={handleCardSupport}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Headphones className="w-5 h-5 text-primary" />
        </div>
        <span className="text-foreground font-medium">{t("feesAndLimits.cardSupport", "Поддержка по картам")}</span>
      </Button>

      <Button
        variant="outline"
        className="w-full h-14 justify-start gap-3 rounded-2xl bg-muted/70 dark:bg-card/70 backdrop-blur-xl border-border/50 hover:bg-muted"
        onClick={handleReferralSupport}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <span className="text-foreground font-medium">{t("feesAndLimits.referralSupport", "Поддержка по рефералам")}</span>
      </Button>

      <Button
        variant="outline"
        className="w-full h-14 justify-start gap-3 rounded-2xl bg-muted/70 dark:bg-card/70 backdrop-blur-xl border-border/50 hover:bg-muted"
        onClick={handleAIChat}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-primary" />
        </div>
        <span className="text-foreground font-medium">{t("feesAndLimits.aiChat", "Чат с AI ассистентом")}</span>
      </Button>
    </div>
  );
};

export default FeesAndLimits;
