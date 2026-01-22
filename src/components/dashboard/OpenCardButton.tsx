import { CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface OpenCardButtonProps {
  onClick?: () => void;
}

export const OpenCardButton = ({ onClick }: OpenCardButtonProps) => {
  const { t } = useTranslation();
  
  return (
    <motion.button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-4 rounded-2xl hover:bg-primary/90 transition-all shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.01 }}
    >
      <motion.div
        animate={{
          rotate: [0, 360],
          y: [0, -4, 0, -4, 0],
          x: [0, -2, 0, 2, 0],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          repeatDelay: 1.4,
          ease: "easeInOut",
          times: [0, 0.25, 0.5, 0.75, 1],
        }}
      >
        <CreditCard className="w-5 h-5" />
      </motion.div>
      <span className="text-base">{t('dashboard.openCard')}</span>
    </motion.button>
  );
};
