import { memo, useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const APP_LINK = "https://test.apofiz.com/EasyCard/";

interface InviteButtonProps {
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

export const InviteButton = memo(({ scrollContainerRef }: InviteButtonProps) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef?.current;
    if (!container) {
      // If no container ref, show button after a small delay
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    }

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      // Show button after scrolling 100px
      setIsVisible(scrollTop > 100);
    };

    // Initial check
    handleScroll();

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollContainerRef]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Easy Card',
          text: t('partner.shareText'),
          url: APP_LINK,
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(APP_LINK);
      toast.success(t('partner.linkCopied'));
    }
  }, [t]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/80 to-transparent pb-6 pointer-events-none"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
        >
          <motion.button
            onClick={handleShare}
            className="w-full py-4 font-bold rounded-2xl relative overflow-hidden flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 dark:from-[#BFFF00] dark:to-[#7FFF00] shadow-lg shadow-emerald-500/30 dark:shadow-[#7FFF00]/40 pointer-events-auto"
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            <Users className="w-5 h-5 text-white dark:text-black relative z-10" />
            <span className="text-white dark:text-black relative z-10">
              {t('partner.inviteFriendsButton', 'Пригласить друзей')}
            </span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

InviteButton.displayName = "InviteButton";
