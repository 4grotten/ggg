import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { CheckCircle, CreditCard, Sparkles } from "lucide-react";
import { useVerificationProgress } from "@/hooks/useVerificationProgress";
import { motion } from "framer-motion";

const VerificationSuccess = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { clearProgress } = useVerificationProgress();

  // Clear verification progress when verification is complete
  useEffect(() => {
    clearProgress();
  }, [clearProgress]);

  return (
    <MobileLayout
      showBackButton
      onBack={() => navigate("/")}
      rightAction={<LanguageSwitcher />}
    >
      <div className="flex flex-col h-[calc(100vh-56px)]">
        <div className="flex-1 overflow-y-auto px-6 py-8 pb-28 flex flex-col items-center justify-center text-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.5 }}
            className="w-24 h-24 rounded-full bg-[#34C759]/10 flex items-center justify-center mb-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", duration: 0.4 }}
            >
              <CheckCircle className="w-12 h-12 text-[#34C759]" />
            </motion.div>
          </motion.div>

          {/* Sparkles */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2 mb-4"
          >
            <Sparkles className="w-5 h-5 text-[#FFD700]" />
            <span className="text-sm font-medium text-[#FFD700]">
              {t('verify.success.congratulations')}
            </span>
            <Sparkles className="w-5 h-5 text-[#FFD700]" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-2xl font-bold mb-3"
          >
            {t('verify.success.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-muted-foreground mb-8"
          >
            {t('verify.success.description')}
          </motion.p>

          {/* Card Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="w-full max-w-[280px] aspect-[1.6/1] rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] p-5 text-white text-left shadow-xl mb-6"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="w-10 h-7 bg-white/20 rounded" />
              <span className="text-sm font-semibold">VISA</span>
            </div>
            <div className="text-sm tracking-widest mb-2">•••• •••• •••• ••••</div>
            <div className="text-xs text-white/70">Easy Card</div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-2 w-full"
          >
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
              <CheckCircle className="w-5 h-5 text-[#34C759]" />
              <span className="text-sm">{t('verify.success.feature1')}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
              <CheckCircle className="w-5 h-5 text-[#34C759]" />
              <span className="text-sm">{t('verify.success.feature2')}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
              <CheckCircle className="w-5 h-5 text-[#34C759]" />
              <span className="text-sm">{t('verify.success.feature3')}</span>
            </div>
          </motion.div>

          <PoweredByFooter />
        </div>

        {/* Button */}
        <div className="karta-footer-actions">
          <button 
            onClick={() => navigate("/open-card")} 
            className="karta-btn-primary flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            {t('verify.success.button')}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default VerificationSuccess;
