import { ArrowRight, Handshake } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

interface PartnerCardProps {
  onClick?: () => void;
}

export const PartnerCard = ({ onClick }: PartnerCardProps) => {
  const { t } = useTranslation();

  return (
    <div className="relative rounded-2xl p-[2px] overflow-hidden">
      {/* Animated rainbow border with glow */}
      <div 
        className="absolute inset-0 rounded-2xl blur-[1px] animate-spin-slow"
        style={{
          background: "conic-gradient(from 0deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b)",
        }}
      />
      
      {/* Glow effect layer */}
      <div 
        className="absolute inset-[-4px] rounded-2xl opacity-40 blur-md animate-spin-slow"
        style={{
          background: "conic-gradient(from 0deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b)",
        }}
      />
      
      {/* Inner button */}
      <button
        onClick={onClick}
        className="relative w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-[14px] p-4 flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(255,107,107,0.3), rgba(84,160,255,0.3))",
              backdropFilter: "blur(8px)",
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15,
              delay: 0.3 
            }}
          >
            <Handshake className="w-6 h-6 text-white" />
          </motion.div>
          <div className="text-left">
            <p className="font-bold text-lg bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
              {t('dashboard.startEarning')}
            </p>
            <p className="text-sm text-white/70">{t('dashboard.becomePartner')}</p>
          </div>
        </div>
        <div className="w-10 h-10 min-w-10 min-h-10 shrink-0 rounded-full border border-white/30 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/50 transition-all duration-300">
          <ArrowRight className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
        </div>
      </button>
    </div>
  );
};
