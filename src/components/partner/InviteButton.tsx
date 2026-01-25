import { memo, useCallback } from "react";
import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const APP_LINK = "https://test.apofiz.com/EasyCard/";

export const InviteButton = memo(() => {
  const { t } = useTranslation();

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
    <div className="px-4 py-2">
      <button
        onClick={handleShare}
        className="w-full py-4 font-bold rounded-2xl relative overflow-hidden flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 dark:from-[#BFFF00] dark:to-[#7FFF00] shadow-lg shadow-emerald-500/30 dark:shadow-[#7FFF00]/40 active:scale-[0.98] transition-transform duration-150"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        <Users className="w-5 h-5 text-white dark:text-black relative z-10" />
        <span className="text-white dark:text-black relative z-10">
          {t('partner.inviteFriendsButton', 'Пригласить друзей')}
        </span>
      </button>
    </div>
  );
});

InviteButton.displayName = "InviteButton";
