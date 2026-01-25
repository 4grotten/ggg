import { memo, useCallback } from "react";
import { Send, Copy, Share2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
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
}

const ShareButton = memo(({ onClick, icon, label, gradient, shadowColor }: ShareButtonProps) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 active:scale-90 transition-transform duration-150"
  >
    <div
      className="relative w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden"
      style={{
        background: gradient,
        boxShadow: `0 8px 24px ${shadowColor}`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      <span className="relative z-10">{icon}</span>
    </div>
    <span className="text-xs text-muted-foreground">{label}</span>
  </button>
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
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="relative pb-2">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
          <DrawerTitle className="text-center text-lg font-semibold">
            {t('partner.shareTitle', 'Пригласить друзей')}
          </DrawerTitle>
        </DrawerHeader>
        
        <div className="px-6 pb-8">
          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-3xl shadow-lg">
              <QRCodeSVG
                value={APP_LINK}
                size={180}
                level="H"
                includeMargin={false}
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>
          </div>
          
          {/* Scan instruction */}
          <p className="text-center text-sm text-muted-foreground mb-6">
            {t('partner.scanQR', 'Отсканируйте QR-код для перехода')}
          </p>
          
          {/* Share buttons */}
          <p className="text-sm text-muted-foreground text-center mb-4">
            {t('partner.shareVia', 'Поделиться через')}
          </p>
          <div className="flex justify-center gap-6">
            <ShareButton
              onClick={handleShareTelegram}
              icon={<Send className="w-6 h-6 text-white" />}
              label="Telegram"
              gradient="linear-gradient(135deg, #0088cc 0%, #00c6ff 100%)"
              shadowColor="rgba(0, 136, 204, 0.4)"
            />
            <ShareButton
              onClick={handleCopyLink}
              icon={<Copy className="w-6 h-6 text-white" />}
              label={t('partner.copyLink', 'Копировать')}
              gradient="linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"
              shadowColor="rgba(124, 58, 237, 0.4)"
            />
            <ShareButton
              onClick={handleShare}
              icon={<Share2 className="w-6 h-6 text-white" />}
              label={t('partner.share', 'Ещё')}
              gradient="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
              shadowColor="rgba(16, 185, 129, 0.4)"
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
});

ShareDrawer.displayName = "ShareDrawer";
