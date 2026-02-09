import { Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export const InstallButton = () => {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();

  if (isInstalled || !isInstallable) return null;

  return (
    <AnimatePresence>
      <motion.button
        onClick={promptInstall}
        className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Установить приложение"
      >
        <Download className="w-4 h-4 text-primary" />
      </motion.button>
    </AnimatePresence>
  );
};
