import { useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Diamond, Users, Percent, ClipboardCheck, Send, Copy, X } from "lucide-react";
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://karta.app/invite/YOUR_CODE");
    toast.success(t('partner.linkCopied'));
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(t('partner.shareText'));
    const url = encodeURIComponent("https://karta.app/invite/YOUR_CODE");
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

  const renderStep = () => {
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
            className="flex flex-col items-center px-6 pb-8"
          >
            {/* Diamond + Card illustration */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-6">
              {/* Diamond background */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="w-48 h-48"
                  style={{
                    background: "linear-gradient(135deg, #BFFF00 0%, #7FFF00 50%, #00FF7F 100%)",
                    clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
                    opacity: 0.9,
                  }}
                />
              </div>
              {/* Card in center */}
              <div 
                className="relative w-36 h-24 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #DFFF00 0%, #BFFF00 100%)",
                  boxShadow: "0 8px 32px rgba(191, 255, 0, 0.3)",
                }}
              >
                <Diamond className="w-8 h-8 text-black" />
                <span className="absolute bottom-2 left-3 text-xs font-mono text-black/70">•••• 5273</span>
                <span className="absolute bottom-2 right-3 text-xs font-bold text-black/80">VISA</span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">
              {t('partner.step1.title')} <Diamond className="inline w-5 h-5" /> Karat
            </h2>
            <p className="text-xl font-semibold text-center mb-4">
              {t('partner.step1.subtitle')}
            </p>
            <p className="text-muted-foreground text-center mb-8">
              {t('partner.step1.description')}
            </p>

            <button
              onClick={handleContinue}
              className="w-full py-4 bg-foreground text-background font-semibold rounded-2xl active:scale-[0.98] transition-transform"
            >
              {t('common.continue')}
            </button>
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
            className="flex flex-col items-center px-6 pb-8"
          >
            {/* Back button */}
            <button
              onClick={handleBack}
              className="absolute top-4 left-4 w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Magnet + coins illustration */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-6">
              <div 
                className="w-32 h-40 rounded-t-full"
                style={{
                  background: "linear-gradient(180deg, #7FFF00 0%, #BFFF00 100%)",
                }}
              />
              {/* Coins */}
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #DFFF00 0%, #BFFF00 100%)",
                    border: "2px solid #7FFF00",
                    top: `${30 + i * 15}%`,
                    left: `${20 + (i % 2) * 40}%`,
                  }}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                >
                  <Diamond className="w-4 h-4 text-black" />
                </motion.div>
              ))}
              {/* Sparkles */}
              <span className="absolute top-8 left-8 text-2xl">✦</span>
              <span className="absolute top-12 right-12 text-xl">✦</span>
              <span className="absolute bottom-16 left-16 text-lg">✦</span>
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">
              {t('partner.step2.title')} <Diamond className="inline w-5 h-5" /> Karat
            </h2>
            <p className="text-xl font-semibold text-center mb-4">
              {t('partner.step2.subtitle')}
            </p>
            <p className="text-muted-foreground text-center mb-2">
              {t('partner.step2.description1')}
            </p>
            <p className="text-muted-foreground text-center mb-8">
              {t('partner.step2.description2')}
            </p>

            <button
              onClick={handleContinue}
              className="w-full py-4 bg-foreground text-background font-semibold rounded-2xl active:scale-[0.98] transition-transform"
            >
              {t('common.continue')}
            </button>
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
            className="flex flex-col items-center px-6 pb-8"
          >
            {/* Back button */}
            <button
              onClick={handleBack}
              className="absolute top-4 left-4 w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

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
              {t('partner.step3.title')} <Diamond className="inline w-5 h-5" /> Karat
            </h2>
            <p className="text-xl font-semibold text-center mb-6">
              {t('partner.step3.subtitle')}
            </p>

            {/* 3 earning methods */}
            <div className="flex justify-center gap-6 mb-8">
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

            <button
              onClick={handleContinue}
              className="w-full py-4 bg-foreground text-background font-semibold rounded-2xl active:scale-[0.98] transition-transform"
            >
              {t('common.continue')}
            </button>
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
            className="flex flex-col items-center px-6 pb-8"
          >
            {/* Back button */}
            <button
              onClick={handleBack}
              className="absolute top-4 left-4 w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

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
            <p className="text-muted-foreground text-center mb-8">
              {t('partner.step4.description')}
            </p>

            {/* Share buttons */}
            <button
              onClick={handleShareTelegram}
              className="w-full py-4 bg-foreground text-background font-semibold rounded-2xl mb-3 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Send className="w-5 h-5" />
              {t('partner.shareInTelegram')}
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full py-4 bg-foreground text-background font-semibold rounded-2xl mb-4 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Copy className="w-5 h-5" />
              {t('partner.copyInviteLink')}
            </button>

            <button
              onClick={handleClose}
              className="w-full py-3 text-muted-foreground font-medium"
            >
              {t('common.cancel')}
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] overflow-hidden">
        <div className="relative pt-8">
          <AnimatePresence mode="wait" custom={step}>
            {renderStep()}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
