import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Sparkles, Crown, Zap, Rocket } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { Button } from "@/components/ui/button";

// Tariff plans configuration
const TARIFFS = [
  {
    id: "smart",
    name: "Smart",
    price: 35,
    icon: Zap,
    badge: null,
    badgeType: "current" as const,
    description: "partner.bonuses.smartDesc",
    includes: [
      "partner.bonuses.virtualCard",
      "partner.bonuses.cardIncome30",
      "partner.bonuses.tariffIncome15",
      "partner.bonuses.referralLevel1",
    ],
    alsoIncludes: [],
  },
  {
    id: "agent",
    name: "Agent",
    price: 215,
    icon: Sparkles,
    badge: null,
    badgeType: null,
    description: "partner.bonuses.agentDesc",
    includes: [
      "partner.bonuses.virtualCard",
      "partner.bonuses.cardIncome30",
      "partner.bonuses.tariffIncome15",
    ],
    alsoIncludes: [
      "partner.bonuses.referralLevel5",
    ],
  },
  {
    id: "pro",
    name: "PRO",
    price: 1215,
    icon: Crown,
    badge: "partner.bonuses.bestStart",
    badgeType: "recommended" as const,
    description: "partner.bonuses.proDesc",
    includes: [
      "partner.bonuses.virtualCard",
      "partner.bonuses.cardIncomeFixed30",
      "partner.bonuses.tariffIncome25",
    ],
    alsoIncludes: [
      "partner.bonuses.referralLevel9",
      "partner.bonuses.qualificationR4",
      "partner.bonuses.corporateTraining",
    ],
  },
  {
    id: "vip",
    name: "VIP",
    price: 2465,
    icon: Rocket,
    badge: "partner.bonuses.bigSales",
    badgeType: "premium" as const,
    description: "partner.bonuses.vipDesc",
    includes: [
      "partner.bonuses.virtualCard",
      "partner.bonuses.cardIncomeFixed30",
      "partner.bonuses.tariffIncome25",
      "partner.bonuses.referralLevel9",
      "partner.bonuses.qualificationR4",
    ],
    alsoIncludes: [
      "partner.bonuses.corporateTraining",
      "partner.bonuses.b2bIncome",
      "partner.bonuses.corporateAccess",
      "partner.bonuses.closedEvents",
      "partner.bonuses.dedicatedSupport",
    ],
  },
];

