import { ArrowRight, Handshake } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PartnerCardProps {
  onClick?: () => void;
}

export const PartnerCard = ({ onClick }: PartnerCardProps) => {
  const { t } = useTranslation();

  return (
    <div className="relative rounded-2xl p-[3px] overflow-hidden">
      {/* Animated rainbow border */}
      <div 
        className="absolute inset-0 rounded-2xl"
        style={{
          background: "linear-gradient(90deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000)",
          backgroundSize: "400% 100%",
          animation: "rainbow-border 3s linear infinite",
        }}
      />
      
      {/* Inner button */}
      <button
        onClick={onClick}
        className="relative w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-[13px] p-4 flex items-center justify-between group"
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
      
      {/* CSS Animation */}
      <style>{`
        @keyframes rainbow-border {
          0% { background-position: 0% 50%; }
          100% { background-position: 400% 50%; }
        }
      `}</style>
    </div>
  );
};
