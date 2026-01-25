import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { WithdrawDrawer } from "./WithdrawDrawer";

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
      <div className="px-4 mb-6">
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
          
          <Button 
            onClick={() => setWithdrawDrawerOpen(true)}
            className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <ArrowUpRight className="w-4 h-4 mr-2" />
            {t('partner.withdraw', 'Вывести')}
          </Button>
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
