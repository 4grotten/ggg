import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useVerificationProgress } from "@/hooks/useVerificationProgress";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AnimatedFingerprint = () => {
  const [step, setStep] = useState(0);
  
  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 400),
      setTimeout(() => setStep(2), 700),
      setTimeout(() => setStep(3), 1000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const arcs = [
    { d: "M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4", step: 1 },
    { d: "M14 13.12c0 2.38 0 6.38-1 8.88", step: 2 },
    { d: "M17.29 21.02c.12-.6.43-2.3.5-3.02", step: 2 },
    { d: "M2 12a10 10 0 0 1 18-6", step: 2 },
    { d: "M2 16h.01", step: 3 },
    { d: "M21.8 16c.2-2 .131-5.354 0-6", step: 3 },
    { d: "M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2", step: 3 },
    { d: "M8.65 22c.21-.66.45-1.32.57-2", step: 3 },
    { d: "M9 6.8a6 6 0 0 1 9 5.2v2", step: 3 },
  ];

  return (
    <motion.div 
      className="w-12 h-12 flex items-center justify-center"
      animate={step === 3 ? { scale: [1, 1.15, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-white"
      >
        {arcs.map((arc, index) => (
          <motion.path
            key={index}
            d={arc.d}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={step >= arc.step ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            transition={{ 
              duration: 0.3, 
              ease: "easeOut",
              delay: arc.step === step ? index * 0.03 : 0
            }}
          />
        ))}
      </svg>
    </motion.div>
  );
};

interface VerifyIdentityCardProps {
  totalSteps?: number;
}

export const VerifyIdentityCard = ({
  totalSteps = 3,
}: VerifyIdentityCardProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getSavedProgress, clearProgress, getCompletedSteps, getPassportStatus, setPassportStatus } = useVerificationProgress();
  const [showDialog, setShowDialog] = useState(false);
  const [showPassportDialog, setShowPassportDialog] = useState(false);
  
  // Calculate progress based on saved verification step
  const progress = getCompletedSteps();
  const passportStatus = getPassportStatus();
  const needsPassportUpdate = passportStatus?.needsUpdate && passportStatus?.completedSteps === 3;

  const handleClick = () => {
    // If passport needs update, show confirmation dialog
    if (needsPassportUpdate) {
      setShowPassportDialog(true);
      return;
    }
    
    const savedStep = getSavedProgress();
    
    // Always show dialog - user can choose to continue or start fresh
    // If there's saved progress beyond /verify, show dialog
    if (savedStep && savedStep !== "/verify") {
      setShowDialog(true);
    } else {
      // No saved progress, go to start
      navigate("/verify");
    }
  };

  const handleContinue = () => {
    const savedStep = getSavedProgress();
    setShowDialog(false);
    if (savedStep) {
      navigate(savedStep);
    }
  };

  const handleReset = () => {
    clearProgress();
    setShowDialog(false);
    navigate("/verify");
  };

  const handlePassportUpdateConfirm = () => {
    // Clear verification and passport status completely
    clearProgress();
    setPassportStatus(null);
    setShowPassportDialog(false);
    // Navigate to the beginning of verification, not document-type
    navigate("/verify");
  };

  const handlePassportUpdateCancel = () => {
    setShowPassportDialog(false);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full rounded-2xl p-4 text-left group bg-[#007AFF]"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {/* Animated Fingerprint Icon */}
            <AnimatedFingerprint />
            
            <div className="flex flex-col">
              <p className="text-[10px] uppercase tracking-wider text-white/70 font-medium">
                {needsPassportUpdate ? t('dashboard.verified') : t('dashboard.getYourCard')}
              </p>
              <p className="font-bold text-white text-lg">
                {needsPassportUpdate ? t('dashboard.identityVerified') : t('dashboard.verifyIdentity')}
              </p>
              <p className="text-sm text-white/70">
                {needsPassportUpdate ? t('dashboard.canOpenCard') : t('dashboard.verifyDescription')}
              </p>
            </div>
          </div>
          
          {/* Arrow Button */}
          <div className="w-10 h-10 min-w-10 min-h-10 shrink-0 rounded-full border-2 border-white flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 flex gap-2">
          {Array.from({ length: totalSteps }).map((_, index) => {
            // For passport update: all 3 steps are white (completed)
            const isCompleted = needsPassportUpdate || index < progress;
            
            return (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full ${
                  isCompleted ? "bg-white" : "bg-white/30"
                }`}
              />
            );
          })}
        </div>

        {/* Steps Counter */}
        <p className="mt-2 text-sm text-white/70 font-medium">
          {needsPassportUpdate 
            ? t('dashboard.allStepsCompleted')
            : progress > 0 
              ? t('dashboard.stepCompleted', { step: progress })
              : `${progress} ${t('dashboard.of')} ${totalSteps} ${t('dashboard.stepsDone')}`
          }
        </p>
      </button>

      {/* iOS-style Alert Dialog for resuming */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent 
          className="max-w-[270px] rounded-2xl p-0 overflow-hidden border-0 gap-0"
          onOverlayClick={() => setShowDialog(false)}
        >
          <div className="p-4 pb-3">
            <AlertDialogTitle className="text-center text-[17px] font-semibold mb-1">
              {t('verify.progress.resuming')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[13px] text-muted-foreground">
              {t('verify.progress.resumingDescription')}
            </AlertDialogDescription>
          </div>
          
          {/* iOS-style buttons */}
          <div className="flex flex-col">
            <button
              onClick={handleContinue}
              className="w-full py-3 text-[17px] font-semibold text-[#007AFF] border-t border-border hover:bg-secondary/50 transition-colors"
            >
              {t('verify.progress.continue')}
            </button>
            <button
              onClick={handleReset}
              className="w-full py-3 text-[17px] font-normal text-destructive border-t border-border hover:bg-secondary/50 transition-colors"
            >
              {t('verify.progress.reset')}
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* iOS-style Alert Dialog for passport update */}
      <AlertDialog open={showPassportDialog} onOpenChange={setShowPassportDialog}>
        <AlertDialogContent 
          className="max-w-[270px] rounded-2xl p-0 overflow-hidden border-0 gap-0"
          onOverlayClick={() => setShowPassportDialog(false)}
        >
          <div className="p-4 pb-3">
            <AlertDialogTitle className="text-center text-[17px] font-semibold mb-1">
              {t('dashboard.passportUpdateTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[13px] text-muted-foreground">
              {t('dashboard.passportUpdateDescription')}
            </AlertDialogDescription>
          </div>
          
          {/* iOS-style buttons */}
          <div className="flex flex-col">
            <button
              onClick={handlePassportUpdateConfirm}
              className="w-full py-3 text-[17px] font-semibold text-[#007AFF] border-t border-border hover:bg-secondary/50 transition-colors"
            >
              {t('common.yes')}
            </button>
            <button
              onClick={handlePassportUpdateCancel}
              className="w-full py-3 text-[17px] font-normal text-muted-foreground border-t border-border hover:bg-secondary/50 transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
