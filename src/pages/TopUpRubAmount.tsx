import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";

const EXCHANGE_RATE = 92.5; // 1 USDT = 92.5 RUB (placeholder)

const TopUpRubAmount = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [usdtAmount, setUsdtAmount] = useState("");

  const rubAmount = usdtAmount ? (parseFloat(usdtAmount) * EXCHANGE_RATE).toFixed(2) : "0.00";
  const isValid = parseFloat(usdtAmount) > 0;

  const handleContinue = () => {
    if (!isValid) return;
    navigate("/top-up/rub/payment", {
      state: { usdtAmount: parseFloat(usdtAmount), rubAmount: parseFloat(rubAmount) },
    });
  };

  const quickAmounts = [50, 100, 500, 1000];

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
            {t("topUpRub.title", "Пополнение USDT рублём")}
          </h1>
        </div>
      }
      rightAction={<LanguageSwitcher />}
    >
      <div className="px-4 py-6 space-y-6 pb-32">
        {/* Exchange rate badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
            <span className="text-sm text-muted-foreground">
              1 USDT = {EXCHANGE_RATE.toLocaleString("ru-RU")} ₽
            </span>
          </div>
        </motion.div>

        {/* You send - USDT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-2xl bg-muted/50 border border-border/50"
        >
          <p className="text-sm text-muted-foreground mb-2">
            {t("topUpRub.youBuy", "Вы покупаете")}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/80 border border-border/50">
              <div className="w-6 h-6 rounded-full bg-[#26A17B] flex items-center justify-center">
                <span className="text-white text-xs font-bold">₮</span>
              </div>
              <span className="text-sm font-medium">USDT</span>
            </div>
            <input
              type="number"
              inputMode="decimal"
              value={usdtAmount}
              onChange={(e) => setUsdtAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 text-right text-3xl font-bold bg-transparent outline-none text-[#22C55E] placeholder:text-muted-foreground/40"
            />
          </div>
        </motion.div>

        {/* You pay - RUB */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-muted/50 border border-border/50"
        >
          <p className="text-sm text-muted-foreground mb-2">
            {t("topUpRub.youPay", "Вы оплачиваете")}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/80 border border-border/50">
              <span className="text-lg">🇷🇺</span>
              <span className="text-sm font-medium">RUB</span>
            </div>
            <p className="flex-1 text-right text-3xl font-bold text-[#22C55E]">
              {parseFloat(usdtAmount) > 0
                ? parseFloat(rubAmount).toLocaleString("ru-RU", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "0.00"}
            </p>
          </div>
        </motion.div>

        {/* Quick amounts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex gap-2"
        >
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => setUsdtAmount(amount.toString())}
              className="flex-1 py-2.5 rounded-xl bg-muted/50 border border-border/50 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
            >
              {amount} USDT
            </button>
          ))}
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <div className="w-9 h-9 rounded-full bg-[#26A17B]/15 flex items-center justify-center">
              <span className="text-[#26A17B] text-sm font-bold">₮</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {t("topUpRub.network", "Сеть")}
              </p>
              <p className="text-sm font-medium">Tether (TRC20)</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <div className="w-9 h-9 rounded-full bg-[#FF6B35]/15 flex items-center justify-center">
              <span className="text-[#FF6B35] text-sm font-bold">₽</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {t("topUpRub.paymentMethod", "Способ оплаты")}
              </p>
              <p className="text-sm font-medium">
                {t("topUpRub.bankTransferRub", "Банковский перевод (RUB)")}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/30 max-w-[800px] mx-auto">
        <button
          onClick={handleContinue}
          disabled={!isValid}
          className="w-full py-4 rounded-2xl bg-[#22C55E] text-white font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
        >
          {t("common.continue", "Продолжить")}
        </button>
      </div>
    </MobileLayout>
  );
};

export default TopUpRubAmount;
