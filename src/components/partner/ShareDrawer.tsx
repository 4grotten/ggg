import { memo, useCallback } from "react";
import { Send, Copy, Share2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

const APP_LINK = "https://test.apofiz.com/EasyCard/";

interface ShareDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShareButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  gradient: string;
  shadowColor: string;
  delay: number;
}

const ShareButton = memo(({ onClick, icon, label, gradient, shadowColor, delay }: ShareButtonProps) => (
  <motion.button
    onClick={onClick}
    initial={{ opacity: 0, y: 30, scale: 0.8 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ 
      delay: 0.5 + delay, 
      duration: 0.4, 
      type: "spring", 
      stiffness: 300,
      damping: 20 
    }}
    whileHover={{ scale: 1.1, y: -5 }}
    whileTap={{ scale: 0.9 }}
    className="flex flex-col items-center gap-2"
  >
    <motion.div
      className="relative w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden"
      style={{
        background: gradient,
        boxShadow: `0 8px 24px ${shadowColor}`,
      }}
      animate={{
        boxShadow: [
          `0 8px 24px ${shadowColor}`,
          `0 12px 32px ${shadowColor}`,
          `0 8px 24px ${shadowColor}`,
        ]
      }}
      transition={{ repeat: Infinity, duration: 2, delay: delay * 0.2 }}
    >
      {/* Shimmer effect */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{ repeat: Infinity, duration: 2, delay: 1 + delay * 0.3, ease: "easeInOut" }}
      />
      <span className="relative z-10">{icon}</span>
    </motion.div>
    <span className="text-xs text-muted-foreground">{label}</span>
  </motion.button>
));

ShareButton.displayName = "ShareButton";

export const ShareDrawer = memo(({ open, onOpenChange }: ShareDrawerProps) => {
  const { t } = useTranslation();

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(APP_LINK);
    toast.success(t('partner.linkCopied', 'Ссылка скопирована'));
    onOpenChange(false);
  }, [t, onOpenChange]);
  
  const handleShareTelegram = useCallback(() => {
    const text = encodeURIComponent(t('partner.shareText', 'Присоединяйся к Easy Card!'));
    const url = encodeURIComponent(APP_LINK);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  }, [t]);
  
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Easy Card',
          text: t('partner.shareText', 'Присоединяйся к Easy Card!'),
          url: APP_LINK,
        });
        onOpenChange(false);
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(APP_LINK);
      toast.success(t('partner.linkCopied', 'Ссылка скопирована'));
      onOpenChange(false);
    }
  }, [t, onOpenChange]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-32 h-32 rounded-full"
              style={{
                background: `radial-gradient(circle, ${
                  i % 3 === 0 ? 'rgba(16, 185, 129, 0.15)' : 
                  i % 3 === 1 ? 'rgba(124, 58, 237, 0.15)' : 
                  'rgba(59, 130, 246, 0.15)'
                } 0%, transparent 70%)`,
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 2) * 40}%`,
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
                x: [0, 20, 0],
                y: [0, -15, 0],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <DrawerHeader className="relative pb-2">
          <motion.button
            onClick={() => onOpenChange(false)}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
            whileHover={{ rotate: 90, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center z-10"
          >
            <X className="w-4 h-4" />
          </motion.button>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <DrawerTitle className="text-center text-lg font-semibold">
              {t('partner.shareTitle', 'Пригласить друзей')}
            </DrawerTitle>
          </motion.div>
        </DrawerHeader>
        
        <div className="px-6 pb-8 relative z-10">
          {/* QR Code with fantastic entrance */}
          <motion.div 
            className="flex justify-center mb-6"
            initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ 
              delay: 0.2, 
              duration: 0.6, 
              type: "spring", 
              stiffness: 200 
            }}
          >
            <motion.div 
              className="relative bg-white p-4 rounded-3xl"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(16, 185, 129, 0.3), 0 0 40px rgba(124, 58, 237, 0.2)",
                  "0 0 30px rgba(124, 58, 237, 0.4), 0 0 60px rgba(59, 130, 246, 0.3)",
                  "0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(16, 185, 129, 0.2)",
                  "0 0 20px rgba(16, 185, 129, 0.3), 0 0 40px rgba(124, 58, 237, 0.2)",
                ]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Rotating border glow */}
              <motion.div
                className="absolute -inset-1 rounded-[28px] opacity-60"
                style={{
                  background: "conic-gradient(from 0deg, #10b981, #7c3aed, #3b82f6, #10b981)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Inner container */}
              <div className="relative bg-white p-4 rounded-3xl">
                <QRCodeSVG
                  value={APP_LINK}
                  size={180}
                  level="H"
                  includeMargin={false}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
            </motion.div>
          </motion.div>
          
          {/* Scan instruction with typewriter-like appearance */}
          <motion.p 
            className="text-center text-sm text-muted-foreground mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            {t('partner.scanQR', 'Отсканируйте QR-код для перехода')}
          </motion.p>
          
          {/* Share via label */}
          <motion.p 
            className="text-sm text-muted-foreground text-center mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.3 }}
          >
            {t('partner.shareVia', 'Поделиться через')}
          </motion.p>
          
          {/* Share buttons with staggered entrance */}
          <div className="flex justify-center gap-6">
            <ShareButton
              onClick={handleShareTelegram}
              icon={<Send className="w-6 h-6 text-white" />}
              label="Telegram"
              gradient="linear-gradient(135deg, #0088cc 0%, #00c6ff 100%)"
              shadowColor="rgba(0, 136, 204, 0.4)"
              delay={0}
            />
            <ShareButton
              onClick={handleCopyLink}
              icon={<Copy className="w-6 h-6 text-white" />}
              label={t('partner.copyLink', 'Копировать')}
              gradient="linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"
              shadowColor="rgba(124, 58, 237, 0.4)"
              delay={0.1}
            />
            <ShareButton
              onClick={handleShare}
              icon={<Share2 className="w-6 h-6 text-white" />}
              label={t('partner.share', 'Ещё')}
              gradient="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
              shadowColor="rgba(16, 185, 129, 0.4)"
              delay={0.2}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
});

ShareDrawer.displayName = "ShareDrawer";
