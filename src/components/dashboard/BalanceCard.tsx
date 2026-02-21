import { Eye, EyeOff, CreditCard, Landmark } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import aedCurrency from "@/assets/aed-currency.png";
import { useScreenLockContext } from "@/contexts/ScreenLockContext";
import { DataUnlockDialog } from "@/components/settings/DataUnlockDialog";
import { Card } from "@/types/card";
import { UsdtIcon, TronIcon } from "@/components/icons/CryptoIcons";

interface BalanceCardProps {
  balance: number;
  currency?: string;
  cards?: Card[];
  usdtBalance?: number;
  accountBalance?: number;
  accountIbanLast4?: string;
}

const AnimatedNumber = ({ value, duration = 1000 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * easeOut);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return <>{formatBalance(displayValue)}</>;
};

export const BalanceCard = ({ balance, currency = "AED", cards = [], usdtBalance = 0, accountBalance = 0, accountIbanLast4 }: BalanceCardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  
  const { isHideDataEnabled, isEnabled: isScreenLockEnabled } = useScreenLockContext();

  const handleToggle = () => {
    if (!isVisible && isHideDataEnabled && isScreenLockEnabled) {
      setShowUnlockDialog(true);
    } else {
      if (!isVisible) {
        setAnimationKey(prev => prev + 1);
      }
      setIsVisible(!isVisible);
    }
  };

  const handleUnlockSuccess = () => {
    setAnimationKey(prev => prev + 1);
    setIsVisible(true);
  };

  return (
    <>
      <div className="space-y-3">
        {/* Per-card balances */}
        {cards.length > 0 && (
          <div className="flex gap-3">
            {cards.map((card) => (
              <div key={card.id} className="flex-1 rounded-xl bg-secondary/50 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {card.name}{card.lastFourDigits && <span className="ml-1 opacity-60">•{card.lastFourDigits}</span>}
                  </p>
                </div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={isVisible ? `visible-${card.id}` : `hidden-${card.id}`}
                    className="text-sm font-semibold flex items-center gap-1"
                    initial={{ opacity: 0, filter: "blur(6px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(6px)" }}
                    transition={{ duration: 0.3 }}
                  >
                    {isVisible ? (
                      <>
                        <img src={aedCurrency} alt="AED" className="w-4 h-4 dark:invert dark:brightness-200" />
                        <AnimatedNumber key={`${animationKey}-${card.id}`} value={card.balance} duration={800} />
                      </>
                    ) : "••••••"}
                  </motion.span>
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}

        {/* AED Account Balance */}
        <div className="rounded-xl bg-secondary/50 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Landmark className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              AED Account{accountIbanLast4 && <span className="ml-1 opacity-60">•{accountIbanLast4}</span>}
            </p>
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={isVisible ? "aed-visible" : "aed-hidden"}
              className="text-sm font-semibold flex items-center gap-1"
              initial={{ opacity: 0, filter: "blur(6px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.3 }}
            >
              {isVisible ? (
                <>
                  <img src={aedCurrency} alt="AED" className="w-4 h-4 dark:invert dark:brightness-200" />
                  <AnimatedNumber key={`${animationKey}-aed-account`} value={accountBalance} duration={800} />
                  <span className="text-xs text-muted-foreground ml-1">AED</span>
                </>
              ) : "••••••"}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* USDT TRC20 Balance */}
        <div className="rounded-xl bg-secondary/50 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <UsdtIcon size={14} />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              USDT TRC20<span className="ml-1 opacity-60">•TRC20</span>
            </p>
            <TronIcon size={10} className="opacity-50" />
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={isVisible ? "usdt-visible" : "usdt-hidden"}
              className="text-sm font-semibold flex items-center gap-1"
              initial={{ opacity: 0, filter: "blur(6px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.3 }}
            >
              {isVisible ? (
                <>
                  <span className="text-[#26A17B]">$</span>
                  <AnimatedNumber key={`${animationKey}-usdt`} value={usdtBalance} duration={800} />
                  <span className="text-xs text-muted-foreground ml-1">USDT</span>
                </>
              ) : "••••••"}
            </motion.span>
          </AnimatePresence>
        </div>



        {/* Total balance */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Total Balance ({currency})
            </p>
            <div className="flex items-center gap-3">
              <AnimatePresence mode="wait">
                <motion.span 
                  key={isVisible ? "visible" : "hidden"}
                  className="text-4xl font-bold tracking-tight flex items-center gap-2"
                  initial={{ opacity: 0, filter: "blur(10px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(10px)" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {isVisible ? (
                    <>
                      <img src={aedCurrency} alt="AED" className="w-9 h-9 dark:invert dark:brightness-200" />
                      <AnimatedNumber key={animationKey} value={balance} duration={800} /> AED
                    </>
                  ) : "••••••"}
                </motion.span>
              </AnimatePresence>
              <button
                onClick={handleToggle}
                className="p-1.5 rounded-full hover:bg-secondary transition-colors"
                aria-label={isVisible ? "Hide balance" : "Show balance"}
              >
                {isVisible ? (
                  <Eye className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <EyeOff className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <DataUnlockDialog
        isOpen={showUnlockDialog}
        onClose={() => setShowUnlockDialog(false)}
        onSuccess={handleUnlockSuccess}
      />
    </>
  );
};
