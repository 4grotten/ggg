import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { Check, CreditCard } from "lucide-react";
import { useVerificationProgress } from "@/hooks/useVerificationProgress";
import { motion } from "framer-motion";

// Play success sound using Web Audio API
const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a pleasant success chime with multiple notes
    const playNote = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    // Play a pleasant ascending chord (C-E-G-C)
    playNote(523.25, now, 0.3);        // C5
    playNote(659.25, now + 0.1, 0.3);  // E5
    playNote(783.99, now + 0.2, 0.4);  // G5
    playNote(1046.50, now + 0.3, 0.5); // C6
  } catch (e) {
    console.log('Audio not available');
  }
};

// Explosion confetti ribbon component
const ExplosionRibbon = ({ delay, angle, color, distance }: { delay: number; angle: number; color: string; distance: number }) => {
  const radian = (angle * Math.PI) / 180;
  const endX = Math.cos(radian) * distance;
  const endY = Math.sin(radian) * distance;
  
  return (
    <motion.div
      className="absolute left-1/2 top-32"
      style={{ marginLeft: -10 }}
      initial={{ x: 0, y: 0, opacity: 0, scale: 0, rotate: angle }}
      animate={{ 
        x: endX,
        y: endY,
        opacity: [0, 1, 1, 0],
        scale: [0, 1.2, 1, 0.5],
        rotate: [angle, angle + 180, angle + 360]
      }}
      transition={{ 
        duration: 2,
        delay: delay,
        ease: "easeOut",
      }}
    >
      {/* Ribbon shape */}
      <svg width="20" height="40" viewBox="0 0 20 40">
        <motion.path
          d="M10 0 Q15 10 10 20 Q5 30 10 40"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          animate={{
            d: [
              "M10 0 Q15 10 10 20 Q5 30 10 40",
              "M10 0 Q5 10 10 20 Q15 30 10 40",
              "M10 0 Q15 10 10 20 Q5 30 10 40"
            ]
          }}
          transition={{
            duration: 0.4,
            repeat: 3,
            ease: "easeInOut"
          }}
        />
      </svg>
    </motion.div>
  );
};

const VerificationSuccess = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { clearProgress } = useVerificationProgress();

  // Clear verification progress and scroll to top
  useEffect(() => {
    clearProgress();
    
    // Force scroll to top immediately
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Play success sound after a short delay
    const timer = setTimeout(() => {
      playSuccessSound();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [clearProgress]);

  // Confetti colors
  const confettiColors = ['#34C759', '#FFD700', '#007AFF', '#FF3B30', '#AF52DE', '#FF9500'];
  
  // Generate explosion confetti particles in all directions
  const confettiParticles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    delay: 0.5 + Math.random() * 0.3,
    angle: (i * 15) + Math.random() * 10, // Spread in all directions
    color: confettiColors[i % confettiColors.length],
    distance: 100 + Math.random() * 150
  }));

  return (
    <MobileLayout
      showBackButton
      onBack={() => navigate("/")}
      rightAction={<LanguageSwitcher />}
    >
      <div className="flex flex-col h-[calc(100vh-56px)] relative overflow-hidden">
        {/* Explosion Confetti Effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confettiParticles.map((particle) => (
            <ExplosionRibbon
              key={particle.id}
              delay={particle.delay}
              angle={particle.angle}
              color={particle.color}
              distance={particle.distance}
            />
          ))}
        </div>

        <div 
          className="flex-1 overflow-y-auto px-6 py-8 pb-28 flex flex-col items-center justify-center text-center relative z-10"
        >
          {/* Congratulations - Green color */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
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
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold mb-3"
          >
            {t('verify.success.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-muted-foreground mb-6"
          >
            {t('verify.success.description')}
          </motion.p>

          {/* Card Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
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
