import { ArrowRight, Handshake } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PartnerCardProps {
  onClick?: () => void;
}

export const PartnerCard = ({ onClick }: PartnerCardProps) => {
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-4 flex items-center justify-between group"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
          <Handshake className="w-6 h-6 text-white" />
        </div>
        <div className="text-left">
          <p className="font-bold text-lg">{t('dashboard.startEarning')}</p>
          <p className="text-sm text-white/80">{t('dashboard.becomePartner')}</p>
        </div>
      </div>
      <div className="w-10 h-10 min-w-10 min-h-10 shrink-0 rounded-full border-2 border-white/50 flex items-center justify-center group-hover:bg-white/10 transition-colors">
        <ArrowRight className="w-5 h-5 text-white" />
      </div>
    </button>
  );
};
