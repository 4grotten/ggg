import { memo, useCallback } from "react";
import { Send, Copy, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { EASYCARD_APP_URL } from "@/config/apofiz";

const APP_LINK = EASYCARD_APP_URL;

interface ShareButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  gradient: string;
  shadowColor: string;
}

const ShareButton = memo(({ onClick, icon, gradient, shadowColor }: ShareButtonProps) => (
  <button
    onClick={onClick}
    className="relative w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden active:scale-90 transition-transform duration-150"
    style={{
      background: gradient,
      boxShadow: `0 8px 24px ${shadowColor}`,
    }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
    <span className="relative z-10">{icon}</span>
  </button>
));

ShareButton.displayName = "ShareButton";

export const ShareButtons = memo(() => {
  const { t } = useTranslation();

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(APP_LINK);
    toast.success(t('partner.linkCopied'));
  }, [t]);
  
  const handleShareTelegram = useCallback(() => {
    const text = encodeURIComponent(t('partner.shareText'));
    const url = encodeURIComponent(APP_LINK);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  }, [t]);
  
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
    <div className="px-4 mb-6">
      <p className="text-sm text-muted-foreground text-center mb-3">
        {t('partner.shareVia', 'Поделиться через')}
      </p>
      <div className="flex justify-center gap-4">
        <ShareButton
          onClick={handleShareTelegram}
          icon={<Send className="w-6 h-6 text-white" />}
          gradient="linear-gradient(135deg, #0088cc 0%, #00c6ff 100%)"
          shadowColor="rgba(0, 136, 204, 0.4)"
        />
        <ShareButton
          onClick={handleCopyLink}
          icon={<Copy className="w-6 h-6 text-white" />}
          gradient="linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"
          shadowColor="rgba(124, 58, 237, 0.4)"
        />
        <ShareButton
          onClick={handleShare}
          icon={<Share2 className="w-6 h-6 text-white" />}
          gradient="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
          shadowColor="rgba(16, 185, 129, 0.4)"
        />
      </div>
    </div>
  );
});

ShareButtons.displayName = "ShareButtons";
