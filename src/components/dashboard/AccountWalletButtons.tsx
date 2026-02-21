import { useState } from "react";
import { Landmark, ChevronRight, Eye, EyeOff } from "lucide-react";
import { UsdtIcon, TronIcon } from "@/components/icons/CryptoIcons";
import aedCurrency from "@/assets/aed-currency.png";

interface AccountWalletButtonsProps {
  accountBalance: number;
  accountIbanLast4?: string;
  usdtBalance: number;
  onAccountClick: () => void;
  onWalletClick: () => void;
}

const formatBalance = (val: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

export const AccountWalletButtons = ({
  accountBalance,
  accountIbanLast4,
  usdtBalance,
  onAccountClick,
  onWalletClick,
}: AccountWalletButtonsProps) => {
  const [accountVisible, setAccountVisible] = useState(false);
  const [walletVisible, setWalletVisible] = useState(false);

  return (
    <div className="flex gap-3">
      {/* AED Account */}
      <div
        className="flex-1 rounded-2xl bg-secondary/50 p-4 flex flex-col gap-3 cursor-pointer group hover:bg-secondary/70 transition-colors"
        onClick={onAccountClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
              <Landmark className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Счёт</p>
              <p className="text-[10px] text-muted-foreground">
                AED{accountIbanLast4 && ` •${accountIbanLast4}`}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAccountVisible(!accountVisible);
            }}
            className="p-1.5 rounded-full hover:bg-background/50 transition-colors"
          >
            {accountVisible ? (
              <Eye className="w-4 h-4 text-muted-foreground" />
            ) : (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {accountVisible ? (
              <>
                <img src={aedCurrency} alt="AED" className="w-5 h-5 dark:invert dark:brightness-200" />
                <span className="text-lg font-bold">{formatBalance(accountBalance)}</span>
                <span className="text-xs text-muted-foreground ml-0.5">AED</span>
              </>
            ) : (
              <span className="text-lg font-bold">••••••</span>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* USDT TRC20 Wallet */}
      <div
        className="flex-1 rounded-2xl bg-secondary/50 p-4 flex flex-col gap-3 cursor-pointer group hover:bg-secondary/70 transition-colors"
        onClick={onWalletClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[hsl(160,60%,40%)]/15 flex items-center justify-center">
              <UsdtIcon size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">Кошелёк</p>
              <div className="flex items-center gap-1">
                <p className="text-[10px] text-muted-foreground">USDT</p>
                <TronIcon size={8} className="opacity-50" />
                <p className="text-[10px] text-muted-foreground">TRC20</p>
              </div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setWalletVisible(!walletVisible);
            }}
            className="p-1.5 rounded-full hover:bg-background/50 transition-colors"
          >
            {walletVisible ? (
              <Eye className="w-4 h-4 text-muted-foreground" />
            ) : (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {walletVisible ? (
              <>
                <span className="text-lg font-bold text-[#26A17B]">$</span>
                <span className="text-lg font-bold">{formatBalance(usdtBalance)}</span>
                <span className="text-xs text-muted-foreground ml-0.5">USDT</span>
              </>
            ) : (
              <span className="text-lg font-bold">••••••</span>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
