import { memo } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ArrowUpRight, Wallet, CreditCard, Copy, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface WithdrawalDetails {
  id: string;
  amount: number;
  date: string;
  time: string;
  withdrawalMethod: "crypto" | "card";
  cryptoNetwork?: string;
  networkFee?: number;
  cardType?: string;
  walletAddress?: string;
  cardLast4?: string;
  cardFeePercent?: number;
  status: "completed" | "pending" | "failed";
}

interface WithdrawalDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  withdrawal: WithdrawalDetails | null;
}

export const WithdrawalDetailsDrawer = memo(({ 
  open, 
  onOpenChange, 
  withdrawal 
}: WithdrawalDetailsDrawerProps) => {
  const { t } = useTranslation();

  if (!withdrawal) return null;

  const isCrypto = withdrawal.withdrawalMethod === "crypto";
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} скопирован`);
  };

  const DetailRow = ({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-right max-w-[160px] truncate">{value}</span>
        {copyable && (
          <button 
            onClick={() => copyToClipboard(value, label)}
            className="p-0.5 hover:bg-secondary rounded-md transition-colors"
          >
            <Copy className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] flex flex-col">
        <DrawerHeader className="text-center pb-0 flex-shrink-0">
          <DrawerTitle className="sr-only">
            {t('partner.withdrawalDetails', 'Детали вывода')}
          </DrawerTitle>
        </DrawerHeader>
        
        <div className="px-4 pb-6 pt-1 space-y-4 overflow-y-auto flex-1">
          {/* Icon and Amount */}
          <div className="flex flex-col items-center text-center space-y-2">
            <motion.div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white overflow-hidden bg-blue-500"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <motion.div
                initial={{ y: 60, x: -60, opacity: 0 }}
                animate={{ y: 0, x: 0, opacity: 1 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.15, 
                  ease: [0.34, 1.56, 0.64, 1]
                }}
              >
                {isCrypto ? (
                  <Wallet className="w-8 h-8" strokeWidth={2} />
                ) : (
                  <CreditCard className="w-8 h-8" strokeWidth={2} />
                )}
              </motion.div>
            </motion.div>
            
            <div>
              <p className="text-2xl font-bold text-blue-500">
                -{Math.abs(withdrawal.amount).toFixed(2)} AED
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isCrypto 
                  ? t('partner.cryptoWithdrawal', 'Вывод на крипто кошелёк')
                  : t('partner.cardWithdrawal', 'Вывод на карту')
                }
              </p>
            </div>
            
            {/* Status badge */}
            <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
              withdrawal.status === "completed" 
                ? "bg-success/10 text-success" 
                : withdrawal.status === "pending"
                ? "bg-yellow-500/10 text-yellow-600"
                : "bg-destructive/10 text-destructive"
            }`}>
              <CheckCircle className="w-3 h-3" />
              {withdrawal.status === "completed" 
                ? t('transaction.completed', 'Завершено')
                : withdrawal.status === "pending"
                ? t('transaction.pending', 'В обработке')
                : t('transaction.failed', 'Ошибка')
              }
            </div>
          </div>
          
          {/* Details */}
          <div className="bg-muted/30 rounded-xl p-3">
            <DetailRow 
              label={t('partner.withdrawalDate', 'Дата')} 
              value={`${withdrawal.date}, ${withdrawal.time}`} 
            />
            
            {isCrypto ? (
              <>
                <DetailRow 
                  label={t('partner.network', 'Сеть')} 
                  value={withdrawal.cryptoNetwork || "TRC20"} 
                />
                {withdrawal.walletAddress && (
                  <DetailRow 
                    label={t('partner.walletAddress', 'Адрес кошелька')} 
                    value={withdrawal.walletAddress} 
                    copyable 
                  />
                )}
                <DetailRow 
                  label={t('partner.networkFee', 'Комиссия сети')} 
                  value={`${withdrawal.networkFee?.toFixed(2) || "5.90"} USDT`} 
                />
                <DetailRow 
                  label={t('partner.receivedAmount', 'Получено')} 
                  value={`${(Math.abs(withdrawal.amount) / 3.69 - (withdrawal.networkFee || 5.90)).toFixed(2)} USDT`} 
                />
              </>
            ) : (
              <>
                <DetailRow 
                  label={t('partner.cardType', 'Тип карты')} 
                  value={withdrawal.cardType || "Virtual"} 
                />
                {withdrawal.cardLast4 && (
                  <DetailRow 
                    label={t('partner.cardNumber', 'Номер карты')} 
                    value={`•••• ${withdrawal.cardLast4}`} 
                  />
                )}
                <DetailRow 
                  label={t('partner.fee', 'Комиссия')} 
                  value={`${withdrawal.cardFeePercent || 0.5}%`} 
                />
              </>
            )}
            
            <DetailRow 
              label={t('partner.withdrawalAmount', 'Сумма вывода')} 
              value={`${Math.abs(withdrawal.amount).toFixed(2)} AED`} 
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
});

WithdrawalDetailsDrawer.displayName = "WithdrawalDetailsDrawer";
