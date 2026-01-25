import { memo } from "react";
import { useTranslation } from "react-i18next";

interface ReferralBalanceProps {
  balance: number;
  invited: number;
  withdrawn: number;
}

export const ReferralBalance = memo(({ balance, invited, withdrawn }: ReferralBalanceProps) => {
  const { t } = useTranslation();

  return (
    <div className="px-4 mb-6">
      <div className="bg-card/50 backdrop-blur-xl rounded-2xl p-5 border border-border/50">
        <p className="text-sm text-muted-foreground mb-1">
          {t('partner.referralBalance', 'Реферальный счёт')}
        </p>
        <p className="text-4xl font-bold mb-4">{balance}</p>
        
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
            <p className="text-xl font-bold">{withdrawn}</p>
          </div>
        </div>
      </div>
    </div>
  );
});

ReferralBalance.displayName = "ReferralBalance";
