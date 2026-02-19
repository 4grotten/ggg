import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Wallet, ChevronRight, ArrowRightLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { CardMiniature } from "@/components/dashboard/CardMiniature";
import { useSettings } from "@/contexts/SettingsContext";
import { UsdtIcon } from "@/components/icons/CryptoIcons";

type Destination = "card" | "account";

const USDT_BALANCE = 112000;

const TopUpFromUsdtBalance = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const settings = useSettings();

  const [destination, setDestination] = useState<Destination | null>(null);
  const [amount, setAmount] = useState("");

  const amountNum = parseFloat(amount) || 0;

  const calculation = useMemo(() => {
    if (amountNum <= 0) return null;

    const networkFee = settings.TOP_UP_CRYPTO_FEE;
    const rate = settings.USDT_TO_AED_BUY;
    const totalUsdt = amountNum + networkFee;
    const receiveAed = amountNum * rate;

    return {
      amountUsdt: amountNum,
      networkFee,
      totalUsdt,
      rate,
      receiveAed,
      insufficientBalance: totalUsdt > USDT_BALANCE,
    };
  }, [amountNum, settings]);

  const quickAmounts = [10, 25, 50, 100];

  const handleConfirm = () => {
    if (!calculation || calculation.insufficientBalance) return;
    toast.success(t("topUpUsdt.transferInitiated", "Перевод инициирован"));
    navigate("/");
  };

  return (
    <MobileLayout
      header={
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">
            {t("topUpUsdt.title", "Пополнение с USDT")}
          </h1>
        </div>
      }
      rightAction={<LanguageSwitcher />}
    >
      <div className="px-4 py-6 space-y-4 pb-32">
        {/* Available USDT Balance */}
        <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <UsdtIcon size={16} />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {t("topUpUsdt.availableBalance", "Доступный баланс")}
            </p>
          </div>
          <p className="text-2xl font-bold">
            <span className="text-[#26A17B]">$</span>
            {USDT_BALANCE.toFixed(2)}{" "}
            <span className="text-sm text-muted-foreground">USDT</span>
          </p>
        </div>

        {/* Destination selector */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground px-1">
            {t("topUpUsdt.selectDestination", "Куда перевести")}
          </p>
          <div className="bg-muted/50 rounded-xl overflow-hidden border border-border/50">
            <button
              onClick={() => setDestination("card")}
              className={`w-full flex items-center gap-3 px-4 py-4 transition-colors border-b border-border/50 ${
                destination === "card"
                  ? "bg-primary/10"
                  : "hover:bg-muted/80"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  destination === "card"
                    ? "bg-primary"
                    : "bg-muted"
                }`}
              >
                <CreditCard
                  className={`w-5 h-5 ${
                    destination === "card"
                      ? "text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                />
              </div>
              <div className="flex-1 text-left">
                <p className="text-base font-medium text-foreground">
                  {t("topUpUsdt.toCard", "На карту")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("topUpUsdt.toCardDesc", "Пополнить баланс карты")}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
            </button>

            <button
              onClick={() => setDestination("account")}
              className={`w-full flex items-center gap-3 px-4 py-4 transition-colors ${
                destination === "account"
                  ? "bg-primary/10"
                  : "hover:bg-muted/80"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  destination === "account"
                    ? "bg-primary"
                    : "bg-muted"
                }`}
              >
                <Wallet
                  className={`w-5 h-5 ${
                    destination === "account"
                      ? "text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                />
              </div>
              <div className="flex-1 text-left">
                <p className="text-base font-medium text-foreground">
                  {t("topUpUsdt.toAccount", "На счёт")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("topUpUsdt.toAccountDesc", "Зачислить на основной счёт")}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
            </button>
          </div>
        </div>

        {/* Amount input */}
        <AnimatePresence>
          {destination && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("topUpUsdt.enterAmount", "Сумма перевода (USDT)")}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl text-[#26A17B] font-bold">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 text-2xl font-bold bg-transparent outline-none text-foreground placeholder:text-muted-foreground/40"
                  />
                  <span className="text-sm text-muted-foreground">USDT</span>
                </div>

                {/* Quick amounts */}
                <div className="flex gap-2">
                  {quickAmounts.map((qa) => (
                    <button
                      key={qa}
                      onClick={() => setAmount(qa.toString())}
                      className="flex-1 py-2 rounded-xl text-sm font-medium bg-secondary/80 hover:bg-secondary transition-colors text-foreground"
                    >
                      {qa}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculation */}
              {calculation && amountNum > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowRightLeft className="w-4 h-4 text-primary" />
                    <p className="text-sm font-semibold">
                      {t("topUpUsdt.calculation", "Калькуляция")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("topUpUsdt.transferAmount", "Сумма перевода")}
                      </span>
                      <span className="font-medium">
                        {calculation.amountUsdt.toFixed(2)} USDT
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("topUpUsdt.exchangeRate", "Курс обмена")}
                      </span>
                      <span className="font-medium">
                        1 USDT = {calculation.rate} AED
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("topUpUsdt.networkFee", "Сбор сети")}
                      </span>
                      <span className="font-medium">
                        {calculation.networkFee.toFixed(2)} USDT
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                      <span className="text-muted-foreground">
                        {t("topUpUsdt.totalDeducted", "Итого списано")}
                      </span>
                      <span className="font-semibold">
                        {calculation.totalUsdt.toFixed(2)} USDT
                      </span>
                    </div>
                    <div className="flex justify-between text-base pt-2 border-t border-border/50">
                      <span className="font-semibold">
                        {t("topUpUsdt.youReceive", "Вы получите")}
                      </span>
                      <span className="font-bold text-primary">
                        {calculation.receiveAed.toFixed(2)} AED
                      </span>
                    </div>
                  </div>

                  {calculation.insufficientBalance && (
                    <p className="text-xs text-destructive text-center pt-1">
                      {t(
                        "topUpUsdt.insufficientBalance",
                        "Недостаточно средств на USDT балансе"
                      )}
                    </p>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed Bottom Button */}
      {destination && amountNum > 0 && calculation && (
        <div className="fixed bottom-0 left-0 right-0 p-4 max-w-[800px] mx-auto">
          <button
            onClick={handleConfirm}
            disabled={calculation.insufficientBalance}
            className="w-full py-4 rounded-2xl font-semibold text-base transition-all backdrop-blur-2xl disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-primary-foreground active:scale-[0.98]"
          >
            {t("topUpUsdt.confirm", "Подтвердить перевод")}
          </button>
        </div>
      )}
    </MobileLayout>
  );
};

export default TopUpFromUsdtBalance;
