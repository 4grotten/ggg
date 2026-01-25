import { useCallback, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

// Partner levels configuration
export const LEVELS = [
  { id: "R1", name: "R1", minFriends: 0, maxFriends: 10, cardPercent: 15, txPercent: 0.05, icon: "🌱" },
  { id: "R2", name: "R2", minFriends: 10, maxFriends: 30, cardPercent: 20, txPercent: 0.1, icon: "🌿" },
  { id: "R3", name: "R3", minFriends: 30, maxFriends: 50, cardPercent: 25, txPercent: 0.2, icon: "💎" },
  { id: "R4", name: "R4", minFriends: 50, maxFriends: 100, cardPercent: 30, txPercent: 0.3, icon: "👑" },
  { id: "Partner", name: "Партнёр", minFriends: 100, maxFriends: Infinity, cardPercent: 35, txPercent: 0.5, icon: "🚀" },
];

interface LevelCarouselProps {
  currentFriends: number;
  onLevelChange?: (levelIndex: number) => void;
}

export const LevelCarousel = ({ currentFriends, onLevelChange }: LevelCarouselProps) => {
  const { t } = useTranslation();
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Calculate current level
  const getCurrentLevelIndex = () => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (currentFriends >= LEVELS[i].minFriends) {
        return i;
      }
    }
    return 0;
  };
  
  const currentLevelIndex = getCurrentLevelIndex();
  
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.offsetWidth;
    const newIndex = Math.round(scrollLeft / cardWidth);
    if (newIndex !== selectedLevelIndex) {
      setSelectedLevelIndex(newIndex);
      onLevelChange?.(newIndex);
    }
  }, [selectedLevelIndex, onLevelChange]);
  
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToIndex = useCallback((index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cardWidth = container.offsetWidth;
    container.scrollTo({
      left: cardWidth * index,
      behavior: "smooth"
    });
  }, []);

  return (
    <div className="px-4 mb-6 pt-4">
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-visible scrollbar-hide snap-x snap-mandatory"
        style={{ 
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div className="flex gap-4 pb-2">
          {LEVELS.map((level, idx) => (
            <div 
              key={level.id}
              className="flex-shrink-0 w-full pt-4 snap-center"
            >
              <div className="relative overflow-visible">
                {/* Badge - Current level (centered) */}
                {idx === currentLevelIndex && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-3 left-1/2 -translate-x-1/2 z-20"
                  >
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-bold text-white dark:text-black flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-green-500 dark:from-[#BFFF00] dark:to-[#7FFF00]"
                    >
                      <Sparkles className="w-3 h-3" />
                      {t('partner.currentLevel', 'Текущий уровень')}
                    </span>
                  </motion.div>
                )}
                
                {/* Passed badge for levels below current */}
                {idx < currentLevelIndex && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -top-3 right-12 z-20"
                  >
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 flex items-center gap-1.5">
                      ✓ {t('partner.levelPassed', 'Пройдено')}
                    </span>
                  </motion.div>
                )}
                
                {/* Buy button (right side) for levels above current */}
                {idx > currentLevelIndex && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -top-3 right-12 z-20"
                  >
                    <button
                      onClick={() => toast.info(t('partner.buyLevelSoon', 'Скоро будет доступно'))}
                      className="relative px-4 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5 overflow-hidden active:scale-95 transition-transform"
                      style={{
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f857a6 100%)",
                        boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                      <CreditCard className="w-3.5 h-3.5 relative z-10" />
                      <span className="relative z-10">{t('partner.buyLevel', 'Купить')}</span>
                    </button>
                  </motion.div>
                )}
                
                <div className="relative rounded-3xl p-[1px]">
                  {/* Rotating gradient border for current level */}
                  {idx === currentLevelIndex && (
                    <div className="absolute inset-0 rounded-3xl overflow-hidden">
                      <motion.div
                        className="absolute inset-[-100%] w-[300%] h-[300%]"
                        style={{
                          background: "conic-gradient(from 0deg at 50% 50%, transparent 0deg, #BFFF00 60deg, #7FFF00 120deg, #00FF88 180deg, #7FFF00 240deg, #BFFF00 300deg, transparent 360deg)",
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  )}
                  <div
                    className={`relative bg-muted/70 dark:bg-card/70 backdrop-blur-xl rounded-3xl p-5 overflow-hidden ${
                      idx !== currentLevelIndex ? "border border-border/50" : ""
                    }`}
                  >
                    {/* Decorative gradient */}
                    <div 
                      className="absolute top-0 right-0 w-32 h-32 opacity-20"
                      style={{
                        background: "radial-gradient(circle at top right, rgba(191, 255, 0, 0.5) 0%, transparent 70%)"
                      }}
                    />
                    
                    {/* Level header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{level.icon}</span>
                        <span className="text-xl font-bold">{level.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        <span className="text-foreground font-bold">{currentFriends}</span>
                        /{level.maxFriends === Infinity ? 1000 : level.maxFriends}
                      </span>
                    </div>
                    
                    {/* Benefits */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/90 backdrop-blur-md rounded-2xl p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">
                          {t('partner.cardIssuance', 'За выпуск карт')}
                        </p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-[#BFFF00]">
                          {level.cardPercent}%
                        </p>
                      </div>
                      <div className="bg-muted/90 backdrop-blur-md rounded-2xl p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">
                          {t('partner.fromTransactions', 'С транзакций')}
                        </p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-[#BFFF00]">
                          {level.txPercent}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Carousel dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {LEVELS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => scrollToIndex(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === selectedLevelIndex 
                ? "w-6 bg-emerald-500 dark:bg-[#BFFF00]" 
                : "w-2 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
