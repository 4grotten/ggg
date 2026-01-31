import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { ArrowLeft, Users, Percent, ClipboardCheck, Send, Copy, Share2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import partnerStep2Image from "@/assets/partner-step2-gift.png";
import partnerStep3Image from "@/assets/partner-step3-camel.png";
import TgsPlayer, { preloadTgs } from "@/components/ui/TgsPlayer";
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

interface PartnerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PartnerDrawer = ({ open, onOpenChange }: PartnerDrawerProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showAuthAlert, setShowAuthAlert] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Preload TGS animations when drawer opens
  useEffect(() => {
    if (open) {
      preloadTgs("./animations/GlassDuck.tgs");
      preloadTgs("./animations/money-coins.tgs");
      preloadTgs("./animations/wowduck.tgs");
      preloadTgs("./animations/WonDuck.tgs");
    }
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(0);
      setDirection(1);
    }, 300);
  };

  const handleBack = () => {
    if (step > 0) {
      setDirection(-1);
      setAnimationKey(prev => prev + 1);
      setStep(step - 1);
    }
  };

  const handleContinue = () => {
    if (step === 2 && !isAuthenticated) {
      setShowAuthAlert(true);
      return;
    }
    if (step < 3) {
      setDirection(1);
      setAnimationKey(prev => prev + 1);
      setStep(step + 1);
    }
  };

  const handleGuestShareAction = () => {
    if (!isAuthenticated) {
      setShowAuthAlert(true);
      return true;
    }
    return false;
  };

  const appLink = "https://test.apofiz.com/EasyCard/";

  const handleCopyLink = () => {
    if (handleGuestShareAction()) return;
    navigator.clipboard.writeText(appLink);
    toast.success(t('partner.linkCopied'));
  };

  const handleShareTelegram = () => {
    if (handleGuestShareAction()) return;
    const text = encodeURIComponent(t('partner.shareText'));
    const url = encodeURIComponent(appLink);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  const handleAuthRedirect = () => {
    setShowAuthAlert(false);
    onOpenChange(false);
    navigate("/auth/phone");
  };

  const handleShare = async () => {
    if (handleGuestShareAction()) return;
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

  const stepAnimationClass = direction > 0 ? 'partner-step-enter-right' : 'partner-step-enter-left';

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div
            key={`step0-${animationKey}`}
            className={`flex flex-col items-center px-6 ${stepAnimationClass}`}
          >
            {/* GlassDuck TGS animation with green glow and orbiting users */}
            <div className="relative w-[170px] h-[170px] flex items-center justify-center mb-6">
              {/* Animated rainbow border */}
              <div 
                className="absolute inset-0 rounded-full blur-[1px] animate-spin-slow"
                style={{
                  background: "conic-gradient(from 0deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b)",
                }}
              />
              <div 
                className="absolute inset-[-4px] rounded-full opacity-40 blur-md animate-spin-slow"
                style={{
                  background: "conic-gradient(from 0deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b)",
                }}
              />
              {/* Inner content container */}
              <div className="relative w-[158px] h-[158px] rounded-full bg-background flex items-center justify-center">
                {/* Pulsing green background glow */}
                <div
                  className="absolute -inset-2 rounded-full partner-pulse-glow"
                  style={{ 
                    background: "radial-gradient(circle, rgba(34, 197, 94, 0.8) 0%, rgba(16, 185, 129, 0.5) 35%, rgba(52, 211, 153, 0.3) 55%, transparent 75%)",
                  }}
                />
              
              {/* Orbiting users container */}
              <div className="absolute inset-0 partner-orbit-container">
                {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                  <div
                    key={i}
                    className="absolute w-7 h-7 rounded-full flex items-center justify-center partner-orbit-item"
                    style={{
                      background: "linear-gradient(135deg, #22c55e 0%, #10b981 100%)",
                      boxShadow: "0 0 10px rgba(34, 197, 94, 0.6), 0 0 20px rgba(16, 185, 129, 0.3)",
                      left: `calc(50% + ${Math.cos((angle - 90) * Math.PI / 180) * 72}px - 14px)`,
                      top: `calc(50% + ${Math.sin((angle - 90) * Math.PI / 180) * 72}px - 14px)`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  >
                    <Users className="w-3.5 h-3.5 text-white" />
                  </div>
                ))}
              </div>
              
                <TgsPlayer 
                  src="./animations/GlassDuck.tgs" 
                  className="w-[140px] h-[140px] relative z-10"
                />
              </div>
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
          </div>
        );

      case 1:
        return (
          <div
            key={`step1-${animationKey}`}
            className={`flex flex-col items-center px-6 ${stepAnimationClass}`}
          >
            {/* TGS Lottie animation with green glow */}
            <div className="relative w-[170px] h-[170px] flex items-center justify-center mb-6">
              {/* Animated rainbow border */}
              <div 
                className="absolute inset-0 rounded-full blur-[1px] animate-spin-slow"
                style={{
                  background: "conic-gradient(from 0deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b)",
                }}
              />
              <div 
                className="absolute inset-[-4px] rounded-full opacity-40 blur-md animate-spin-slow"
                style={{
                  background: "conic-gradient(from 0deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b)",
                }}
              />
              {/* Inner content container */}
              <div className="relative w-[158px] h-[158px] rounded-full bg-background flex items-center justify-center">
                {/* Pulsing green background glow */}
                <div
                  className="absolute -inset-2 rounded-full partner-pulse-glow"
                  style={{ 
                    background: "radial-gradient(circle, rgba(34, 197, 94, 0.8) 0%, rgba(16, 185, 129, 0.5) 35%, rgba(52, 211, 153, 0.3) 55%, transparent 75%)",
                  }}
                />
              
              {/* Blinking users around the animation - continuous circle */}
              <div className="absolute -inset-12 z-0">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <div
                    key={i}
                    className="absolute w-6 h-6 rounded-full flex items-center justify-center partner-blink-user"
                    style={{
                      background: "linear-gradient(135deg, #22c55e 0%, #10b981 100%)",
                      boxShadow: "0 0 10px rgba(34, 197, 94, 0.6)",
                      left: "50%",
                      top: "50%",
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(100px) rotate(-${angle}deg)`,
                      animationDelay: `${i * 1}s`,
                    }}
                  >
                    <Users className="w-3 h-3 text-white" />
                  </div>
                ))}
              </div>
              
                <TgsPlayer 
                  src="./animations/money-coins.tgs" 
                  className="w-[140px] h-[140px] relative z-10"
                />
              </div>
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
          </div>
        );

      case 2:
        return (
          <div
            key={`step2-${animationKey}`}
            className={`flex flex-col items-center px-6 ${stepAnimationClass}`}
          >
            {/* Duck animation with glow */}
            <div className="relative w-[150px] h-[150px] flex items-center justify-center mb-6">
              {/* Animated rainbow border */}
              <div 
                className="absolute inset-0 rounded-full blur-[1px] animate-spin-slow"
                style={{
                  background: "conic-gradient(from 0deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b)",
                }}
              />
              <div 
                className="absolute inset-[-4px] rounded-full opacity-40 blur-md animate-spin-slow"
                style={{
                  background: "conic-gradient(from 0deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b)",
                }}
              />
              {/* Inner content container */}
              <div className="relative w-[138px] h-[138px] rounded-full bg-background flex items-center justify-center">
                {/* Pulsing green background glow */}
                <div
                  className="absolute -inset-2 rounded-full partner-pulse-glow"
                  style={{ 
                    background: "radial-gradient(circle, rgba(34, 197, 94, 0.8) 0%, rgba(16, 185, 129, 0.5) 35%, rgba(52, 211, 153, 0.3) 55%, transparent 75%)",
                  }}
                />
              
              {/* Exploding users animation */}
              <div className="absolute inset-0">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <div
                    key={i}
                    className="absolute w-6 h-6 rounded-full flex items-center justify-center partner-explode-user"
                    style={{
                      background: "linear-gradient(135deg, #22c55e 0%, #10b981 100%)",
                      boxShadow: "0 0 8px rgba(34, 197, 94, 0.6)",
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      "--explode-angle": `${angle}deg`,
                      animationDelay: `${i * 0.15}s`,
                    } as React.CSSProperties}
                  >
                    <Users className="w-3 h-3 text-white" />
                  </div>
                ))}
              </div>
              
                <TgsPlayer 
                  src="./animations/wowduck.tgs" 
                  className="w-[120px] h-[120px] relative z-10"
                />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">
              {t('partner.earnWithEasyCard')}
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              {t('partner.passiveIncomeDaily')}
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
                  {t('partner.soon')}
                </span>
                <p className="text-sm font-medium text-center opacity-60">{t('partner.completeTasks')}</p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div
            key={`step3-${animationKey}`}
            className={`flex flex-col items-center px-6 ${stepAnimationClass}`}
          >
            {/* WonDuck animation with glow */}
            <div className="relative w-[150px] h-[150px] flex items-center justify-center mb-6">
              {/* Animated rainbow border */}
              <div 
                className="absolute inset-0 rounded-full blur-[1px] animate-spin-slow"
                style={{
                  background: "conic-gradient(from 0deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b)",
                }}
              />
              <div 
                className="absolute inset-[-4px] rounded-full opacity-40 blur-md animate-spin-slow"
                style={{
                  background: "conic-gradient(from 0deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b)",
                }}
              />
              {/* Inner content container */}
              <div className="relative w-[138px] h-[138px] rounded-full bg-background flex items-center justify-center">
                {/* Pulsing green background glow */}
                <div
                  className="absolute -inset-2 rounded-full partner-pulse-glow"
                  style={{ 
                    background: "radial-gradient(circle, rgba(34, 197, 94, 0.8) 0%, rgba(16, 185, 129, 0.5) 35%, rgba(52, 211, 153, 0.3) 55%, transparent 75%)",
                  }}
                />
              
              {/* Floating users animation - around the animation */}
              <div className="absolute -inset-4 z-0">
                {[
                  { left: 5, top: 25 },
                  { left: 85, top: 30 },
                  { left: 8, top: 65 },
                  { left: 88, top: 60 },
                  { left: 30, top: 0 },
                  { left: 70, top: 5 },
                ].map((pos, i) => (
                  <div
                    key={i}
                    className="absolute w-6 h-6 rounded-full flex items-center justify-center partner-float-user"
                    style={{
                      background: "linear-gradient(135deg, #22c55e 0%, #10b981 100%)",
                      boxShadow: "0 0 10px rgba(34, 197, 94, 0.6)",
                      left: `${pos.left}%`,
                      top: `${pos.top}%`,
                      animationDelay: `${i * 0.4}s`,
                    }}
                  >
                    <Users className="w-3 h-3 text-white" />
                  </div>
                ))}
              </div>
              
                <TgsPlayer 
                  src="./animations/WonDuck.tgs" 
                  className="w-[120px] h-[120px] relative z-10"
                />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">
              {t('partner.step4.title')}
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              {t('partner.step4.description')}
            </p>

            {/* 3 share buttons */}
            <div className="flex justify-center gap-4">
              <button
                onClick={handleShareTelegram}
                className="relative w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden partner-share-btn partner-share-btn-telegram"
                style={{
                  background: "linear-gradient(135deg, #0088cc 0%, #00c6ff 50%, #0088cc 100%)",
                }}
                aria-label={t('partner.shareInTelegram')}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent partner-btn-shimmer-overlay partner-btn-shimmer-overlay-1" />
                <Send className="w-5 h-5 text-white relative z-10 drop-shadow-lg" />
              </button>
              
              <button
                onClick={handleCopyLink}
                className="relative w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden partner-share-btn partner-share-btn-copy"
                style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)",
                }}
                aria-label={t('partner.copyInviteLink')}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent partner-btn-shimmer-overlay partner-btn-shimmer-overlay-2" />
                <Copy className="w-5 h-5 text-white relative z-10 drop-shadow-lg" />
              </button>
              
              <button
                onClick={handleShare}
                className="relative w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden partner-share-btn partner-share-btn-share"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)",
                }}
                aria-label={t('common.share')}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent partner-btn-shimmer-overlay partner-btn-shimmer-overlay-3" />
                <Share2 className="w-5 h-5 text-white relative z-10 drop-shadow-lg" />
              </button>
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
      <div className="relative rounded-2xl p-[4px] overflow-hidden">
        {/* Animated rainbow border */}
        <div 
          className="absolute inset-0 rounded-2xl animate-spin-slow"
          style={{
            background: "conic-gradient(from 0deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b)",
          }}
        />
        <div 
          className="absolute inset-[-4px] rounded-2xl opacity-40 blur-md animate-spin-slow"
          style={{
            background: "conic-gradient(from 0deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b)",
          }}
        />
        <button
          onClick={isLastStep ? handleGoToPartnerPage : handleContinue}
          className="relative w-full py-4 font-semibold rounded-[12px] overflow-hidden partner-continue-btn"
          style={{
            background: "linear-gradient(135deg, #BFFF00 0%, #7FFF00 100%)",
          }}
        >
          {/* Shimmer overlay */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            style={{
              animation: "shimmer 2s ease-in-out infinite",
            }}
          />
          <span className="text-black font-bold relative z-10">{t('common.continue')}</span>
        </button>
      </div>
    );
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal>
      <DrawerContent className="max-h-[90vh] flex flex-col" onPointerDownOutside={(e) => e.preventDefault()}>
        {/* Close button - right side */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10 hover:bg-muted/80 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
        
        {/* Back button - fixed position */}
        {step > 0 && (
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10 hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
        
        {/* Scrollable content with fixed height to prevent drawer jumping */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="relative pt-8 pb-4 h-[420px] flex flex-col">
            {renderStepContent()}
          </div>
        </div>
        
        {/* Floating button - no background */}
        <div className="px-6 pb-6 pt-2 bg-transparent">
          {renderFooterButtons()}
        </div>
      </DrawerContent>

      {/* iOS-style Auth Alert */}
      <AlertDialog open={showAuthAlert} onOpenChange={setShowAuthAlert}>
        <AlertDialogContent 
          className="w-[270px] rounded-2xl p-0 gap-0 border-0 overflow-hidden"
          style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)', backdropFilter: 'blur(40px)' }}
        >
          <AlertDialogHeader className="pt-5 px-4 pb-4 text-center">
            <AlertDialogTitle className="text-[17px] font-semibold text-white text-center">
              {t('common.authorize', 'Авторизация')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-[#8E8E93] text-center mt-1">
              {t('feesAndLimits.authRequiredMessage', 'Для доступа к этой функции необходимо войти в аккаунт')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col p-0 gap-0">
            <div className="w-full h-[1px]" style={{ backgroundColor: 'rgba(84, 84, 88, 0.65)' }} />
            <AlertDialogCancel 
              onClick={() => setShowAuthAlert(false)}
              className="m-0 h-11 rounded-none border-0 bg-transparent text-[17px] font-normal text-[#0A84FF] hover:bg-white/5"
            >
              {t('common.cancel', 'Отмена')}
            </AlertDialogCancel>
            <div className="w-full h-[1px]" style={{ backgroundColor: 'rgba(84, 84, 88, 0.65)' }} />
            <AlertDialogAction
              onClick={handleAuthRedirect}
              className="m-0 h-11 rounded-none border-0 bg-transparent text-[17px] font-semibold text-[#0A84FF] hover:bg-white/5"
            >
              {t('common.authorize', 'Авторизация')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Drawer>
  );
};
