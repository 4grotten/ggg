import { useCallback, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

// Partner levels configuration
export const LEVELS = [
  { id: "R1", nameKey: "partner.levels.r1", minFriends: 0, maxFriends: 10, cardPercent: 15, txPercent: 0.05, icon: "🌱" },
  { id: "R2", nameKey: "partner.levels.r2", minFriends: 10, maxFriends: 30, cardPercent: 20, txPercent: 0.1, icon: "🌿" },
  { id: "R3", nameKey: "partner.levels.r3", minFriends: 30, maxFriends: 50, cardPercent: 25, txPercent: 0.2, icon: "💎" },
  { id: "R4", nameKey: "partner.levels.r4", minFriends: 50, maxFriends: 100, cardPercent: 30, txPercent: 0.3, icon: "👑" },
  { id: "Partner", nameKey: "partner.levels.partner", minFriends: 100, maxFriends: Infinity, cardPercent: 35, txPercent: 0.5, icon: "🚀" },
];

interface LevelCarouselProps {
  currentFriends: number;
  onLevelChange?: (levelIndex: number) => void;
}

export const LevelCarousel = ({ currentFriends, onLevelChange }: LevelCarouselProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
  
  // Scroll to current level on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.offsetWidth;
      // Use setTimeout to ensure the container is fully rendered
      setTimeout(() => {
        container.scrollTo({
          left: cardWidth * currentLevelIndex,
          behavior: "auto"
        });
        setSelectedLevelIndex(currentLevelIndex);
      }, 100);
    }
  }, [currentLevelIndex]);
  
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
    setSelectedLevelIndex(index);
    onLevelChange?.(index);
  }, [onLevelChange]);

  const handlePrev = useCallback(() => {
    if (selectedLevelIndex > 0) {
      scrollToIndex(selectedLevelIndex - 1);
    }
  }, [selectedLevelIndex, scrollToIndex]);

  const handleNext = useCallback(() => {
    if (selectedLevelIndex < LEVELS.length - 1) {
      scrollToIndex(selectedLevelIndex + 1);
    }
  }, [selectedLevelIndex, scrollToIndex]);

  return (
    <div className="px-4 relative">
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
                
                {/* Subscribe button (right side) for levels above current */}
                {idx > currentLevelIndex && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="absolute -top-3 right-12 z-20"
                  >
                    <button
                      onClick={() => navigate('/partner/bonuses')}
                      className="relative px-4 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5 overflow-hidden active:scale-95 transition-transform will-change-transform"
                      style={{
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f857a6 100%)",
                      }}
                    >
                      {/* Rotating glow border */}
                      <div 
                        className="absolute -inset-[2px] rounded-full opacity-70 animate-[spin_4s_linear_infinite]"
                        style={{
                          background: "conic-gradient(from 0deg, #667eea, #764ba2, #f857a6, #667eea)",
                          filter: "blur(4px)",
                        }}
                      />
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer rounded-full" />
                      {/* Button background */}
                      <div 
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f857a6 100%)",
                        }}
                      />
                      <CreditCard className="w-3.5 h-3.5 relative z-10" />
                      <span className="relative z-10">{t('partner.subscribe', 'Подписаться')}</span>
                    </button>
                  </motion.div>
                )}
                
                {/* Tariff availability badge for R4 and Partner levels */}
                {(level.id === "R4" || level.id === "Partner") && idx > currentLevelIndex && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="absolute -top-3 left-4 z-20"
                  >
                    <span 
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        level.id === "Partner" 
                          ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white" 
                          : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                      }`}
                      style={{
                        boxShadow: level.id === "Partner" 
                          ? "0 2px 10px rgba(245, 158, 11, 0.4)" 
                          : "0 2px 10px rgba(59, 130, 246, 0.4)"
                      }}
                    >
                      {level.id === "R4" 
                        ? t('partner.availableWithPro', 'Доступен с PRO')
                        : t('partner.availableWithPartner', 'Доступен с Партнёр')
                      }
                    </span>
                  </motion.div>
                )}
                
                <div className="relative rounded-3xl p-[1px]">
                  {/* Static gradient border for current level */}
                  {idx === currentLevelIndex && (
                    <div 
                      className="absolute inset-0 rounded-3xl"
                      style={{
                        background: "linear-gradient(135deg, #BFFF00 0%, #7FFF00 50%, #00FF88 100%)",
                      }}
                    />
                  )}
                  {/* Animated gradient border for R2 level */}
                  {level.id === "R2" && idx !== currentLevelIndex && (
                    <div 
                      className="absolute inset-0 rounded-3xl animate-spin-slow"
                      style={{
                        background: "conic-gradient(from 0deg, #BFFF00, #7FFF00, #00FF88, #7FFF00, #BFFF00)",
                      }}
                    />
                  )}
                  <div
                    className={`relative bg-muted/70 dark:bg-card/70 backdrop-blur-xl rounded-3xl p-5 overflow-hidden ${
                      idx !== currentLevelIndex && level.id !== "R2" ? "border border-border/50" : ""
                    }`}
                  >
                    
                    {/* Level header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{level.icon}</span>
                        <span className="text-xl font-bold">{t(level.nameKey, level.id)}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {t('partner.friends', 'Друзей')} <span className="text-foreground font-bold">{currentFriends}</span>
                        /{level.maxFriends === Infinity ? 1000 : level.maxFriends}
                      </span>
                    </div>
                    
                    {/* Benefits */}
                    <div className="grid grid-cols-2 gap-3 relative z-10">
                      <div className="bg-zinc-200 dark:bg-zinc-800 rounded-2xl p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">
                          {t('partner.cardIssuance', 'За выпуск карт')}
                        </p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-[#BFFF00]">
                          {level.cardPercent}%
                        </p>
                      </div>
                      <div className="bg-zinc-200 dark:bg-zinc-800 rounded-2xl p-4 text-center">
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
      
      {/* Carousel dots with arrows */}
      <div className="flex justify-center items-center gap-3 mt-3">
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          disabled={selectedLevelIndex === 0}
          className={`hidden md:flex w-8 h-8 rounded-full bg-muted/80 dark:bg-card/80 backdrop-blur-sm border border-border/50 items-center justify-center transition-all ${
            selectedLevelIndex === 0 
              ? "opacity-30 cursor-not-allowed" 
              : "hover:bg-muted dark:hover:bg-card hover:scale-110 active:scale-95"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        {/* Dots */}
        <div className="flex gap-1.5">
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
        
        {/* Right Arrow */}
        <button
          onClick={handleNext}
          disabled={selectedLevelIndex === LEVELS.length - 1}
          className={`hidden md:flex w-8 h-8 rounded-full bg-muted/80 dark:bg-card/80 backdrop-blur-sm border border-border/50 items-center justify-center transition-all ${
            selectedLevelIndex === LEVELS.length - 1 
              ? "opacity-30 cursor-not-allowed" 
              : "hover:bg-muted dark:hover:bg-card hover:scale-110 active:scale-95"
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
