import { useState, useEffect, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer, DrawerContent, DrawerFooter } from "@/components/ui/drawer";
import { ArrowLeft, Users, Percent, ClipboardCheck, Send, Copy, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import partnerStep1Image from "@/assets/partner-step1-magnet.png";
import partnerStep2Image from "@/assets/partner-step2-gift.png";
import partnerStep3Image from "@/assets/partner-step3-camel.png";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

// Preload images on module load
const preloadImages = [partnerStep1Image, partnerStep2Image, partnerStep3Image];
preloadImages.forEach((src) => {
  const img = new Image();
  img.src = src;
});

interface PartnerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Memoized orbit icon component with CSS animations
const OrbitIcon = memo(({ index }: { index: number }) => {
  const angles = [0, 72, 144, 216, 288];
  const angle = angles[index];
  const x = Math.cos(angle * Math.PI / 180) * 80;
  const y = Math.sin(angle * Math.PI / 180) * 80;
  
  return (
    <div
      className="absolute w-10 h-10 rounded-full flex items-center justify-center animate-pulse"
      style={{
        background: "linear-gradient(135deg, #BFFF00 0%, #7FFF00 100%)",
        boxShadow: "0 4px 16px rgba(127, 255, 0, 0.4)",
        left: `calc(50% + ${x}px - 20px)`,
        top: `calc(50% + ${y}px - 20px)`,
        animationDelay: `${index * 0.2}s`,
      }}
    >
      <Users className="w-5 h-5 text-black" />
    </div>
  );
});
OrbitIcon.displayName = "OrbitIcon";

// Memoized network illustration (Step 0) - uses CSS animations instead of Framer Motion
const NetworkIllustration = memo(() => (
  <div className="relative w-56 h-56 flex items-center justify-center mb-6">
    {/* Pulsing background glow - CSS animation */}
    <div
      className="absolute inset-0 rounded-full animate-pulse"
      style={{ 
        background: "radial-gradient(circle, rgba(191, 255, 0, 0.3) 0%, transparent 70%)",
      }}
    />
    
    {/* Orbiting circles - static positions with pulse */}
    <div className="absolute inset-0">
      {[0, 1, 2, 3, 4].map((i) => (
        <OrbitIcon key={i} index={i} />
      ))}
    </div>
    
    {/* Center card icon - simple float animation */}
    <div
      className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center animate-float"
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(191, 255, 0, 0.2)",
        border: "2px solid rgba(191, 255, 0, 0.5)"
      }}
    >
      <span className="text-2xl font-bold" style={{ color: "#BFFF00" }}>EC</span>
    </div>
  </div>
));
NetworkIllustration.displayName = "NetworkIllustration";

// Memoized image step component
const StepImage = memo(({ src, alt }: { src: string; alt: string }) => (
  <div className="relative w-48 h-48 flex items-center justify-center mb-6">
    <img 
      src={src} 
      alt={alt} 
      className="w-full h-full object-contain rounded-2xl animate-float"
      style={{ filter: "drop-shadow(0 8px 24px rgba(127, 255, 0, 0.3))" }}
      loading="eager"
      decoding="async"
    />
  </div>
));
StepImage.displayName = "StepImage";

// Share button component with CSS-only animations
const ShareActionButton = memo(({ 
  onClick, 
  gradient, 
  shadowColor, 
  icon: Icon,
  label 
}: { 
  onClick: () => void; 
  gradient: string; 
  shadowColor: string;
  icon: typeof Send;
  label: string;
}) => (
  <button
    onClick={onClick}
    className="relative w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden active:scale-90 transition-transform"
    style={{
      background: gradient,
      boxShadow: `0 6px 20px ${shadowColor}`,
    }}
    aria-label={label}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
    <Icon className="w-5 h-5 text-white relative z-10 drop-shadow-lg" />
  </button>
));
ShareActionButton.displayName = "ShareActionButton";

