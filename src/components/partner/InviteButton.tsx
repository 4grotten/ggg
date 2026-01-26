import { memo, useState, useCallback } from "react";
import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ShareDrawer } from "./ShareDrawer";

export const InviteButton = memo(() => {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleClick = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  return (
    <>
      <div className="px-4">
        <button
          onClick={handleClick}
          className="w-full py-4 font-bold rounded-2xl relative overflow-hidden flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 dark:from-[#BFFF00] dark:to-[#7FFF00] shadow-[0_0_20px_rgba(16,185,129,0.4)] dark:shadow-[0_0_20px_rgba(127,255,0,0.5)] active:scale-[0.98] transition-transform duration-150"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          <Users className="w-5 h-5 text-white dark:text-black relative z-10" />
          <span className="text-white dark:text-black relative z-10">
            {t('partner.inviteFriendsButton', 'Пригласить друзей')}
          </span>
        </button>
      </div>
      
      <ShareDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
});

InviteButton.displayName = "InviteButton";
