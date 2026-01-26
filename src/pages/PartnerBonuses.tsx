import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Sparkles, Crown, Zap, Rocket, Gem } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { Button } from "@/components/ui/button";

// Tariff plans configuration
const TARIFFS = [
  {
    id: "smart",
    nameKey: "partner.bonuses.tariffSmart",
    price: 50,
    icon: Zap,
    badge: null,
    badgeType: "current" as const,
    description: "partner.bonuses.smartDesc",
    includes: [
      "partner.bonuses.virtualCard",
      "partner.bonuses.cardIncome15",
      "partner.bonuses.tariffIncome15",
      "partner.bonuses.referralLevel1",
    ],
    alsoIncludes: [],
  },
  {
    id: "agent",
    nameKey: "partner.bonuses.tariffAgent",
    price: 250,
    icon: Sparkles,
    badge: "partner.bonuses.padawan",
    badgeType: "padawan" as const,
    description: "partner.bonuses.agentDesc",
    includes: [
      "partner.bonuses.virtualCard",
      "partner.bonuses.cardIncome25",
      "partner.bonuses.tariffIncome15",
    ],
    alsoIncludes: [
      "partner.bonuses.referralLevel5",
    ],
  },
  {
    id: "pro",
    nameKey: "partner.bonuses.tariffPro",
    price: 1270,
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
    nameKey: "partner.bonuses.tariffVip",
    price: 2540,
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
  {
    id: "partner",
    nameKey: "partner.bonuses.tariffPartner",
    price: -1, // -1 means priceless
    icon: Gem,
    badge: "partner.bonuses.contract",
    badgeType: "contract" as const,
    description: "partner.bonuses.partnerDesc",
    includes: [
      "partner.bonuses.unlimitedCards",
      "partner.bonuses.maxCardIncome",
      "partner.bonuses.maxTariffIncome",
      "partner.bonuses.unlimitedReferral",
      "partner.bonuses.personalManager",
    ],
    alsoIncludes: [
      "partner.bonuses.ownCourses",
      "partner.bonuses.unlimitedVolumes",
      "partner.bonuses.regionalFranchise",
      "partner.bonuses.internationalExpansion",
      "partner.bonuses.whiteLabel",
      "partner.bonuses.prioritySupport",
    ],
  },
];

const PartnerBonuses = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedTariffIndex, setSelectedTariffIndex] = useState(2); // PRO by default
  const [currentTariffId] = useState("smart"); // Mock current tariff
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Scroll carousel to selected tariff
  const scrollToTariff = useCallback((index: number) => {
    if (carouselRef.current) {
      const container = carouselRef.current;
      const items = container.querySelectorAll('[data-tariff-item]');
      const targetItem = items[index] as HTMLElement;
      if (targetItem) {
        const containerRect = container.getBoundingClientRect();
        const itemRect = targetItem.getBoundingClientRect();
        const scrollLeft = targetItem.offsetLeft - (containerRect.width / 2) + (itemRect.width / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, []);
  
  // Handle tariff change with scroll sync
  const handleTariffChange = useCallback((index: number) => {
    setSelectedTariffIndex(index);
    scrollToTariff(index);
  }, [scrollToTariff]);
  
  const handleBack = useCallback(() => {
    navigate('/partner');
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
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-40 pt-14">
        {/* Tariff Selector Carousel */}
        <div className="px-4 pt-6">
          <div ref={carouselRef} className="relative flex gap-3 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 pt-4 md:mx-0 md:px-0 md:overflow-x-visible md:justify-between">
            {TARIFFS.map((tariff, idx) => {
              const isSelected = idx === selectedTariffIndex;
              const isCurrent = tariff.id === currentTariffId;
              
              return (
                <motion.button
                  key={tariff.id}
                  data-tariff-item
                  onClick={() => handleTariffChange(idx)}
                  className={`relative flex-shrink-0 min-w-[120px] md:min-w-0 md:flex-1 rounded-2xl p-4 text-left transition-colors duration-200 ${
                    isSelected 
                      ? "bg-muted/70 dark:bg-card/70" 
                      : "border border-transparent bg-muted/30 dark:bg-card/30"
                  }`}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Animated border for selected state */}
                  {isSelected && (
                    <motion.div
                      layoutId="tariff-selector-border"
                      className="absolute inset-0 rounded-2xl border-2 border-primary"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  
                  {/* Badge above card */}
                  {isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 bg-emerald-500 dark:bg-[#BFFF00] text-white dark:text-black text-[10px] font-bold rounded-full z-10">
                      {t('partner.bonuses.yourTariff', 'Ваш тариф')}
                    </span>
                  )}
                  {tariff.badge && !isCurrent && (
                    tariff.badgeType === "contract" ? (
                      <span 
                        className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 text-[10px] font-bold rounded-full text-amber-900 overflow-hidden z-10"
                        style={{
                          background: "linear-gradient(90deg, #D4AF37, #F5E6A3, #C5A028, #F5E6A3, #D4AF37)",
                          backgroundSize: "200% 100%",
                          animation: "goldShimmer 4s ease-in-out infinite",
                          boxShadow: "0 0 6px rgba(212, 175, 55, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)"
                        }}
                      >
                        {t(tariff.badge)}
                      </span>
                    ) : (
                      <span 
                        className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 text-[10px] font-bold rounded-full z-10 ${
                          tariff.badgeType === "recommended" 
                            ? "bg-primary text-primary-foreground" 
                            : tariff.badgeType === "padawan"
                            ? "bg-amber-500 text-white"
                            : "bg-violet-500 text-white"
                        }`}
                      >
                        {t(tariff.badge)}
                      </span>
                    )
                  )}
                  
                  <p className={`font-bold text-lg relative z-10 ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                    {t(tariff.nameKey)}
                  </p>
                  <p className={`text-sm relative z-10 ${isSelected ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
                    {tariff.price === -1 ? t('partner.bonuses.priceless', 'Бесценно') : `$${tariff.price}`}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
        
        {/* Dot Indicator - Mobile only */}
        <div className="flex md:hidden justify-center gap-2 py-2">
          {TARIFFS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleTariffChange(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === selectedTariffIndex 
                  ? "w-6 bg-primary" 
                  : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
        
        {/* Selected Tariff Details */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTariff.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="px-4 touch-pan-y"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              const threshold = 50;
              if (info.offset.x < -threshold && selectedTariffIndex < TARIFFS.length - 1) {
                handleTariffChange(selectedTariffIndex + 1);
              } else if (info.offset.x > threshold && selectedTariffIndex > 0) {
                handleTariffChange(selectedTariffIndex - 1);
              }
            }}
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
                    <h2 className="text-2xl font-bold">{t(selectedTariff.nameKey)}</h2>
                  </div>
                  <p className="text-3xl font-bold">
                    {selectedTariff.price === -1 ? t('partner.bonuses.priceless', 'Бесценно') : `$${selectedTariff.price}`}
                  </p>
                </div>
                <span className="px-3 py-1.5 bg-muted rounded-full text-xs font-medium text-muted-foreground">
                  {isCurrentTariff 
                    ? t('partner.bonuses.currentTariff', 'Текущий тариф')
                    : selectedTariff.id === "partner"
                    ? t('partner.bonuses.contractSigning', 'Подписание контракта')
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
            <div className="grid grid-cols-5 gap-1 p-3 border-b border-border/50">
              {TARIFFS.map((tariff) => (
                <div key={tariff.id} className="text-center">
                  {tariff.id === "partner" ? (
                    <p 
                      className="font-bold text-xs"
                      style={{
                        background: "linear-gradient(90deg, #D4AF37, #F5E6A3, #C5A028, #F5E6A3, #D4AF37)",
                        backgroundSize: "200% 100%",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        animation: "goldShimmer 4s ease-in-out infinite"
                      }}
                    >
                      {t(tariff.nameKey)}
                    </p>
                  ) : (
                    <p className={`font-bold text-xs ${
                      tariff.id === "smart" ? "text-emerald-500" :
                      tariff.id === "agent" ? "text-amber-500" :
                      tariff.id === "pro" ? "text-primary" :
                      "text-violet-500"
                    }`}>{t(tariff.nameKey)}</p>
                  )}
                  <p className="text-xs text-muted-foreground font-medium">
                    {tariff.price === -1 ? t('partner.bonuses.priceless', 'Бесценно') : `$${tariff.price}`}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Virtual card row */}
            <div className="p-3 border-b border-border/30">
              <p className="text-xs text-muted-foreground text-center mb-2">
                {t('partner.bonuses.virtualCard', 'Выпуск виртуальной карты')}
              </p>
              <div className="grid grid-cols-5 gap-1">
                {TARIFFS.map((tariff) => (
                  <div key={tariff.id} className="flex justify-center">
                    {tariff.id === "partner" ? (
                      <span className="text-xs font-medium text-emerald-500 dark:text-[#BFFF00]">∞</span>
                    ) : (
                      <Check className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Metal card row */}
            <div className="p-3 border-b border-border/30">
              <p className="text-xs text-muted-foreground text-center mb-2">
                {t('partner.bonuses.metalCardLabel', 'Выпуск металлической карты')}
              </p>
              <div className="grid grid-cols-5 gap-1">
                <div className="text-center text-xs font-medium text-muted-foreground/50">—</div>
                <div className="text-center text-xs font-medium text-muted-foreground/50">—</div>
                <div className="flex justify-center"><Check className="w-4 h-4 text-muted-foreground" /></div>
                <div className="flex justify-center"><Check className="w-4 h-4 text-muted-foreground" /></div>
                <div className="flex justify-center"><span className="text-xs font-medium text-emerald-500 dark:text-[#BFFF00]">∞</span></div>
              </div>
            </div>
            
            {/* Card income row */}
            <div className="p-3 border-b border-border/30">
              <p className="text-xs text-muted-foreground text-center mb-2">
                {t('partner.bonuses.cardIncomeLabel', 'Доход с продаж карт')}
              </p>
              <div className="grid grid-cols-5 gap-1">
                <div className="text-center text-xs font-medium">15%</div>
                <div className="text-center text-xs font-medium">25%</div>
                <div className="text-center text-xs font-medium">30%</div>
                <div className="text-center text-xs font-medium">30%</div>
                <div className="text-center text-xs font-medium text-emerald-500 dark:text-[#BFFF00]">MAX</div>
              </div>
            </div>
            
            {/* Referral levels row */}
            <div className="p-3">
              <p className="text-xs text-muted-foreground text-center mb-2">
                {t('partner.bonuses.referralLevelsLabel', 'Уровней реферальной программы')}
              </p>
              <div className="grid grid-cols-5 gap-1">
                <div className="text-center text-xs font-medium">1</div>
                <div className="text-center text-xs font-medium">5</div>
                <div className="text-center text-xs font-medium">9</div>
                <div className="text-center text-xs font-medium">9</div>
                <div className="text-center text-xs font-medium text-emerald-500 dark:text-[#BFFF00]">∞</div>
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
              boxShadow: selectedTariff.id === "partner" 
                ? [
                    "0 0 10px rgba(251, 191, 36, 0.2), 0 0 20px rgba(245, 158, 11, 0.15)",
                    "0 0 15px rgba(234, 179, 8, 0.25), 0 0 30px rgba(251, 191, 36, 0.15)",
                    "0 0 10px rgba(251, 191, 36, 0.2), 0 0 20px rgba(245, 158, 11, 0.15)",
                  ]
                : [
                    "0 0 10px rgba(102, 126, 234, 0.2), 0 0 20px rgba(118, 75, 162, 0.15)",
                    "0 0 15px rgba(248, 87, 166, 0.2), 0 0 30px rgba(102, 126, 234, 0.15)",
                    "0 0 10px rgba(102, 126, 234, 0.2), 0 0 20px rgba(118, 75, 162, 0.15)",
                  ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Animated gradient border */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: selectedTariff.id === "partner"
                  ? "linear-gradient(90deg, #fbbf24, #f59e0b, #eab308, #fbbf24)"
                  : "linear-gradient(90deg, #667eea, #764ba2, #f857a6, #667eea)",
                backgroundSize: "300% 100%",
              }}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Glass inner button */}
            <Button 
              className="relative w-full h-14 text-base font-bold rounded-2xl m-[2px] bg-background/80 dark:bg-card/80 backdrop-blur-xl text-foreground hover:bg-background/90 dark:hover:bg-card/90 border-0 overflow-hidden"
              style={{ width: "calc(100% - 4px)" }}
            >
              {selectedTariff.id === "partner" ? (
                <span 
                  className="font-bold text-amber-900 dark:text-amber-100"
                  style={{
                    background: "linear-gradient(90deg, #D4AF37, #F5E6A3, #C5A028, #F5E6A3, #D4AF37)",
                    backgroundSize: "200% 100%",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    animation: "goldShimmer 4s ease-in-out infinite"
                  }}
                >
                  {t('partner.bonuses.contactUs', 'Связаться с нами')}
                </span>
              ) : (
                <span className="font-bold bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {`${t('partner.bonuses.purchase', 'Приобрести')} — $${selectedTariff.price}`}
                </span>
              )}
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PartnerBonuses;
