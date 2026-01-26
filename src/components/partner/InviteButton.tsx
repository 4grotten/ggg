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
          {/* Energy particles flowing to center */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Left energy streams */}
            <div className="energy-particle energy-left-1" />
            <div className="energy-particle energy-left-2" />
            <div className="energy-particle energy-left-3" />
            
            {/* Right energy streams */}
            <div className="energy-particle energy-right-1" />
            <div className="energy-particle energy-right-2" />
            <div className="energy-particle energy-right-3" />
            
            {/* Bottom energy streams */}
            <div className="energy-particle energy-bottom-1" />
            <div className="energy-particle energy-bottom-2" />
            
            {/* Center glow pulse */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/30 dark:bg-white/40 blur-xl animate-energy-pulse" />
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          <Users className="w-5 h-5 text-white dark:text-black relative z-10" />
          <span className="text-white dark:text-black relative z-10">
            {t('partner.inviteFriendsButton', 'Пригласить друзей')}
          </span>
        </button>
      </div>
      
      <ShareDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      
      <style>{`
        .energy-particle {
          position: absolute;
          width: 8px;
          height: 8px;
          background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%);
          border-radius: 50%;
          filter: blur(1px);
        }
        
        .energy-left-1 {
          animation: energy-flow-left 2s ease-in-out infinite;
          animation-delay: 0s;
        }
        .energy-left-2 {
          animation: energy-flow-left 2s ease-in-out infinite;
          animation-delay: 0.4s;
        }
        .energy-left-3 {
          animation: energy-flow-left 2s ease-in-out infinite;
          animation-delay: 0.8s;
        }
        
        .energy-right-1 {
          animation: energy-flow-right 2s ease-in-out infinite;
          animation-delay: 0.2s;
        }
        .energy-right-2 {
          animation: energy-flow-right 2s ease-in-out infinite;
          animation-delay: 0.6s;
        }
        .energy-right-3 {
          animation: energy-flow-right 2s ease-in-out infinite;
          animation-delay: 1s;
        }
        
        .energy-bottom-1 {
          animation: energy-flow-bottom 2s ease-in-out infinite;
          animation-delay: 0.3s;
        }
        .energy-bottom-2 {
          animation: energy-flow-bottom 2s ease-in-out infinite;
          animation-delay: 0.7s;
        }
        
        @keyframes energy-flow-left {
          0% {
            left: 0%;
            top: 50%;
            opacity: 0;
            transform: scale(0.5);
          }
          20% {
            opacity: 1;
            transform: scale(1);
          }
          80% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            left: 50%;
            top: 50%;
            opacity: 0;
            transform: scale(0);
          }
        }
        
        @keyframes energy-flow-right {
          0% {
            right: 0%;
            left: auto;
            top: 50%;
            opacity: 0;
            transform: scale(0.5);
          }
          20% {
            opacity: 1;
            transform: scale(1);
          }
          80% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            right: 50%;
            left: auto;
            top: 50%;
            opacity: 0;
            transform: scale(0);
          }
        }
        
        @keyframes energy-flow-bottom {
          0% {
            left: 50%;
            bottom: 0%;
            top: auto;
            opacity: 0;
            transform: translateX(-50%) scale(0.5);
          }
          20% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
          80% {
            opacity: 1;
            transform: translateX(-50%) scale(1.2);
          }
          100% {
            left: 50%;
            bottom: 50%;
            top: auto;
            opacity: 0;
            transform: translateX(-50%) scale(0);
          }
        }
        
        @keyframes energy-pulse {
          0%, 100% {
            opacity: 0.3;
            transform: translate(-50%, -50%) scale(0.8);
          }
          50% {
            opacity: 0.6;
            transform: translate(-50%, -50%) scale(1.2);
          }
        }
        
        .animate-energy-pulse {
          animation: energy-pulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </>
  );
});

InviteButton.displayName = "InviteButton";
