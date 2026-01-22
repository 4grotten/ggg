import { Shield, CreditCard, Wallet, LockKeyhole, LockKeyholeOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useVerificationProgress } from "@/hooks/useVerificationProgress";
import { toast } from "@/hooks/use-toast";

const PrivacyProtection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isLocked, setIsLocked] = useState(false);
  const { redirectToSavedProgress } = useVerificationProgress();

  useEffect(() => {
    // Check if user has saved progress and redirect
    const savedStep = redirectToSavedProgress();
    if (savedStep) {
      toast({
        title: t('verify.progress.resuming'),
        description: t('verify.progress.resumingDescription'),
      });
      navigate(savedStep, { replace: true });
      return;
    }

    const timer = setTimeout(() => {
      setIsLocked(true);
    }, 600);
    return () => clearTimeout(timer);
  }, [redirectToSavedProgress, navigate, t]);

  const benefits = [
    { icon: Shield, textKey: "verify.privacy.benefit1" },
    { icon: CreditCard, textKey: "verify.privacy.benefit2" },
    { icon: Wallet, textKey: "verify.privacy.benefit3" },
  ];

  return (
    <MobileLayout
      showBackButton
      onBack={() => navigate("/")}
      rightAction={<LanguageSwitcher />}
    >
      <div className="flex flex-col h-[calc(100vh-56px)]">
        <div className="flex-1 overflow-y-auto px-6 py-8 pb-28">
          {/* Icon */}
          <div className="flex flex-col items-center justify-center text-center">
            <motion.div 
              className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative overflow-hidden"
              animate={isLocked ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <AnimatePresence mode="wait">
                {!isLocked ? (
                  <motion.div
                    key="unlocked"
                    initial={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <LockKeyholeOpen className="w-12 h-12 text-primary" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="locked"
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <LockKeyhole className="w-12 h-12 text-primary" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <h1 className="text-2xl font-bold mb-4 whitespace-pre-line">
              {t('verify.privacy.title')}
            </h1>

            <p className="text-muted-foreground mb-8 whitespace-pre-line">
              {t('verify.privacy.description')}
            </p>

            {/* Benefits */}
            <div className="w-full space-y-3">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.15, duration: 0.4, ease: "easeOut" }}
                  className="flex items-center gap-2 bg-[#007AFF] text-white text-sm px-4 py-2 rounded-full"
                >
                  <benefit.icon className="w-4 h-4" />
                  <span>{t(benefit.textKey)}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <PoweredByFooter />
        </div>

        {/* Footer */}
        <div className="karta-footer-actions">
          <button
            onClick={() => navigate("/verify/terms")}
            className="karta-btn-primary"
          >
            {t('verify.privacy.button')}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default PrivacyProtection;
