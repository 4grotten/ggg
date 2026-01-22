import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useRef } from "react";
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

// Ribbon confetti particle component
const RibbonConfetti = ({ delay, x, color, rotation }: { delay: number; x: number; color: string; rotation: number }) => (
  <motion.div
    className="absolute"
    style={{ 
      left: `${x}%`, 
      top: -20,
    }}
    initial={{ y: -20, opacity: 1, rotate: rotation }}
    animate={{ 
      y: 500, 
      opacity: [1, 1, 0.8, 0],
      rotate: [rotation, rotation + 180, rotation + 360, rotation + 540],
      x: [0, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 120]
    }}
    transition={{ 
      duration: 4,
      delay: delay,
      ease: "easeOut",
      repeat: Infinity,
      repeatDelay: 1.5
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
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </svg>
  </motion.div>
);

const VerificationSuccess = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { clearProgress } = useVerificationProgress();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Clear verification progress and scroll to top
  useEffect(() => {
    clearProgress();
    
    // Scroll to top
    window.scrollTo(0, 0);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    
    // Play success sound after a short delay
    const timer = setTimeout(() => {
      playSuccessSound();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [clearProgress]);

  // Confetti colors
  const confettiColors = ['#34C759', '#FFD700', '#007AFF', '#FF3B30', '#AF52DE', '#FF9500'];
  
  // Generate ribbon confetti particles
  const confettiParticles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2.5,
    x: Math.random() * 100,
    color: confettiColors[i % confettiColors.length],
    rotation: Math.random() * 360
  }));

  return (
    <MobileLayout
      showBackButton
      onBack={() => navigate("/")}
      rightAction={<LanguageSwitcher />}
    >
      <div className="flex flex-col h-[calc(100vh-56px)] relative overflow-hidden">
        {/* Ribbon Confetti Effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confettiParticles.map((particle) => (
            <RibbonConfetti
              key={particle.id}
              delay={particle.delay}
              x={particle.x}
              color={particle.color}
              rotation={particle.rotation}
            />
          ))}
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-8 pb-28 flex flex-col items-center justify-center text-center relative z-10"
        >
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
