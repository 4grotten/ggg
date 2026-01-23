import { Shield, CreditCard, Wallet, LockKeyhole, LockKeyholeOpen, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const PrivacyProtection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLocked(true);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const benefits = [
    { icon: Shield, textKey: "verify.privacy.benefit1", color: "#10B981", bgColor: "#10B981" },
    { icon: CreditCard, textKey: "verify.privacy.benefit2", color: "#0EA5E9", bgColor: "#0EA5E9" },
    { icon: Wallet, textKey: "verify.privacy.benefit3", color: "#F59E0B", bgColor: "#F59E0B" },
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

            {/* Benefits - Clean Modern Style */}
            <div className="w-full space-y-4 mt-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.15, duration: 0.4, ease: "easeOut" }}
                  className="flex items-center gap-3"
                >
                  <motion.div 
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${benefit.bgColor}20` }}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.6 + index * 0.15, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <benefit.icon className="w-4 h-4" style={{ color: benefit.color }} strokeWidth={2} />
                  </motion.div>
                  <motion.span 
                    className="text-[15px] text-foreground text-left"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 + index * 0.15, duration: 0.3 }}
                  >
                    {t(benefit.textKey)}
                  </motion.span>
                  <motion.div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ml-auto"
                    style={{ backgroundColor: "#10B98120" }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.0 + index * 0.2, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={3} />
                  </motion.div>
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
