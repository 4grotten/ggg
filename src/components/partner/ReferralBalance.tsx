import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { WithdrawDrawer } from "./WithdrawDrawer";
import { motion } from "framer-motion";

interface ReferralBalanceProps {
  balance: number;
  invited: number;
  withdrawn: number;
}

export const ReferralBalance = memo(({ balance, invited, withdrawn }: ReferralBalanceProps) => {
  const { t } = useTranslation();
  const [withdrawDrawerOpen, setWithdrawDrawerOpen] = useState(false);

  return (
    <>
      <div className="px-4">
        <div className="bg-muted/70 dark:bg-card/70 backdrop-blur-xl rounded-2xl p-5 border border-border/50">
          <p className="text-sm text-muted-foreground mb-1">
            {t('partner.referralBalance', 'Реферальный счёт')}
          </p>
          <p className="text-4xl font-bold mb-4">
            {balance.toFixed(2)} <span className="text-lg font-medium text-muted-foreground">AED</span>
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
            <div>
              <p className="text-xs text-muted-foreground">
                {t('partner.invited', 'Приглашено')}
              </p>
              <p className="text-xl font-bold">{invited}</p>
            </div>
            <div className="border-l border-border/50 pl-4">
              <p className="text-xs text-muted-foreground">
                {t('partner.withdrawn', 'Выведено')}
              </p>
              <p className="text-xl font-bold">{withdrawn.toFixed(2)} AED</p>
            </div>
          </div>
          
          <button 
            onClick={() => setWithdrawDrawerOpen(true)}
            className="relative w-full mt-4 py-4 rounded-xl font-semibold text-white overflow-hidden group active:scale-[0.98] transition-transform"
            style={{
              background: "linear-gradient(135deg, #0066FF 0%, #0099FF 50%, #00CCFF 100%)",
            }}
          >
            {/* Animated shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            {/* Rotating conic glow */}
            <div 
              className="absolute -inset-1 rounded-xl opacity-50 blur-md animate-spin-slow -z-10"
              style={{
                background: "conic-gradient(from 0deg, #0066FF, #0099FF, #00CCFF, #0066FF)",
              }}
            />
            
            <div className="relative flex items-center justify-center gap-2">
              <span className="text-base">{t('partner.withdraw', 'Вывести')}</span>
              <motion.div
                animate={{ 
                  x: [0, 4, 0],
                  y: [0, -4, 0],
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <ArrowUpRight className="w-5 h-5" />
              </motion.div>
            </div>
          </button>
        </div>
      </div>

      <WithdrawDrawer 
        open={withdrawDrawerOpen} 
        onOpenChange={setWithdrawDrawerOpen}
        balance={balance}
      />
    </>
  );
});

ReferralBalance.displayName = "ReferralBalance";
