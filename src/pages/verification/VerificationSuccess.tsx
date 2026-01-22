import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { CreditCard, Wallet, ChevronRight, Landmark } from "lucide-react";
import { useVerificationProgress } from "@/hooks/useVerificationProgress";
import { motion } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { AnimatedDrawerItem } from "@/components/ui/animated-drawer-item";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Play success sound using Web Audio API
const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
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
    playNote(523.25, now, 0.3);
    playNote(659.25, now + 0.1, 0.3);
    playNote(783.99, now + 0.2, 0.4);
    playNote(1046.50, now + 0.3, 0.5);
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
        delay: 0.4 + delay * 0.1,
        ease: "easeOut",
      }}
    >
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
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const [isPayLaterAlertOpen, setIsPayLaterAlertOpen] = useState(false);

  useEffect(() => {
    clearProgress();
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    const timer = setTimeout(() => {
      playSuccessSound();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [clearProgress]);

  const confettiColors = ['#34C759', '#FFD700', '#007AFF', '#FF3B30', '#AF52DE', '#FF9500'];
  
  const confettiParticles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    delay: 0.5 + Math.random() * 0.3,
    angle: (i * 15) + Math.random() * 10,
    color: confettiColors[i % confettiColors.length],
    distance: 100 + Math.random() * 150
  }));

  const paymentOptions = [
    {
      id: "balance",
      icon: CreditCard,
      title: t('openCard.payFromBalance'),
      subtitle: t('openCard.payFromBalanceDescription'),
      iconBg: "bg-blue-100",
      iconColor: "text-blue-500",
    },
    {
      id: "crypto",
      icon: Wallet,
      title: t('openCard.payWithCrypto'),
      subtitle: t('openCard.payWithCryptoDescription'),
      iconBg: "bg-green-100",
      iconColor: "text-green-500",
    },
    {
      id: "bank",
      icon: Landmark,
      title: t('openCard.payWithBank'),
      subtitle: t('openCard.payWithBankDescription'),
      iconBg: "bg-orange-100",
      iconColor: "text-orange-500",
    },
  ];

  const handlePaymentSelect = (method: string) => {
    setIsPaymentDrawerOpen(false);
    if (method === "crypto") {
      navigate("/open-card/pay-crypto?type=virtual");
    } else if (method === "bank") {
      navigate("/open-card/pay-bank?type=virtual");
    } else {
      navigate("/open-card/pay-balance?type=virtual");
    }
  };

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

          {/* Virtual Card Preview */}
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
              <div 
                className="absolute inset-0 opacity-40"
                style={{
                  background: 'radial-gradient(ellipse at 20% 20%, rgba(255,255,255,0.4) 0%, transparent 50%)',
                }}
              />
              
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.3) 35%, rgba(255,255,255,0.5) 40%, rgba(255,255,255,0.3) 45%, transparent 60%)',
                }}
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ delay: 1, duration: 1.2, ease: "easeInOut" }}
              />
              
              <div className="relative flex items-center justify-between">
                <span className="text-xs font-semibold text-black/70 tracking-wide">VIRTUAL</span>
                <span className="px-2 py-0.5 rounded-full bg-black/10 text-black/70 text-[10px] font-medium">
                  {t('openCard.instant')}
                </span>
              </div>
              
              <div className="relative space-y-0.5 text-left">
                <p className="text-[13px] text-black/60">• {t('openCard.virtualBenefit1')}</p>
                <p className="text-[13px] text-black/60">• {t('openCard.virtualBenefit2')}</p>
                <p className="text-[13px] text-black/60">• {t('openCard.virtualBenefit3')}</p>
              </div>
              
              <div className="relative flex items-end justify-between">
                <div className="text-left">
                  <p className="text-2xl font-bold text-black/90">183 AED</p>
                  <p className="text-[10px] text-black/60">{t('openCard.annualFee')}</p>
                </div>
                <span className="text-xl font-bold text-[#1a1f71] italic">VISA</span>
              </div>
            </motion.div>
          </div>

          {/* Congratulations */}
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

          <PoweredByFooter />
        </div>

        {/* Button */}
        <div className="karta-footer-actions">
          <button 
            onClick={() => setIsPaymentDrawerOpen(true)} 
            className="karta-btn-primary flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            {t('verify.success.button')}
          </button>
        </div>
      </div>

      {/* Payment Method Drawer */}
      <Drawer open={isPaymentDrawerOpen} onOpenChange={setIsPaymentDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('openCard.selectPaymentMethod')}</DrawerTitle>
          </DrawerHeader>
          <div className="pb-6">
            {paymentOptions.map((option, index) => (
              <AnimatedDrawerItem key={option.id} index={index}>
                <button
                  onClick={() => handlePaymentSelect(option.id)}
                  className="w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/80 transition-colors border-b border-border/50"
                >
                  <div className={`w-12 h-12 rounded-xl ${option.iconBg} flex items-center justify-center`}>
                    <option.icon className={`w-6 h-6 ${option.iconColor}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-base font-medium text-foreground">{option.title}</p>
                    <p className="text-sm text-muted-foreground">{option.subtitle}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/60" />
                </button>
              </AnimatedDrawerItem>
            ))}
            
            {/* Pay Later option */}
            <AnimatedDrawerItem index={paymentOptions.length}>
              <button
                onClick={() => {
                  setIsPaymentDrawerOpen(false);
                  setTimeout(() => setIsPayLaterAlertOpen(true), 300);
                }}
                className="w-full py-4 text-center text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('verify.success.payLater')}
              </button>
            </AnimatedDrawerItem>
          </div>
        </DrawerContent>
      </Drawer>

      {/* iOS-style Pay Later Alert */}
      <AlertDialog open={isPayLaterAlertOpen} onOpenChange={setIsPayLaterAlertOpen}>
        <AlertDialogContent 
          className="w-[270px] sm:w-[320px] max-w-[90vw] rounded-[14px] p-0 gap-0 overflow-hidden border-none data-[state=open]:animate-ios-alert-in data-[state=closed]:animate-ios-alert-out"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          <AlertDialogHeader className="px-5 pt-5 pb-4">
            <AlertDialogTitle className="text-center text-[17px] font-semibold leading-tight" style={{ color: '#000000', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
              {t('verify.success.payLaterAlertTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription 
              className="text-center text-[13px] pt-2 whitespace-pre-line"
              style={{ 
                color: 'rgba(60, 60, 67, 0.8)', 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                lineHeight: 1.3
              }}
            >
              {t('verify.success.payLaterAlertMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-0 flex-col sm:flex-col mt-0">
            <div style={{ height: '1px', backgroundColor: '#C6C6C8' }} />
            <button
              onClick={() => {
                setIsPayLaterAlertOpen(false);
                setIsPaymentDrawerOpen(true);
              }}
              className="w-full h-[44px] text-[17px] font-semibold transition-colors active:bg-black/5"
              style={{ 
                color: '#007AFF',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
              }}
            >
              {t('verify.success.payLaterAlertPay')}
            </button>
            <div style={{ height: '1px', backgroundColor: '#C6C6C8' }} />
            <button
              onClick={() => {
                setIsPayLaterAlertOpen(false);
                navigate("/");
              }}
              className="w-full h-[44px] text-[17px] transition-colors active:bg-black/5"
              style={{ 
                color: '#007AFF',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
              }}
            >
              {t('verify.success.payLaterAlertHome')}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
};

export default VerificationSuccess;
