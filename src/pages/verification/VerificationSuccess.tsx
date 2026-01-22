import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { Check, CreditCard } from "lucide-react";
import { useVerificationProgress } from "@/hooks/useVerificationProgress";
import { motion } from "framer-motion";

// Confetti particle component
const ConfettiParticle = ({ delay, x, color }: { delay: number; x: number; color: string }) => (
  <motion.div
    className="absolute w-3 h-3 rounded-sm"
    style={{ 
      left: `${x}%`, 
      top: 0,
      backgroundColor: color,
    }}
    initial={{ y: -20, opacity: 1, rotate: 0, scale: 1 }}
    animate={{ 
      y: 400, 
      opacity: [1, 1, 0],
      rotate: [0, 180, 360],
      scale: [1, 0.8, 0.5],
      x: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 150]
    }}
    transition={{ 
      duration: 3,
      delay: delay,
      ease: "easeOut",
      repeat: Infinity,
      repeatDelay: 2
    }}
  />
);

const VerificationSuccess = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { clearProgress } = useVerificationProgress();

  // Clear verification progress when verification is complete
  useEffect(() => {
    clearProgress();
  }, [clearProgress]);

  // Confetti colors
  const confettiColors = ['#34C759', '#FFD700', '#007AFF', '#FF3B30', '#AF52DE', '#FF9500'];
  
  // Generate confetti particles
  const confettiParticles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2,
    x: Math.random() * 100,
    color: confettiColors[i % confettiColors.length]
  }));

  return (
    <MobileLayout
      showBackButton
      onBack={() => navigate("/")}
      rightAction={<LanguageSwitcher />}
    >
      <div className="flex flex-col h-[calc(100vh-56px)] relative overflow-hidden">
        {/* Confetti Effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confettiParticles.map((particle) => (
            <ConfettiParticle
              key={particle.id}
              delay={particle.delay}
              x={particle.x}
              color={particle.color}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8 pb-28 flex flex-col items-center justify-center text-center relative z-10">
          {/* Animated Check Icon with Circle Border */}
          <div className="relative mb-6">
            {/* Animated circle border */}
            <svg className="w-24 h-24" viewBox="0 0 100 100">
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="hsl(var(--success))"
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            
            {/* Checkmark */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring", duration: 0.5, bounce: 0.5 }}
            >
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ delay: 1, duration: 0.3 }}
              >
                <Check className="w-12 h-12 text-success" strokeWidth={3} />
              </motion.div>
            </motion.div>
          </div>

          {/* Congratulations - Green color */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-2 mb-4"
          >
            <span className="text-2xl">🎉</span>
            <span className="text-lg font-bold text-success">
              {t('verify.success.congratulations')}
            </span>
            <span className="text-2xl">🎉</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-2xl font-bold mb-3"
          >
            {t('verify.success.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-muted-foreground mb-8"
          >
            {t('verify.success.description')}
          </motion.p>

          {/* Card Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
            className="w-full max-w-[280px] aspect-[1.6/1] rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] p-5 text-white text-left shadow-xl mb-6"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="w-10 h-7 bg-white/20 rounded" />
              <span className="text-sm font-semibold">VISA</span>
            </div>
            <div className="text-sm tracking-widest mb-2">•••• •••• •••• ••••</div>
            <div className="text-xs text-white/70">Easy Card</div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="space-y-2 w-full"
          >
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
              <Check className="w-5 h-5 text-success" />
              <span className="text-sm">{t('verify.success.feature1')}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
              <Check className="w-5 h-5 text-success" />
              <span className="text-sm">{t('verify.success.feature2')}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
              <Check className="w-5 h-5 text-success" />
              <span className="text-sm">{t('verify.success.feature3')}</span>
            </div>
          </motion.div>

          <PoweredByFooter />
        </div>

        {/* Button */}
        <div className="karta-footer-actions">
          <button 
            onClick={() => navigate("/open-card")} 
            className="karta-btn-primary flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            {t('verify.success.button')}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default VerificationSuccess;
