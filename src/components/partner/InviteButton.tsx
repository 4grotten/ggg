import { memo, useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const APP_LINK = "https://test.apofiz.com/EasyCard/";

interface InviteButtonProps {
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export const InviteButton = memo(({ scrollContainerRef }: InviteButtonProps) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);

  useEffect(() => {
    const container = scrollContainerRef?.current;
   if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollingDown = scrollTop > lastScrollTop;
      
     if (scrollingDown && scrollTop > 100) {
       // Scrolling down and past 100px - show button
       setIsVisible(true);
     } else if (!scrollingDown) {
       // Scrolling up - hide button
        setIsVisible(false);
      }
      
      setLastScrollTop(scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [scrollContainerRef, lastScrollTop]);

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
          className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/80 to-transparent pb-6 pointer-events-none max-w-[800px] mx-auto"
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
