import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CreditCard, Wallet, ChevronRight, Sparkles, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { VIRTUAL_CARD_ANNUAL_FEE, METAL_CARD_ANNUAL_FEE } from "@/lib/fees";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type CardType = "virtual" | "metal";

const OpenCardPayment = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get("type") as CardType) || "virtual";
  const [selectedCard, setSelectedCard] = useState<CardType>(initialType);
  const [authAlertOpen, setAuthAlertOpen] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const cardIssuanceFee = selectedCard === "virtual" ? VIRTUAL_CARD_ANNUAL_FEE : METAL_CARD_ANNUAL_FEE;

  const handlePaymentSelect = (method: "balance" | "crypto" | "bank") => {
    if (!isAuthenticated) {
      setAuthAlertOpen(true);
      return;
    }
    
    if (method === "crypto") {
      navigate(`/open-card/pay-crypto?type=${selectedCard}`);
    } else if (method === "bank") {
      navigate(`/open-card/pay-bank?type=${selectedCard}`);
    } else {
      navigate(`/open-card/pay-balance?type=${selectedCard}`);
    }
  };

  const benefits = {
    virtual: ['virtualBenefit1', 'virtualBenefit2', 'virtualBenefit3'],
    metal: ['metalBenefit1', 'metalBenefit2', 'metalBenefit3'],
  };

  return (
    <>
      <MobileLayout
        header={
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">{t('openCard.title')}</h1>
          </div>
        }
        rightAction={<LanguageSwitcher />}
      >
        <div className="px-4 py-6 space-y-4 pb-8">
          {/* Card Carousel */}
          <div className="relative overflow-hidden max-w-[400px] mx-auto">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={selectedCard}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(_, info) => {
                  const threshold = 50;
                  if (info.offset.x < -threshold || info.velocity.x < -500) {
                    setSelectedCard(selectedCard === "virtual" ? "metal" : "virtual");
                  } else if (info.offset.x > threshold || info.velocity.x > 500) {
                    setSelectedCard(selectedCard === "metal" ? "virtual" : "metal");
                  }
                }}
                className="cursor-grab active:cursor-grabbing"
              >
                {/* Card Visual */}
                {selectedCard === "virtual" ? (
                  <div 
                    className="relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden p-5 flex flex-col justify-between"
                    style={{
                      background: 'linear-gradient(135deg, #d4f94e 0%, #a8e030 50%, #8bc926 100%)',
                    }}
                  >
                    <div 
                      className="absolute inset-0 opacity-40"
                      style={{
                        background: 'radial-gradient(ellipse at 20% 20%, rgba(255,255,255,0.4) 0%, transparent 50%)',
                      }}
                    />
                    <div className="relative flex items-center justify-between">
                      <span className="text-xs font-semibold text-black/70 tracking-wide">VIRTUAL</span>
                      <span className="px-2 py-0.5 rounded-full bg-black/10 text-black/70 text-[10px] font-medium">
                        {t('openCard.instant')}
                      </span>
                    </div>
                    {/* Benefits in center */}
                    <div className="relative space-y-0.5">
                      {benefits.virtual.map((key) => (
                        <p key={key} className="text-[13px] text-black/60">• {t(`openCard.${key}`)}</p>
                      ))}
                    </div>
                    <div className="relative flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-black/90">{cardIssuanceFee} AED</p>
                        <p className="text-[10px] text-black/60">{t('openCard.annualFee')}</p>
                      </div>
                      <span className="text-xl font-bold text-[#1a1f71] italic">VISA</span>
                    </div>
                  </div>
                ) : (
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
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-medium flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        {t('openCard.premium')}
                      </span>
                    </div>
                    {/* Benefits in center */}
                    <div className="relative space-y-0.5">
                      {benefits.metal.map((key) => (
                        <p key={key} className="text-[13px] text-white/50">• {t(`openCard.${key}`)}</p>
                      ))}
                    </div>
                    <div className="relative flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-white">{cardIssuanceFee} AED</p>
                        <p className="text-[10px] text-white/50">{t('openCard.annualFee')}</p>
                      </div>
                      <span className="text-xl font-bold text-white/70 italic">VISA</span>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            
            {/* Pagination dots */}
            <div className="flex justify-center gap-2 mt-3">
              <button
                onClick={() => setSelectedCard("virtual")}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  selectedCard === "virtual" ? "bg-primary w-6" : "bg-muted-foreground/30"
                }`}
              />
              <button
                onClick={() => setSelectedCard("metal")}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  selectedCard === "metal" ? "bg-primary w-6" : "bg-muted-foreground/30"
                }`}
              />
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            {/* Pay from Balance */}
            <button
              onClick={() => handlePaymentSelect("balance")}
              className="w-full p-4 rounded-2xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold block">{t('openCard.payFromBalance')}</span>
                  <p className="text-sm text-muted-foreground">
                    {t('openCard.payFromBalanceDescription')}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Pay with Crypto */}
            <button
              onClick={() => handlePaymentSelect("crypto")}
              className="w-full p-4 rounded-2xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-green-500" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold block">{t('openCard.payWithCrypto')}</span>
                  <p className="text-sm text-muted-foreground">
                    {t('openCard.payWithCryptoDescription')}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Pay with Bank Transfer */}
            <button
              onClick={() => handlePaymentSelect("bank")}
              className="w-full p-4 rounded-2xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-amber-500" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold block">{t('openCard.payWithBank')}</span>
                  <p className="text-sm text-muted-foreground">
                    {t('openCard.payWithBankDescription')}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </MobileLayout>

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

export default OpenCardPayment;
