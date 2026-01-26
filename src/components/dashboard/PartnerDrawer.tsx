import { useState, useEffect, memo, useCallback, useRef } from "react";
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

// Fixed content height for consistent drawer size
const CONTENT_HEIGHT = "420px";

interface PartnerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Memoized orbit icon component with CSS animations
const OrbitIcon = memo(({ index }: { index: number }) => {
  const angles = [0, 72, 144, 216, 288];
  const angle = angles[index];
  const x = Math.cos(angle * Math.PI / 180) * 70;
  const y = Math.sin(angle * Math.PI / 180) * 70;
  
  return (
    <div
      className="absolute w-9 h-9 rounded-full flex items-center justify-center animate-pulse"
      style={{
        background: "linear-gradient(135deg, #BFFF00 0%, #7FFF00 100%)",
        boxShadow: "0 4px 16px rgba(127, 255, 0, 0.4)",
        left: `calc(50% + ${x}px - 18px)`,
        top: `calc(50% + ${y}px - 18px)`,
        animationDelay: `${index * 0.2}s`,
      }}
    >
      <Users className="w-4 h-4 text-black" />
    </div>
  );
});
OrbitIcon.displayName = "OrbitIcon";

// Memoized network illustration (Step 0)
const NetworkIllustration = memo(() => (
  <div className="relative w-48 h-48 flex items-center justify-center">
    <div
      className="absolute inset-0 rounded-full animate-pulse"
      style={{ 
        background: "radial-gradient(circle, rgba(191, 255, 0, 0.3) 0%, transparent 70%)",
      }}
    />
    <div className="absolute inset-0">
      {[0, 1, 2, 3, 4].map((i) => (
        <OrbitIcon key={i} index={i} />
      ))}
    </div>
    <div
      className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center animate-float"
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(191, 255, 0, 0.2)",
        border: "2px solid rgba(191, 255, 0, 0.5)"
      }}
    >
      <span className="text-xl font-bold" style={{ color: "#BFFF00" }}>EC</span>
    </div>
  </div>
));
NetworkIllustration.displayName = "NetworkIllustration";

// Memoized image step component
const StepImage = memo(({ src, alt }: { src: string; alt: string }) => (
  <div className="relative w-40 h-40 flex items-center justify-center">
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

// Share button component
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
  
  // Swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

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

  const handleNext = useCallback(() => {
    if (step === 2 && !isAuthenticated) {
      setShowAuthAlert(true);
      return;
    }
    if (step < 3) setStep(step + 1);
  }, [step, isAuthenticated]);

  // Swipe handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && step < 3) {
      // Swipe left = next step
      if (step === 2 && !isAuthenticated) {
        setShowAuthAlert(true);
      } else {
        setStep(step + 1);
      }
    } else if (isRightSwipe && step > 0) {
      // Swipe right = previous step
      setStep(step - 1);
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
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
    const contentClass = "flex flex-col items-center justify-center px-6 h-full";
    
    switch (step) {
      case 0:
        return (
          <div className={contentClass}>
            <NetworkIllustration />
            <h2 className="text-xl font-bold text-center mt-4 mb-2">
              {t('partner.step1.title')} Easy Card
            </h2>
            <p className="text-base text-center mb-2 text-foreground">
              {t('partner.step1.subtitle')}
            </p>
            <p className="text-sm text-muted-foreground text-center">
              {t('partner.step1.description')}
            </p>
          </div>
        );

      case 1:
        return (
          <div className={contentClass}>
            <StepImage src={partnerStep1Image} alt="Earn rewards" />
            <h2 className="text-xl font-bold text-center mt-4 mb-2">
              {t('partner.step2.title')} Easy Card
            </h2>
            <p className="text-lg font-semibold text-center mb-2">
              {t('partner.step2.subtitle')}
            </p>
            <p className="text-sm text-muted-foreground text-center mb-1">
              {t('partner.step2.description1')}
            </p>
            <p className="text-sm text-muted-foreground text-center">
              {t('partner.step2.description2')}
            </p>
          </div>
        );

      case 2:
        return (
          <div className={contentClass}>
            <StepImage src={partnerStep2Image} alt="Rewards" />
            <h2 className="text-xl font-bold text-center mt-4 mb-4">
              {t('partner.step3.title')} Easy Card
            </h2>
            <div className="flex justify-center gap-5">
              <div className="flex flex-col items-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-1.5"
                  style={{ background: "#BFFF00" }}
                >
                  <Users className="w-5 h-5 text-black" />
                </div>
                <p className="text-xs font-medium text-center max-w-[70px]">{t('partner.inviteFriends')}</p>
              </div>
              <div className="flex flex-col items-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-1.5"
                  style={{ background: "#BFFF00" }}
                >
                  <Percent className="w-5 h-5 text-black" />
                </div>
                <p className="text-xs font-medium text-center max-w-[70px]">{t('partner.friendsSpending')}</p>
              </div>
              <div className="flex flex-col items-center relative">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-1.5 opacity-60"
                  style={{ background: "#BFFF00" }}
                >
                  <ClipboardCheck className="w-5 h-5 text-black" />
                </div>
                <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-foreground text-background px-1 py-0.5 rounded-full">
                  {t('partner.soon')}
                </span>
                <p className="text-xs font-medium text-center opacity-60 max-w-[70px]">{t('partner.completeTasks')}</p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className={contentClass}>
            <StepImage src={partnerStep3Image} alt="Save rewards" />
            <h2 className="text-xl font-bold text-center mt-4 mb-2">
              {t('partner.step4.title')}
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {t('partner.step4.description')}
            </p>
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

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-background/95 backdrop-blur-xl">
          {/* Compact header */}
          <div className="relative pt-2 pb-1">
            <div className="flex justify-center gap-1.5">
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
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center active:scale-95 transition-transform"
            >
              <span className="text-xl leading-none">×</span>
            </button>
            
            {step > 0 && (
              <button
                onClick={handleBack}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center active:scale-95 transition-transform"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Swipeable content with fixed height */}
          <div 
            className="overflow-hidden touch-pan-y"
            style={{ height: CONTENT_HEIGHT }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {renderStepContent()}
          </div>

          {/* Footer */}
          <DrawerFooter className="px-4 pb-6 pt-2">
            {step === 3 ? (
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
                onClick={handleNext}
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
