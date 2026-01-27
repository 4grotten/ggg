import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronDown, Check, Loader2, Crown, Zap, Sparkles, Rocket, Gem } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { CardMiniature } from "@/components/dashboard/CardMiniature";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { useCards } from "@/hooks/useCards";

// Tariff icons mapping
const TARIFF_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  smart: Zap,
  agent: Sparkles,
  pro: Crown,
  vip: Rocket,
  partner: Gem,
};

// Tariff colors mapping
const TARIFF_COLORS: Record<string, string> = {
  smart: "text-emerald-500",
  agent: "text-amber-500",
  pro: "text-primary",
  vip: "text-violet-500",
  partner: "text-amber-400",
};

const TariffPayBalance = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // Get tariff data from router state
  const { tariffId, tariffName, tariffPrice, tariffDescription } = location.state || {};
  
  const [selectedPaymentCardId, setSelectedPaymentCardId] = useState<string | null>(null);
  const [showCardSelector, setShowCardSelector] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: cardsData } = useCards();
  const userCards = cardsData?.data || [];

  // Redirect if no tariff data
  useEffect(() => {
    if (!tariffPrice) {
      navigate('/partner/bonuses');
    }
  }, [tariffPrice, navigate]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Set first card as default
  useEffect(() => {
    if (userCards.length > 0 && !selectedPaymentCardId) {
      setSelectedPaymentCardId(userCards[0].id);
    }
  }, [userCards, selectedPaymentCardId]);

  // Convert USD to AED (approximate rate)
  const usdToAed = (usd: number) => usd * 3.67;
  const priceInAed = tariffPrice ? usdToAed(tariffPrice) : 0;

  const selectedPaymentCard = userCards.find(c => c.id === selectedPaymentCardId);
  const hasEnoughBalance = selectedPaymentCard && (selectedPaymentCard.balance || 0) >= priceInAed;

  const formatBalance = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleConfirmPayment = async () => {
    if (!hasEnoughBalance) {
      toast.error(t('openCard.insufficientBalance'));
      return;
    }
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    toast.success(t('partner.bonuses.purchaseSuccess', 'Тариф успешно приобретён!'));
    navigate('/partner/bonuses');
  };

  const TariffIcon = tariffId ? TARIFF_ICONS[tariffId.toLowerCase()] || Crown : Crown;
  const tariffColor = tariffId ? TARIFF_COLORS[tariffId.toLowerCase()] || "text-primary" : "text-primary";

  if (!tariffPrice) {
    return null;
  }

  return (
    <MobileLayout
      header={
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">{t('partner.bonuses.payForTariff', 'Оплата тарифа')}</h1>
        </div>
      }
      rightAction={<LanguageSwitcher />}
    >
      <div className="px-4 py-6 space-y-4 pb-32">
        {/* Tariff Details */}
        <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-4 overflow-hidden relative">
          {/* Decorative gradient */}
          <div 
            className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none"
            style={{
              background: "radial-gradient(circle at top right, rgba(139, 92, 246, 0.5) 0%, transparent 70%)"
            }}
          />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className={`w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center ${tariffColor}`}>
              <TariffIcon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">{tariffName}</p>
              <p className="text-xs text-muted-foreground">
                {t('partner.bonuses.tariffPurchase', 'Приобретение тарифа')}
              </p>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2 pt-3 border-t border-border/50 relative z-10">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('partner.bonuses.tariffCost', 'Стоимость тарифа')}</span>
              <span className="font-medium">${tariffPrice}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('partner.bonuses.exchangeRate', 'Курс обмена')}</span>
              <span className="font-medium">1 USD = 3.67 AED</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('partner.bonuses.paymentType', 'Тип оплаты')}</span>
              <span className="font-medium">{t('partner.bonuses.oneTimePayment', 'Единоразовый платёж')}</span>
            </div>
            <div className="flex justify-between text-base pt-2 border-t border-border/50">
              <span className="font-semibold">{t('openCard.totalToPay', 'Итого к оплате')}</span>
              <span className="font-bold text-primary">{formatBalance(priceInAed)} AED</span>
            </div>
          </div>
        </div>

        {/* What's Included Preview */}
        {tariffDescription && (
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
            <p className="text-sm text-primary/80">{tariffDescription}</p>
          </div>
        )}

        {/* Card Selector */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">{t('openCard.payFromCard', 'Оплатить с карты')}</label>
          <div className="relative">
            <button
              onClick={() => setShowCardSelector(!showCardSelector)}
              className="w-full p-4 rounded-2xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-all flex items-center gap-3"
            >
              {selectedPaymentCard ? (
                <>
                  <div className="w-10 shrink-0">
                    <CardMiniature type={selectedPaymentCard.type} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{selectedPaymentCard.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('card.cardBalance')}: {formatBalance(selectedPaymentCard.balance || 0)} AED
                    </p>
                  </div>
                </>
              ) : (
                <span className="text-muted-foreground">{t('openCard.selectCard')}</span>
              )}
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showCardSelector ? 'rotate-180' : ''}`} />
            </button>

            {/* Card Dropdown */}
            <AnimatePresence>
              {showCardSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-background border border-border/50 rounded-2xl overflow-hidden shadow-lg z-50"
                >
                  {userCards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => {
                        setSelectedPaymentCardId(card.id);
                        setShowCardSelector(false);
                      }}
                      className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-10 shrink-0">
                        <CardMiniature type={card.type} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">{card.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBalance(card.balance || 0)} AED
                        </p>
                      </div>
                      {selectedPaymentCardId === card.id && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Insufficient Balance Warning */}
        {selectedPaymentCard && !hasEnoughBalance && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive"
          >
            {t('openCard.insufficientBalance')}
          </motion.div>
        )}
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 max-w-[800px] mx-auto">
        <button
          onClick={handleConfirmPayment}
          disabled={!hasEnoughBalance || isProcessing}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('send.processing')}
            </>
          ) : (
            <>
              {t('openCard.confirmPayment')} — {formatBalance(priceInAed)} AED
            </>
          )}
        </button>
      </div>
    </MobileLayout>
  );
};

export default TariffPayBalance;