export const PartnerDrawer = memo(({ open, onOpenChange }: PartnerDrawerProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(0);
  const [showAuthAlert, setShowAuthAlert] = useState(false);

  // Reset step when drawer closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => setStep(0), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  const handleContinue = useCallback(() => {
    if (step === 2 && !isAuthenticated) {
      setShowAuthAlert(true);
      return;
    }
    if (step < 3) setStep(step + 1);
  }, [step, isAuthenticated]);

  const handleGuestShareAction = useCallback(() => {
    if (!isAuthenticated) {
      setShowAuthAlert(true);
      return true;
    }
    return false;
  }, [isAuthenticated]);

  const appLink = "https://test.apofiz.com/EasyCard/";

  const handleCopyLink = useCallback(() => {
    if (handleGuestShareAction()) return;
    navigator.clipboard.writeText(appLink);
    toast.success(t('partner.linkCopied'));
  }, [handleGuestShareAction, t]);

  const handleShareTelegram = useCallback(() => {
    if (handleGuestShareAction()) return;
    const text = encodeURIComponent(t('partner.shareText'));
    const url = encodeURIComponent(appLink);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  }, [handleGuestShareAction, t]);

  const handleShare = useCallback(async () => {
    if (handleGuestShareAction()) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Easy Card',
          text: t('partner.shareText'),
          url: appLink,
        });
      } catch {
        // User cancelled
      }
    }
  }, [handleGuestShareAction, t]);

  const handleAuthRedirect = useCallback(() => {
    setShowAuthAlert(false);
    onOpenChange(false);
    navigate("/auth/phone");
  }, [navigate, onOpenChange]);

  const handleGoToPartnerPage = useCallback(() => {
    onOpenChange(false);
    setTimeout(() => navigate("/partner"), 300);
  }, [navigate, onOpenChange]);

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col items-center px-6 animate-fade-in">
            <NetworkIllustration />
            <h2 className="text-2xl font-bold text-center mb-2">
              {t('partner.step1.title')} Easy Card
            </h2>
            <p className="text-lg text-center mb-3 text-foreground">
              {t('partner.step1.subtitle')}
            </p>
            <p className="text-muted-foreground text-center">
              {t('partner.step1.description')}
            </p>
          </div>
        );

      case 1:
        return (
          <div className="flex flex-col items-center px-6 animate-fade-in">
            <StepImage src={partnerStep1Image} alt="Earn rewards" />
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
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col items-center px-6 animate-fade-in">
            <StepImage src={partnerStep2Image} alt="Rewards" />
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
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col items-center px-6 animate-fade-in">
            <StepImage src={partnerStep3Image} alt="Save rewards" />
            <h2 className="text-2xl font-bold text-center mb-2">
              {t('partner.step4.title')}
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              {t('partner.step4.description')}
            </p>
            {/* Share buttons with CSS animations */}
            <div className="flex justify-center gap-4">
              <ShareActionButton
                onClick={handleShareTelegram}
                gradient="linear-gradient(135deg, #0088cc 0%, #00c6ff 100%)"
                shadowColor="rgba(0, 136, 204, 0.4)"
                icon={Send}
                label={t('partner.shareInTelegram')}
              />
              <ShareActionButton
                onClick={handleCopyLink}
                gradient="linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"
                shadowColor="rgba(124, 58, 237, 0.4)"
                icon={Copy}
                label={t('partner.copyInviteLink')}
              />
              <ShareActionButton
                onClick={handleShare}
                gradient="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                shadowColor="rgba(16, 185, 129, 0.4)"
                icon={Share2}
                label={t('common.share')}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderFooterButtons = () => {
    const isLastStep = step === 3;
    
    return (
      <DrawerFooter className="px-4 pb-6 pt-2">
        {isLastStep ? (
          <button
            onClick={handleGoToPartnerPage}
            className="w-full py-4 px-6 font-bold rounded-2xl relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #BFFF00 0%, #7FFF00 100%)",
              boxShadow: "0 0 20px rgba(127, 255, 0, 0.5)"
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            <span className="relative z-10 text-black">{t('partner.goToPartnerPage', 'Перейти в партнёрский кабинет')}</span>
          </button>
        ) : (
          <button
            onClick={handleContinue}
            className="w-full py-4 px-6 font-bold rounded-2xl relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #BFFF00 0%, #7FFF00 100%)",
              boxShadow: "0 0 20px rgba(127, 255, 0, 0.5)"
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            <span className="relative z-10 text-black">{t('common.continue', 'Продолжить')}</span>
          </button>
        )}
      </DrawerFooter>
    );
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-background/95 backdrop-blur-xl">
          {/* Header with back button and step indicator */}
          <div className="flex items-center justify-between px-4 pt-2 pb-2 flex-shrink-0">
            {step > 0 ? (
              <button
                onClick={handleBack}
                className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center active:scale-95 transition-transform"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-10" />
            )}
            
            {/* Step indicators */}
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center active:scale-95 transition-transform"
            >
              <span className="text-lg">×</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto py-4">
            {renderStepContent()}
          </div>

          {/* Footer */}
          {renderFooterButtons()}
        </DrawerContent>
      </Drawer>

      {/* Auth Alert */}
      <AlertDialog open={showAuthAlert} onOpenChange={setShowAuthAlert}>
        <AlertDialogContent className="w-[270px] rounded-2xl p-0 gap-0 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border-0 shadow-2xl">
          <AlertDialogHeader className="pt-5 pb-4 px-4 text-center">
            <AlertDialogTitle className="text-[17px] font-semibold text-foreground">
              {t('feesAndLimits.authRequired', 'Требуется авторизация')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-muted-foreground leading-tight">
              {t('partner.authRequiredDesc', 'Для участия в партнёрской программе необходимо авторизоваться')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col p-0 border-t border-[#C6C6C8] dark:border-[#38383A]">
            <AlertDialogCancel 
              onClick={() => setShowAuthAlert(false)}
              className="w-full py-[11px] text-[17px] text-[#007AFF] font-normal border-0 border-b border-[#C6C6C8] dark:border-[#38383A] bg-transparent hover:bg-black/5 dark:hover:bg-white/5 rounded-none"
            >
              {t('common.cancel', 'Отмена')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAuthRedirect}
              className="w-full py-[11px] text-[17px] text-[#007AFF] font-semibold border-0 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 rounded-none"
            >
              {t('common.authorize', 'Авторизоваться')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

PartnerDrawer.displayName = "PartnerDrawer";
