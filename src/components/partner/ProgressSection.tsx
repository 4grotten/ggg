import { memo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LEVELS } from "./LevelCarousel";

interface ProgressSectionProps {
  selectedLevelIndex: number;
}

export const ProgressSection = memo(({ selectedLevelIndex }: ProgressSectionProps) => {
  const { t } = useTranslation();
  const progressPercent = (selectedLevelIndex / (LEVELS.length - 1)) * 100;

  return (
    <>
      {/* Progress milestones */}
      <div className="flex justify-between text-sm text-muted-foreground mb-2 px-2">
        <span>10 {t('partner.friends', 'друзей')}</span>
        <span>50 {t('partner.friends', 'друзей')}</span>
        <span>100 {t('partner.friends', 'друзей')}</span>
      </div>
      
      {/* Progress bar */}
      <div className="relative h-2 bg-muted rounded-full mb-2 overflow-hidden">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full will-change-transform"
          style={{
            background: "linear-gradient(90deg, #BFFF00 0%, #7FFF00 100%)",
            boxShadow: "0 0 10px rgba(191, 255, 0, 0.5)"
          }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
        
        {/* Progress indicator dot */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-background will-change-transform"
          style={{
            background: "linear-gradient(135deg, #BFFF00 0%, #7FFF00 100%)",
            boxShadow: "0 0 12px rgba(191, 255, 0, 0.8)",
          }}
          animate={{ 
            left: `calc(${progressPercent}% - 8px)`
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
      
      {/* Level labels */}
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        {LEVELS.map((level, idx) => (
          <span 
            key={level.id}
            className={`transition-all duration-200 ${
              idx <= selectedLevelIndex 
                ? "text-foreground" 
                : "text-muted-foreground"
            } ${idx === selectedLevelIndex ? "font-semibold" : "font-normal"}`}
          >
            {t(level.nameKey, level.id)}
          </span>
        ))}
      </div>
    </>
  );
});

ProgressSection.displayName = "ProgressSection";
