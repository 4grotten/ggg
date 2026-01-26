import { memo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import partnerGrowthImage from "@/assets/partner-network-hero.png";

// Memoized glow layer to prevent re-renders
const GlowLayer = memo(({ 
  inset, 
  blur, 
  gradient, 
  duration, 
  delay = 0,
  darkOnly = false 
}: { 
  inset: string;
  blur: number;
  gradient: string;
  duration: number;
  delay?: number;
  darkOnly?: boolean;
}) => (
  <motion.div 
    className={`absolute ${inset} rounded-3xl z-0 ${darkOnly ? 'hidden dark:block' : 'dark:hidden'}`}
    style={{ 
      background: gradient,
      filter: `blur(${blur}px)`,
      willChange: "opacity, transform"
    }}
    animate={{
      opacity: [0.4, 1, 0.4],
      scale: [0.97, 1.05, 0.97]
    }}
    transition={{
      duration,
      repeat: Infinity,
      ease: "easeInOut",
      delay
    }}
  />
));

GlowLayer.displayName = "GlowLayer";

export const HeroBanner = memo(() => {
  const { t } = useTranslation();

  return (
    <div className="relative w-full rounded-2xl overflow-visible mb-4">
      {/* Light theme glow layers - more saturated for visibility */}
      <GlowLayer
        inset="-inset-8"
        blur={30}
        gradient="radial-gradient(ellipse at center, rgba(16, 185, 129, 0.85) 0%, rgba(34, 197, 94, 0.5) 40%, rgba(16, 185, 129, 0.15) 70%, transparent 90%)"
        duration={3}
      />
      <GlowLayer
        inset="-inset-4"
        blur={16}
        gradient="radial-gradient(ellipse at center, rgba(34, 197, 94, 0.9) 0%, rgba(16, 185, 129, 0.6) 35%, transparent 70%)"
        duration={2}
        delay={0.4}
      />
      
      {/* Dark theme glow layers */}
      <GlowLayer
        inset="-inset-6"
        blur={24}
        gradient="radial-gradient(ellipse at center, rgba(191, 255, 0, 0.6) 0%, rgba(127, 255, 0, 0.25) 50%, transparent 75%)"
        duration={3}
        darkOnly
      />
      <GlowLayer
        inset="-inset-3"
        blur={12}
        gradient="radial-gradient(ellipse at center, rgba(191, 255, 0, 0.8) 0%, rgba(127, 255, 0, 0.4) 40%, transparent 65%)"
        duration={2}
        delay={0.4}
        darkOnly
      />
      
      {/* Image */}
      <img 
        src={partnerGrowthImage} 
        alt={t('partner.inviteFriendsTitle', 'Приглашайте друзей')}
        className="relative z-10 w-full h-auto rounded-2xl"
        loading="eager"
      />
    </div>
  );
});

HeroBanner.displayName = "HeroBanner";
