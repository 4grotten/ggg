import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

interface PartnerCardProps {
  onClick?: () => void;
}

// Animated handshake with two hands coming together
const AnimatedHandshake = () => {
  return (
    <div className="relative w-6 h-6 flex items-center justify-center">
      {/* Left hand */}
      <motion.svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute text-white"
        initial={{ x: -20, opacity: 0, rotate: -30 }}
        animate={{ x: -2, opacity: 1, rotate: 0 }}
        transition={{ 
          delay: 0.5, 
          duration: 0.5, 
          type: "spring",
          stiffness: 150
        }}
      >
        <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
        <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
        <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
      </motion.svg>
      
      {/* Right hand (mirrored) */}
      <motion.svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute text-white"
        style={{ transform: "scaleX(-1)" }}
        initial={{ x: 20, opacity: 0, rotate: 30 }}
        animate={{ x: 2, opacity: 1, rotate: 0 }}
        transition={{ 
          delay: 0.6, 
          duration: 0.5, 
          type: "spring",
          stiffness: 150
        }}
      >
        <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
        <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
        <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
      </motion.svg>
      
      {/* Shake effect after hands meet */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.3, 1] }}
        transition={{ delay: 1.1, duration: 0.3 }}
      >
        <motion.div
          animate={{ rotate: [0, -8, 8, -5, 5, 0] }}
          transition={{ delay: 1.3, duration: 0.5, ease: "easeInOut" }}
          className="w-full h-full flex items-center justify-center"
        >
          {/* Sparkle effects */}
          <motion.div
            className="absolute"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            <div className="absolute -top-2 -left-1 w-1.5 h-1.5 bg-yellow-300 rounded-full" />
            <div className="absolute -top-1 left-3 w-1 h-1 bg-pink-300 rounded-full" />
            <div className="absolute top-2 -right-2 w-1.5 h-1.5 bg-cyan-300 rounded-full" />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export const PartnerCard = ({ onClick }: PartnerCardProps) => {
  const { t } = useTranslation();

  return (
    <div className="relative rounded-2xl p-[1.5px] overflow-hidden">
      {/* Animated rainbow border with glow */}
      <div 
        className="absolute inset-0 rounded-2xl blur-[1px]"
        style={{
          background: "conic-gradient(from 0deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b)",
          animation: "spin-slow 8s linear infinite",
        }}
      />
      
      {/* Glow effect layer */}
      <div 
        className="absolute inset-[-2px] rounded-2xl opacity-40 blur-md"
        style={{
          background: "conic-gradient(from 0deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b)",
          animation: "spin-slow 8s linear infinite",
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
            <AnimatedHandshake />
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
      
      {/* CSS Animation */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
