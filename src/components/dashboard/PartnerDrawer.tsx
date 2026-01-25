import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer, DrawerContent, DrawerFooter } from "@/components/ui/drawer";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Percent, ClipboardCheck, Send, Copy, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import partnerStep1Image from "@/assets/partner-step1-magnet.png";
import partnerStep2Image from "@/assets/partner-step2-gift.png";
import partnerStep3Image from "@/assets/partner-step3-camel.png";

interface PartnerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PartnerDrawer = ({ open, onOpenChange }: PartnerDrawerProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const handleClose = () => {
    onOpenChange(false);
    // Reset step after close animation
    setTimeout(() => {
      setStep(0);
      setDirection(1);
    }, 300);
  };

  const handleBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleContinue = () => {
    if (step < 3) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const appLink = "https://test.apofiz.com/EasyCard/";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appLink);
    toast.success(t('partner.linkCopied'));
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(t('partner.shareText'));
    const url = encodeURIComponent(appLink);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <motion.div
            key="step0"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center px-6"
          >
            {/* Network/Partnership illustration */}
            <div className="relative w-56 h-56 flex items-center justify-center mb-6">
              {/* Pulsing background glow */}
              <motion.div
                animate={{ 
                  opacity: [0.2, 0.5, 0.2],
                  scale: [0.9, 1.1, 0.9],
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="absolute inset-0 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(191, 255, 0, 0.4) 0%, transparent 70%)" }}
              />
              
              {/* Orbiting circles representing network */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                {[0, 72, 144, 216, 288].map((angle, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #BFFF00 0%, #7FFF00 100%)",
                      boxShadow: "0 4px 16px rgba(127, 255, 0, 0.4)",
                      left: `calc(50% + ${Math.cos(angle * Math.PI / 180) * 80}px - 20px)`,
                      top: `calc(50% + ${Math.sin(angle * Math.PI / 180) * 80}px - 20px)`,
                    }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
                  >
                    <Users className="w-5 h-5 text-black" />
                  </motion.div>
                ))}
              </motion.div>
              
              {/* Center card icon */}
              <motion.div
                animate={{ 
                  y: [0, -6, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  duration: 2.5, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(191, 255, 0, 0.2)",
                  border: "2px solid rgba(191, 255, 0, 0.5)"
                }}
              >
                <span className="text-2xl font-bold" style={{ color: "#BFFF00" }}>EC</span>
              </motion.div>
              
              {/* Connecting lines effect */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.3 }}>
                {[0, 72, 144, 216, 288].map((angle, i) => (
                  <motion.line
                    key={i}
                    x1="50%"
                    y1="50%"
                    x2={`${50 + Math.cos(angle * Math.PI / 180) * 35}%`}
                    y2={`${50 + Math.sin(angle * Math.PI / 180) * 35}%`}
                    stroke="#BFFF00"
                    strokeWidth="1"
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">
              {t('partner.step1.title')} Easy Card
            </h2>
            <p className="text-lg text-center mb-3 text-foreground">
              {t('partner.step1.subtitle')}
            </p>
            <p className="text-muted-foreground text-center">
              {t('partner.step1.description')}
            </p>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            key="step1"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center px-6"
          >
            {/* Coins illustration */}
            <motion.div 
              className="relative w-48 h-48 flex items-center justify-center mb-6"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <img 
                src={partnerStep1Image} 
                alt="Earn rewards" 
                className="w-full h-full object-contain rounded-2xl"
                style={{ filter: "drop-shadow(0 8px 24px rgba(127, 255, 0, 0.3))" }}
              />
            </motion.div>

            <h2 className="text-2xl font-bold text-center mb-2">
              {t('partner.step2.title')} Easy Card
            </h2>
            <p className="text-xl font-semibold text-center mb-4">
              {t('partner.step2.subtitle')}
            </p>
            <p className="text-muted-foreground text-center mb-2">
              {t('partner.step2.description1')}
            </p>
            <p className="text-muted-foreground text-center">
              {t('partner.step2.description2')}
            </p>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center px-6"
          >
            {/* Gift box illustration */}
            <motion.div 
              className="relative w-48 h-48 flex items-center justify-center mb-6"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <img 
                src={partnerStep2Image} 
                alt="Rewards" 
                className="w-full h-full object-contain rounded-2xl"
                style={{ filter: "drop-shadow(0 8px 24px rgba(127, 255, 0, 0.3))" }}
              />
            </motion.div>

            <h2 className="text-2xl font-bold text-center mb-6">
              {t('partner.step3.title')} Easy Card
            </h2>

            {/* 3 earning methods */}
            <div className="flex justify-center gap-6">
              <div className="flex flex-col items-center">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-2"
                  style={{ background: "#BFFF00" }}
                >
                  <Users className="w-6 h-6 text-black" />
                </div>
                <p className="text-sm font-medium text-center">{t('partner.inviteFriends')}</p>
              </div>
              <div className="flex flex-col items-center">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-2"
                  style={{ background: "#BFFF00" }}
                >
                  <Percent className="w-6 h-6 text-black" />
                </div>
                <p className="text-sm font-medium text-center">{t('partner.friendsSpending')}</p>
              </div>
              <div className="flex flex-col items-center relative">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-2 opacity-60"
                  style={{ background: "#BFFF00" }}
                >
                  <ClipboardCheck className="w-6 h-6 text-black" />
                </div>
                <span className="absolute -top-1 -right-2 text-[10px] font-bold bg-foreground text-background px-1.5 py-0.5 rounded-full">
                  {t('partner.soon')}
                </span>
                <p className="text-sm font-medium text-center opacity-60">{t('partner.completeTasks')}</p>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center px-6"
          >
            {/* Piggy bank illustration */}
            <motion.div 
              className="relative w-48 h-48 flex items-center justify-center mb-6"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <img 
                src={partnerStep3Image} 
                alt="Save rewards" 
                className="w-full h-full object-contain rounded-2xl"
                style={{ filter: "drop-shadow(0 8px 24px rgba(127, 255, 0, 0.3))" }}
              />
            </motion.div>

            <h2 className="text-2xl font-bold text-center mb-2">
              {t('partner.step4.title')}
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              {t('partner.step4.description')}
            </p>

            {/* 3 fantastic share icons in content area */}
            <div className="flex justify-center gap-4">
              <motion.button
                onClick={handleShareTelegram}
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                animate={{ 
                  boxShadow: [
                    "0 4px 20px rgba(0, 136, 204, 0.4)",
                    "0 8px 30px rgba(0, 136, 204, 0.6)",
                    "0 4px 20px rgba(0, 136, 204, 0.4)"
                  ]
                }}
                transition={{ 
                  boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="relative w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #0088cc 0%, #00c6ff 50%, #0088cc 100%)",
                  backgroundSize: "200% 200%",
                }}
                aria-label={t('partner.shareInTelegram')}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
                <Send className="w-5 h-5 text-white relative z-10 drop-shadow-lg" />
              </motion.button>
              
              <motion.button
                onClick={handleCopyLink}
                whileHover={{ scale: 1.15, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
                animate={{ 
                  boxShadow: [
                    "0 4px 20px rgba(124, 58, 237, 0.4)",
                    "0 8px 30px rgba(168, 85, 247, 0.6)",
                    "0 4px 20px rgba(124, 58, 237, 0.4)"
                  ]
                }}
                transition={{ 
                  boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }
                }}
                className="relative w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)",
                  backgroundSize: "200% 200%",
                }}
                aria-label={t('partner.copyInviteLink')}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.3 }}
                />
                <Copy className="w-5 h-5 text-white relative z-10 drop-shadow-lg" />
              </motion.button>
              
              <motion.button
                onClick={handleShare}
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                animate={{ 
                  boxShadow: [
                    "0 4px 20px rgba(16, 185, 129, 0.4)",
                    "0 8px 30px rgba(52, 211, 153, 0.6)",
                    "0 4px 20px rgba(16, 185, 129, 0.4)"
                  ]
                }}
                transition={{ 
                  boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }
                }}
                className="relative w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)",
                  backgroundSize: "200% 200%",
                }}
                aria-label={t('common.share')}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.6 }}
                />
                <Share2 className="w-5 h-5 text-white relative z-10 drop-shadow-lg" />
              </motion.button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Easy Card',
          text: t('partner.shareText'),
          url: appLink,
        });
      } catch (error) {
        // User cancelled or error
      }
    }
  };

  const handleGoToPartnerPage = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(0);
      setDirection(1);
      navigate("/partner");
    }, 300);
  };

  const renderFooterButtons = () => {
    const isLastStep = step === 3;
    
    return (
      <motion.button
        onClick={isLastStep ? handleGoToPartnerPage : handleContinue}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 font-semibold rounded-2xl relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #BFFF00 0%, #7FFF00 100%)",
          boxShadow: "0 8px 24px rgba(127, 255, 0, 0.3)",
        }}
      >
        <span className="text-black font-bold">{t('common.continue')}</span>
      </motion.button>
    );
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal>
      <DrawerContent className="max-h-[90vh] flex flex-col" onPointerDownOutside={(e) => e.preventDefault()}>
        {/* Back button - fixed position */}
        {step > 0 && (
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-muted flex items-center justify-center z-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        
        {/* Scrollable content with fixed height to prevent drawer jumping */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="relative pt-8 pb-4 h-[420px] flex flex-col">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              {renderStepContent()}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Floating button - no background */}
        <div className="px-6 pb-6 pt-2 bg-transparent">
          {renderFooterButtons()}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
