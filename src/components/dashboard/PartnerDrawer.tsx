import { useState } from "react";
import { Drawer, DrawerContent, DrawerFooter } from "@/components/ui/drawer";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Diamond, Users, Percent, ClipboardCheck, Send, Copy, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface PartnerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PartnerDrawer = ({ open, onOpenChange }: PartnerDrawerProps) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  const handleClose = () => {
    onOpenChange(false);
    // Reset step after close animation
    setTimeout(() => setStep(0), 300);
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleContinue = () => {
    if (step < 3) {
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
            custom={1}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center px-6"
          >
            {/* Easy Card illustration - same as splash screen */}
            <div className="relative w-72 h-48 flex items-center justify-center mb-6">
              {/* Animated Shadow */}
              <motion.div
                animate={{ 
                  opacity: [0.3, 0.6, 0.3],
                  scale: [0.95, 1.05, 0.95],
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="absolute inset-0 bg-primary/40 blur-[40px] rounded-3xl"
              />
              
              {/* Card Image */}
              <motion.img
                src="/og-image.png"
                alt="Easy Card"
                className="relative w-full h-auto rounded-2xl"
                animate={{ 
                  y: [0, -8, 0],
                  rotateY: [0, 3, 0],
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                style={{ 
                  filter: "drop-shadow(0 20px 40px rgba(59, 130, 246, 0.3))"
                }}
              />
              
              {/* Light Reflection */}
              <motion.div
                animate={{ 
                  x: ["-150%", "250%"],
                  opacity: [0, 0.5, 0]
                }}
                transition={{ 
                  duration: 2.5,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 rounded-2xl pointer-events-none"
              />
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">
              {t('partner.step1.title')} Easy Card
            </h2>
            <p className="text-xl font-semibold text-center mb-4">
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
            custom={1}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center px-6"
          >
            {/* Magnet + coins illustration */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-6">
              <div 
                className="w-24 h-32 rounded-t-full"
                style={{
                  background: "linear-gradient(180deg, #7FFF00 0%, #BFFF00 100%)",
                }}
              />
              {/* Coins */}
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #DFFF00 0%, #BFFF00 100%)",
                    border: "2px solid #7FFF00",
                    top: `${25 + i * 15}%`,
                    left: `${15 + (i % 2) * 50}%`,
                  }}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                >
                  <Diamond className="w-3 h-3 text-black" />
                </motion.div>
              ))}
              {/* Sparkles */}
              <span className="absolute top-4 left-4 text-xl">✦</span>
              <span className="absolute top-8 right-8 text-lg">✦</span>
              <span className="absolute bottom-12 left-12 text-sm">✦</span>
            </div>

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
            custom={1}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center px-6"
          >
            {/* Box illustration */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-6">
              <div 
                className="w-32 h-32 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #BFFF00 0%, #7FFF00 100%)",
                  boxShadow: "0 8px 32px rgba(127, 255, 0, 0.3)",
                }}
              >
                <Diamond className="w-12 h-12 text-black" />
              </div>
              {/* Ribbon */}
              <div 
                className="absolute -right-4 top-1/2 w-16 h-24 -translate-y-1/2"
                style={{
                  background: "linear-gradient(180deg, #7FFF00 0%, #00FF7F 100%)",
                  borderRadius: "0 12px 12px 0",
                }}
              />
              {/* Sparkles */}
              <span className="absolute -top-2 right-0 text-2xl text-[#BFFF00]">✦</span>
              <span className="absolute top-4 -right-2 text-lg text-[#BFFF00]">✦</span>
              <span className="absolute -bottom-4 -left-2 text-xl text-[#BFFF00]">✦</span>
              <span className="absolute bottom-0 left-4 text-sm text-[#BFFF00]">✦</span>
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">
              {t('partner.step3.title')} Easy Card
            </h2>
            <p className="text-xl font-semibold text-center mb-6">
              {t('partner.step3.subtitle')}
            </p>

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
                  SOON
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
            custom={1}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center px-6"
          >
            {/* Piggy bank illustration */}
            <div className="relative w-56 h-48 flex items-center justify-center mb-6">
              <div 
                className="w-40 h-32 rounded-[40px] relative"
                style={{
                  background: "linear-gradient(135deg, #BFFF00 0%, #7FFF00 100%)",
                }}
              >
                {/* Legs */}
                <div className="absolute -bottom-4 left-6 w-4 h-6 rounded-b-lg" style={{ background: "#7FFF00" }} />
                <div className="absolute -bottom-4 left-14 w-4 h-6 rounded-b-lg" style={{ background: "#7FFF00" }} />
                <div className="absolute -bottom-4 right-14 w-4 h-6 rounded-b-lg" style={{ background: "#7FFF00" }} />
                <div className="absolute -bottom-4 right-6 w-4 h-6 rounded-b-lg" style={{ background: "#7FFF00" }} />
                {/* Tail */}
                <div className="absolute top-1/2 -left-6 w-8 h-4 rounded-l-full border-4 border-[#7FFF00] border-r-0" />
                {/* Coin slot */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/20 rounded-full" />
              </div>
              {/* Coin */}
              <motion.div
                className="absolute -top-4 right-12 w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #DFFF00 0%, #BFFF00 100%)",
                  border: "2px solid #7FFF00",
                }}
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Diamond className="w-5 h-5 text-black" />
              </motion.div>
              {/* Sparkles */}
              <span className="absolute top-0 left-8 text-xl text-[#BFFF00]">✦</span>
              <span className="absolute top-4 right-4 text-lg text-[#BFFF00]">✦</span>
              <span className="absolute bottom-8 right-0 text-sm text-[#BFFF00]">✦</span>
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">
              {t('partner.step4.title')}
            </h2>
            <p className="text-muted-foreground text-center">
              {t('partner.step4.description')}
            </p>
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

  const renderFooterButtons = () => {
    if (step === 3) {
      return (
        <>
          {/* 3 fantastic icons in a row */}
          <div className="flex justify-center gap-5 mb-6">
            <motion.button
              onClick={handleShareTelegram}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #0088cc 0%, #00c6ff 100%)",
                boxShadow: "0 8px 24px rgba(0, 136, 204, 0.4)",
              }}
              aria-label={t('partner.shareInTelegram')}
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Send className="w-7 h-7 text-white relative z-10" />
            </motion.button>
            
            <motion.button
              onClick={handleCopyLink}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                boxShadow: "0 8px 24px rgba(124, 58, 237, 0.4)",
              }}
              aria-label={t('partner.copyInviteLink')}
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Copy className="w-7 h-7 text-white relative z-10" />
            </motion.button>
            
            <motion.button
              onClick={handleShare}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                boxShadow: "0 8px 24px rgba(16, 185, 129, 0.4)",
              }}
              aria-label={t('common.share')}
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Share2 className="w-7 h-7 text-white relative z-10" />
            </motion.button>
          </div>

          <motion.button
            onClick={handleClose}
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
        </>
      );
    }
    return (
      <motion.button
        onClick={handleContinue}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 bg-foreground text-background font-semibold rounded-2xl"
      >
        {t('common.continue')}
      </motion.button>
    );
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] flex flex-col">
        {/* Back button - fixed position */}
        {step > 0 && (
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-muted flex items-center justify-center z-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="relative pt-8 pb-4">
            <AnimatePresence mode="wait" custom={step}>
              {renderStepContent()}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Footer with buttons - pushed to bottom */}
        <DrawerFooter className="px-6 pb-6">
          {renderFooterButtons()}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
