import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronDown, Check, Loader2, Crown, Zap, Sparkles, Rocket, Gem } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import useEmblaCarousel from "embla-carousel-react";
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

// Tariff gradient borders
const TARIFF_BORDER_COLORS: Record<string, string> = {
  smart: "border-emerald-500/50",
  agent: "border-amber-500/50",
  pro: "border-primary/50",
  vip: "border-violet-500/50",
  partner: "border-amber-400/50",
};

// Tariff gradient backgrounds
const TARIFF_BG_COLORS: Record<string, string> = {
  smart: "bg-emerald-500/10",
  agent: "bg-amber-500/10",
  pro: "bg-primary/10",
  vip: "bg-violet-500/10",
  partner: "bg-amber-400/10",
};

// All available tariffs
const ALL_TARIFFS = [
  { id: "smart", name: "Smart", price: 50 },
  { id: "agent", name: "Agent", price: 250 },
  { id: "pro", name: "PRO", price: 1270 },
  { id: "vip", name: "VIP", price: 2540 },
];

const TariffPayBalance = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // Get tariff data from router state (initial selection)
  const initialTariff = location.state || {};
  
  // Find initial tariff index
  const getInitialIndex = () => {
    const idx = ALL_TARIFFS.findIndex(t => t.id === initialTariff.tariffId);
    return idx >= 0 ? idx : 0;
  };
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    startIndex: getInitialIndex(),
    align: 'center'
  });
  const [selectedTariffIndex, setSelectedTariffIndex] = useState(getInitialIndex());
  const [selectedPaymentCardId, setSelectedPaymentCardId] = useState<string | null>(null);
  const [showCardSelector, setShowCardSelector] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: cardsData } = useCards();
  const userCards = cardsData?.data || [];

  // Current selected tariff
  const currentTariff = ALL_TARIFFS[selectedTariffIndex];
  const tariffId = currentTariff?.id || "smart";
  const tariffName = currentTariff?.name || "Smart";
  const tariffPrice = currentTariff?.price || 50;

  // Handle carousel selection
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedTariffIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

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
  const priceInAed = usdToAed(tariffPrice);

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

  const scrollToTariff = (index: number) => {
    emblaApi?.scrollTo(index);
  };

  const TariffIcon = TARIFF_ICONS[tariffId.toLowerCase()] || Crown;
  const tariffColor = TARIFF_COLORS[tariffId.toLowerCase()] || "text-primary";

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
      <div className="py-4 space-y-4 pb-32">
        {/* Tariff Carousel - Full Width */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground px-4">{t('partner.bonuses.selectTariff', 'Выберите тариф')}</p>
          
          <div className="w-full">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {ALL_TARIFFS.map((tariff, index) => {
                  const Icon = TARIFF_ICONS[tariff.id] || Crown;
                  const color = TARIFF_COLORS[tariff.id] || "text-primary";
                  const borderColor = TARIFF_BORDER_COLORS[tariff.id] || "border-primary/50";
                  const bgColor = TARIFF_BG_COLORS[tariff.id] || "bg-primary/10";
                  const isSelected = index === selectedTariffIndex;
                  
                  return (
                    <div 
                      key={tariff.id}
                      className="flex-[0_0_85%] min-w-0 pl-4 first:pl-4"
                    >
                      <motion.div
                        animate={{ 
                          scale: isSelected ? 1 : 0.92,
                          opacity: isSelected ? 1 : 0.6
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        onClick={() => scrollToTariff(index)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          isSelected 
                            ? `${borderColor} ${bgColor}` 
                            : 'border-border/30 bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl ${bgColor} flex items-center justify-center ${color}`}>
                            <Icon className="w-7 h-7" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-xl">{tariff.name}</p>
                            <p className="text-2xl font-bold text-primary">${tariff.price}</p>
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
                            >
                              <Check className="w-5 h-5 text-primary-foreground" />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
                <div className="flex-[0_0_15%] min-w-0" />
              </div>
            </div>
          </div>

          {/* Carousel Dots */}
          <div className="flex justify-center gap-2 pt-1">
            {ALL_TARIFFS.map((tariff, index) => (
              <button
                key={tariff.id}
                onClick={() => scrollToTariff(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === selectedTariffIndex 
                    ? 'w-8 bg-primary' 
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="px-4">
          <motion.div 
            key={tariffId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-3"
          >
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('partner.bonuses.tariffCost', 'Стоимость тарифа')}</span>
                <span className="font-medium">${tariffPrice}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('partner.bonuses.exchangeRate', 'Курс обмена')}</span>
                <span className="font-medium">1 USD = 3.67 AED</span>
              </div>
              <div className="flex justify-between text-base pt-2 border-t border-border/50">
                <span className="font-semibold">{t('openCard.totalToPay', 'Итого к оплате')}</span>
                <span className="font-bold text-primary">{formatBalance(priceInAed)} AED</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Card Selector */}
        <div className="px-4 space-y-2">
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
            className="mx-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive"
          >
            {t('openCard.insufficientBalance')}
          </motion.div>
        )}
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 max-w-[800px] mx-auto bg-gradient-to-t from-background via-background to-transparent pt-8">
        <motion.button
          key={tariffId}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
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
        </motion.button>
      </div>
    </MobileLayout>
  );
};

export default TariffPayBalance;