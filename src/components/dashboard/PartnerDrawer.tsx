import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { ArrowLeft, Users, Percent, ClipboardCheck, Send, Copy, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import partnerStep2Image from "@/assets/partner-step2-gift.png";
import partnerStep3Image from "@/assets/partner-step3-camel.png";
import TgsPlayer from "@/components/ui/TgsPlayer";
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
            {/* Network/Partnership illustration */}
            <div className="relative w-56 h-56 flex items-center justify-center mb-6">
              {/* Pulsing background glow */}
              <div
                className="absolute inset-0 rounded-full partner-pulse-glow"
                style={{ background: "radial-gradient(circle, rgba(191, 255, 0, 0.4) 0%, transparent 70%)" }}
              />
              
              {/* Orbiting circles representing network */}
              <div className="absolute inset-0 partner-orbit">
                {[0, 72, 144, 216, 288].map((angle, i) => (
                  <div
                    key={i}
                    className={`absolute w-10 h-10 rounded-full flex items-center justify-center partner-node-pulse partner-node-pulse-${i + 1}`}
                    style={{
                      background: "linear-gradient(135deg, #BFFF00 0%, #7FFF00 100%)",
                      boxShadow: "0 4px 16px rgba(127, 255, 0, 0.4)",
                      left: `calc(50% + ${Math.cos(angle * Math.PI / 180) * 80}px - 20px)`,
                      top: `calc(50% + ${Math.sin(angle * Math.PI / 180) * 80}px - 20px)`,
                    }}
                  >
                    <Users className="w-5 h-5 text-black" />
                  </div>
                ))}
              </div>
              
              {/* Center card icon */}
              <div
                className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center partner-center-float"
                style={{
                  background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(191, 255, 0, 0.2)",
                  border: "2px solid rgba(191, 255, 0, 0.5)"
                }}
              >
                <span className="text-2xl font-bold" style={{ color: "#BFFF00" }}>EC</span>
              </div>
              
              {/* Connecting lines effect */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.3 }}>
                {[0, 72, 144, 216, 288].map((angle, i) => (
                  <line
                    key={i}
                    x1="50%"
                    y1="50%"
                    x2={`${50 + Math.cos(angle * Math.PI / 180) * 35}%`}
                    y2={`${50 + Math.sin(angle * Math.PI / 180) * 35}%`}
                    stroke="#BFFF00"
                    strokeWidth="1"
                    className={`partner-line-pulse partner-line-pulse-${i + 1}`}
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
          </div>
        );

      case 1:
        return (
          <div
            key={`step1-${animationKey}`}
            className={`flex flex-col items-center px-6 ${stepAnimationClass}`}
          >
            {/* TGS Lottie animation with green glow */}
            <div className="relative w-56 h-56 flex items-center justify-center mb-6">
              {/* Pulsing green background glow */}
              <div
                className="absolute -inset-4 rounded-full partner-pulse-glow"
                style={{ 
                  background: "radial-gradient(circle, rgba(34, 197, 94, 0.8) 0%, rgba(16, 185, 129, 0.5) 35%, rgba(52, 211, 153, 0.3) 55%, transparent 75%)",
                }}
              />
              <TgsPlayer 
                src="/animations/money-coins.tgs" 
                className="w-full h-full relative z-10"
              />
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
            {/* Gift box illustration */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-6">
              <img 
                src={partnerStep2Image} 
                alt="Rewards" 
                className="w-full h-full object-contain rounded-2xl opacity-80"
              />
            </div>

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
          <div
            key={`step3-${animationKey}`}
            className={`flex flex-col items-center px-6 ${stepAnimationClass}`}
          >
            {/* Piggy bank illustration */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-6">
              <img 
                src={partnerStep3Image} 
                alt="Save rewards" 
                className="w-full h-full object-contain rounded-2xl opacity-80"
              />
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
      <button
        onClick={isLastStep ? handleGoToPartnerPage : handleContinue}
        className="w-full py-4 font-semibold rounded-2xl relative overflow-hidden partner-continue-btn"
        style={{
          background: "linear-gradient(135deg, #BFFF00 0%, #7FFF00 100%)",
          boxShadow: "0 8px 24px rgba(127, 255, 0, 0.3)",
        }}
      >
        <span className="text-black font-bold">{t('common.continue')}</span>
      </button>
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