const PartnerBonuses = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedTariffIndex, setSelectedTariffIndex] = useState(2); // PRO by default
  const [currentTariffId] = useState("smart"); // Mock current tariff
  
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const selectedTariff = TARIFFS[selectedTariffIndex];
  const isCurrentTariff = selectedTariff.id === currentTariffId;

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-[800px] mx-auto overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border max-w-[800px] mx-auto">
        <div className="flex items-center justify-between h-14 px-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold">{t('partner.bonuses.title', 'Выберите тариф')}</h1>
          <LanguageSwitcher />
        </div>
      </header>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-32 pt-14">
        {/* Tariff Selector Carousel */}
        <div className="px-4 pt-6">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 pt-4">
            {TARIFFS.map((tariff, idx) => {
              const isSelected = idx === selectedTariffIndex;
              const isCurrent = tariff.id === currentTariffId;
              
              return (
                <motion.button
                  key={tariff.id}
                  onClick={() => setSelectedTariffIndex(idx)}
                  className={`relative flex-shrink-0 min-w-[120px] rounded-2xl p-4 text-left transition-all ${
                    isSelected 
                      ? "border-2 border-primary bg-muted/70 dark:bg-card/70" 
                      : "border border-border/50 bg-muted/30 dark:bg-card/30"
                  }`}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Badge above card */}
                  {isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-medium rounded-full">
                      {t('partner.bonuses.yourTariff', 'Ваш тариф')}
                    </span>
                  )}
                  {tariff.badge && !isCurrent && (
                    <span 
                      className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        tariff.badgeType === "recommended" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-violet-500 text-white"
                      }`}
                    >
                      {t(tariff.badge)}
                    </span>
                  )}
                  
                  <p className={`font-bold text-lg ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                    {tariff.name}
                  </p>
                  <p className={`text-sm ${isSelected ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
                    ${tariff.price}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
        
        {/* Selected Tariff Details */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTariff.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="px-4"
          >
            <div className="relative bg-muted/70 dark:bg-card/70 backdrop-blur-xl rounded-3xl p-5 border border-border/50 overflow-hidden">
              {/* Decorative glow */}
              <div 
                className="absolute top-0 right-0 w-40 h-40 opacity-30"
                style={{
                  background: "radial-gradient(circle at top right, rgba(139, 92, 246, 0.5) 0%, transparent 70%)"
                }}
              />
              
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <selectedTariff.icon className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold">{selectedTariff.name}</h2>
                  </div>
                  <p className="text-3xl font-bold">${selectedTariff.price}</p>
                </div>
                <span className="px-3 py-1.5 bg-muted rounded-full text-xs font-medium text-muted-foreground">
                  {isCurrentTariff 
                    ? t('partner.bonuses.currentTariff', 'Текущий тариф')
                    : t('partner.bonuses.oneTimePayment', 'Единоразовый платёж')
                  }
                </span>
              </div>
              
              {/* Description */}
              <p className="text-primary/80 dark:text-primary/70 text-sm mb-5">
                {t(selectedTariff.description)}
              </p>
              
              <div className="h-px bg-border/50 mb-5" />
              
              {/* Includes */}
              <h3 className="font-bold mb-3">{t('partner.bonuses.includes', 'Включает в себя:')}</h3>
              <div className="space-y-3 mb-5">
                {selectedTariff.includes.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm">{t(item)}</span>
                  </div>
                ))}
              </div>
              
              {/* Also includes */}
              {selectedTariff.alsoIncludes.length > 0 && (
                <>
                  <h3 className="font-bold mb-3">{t('partner.bonuses.alsoIncludes', 'А также:')}</h3>
                  <div className="space-y-3">
                    {selectedTariff.alsoIncludes.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm">{t(item)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Comparison Table */}
        <div className="px-4 mt-6">
          <h3 className="text-center font-bold mb-4">{t('partner.bonuses.compare', 'Сравните возможности')}</h3>
          
          <div className="bg-muted/70 dark:bg-card/70 backdrop-blur-xl rounded-3xl border border-border/50 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-4 gap-2 p-4 border-b border-border/50">
              {TARIFFS.map((tariff) => (
                <div key={tariff.id} className="text-center">
                  <p className="font-bold text-sm">{tariff.name}</p>
                  <p className="text-xs text-muted-foreground">${tariff.price}</p>
                </div>
              ))}
            </div>
            
            {/* Virtual card row */}
            <div className="p-4 border-b border-border/30">
              <p className="text-xs text-muted-foreground text-center mb-3">
                {t('partner.bonuses.virtualCard', 'Выпуск виртуальной карты')}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {TARIFFS.map((tariff) => (
                  <div key={tariff.id} className="flex justify-center">
                    <Check className="w-5 h-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Card income row */}
            <div className="p-4 border-b border-border/30">
              <p className="text-xs text-muted-foreground text-center mb-3">
                {t('partner.bonuses.cardIncomeLabel', 'Доход с продаж карт')}
              </p>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center text-sm font-medium">15-30%</div>
                <div className="text-center text-sm font-medium">30%</div>
                <div className="text-center text-sm font-medium">30%</div>
                <div className="text-center text-sm font-medium">30%</div>
              </div>
            </div>
            
            {/* Referral levels row */}
            <div className="p-4">
              <p className="text-xs text-muted-foreground text-center mb-3">
                {t('partner.bonuses.referralLevelsLabel', 'Уровней реферальной программы')}
              </p>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center text-sm font-medium">1</div>
                <div className="text-center text-sm font-medium">5</div>
                <div className="text-center text-sm font-medium">9</div>
                <div className="text-center text-sm font-medium">9</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Fixed Bottom Button */}
      {!isCurrentTariff && (
        <div className="fixed bottom-6 left-4 right-4 max-w-[800px] mx-auto">
          <motion.div
            className="relative rounded-2xl overflow-hidden"
            animate={{
              boxShadow: [
                "0 0 20px rgba(102, 126, 234, 0.4), 0 0 40px rgba(118, 75, 162, 0.3)",
                "0 0 30px rgba(248, 87, 166, 0.4), 0 0 60px rgba(102, 126, 234, 0.3)",
                "0 0 20px rgba(102, 126, 234, 0.4), 0 0 40px rgba(118, 75, 162, 0.3)",
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Animated gradient border */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: "linear-gradient(90deg, #667eea, #764ba2, #f857a6, #667eea)",
                backgroundSize: "300% 100%",
              }}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Glass inner button */}
            <Button 
              className="relative w-full h-14 text-base font-bold rounded-2xl m-[2px] bg-background/80 dark:bg-card/80 backdrop-blur-xl text-foreground hover:bg-background/90 dark:hover:bg-card/90 border-0"
              style={{ width: "calc(100% - 4px)" }}
            >
              <span className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 bg-clip-text text-transparent font-bold">
                {t('partner.bonuses.purchase', 'Приобрести')} — ${selectedTariff.price}
              </span>
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PartnerBonuses;
