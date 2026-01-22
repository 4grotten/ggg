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

// Explosion confetti ribbon component - synced with card appearance
const ExplosionRibbon = ({ delay, angle, color, distance }: { delay: number; angle: number; color: string; distance: number }) => {
  const radian = (angle * Math.PI) / 180;
  const endX = Math.cos(radian) * distance;
  const endY = Math.sin(radian) * distance;
  
  return (
    <motion.div
      className="absolute left-1/2 top-48"
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
        delay: 0.4 + delay * 0.1, // Sync with card animation
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
          className="flex-1 overflow-y-auto px-6 py-8 pb-28 flex flex-col items-center text-center relative z-10"
        >
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold mb-3"
          >
            {t('verify.success.title')}
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mb-6"
          >
            {t('verify.success.description')}
          </motion.p>

          {/* Virtual Card Preview - Flying in animation */}
          <div className="w-full mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.3, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                delay: 0.4, 
                duration: 0.6, 
                type: "spring", 
                bounce: 0.4 
              }}
              className="relative w-full rounded-2xl overflow-hidden p-5 flex flex-col justify-between"
              style={{
                background: 'linear-gradient(135deg, #d4f94e 0%, #a8e030 50%, #8bc926 100%)',
                aspectRatio: '1.586 / 1',
              }}
            >
              {/* Glow effect */}
              <div 
                className="absolute inset-0 opacity-40"
                style={{
                  background: 'radial-gradient(ellipse at 20% 20%, rgba(255,255,255,0.4) 0%, transparent 50%)',
                }}
              />
              
              {/* Shine animation */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.3) 35%, rgba(255,255,255,0.5) 40%, rgba(255,255,255,0.3) 45%, transparent 60%)',
                }}
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ delay: 1, duration: 1.2, ease: "easeInOut" }}
              />
              
              {/* Top row */}
              <div className="relative flex items-center justify-between">
                <span className="text-xs font-semibold text-black/70 tracking-wide">VIRTUAL</span>
                <span className="px-2 py-0.5 rounded-full bg-black/10 text-black/70 text-[10px] font-medium">
                  {t('verify.success.instantIssue')}
                </span>
              </div>
              
              {/* Benefits in center */}
              <div className="relative space-y-0.5">
                <p className="text-[13px] text-black/60">• {t('verify.success.feature1')}</p>
                <p className="text-[13px] text-black/60">• {t('verify.success.feature2')}</p>
                <p className="text-[13px] text-black/60">• {t('verify.success.feature3')}</p>
              </div>
              
              {/* Bottom row */}
              <div className="relative flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-black/60">{t('verify.success.readyToUse')}</p>
                </div>
                <span className="text-xl font-bold text-[#1a1f71] italic">VISA</span>
              </div>
            </motion.div>
          </div>

          {/* Congratulations - Green color */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-2 mb-6"
          >
            <span className="text-2xl">🎉</span>
            <span className="text-lg font-bold text-success">
              {t('verify.success.congratulations')}
            </span>
            <span className="text-2xl">🎉</span>
          </motion.div>

          {/* Features with left-to-right animation */}
          <div className="space-y-2 w-full">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50"
            >
              <Check className="w-5 h-5 text-success" />
              <span className="text-sm">{t('verify.success.feature1')}</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4, duration: 0.4 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50"
            >
              <Check className="w-5 h-5 text-success" />
              <span className="text-sm">{t('verify.success.feature2')}</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.0, duration: 0.4 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50"
            >
              <Check className="w-5 h-5 text-success" />
              <span className="text-sm">{t('verify.success.feature3')}</span>
            </motion.div>
          </div>

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
